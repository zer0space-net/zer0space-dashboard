"""Reverse proxy for the zer0space Music gateway.

zer0space Music (https://github.com/zer0space-net/zer0space-music) is the
homelab's music player. Like Crimson it has no login of its own: this dashboard
gates ``/music`` on the zer0space session and reverse-proxies it —

    /music, /music/<path>   -> MUSIC_URL

— so a signed-in zer0space user reaches it at the same origin and nobody else
does. The gate itself lives in main.py; this module only forwards.

Three differences from :mod:`src.crimson`, all deliberate:

* **One upstream, not two.** Music serves its own UI and API from a single
  service, so there is no SPA/API split to route between.
* **Identity is injected, always.** Crimson has its own accounts and an SSO
  broker; Music has neither. It trusts ``X-Zer0space-User``, and only when the
  shared service token is presented with it — so this module sets both on every
  forwarded request, and strips any copy the client tried to supply.
* **Range requests pass through in both directions.** ``/music/media/<ticket>``
  is an audio stream, and a phone's ``<audio>`` element negotiates byte ranges
  to seek. Dropping ``Range`` on the way up, or ``Content-Range`` on the way
  back, produces audio that plays from the start and cannot be scrubbed.

Unlike Crimson, media bytes DO flow through this hop (the user chose the tunnel
path for audio, which is ~1/50 of video's bitrate). Point the music service's
``MUSIC_MEDIA_BASE_URL`` at a direct host to change that without touching this
file.
"""

from __future__ import annotations

from typing import AsyncIterator
from urllib.parse import urlsplit

import httpx
from fastapi import Request
from fastapi.responses import JSONResponse, Response, StreamingResponse

from . import config


def bad_gateway(err: Exception) -> JSONResponse:
    """Clean 502 when the music service can't be reached, instead of a bare 500."""
    print(f"[music] upstream unreachable: {err!r}")
    return JSONResponse(
        {
            "error": "Music is temporarily unreachable — the service may still "
            "be starting.",
            "code": "MUSIC_UNREACHABLE",
        },
        status_code=502,
    )


_client: httpx.AsyncClient | None = None


def client() -> httpx.AsyncClient:
    global _client
    if _client is None:
        _client = httpx.AsyncClient(
            # No read timeout: an audio response is a long-lived byte stream and
            # can legitimately stall while the phone's buffer is full. Connect,
            # write and pool stay bounded so a dead upstream fails fast.
            timeout=httpx.Timeout(connect=10.0, read=None, write=30.0, pool=10.0),
            limits=httpx.Limits(max_connections=64, max_keepalive_connections=24),
            follow_redirects=False,
        )
    return _client


async def close() -> None:
    global _client
    if _client is not None:
        await _client.aclose()
    _client = None


# The music app loads cover art from Deezer's CDN and streams audio from this
# origin. Deliberately looser than the dashboard's own CSP and scoped to the
# proxied /music responses only, so the append-only SecurityHeadersMiddleware
# leaves it alone.
MUSIC_CSP = "; ".join(
    [
        "default-src 'self'",
        "base-uri 'self'",
        "script-src 'self'",
        "style-src 'self' 'unsafe-inline'",
        # Deezer serves covers from cdn-images.dzcdn.net and e-cdns-images.*
        "img-src 'self' data: blob: https:",
        # Audio is same-origin (the relay), but blob: keeps a future local
        # decode path open without another CSP edit.
        "media-src 'self' blob:",
        "font-src 'self' data:",
        "connect-src 'self'",
        "worker-src 'self' blob:",
        "manifest-src 'self'",
        "object-src 'none'",
        "frame-ancestors 'none'",
    ]
)

# Never copied through in either direction — connection-scoped or recomputed.
_HOP_BY_HOP = {
    "connection",
    "keep-alive",
    "proxy-authenticate",
    "proxy-connection",
    "te",
    "trailer",
    "transfer-encoding",
    "upgrade",
    "content-encoding",
    "content-length",
    "host",
}

# Forwarded headers we recompute ourselves — drop any the client set so the
# upstream cannot see a spoofed value, and so we never emit the same header
# twice in different letter-casing.
_MANAGED_FORWARDED = {
    "x-forwarded-proto",
    "x-forwarded-host",
    "x-forwarded-prefix",
}


class UnsafePath(ValueError):
    """A subpath tried to escape the upstream mount point with ``..``."""


def _client_strip_set() -> set[str]:
    """Header names a client may never supply to the upstream, lower-cased.

    ``authorization`` and the identity header are in here **unconditionally**.
    Both name who the caller is and the music service trusts them, so a
    client-supplied copy is an identity claim rather than a preference — and
    leaving one through is how a viewer reaches another user's playlists.
    """
    names = set(_HOP_BY_HOP) | set(_MANAGED_FORWARDED)
    # This hop's secret. The music service authenticates by its own token and
    # must never see the zer0space session cookie.
    names.add("cookie")
    # Ask upstream for identity encoding so audio bytes stream through
    # unmodified — a re-encoded body would break Range byte offsets.
    names.add("accept-encoding")
    names.add("authorization")
    for header in (config.MUSIC_USER_HEADER, config.MUSIC_USER_NAME_HEADER):
        if header:
            names.add(header.lower())
    return names


