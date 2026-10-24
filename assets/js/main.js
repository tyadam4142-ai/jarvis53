/* ============================================================
   JARVIS 53 — main.js
   Vanilla JS · no dependencies · defer-loaded
   Modules: nav, mobile menu, reveals, active links, starfield,
   arc reactor canvas, terminal tabs + copy, FAQ, OS detect,
   magnetic buttons, ⌘K palette, billing toggle.
   ============================================================ */
(function () {
  'use strict';

  var doc = document;
  var root = doc.documentElement;
  root.classList.add('js');

  var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var TAU = Math.PI * 2;

  function $(sel, ctx) { return (ctx || doc).querySelector(sel); }
  function $all(sel, ctx) { return Array.prototype.slice.call((ctx || doc).querySelectorAll(sel)); }

  /* ----------------------------------------------------------
     1. NAV — solid on scroll
  ---------------------------------------------------------- */
  var nav = $('#siteNav');
  function onNavScroll() {
    if (!nav) return;
    nav.classList.toggle('scrolled', window.scrollY > 14);
  }
  window.addEventListener('scroll', onNavScroll, { passive: true });
  onNavScroll();

  /* ----------------------------------------------------------
     2. MOBILE MENU
  ---------------------------------------------------------- */
  var burger = $('#navBurger');
  var mobileMenu = $('#mobileMenu');

  function setMenu(open) {
    if (!burger || !mobileMenu) return;
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open) {
      mobileMenu.hidden = false;
      nav.classList.add('scrolled');
    } else {
      mobileMenu.hidden = true;
      onNavScroll();
    }
  }
  if (burger && mobileMenu) {
    burger.addEventListener('click', function () {
      setMenu(burger.getAttribute('aria-expanded') !== 'true');
    });
    $all('[data-mobile-link]', mobileMenu).forEach(function (a) {
      a.addEventListener('click', function () { setMenu(false); });
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth > 960 && burger.getAttribute('aria-expanded') === 'true') setMenu(false);
    });
  }

  /* ----------------------------------------------------------
     3. SCROLL REVEAL (IntersectionObserver, staggered)
  ---------------------------------------------------------- */
  var revealEls = $all('.reveal');
  if (!('IntersectionObserver' in window) || REDUCED) {
    revealEls.forEach(function (el) { el.classList.add('in-view'); });
  } else {
    var revealIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var el = entry.target;
          el.classList.add('in-view');
          revealIO.unobserve(el);
          /* after the entrance transition, hand transitions back to hover states */
          function markRevealed(e) {
            if (e && e.propertyName !== 'opacity') return;
            el.classList.add('revealed');
            el.removeEventListener('transitionend', markRevealed);
          }
          el.addEventListener('transitionend', markRevealed);
          setTimeout(function () { el.classList.add('revealed'); }, 1400);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    revealEls.forEach(function (el) { revealIO.observe(el); });
  }

  /* ----------------------------------------------------------
     4. ACTIVE NAV LINK HIGHLIGHT
  ---------------------------------------------------------- */
  var navLinks = $all('[data-nav-link]');
  var sections = navLinks
    .map(function (a) { return $(a.getAttribute('href')); })
    .filter(Boolean);

  if ('IntersectionObserver' in window && sections.length) {
    var activeIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var id = '#' + entry.target.id;
        navLinks.forEach(function (a) {
          a.classList.toggle('active', a.getAttribute('href') === id);
        });
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    sections.forEach(function (s) { activeIO.observe(s); });
  }

  /* ----------------------------------------------------------
     5. TOAST
  ---------------------------------------------------------- */
  var toast = $('#toast');
  var toastTimer = null;
  function showToast(msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove('show'); }, 1900);
  }

  /* ----------------------------------------------------------
     6. TERMINAL TABS + COPY BUTTONS
  ---------------------------------------------------------- */
  var tabs = $all('.term-tab');
  function selectTab(tab) {
    tabs.forEach(function (t) {
      var selected = t === tab;
      t.setAttribute('aria-selected', selected ? 'true' : 'false');
      t.tabIndex = selected ? 0 : -1;
      var panel = $('#' + t.getAttribute('aria-controls'));
      if (panel) panel.hidden = !selected;
    });
    tab.focus();
  }
  tabs.forEach(function (tab, i) {
    tab.addEventListener('click', function () { selectTab(tab); });
    tab.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      e.preventDefault();
      var next = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
      selectTab(next);
    });
  });

  function copyText(text, done) {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(function () { done(true); }, function () { done(fallbackCopy(text)); });
    } else {
      done(fallbackCopy(text));
    }
  }
  function fallbackCopy(text) {
    try {
      var ta = doc.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      doc.body.appendChild(ta);
      ta.select();
      var ok = doc.execCommand('copy');
      doc.body.removeChild(ta);
      return ok;
    } catch (err) {
      return false;
    }
  }

  $all('.copy-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var target = $('#' + btn.getAttribute('data-copy-target'));
      if (!target) return;
      var text = (target.textContent || '').replace(/\s+$/, '');
      copyText(text, function (ok) {
        showToast(ok ? 'Copied to clipboard' : 'Copy failed — select manually');
        var label = $('span', btn);
        if (label && ok) {
          var original = label.textContent;
          label.textContent = 'Copied!';
          setTimeout(function () { label.textContent = original; }, 1600);
        }
      });
    });
  });

  /* ----------------------------------------------------------
     7. FAQ ACCORDION
  ---------------------------------------------------------- */
  var faqItems = $all('.faq-item');
  faqItems.forEach(function (item) {
    var q = $('.faq-q', item);
    if (!q) return;
    q.addEventListener('click', function () {
      var isOpen = item.classList.contains('open');
      faqItems.forEach(function (other) {
        other.classList.remove('open');
        var otherQ = $('.faq-q', other);
        if (otherQ) otherQ.setAttribute('aria-expanded', 'false');
      });
      if (!isOpen) {
        item.classList.add('open');
        q.setAttribute('aria-expanded', 'true');
      }
    });
  });

  /* ----------------------------------------------------------
     8. OS AUTO-DETECTION (degradable)
  ---------------------------------------------------------- */
  (function detectOS() {
    var ua = navigator.userAgent || '';
    var os = null;
    if (/Macintosh|Mac OS X|iPhone|iPad|iPod/i.test(ua)) os = 'mac';
    else if (/Windows NT|Win64|Win32/i.test(ua)) os = 'win';
    if (!os) return;
    var card = $('#dl-' + os);
    if (!card) return;
    var badge = $('.dl-detected', card);
    card.classList.add('detected');
    if (badge) badge.hidden = false;
  })();

  /* ----------------------------------------------------------
     9. MAGNETIC BUTTONS (fine pointers only)
  ---------------------------------------------------------- */
  if (!REDUCED && window.matchMedia('(pointer: fine)').matches) {
    $all('.magnetic').forEach(function (el) {
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        var x = ((e.clientX - r.left) / r.width - 0.5) * 10;
        var y = ((e.clientY - r.top) / r.height - 0.5) * 7;
        el.style.setProperty('--mx', x.toFixed(1) + 'px');
        el.style.setProperty('--my', y.toFixed(1) + 'px');
      });
      el.addEventListener('mouseleave', function () {
        el.style.setProperty('--mx', '0px');
        el.style.setProperty('--my', '0px');
      });
    });
  }

  /* ----------------------------------------------------------
     10. ⌘K COMMAND PALETTE
  ---------------------------------------------------------- */
  var palette = $('#palette');
  var paletteInput = $('#paletteInput');
  var paletteList = $('#paletteList');
  var paletteOpenBtn = $('#paletteOpen');
  var lastFocused = null;

  function openPalette() {
    if (!palette) return;
    lastFocused = doc.activeElement;
    palette.hidden = false;
    requestAnimationFrame(function () { palette.classList.add('open'); });
    if (paletteInput) { paletteInput.value = ''; filterPalette(''); setTimeout(function () { paletteInput.focus(); }, 40); }
  }
  function closePalette() {
    if (!palette || palette.hidden) return;
    palette.classList.remove('open');
    setTimeout(function () { palette.hidden = true; }, 220);
    if (lastFocused && lastFocused.focus) lastFocused.focus();
  }
  function filterPalette(q) {
    if (!paletteList) return;
    var query = q.trim().toLowerCase();
    $all('li', paletteList).forEach(function (li) {
      var text = (li.textContent || '').toLowerCase();
      li.hidden = query !== '' && text.indexOf(query) === -1;
    });
  }

  if (palette && paletteInput && paletteList) {
    paletteOpenBtn && paletteOpenBtn.addEventListener('click', openPalette);
    palette.addEventListener('click', function (e) {
      if (e.target.hasAttribute('data-palette-close')) closePalette();
    });
    $all('[data-palette-link]', palette).forEach(function (a) {
      a.addEventListener('click', function () { closePalette(); });
    });
    paletteInput.addEventListener('input', function () { filterPalette(paletteInput.value); });

    doc.addEventListener('keydown', function (e) {
      var meta = e.metaKey || e.ctrlKey;
      if (meta && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        palette.hidden ? openPalette() : closePalette();
        return;
      }
      if (e.key === 'Escape') {
        if (!palette.hidden) { closePalette(); return; }
        if (burger && burger.getAttribute('aria-expanded') === 'true') setMenu(false);
      }
    });
  }

  /* ----------------------------------------------------------
     11. PRICING — monthly / annual billing toggle
     Annual = 10× monthly (2 months free). Prices live in
     data-monthly / data-annual attrs on .price-value.
  ---------------------------------------------------------- */
  (function initBilling() {
    var toggle = $('.billing-toggle');
    if (!toggle) return;
    var opts = $all('.bt-opt', toggle);

    function setBilling(mode) {
      opts.forEach(function (b) {
        var on = b.getAttribute('data-billing') === mode;
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      $all('.price-value[data-monthly]').forEach(function (el) {
        el.textContent = el.getAttribute(mode === 'monthly' ? 'data-monthly' : 'data-annual');
      });
      $all('[data-per]').forEach(function (el) {
        el.textContent = mode === 'monthly' ? '/ mo' : '/ yr';
      });
      $all('[data-note]').forEach(function (el) {
        el.textContent = mode === 'monthly' ? 'billed monthly · cancel anytime' : 'billed once a year · 2 months free';
      });
    }

    opts.forEach(function (b) {
      b.addEventListener('click', function () { setBilling(b.getAttribute('data-billing')); });
    });
    setBilling('monthly');
  })();

  /* ==========================================================
     CANVAS ENGINES — starfield + arc reactor
     One shared rAF loop, paused when hero is off-screen.
  ========================================================== */
  var hero = $('#hero');
  var starCanvas = $('#starfield');
  var reactorCanvas = $('#reactor');
  var reactorTilt = $('#reactorTilt');

  var DPR = Math.min(window.devicePixelRatio || 1, 2);
  var running = !REDUCED;
  var rafId = null;
  var lastT = 0;

  /* ---- glow sprite factory (pre-rendered, cheap to blit) ---- */
  function makeGlow(size, stops) {
    var c = doc.createElement('canvas');
    c.width = c.height = size;
    var g = c.getContext('2d');
    var grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    stops.forEach(function (s) { grad.addColorStop(s[0], s[1]); });
    g.fillStyle = grad;
    g.fillRect(0, 0, size, size);
    return c;
  }
  var glowCyan = makeGlow(256, [
    [0, 'rgba(180,247,255,0.85)'],
    [0.25, 'rgba(0,229,255,0.45)'],
    [0.6, 'rgba(0,229,255,0.12)'],
    [1, 'rgba(0,229,255,0)']
  ]);
  var glowWhite = makeGlow(128, [
    [0, 'rgba(255,255,255,0.9)'],
    [0.4, 'rgba(160,240,255,0.35)'],
    [1, 'rgba(160,240,255,0)']
  ]);

  /* ---------------- STARFIELD ---------------- */
  var stars = [], motes = [];
  var sCtx = null, sW = 0, sH = 0;

  function sizeStarfield() {
    if (!starCanvas || !hero) return;
    sW = hero.clientWidth;
    sH = hero.clientHeight;
    starCanvas.width = Math.round(sW * DPR);
    starCanvas.height = Math.round(sH * DPR);
    sCtx = starCanvas.getContext('2d');
    sCtx.setTransform(DPR, 0, 0, DPR, 0, 0);

    var count = Math.min(230, Math.round((sW * sH) / 8500));
    stars = [];
    for (var i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * sW,
        y: Math.random() * sH,
        r: 0.35 + Math.random() * 1.15,
        v: 4 + Math.random() * 13,
        tw: 0.6 + Math.random() * 2.2,
        ph: Math.random() * TAU,
        c: Math.random() < 0.08 ? 'rgba(255,200,87,' : (Math.random() < 0.3 ? 'rgba(0,229,255,' : 'rgba(214,235,250,')
      });
    }
    motes = [];
    var mCount = Math.max(6, Math.round(count / 22));
    for (var j = 0; j < mCount; j++) {
      motes.push({
        x: Math.random() * sW,
        y: Math.random() * sH,
        r: 1.6 + Math.random() * 2.4,
        v: 2 + Math.random() * 5,
        drift: (Math.random() - 0.5) * 6,
        ph: Math.random() * TAU
      });
    }
  }

  function drawStars(t, dt) {
    if (!sCtx) return;
    sCtx.clearRect(0, 0, sW, sH);
    var i, s;

    for (i = 0; i < motes.length; i++) {
      s = motes[i];
      s.y += s.v * dt;
      s.x += Math.sin(t * 0.0003 + s.ph) * s.drift * dt;
      if (s.y > sH + 10) { s.y = -10; s.x = Math.random() * sW; }
      if (s.x < -10) s.x = sW + 10; else if (s.x > sW + 10) s.x = -10;
      var a = 0.16 + 0.1 * Math.sin(t * 0.0011 + s.ph);
      var gr = 14 + 3 * Math.sin(t * 0.0009 + s.ph);
      sCtx.globalAlpha = a;
      sCtx.drawImage(glowCyan, s.x - gr, s.y - gr, gr * 2, gr * 2);
    }

    for (i = 0; i < stars.length; i++) {
      s = stars[i];
      s.y += s.v * dt;
      if (s.y > sH + 4) { s.y = -4; s.x = Math.random() * sW; }
      var tw = 0.55 + 0.45 * Math.sin(t * 0.001 * s.tw + s.ph);
      sCtx.globalAlpha = 1;
      sCtx.fillStyle = s.c + (0.28 + 0.6 * tw) + ')';
      sCtx.beginPath();
      sCtx.arc(s.x, s.y, s.r, 0, TAU);
      sCtx.fill();
      if (s.r > 1.15) {
        sCtx.globalAlpha = 0.35 * tw;
        sCtx.drawImage(glowWhite, s.x - 6, s.y - 6, 12, 12);
      }
    }
    sCtx.globalAlpha = 1;
  }

  /* ---------------- ARC REACTOR ---------------- */
  var rCtx = null, rSize = 0, rR = 0;
  var mouse = { x: 0, y: 0, tx: 0, ty: 0 }; // eased + target (-1..1)

  function sizeReactor() {
    if (!reactorCanvas) return;
    var box = reactorCanvas.getBoundingClientRect();
    rSize = Math.max(200, box.width || 380);
    rR = rSize / 2;
    reactorCanvas.width = Math.round(rSize * DPR);
    reactorCanvas.height = Math.round(rSize * DPR);
    rCtx = reactorCanvas.getContext('2d');
    rCtx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }

  function ring(r, width, color, alpha, dash, dashOffset) {
    rCtx.beginPath();
    rCtx.arc(0, 0, r, 0, TAU);
    rCtx.lineWidth = width;
    rCtx.strokeStyle = color;
    rCtx.globalAlpha = alpha;
    rCtx.setLineDash(dash || []);
    rCtx.lineDashOffset = dashOffset || 0;
    rCtx.stroke();
    rCtx.setLineDash([]);
    rCtx.globalAlpha = 1;
  }

  function drawReactor(t) {
    if (!rCtx) return;
    var cx = rSize / 2, cy = rSize / 2;
    var R = rR;
    var pulse = Math.sin(t * 0.0021);
    var pulse2 = Math.sin(t * 0.0009 + 1.3);

    rCtx.clearRect(0, 0, rSize, rSize);
    rCtx.save();
    rCtx.translate(cx, cy);

    /* --- additive glow layer --- */
    rCtx.globalCompositeOperation = 'lighter';

    var haloR = R * (1.55 + 0.07 * pulse);
    rCtx.globalAlpha = 0.5 + 0.14 * pulse;
    rCtx.drawImage(glowCyan, -haloR, -haloR, haloR * 2, haloR * 2);

    var coreR = R * (0.34 + 0.028 * pulse);
    rCtx.globalAlpha = 0.9;
    rCtx.drawImage(glowCyan, -coreR * 1.6, -coreR * 1.6, coreR * 3.2, coreR * 3.2);

    /* --- orbiting nodes (8) --- */
    for (var n = 0; n < 8; n++) {
      var na = t * 0.00042 + (n / 8) * TAU + mouse.x * 0.15;
      var nx = Math.cos(na) * R * 0.735;
      var ny = Math.sin(na) * R * 0.735;
      var ng = R * 0.075;
      rCtx.globalAlpha = 0.85;
      rCtx.drawImage(glowWhite, nx - ng, ny - ng, ng * 2, ng * 2);
      rCtx.globalAlpha = 1;
      rCtx.fillStyle = '#DFFAFF';
      rCtx.beginPath();
      rCtx.arc(nx, ny, R * 0.012, 0, TAU);
      rCtx.fill();
    }

    rCtx.globalCompositeOperation = 'source-over';

    /* --- static faint boundary --- */
    ring(R * 0.995, 1, '#00E5FF', 0.14);
    ring(R * 0.5, 2, '#00E5FF', 0.55);

    /* --- dashed rings, opposite rotations --- */
    ring(R * 0.62, 1.4, '#00E5FF', 0.65, [2, 9], -t * 0.055);
    ring(R * 0.735, 3, '#00E5FF', 0.28, [26, 18], t * 0.028 + mouse.y * 6);
    ring(R * 0.62, 1.4, '#7FF0FF', 0.2, [2, 9], -t * 0.055 + 5);

    /* --- segmented arc ring --- */
    rCtx.save();
    rCtx.rotate(-t * 0.00012 + mouse.x * 0.1);
    rCtx.lineWidth = 4;
    rCtx.strokeStyle = '#00E5FF';
    rCtx.globalAlpha = 0.5;
    for (var sgi = 0; sgi < 12; sgi++) {
      var a0 = (sgi / 12) * TAU;
      rCtx.beginPath();
      rCtx.arc(0, 0, R * 0.845, a0, a0 + 0.24);
      rCtx.stroke();
    }
    rCtx.globalAlpha = 1;
    rCtx.restore();

    /* --- tick ring --- */
    rCtx.save();
    rCtx.rotate(t * 0.00006);
    for (var ti = 0; ti < 60; ti++) {
      var ta = (ti / 60) * TAU;
      var major = ti % 5 === 0;
      var r1 = R * (major ? 0.902 : 0.932);
      var r2 = R * 0.975;
      rCtx.beginPath();
      rCtx.moveTo(Math.cos(ta) * r1, Math.sin(ta) * r1);
      rCtx.lineTo(Math.cos(ta) * r2, Math.sin(ta) * r2);
      if (ti % 15 === 0) {
        rCtx.strokeStyle = '#FFC857';
        rCtx.globalAlpha = 0.85;
      } else {
        rCtx.strokeStyle = '#00E5FF';
        rCtx.globalAlpha = major ? 0.75 : 0.3;
      }
      rCtx.lineWidth = major ? 1.6 : 1;
      rCtx.stroke();
    }
    rCtx.globalAlpha = 1;
    rCtx.restore();

    /* --- inner triangle --- */
    rCtx.save();
    rCtx.rotate(-t * 0.00008);
    rCtx.beginPath();
    for (var v = 0; v < 3; v++) {
      var va = -Math.PI / 2 + (v / 3) * TAU;
      var vx = Math.cos(va) * R * 0.2;
      var vy = Math.sin(va) * R * 0.2;
      if (v === 0) rCtx.moveTo(vx, vy); else rCtx.lineTo(vx, vy);
    }
    rCtx.closePath();
    rCtx.strokeStyle = 'rgba(234,251,255,0.95)';
    rCtx.lineWidth = 2;
    rCtx.lineJoin = 'round';
    rCtx.shadowColor = 'rgba(0,229,255,0.8)';
    rCtx.shadowBlur = 12;
    rCtx.stroke();
    rCtx.shadowBlur = 0;
    rCtx.restore();

    /* --- core --- */
    var whiteR = R * (0.075 + 0.018 * pulse2);
    rCtx.globalAlpha = 1;
    rCtx.fillStyle = '#F2FDFF';
    rCtx.beginPath();
    rCtx.arc(0, 0, whiteR, 0, TAU);
    rCtx.fill();

    rCtx.globalCompositeOperation = 'lighter';
    var cg = R * (0.16 + 0.02 * pulse2);
    rCtx.globalAlpha = 0.9;
    rCtx.drawImage(glowWhite, -cg, -cg, cg * 2, cg * 2);
    rCtx.globalCompositeOperation = 'source-over';
    rCtx.globalAlpha = 1;

    rCtx.restore();
  }

  /* ---------------- SHARED LOOP ---------------- */
  function frame(t) {
    var dt = Math.min(0.05, (t - lastT) / 1000 || 0.016);
    lastT = t;

    /* ease mouse tilt */
    mouse.x += (mouse.tx - mouse.x) * 0.06;
    mouse.y += (mouse.ty - mouse.y) * 0.06;
    if (reactorTilt) {
      reactorTilt.style.transform =
        'rotateX(' + (-mouse.y * 5).toFixed(2) + 'deg) rotateY(' + (mouse.x * 5).toFixed(2) + 'deg)';
    }

    drawStars(t, dt);
    drawReactor(t);
    rafId = requestAnimationFrame(frame);
  }

  function startLoop() {
    if (REDUCED || rafId !== null) return;
    lastT = performance.now();
    rafId = requestAnimationFrame(frame);
  }
  function stopLoop() {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  }

  /* ---------------- INIT + RESIZE ---------------- */
  function sizeAll() {
    sizeStarfield();
    sizeReactor();
    if (REDUCED) {
      /* render one static, cinematic frame */
      drawStars(4000, 0);
      drawReactor(4000);
    }
  }

  if (starCanvas && reactorCanvas) {
    sizeAll();
    if (!REDUCED) {
      startLoop();

      /* pause when hero leaves the viewport */
      if ('IntersectionObserver' in window && hero) {
        new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) startLoop(); else stopLoop();
          });
        }, { threshold: 0.02 }).observe(hero);
      }

      /* mouse influence — subtle, over the whole hero */
      if (hero && window.matchMedia('(pointer: fine)').matches) {
        hero.addEventListener('mousemove', function (e) {
          var rect = hero.getBoundingClientRect();
          mouse.tx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
          mouse.ty = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
        });
        hero.addEventListener('mouseleave', function () {
          mouse.tx = 0; mouse.ty = 0;
        });
      }
    }

    var resizeTimer = null;
    window.addEventListener('resize', function () {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(sizeAll, 120);
    });
    window.addEventListener('orientationchange', function () {
      setTimeout(sizeAll, 200);
    });
  }
})();
