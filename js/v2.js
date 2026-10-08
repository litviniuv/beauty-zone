(function () {
  'use strict';
  var hero = document.querySelector('.hero5');
  if (!hero) return;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var frames = Array.prototype.slice.call(hero.querySelectorAll('.drop__frame'));
  var caps = Array.prototype.slice.call(hero.querySelectorAll('.drop__cap'));
  var current = -1, tick = false;
  function setTo(n) {
    if (n === current) return;
    current = n;
    frames.forEach(function (f) {
      f.querySelectorAll('.drop__img').forEach(function (img) {
        var on = +img.getAttribute('data-set') === n;
        img.classList.toggle('is-on', on);
        img.classList.remove('is-dropping');
        if (on && !reduce) { void img.offsetWidth; img.classList.add('is-dropping'); }
      });
    });
    caps.forEach(function (c) { c.classList.toggle('is-on', +c.getAttribute('data-set') === n); });
  }
  function update() {
    tick = false;
    var r = hero.getBoundingClientRect();
    var stage = hero.querySelector('.hero5__stage').offsetHeight;
    var span = Math.max(1, r.height - stage);
    var p = Math.min(0.999, Math.max(0, -r.top / span));
    setTo(Math.floor(p * 3));
  }
  window.addEventListener('scroll', function () { if (!tick) { tick = true; requestAnimationFrame(update); } }, { passive: true });
  window.addEventListener('resize', update);
  update();
})();