def _forwarded_origin(request: Request) -> tuple[str, str]:
    """The (scheme, host) the music service should believe it is reachable at.

    Prefers PUBLIC_BASE_URL, because ``Host`` and ``X-Forwarded-Proto`` are both
    client-controlled on any request that did not come through the tunnel, and
    the music service turns these into the absolute stream URL it hands the
    ``<audio>`` element. Configuration is the only source an attacker cannot set.
    """
    if config.PUBLIC_BASE_URL:
        parsed = urlsplit(config.PUBLIC_BASE_URL)
        if parsed.scheme and parsed.netloc:
            return parsed.scheme, parsed.netloc
    proto = request.headers.get("x-forwarded-proto", request.url.scheme)
    host = request.headers.get("host") or request.url.netloc
    return proto.split(",")[0].strip(), host


def build_request_headers(request: Request, *, user: str, username: str = "") -> dict[str, str]:
    # Keys are lower-cased on the way in. HTTP header names are case-insensitive
    # but a dict is not, so mixing casings would let a client-supplied
    # ``x-zer0space-user`` survive alongside the gateway's own and both go out.
    strip = _client_strip_set()
    out: dict[str, str] = {}
    for key, value in request.headers.items():
        lk = key.lower()
        if lk in strip:
            continue
        out[lk] = value

    proto, host = _forwarded_origin(request)
    out["x-forwarded-proto"] = proto
    out["x-forwarded-host"] = host
    # Carries the mount so the stream URLs and the PWA manifest the service
    # emits include ``/music``. Without it an installed player opens the
    # dashboard root, and the <audio> src points at a path that does not exist.
    out["x-forwarded-prefix"] = config.MUSIC_PATH

    # The two locks, always set together. The service accepts the identity only
    # when the token is valid.
    if config.MUSIC_SERVICE_TOKEN:
        out["authorization"] = f"Bearer {config.MUSIC_SERVICE_TOKEN}"
    out[config.MUSIC_USER_HEADER.lower()] = user
    if username and config.MUSIC_USER_NAME_HEADER:
        out[config.MUSIC_USER_NAME_HEADER.lower()] = username
    return out


# Relayed from the upstream back to the browser. An allow list, not a deny list:
# these responses are served from the dashboard's own origin, so anything copied
# through speaks with the dashboard's authority. ``set-cookie`` would let the
# music service write or clear the zer0space session cookie.
#
# The three range headers are what make seeking work — see the module docstring.
_RESPONSE_ALLOW = {
    "accept-ranges",
    "cache-control",
    "content-disposition",
    "content-range",
    "content-type",
    "etag",
    "expires",
    "last-modified",
    "location",
    "retry-after",
    "vary",
}


def _response_headers(upstream: httpx.Response) -> dict[str, str]:
    out: dict[str, str] = {}
    for key, value in upstream.headers.items():
        if key.lower() in _RESPONSE_ALLOW:
            out[key.lower()] = value
    out["content-security-policy"] = MUSIC_CSP
    # Keep audio flushing through any buffering reverse proxy in front of us.
    out["x-accel-buffering"] = "no"
    return out


def _target(base_url: str, subpath: str, request: Request) -> str:
    cleaned = subpath.lstrip("/")
    # httpx resolves dot segments per RFC 3986, so ``a/../../x`` would silently
    # become ``/x`` upstream. It cannot cross to another host, but the segment is
    # rejected here rather than quietly normalised away.
    if any(segment == ".." for segment in cleaned.split("/")):
        raise UnsafePath(subpath)
    target = f"{base_url}/{cleaned}" if cleaned else base_url + "/"
    if request.url.query:
        target = f"{target}?{request.url.query}"
    return target


async def proxy(request: Request, subpath: str, *, user: str, username: str = "") -> Response:
    """Forward ``request`` to the music service and stream the reply back."""
    body = await request.body()
    headers = build_request_headers(request, user=user, username=username)

    try:
        upstream_request = client().build_request(
            request.method,
            _target(config.MUSIC_URL, subpath, request),
            headers=headers,
            content=body if body else None,
        )
        upstream = await client().send(upstream_request, stream=True)
    except UnsafePath:
        return JSONResponse(
            {"error": "Invalid path", "code": "MUSIC_BAD_PATH"}, status_code=400
        )
    except httpx.RequestError as err:
        return bad_gateway(err)

    response_headers = _response_headers(upstream)

    if request.method == "HEAD":
        await upstream.aclose()
        return Response(status_code=upstream.status_code, headers=response_headers)

    async def stream() -> AsyncIterator[bytes]:
        try:
            async for chunk in upstream.aiter_bytes():
                yield chunk
        finally:
            await upstream.aclose()

    return StreamingResponse(
        stream(), status_code=upstream.status_code, headers=response_headers
    )
