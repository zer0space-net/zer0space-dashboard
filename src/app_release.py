"""The zer0space Android app: which release is current, and where to get it.

The app itself lives in github.com/zer0space-net/zer0space-android-app. Every
tagged commit there is built by GitHub Actions into a signed APK and published
as a GitHub Release. This module reads the latest such release and hands the
dashboard three things: the version (for the Settings → App tab and the in-app
"update available" banner), the download link, and the APK's SHA-256.

Why the dashboard asks GitHub instead of the app doing it directly: the app is
a thin shell around this site, and keeping the release logic here means the
update rules change with a dashboard deploy instead of an app update.

Two decisions worth knowing:

* **Read-only and unauthenticated.** The repo is public, so the GitHub API
  answers without a token. No PAT is involved anywhere; one expiring silently
  is how the dashboard image went stale for a week in September.
* **The download URL is checked, not trusted.** Only an ``.apk`` under this
  repo's own ``/releases/download/`` path is ever offered. A release asset that
  points anywhere else is ignored rather than handed to a phone's installer.

The SHA-256 is a transport check, not the security boundary. That is Android's
own rule that an update must carry the same signing key as the installed app,
which the app additionally checks itself before it opens the installer.
"""

from __future__ import annotations

import asyncio
import re
import time
from dataclasses import dataclass
from typing import Any

import httpx

from . import config

# How long one answer from GitHub is reused. Unauthenticated API calls are
# limited to 60 an hour per IP; at 10 minutes this stays at six however many
# phones ask, and a fresh release is visible within ten minutes of CI finishing.
CACHE_TTL = 600.0
# After a failed lookup, wait this long before trying again, so an outage of
# api.github.com is not hammered by every page load.
ERROR_TTL = 60.0

# vMAJOR.MINOR.PATCH, nothing else. The same formula is in the app's
# build.gradle.kts, and the two must agree: the app compares its own
# versionCode against the one computed here.
_TAG_RE = re.compile(r"^v?(\d{1,3})\.(\d{1,2})\.(\d{1,2})$")
_SHA_RE = re.compile(r"^[0-9a-f]{64}$")
_NOTES_MAX = 4000


def version_code(tag: str) -> int | None:
    """``v1.4.2`` → ``10402``. ``None`` for anything that is not a release tag."""
    m = _TAG_RE.match(tag.strip())
    if not m:
        return None
    major, minor, patch = (int(x) for x in m.groups())
    return major * 10000 + minor * 100 + patch


@dataclass(frozen=True)
class Release:
    version: str
    version_code: int
    apk_url: str
    apk_name: str
    size: int
    sha256: str | None
    notes: str
    published_at: str

    def public(self) -> dict[str, Any]:
        return {
            "available": True,
            "version": self.version,
            "version_code": self.version_code,
            "apk_url": self.apk_url,
            "apk_name": self.apk_name,
            "size": self.size,
            "sha256": self.sha256,
            "notes": self.notes,
            "published_at": self.published_at,
            "download": config.APP_DOWNLOAD_PATH,
        }


_cache: tuple[float, Release | None] | None = None
_lock = asyncio.Lock()


def _download_prefix() -> str:
    return f"https://github.com/{config.APP_RELEASE_REPO}/releases/download/"


def _digest_of(asset: dict[str, Any]) -> str | None:
    """GitHub reports ``"digest": "sha256:<hex>"`` on release assets."""
    raw = str(asset.get("digest") or "")
    if raw.startswith("sha256:"):
        value = raw[len("sha256:"):].lower()
        if _SHA_RE.match(value):
            return value
    return None


async def _sha_from_sums(client: httpx.AsyncClient, url: str, apk_name: str) -> str | None:
    """Fallback for releases without a digest: read the SHA256SUMS asset CI writes."""
    if not url.startswith(_download_prefix()):
        return None
    try:
        resp = await client.get(url, follow_redirects=True)
    except httpx.HTTPError:
        return None
    if resp.status_code != 200 or len(resp.content) > 4096:
        return None
    for line in resp.text.splitlines():
        parts = line.split()
        if len(parts) == 2 and parts[1].lstrip("*") == apk_name and _SHA_RE.match(parts[0].lower()):
            return parts[0].lower()
    return None


async def _fetch() -> Release | None:
    api = f"https://api.github.com/repos/{config.APP_RELEASE_REPO}/releases/latest"
    headers = {
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "zer0space-dashboard",
    }
    async with httpx.AsyncClient(timeout=httpx.Timeout(8.0), headers=headers) as client:
        resp = await client.get(api)
        if resp.status_code == 404:
            # No release published yet: a normal state, not an error.
            return None
        resp.raise_for_status()
        data = resp.json()
        if not isinstance(data, dict) or data.get("draft") or data.get("prerelease"):
            return None

        tag = str(data.get("tag_name") or "")
        code = version_code(tag)
        if code is None:
            print(f"[app] latest release tag {tag!r} is not vX.Y.Z; ignoring it")
            return None

        prefix = _download_prefix()
        apk: dict[str, Any] | None = None
        sums_url: str | None = None
        for asset in data.get("assets") or []:
            if not isinstance(asset, dict):
                continue
            name = str(asset.get("name") or "")
            url = str(asset.get("browser_download_url") or "")
            if not url.startswith(prefix):
                continue
            if name.endswith(".apk") and apk is None:
                apk = asset
            elif name == "SHA256SUMS":
                sums_url = url
        if apk is None:
            return None

        apk_name = str(apk["name"])
        sha = _digest_of(apk)
        if sha is None and sums_url:
            sha = await _sha_from_sums(client, sums_url, apk_name)

        notes = str(data.get("body") or "").strip()
        if len(notes) > _NOTES_MAX:
            notes = notes[:_NOTES_MAX].rstrip() + " …"

        return Release(
            version=tag.lstrip("v"),
            version_code=code,
            apk_url=str(apk["browser_download_url"]),
            apk_name=apk_name,
            size=int(apk.get("size") or 0),
            sha256=sha,
            notes=notes,
            published_at=str(data.get("published_at") or ""),
        )


async def latest() -> Release | None:
    """The current release, cached. ``None`` when there is none or GitHub is down.

    A failed lookup keeps serving the last good answer: a phone asking whether it
    is up to date is better told the version from ten minutes ago than nothing.
    """
    global _cache
    if not config.APP_ENABLED:
        return None
    now = time.monotonic()
    if _cache and _cache[0] > now:
        return _cache[1]
    async with _lock:
        if _cache and _cache[0] > now:
            return _cache[1]
        previous = _cache[1] if _cache else None
        try:
            release = await _fetch()
            _cache = (now + CACHE_TTL, release)
        except (httpx.HTTPError, ValueError, KeyError) as err:
            print(f"[app] release lookup failed: {err!r}")
            release = previous
            _cache = (now + ERROR_TTL, previous)
        return release
