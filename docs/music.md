# The Music gateway

How `zer0space.com/music` works from this repository's side, and — because the
user asked for it to be written down here — **how background playback on a phone
is achieved**.

The player itself lives in
[`zer0space-net/zer0space-music`](https://github.com/zer0space-net/zer0space-music).
This document covers the dashboard half: `src/music.py`, the `MUSIC_ENABLED`
block in `src/main.py`, and the sidebar entry.

---

## What it is

zer0space Music is a Spotify-shaped web player: search, albums, artists, charts,
liked songs, your own playlists, a queue, and playback that keeps running when
the phone is in a pocket. Catalogue metadata comes from Deezer's public API;
audio is resolved per track by a scraper (yt-dlp) in the music service.

It is the same arrangement as Crimson — a separate service, gated by this
dashboard — with one significant difference: **Music has no accounts at all.**
Crimson has its own user system and needed an SSO broker
(`src/crimson_sso.py`). Music just trusts the user id this gateway forwards.

## The request path

```
browser ──► dashboard /music/*  ──►  music service  ──► Deezer (metadata)
            session gate             (publishes no ports)  yt-dlp (audio URL)
            + service token
            + X-Zer0space-User
◄────────── audio bytes, 206 Partial Content, all the way back ──────────
```

`src/music.py` forwards everything under `/music` to `MUSIC_URL`. One upstream,
not two: the music service serves its own UI and API together, so there is no
SPA/API split to route between.

## Identity: two locks, always sent together

The music service publishes no ports and has no login. It trusts
`X-Zer0space-User` — but **only** when the shared service token is presented
with it. This gateway therefore sets both on every forwarded request:

```
Authorization: Bearer <MUSIC_SERVICE_TOKEN>
X-Zer0space-User: <session user id>
X-Zer0space-Username: <display name>
```

and strips any client-supplied copy of either, **in every letter-casing**. HTTP
header names are case-insensitive but a Python dict is not, so a client sending
both `X-Zer0space-User` and `x-zer0space-user` would otherwise have one survive
alongside the gateway's own and both go out on the wire. That is how a viewer
would reach another user's playlists.

The zer0space session cookie is stripped at this hop and never reaches the
music service.

## Range requests — why they matter here

`/music/media/<ticket>` is an audio stream, and a phone's `<audio>` element
negotiates **byte ranges** to seek. So this gateway:

- passes `Range`, `If-Range`, `If-None-Match` and `If-Modified-Since` upstream;
- relays `Accept-Ranges`, `Content-Range` and `Content-Length` back
  (`_RESPONSE_ALLOW` in `src/music.py`);
- strips `Accept-Encoding`, forcing identity encoding — a re-compressed body
  would invalidate the byte offsets a range is expressed in.

Dropping any of those produces audio that plays from the start and cannot be
scrubbed. Safari also probes a media URL with `Range: bytes=0-1` before it will
commit to playing at all, so a gateway that ignores ranges gives an iPhone a
player that never starts.

## Media through the tunnel — a deliberate exception

Crimson keeps media bytes **off** the Cloudflare tunnel (ToS §2.8): stream
segments go CDN → crimson-proxy → viewer, and only API JSON passes through the
dashboard.

Music does **not** follow that rule, by decision. Audio is roughly 1/50 of
video's bitrate, and the alternative — a Tailscale-only media host — means no
music away from home, which defeats the phone support that is the point of the
app. The music service's `MUSIC_MEDIA_BASE_URL` can point the media relay at a
direct host later without moving the API with it.

## Background playback on a phone

This is the feature the app exists for: lock the screen, and the music keeps
playing with real controls on the lock screen. It is almost entirely a
*client-side* achievement in the music repo's `static/js/player.js`, but it
constrains this gateway in one specific way (see "the ticket", below).

**The four rules**, each of which fails only on a real phone with the screen off:

1. **One `<audio>` element for the life of the page**, created in the HTML and
   never replaced — only its `src` changes. The obvious design, `new Audio()`
   per track, breaks iOS background playback: the OS attaches the media session
   and the autoplay "activation" to a *specific element*, so a fresh one created
   while backgrounded has neither, and the queue silently stops after the first
   song.
2. **No Web Audio API.** An `AudioContext` makes iOS reclassify the page from
   "media playback" (continues in the background) to "web audio" (suspended when
   backgrounded). An equaliser would cost the whole feature.
3. **MediaSession metadata set on every track change, before `play()`** — the
   title, artist and cover the lock screen, Control Center, Android
   notification, smartwatch and car head unit all read. Without it the hardware
   and headset buttons go to whichever app set a session last.
4. **`setPositionState()` on every tick**, or the lock-screen scrubber is a dead
   bar and iOS's ±15 s buttons do nothing.

Plus a PWA manifest with `display: standalone`, so the player can be installed
to the home screen — on iOS that keeps the media session attached far longer
than a backgrounded Safari tab. The manifest is generated per request so its
`start_url` and `scope` carry this gateway's `/music` prefix; a scope mismatch
also silently prevents the service worker from registering.

**The ticket, and why this gateway must not gate media on the session.** The
`<audio>` src is `/music/media/<signed-ticket>`, and that ticket carries its own
authorisation rather than being re-checked against the zer0space session. This
is deliberate: a request the OS media stack replays after the page has been
backgrounded does not reliably carry the headers the page would have added.
Gating it on the cookie is exactly the failure the Crimson stack hit with
AirPlay, where the Apple TV fetched the playlist itself and got a 401 — which is
why `src/crimson.py` grew the `?zt=` token. Music's ticket is the same idea,
built in from the start.

The full account — including what does *not* work (playback with the browser
fully closed, offline, truly gapless) — is in
[the music repo's `docs/background-playback.md`](https://github.com/zer0space-net/zer0space-music/blob/main/docs/background-playback.md).

## The accent follows the dashboard

The music app reads `localStorage['zs-theme']` — this dashboard's own key — in
its `boot.js`. Because the gateway serves it from the **same origin**, that
storage is shared: pick a theme here, open Music, and it is already wearing it.
No API call and no schema change. It also listens for the `storage` event, so a
change made in another open dashboard tab recolours the player live.

The same trick carries the language (`zs-lang`).

## Configuration

| Variable | Default | Meaning |
|---|---|---|
| `MUSIC_URL` | unset | The music service, e.g. `http://music:8000`. **Unset = the whole gateway is inert**: `/music` 404s and the sidebar entry is hidden. |
| `MUSIC_SERVICE_TOKEN` | unset | Shared token. Swarm secret `music_service_token`. Must be byte-identical on both sides. |
| `MUSIC_USER_HEADER` | `X-Zer0space-User` | Identity header name. |
| `MUSIC_USER_NAME_HEADER` | `X-Zer0space-Username` | Display name, for the greeting only. |

Confirm at boot:

```
[music] gateway on /music (service=http://music:8000, token set)
```

`NO SERVICE TOKEN` there means the secret is missing from this service — the
gateway will forward requests that the music service then rejects with 401.

The deployment runbook, including the database and the two secrets to create,
is in [the music repo's `docs/deploy.md`](https://github.com/zer0space-net/zer0space-music/blob/main/docs/deploy.md).
**Both halves must be deployed** — neither does anything alone.

## CSRF and body limits

`/music` is exempt from the dashboard's double-submit CSRF check, like
`/crimson`: the proxied app authenticates to its backend by its own scheme and
has no zer0space CSRF token to echo. Cross-site POSTs are still blocked the same
way the login endpoints are — the session cookie is `samesite=strict`.

It also gets the looser proxy body limit rather than the API's, since it
forwards POST bodies for a third-party API.
