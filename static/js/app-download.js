/* Settings → App, and the "update available" banner inside the Android app.
 *
 * Two audiences, one file:
 *
 *  - In a normal browser this only fills the Settings → App tab: current
 *    version, download link, a QR code for a desktop visitor.
 *  - Inside the zer0space Android app, `window.zer0spaceApp` exists. The app
 *    injects it only into pages from this site's own origin. Here the same
 *    release info drives an update banner, and "Update now" hands the APK URL
 *    and its SHA-256 to the app, which downloads it, checks that it is signed
 *    with the same key as the installed app, and opens Android's installer.
 *
 * Everything shown here is built with textContent. The release notes are free
 * text from GitHub and must never reach innerHTML.
 */
(function () {
  'use strict';

  var release = null;
  var installed = null;
  var bannerDismissed = false;
  var busy = false;

  function $(id) { return document.getElementById(id); }
  function tr(key, vars) { return window.t ? window.t(key, vars) : key; }

  function nativeApp() {
    var a = window.zer0spaceApp;
    return a && typeof a.info === 'function' ? a : null;
  }

  function formatSize(bytes) {
    if (!bytes) return '';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  function formatDate(iso) {
    if (!iso) return '';
    var d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    var lang = (window.I18N && window.I18N.lang) || 'de';
    return d.toLocaleDateString(lang === 'en' ? 'en-GB' : 'de-CH');
  }

  function updateAvailable() {
    return Boolean(release && release.available && installed &&
      release.version_code > installed.versionCode);
  }

  /* --- Settings → App tab ---------------------------------------------- */

  function renderTab() {
    var box = $('app-release');
    if (!box) return;
    var none = $('app-none');
    var err = $('app-error');
    err.hidden = true;

    if (release === null) {
      box.hidden = true;
      none.hidden = true;
      err.textContent = tr('app.unreachable');
      err.hidden = false;
    } else if (!release.available) {
      box.hidden = true;
      none.hidden = false;
    } else {
      none.hidden = true;
      box.hidden = false;
      $('app-version').textContent = tr('app.version', { version: release.version });
      $('app-meta').textContent = tr('app.meta', {
        size: formatSize(release.size),
        date: formatDate(release.published_at)
      });
      var notes = (release.notes || '').trim();
      $('app-notes').textContent = notes;
      $('app-notes-wrap').hidden = !notes;
    }

    var inst = $('app-installed');
    var dl = $('app-download');
    var upd = $('app-update');
    if (installed) {
      inst.textContent = tr(updateAvailable() ? 'app.installed' : 'app.upToDate',
        { version: installed.versionName });
      inst.hidden = false;
      // Inside the app a plain link would hand the APK to Android's download
      // manager and leave the user to find it. The update button does it in place.
      dl.hidden = true;
      upd.hidden = !updateAvailable();
    } else {
      inst.hidden = true;
      dl.hidden = false;
      upd.hidden = true;
    }
  }

  function loadQr() {
    var wrap = $('app-qr-wrap');
    // A phone does not need a code to scan; it already is the phone.
    if (!wrap || nativeApp() || window.matchMedia('(max-width: 760px)').matches) return;
    window.API.get('/api/app/qr').then(function (data) {
      if (!data || typeof data.qr !== 'string' || data.qr.indexOf('data:image/png;base64,') !== 0) return;
      $('app-qr').src = data.qr;
      wrap.hidden = false;
    }).catch(function () { /* the QR is a convenience */ });
  }

  /* --- In-app update ---------------------------------------------------- */

  function setProgress(text) {
    var targets = [$('app-progress'), document.querySelector('.app-update-banner .app-update-status')];
    targets.forEach(function (el) {
      if (!el) return;
      el.textContent = text || '';
      el.hidden = !text;
    });
  }

  function onUpdateEvent(event) {
    var d = (event && event.detail) || {};
    switch (d.state) {
      case 'downloading':
        setProgress(tr('app.st.downloading', { pct: Math.round((d.progress || 0) * 100) }));
        break;
      case 'verifying':
        setProgress(tr('app.st.verifying'));
        break;
      case 'installing':
        busy = false;
        setProgress(tr('app.st.installing'));
        break;
      case 'needs-permission':
        busy = false;
        setProgress(tr('app.st.permission'));
        break;
      case 'error':
        busy = false;
        setProgress(tr('app.st.error', { error: String(d.error || '?') }));
        break;
      default:
        break;
    }
  }

  function startUpdate() {
    var app = nativeApp();
    if (!app || busy || !updateAvailable()) return;
    busy = true;
    setProgress(tr('app.st.downloading', { pct: 0 }));
    app.installUpdate({
      url: release.apk_url,
      sha256: release.sha256 || '',
      versionCode: release.version_code
    }).catch(function (e) {
      busy = false;
      setProgress(tr('app.st.error', { error: (e && e.message) || String(e) }));
    });
  }

  function renderBanner() {
    var existing = document.querySelector('.app-update-banner');
    if (!updateAvailable() || bannerDismissed) {
      if (existing) existing.remove();
      return;
    }
    if (existing) existing.remove();

    var bar = document.createElement('div');
    bar.className = 'app-update-banner glass';
    bar.setAttribute('role', 'status');

    var text = document.createElement('div');
    text.className = 'app-update-text';
    var title = document.createElement('strong');
    title.textContent = tr('app.updateAvailable', { version: release.version });
    var status = document.createElement('span');
    status.className = 'app-update-status faint';
    status.hidden = true;
    text.appendChild(title);
    text.appendChild(status);

    var actions = document.createElement('div');
    actions.className = 'row gap-10';
    var later = document.createElement('button');
    later.type = 'button';
    later.className = 'btn btn-ghost btn-sm';
    later.textContent = tr('app.later');
    later.addEventListener('click', function () {
      bannerDismissed = true;
      bar.remove();
    });
    var go = document.createElement('button');
    go.type = 'button';
    go.className = 'btn btn-primary btn-sm';
    go.textContent = tr('app.updateNow');
    go.addEventListener('click', startUpdate);
    actions.appendChild(later);
    actions.appendChild(go);

    bar.appendChild(text);
    bar.appendChild(actions);
    document.body.appendChild(bar);
  }

  /* --- Boot ---------------------------------------------------------------- */

  function load() {
    var app = nativeApp();
    var info = app
      ? app.info().then(function (i) { installed = i; }).catch(function () { installed = null; })
      : Promise.resolve();
    var rel = window.API.get('/api/app/release')
      .then(function (r) { release = r; })
      .catch(function () { release = null; });
    Promise.all([info, rel]).then(function () {
      renderTab();
      renderBanner();
    });
    loadQr();
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (!window.API) return;
    window.addEventListener('zer0space-app:update', onUpdateEvent);
    var upd = $('app-update');
    if (upd) upd.addEventListener('click', startUpdate);
    load();
  });

  window.addEventListener('languagechange:zs', function () {
    renderTab();
    renderBanner();
  });
})();
