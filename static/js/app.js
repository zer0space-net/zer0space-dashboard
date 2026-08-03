/* ==========================================================================
   Dashboard SPA.

   No framework, no build step. Views are sections in dashboard.html that this
   file fills in; navigation swaps which one carries .is-active.

   Two conventions worth knowing before adding to this file:

   * Everything that lands in innerHTML goes through ZS_UI.esc() first, and
     every href through ZS_UI.safeUrl(). Service names, hostnames and vault
     titles are all user-controlled, and the CSP blocks inline <script> but not
     an injected <img onerror>.
   * Markup built here carries no data-i18n attributes, so applyI18n() cannot
     reach it. The `languagechange:zs` listener at the bottom re-renders those
     views instead — extend it when you add one.
   ========================================================================== */

(function () {
  'use strict';

  var UI = window.ZS_UI;
  var API = window.API;
  var t = window.t;
  var esc = UI.esc;

  var POLL_INTERVAL = 15000;

  var state = {
    me: null,
    isAdmin: false,
    overview: null,
    services: [],
    vault: [],
    invites: [],
    users: [],
    attempts: [],
    view: 'home',
    settingsTab: 'appearance',
    vaultFilter: ''
  };

  var el = {};
  var pollTimer = null;

  function $(id) { return document.getElementById(id); }

  function cacheElements() {
    ['tiles', 'load-body', 'load-caption', 'swarm-body', 'swarm-caption',
     'backup-body', 'backup-caption', 'may-body',
     'service-grid', 'ai-grid', 'cloud-grid',
     'services-caption', 'view-title', 'greeting', 'banner', 'who-name',
     'who-role', 'vault-list', 'vault-search', 'invite-rows', 'user-rows', 'service-rows',
     'audit-rows', 'audit-summary', 'swatches', 'accent-custom', 'accent-value', 'chibi-enabled',
     'loading-overlay', 'invite-fresh', 'invite-code', 'invite-meta',
     'sidebar-scrim', 'app',
     'twofa-off', 'twofa-on', 'twofa-enable-btn', 'twofa-disable-btn',
     'twofa-password-form', 'twofa-password', 'twofa-password-error', 'twofa-password-cancel',
     'twofa-setup', 'twofa-qr', 'twofa-secret', 'twofa-verify-form', 'twofa-verify-code', 'twofa-verify-error',
     'twofa-recovery', 'twofa-recovery-codes', 'twofa-recovery-done',
     'twofa-disable-form', 'twofa-disable-password', 'twofa-disable-code', 'twofa-disable-error', 'twofa-disable-cancel'
    ].forEach(function (id) { el[id] = $(id); });
  }

  /* --- Banner ------------------------------------------------------------ */

  function banner(message, kind) {
    if (!el.banner) return;
    if (!message) { el.banner.hidden = true; return; }
    el.banner.className = 'alert banner alert-' + (kind || 'warn');
    el.banner.textContent = message;
    el.banner.hidden = false;
  }

  /* --- Navigation -------------------------------------------------------- */

  var VIEWS = ['home', 'services', 'ai', 'cloud', 'vault', 'settings'];

  function setView(name) {
    if (VIEWS.indexOf(name) === -1) name = 'home';
    state.view = name;

    document.querySelectorAll('.view').forEach(function (section) {
      section.classList.toggle('is-active', section.id === 'view-' + name);
    });
    document.querySelectorAll('.nav-item').forEach(function (item) {
      item.classList.toggle('is-active', item.dataset.view === name);
    });
    if (el['view-title']) el['view-title'].textContent = t('view.' + name);

    // The hash is the only piece of routing state: a reload, a bookmark and a
    // back button should all land on the view you were looking at.
    if (window.location.hash.slice(1) !== name) {
      history.replaceState(null, '', '#' + name);
    }
    if (el.app) el.app.classList.remove('nav-open');
    if (el['sidebar-scrim']) el['sidebar-scrim'].hidden = true;

    if (name === 'vault' && !state.vault.length) loadVault();
    if (name === 'settings' && state.isAdmin) loadAdmin();
    if (name === 'settings') setSettingsTab(state.settingsTab);
    // ai.js is only loaded when the AI gateway is wired, so it may not exist.
    if (name === 'ai' && window.ZS_AI) window.ZS_AI.openView();
  }

  /* --- Settings sub-tabs -------------------------------------------------- */

  var SETTINGS_TAB_KEY = 'zs-settings-tab';

  function setSettingsTab(name) {
    var tab = document.querySelector('.settings-tab[data-tab="' + name + '"]');
    // Fall back to the first tab if the requested one is unknown or is an admin
    // tab a viewer must not land on (e.g. a stale stored preference).
    if (!tab || (tab.classList.contains('admin-only') && !state.isAdmin)) {
      name = 'appearance';
    }
    state.settingsTab = name;
    try { localStorage.setItem(SETTINGS_TAB_KEY, name); } catch (e) { /* storage blocked */ }

    document.querySelectorAll('.settings-tab').forEach(function (btn) {
      var on = btn.dataset.tab === name;
      btn.classList.toggle('is-active', on);
      btn.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    document.querySelectorAll('.tab-pane').forEach(function (pane) {
      pane.hidden = pane.dataset.pane !== name;
    });

    // Loaded lazily: the AI configuration is a round trip to another service,
    // and most visits to Settings are not about the assistant.
    if (name === 'ai' && window.ZS_AI) window.ZS_AI.openSettings();
  }

  function wireSettingsTabs() {
    try {
      var stored = localStorage.getItem(SETTINGS_TAB_KEY);
      if (stored) state.settingsTab = stored;
    } catch (e) { /* storage blocked */ }
    document.querySelectorAll('.settings-tab').forEach(function (btn) {
      btn.addEventListener('click', function () { setSettingsTab(btn.dataset.tab); });
    });
  }

  function wireNavigation() {
    document.querySelectorAll('.nav-item').forEach(function (item) {
      // The Crimson entry is a real link (no data-view) — let the browser follow
      // its href to /crimson rather than switching an in-page view.
      if (!item.dataset.view) return;
      item.addEventListener('click', function () { setView(item.dataset.view); });
    });

    var app = el.app;
    var scrim = el['sidebar-scrim'];
    function openNav(open) {
      if (app) app.classList.toggle('nav-open', open);
      if (scrim) scrim.hidden = !open;
    }
    if ($('sidebar-open')) $('sidebar-open').addEventListener('click', function () { openNav(true); });
    if (scrim) scrim.addEventListener('click', function () { openNav(false); });

    // One three-lines button, two jobs by width. On desktop it folds the sidebar
    // to a rail, remembered per browser. On mobile it closes the drawer — the
    // topbar three-lines opens it. The two are kept apart on purpose: the drawer
    // is open/closed, the rail is wide/narrow, and merging them made the button
    // do the wrong thing at whichever width you were not testing.
    var COLLAPSE_KEY = 'zs-sidebar';
    // Must match the breakpoint at which dashboard.css turns the sidebar into a
    // drawer. If the two drift apart, the button folds the sidebar to a rail at
    // a width where the rail is not rendered — a click that appears to do
    // nothing.
    function isMobile() { return window.matchMedia('(max-width: 1024px)').matches; }
    function setCollapsed(on) {
      if (app) app.classList.toggle('is-collapsed', on);
      try { localStorage.setItem(COLLAPSE_KEY, on ? 'collapsed' : 'expanded'); } catch (e) { /* ignore */ }
      var btn = $('sidebar-collapse');
      if (btn) btn.setAttribute('aria-label', t(on ? 'nav.expand' : 'nav.collapse'));
    }
    try {
      if (localStorage.getItem(COLLAPSE_KEY) === 'collapsed') setCollapsed(true);
    } catch (e) { /* storage blocked */ }
    if ($('sidebar-collapse')) {
      $('sidebar-collapse').addEventListener('click', function () {
        if (isMobile()) openNav(false);
        else setCollapsed(!(app && app.classList.contains('is-collapsed')));
      });
    }

    window.addEventListener('hashchange', function () {
      setView(window.location.hash.slice(1));
    });
  }

  /* --- Greeting ---------------------------------------------------------- */

  function renderGreeting() {
    if (!el.greeting || !state.me) return;
    var hour = new Date().getHours();
    var key = hour < 5 ? 'greeting.night'
            : hour < 11 ? 'greeting.morning'
            : hour < 18 ? 'greeting.day'
            : hour < 23 ? 'greeting.evening'
            : 'greeting.night';
    el.greeting.textContent = t(key, { name: state.me.username });
  }

  /* --- Status tiles ------------------------------------------------------ */

  function tile(label, valueHtml, detail, stateName) {
    return '<div class="tile" data-state="' + esc(stateName || 'unknown') + '">' +
             '<span class="tile-label">' + esc(label) + '</span>' +
             '<span class="tile-value">' + valueHtml + '</span>' +
             '<span class="tile-detail">' + esc(detail) + '</span>' +
           '</div>';
  }

  function renderTiles() {
    if (!el.tiles) return;
    var data = state.overview;
    if (!data) return;
    var tiles = data.tiles;

    var backupDetail = tiles.backup.lastRun
      ? UI.relative(tiles.backup.lastRun) + ' · ' + t('backup.' + tiles.backup.detail)
      : t('tile.backupNever');

    var clusterState = tiles.cluster.state;
    var managers = (tiles.cluster.managersTotal !== null && tiles.cluster.managersTotal !== undefined)
      ? tiles.cluster.managersReachable + '/' + tiles.cluster.managersTotal + ' Manager · '
      : '';

    el.tiles.innerHTML = [
      tile(t('tile.nodes'),
           tiles.nodes.value + '<small>/' + tiles.nodes.total + '</small>',
           t('tile.nodesDetail'),
           tiles.nodes.state),
      tile(t('tile.services'),
           tiles.services.value === null ? '—' : String(tiles.services.value),
           t('tile.servicesDetail'),
           tiles.services.state),
      tile(t('tile.cluster'),
           esc(t('cluster.' + clusterState)),
           managers + t('cluster.' + tiles.cluster.detail),
           clusterState),
      tile(t('tile.infrastructure'),
           tiles.infrastructure.value + '<small>/' + tiles.infrastructure.total + '</small>',
           t('tile.infraDetail'),
           tiles.infrastructure.state),
      tile(t('tile.backup'),
           esc(t('backup.' + tiles.backup.detail)),
           backupDetail,
           tiles.backup.state)
    ].join('');
  }

  /* --- Overview cards ----------------------------------------------------- */

  function barClass(percent) {
    if (percent === null || percent === undefined) return 'bar';
    if (percent >= 90) return 'bar is-crit';
    if (percent >= 75) return 'bar is-warn';
    return 'bar';
  }

  function metric(name, percent, detail) {
    var width = (percent === null || percent === undefined || isNaN(percent))
      ? 0 : Math.max(0, Math.min(100, Number(percent)));
    return '<div class="metric">' +
             '<div class="metric-top">' +
               '<span class="metric-name">' + esc(name) + '</span>' +
               '<span class="metric-val">' + esc(detail) + '</span>' +
             '</div>' +
             // The inline width is why style-src keeps 'unsafe-inline'; see the
             // CSP note in src/main.py.
             '<div class="' + barClass(percent) + '"><i style="width:' + width + '%"></i></div>' +
           '</div>';
  }

  /* Swarm members and standalone hosts folded into one list. The two are kept
     apart everywhere else on purpose — a standalone host is not a Swarm node —
     but "how loaded is the hardware" is a question about all of it. */
  function allHosts() {
    var data = state.overview;
    if (!data) return [];
    return (data.nodes || []).concat(data.extraHosts || []);
  }

  /* CPU is averaged, everything else is summed: a mean of nine percentages is
     the honest answer for load, while a mean of nine disk percentages would
     hide a full 200 GB disk behind eight empty 4 TB ones. */
  function aggregate(hosts) {
    var out = { cpu: null, memUsed: 0, memTotal: 0, diskUsed: 0, diskTotal: 0, rx: 0, tx: 0 };
    var cpuSum = 0, cpuCount = 0;
    hosts.forEach(function (host) {
      var mem = host.mem || {}, disk = host.disk || {}, net = host.net || {};
      if (typeof host.cpu === 'number' && !isNaN(host.cpu)) { cpuSum += host.cpu; cpuCount += 1; }
      out.memUsed += Number(mem.used) || 0;
      out.memTotal += Number(mem.total) || 0;
      out.diskUsed += Number(disk.used) || 0;
      out.diskTotal += Number(disk.total) || 0;
      out.rx += Number(net.rx_rate) || 0;
      out.tx += Number(net.tx_rate) || 0;
    });
    if (cpuCount) out.cpu = cpuSum / cpuCount;
    out.memPercent = out.memTotal ? (out.memUsed / out.memTotal) * 100 : null;
    out.diskPercent = out.diskTotal ? (out.diskUsed / out.diskTotal) * 100 : null;
    return out;
  }

  function renderLoad() {
    if (!el['load-body']) return;
    var hosts = allHosts();
    var online = hosts.filter(function (h) { return h.online; });
    var agg = aggregate(online);

    el['load-body'].innerHTML =
      metric(t('metric.cpu'), agg.cpu, UI.percent(agg.cpu)) +
      metric(t('metric.ram'), agg.memPercent, UI.bytes(agg.memUsed) + ' / ' + UI.bytes(agg.memTotal)) +
      metric(t('metric.disk'), agg.diskPercent, UI.bytes(agg.diskUsed) + ' / ' + UI.bytes(agg.diskTotal)) +
      '<div class="host-net">' +
        '<span>↓ ' + esc(UI.rate(agg.rx)) + '</span>' +
        '<span>↑ ' + esc(UI.rate(agg.tx)) + '</span>' +
      '</div>';

    if (el['load-caption']) {
      el['load-caption'].textContent = t('home.nodesCaption', {
        online: online.length,
        total: hosts.length
      });
    }
  }

  function renderSwarm() {
    if (!el['swarm-body']) return;
    var swarm = state.overview && state.overview.swarm;

    if (!swarm) {
      el['swarm-body'].innerHTML = '<p class="empty">' + esc(t('home.noSwarm')) + '</p>';
      if (el['swarm-caption']) el['swarm-caption'].textContent = '';
      return;
    }

    var services = swarm.services || [];
    var running = 0, desired = 0;
    services.forEach(function (s) {
      running += Number(s.running) || 0;
      desired += Number(s.desired) || 0;
    });
    var degraded = services.filter(function (s) { return (s.running || 0) < (s.desired || 0); });
    // Replica health reads the other way round from a load bar: full is good,
    // so barClass() (which warns as it fills) is deliberately not used here.
    var width = desired ? Math.max(0, Math.min(100, (running / desired) * 100)) : 100;

    var detail = degraded.length
      ? '<div class="home-chips">' + degraded.map(function (s) {
          return '<span class="home-chip is-warn">' + esc(s.name) +
                 ' <b>' + esc(s.running) + '/' + esc(s.desired) + '</b></span>';
        }).join('') + '</div>'
      : '<p class="home-note is-ok">' + esc(t('home.allHealthy')) + '</p>';

    el['swarm-body'].innerHTML =
      '<div class="home-figure">' +
        '<strong>' + esc(running) + '<small>/' + esc(desired) + '</small></strong>' +
        '<span>' + esc(t('home.replicas')) + '</span>' +
      '</div>' +
      '<div class="bar' + (degraded.length ? ' is-warn' : '') + '"><i style="width:' + width + '%"></i></div>' +
      detail;

    if (el['swarm-caption']) {
      el['swarm-caption'].textContent = t('home.swarmCaption', { count: services.length });
    }
  }

  /* Counts only, no per-node rows. `display_status` is added server-side and is
     the one field on a backup drop this code can rely on: the rest of the JSON
     is whatever the backup shell script chose to write, and guessing at a
     hostname key here would break the first time that script is edited. */
  function renderBackup() {
    if (!el['backup-body']) return;
    var backup = state.overview && state.overview.backup;
    var nodes = (backup && backup.nodes) || [];

    if (el['backup-caption']) {
      el['backup-caption'].textContent = backup && backup.most_recent
        ? UI.relative(backup.most_recent)
        : '';
    }

    if (!nodes.length) {
      el['backup-body'].innerHTML = '<p class="empty">' + esc(t('tile.backupNever')) + '</p>';
      return;
    }

    var counts = { ok: 0, stale: 0, failed: 0 };
    nodes.forEach(function (entry) {
      if (counts[entry.display_status] !== undefined) counts[entry.display_status] += 1;
    });
    var behind = counts.stale + counts.failed;
    var width = (counts.ok / nodes.length) * 100;

    var detail = behind
      ? '<div class="home-chips">' +
          (counts.stale ? '<span class="home-chip is-warn">' + esc(t('backup.stale')) + ' <b>' + counts.stale + '</b></span>' : '') +
          (counts.failed ? '<span class="home-chip is-crit">' + esc(t('backup.failed')) + ' <b>' + counts.failed + '</b></span>' : '') +
        '</div>'
      : '<p class="home-note is-ok">' + esc(t('home.backupsFresh')) + '</p>';

    el['backup-body'].innerHTML =
      '<div class="home-figure">' +
        '<strong>' + counts.ok + '<small>/' + nodes.length + '</small></strong>' +
        '<span>' + esc(t('home.backupNodes')) + '</span>' +
      '</div>' +
      '<div class="bar' + (counts.failed ? ' is-crit' : behind ? ' is-warn' : '') + '">' +
        '<i style="width:' + width + '%"></i></div>' +
      detail;
  }

  /* The single worst tile state, reused as May's mood. Same ordering the
     monitoring wall uses for its one-word verdict. */
  function worstState() {
    var tiles = state.overview && state.overview.tiles;
    if (!tiles) return 'unknown';
    var order = { critical: 3, warning: 2, unknown: 1, healthy: 0 };
    var worst = 'healthy';
    ['nodes', 'services', 'cluster', 'infrastructure', 'backup'].forEach(function (key) {
      var s = tiles[key] && tiles[key].state;
      if ((order[s] || 0) > (order[worst] || 0)) worst = s;
    });
    return worst;
  }

  function fact(label, value) {
    return '<dt>' + esc(label) + '</dt><dd>' + esc(value) + '</dd>';
  }

  /* May says what the numbers already say, in one sentence. Decorative, but it
     is the line that gets read first, so it is derived from the real state
     rather than picked at random. */
  function renderMay() {
    if (!el['may-body']) return;
    var data = state.overview;
    var swarm = data && data.swarm;
    var mood = worstState();

    var pair = function (a, b) { return a + ' / ' + b; };
    var readyLine = swarm ? pair(swarm.nodesReady, swarm.nodesTotal) : '—';
    var managerLine = swarm ? pair(swarm.managersReachable, swarm.managersTotal) : '—';
    var extra = (data && data.extraHosts) || [];
    var extraLine = extra.length
      ? pair(extra.filter(function (h) { return h.online; }).length, extra.length)
      : '—';

    el['may-body'].innerHTML =
      '<div class="may-say">' +
        '<img class="may-face" src="/static/img/may-avatar.jpg" alt="" width="420" height="420">' +
        '<p class="may-line" data-state="' + esc(mood) + '">' + esc(t('may.' + mood)) + '</p>' +
      '</div>' +
      '<dl class="home-facts">' +
        fact(t('home.factNodes'), readyLine) +
        fact(t('home.factManagers'), managerLine) +
        fact(t('home.factStandalone'), extraLine) +
        fact(t('home.factServices'), String(state.services.length)) +
      '</dl>' +
      '<p class="home-note faint">' + esc(t('home.mayNote')) + '</p>';
  }

  function renderHome() {
    if (!state.overview) return;
    renderLoad();
    renderSwarm();
    renderBackup();
    renderMay();
  }

  /* --- Services ---------------------------------------------------------- */

  function serviceTile(service) {
    var href = UI.safeUrl(service.url);
    // A Tabler icon class from the stored name, or the service's initials when
    // there is none — an older row with no icon still shows something.
    var cls = window.ZS_ICONS && window.ZS_ICONS.cls(service.icon);
    var glyph = cls ? '<i class="' + esc(cls) + '"></i>' : esc((service.name || '?').trim().slice(0, 2));
    var inner =
      '<span class="service-icon" aria-hidden="true">' + glyph + '</span>' +
      '<span class="service-text">' +
        '<strong>' + esc(service.name) + '</strong>' +
        '<span>' + esc(service.description || '') + '</span>' +
      '</span>';
    return href
      ? '<a class="service" href="' + esc(href) + '" target="_blank" rel="noopener noreferrer">' + inner + '</a>'
      : '<div class="service">' + inner + '</div>';
  }

  function renderServices() {
    var all = state.services;
    if (el['service-grid']) {
      el['service-grid'].innerHTML = all.length
        ? all.map(serviceTile).join('')
        : '<p class="empty">' + esc(t('home.noServices')) + '</p>';
    }
    if (el['services-caption']) {
      el['services-caption'].textContent = t('home.servicesCaption', { count: all.length });
    }

    [['ai', 'ai-grid'], ['cloud', 'cloud-grid']].forEach(function (pair) {
      var target = el[pair[1]];
      if (!target) return;
      var subset = all.filter(function (s) { return s.category === pair[0]; });
      target.innerHTML = subset.length
        ? subset.map(serviceTile).join('')
        : '<p class="empty">' + esc(t('home.noServicesCat')) + '</p>';
    });

    if (el['service-rows']) {
      el['service-rows'].innerHTML = all.length ? all.map(function (s) {
        var cls = (window.ZS_ICONS && window.ZS_ICONS.cls(s.icon)) || '';
        var ico = cls ? '<i class="' + esc(cls) + '"></i>' : '';
        return '<tr>' +
                 '<td><span class="row-icon">' + ico + '</span>' + esc(s.name) + '</td>' +
                 '<td><span class="badge">' + esc(t('cat.' + (s.category || 'general'))) + '</span></td>' +
                 '<td class="mono">' + esc(s.url || '—') + '</td>' +
                 '<td class="col-actions">' +
                   '<button type="button" class="btn btn-ghost btn-sm" data-service-edit="' + s.id + '">' + esc(t('common.edit')) + '</button> ' +
                   '<button type="button" class="btn btn-danger btn-sm" data-service-delete="' + s.id + '">' + esc(t('common.delete')) + '</button>' +
                 '</td>' +
               '</tr>';
      }).join('') : '<tr><td colspan="4" class="empty">' + esc(t('settings.noServices')) + '</td></tr>';
    }
  }

  /* --- Vault ------------------------------------------------------------- */

  function renderVault() {
    if (!el['vault-list']) return;
    var filter = state.vaultFilter.trim().toLowerCase();
    var entries = filter
      ? state.vault.filter(function (e) {
          return (e.title + ' ' + e.username + ' ' + (e.url || '')).toLowerCase().indexOf(filter) !== -1;
        })
      : state.vault;

    if (!state.vault.length) {
      el['vault-list'].innerHTML = '<p class="empty">' + esc(t('vault.empty')) + '</p>';
      return;
    }
    if (!entries.length) {
      el['vault-list'].innerHTML = '<p class="empty">' + esc(t('vault.noMatch')) + '</p>';
      return;
    }

    el['vault-list'].innerHTML = entries.map(function (entry) {
      var sub = entry.undecryptable
        ? '<span style="color:var(--crit)">' + esc(t('vault.broken')) + '</span>'
        : '<span>' + esc(entry.username || entry.url || '—') + '</span>';
      return '<div class="vault-entry' + (entry.undecryptable ? ' is-broken' : '') + '">' +
               '<div class="vault-main"><strong>' + esc(entry.title) + '</strong>' + sub + '</div>' +
               '<div class="vault-actions">' +
                 (entry.undecryptable ? '' :
                   '<button type="button" class="btn btn-ghost btn-sm" data-vault-copy="' + entry.id + '">' + esc(t('common.copy')) + '</button>') +
                 '<button type="button" class="btn btn-ghost btn-sm" data-vault-edit="' + entry.id + '">' + esc(t('common.edit')) + '</button>' +
                 '<button type="button" class="btn btn-danger btn-sm" data-vault-delete="' + entry.id + '">' + esc(t('common.delete')) + '</button>' +
               '</div>' +
             '</div>';
    }).join('');
  }

  function openVaultModal(entry) {
    $('vault-error').hidden = true;
    $('vault-id').value = entry ? entry.id : '';
    $('vault-title').value = entry ? entry.title : '';
    $('vault-username').value = entry ? (entry.username || '') : '';
    $('vault-password').value = entry ? (entry.password || '') : '';
    $('vault-url').value = entry ? (entry.url || '') : '';
    $('vault-notes').value = entry ? (entry.notes || '') : '';
    $('vault-password').type = 'password';
    $('vault-modal-title').textContent = t(entry ? 'vault.editTitle' : 'vault.new');
    UI.openModal('vault');
  }

  function wireVault() {
    if (el['vault-search']) {
      el['vault-search'].addEventListener('input', function () {
        state.vaultFilter = el['vault-search'].value;
        renderVault();
      });
    }
    if ($('vault-new')) {
      $('vault-new').addEventListener('click', function () { openVaultModal(null); });
    }
    if ($('vault-generate')) {
      $('vault-generate').addEventListener('click', function () {
        $('vault-password').value = window.PasswordStrength.generate(24);
        $('vault-password').type = 'text';
      });
    }

    document.addEventListener('click', async function (event) {
      var copyBtn = event.target.closest('[data-vault-copy]');
      if (copyBtn) {
        var found = state.vault.find(function (e) { return String(e.id) === copyBtn.dataset.vaultCopy; });
        if (found) await UI.copyWithFeedback(found.password || '', copyBtn);
        return;
      }
      var editBtn = event.target.closest('[data-vault-edit]');
      if (editBtn) {
        var entry = state.vault.find(function (e) { return String(e.id) === editBtn.dataset.vaultEdit; });
        if (entry) openVaultModal(entry);
        return;
      }
      var delBtn = event.target.closest('[data-vault-delete]');
      if (delBtn) {
        var target = state.vault.find(function (e) { return String(e.id) === delBtn.dataset.vaultDelete; });
        if (!target || !window.confirm(t('vault.confirmDelete', { title: target.title }))) return;
        try {
          await API.del('/api/vault/' + target.id);
          await loadVault();
        } catch (err) { banner(err.message, 'error'); }
      }
    });

    $('vault-form').addEventListener('submit', async function (event) {
      event.preventDefault();
      var errorBox = $('vault-error');
      errorBox.hidden = true;
      var id = $('vault-id').value;
      var payload = {
        title: $('vault-title').value,
        username: $('vault-username').value,
        password: $('vault-password').value,
        url: $('vault-url').value,
        notes: $('vault-notes').value
      };
      try {
        if (id) await API.put('/api/vault/' + id, payload);
        else await API.post('/api/vault', payload);
        UI.closeAll();
        await loadVault();
      } catch (err) {
        errorBox.textContent = err.message;
        errorBox.hidden = false;
      }
    });
  }

  async function loadVault() {
    try {
      state.vault = await API.get('/api/vault');
      renderVault();
    } catch (err) {
      if (err.code === 'VAULT_LOCKED') {
        el['vault-list'].innerHTML = '<p class="empty">' + esc(err.message) + '</p>';
      } else {
        banner(err.message, 'error');
      }
    }
  }

  /* --- Settings: appearance --------------------------------------------- */

  var PRESET_COLOURS = {
    aurora: '#2f7dfb', cyan: '#22c3d6', violet: '#8b5cf6',
    ember: '#f97316', mint: '#22c58b', rose: '#f43f7e'
  };

  async function saveTheme(value) {
    window.ZS_THEME.save(value);
    renderSwatches();
    try {
      await API.put('/api/user/theme', { theme: value });
    } catch (err) {
      // A failed save is not worth a banner: the colour is applied locally and
      // is a display preference. Log it and move on.
      console.warn('[theme] not persisted:', err.message);
    }
  }

  function renderSwatches() {
    if (!el.swatches) return;
    var current = window.ZS_THEME.current();
    el.swatches.innerHTML = Object.keys(PRESET_COLOURS).map(function (name) {
      var colour = PRESET_COLOURS[name];
      return '<button type="button" class="swatch" data-theme-set="' + name + '"' +
             ' style="background:' + colour + ';color:' + colour + '"' +
             ' aria-pressed="' + (current === name) + '"' +
             ' title="' + esc(name) + '" aria-label="' + esc(name) + '"></button>';
    }).join('');
    if (el['accent-value']) {
      el['accent-value'].textContent = PRESET_COLOURS[current] || current;
    }
  }

  function wireSettings() {
    document.addEventListener('click', function (event) {
      var swatch = event.target.closest('[data-theme-set]');
      if (swatch) saveTheme(swatch.dataset.themeSet);
    });

    if (el['accent-custom']) {
      el['accent-custom'].addEventListener('input', function () {
        if (el['accent-value']) el['accent-value'].textContent = el['accent-custom'].value;
      });
      el['accent-custom'].addEventListener('change', function () {
        saveTheme(el['accent-custom'].value);
      });
    }

    if (el['chibi-enabled']) {
      el['chibi-enabled'].checked = window.ZS_CHIBI ? window.ZS_CHIBI.isEnabled() : true;
      el['chibi-enabled'].addEventListener('change', function () {
        if (window.ZS_CHIBI) window.ZS_CHIBI.setEnabled(el['chibi-enabled'].checked);
      });
    }

    var pwForm = $('password-form');
    if (pwForm) {
      window.PasswordStrength.attach($('new-password'), $('pw-meter'), $('pw-label'));
      pwForm.addEventListener('submit', async function (event) {
        event.preventDefault();
        var errorBox = $('password-error');
        var okBox = $('password-ok');
        errorBox.hidden = true;
        okBox.hidden = true;
        try {
          await API.post('/api/change-password', {
            currentPassword: $('current-password').value,
            newPassword: $('new-password').value
          });
          okBox.textContent = t('settings.pwChanged');
          okBox.hidden = false;
          pwForm.reset();
          $('pw-meter').setAttribute('data-score', '0');
          $('pw-label').textContent = '';
        } catch (err) {
          errorBox.textContent = err.message;
          errorBox.hidden = false;
        }
      });
    }

    if ($('logout')) {
      $('logout').addEventListener('click', async function () {
        try { await API.post('/api/logout'); } catch (err) { /* leaving anyway */ }
        window.location.href = '/login';
      });
    }

    if ($('refresh')) {
      $('refresh').addEventListener('click', function () { loadOverview(); });
    }
  }

  /* --- Two-factor authentication ------------------------------------------ */

  function renderTwofaState() {
    var on = !!(state.me && state.me.totpEnabled);
    if (el['twofa-off']) el['twofa-off'].hidden = on;
    if (el['twofa-on']) el['twofa-on'].hidden = !on;
  }

  function resetTwofaUi() {
    ['twofa-password-form', 'twofa-setup', 'twofa-recovery', 'twofa-disable-form'].forEach(function (id) {
      if (el[id]) el[id].hidden = true;
    });
    if (el['twofa-password']) el['twofa-password'].value = '';
    if (el['twofa-verify-code']) el['twofa-verify-code'].value = '';
    if (el['twofa-disable-password']) el['twofa-disable-password'].value = '';
    if (el['twofa-disable-code']) el['twofa-disable-code'].value = '';
  }

  function wireTwofa() {
    if (el['twofa-enable-btn']) {
      el['twofa-enable-btn'].addEventListener('click', function () {
        resetTwofaUi();
        el['twofa-password-form'].hidden = false;
        el['twofa-password'].focus();
      });
    }
    if (el['twofa-password-cancel']) {
      el['twofa-password-cancel'].addEventListener('click', resetTwofaUi);
    }
    if (el['twofa-password-form']) {
      el['twofa-password-form'].addEventListener('submit', async function (event) {
        event.preventDefault();
        var errorBox = el['twofa-password-error'];
        errorBox.hidden = true;
        try {
          var data = await API.post('/api/2fa/setup', { password: el['twofa-password'].value });
          el['twofa-password-form'].hidden = true;
          el['twofa-setup'].hidden = false;
          el['twofa-qr'].src = data.qrDataUri;
          el['twofa-secret'].textContent = data.secret;
          el['twofa-verify-code'].focus();
        } catch (err) {
          errorBox.textContent = err.message;
          errorBox.hidden = false;
        }
      });
    }
    if (el['twofa-verify-form']) {
      el['twofa-verify-form'].addEventListener('submit', async function (event) {
        event.preventDefault();
        var errorBox = el['twofa-verify-error'];
        errorBox.hidden = true;
        try {
          var data = await API.post('/api/2fa/verify', { code: el['twofa-verify-code'].value.trim() });
          el['twofa-setup'].hidden = true;
          el['twofa-recovery'].hidden = false;
          el['twofa-recovery-codes'].innerHTML = data.recoveryCodes.map(esc).join('<br>');
          if (state.me) state.me.totpEnabled = true;
        } catch (err) {
          errorBox.textContent = err.message;
          errorBox.hidden = false;
          el['twofa-verify-code'].value = '';
        }
      });
    }
    if (el['twofa-recovery-done']) {
      el['twofa-recovery-done'].addEventListener('click', function () {
        resetTwofaUi();
        renderTwofaState();
      });
    }
    if (el['twofa-disable-btn']) {
      el['twofa-disable-btn'].addEventListener('click', function () {
        resetTwofaUi();
        el['twofa-disable-form'].hidden = false;
        el['twofa-disable-password'].focus();
      });
    }
    if (el['twofa-disable-cancel']) {
      el['twofa-disable-cancel'].addEventListener('click', resetTwofaUi);
    }
    if (el['twofa-disable-form']) {
      el['twofa-disable-form'].addEventListener('submit', async function (event) {
        event.preventDefault();
        var errorBox = el['twofa-disable-error'];
        errorBox.hidden = true;
        try {
          await API.post('/api/2fa/disable', {
            password: el['twofa-disable-password'].value,
            code: el['twofa-disable-code'].value.trim()
          });
          if (state.me) state.me.totpEnabled = false;
          resetTwofaUi();
          renderTwofaState();
        } catch (err) {
          errorBox.textContent = err.message;
          errorBox.hidden = false;
        }
      });
    }
  }

  /* --- Admin: invites ---------------------------------------------------- */

  function renderInvites() {
    if (!el['invite-rows']) return;
    if (!state.invites.length) {
      el['invite-rows'].innerHTML = '<tr><td colspan="6" class="empty">' + esc(t('settings.noInvites')) + '</td></tr>';
      return;
    }
    el['invite-rows'].innerHTML = state.invites.map(function (invite) {
      var badgeClass = invite.status === 'active' ? 'badge-ok'
                     : invite.status === 'used' ? 'badge-accent' : 'badge-warn';
      return '<tr>' +
               '<td class="code-cell">' + esc(invite.code) + '</td>' +
               '<td><span class="badge ' + badgeClass + '">' + esc(t('status.' + invite.status)) + '</span></td>' +
               '<td>' + esc(t('role.' + invite.max_role)) + '</td>' +
               '<td>' + esc(UI.dateTime(invite.expires_at)) + '</td>' +
               '<td>' + esc(invite.used_by_name || '—') + '</td>' +
               '<td class="col-actions">' +
                 '<button type="button" class="btn btn-ghost btn-sm" data-invite-copy="' + esc(invite.code) + '">' + esc(t('common.copy')) + '</button> ' +
                 (invite.status === 'used' ? '' :
                   '<button type="button" class="btn btn-danger btn-sm" data-invite-revoke="' + invite.id + '">' + esc(t('settings.revoke')) + '</button>') +
               '</td>' +
             '</tr>';
    }).join('');
  }

  function showFreshInvite(invite) {
    if (!el['invite-fresh']) return;
    el['invite-code'].textContent = invite.code;
    el['invite-meta'].textContent = t('settings.inviteMeta', {
      role: t('role.' + invite.max_role),
      date: UI.dateTime(invite.expires_at)
    });
    el['invite-fresh'].hidden = false;
    el['invite-fresh'].dataset.code = invite.code;
  }

  function wireInvites() {
    var form = $('invite-form');
    if (form) {
      form.addEventListener('submit', async function (event) {
        event.preventDefault();
        try {
          var invite = await API.post('/api/invite', {
            expiresInDays: Number($('invite-days').value) || 7,
            maxRole: $('invite-role').value
          });
          showFreshInvite(invite);
          await loadInvites();
        } catch (err) { banner(err.message, 'error'); }
      });
    }

    if ($('invite-copy')) {
      $('invite-copy').addEventListener('click', function (event) {
        UI.copyWithFeedback(el['invite-fresh'].dataset.code || '', event.currentTarget);
      });
    }
    if ($('invite-copy-link')) {
      $('invite-copy-link').addEventListener('click', function (event) {
        var url = window.location.origin + '/register?code=' + (el['invite-fresh'].dataset.code || '');
        UI.copyWithFeedback(url, event.currentTarget);
      });
    }

    document.addEventListener('click', async function (event) {
      var copyBtn = event.target.closest('[data-invite-copy]');
      if (copyBtn) {
        await UI.copyWithFeedback(copyBtn.dataset.inviteCopy, copyBtn);
        return;
      }
      var revokeBtn = event.target.closest('[data-invite-revoke]');
      if (revokeBtn) {
        if (!window.confirm(t('settings.confirmRevoke'))) return;
        try {
          await API.del('/api/invite/' + revokeBtn.dataset.inviteRevoke);
          await loadInvites();
        } catch (err) { banner(err.message, 'error'); }
      }
    });
  }

  async function loadInvites() {
    try {
      state.invites = await API.get('/api/invites');
      renderInvites();
    } catch (err) { banner(err.message, 'error'); }
  }

  /* --- Admin: users ------------------------------------------------------ */

  function renderUsers() {
    if (!el['user-rows']) return;
    el['user-rows'].innerHTML = state.users.map(function (user) {
      var isSelf = state.me && user.username === state.me.username;
      var locked = user.locked || user.locked_until;
      var statusHtml = locked
        ? '<span class="badge badge-crit">' + esc(user.locked ? t('settings.locked')
            : t('settings.lockedUntil', { time: UI.dateTime(user.locked_until) })) + '</span>'
        : '<span class="badge badge-ok">' + esc(t('settings.active')) + '</span>';

      var actions = '';
      if (locked) {
        actions += '<button type="button" class="btn btn-ghost btn-sm" data-user-unlock="' + user.id + '">' + esc(t('settings.unlock')) + '</button> ';
      } else if (!isSelf) {
        actions += '<button type="button" class="btn btn-ghost btn-sm" data-user-lock="' + user.id + '">' + esc(t('settings.lock')) + '</button> ';
      }
      if (user.totp_enabled) {
        actions += '<button type="button" class="btn btn-ghost btn-sm" data-user-reset2fa="' + user.id + '">' + esc(t('twofa.reset')) + '</button> ';
      }
      if (!isSelf) {
        var nextRole = user.role === 'admin' ? 'viewer' : 'admin';
        actions += '<button type="button" class="btn btn-ghost btn-sm" data-user-role="' + user.id + '" data-role="' + nextRole + '">→ ' + esc(t('role.' + nextRole)) + '</button> ';
        actions += '<button type="button" class="btn btn-ghost btn-sm" data-user-reset="' + user.id + '" data-name="' + esc(user.username) + '">' + esc(t('settings.resetPw')) + '</button> ';
        actions += '<button type="button" class="btn btn-danger btn-sm" data-user-delete="' + user.id + '" data-name="' + esc(user.username) + '">' + esc(t('common.delete')) + '</button>';
      }

      var twofaHtml = user.totp_enabled
        ? '<span class="badge badge-ok">' + esc(t('twofa.columnOn')) + '</span>'
        : '<span class="faint">' + esc(t('twofa.columnOff')) + '</span>';

      return '<tr>' +
               '<td>' + esc(user.username) + (isSelf ? ' <span class="faint">(you)</span>' : '') + '</td>' +
               '<td><span class="badge ' + (user.role === 'admin' ? 'badge-accent' : '') + '">' + esc(t('role.' + user.role)) + '</span></td>' +
               '<td>' + statusHtml + '</td>' +
               '<td>' + twofaHtml + '</td>' +
               '<td class="col-actions">' + actions + '</td>' +
             '</tr>';
    }).join('');
  }

  function wireUsers() {
    if ($('reset-generate')) {
      $('reset-generate').addEventListener('click', function () {
        $('reset-password').value = window.PasswordStrength.generate(24);
        $('reset-password').type = 'text';
      });
    }

    var resetForm = $('reset-form');
    if (resetForm) {
      resetForm.addEventListener('submit', async function (event) {
        event.preventDefault();
        var errorBox = $('reset-error');
        errorBox.hidden = true;
        try {
          await API.put('/api/users/' + $('reset-id').value + '/password', {
            password: $('reset-password').value
          });
          UI.closeAll();
          banner(t('settings.pwReset'), 'ok');
          await loadUsers();
        } catch (err) {
          errorBox.textContent = err.message;
          errorBox.hidden = false;
        }
      });
    }

    document.addEventListener('click', async function (event) {
      var reset = event.target.closest('[data-user-reset]');
      if (reset) {
        $('reset-error').hidden = true;
        $('reset-id').value = reset.dataset.userReset;
        $('reset-password').value = '';
        $('reset-password').type = 'password';
        $('reset-target').textContent = reset.dataset.name;
        UI.openModal('reset');
        return;
      }
      var unlock = event.target.closest('[data-user-unlock]');
      var lock = event.target.closest('[data-user-lock]');
      var role = event.target.closest('[data-user-role]');
      var del = event.target.closest('[data-user-delete]');
      var reset2fa = event.target.closest('[data-user-reset2fa]');
      try {
        if (unlock) { await API.post('/api/users/' + unlock.dataset.userUnlock + '/unlock'); await loadUsers(); }
        else if (lock) { await API.post('/api/users/' + lock.dataset.userLock + '/lock'); await loadUsers(); }
        else if (role) { await API.put('/api/users/' + role.dataset.userRole + '/role', { role: role.dataset.role }); await loadUsers(); }
        else if (reset2fa) {
          if (!window.confirm(t('twofa.confirmReset'))) return;
          await API.post('/api/users/' + reset2fa.dataset.userReset2fa + '/reset-2fa');
          await loadUsers();
        }
        else if (del) {
          if (!window.confirm(t('settings.confirmDeleteUser', { name: del.dataset.name }))) return;
          await API.del('/api/users/' + del.dataset.userDelete);
          await loadUsers();
        }
      } catch (err) { banner(err.message, 'error'); }
    });
  }

  async function loadUsers() {
    try {
      state.users = await API.get('/api/users');
      renderUsers();
    } catch (err) { banner(err.message, 'error'); }
  }

  /* --- Admin: services --------------------------------------------------- */

  // The icon field is a free Tabler name with a live preview. Typing updates the
  // preview; a quick-pick chip fills the name. The value rides in #service-icon
  // like any other field, so the submit handler needs no special case.
  function updateIconPreview() {
    var input = $('service-icon');
    var preview = $('icon-preview');
    if (!input || !preview) return;
    input.value = window.ZS_ICONS.sanitize(input.value);
    var cls = window.ZS_ICONS.cls(input.value);
    // esc() is redundant here (ZS_ICONS.sanitize already reduces the value to
    // [a-z0-9-]) but keeps the "everything reaching innerHTML is escaped" rule
    // true by grep rather than by argument.
    preview.innerHTML = cls ? '<i class="' + esc(cls) + '"></i>' : '<i class="ti ti-help"></i>';
    preview.classList.toggle('is-empty', !cls);
  }

  function setIcon(name) {
    var input = $('service-icon');
    if (input) input.value = window.ZS_ICONS.sanitize(name);
    updateIconPreview();
  }

  function buildIconSuggest() {
    var box = $('icon-suggest');
    if (!box || !window.ZS_ICONS) return;
    box.innerHTML = window.ZS_ICONS.suggest.map(function (name) {
      var safe = esc(name);
      return '<button type="button" class="icon-chip" data-icon="' + safe +
             '" title="' + safe + '"><i class="ti ti-' + safe + '"></i></button>';
    }).join('');
    box.addEventListener('click', function (event) {
      var chip = event.target.closest('[data-icon]');
      if (chip) setIcon(chip.dataset.icon);
    });
    var input = $('service-icon');
    if (input) input.addEventListener('input', updateIconPreview);
  }

  function wireServiceAdmin() {
    buildIconSuggest();

    if ($('service-new')) {
      $('service-new').addEventListener('click', function () {
        $('service-error').hidden = true;
        $('service-id').value = '';
        $('service-name').value = '';
        $('service-desc').value = '';
        $('service-url').value = '';
        $('service-category').value = 'general';
        setIcon('grid-dots');
        $('service-modal-title').textContent = t('settings.serviceNew');
        UI.openModal('service');
      });
    }

    document.addEventListener('click', async function (event) {
      var editBtn = event.target.closest('[data-service-edit]');
      if (editBtn) {
        var service = state.services.find(function (s) { return String(s.id) === editBtn.dataset.serviceEdit; });
        if (!service) return;
        $('service-error').hidden = true;
        $('service-id').value = service.id;
        $('service-name').value = service.name;
        $('service-desc').value = service.description || '';
        $('service-url').value = service.url || '';
        $('service-category').value = service.category || 'general';
        setIcon(service.icon || 'grid-dots');
        $('service-modal-title').textContent = t('settings.serviceEdit');
        UI.openModal('service');
        return;
      }
      var delBtn = event.target.closest('[data-service-delete]');
      if (delBtn) {
        var target = state.services.find(function (s) { return String(s.id) === delBtn.dataset.serviceDelete; });
        if (!target || !window.confirm(t('settings.confirmDeleteService', { name: target.name }))) return;
        try {
          await API.del('/api/services/' + target.id);
          await loadServices();
        } catch (err) { banner(err.message, 'error'); }
      }
    });

    var form = $('service-form');
    if (form) {
      form.addEventListener('submit', async function (event) {
        event.preventDefault();
        var errorBox = $('service-error');
        errorBox.hidden = true;
        var id = $('service-id').value;
        var payload = {
          name: $('service-name').value,
          description: $('service-desc').value,
          url: $('service-url').value,
          category: $('service-category').value,
          icon: window.ZS_ICONS.sanitize($('service-icon').value) || 'grid-dots'
        };
        try {
          if (id) await API.put('/api/services/' + id, payload);
          else await API.post('/api/services', payload);
          UI.closeAll();
          await loadServices();
        } catch (err) {
          errorBox.textContent = err.message;
          errorBox.hidden = false;
        }
      });
    }
  }

  /* --- Admin: audit ------------------------------------------------------ */

  function statChip(value, label, mod) {
    return '<span class="stat' + (mod ? ' ' + mod : '') + '">' +
             '<b>' + esc(value) + '</b> ' + esc(label) +
           '</span>';
  }

  /* Aggregate read of the fetched window, so an admin gets the "is anyone
     knocking" answer without scanning every row. Everything is derived from the
     rows already loaded — no extra request. */
  function renderAuditSummary(attempts) {
    var box = el['audit-summary'];
    if (!box) return;
    if (!attempts.length) { box.hidden = true; box.innerHTML = ''; return; }
    var failed = 0, ips = {}, users = {};
    attempts.forEach(function (row) {
      if (!row.success) failed += 1;
      if (row.ip) ips[row.ip] = true;
      if (row.username) users[row.username] = true;
    });
    var chips = [statChip(attempts.length, t('settings.auditEvents'))];
    if (failed) chips.push(statChip(failed, t('settings.auditFailed'), 'is-fail'));
    chips.push(statChip(attempts.length - failed, t('settings.auditOk'), 'is-ok'));
    chips.push(statChip(Object.keys(ips).length, t('settings.auditIps')));
    chips.push(statChip(Object.keys(users).length, t('settings.auditAccounts')));
    box.innerHTML = chips.join('');
    box.hidden = false;
  }

  function renderAudit() {
    if (!el['audit-rows']) return;
    renderAuditSummary(state.attempts);
    if (!state.attempts.length) {
      el['audit-rows'].innerHTML = '<tr><td colspan="5" class="empty">' + esc(t('settings.noAttempts')) + '</td></tr>';
      return;
    }
    el['audit-rows'].innerHTML = state.attempts.map(function (row) {
      // Relative time answers "is this happening now?" more directly than a
      // wall-clock stamp, and stays short; the exact time is on hover.
      return '<tr>' +
               '<td title="' + esc(UI.dateTime(row.created_at)) + '">' + esc(UI.relative(row.created_at)) + '</td>' +
               '<td>' + esc(row.username || '—') + '</td>' +
               '<td class="mono">' + esc(row.ip || '—') + '</td>' +
               '<td>' + esc(row.kind) + '</td>' +
               '<td><span class="badge ' + (row.success ? 'badge-ok' : 'badge-crit') + '">' +
                 esc(t(row.success ? 'status.success' : 'status.failed')) + '</span></td>' +
             '</tr>';
    }).join('');
  }

  async function loadAudit() {
    try {
      state.attempts = await API.get('/api/login-attempts?limit=60');
      renderAudit();
    } catch (err) { banner(err.message, 'error'); }
  }

  async function loadAdmin() {
    await Promise.all([loadInvites(), loadUsers(), loadAudit()]);
  }

  /* --- Data loading ------------------------------------------------------ */

  async function loadOverview() {
    try {
      state.overview = await API.get('/api/overview');
      renderTiles();
      renderHome();
      banner(state.overview.error ? t('err.' + state.overview.error) : null, 'warn');
    } catch (err) {
      banner(err.message, 'error');
    }
  }

  async function loadServices() {
    try {
      state.services = await API.get('/api/services');
      renderServices();
      // May's fact list counts the launcher entries, and the two lists load
      // independently — whichever finishes last has to redraw her.
      renderMay();
    } catch (err) { banner(err.message, 'error'); }
  }

  /* --- Boot -------------------------------------------------------------- */

  function finishLoading() {
    if (!el['loading-overlay']) return;
    el['loading-overlay'].classList.add('is-done');
    // Remove it from the tree once the fade is over, so it cannot swallow
    // clicks on a browser that ignores `visibility`.
    window.setTimeout(function () {
      if (el['loading-overlay'].parentNode) el['loading-overlay'].parentNode.removeChild(el['loading-overlay']);
    }, 600);
  }

  async function init() {
    cacheElements();
    wireNavigation();
    wireSettingsTabs();
    wireVault();
    wireSettings();
    wireTwofa();
    wireInvites();
    wireUsers();
    wireServiceAdmin();

    try {
      state.me = await API.get('/api/me');
    } catch (err) {
      // No session, or the session died while the tab was open. Either way the
      // only useful destination is the login page.
      window.location.href = '/login';
      return;
    }

    API.setCsrfToken(state.me.csrfToken);
    state.isAdmin = state.me.role === 'admin';

    if (el['who-name']) el['who-name'].textContent = state.me.username;
    if (el['who-role']) el['who-role'].textContent = t('role.' + state.me.role);
    document.querySelectorAll('.admin-only').forEach(function (node) { node.hidden = !state.isAdmin; });

    // The server-stored theme is the account's preference and wins over what
    // this browser happens to remember — otherwise signing in on a new machine
    // silently overwrites the colour you picked.
    if (state.me.theme) window.ZS_THEME.save(state.me.theme);
    renderSwatches();
    renderGreeting();
    renderTwofaState();

    await Promise.all([loadOverview(), loadServices()]);

    setView(window.location.hash.slice(1) || 'home');
    finishLoading();

    // Poll only while the tab is visible. A dashboard left open on a second
    // monitor overnight would otherwise hit Glances on nine hosts every 15
    // seconds for no reader.
    function schedule() {
      window.clearInterval(pollTimer);
      pollTimer = window.setInterval(function () {
        if (!document.hidden) loadOverview();
      }, POLL_INTERVAL);
    }
    schedule();
    document.addEventListener('visibilitychange', function () {
      if (!document.hidden) loadOverview();
    });
  }

  /* Markup built above carries no data-i18n attributes, so applyI18n() cannot
     reach it. Re-render every JS-owned view on a language switch. */
  window.addEventListener('languagechange:zs', function () {
    if (el['view-title']) el['view-title'].textContent = t('view.' + state.view);
    if (el['who-role'] && state.me) el['who-role'].textContent = t('role.' + state.me.role);
    renderGreeting();
    renderTiles();
    renderHome();
    renderServices();
    renderVault();
    renderInvites();
    renderUsers();
    renderAudit();
    if (window.ZS_AI) window.ZS_AI.render();
  });

  document.addEventListener('DOMContentLoaded', init);
})();
