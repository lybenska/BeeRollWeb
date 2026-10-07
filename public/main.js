// BeeRoll landing — page behavior. No dependencies.
(function () {
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var two = function (n) { return (n < 10 ? '0' : '') + n; };
  // The app's transport readout: HH:MM:SS:FF at 30 fps.
  function timecode(sec) {
    var s = Math.floor(sec), f = Math.floor((sec - s) * 30);
    return '00:' + two(Math.floor(s / 60)) + ':' + two(s % 60) + ':' + two(f);
  }

  // ── Ad landing helpers ──────────────────────────────────
  var query = new URLSearchParams(location.search);
  var variant = window.heroVariants && window.heroVariants[query.get('v')];
  if (variant) {
    $('#hero-l1').textContent = variant.l1;
    $('#hero-l2').textContent = variant.l2;
    $('#hero-sub').textContent = variant.sub;
  }
  // Attribution: carry utm_* into every Setapp link.
  var utm = [];
  query.forEach(function (v, k) { if (/^utm_/i.test(k)) utm.push([k, v]); });
  if (utm.length) {
    $$('a[href*=".setapp.com"], a[href*="//setapp.com"]').forEach(function (a) {
      var u = new URL(a.href);
      utm.forEach(function (kv) { u.searchParams.set(kv[0], kv[1]); });
      a.href = u.toString();
    });
  }

  // ── Nav ─────────────────────────────────────────────────
  var nav = $('#nav');
  var navCta = $('.nav-cta', nav);
  new IntersectionObserver(function (entries) {
    var hidden = !entries[0].isIntersecting;
    nav.classList.toggle('show-cta', hidden);
    navCta.tabIndex = hidden ? 0 : -1;
    navCta.setAttribute('aria-hidden', hidden ? 'false' : 'true');
  }, { rootMargin: '-64px 0px 0px 0px' }).observe($('#hero-cta'));

  var burger = $('#nav-burger');
  function setMenu(open) {
    nav.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    document.body.style.overflow = open ? 'hidden' : '';
  }
  burger.addEventListener('click', function () { setMenu(!nav.classList.contains('is-open')); });
  $('#nav-backdrop').addEventListener('click', function () { setMenu(false); });
  $$('.nav-links a', nav).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && nav.classList.contains('is-open')) { setMenu(false); burger.focus(); } });
  window.addEventListener('resize', function () { if (window.innerWidth > 1080 && nav.classList.contains('is-open')) setMenu(false); });

  var links = $$('.nav-links a:not(.nav-menu-cta)', nav);
  var sectionObs = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      links.forEach(function (a) { a.classList.toggle('is-active', a.getAttribute('href') === '#' + e.target.id); });
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  links.forEach(function (a) { var s = $(a.getAttribute('href')); if (s) sectionObs.observe(s); });

  // ── Scroll reveal ───────────────────────────────────────
  var revealObs = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); revealObs.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -8% 0px' });
  $$('.reveal').forEach(function (el) { revealObs.observe(el); });

  // ═══ Dot-matrix nav icons: blank, then relight dot by dot ═══
  $$('.dm-link').forEach(function (a) {
    var dm = $('.dm', a);
    var lit = $$('i.on', dm).length;
    var timer = null;
    a.addEventListener('mouseenter', function () {
      if (reduced) return;
      clearTimeout(timer);
      dm.classList.remove('is-draw');
      dm.classList.add('is-blank');
      a.classList.add('is-hover');
      void dm.offsetWidth; // commit the blank state before the staggered relight
      requestAnimationFrame(function () {
        dm.classList.remove('is-blank');
        dm.classList.add('is-draw');
        timer = setTimeout(function () { a.classList.remove('is-hover'); }, lit * 32 + 160);
      });
    });
    a.addEventListener('mouseleave', function () {
      clearTimeout(timer);
      a.classList.remove('is-hover');
      timer = setTimeout(function () { dm.classList.remove('is-draw'); }, 220);
    });
  });

  // ═══ The run: one video along a ruler, pinned while the page scrolls ═══
  var run = $('#run');
  var runTrack = $('#run-track');
  var clips = $$('.clip', runTrack);
  var rulerMarks = $$('.run-ruler span', run);
  var wide = window.matchMedia('(min-width: 1081px)');
  function runScroll() {
    if (!wide.matches || reduced) { runTrack.style.transform = ''; return; }
    var r = run.getBoundingClientRect();
    var span = run.offsetHeight - window.innerHeight;
    var p = Math.min(1, Math.max(0, -r.top / span));
    // From the first clip centred to the last one centred (scrollWidth can drop the track's end padding).
    var shift = clips[clips.length - 1].offsetLeft - clips[0].offsetLeft;
    runTrack.style.transform = 'translateX(' + (-p * shift).toFixed(1) + 'px)';
    var active = Math.round(p * (clips.length - 1));
    clips.forEach(function (c, i) { c.classList.toggle('is-on', i === active); });
    rulerMarks.forEach(function (m, i) { m.classList.toggle('is-on', i === active); });
    run.style.setProperty('--p', p.toFixed(4));
  }

  // ═══ Edit by text: cutting a line collapses its clip, and playback skips it ═══
  var tx = $('#tx');
  var txLines = $$('.tx-line', tx);
  var txClips = $$('.tx-clip', tx);
  var txTotal = Number(tx.dataset.total);
  var txSegs = txLines.map(function (b, i) {
    return { i: i, at: Number(b.dataset.at), d: Number(b.dataset.d), words: $$('.w', b), shot: txClips[i].dataset.shot };
  });
  var isCut = function (g) { return txLines[g.i].getAttribute('aria-pressed') === 'true'; };
  var txKept = function () { return txSegs.filter(function (g) { return !isCut(g); }); };
  var secs = function (t) { return (Math.round(t * 10) / 10) + ' s'; };
  function txUpdate() {
    var cut = 0, n = 0;
    txSegs.forEach(function (g, i) {
      var off = isCut(g), prev = txSegs[i - 1], next = txSegs[i + 1];
      txClips[i].classList.toggle('is-cut', off);
      // Joined to a neighbour that is still in and comes from the same shot: no edit point between them.
      txClips[i].classList.toggle('join-l', !off && !!prev && !isCut(prev) && prev.shot === g.shot);
      txClips[i].classList.toggle('join-r', !off && !!next && !isCut(next) && next.shot === g.shot);
      if (off) { cut += g.d; n++; }
    });
    $('#tx-dur').textContent = $('#tx-len').textContent = timecode(txTotal - cut);
    $('#tx-cut').textContent = n ? 'Removed ' + n + (n === 1 ? ' line' : ' lines') + ' · ' + secs(cut) : '';
    $('#tx-reset').hidden = !n;
  }
  // Thumbnails as BeeRoll draws them: 16:9 tiles at the track's height, each showing the moment of video under it.
  var STRIP_FRAMES = 16, STRIP_STEP = 0.5;
  function txThumbs() {
    var lane = $('.tx-clips', tx), pps = lane.clientWidth / txTotal;
    txClips.forEach(function (clip, i) {
      var box = $('.tx-thumbs', clip), h = box.clientHeight, tw = h * 16 / 9;
      var g = txSegs[i], width = g.d * pps;
      box.textContent = '';
      for (var x = 0; x < width; x += tw) {
        var tile = document.createElement('i');
        var f = Math.min(STRIP_FRAMES - 1, Math.floor((g.at + x / pps) / STRIP_STEP));
        tile.style.width = tw + 'px';
        tile.style.backgroundSize = (STRIP_FRAMES * tw) + 'px ' + h + 'px';
        tile.style.backgroundPosition = (-f * tw) + 'px 0';
        box.appendChild(tile);
      }
    });
  }

  // Playback: the video is the clock. Its time maps to edit time over the lines still in; reaching a cut line
  // jumps past it, so the playhead, the lit word and the caption always match the picture.
  var txTl = $('.tx-tl', tx), txVideo = $('#tx-video'), txCap = $('#tx-caption');
  var txPlay = $('#tx-play'), txNow = $('#tx-now');
  var txPlaying = !reduced, txSeen = false, txHoldUntil = 0, txWord = null, txLine = -1;
  function txRender() {
    var src = txVideo.currentTime || 0, kept = txKept(), acc = 0, g = null;
    for (var k = 0; k < kept.length; k++) {
      if (src < kept[k].at + kept[k].d || k === kept.length - 1) { g = kept[k]; break; }
      acc += kept[k].d;
    }
    var tau = g ? acc + Math.max(0, Math.min(g.d, src - g.at)) : 0;
    txTl.style.setProperty('--ph', (tau / txTotal).toFixed(4));
    txNow.textContent = timecode(tau);
    if (txWord) txWord.classList.remove('is-now');
    if (!g || src < g.at) { txCap.textContent = ''; txWord = null; return; }
    // Words are spread evenly over their line's seconds.
    var wi = Math.max(0, Math.min(g.words.length - 1, Math.floor((src - g.at) / g.d * g.words.length)));
    txWord = g.words[wi];
    txWord.classList.add('is-now');
    if (txLine !== g.i) {
      txLines.forEach(function (b, i) { b.classList.toggle('is-now', i === g.i); });
      txLine = g.i;
      txCap.textContent = g.words.map(function (w) { return w.textContent; }).join(' ');
    }
  }
  // Keep the video on lines that are still in: skip a cut line, loop after the last one.
  function txSteer(now) {
    var kept = txKept(), src = txVideo.currentTime;
    if (!kept.length) { txVideo.pause(); return; }
    var last = kept[kept.length - 1];
    if (txHoldUntil) {
      if (now < txHoldUntil) return;
      txHoldUntil = 0; txVideo.currentTime = kept[0].at; if (txPlaying) txVideo.play();
      return;
    }
    if (src >= last.at + last.d - 0.04 || txVideo.ended) {   // hold the last frame a moment, then again
      txVideo.pause(); txHoldUntil = now + 1400; return;
    }
    var here = txSegs.filter(function (g) { return src >= g.at && src < g.at + g.d; })[0];
    if (here && isCut(here)) {
      var next = kept.filter(function (g) { return g.at >= here.at; })[0];
      txVideo.currentTime = next ? next.at : kept[0].at;
    }
    if (src < kept[0].at) txVideo.currentTime = kept[0].at;
  }
  function txLoop(now) {
    if (txSeen && !document.hidden) { if (txPlaying) txSteer(now); txRender(); }
    requestAnimationFrame(txLoop);
  }
  function txSetPlaying(on) {
    txPlaying = on;
    txPlay.classList.toggle('is-paused', !on);
    txPlay.setAttribute('aria-label', on ? 'Pause' : 'Play');
    if (!txSeen) return;
    if (on && !txHoldUntil) txVideo.play().catch(function () {}); else txVideo.pause();
  }
  txPlay.addEventListener('click', function () { txSetPlaying(!txPlaying); });
  txSetPlaying(txPlaying);
  // Load and start only when the widget comes into view; pause when it leaves.
  new IntersectionObserver(function (entries) {
    txSeen = entries[0].isIntersecting;
    if (txSeen) {
      if (txVideo.preload !== 'auto') { txVideo.preload = 'auto'; txVideo.load(); }
      if (txPlaying) txVideo.play().catch(function () {});
    } else txVideo.pause();
  }, { rootMargin: '0px 0px -10% 0px' }).observe(tx);
  requestAnimationFrame(txLoop);

  txLines.forEach(function (b, i) {
    b.addEventListener('click', function () {
      b.setAttribute('aria-pressed', b.getAttribute('aria-pressed') === 'true' ? 'false' : 'true');
      txUpdate(); txRender();
    });
    // Pointing at a line lights its piece of the video track.
    b.addEventListener('mouseenter', function () { txClips[i].classList.add('is-hl'); });
    b.addEventListener('mouseleave', function () { txClips[i].classList.remove('is-hl'); });
  });
  $('#tx-reset').addEventListener('click', function () {
    txLines.forEach(function (b) { b.setAttribute('aria-pressed', 'false'); });
    txUpdate(); txRender();
  });
  txUpdate();
  txThumbs();
  window.addEventListener('resize', txThumbs);

  // ═══ B-roll: the Generate panel, live ═══
  // Each real take in turn: its description types in, Generate take is pressed, a short wait, then the take plays
  // twice. Runs only on screen; with reduced motion it shows the first take still, its description in place.
  var gn = $('#gn');
  if (gn) {
    var gnTakes = JSON.parse(gn.dataset.takes);
    var gnVideo = $('#gn-video'), gnOut = $('#gn-out'), gnTyped = $('#gn-typed'), gnBtn = $('#gn-btn'), gnBar = $('#gn-bar');
    // Asset paths from the page's own (relativized on the review build) video src, not the JSON.
    var gnBase = gnVideo.getAttribute('src').replace(/[^/]*$/, '');
    var gnFile = function (path) { return gnBase + path.split('/').pop(); };
    var gnOn = false, gnWake = null;
    new IntersectionObserver(function (entries) {
      gnOn = entries[0].isIntersecting;
      if (!gnOn) gnVideo.pause();
      else if (gnWake) { gnWake(); gnWake = null; }
    }, { rootMargin: '0px 0px -15% 0px' }).observe(gn);
    var gnVisible = function () { return gnOn ? Promise.resolve() : new Promise(function (r) { gnWake = r; }); };
    var gnPlayOnce = function () {
      return new Promise(function (r) {
        gnVideo.currentTime = 0;
        gnVideo.onended = function () { gnVideo.onended = null; r(); };
        gnVideo.play().catch(function () { r(); });
      });
    };
    if (!reduced) (async function () {
      for (var k = 0; ; k = (k + 1) % gnTakes.length) {
        await gnVisible();
        var t = gnTakes[k];
        // Type the description.
        gnBtn.classList.remove('is-ready');
        gnTyped.textContent = '';
        for (var c = 1; c <= t.prompt.length; c++) { gnTyped.textContent = t.prompt.slice(0, c); await sleep(34 + Math.random() * 30); }
        gnBtn.classList.add('is-ready');
        await sleep(500);
        gnBtn.classList.add('is-press'); await sleep(140); gnBtn.classList.remove('is-press');
        // The take is on its way: blur the old one, fill the bar, swap in the new take.
        gnOut.classList.add('is-waiting');
        gnVideo.poster = gnFile(t.poster);
        gnVideo.src = gnFile(t.src);
        gnVideo.preload = 'auto';
        for (var p = 0; p <= 1.0001; p += 0.04) { gnBar.style.setProperty('--p', p.toFixed(2)); await sleep(55); }
        gnOut.classList.remove('is-waiting');
        gnBtn.classList.remove('is-ready');
        await gnVisible(); await gnPlayOnce();
        await gnVisible(); await gnPlayOnce();
        await sleep(600);
      }
    })();
  }


  // ═══ Atmosphere ════════════════════════════════════════
  // Decoding text: characters settle out of noise, left to right. Mono keeps the width still.
  var GLYPHS = '01#%/<>[]{}=+*░▒▓';
  function scramble(el, dur) {
    if (!el || reduced || el.dataset.scrambled) return;
    el.dataset.scrambled = '1';
    if (!el.hasAttribute('aria-label')) el.setAttribute('aria-label', el.textContent.replace(/\s+/g, ' ').trim());
    var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    var nodes = [], node;
    while ((node = walker.nextNode())) if (node.nodeValue.trim()) nodes.push({ n: node, text: node.nodeValue });
    var total = nodes.reduce(function (a, o) { return a + o.text.length; }, 0);
    var t0 = performance.now();
    (function frame(now) {
      var p = Math.min(1, (now - t0) / dur), done = Math.floor(p * total), k = 0;
      nodes.forEach(function (o) {
        var out = '';
        for (var i = 0; i < o.text.length; i++, k++) {
          var c = o.text[i];
          out += k < done || c === ' ' ? c : GLYPHS[(Math.random() * GLYPHS.length) | 0];
        }
        o.n.nodeValue = out;
      });
      if (p < 1) requestAnimationFrame(frame);
    })(t0);
  }
  scramble($('.hero h1'), 900);
  var scrambleObs = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      scrambleObs.unobserve(e.target);
      scramble(e.target, 700);
    });
  }, { rootMargin: '0px 0px -15% 0px' });
  $$('main h2').forEach(function (h) { scrambleObs.observe(h); });

  // ═══ The living background: a dot lattice behind the whole page ═══
  // Dots breathe in a slow cross wave, drift slower than the page when it scrolls, light up honey around
  // the pointer and glint now and then. Near the top a speech waveform runs through them: the audio
  // BeeRoll transcribes. Paused while the tab is hidden; drawn once, still, with reduced motion.
  var fieldCv = $('#field');
  if (fieldCv) {
    var fx = fieldCv.getContext('2d'), FW = 0, FH = 0, FSTEP = 24;
    var ptr = { x: -9999, y: -9999, tx: -9999, ty: -9999 };
    var glints = [], lastGlint = 0;
    // Page y of the gap between the hero's call to action and the editor shot, where the waveform runs.
    var heroWave = 0;
    var fieldSize = function () {
      var meta = $('.hero-meta'), shot = $('#hero-shot');
      if (meta && shot) heroWave = (meta.getBoundingClientRect().bottom + shot.getBoundingClientRect().top) / 2 + window.scrollY;
      var dpr = Math.min(2, window.devicePixelRatio || 1);
      FW = window.innerWidth; FH = window.innerHeight;
      fieldCv.width = Math.round(FW * dpr); fieldCv.height = Math.round(FH * dpr);
      fx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    var frameEl = $('main.frame');
    var paintField = function (t) {
      fx.clearRect(0, 0, FW, FH);
      var fr = frameEl.getBoundingClientRect();
      fx.fillStyle = '#131416';
      fx.fillRect(fr.left, 0, fr.width, FH);
      if (ptr.tx < -999) { ptr.x = ptr.y = -9999; }
      else { ptr.x += (ptr.tx - ptr.x) * 0.18; ptr.y += (ptr.ty - ptr.y) * 0.18; }
      var sy = window.scrollY;
      var oy = -((sy * 0.35) % FSTEP);
      var ox = (FW / 2) % FSTEP;
      var wy = heroWave - sy;              // the waveform runs between the call to action and the editor
      var wave = wy > -160;
      for (var gy = oy; gy < FH + FSTEP; gy += FSTEP) {
        for (var gx = ox; gx < FW; gx += FSTEP) {
          var a = 0.1 + 0.06 * Math.sin(gx * 0.012 + t * 0.0005) * Math.sin(gy * 0.01 - t * 0.00035);
          var r = 1, honey = 0;
          if (wave) {
            var env = Math.sin(Math.PI * Math.min(1, Math.max(0, gx / FW)));
            var amp = 44 * env * (0.35 + 0.65 * Math.abs(Math.sin(gx * 0.019 + t * 0.0016) * Math.sin(gx * 0.0061 - t * 0.0009)));
            var dw = Math.abs(gy - wy);
            if (dw < amp) { var k = 1 - dw / amp; a += 0.2 * k; honey = Math.max(honey, 0.5 * k); }
          }
          var dx = gx - ptr.x, dy = gy - ptr.y, d = Math.sqrt(dx * dx + dy * dy);
          if (d < 170) { var q = 1 - d / 170; q *= q; a += 0.5 * q; r += 1.3 * q; honey = Math.max(honey, q); }
          fx.fillStyle = honey > 0.05
            ? 'rgba(' + Math.round(236 + 9 * honey) + ',' + Math.round(234 - 73 * honey) + ',' + Math.round(228 - 199 * honey) + ',' + a.toFixed(3) + ')'
            : 'rgba(236,234,228,' + a.toFixed(3) + ')';
          fx.fillRect(gx - r, gy - r, r * 2, r * 2);
        }
      }
      // Glints: one lattice cell at a time flares honey and fades over 2.6 s, drifting with the lattice.
      if (!reduced && t - lastGlint > 260 + Math.random() * 380) {
        lastGlint = t;
        glints.push({ x: ox + FSTEP * Math.floor(Math.random() * FW / FSTEP), y: oy + FSTEP * Math.floor(Math.random() * FH / FSTEP), sy: sy, t0: t });
      }
      glints = glints.filter(function (g) {
        var life = (t - g.t0) / 2600;
        if (life >= 1) return false;
        fx.fillStyle = 'rgba(245,161,29,' + (Math.sin(Math.PI * life) * 0.9).toFixed(3) + ')';
        fx.fillRect(g.x - 2, g.y - (sy - g.sy) * 0.35 - 2, 4, 4);
        return true;
      });
    };
    fieldSize();
    window.addEventListener('resize', function () { fieldSize(); if (reduced) paintField(0); });
    document.addEventListener('pointermove', function (e) { if (e.pointerType === 'mouse') { ptr.tx = e.clientX; ptr.ty = e.clientY; } }, { passive: true });
    document.addEventListener('mouseleave', function () { ptr.tx = ptr.ty = -9999; });
    if (reduced) paintField(0);
    else (function loop(now) {
      if (!document.hidden) paintField(now);
      requestAnimationFrame(loop);
    })(performance.now());
  }

  // Closing: a bee drawn as a dot matrix, the brand's one creature next to the honeycomb card.
  // Shapes are tested cell by cell on a 5px grid: a honey body with dark bands, a dim head and antennae,
  // and two wings whose dots flicker while the bee is on screen.
  var bee = $('#bee');
  if (bee) {
    var BW = 240, BH = 190, STEP = 5;
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    bee.width = BW * dpr; bee.height = BH * dpr;
    var bctx = bee.getContext('2d');
    bctx.scale(dpr, dpr);
    // Distance inside a rotated ellipse (≤ 1 is inside) and the position along its long axis (-1…1).
    var ell = function (x, y, cx, cy, rx, ry, rot) {
      var c = Math.cos(rot), s = Math.sin(rot), dx = x - cx, dy = y - cy;
      var u = (dx * c + dy * s) / rx, v = (-dx * s + dy * c) / ry;
      return { d: u * u + v * v, u: u, v: v };
    };
    var body = [], head = [], wings = [];
    for (var gy = STEP / 2; gy < BH; gy += STEP) for (var gx = STEP / 2; gx < BW; gx += STEP) {
      var b = ell(gx, gy, 132, 112, 66, 40, 0.28);
      if (b.d <= 1) {
        var band = (b.u > -0.38 && b.u < -0.18) || (b.u > 0.12 && b.u < 0.32) || b.u > 0.66;
        // Lit from the top left: dots grow toward the highlight and shrink to the rim.
        var lit = 0.55 + 0.45 * (1 - b.d) - 0.18 * b.v;
        body.push({ x: gx, y: gy, r: STEP * 0.44 * Math.max(0.35, Math.min(1, lit)), dark: band });
        continue;
      }
      var h = ell(gx, gy, 62, 86, 25, 23, 0);
      if (h.d <= 1) { head.push({ x: gx, y: gy, r: STEP * 0.4 * (1 - 0.35 * h.d), eye: ell(gx, gy, 52, 82, 7, 9, 0).d <= 1 }); continue; }
      var w1 = ell(gx, gy, 118, 52, 40, 21, -0.75), w2 = ell(gx, gy, 152, 54, 34, 18, -1.05);
      var w = w1.d <= 1 ? w1 : w2.d <= 1 ? w2 : null;
      if (w) wings.push({ x: gx, y: gy, rim: w.d > 0.72, ph: gx * 0.31 + gy * 0.17 });
    }
    // Antennae: two short curves of small dots.
    var antennae = [];
    [[52, 68, 40, 44, 26, 30], [66, 66, 64, 42, 54, 24]].forEach(function (q) {
      for (var t = 0; t <= 1.001; t += 0.12) {
        var it = 1 - t;
        antennae.push({ x: it * it * q[0] + 2 * it * t * q[2] + t * t * q[4], y: it * it * q[1] + 2 * it * t * q[3] + t * t * q[5] });
      }
    });
    var dot = function (x, y, r, color) { bctx.fillStyle = color; bctx.beginPath(); bctx.arc(x, y, r, 0, 6.2832); bctx.fill(); };
    var paintBee = function (time) {
      bctx.clearRect(0, 0, BW, BH);
      wings.forEach(function (w) {
        var f = reduced ? 1 : 0.55 + 0.45 * Math.sin(time / 38 + w.ph);
        dot(w.x, w.y, STEP * (w.rim ? 0.32 : 0.22) * f, w.rim ? 'rgba(236,234,228,.85)' : 'rgba(236,234,228,.5)');
      });
      body.forEach(function (c) { dot(c.x, c.y, c.r, c.dark ? '#4A3B22' : '#F5A11D'); });
      head.forEach(function (c) { dot(c.x, c.y, c.r, c.eye ? '#F5A11D' : '#6E6D69'); });
      antennae.forEach(function (c, i) { dot(c.x, c.y, i % 9 === 8 ? 2.4 : 1.2, '#9B9A95'); });
    };
    paintBee(0);
    if (!reduced) {
      var beeOn = false, beeLast = 0;
      new IntersectionObserver(function (entries) {
        beeOn = entries[0].isIntersecting;
        if (beeOn) requestAnimationFrame(beeFrame);
      }).observe(bee);
      // About 30 frames a second is plenty for a flicker, and it stops off screen.
      var beeFrame = function (now) {
        if (!beeOn) return;
        if (now - beeLast > 33) { beeLast = now; paintBee(now); }
        requestAnimationFrame(beeFrame);
      };
    }
  }

  // Scroll: the editor rises flat, ghost words drift, the run advances.
  var heroShot = $('#hero-shot');
  var ghosts = $$('.ghost');
  var ticking = false;
  function onScroll() {
    ticking = false;
    var vh = window.innerHeight;
    heroShot.style.setProperty('--rise', Math.min(1, window.scrollY / (vh * 0.45)).toFixed(3));
    ghosts.forEach(function (g) {
      var r = g.parentElement.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh) return;
      g.style.setProperty('--drift', ((vh - r.top) * 0.14).toFixed(1));
    });
    runScroll();
  }
  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  // Hex cursor: a honey cell trails the pointer and opens over anything clickable.
  var hexCur = $('#cursor-hex');
  if (hexCur && window.matchMedia('(hover: hover) and (pointer: fine)').matches && !reduced) {
    document.addEventListener('mousemove', function (e) {
      hexCur.style.setProperty('--cx', e.clientX + 'px');
      hexCur.style.setProperty('--cy', e.clientY + 'px');
      hexCur.classList.toggle('is-over', !!e.target.closest('a, button, summary, label, input, textarea'));
    }, { passive: true });
    document.addEventListener('mouseleave', function () { hexCur.style.setProperty('--cx', '-100px'); });
  }

  // Closing pill: shot descriptions typed one after another, only while on screen.
  var ct = $('#closing-typed');
  if (ct && !reduced) {
    var prompts = JSON.parse(ct.dataset.prompts || '[]');
    var ctVisible = false, ctWake = null;
    new IntersectionObserver(function (entries) {
      ctVisible = entries[0].isIntersecting;
      if (ctVisible && ctWake) { ctWake(); ctWake = null; }
    }).observe(ct);
    (async function () {
      var k = 0;
      for (;;) {
        if (!ctVisible) await new Promise(function (r) { ctWake = r; });
        await sleep(1900);
        var shown = ct.textContent;
        for (var d = shown.length - 1; d >= 0; d--) { ct.textContent = shown.slice(0, d); await sleep(12); }
        await sleep(320);
        k = (k + 1) % prompts.length;
        var p = prompts[k];
        for (var i = 1; i <= p.length; i++) { ct.textContent = p.slice(0, i); await sleep(38 + Math.random() * 34); }
      }
    })();
  }
})();
