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
  function unlock() {
    var b = document.body.style;
    b.position = ''; b.top = ''; b.left = ''; b.right = ''; b.width = '';
    root.classList.remove('is-locked');
    var prev = root.style.scrollBehavior;
    root.style.scrollBehavior = 'auto';
    window.scrollTo(0, savedY);
    root.style.scrollBehavior = prev;
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
  function goTo(hash) {
    var t = document.querySelector(hash);
    if (!t) return;
    var pad = parseFloat(getComputedStyle(root).scrollPaddingTop) || 0;
    var y = Math.max(0, t.getBoundingClientRect().top + window.scrollY - pad);
    window.scrollTo({ top: y, behavior: reduce.matches ? 'auto' : 'smooth' });
    history.replaceState(null, '', hash);
    var h = t.querySelector('h2, h1');
    if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
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

  /* ---------- variant switcher steps aside from any button it would cover ---------- */
  var pill = document.querySelector('.variants');
  if (pill) {
    var btns = Array.prototype.slice.call(document.querySelectorAll('main .btn, main .map__btn, .contacts a, .rating a, .footer a'));
    var pTick = false;
    var checkPill = function () {
      pTick = false;
      var r = pill.firstElementChild.getBoundingClientRect();
      var hit = btns.some(function (b) {
        if (b.hidden) return false;
        var q = b.getBoundingClientRect();
        return q.width && q.right > r.left - 4 && q.left < r.right + 4 && q.bottom > r.top - 4 && q.top < r.bottom + 4;
      });
      pill.classList.toggle('is-away', hit);
    };
    var onPill = function () { if (!pTick) { pTick = true; requestAnimationFrame(checkPill); } };
    window.addEventListener('scroll', onPill, { passive: true });
    window.addEventListener('resize', onPill);
    window.addEventListener('load', checkPill);
    document.addEventListener('pill:check', onPill);
    checkPill();
  }
})();
