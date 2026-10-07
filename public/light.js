// BeeRoll landing, light version — page behavior. No dependencies.
(function () {
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ── Ad landing helpers (same as /) ──────────────────────
  var query = new URLSearchParams(location.search);
  var variant = window.heroVariants && window.heroVariants[query.get('v')];
  if (variant) {
    $('#hero-l1').textContent = variant.l1;
    $('#hero-l2').textContent = variant.l2;
    $('#hero-sub').textContent = variant.sub;
  }
  var utm = [];
  query.forEach(function (v, k) { if (/^utm_/i.test(k)) utm.push([k, v]); });
  if (utm.length) {
    $$('a[href*=".setapp.com"], a[href*="//setapp.com"]').forEach(function (a) {
      var u = new URL(a.href);
      utm.forEach(function (kv) { u.searchParams.set(kv[0], kv[1]); });
      a.href = u.toString();
    });
  }

  // ── Bar: the section in view lights its link ────────────
  var links = $$('.bar-links a');
  var linkObs = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) links.forEach(function (a) { a.classList.toggle('is-on', a.getAttribute('href') === '#' + e.target.id); });
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  links.forEach(function (a) { var s = $(a.getAttribute('href')); if (s) linkObs.observe(s); });

  // ── Hero: a real frame of the generated Saturn shot, redrawn as a dot matrix ──
  // Brightness sets each dot's size; a few of the brightest cells glint honey.
  var cv = $('#dots');
  if (cv) {
    var img = new Image();
    img.onload = function () {
      var STEP = 9, CROP = { x: 0, y: 70, w: 1400, h: 520 }; // the planet and rings, above the caption
      var w = cv.clientWidth, h = cv.clientHeight, dpr = Math.min(2, window.devicePixelRatio || 1);
      var cols = Math.floor(w / STEP), rows = Math.floor(h / STEP);
      var probe = document.createElement('canvas');
      probe.width = cols; probe.height = rows;
      var pc = probe.getContext('2d', { willReadFrequently: true });
      pc.drawImage(img, CROP.x, CROP.y, CROP.w, CROP.h, 0, 0, cols, rows);
      var px = pc.getImageData(0, 0, cols, rows).data;
      cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
      var ctx = cv.getContext('2d');
      ctx.scale(dpr, dpr);
      var ox = (w - cols * STEP) / 2 + STEP / 2, oy = (h - rows * STEP) / 2 + STEP / 2;
      var cells = [];
      for (var y = 0; y < rows; y++) for (var x = 0; x < cols; x++) {
        var k = (y * cols + x) * 4;
        var lum = (0.299 * px[k] + 0.587 * px[k + 1] + 0.114 * px[k + 2]) / 255;
        var r = Math.pow(lum, 1.15) * STEP * 0.56;
        if (r > 0.45) cells.push({ x: ox + x * STEP, y: oy + y * STEP, r: r, honey: lum > 0.72 && Math.random() < 0.018 });
      }
      function draw(upto) {
        ctx.clearRect(0, 0, w, h);
        for (var i = 0; i < cells.length; i++) {
          var c = cells[i];
          if (c.x > upto) continue;
          ctx.fillStyle = c.honey ? '#F5A11D' : '#161616';
          ctx.beginPath(); ctx.arc(c.x, c.y, c.r, 0, 6.2832); ctx.fill();
        }
      }
      if (reduced) { draw(w); return; }
      // A scan from left to right, like a frame being read in.
      var t0 = performance.now();
      (function frame(now) {
        var p = Math.min(1, (now - t0) / 1400);
        draw(w * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(frame);
      })(t0);
    };
    img.src = cv.dataset.src;
  }

  // ── How it works: scrolling turns the dial; the step at the pin is shown ──
  var how = $('#how');
  var ring = $('#dial-ring');
  var nums = $$('.dial-n', ring);
  var steps = $$('.how-step', how);
  var wide = window.matchMedia('(min-width: 1081px)');
  var current = -1;
  function dial() {
    if (!wide.matches) return;
    var r = how.getBoundingClientRect();
    var span = how.offsetHeight - window.innerHeight;
    var p = Math.min(1, Math.max(0, -r.top / span)) * (steps.length - 1);
    ring.style.setProperty('--p', p.toFixed(3));
    nums.forEach(function (n, i) { n.style.setProperty('--a', Math.min(1, Math.abs(i - p) * 1.4).toFixed(2)); });
    var i = Math.round(p);
    if (i !== current) {
      current = i;
      steps.forEach(function (s, k) { s.classList.toggle('is-on', k === i); });
    }
  }
  var ticking = false;
  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(function () { ticking = false; dial(); }); } }, { passive: true });
  window.addEventListener('resize', dial);
  dial();

  // ── Credit estimate: measured rate × seconds, read on a gauge ──
  var calc = $('#calc');
  var out = $('#calc-cost');
  var needle = $('#needle');
  var max = Number(out.dataset.max);
  var fmt = new Intl.NumberFormat('en-US');
  function calcUpdate() {
    var model = $('input[name=model]:checked', calc);
    var allowed = model.dataset.lengths.split(',').map(Number);
    var lengthInputs = $$('input[name=length]', calc);
    lengthInputs.forEach(function (el) { el.disabled = allowed.indexOf(Number(el.value)) < 0; });
    var length = $('input[name=length]:checked', calc);
    if (length.disabled) { length = lengthInputs.filter(function (el) { return !el.disabled; }).pop(); length.checked = true; }
    var cost = Number(model.dataset.rate) * Number(length.value);
    out.textContent = fmt.format(cost);
    needle.style.setProperty('--a', (-90 + Math.min(1, cost / max) * 180).toFixed(1) + 'deg');
  }
  calc.addEventListener('change', calcUpdate);
  calcUpdate();
})();
