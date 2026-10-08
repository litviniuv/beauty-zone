(function () {
  'use strict';
  var root = document.documentElement;
  root.classList.add('js');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ---------- mobile menu with scroll lock ---------- */
  var burger = document.querySelector('.burger');
  var menu = document.getElementById('menu');
  var savedY = 0;
  function isOpen() { return !!burger && burger.getAttribute('aria-expanded') === 'true'; }
  function lock() {
    savedY = window.scrollY || 0;
    root.classList.add('is-locked');
    var b = document.body.style;
    b.position = 'fixed'; b.top = (-savedY) + 'px'; b.left = '0'; b.right = '0'; b.width = '100%';
  }
  /* jump to y with no animation, whatever html{scroll-behavior} says */
  function jumpTo(y) {
    root.style.scrollBehavior = 'auto';
    try { window.scrollTo({ top: y, left: 0, behavior: 'instant' }); } catch (e) { window.scrollTo(0, y); }
    if (Math.abs((window.scrollY || window.pageYOffset || 0) - y) > 1) {
      root.scrollTop = y; document.body.scrollTop = y;
    }
  }
  var behaviorRaf = 0;
  function releaseBehavior() {
    cancelAnimationFrame(behaviorRaf);
    behaviorRaf = requestAnimationFrame(function () {
      behaviorRaf = requestAnimationFrame(function () { root.style.scrollBehavior = ''; });
    });
  }
  function unlock() {
    /* while locked the page sits at scroll 0 (body fixed at top:-Y): put it back at Y
       instantly, so there is never a smooth pass through the top of the page */
    root.style.scrollBehavior = 'auto';
    var b = document.body.style;
    b.position = ''; b.top = ''; b.left = ''; b.right = ''; b.width = '';
    root.classList.remove('is-locked');
    jumpTo(savedY);
    releaseBehavior();
  }
  function open() {
    menu.hidden = false;
    burger.setAttribute('aria-expanded', 'true');
    burger.setAttribute('aria-label', 'Закрыть меню');
    lock();
    var first = menu.querySelector('a[href]');
    if (first) first.focus({ preventScroll: true });
  }
  function close(returnFocus) {
    if (!isOpen()) return;
    menu.hidden = true;
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'Открыть меню');
    unlock();
    if (returnFocus !== false) burger.focus({ preventScroll: true });
  }
  /* called right after close(): start from the restored position on the next frame
     and glide to the section (window.scrollTo keeps the sticky strip + header on screen) */
  function goTo(hash) {
    var t = document.querySelector(hash);
    if (!t) return;
    var fromY = savedY;
    history.replaceState(null, '', hash);
    requestAnimationFrame(function () {
      var cur = window.scrollY || window.pageYOffset || 0;
      if (Math.abs(cur - fromY) > 2) { jumpTo(fromY); cur = fromY; }
      var pad = parseFloat(getComputedStyle(root).scrollPaddingTop) || 0;
      var y = Math.max(0, Math.round(t.getBoundingClientRect().top + cur - pad));
      if (reduce.matches) jumpTo(y);
      else window.scrollTo({ top: y, left: 0, behavior: 'smooth' });
      releaseBehavior();
      var h = t.querySelector('h2, h1');
      if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
    });
  }
  if (burger && menu) {
    burger.addEventListener('click', function () { isOpen() ? close() : open(); });
    menu.addEventListener('click', function (e) {
      var a = e.target.closest('a[href]');
      if (!a) return;
      var href = a.getAttribute('href');
      if (href.charAt(0) === '#') { e.preventDefault(); close(false); goTo(href); }
      else close(false);
    });
    document.addEventListener('keydown', function (e) {
      if (!isOpen()) return;
      if (e.key === 'Escape') { e.preventDefault(); close(); return; }
      if (e.key === 'Tab') {
        var f = [burger].concat(Array.prototype.slice.call(menu.querySelectorAll('a[href]')));
        var i = f.indexOf(document.activeElement);
        if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
      }
    });
    window.matchMedia('(min-width: 1100px)').addEventListener('change', function (m) { if (m.matches) close(false); });
    document.addEventListener('touchmove', function (e) {
      if (isOpen() && !menu.contains(e.target)) e.preventDefault();
    }, { passive: false });
  }

  /* ---------- reveal on scroll ----------
     Grid tiles are triggered by their parent grid (never by themselves), threshold 0,
     plus a scroll / hashchange / load sweep so nothing can stay hidden. */
  var items = Array.prototype.slice.call(document.querySelectorAll('[data-reveal]'));
  function show(el) { el.classList.add('is-in'); }
  if (!('IntersectionObserver' in window) || reduce.matches) {
    items.forEach(show);
  } else {
    var groups = new Map();
    items.forEach(function (el) {
      var parent = el.parentElement;
      var trigger = parent && parent.classList.contains('grid34') ? parent : el;
      if (trigger !== el) {
        var idx = Array.prototype.indexOf.call(parent.children, el);
        el.style.transitionDelay = (idx % 4) * 70 + 'ms';
      }
      if (!groups.has(trigger)) groups.set(trigger, []);
      groups.get(trigger).push(el);
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting && groups.has(en.target)) {
          groups.get(en.target).forEach(show); io.unobserve(en.target); groups.delete(en.target);
        }
      });
    }, { rootMargin: '0px 0px -5% 0px', threshold: 0 });
    groups.forEach(function (_, trigger) { io.observe(trigger); });
    var ticking = false;
    var sweep = function () {
      ticking = false;
      var vh = window.innerHeight;
      groups.forEach(function (els, trigger) {
        if (trigger.getBoundingClientRect().top < vh) { els.forEach(show); io.unobserve(trigger); groups.delete(trigger); }
      });
      if (!groups.size) window.removeEventListener('scroll', onScroll);
    };
    var onScroll = function () { if (!ticking) { ticking = true; requestAnimationFrame(sweep); } };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('hashchange', sweep);
    window.addEventListener('load', function () { setTimeout(sweep, 300); });
    setTimeout(sweep, 1500);
  }

  /* ---------- map: loads only on click ---------- */
  var map = document.getElementById('map');
  var mapBtn = map && map.querySelector('.map__btn');
  if (mapBtn) {
    mapBtn.hidden = false;
    mapBtn.addEventListener('click', function () {
      var f = document.createElement('iframe');
      f.src = map.getAttribute('data-map-src');
      f.title = map.getAttribute('data-map-title') || 'Карта';
      f.setAttribute('allowfullscreen', '');
      var ph = map.querySelector('.map__ph');
      map.appendChild(f);
      if (ph) ph.remove();
      map.setAttribute('tabindex', '-1');
      map.focus({ preventScroll: true });
    });
  }
})();
