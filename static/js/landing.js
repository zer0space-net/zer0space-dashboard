/* Landing page: the header drawer and in-page nav highlighting.
   The modal, the language toggle and the chibi are handled globally (ui.js,
   i18n.js, chibi.js). */
(function () {
  'use strict';

  /* --- Header drawer (below 768 px) -------------------------------------- */

  var header = document.getElementById('site-header');
  var toggle = document.getElementById('nav-toggle');
  var scrim = document.getElementById('nav-scrim');

  if (header && toggle) {
    var setNav = function (open) {
      header.classList.toggle('nav-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      // The label has to follow the state, not the element: a button that keeps
      // saying "open menu" while the menu is open is the single most common
      // hamburger bug for a screen reader user.
      toggle.setAttribute('aria-label', window.I18N.t(open ? 'nav.closeMenu' : 'nav.openMenu'));
    };

    toggle.addEventListener('click', function () {
      setNav(!header.classList.contains('nav-open'));
    });

    if (scrim) scrim.addEventListener('click', function () { setNav(false); });

    // Every link either jumps to a section on this page or opens the About
    // dialog, so the drawer has done its job the moment one is tapped.
    header.querySelectorAll('.nav a').forEach(function (link) {
      link.addEventListener('click', function () { setNav(false); });
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && header.classList.contains('nav-open')) {
        setNav(false);
        toggle.focus();
      }
    });

    // Rotating a phone to landscape can cross the breakpoint with the drawer
    // still open, which would leave a fixed panel over a desktop-width header.
    window.addEventListener('resize', function () {
      if (window.innerWidth > 768) setNav(false);
    });

    // The button's aria-label is set from a dictionary, so it has to be
    // recomputed when the language changes like every other translated string.
    window.addEventListener('languagechange:zs', function () {
      setNav(header.classList.contains('nav-open'));
    });
  }

  /* --- Section highlighting ---------------------------------------------- */

  var links = Array.prototype.slice.call(document.querySelectorAll('.nav a[href^="#"]'));
  var targets = links
    .map(function (link) { return document.querySelector(link.getAttribute('href')); })
    .filter(Boolean);

  if (!targets.length || !('IntersectionObserver' in window)) return;

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      links.forEach(function (link) {
        link.classList.toggle('is-active', link.getAttribute('href') === '#' + entry.target.id);
      });
    });
    // rootMargin pulls the trigger line up to roughly a third down the viewport,
    // so a section counts as "current" once it is genuinely being read rather
    // than the moment its top pixel appears.
  }, { rootMargin: '-30% 0px -60% 0px', threshold: 0 });

  targets.forEach(function (target) { observer.observe(target); });
})();
