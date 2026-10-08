(function () {
  'use strict';
  var fine = window.matchMedia('(pointer: fine)').matches;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var spot = document.getElementById('spot');
  var photo = document.getElementById('h8photo');
  if (!fine) return; /* on touch the light rests calmly; no gesture needed */
  var raf = 0, x = 0, y = 0;
  window.addEventListener('pointermove', function (e) {
    x = e.clientX; y = e.clientY;
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(function () {
      if (spot) { spot.style.setProperty('--x', x + 'px'); spot.style.setProperty('--y', y + 'px'); }
      if (photo && !reduce) {
        var r = photo.getBoundingClientRect();
        var dx = (x - (r.left + r.width / 2)) / window.innerWidth, dy = (y - (r.top + r.height / 2)) / window.innerHeight;
        var k = photo.classList.contains('is-held') ? 2.4 : 1;
        photo.style.transform = 'perspective(900px) rotateY(' + (dx * 10 * k).toFixed(2) + 'deg) rotateX(' + (-dy * 8 * k).toFixed(2) + 'deg) rotate(' + (photo.classList.contains('is-held') ? 4 : 0) + 'deg)';
      }
    });
  });
  if (photo && !reduce) {
    photo.addEventListener('pointerdown', function () { photo.classList.add('is-held'); });
    window.addEventListener('pointerup', function () { photo.classList.remove('is-held'); });
    photo.addEventListener('pointerleave', function () { if (!photo.classList.contains('is-held')) photo.style.transform = ''; });
  }
})();
