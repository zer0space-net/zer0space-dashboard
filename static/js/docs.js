/* Renders the handbook from window.ZS_DOCS.

   The content itself is data (static/js/docs-content.js), which this file turns
   into DOM. Three things it owns beyond that: the table of contents, the search
   filter, and the scroll spy that highlights the section you are looking at.

   Nothing here touches innerHTML. Every node is created and every string is set
   with textContent, so a stray `<` in a code sample renders as a `<` instead of
   opening a tag — the same rule the rest of the app follows via ZS_UI.esc(),
   arrived at from the other side.

   The whole body is re-rendered on `languagechange:zs`: the blocks carry no
   data-i18n attributes (applyI18n only reaches textContent, and a block can be a
   table or a code sample), so redrawing is the mechanism, exactly as app.js does
   for its JS-rendered views. */
(function () {
  'use strict';

  var DOCS = window.ZS_DOCS || { version: '', sections: [] };

  var root = document.getElementById('docs');
  var body = document.getElementById('docs-body');
  var toc = document.getElementById('docs-toc');
  var search = document.getElementById('docs-search');
  var empty = document.getElementById('docs-empty');
  var content = document.getElementById('main');

  /* --- Inline markup ------------------------------------------------------
     A deliberately tiny subset — `code`, **strong** and [text](url) — because
     documentation prose needs exactly those three and nothing more. It returns
     a DocumentFragment of real nodes rather than an HTML string, so there is no
     escaping question to get wrong. */

  var INLINE = /`([^`]+)`|\*\*([^*]+)\*\*|\[([^\]]+)\]\(([^)]+)\)/g;

  function inline(text) {
    var fragment = document.createDocumentFragment();
    var value = String(text === null || text === undefined ? '' : text);
    var last = 0;
    var match;
    INLINE.lastIndex = 0;
    while ((match = INLINE.exec(value)) !== null) {
      if (match.index > last) {
        fragment.appendChild(document.createTextNode(value.slice(last, match.index)));
      }
      if (match[1] !== undefined) {
        fragment.appendChild(el('code', null, match[1]));
      } else if (match[2] !== undefined) {
        fragment.appendChild(el('strong', null, match[2]));
      } else {
        var href = window.ZS_UI.safeUrl(match[4]);
        if (href) {
          var link = el('a', null, match[3]);
          link.href = href;
          // Only off-site links open in a new tab; an in-app link should stay in
          // the tab the reader is already in.
          if (/^https?:/i.test(match[4]) && match[4].indexOf(window.location.origin) !== 0) {
            link.target = '_blank';
            link.rel = 'noopener';
          }
          fragment.appendChild(link);
        } else {
          fragment.appendChild(document.createTextNode(match[3]));
        }
      }
      last = match.index + match[0].length;
    }
    if (last < value.length) fragment.appendChild(document.createTextNode(value.slice(last)));
    return fragment;
  }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = text;
    return node;
  }

  function icon(name) {
    var i = document.createElement('i');
    i.className = 'ti ti-' + name;
    i.setAttribute('aria-hidden', 'true');
    return i;
  }

  /* Pick the active language out of a block, falling back to German the same way
     I18N.t does — a half-translated block should degrade to the other language
     rather than to a blank paragraph. */
  function pick(value) {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string') return value;
    var lang = window.I18N.lang;
    if (value[lang] !== undefined) return value[lang];
    if (value.de !== undefined) return value.de;
    if (value.en !== undefined) return value.en;
    return '';
  }

  /* --- Block renderers ---------------------------------------------------- */

  var RENDER = {
    p: function (block) {
      var p = el('p', 'doc-p');
      p.appendChild(inline(pick(block)));
      return p;
    },

    lead: function (block) {
      var p = el('p', 'doc-kicker');
      p.appendChild(inline(pick(block)));
      return p;
    },

    h3: function (block) {
      return el('h3', null, pick(block));
    },

    h4: function (block) {
      return el('h4', null, pick(block));
    },

    ul: function (block) {
      var list = el('ul', 'doc-list' + (block.numbered ? ' is-numbered' : ''));
      (pick(block) || []).forEach(function (item) {
        var li = document.createElement('li');
        li.appendChild(inline(item));
        list.appendChild(li);
      });
      return list;
    },

    code: function (block) {
      var wrap = el('div', 'doc-code');
      var head = el('div', 'doc-code-head');
      head.appendChild(el('span', 'doc-code-lang', block.lang || 'text'));
      if (block.file) head.appendChild(el('span', 'doc-code-file', block.file));

      var copy = el('button', 'doc-code-copy', window.I18N.t('common.copy'));
      copy.type = 'button';
      copy.addEventListener('click', function () {
        window.ZS_UI.copyWithFeedback(block.code, copy);
      });
      head.appendChild(copy);
      wrap.appendChild(head);

      var pre = document.createElement('pre');
      pre.appendChild(el('code', null, block.code));
      wrap.appendChild(pre);
      return wrap;
    },

    /* An ASCII diagram. Same box as a code block minus the chrome: there is
       nothing to copy and no language to name.

       `code` is bilingual here, unlike in a `code` block. A code sample is
       shared between the languages on purpose — a translated identifier would
       stop matching the source it documents — but a diagram is prose in a box,
       and a German diagram inside the English page is simply untranslated. A
       plain string is still accepted for the rare diagram with no words in it. */
    figure: function (block) {
      var wrap = el('div', 'doc-code doc-figure');
      var pre = document.createElement('pre');
      pre.appendChild(el('code', null, pick(block.code)));
      wrap.appendChild(pre);
      return wrap;
    },

    tree: function (block) {
      var wrap = el('div', 'doc-tree');
      wrap.appendChild(inline(block.code));
      return wrap;
    },

    table: function (block) {
      var wrap = el('div', 'doc-table-wrap');
      var table = el('table', 'table');
      var thead = document.createElement('thead');
      var headRow = document.createElement('tr');
      (pick(block.head) || []).forEach(function (cell) {
        headRow.appendChild(el('th', null, cell));
      });
      thead.appendChild(headRow);
      table.appendChild(thead);

      var tbody = document.createElement('tbody');
      (pick(block.rows) || []).forEach(function (row) {
        var tr = document.createElement('tr');
        row.forEach(function (cell) {
          var td = document.createElement('td');
          td.appendChild(inline(cell));
          tr.appendChild(td);
        });
        tbody.appendChild(tr);
      });
      table.appendChild(tbody);
      wrap.appendChild(table);
      return wrap;
    },

    note: function (block) {
      var tone = block.tone || 'info';
      var wrap = el('div', 'doc-note');
      wrap.setAttribute('data-tone', tone);
      wrap.appendChild(icon({
        info: 'info-circle',
        warn: 'alert-triangle',
        crit: 'alert-octagon',
        ok: 'circle-check'
      }[tone] || 'info-circle'));
      var inner = el('div', 'doc-note-body');
      if (block.title) inner.appendChild(el('strong', 'doc-note-title', pick(block.title)));
      var p = document.createElement('span');
      p.appendChild(inline(pick(block)));
      inner.appendChild(p);
      wrap.appendChild(inner);
      return wrap;
    }
  };

  /* --- Page --------------------------------------------------------------- */

  function renderSection(section) {
    var node = el('section', 'doc-section');
    node.id = section.id;

    var head = el('div', 'doc-head');
    head.appendChild(icon(section.icon || 'book-2'));
    head.appendChild(el('h2', null, pick(section.title)));
    node.appendChild(head);

    (section.blocks || []).forEach(function (block) {
      var render = RENDER[block.type];
      if (render) node.appendChild(render(block));
    });
    return node;
  }

  function render() {
    body.textContent = '';
    toc.textContent = '';

    DOCS.sections.forEach(function (section) {
      body.appendChild(renderSection(section));

      var link = el('a', 'docs-toc-link');
      link.href = '#' + section.id;
      link.setAttribute('data-target', section.id);
      link.appendChild(icon(section.icon || 'book-2'));
      link.appendChild(el('span', null, pick(section.title)));
      toc.appendChild(link);
    });

    var version = document.getElementById('docs-version');
    if (version) version.textContent = window.I18N.t('docs.version', { version: DOCS.version });

    applyFilter();
    spy();
  }

  /* --- Search -------------------------------------------------------------
     Filters whole sections rather than highlighting matches inside them: the
     question this page gets asked is "where is the thing about X", and hiding
     the sections that cannot answer it is the shortest path to that. Matching
     runs over the rendered text of the section, so it covers code samples and
     table cells too, not just headings. */

  var lastQuery = '';

  function applyFilter() {
    var query = (search.value || '').trim().toLowerCase();
    var shown = 0;

    DOCS.sections.forEach(function (section) {
      var node = document.getElementById(section.id);
      var link = toc.querySelector('[data-target="' + section.id + '"]');
      if (!node) return;
      var hit = !query || node.textContent.toLowerCase().indexOf(query) !== -1;
      node.hidden = !hit;
      if (link) link.hidden = !hit;
      if (hit) shown++;
    });

    empty.hidden = shown > 0;

    // A changed query means the sections above the reader just collapsed, which
    // leaves them somewhere arbitrary in the middle of a match they did not
    // choose. Hidden sections are display:none, so scrollTop 0 is the top of the
    // first hit. Guarded on the query actually changing so the initial render
    // does not fight the deep-link scroll at the bottom of this file.
    if (query !== lastQuery) {
      lastQuery = query;
      // 'instant' because .content carries scroll-behavior: smooth — animating a
      // multi-thousand-pixel jump on every keystroke is not a transition, it is
      // a lag.
      content.scrollTo({ top: 0, behavior: 'instant' });
      spy();
    }
  }

  search.addEventListener('input', applyFilter);

  /* --- Scroll spy ---------------------------------------------------------
     The content column scrolls, not the window, so this listens on it. The
     active section is the last one whose top has passed the reading line — a
     quarter down the viewport rather than the very top, so a heading counts as
     "here" once you are actually reading under it. */

  var ticking = false;

  function spy() {
    var line = content.getBoundingClientRect().top + content.clientHeight * 0.25;
    var current = null;
    DOCS.sections.forEach(function (section) {
      var node = document.getElementById(section.id);
      if (!node || node.hidden) return;
      if (node.getBoundingClientRect().top <= line) current = section.id;
    });
    if (!current) {
      var first = DOCS.sections.filter(function (s) {
        var n = document.getElementById(s.id);
        return n && !n.hidden;
      })[0];
      current = first ? first.id : null;
    }
    toc.querySelectorAll('.docs-toc-link').forEach(function (link) {
      link.classList.toggle('is-active', link.getAttribute('data-target') === current);
    });
  }

  content.addEventListener('scroll', function () {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(function () {
      spy();
      ticking = false;
    });
  });

  /* --- Navigation ---------------------------------------------------------
     The TOC links are real anchors, so they work with middle-click and keyboard
     and survive JavaScript failing. The handler only takes over the scrolling so
     it can happen inside the content column and close the mobile drawer. */

  toc.addEventListener('click', function (event) {
    var link = event.target.closest('.docs-toc-link');
    if (!link) return;
    event.preventDefault();
    var target = document.getElementById(link.getAttribute('data-target'));
    if (!target) return;
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    // Keeps the address bar shareable without the jump the browser would do.
    history.replaceState(null, '', '#' + link.getAttribute('data-target'));
    closeDrawer();
  });

  /* --- Mobile drawer ------------------------------------------------------ */

  var scrim = document.getElementById('docs-scrim');

  function openDrawer() { root.classList.add('is-open'); scrim.hidden = false; }
  function closeDrawer() { root.classList.remove('is-open'); scrim.hidden = true; }

  document.getElementById('docs-side-open').addEventListener('click', openDrawer);
  document.getElementById('docs-side-close').addEventListener('click', closeDrawer);
  scrim.addEventListener('click', closeDrawer);
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') closeDrawer();
  });

  /* --- Start -------------------------------------------------------------- */

  render();

  /* A deep link (/docs#vault) has to wait for the sections to exist before it
     can be scrolled to — at parse time the fragment matches nothing, so the
     browser's own handling does nothing and this has to do it.

     'instant' rather than the inherited smooth behaviour: opening a link should
     land on the section, not animate past fifteen of them first.

     Repeated on `load` because the browser restores the scroll position of the
     scrolling element at that point, which lands after this script has run and
     puts a deep link straight back at the top. scrollRestoration alone does not
     cover it, so the position is simply re-asserted — guarded on the container
     still being at 0, so a reader who already scrolled is not yanked back. */
  function jumpToHash() {
    if (!window.location.hash) return;
    var target = document.getElementById(window.location.hash.slice(1));
    if (!target) return;
    target.scrollIntoView({ block: 'start', behavior: 'instant' });
    spy();
  }

  try { history.scrollRestoration = 'manual'; } catch (err) { /* older browser */ }
  jumpToHash();
  window.addEventListener('load', function () {
    if (content.scrollTop === 0) jumpToHash();
  }, { once: true });

  window.addEventListener('languagechange:zs', render);
})();
