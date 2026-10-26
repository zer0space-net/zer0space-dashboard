# The Android app

The zer0space Android app (github.com/zer0space-net/zer0space-android-app) is a
native shell around this site. This dashboard's part is small and lives in
three places:

| Where | What |
|---|---|
| `src/app_release.py` | Reads the latest GitHub Release of the app repo (public, no token), cached 10 min. Only offers an `.apk` under that repo's own `/releases/download/` path. |
| `src/main.py` | `GET /api/app/release` (session), `GET /api/app/qr` (session, a QR of the download link), `GET /app/download` (session, 302 to the APK). |
| `templates/dashboard.html` + `static/js/app-download.js` | Settings → App tab; inside the app, the "update available" banner. |

## Configuration

`APP_RELEASE_REPO` (default `zer0space-net/zer0space-android-app`). Set it to
an empty string to hide the tab. Nothing else: the feature needs no secret
and no stack change, only outbound HTTPS to api.github.com.

## How an update reaches a phone

1. A `vX.Y.Z` tag on the app repo → CI publishes a signed APK + `SHA256SUMS`.
2. Within ten minutes `/api/app/release` reports it, with
   `version_code = MAJOR*10000 + MINOR*100 + PATCH`.
3. Inside the app, `app-download.js` compares that with the installed
   `versionCode` (from `window.zer0spaceApp.info()`) and shows the banner.
4. "Update now" passes `apk_url`, `sha256` and `version_code` to the app, which
   checks the URL prefix (compiled into the app), the hash, the package name
   and the signing certificate before opening Android's installer.

`window.zer0spaceApp` and `window.CrimsonExtension` exist only inside the app,
and only on this origin: the app injects them with an exact-origin rule.

## Why it changes nothing in the browser

`app-download.js` only renders the tab when there is no `window.zer0spaceApp`.
Crimson and Music detect the app through APIs they already used
(`CrimsonExtension`, `navigator.mediaSession`), so neither has an app-specific
code path.
