// IonX Studios site interactions. No dependencies.
(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;

  $$('[data-year]').forEach((el) => (el.textContent = new Date().getFullYear()));
  $$('.voice-bars i').forEach((el, i) => el.style.setProperty('--n', i));

  // ---------- Split headline text into characters ----------
  $$('.split').forEach((el, li) => {
    const text = el.textContent;
    el.textContent = '';
    let i = 0;
    text.split(' ').forEach((word, wi) => {
      if (wi) el.appendChild(document.createTextNode(' '));
      const w = document.createElement('span');
      w.className = 'word';
      [...word].forEach((c) => {
        const s = document.createElement('span');
        s.className = 'ch';
        s.textContent = c;
        s.style.setProperty('--i', i++);
        s.style.setProperty('--base', `${li % 2 ? 120 : 0}ms`);
        w.appendChild(s);
      });
      el.appendChild(w);
    });
    el.setAttribute('aria-hidden', 'true');
  });

  // ---------- Reveal on scroll ----------
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add('is-in');
      io.unobserve(e.target);
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
  // Stagger siblings that reveal together
  $$('.reveal').forEach((el) => {
    const sibs = $$(':scope > .reveal', el.parentElement);
    el.style.setProperty('--d', `${sibs.indexOf(el) * 70}ms`);
    io.observe(el);
  });
  $$('.hero-title, .contact-title').forEach((el) => io.observe(el));

  // ---------- Nav: scrolled state, hide on scroll down, active link ----------
  const nav = $('[data-nav]');
  const bar = $('.progress span');
  const pin = $('[data-pinwheel] svg');
  const flow = $('[data-flow]');
  let lastY = scrollY;
  let pinAngle = 0, pinVel = 0, pinScroll = 0;

  const onScroll = () => {
    const y = scrollY;
    const max = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    nav.classList.toggle('is-scrolled', y > 20);
    const menuOpen = $('[data-menu]').classList.contains('is-open');
    nav.classList.toggle('is-hidden', !menuOpen && y > lastY && y > 400);
    lastY = y;
    pinScroll = y * 0.12;

    if (flow) {
      const r = flow.getBoundingClientRect();
      const p = clamp((innerHeight * 0.8 - r.top) / (r.height * 0.8), 0, 1);
      const lit = Math.min(3, Math.floor(p * 3.2));
      $$('li', flow).forEach((li, i) => li.classList.toggle('is-lit', i < lit));
      flow.style.setProperty('--flow', clamp((lit - 1) / 2, 0, 1));
    }
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Highlight the nav link for the section in view
  const links = $$('.menu a:not(.btn)');
  const sio = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      links.forEach((a) => a.classList.toggle('is-current', a.getAttribute('href') === `#${e.target.id}`));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  ['work', 'studio', 'contact'].forEach((id) => $(`#${id}`) && sio.observe($(`#${id}`)));

  // ---------- Mobile menu ----------
  const menuBtn = $('[data-menu-btn]');
  const menu = $('[data-menu]');
  const setMenu = (open) => {
    menu.classList.toggle('is-open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    document.body.style.overflow = open ? 'hidden' : '';
  };
  menuBtn.addEventListener('click', () => setMenu(!menu.classList.contains('is-open')));
  $$('a', menu).forEach((a) => a.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });

  // ---------- Pinwheel: follows the mouse, spins on click, turns with scroll ----------
  const pinBtn = $('[data-pinwheel]');
  let tiltX = 0, tiltY = 0, tTiltX = 0, tTiltY = 0;
  pinBtn.addEventListener('click', () => { pinVel += reduced ? 0 : 38; });
  addEventListener('pointermove', (e) => {
    tTiltX = (e.clientY / innerHeight - 0.5) * -18;
    tTiltY = (e.clientX / innerWidth - 0.5) * 18;
  }, { passive: true });

  // ---------- Custom cursor ----------
  const cursor = $('.cursor');
  const dot = $('.cursor-dot');
  const ring = $('.cursor-ring');
  let mx = -100, my = -100, rx = -100, ry = -100;
  if (finePointer && !reduced) {
    document.documentElement.classList.add('has-cursor');
    addEventListener('pointermove', (e) => { mx = e.clientX; my = e.clientY; cursor.classList.remove('is-hidden'); }, { passive: true });
    document.addEventListener('pointerleave', () => cursor.classList.add('is-hidden'));
    addEventListener('pointerdown', () => cursor.classList.add('is-down'));
    addEventListener('pointerup', () => cursor.classList.remove('is-down'));
    document.addEventListener('pointerover', (e) => {
      cursor.classList.toggle('is-hover', !!e.target.closest('a, button, label, [data-tilt], .ss-divider'));
    });
  }

  // ---------- Magnetic buttons ----------
  if (finePointer && !reduced) {
    $$('.magnetic').forEach((el) => {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        el.style.setProperty('--mx', `${(e.clientX - r.left - r.width / 2) * 0.25}px`);
        el.style.setProperty('--my', `${(e.clientY - r.top - r.height / 2) * 0.35}px`);
      });
      el.addEventListener('pointerleave', () => { el.style.setProperty('--mx', '0px'); el.style.setProperty('--my', '0px'); });
    });
  }

  // ---------- Tilt card with glare ----------
  $$('[data-tilt]').forEach((card) => {
    if (!finePointer || reduced) return;
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      card.classList.add('is-active');
      card.style.setProperty('--ry', `${(px - 0.5) * 10}deg`);
      card.style.setProperty('--rx', `${(0.5 - py) * 8}deg`);
      card.style.setProperty('--gx', `${px * 100}%`);
      card.style.setProperty('--gy', `${py * 100}%`);
    });
    card.addEventListener('pointerleave', () => {
      card.classList.remove('is-active');
      card.style.setProperty('--rx', '0deg');
      card.style.setProperty('--ry', '0deg');
    });
  });

  // ---------- SAINT screenshot tabs (auto-advance until the user picks one) ----------
  const shots = $$('[data-shots] img');
  const tabs = $$('[data-shot]');
  let shotIdx = 0, shotTimer;
  const showShot = (i) => {
    shotIdx = i;
    shots.forEach((img, j) => img.classList.toggle('is-active', j === i));
    tabs.forEach((t, j) => t.setAttribute('aria-selected', String(j === i)));
  };
  tabs.forEach((t, i) => t.addEventListener('click', () => { clearInterval(shotTimer); showShot(i); }));
  tabs.forEach((t, i) => t.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const n = (i + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
    clearInterval(shotTimer); showShot(n); tabs[n].focus();
  }));
  if (!reduced && shots.length) {
    const shotIo = new IntersectionObserver(([e]) => {
      clearInterval(shotTimer);
      if (e.isIntersecting) shotTimer = setInterval(() => showShot((shotIdx + 1) % shots.length), 3600);
    }, { threshold: 0.4 });
    shotIo.observe($('[data-shots]'));
    tabs.forEach((t) => t.addEventListener('click', () => shotIo.disconnect(), { once: true }));
  }

  // ---------- Split-screen clips (play only while visible) ----------
  const clip = $('[data-clip]');
  if (clip) {
    const vids = $$('video', clip);
    const clipTabs = $$('[data-clip-tab]');
    const toggle = $('[data-clip-toggle]', clip);
    let cur = 0, inView = false, userPaused = reduced;
    const load = (v) => { if (!v.src) v.src = v.dataset.src; };
    const sync = () => {
      vids.forEach((v, i) => {
        v.classList.toggle('is-active', i === cur);
        if (i === cur && inView && !userPaused) { load(v); v.play().catch(() => {}); } else v.pause();
      });
      toggle.classList.toggle('is-paused', userPaused);
      toggle.setAttribute('aria-label', userPaused ? 'Play video' : 'Pause video');
    };
    clipTabs.forEach((t, i) => t.addEventListener('click', () => {
      cur = i;
      clipTabs.forEach((x, k) => x.setAttribute('aria-selected', String(k === i)));
      sync();
    }));
    toggle.addEventListener('click', () => { userPaused = !userPaused; sync(); });
    new IntersectionObserver(([e]) => { inView = e.isIntersecting; sync(); }, { threshold: 0.35 }).observe(clip);
    sync();
  }

  // ---------- Fix lab: each missing fix shows its bug on P2's half ----------
  const ss = $('[data-ss]');
  if (ss) {
    const p2 = $('[data-ss-p2]');
    const status = $('[data-ss-status]');
    const fixes = $$('[data-fix]');
    // Checked in pipeline order: the last broken stage is what the player would see.
    const stages = [
      ['composite', 'P2: black screen (written off the buffer)'],
      ['culling', 'P2: empty world (culled against P1)'],
      ['lighting', 'P2: unlit, flickering reflections'],
      ['ssbn', 'P2: stale ambient occlusion'],
    ];
    const update = () => {
      const on = (k) => fixes.find((f) => f.dataset.fix === k).getAttribute('aria-pressed') === 'true';
      const broken = stages.find(([k]) => !on(k));
      p2.className = `ss-p2${broken ? ` bug-${broken[0]}` : ''}`;
      status.textContent = broken ? broken[1] : 'P2: rendering correctly';
    };
    fixes.forEach((b) => b.addEventListener('click', () => {
      ss.dataset.touched = '1';
      b.setAttribute('aria-pressed', String(b.getAttribute('aria-pressed') !== 'true'));
      update();
    }));
    update();
    // Play the fixes once when the frame scrolls into view
    if (!reduced) {
      const ssIo = new IntersectionObserver(([e]) => {
        if (!e.isIntersecting) return;
        ssIo.disconnect();
        stages.forEach(([k], i) => setTimeout(() => {
          if (ss.dataset.touched) return;
          fixes.find((f) => f.dataset.fix === k).setAttribute('aria-pressed', 'true');
          update();
        }, 1000 + i * 1100));
      }, { threshold: 0.6 });
      ssIo.observe(ss);
    }
  }

  // ---------- Gallery lightbox ----------
  const gallery = $('[data-gallery]');
  if (gallery) {
    const box = document.createElement('div');
    box.className = 'lightbox';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    box.setAttribute('aria-label', 'Screenshot');
    box.innerHTML = '<button type="button" class="lightbox-close">Close</button><img alt="">';
    document.body.appendChild(box);
    const img = $('img', box);
    let opener = null;
    const close = () => { box.classList.remove('is-open'); opener?.focus(); };
    $$('button', gallery).forEach((b) => b.addEventListener('click', () => {
      opener = b;
      img.src = b.dataset.full;
      img.alt = $('img', b).alt;
      box.classList.add('is-open');
      $('.lightbox-close', box).focus();
    }));
    box.addEventListener('click', (e) => { if (e.target !== img) close(); });
    addEventListener('keydown', (e) => { if (e.key === 'Escape' && box.classList.contains('is-open')) close(); });
  }

  // ---------- Spotlight that follows the mouse on capability cards ----------
  $$('[data-spot]').forEach((el) => el.addEventListener('pointermove', (e) => {
    const r = el.getBoundingClientRect();
    el.style.setProperty('--sx', `${e.clientX - r.left}px`);
    el.style.setProperty('--sy', `${e.clientY - r.top}px`);
  }));

  // Social links not filled in yet do nothing when clicked
  $$('.social.is-pending, .pcard-link[href="#"]').forEach((a) => a.addEventListener('click', (e) => e.preventDefault()));

  // ---------- Copy email ----------
  const toast = $('[data-toast]');
  let toastTimer;
  const showToast = (msg) => {
    toast.textContent = msg;
    toast.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('is-on'), 2400);
  };
  $$('[data-copy]').forEach((b) => b.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(b.dataset.copy);
      showToast('Email address copied');
    } catch {
      showToast(b.dataset.copy);
    }
  }));

  // ---------- Contact form: opens a filled-in Gmail draft in a new tab ----------
  const form = $('[data-form]');
  if (form) {
    const TO = 'IonX.Dev@gmail.com';
    const msg = $('[data-form-msg]');
    const subjectEl = $('[data-preview-subject]');
    const mailto = $('[data-mailto]');
    const compose = () => {
      const d = Object.fromEntries(new FormData(form));
      const name = (d.name || '').trim();
      const subject = `${d.topic}${name ? ` from ${name}` : ''} | IonX Studios website`;
      const body = `Hi IonX team,\n\n${(d.message || '').trim()}\n\nThanks,\n${name}`;
      return { subject, body };
    };
    const refresh = () => {
      const { subject, body } = compose();
      subjectEl.textContent = subject;
      mailto.href = `mailto:${TO}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    };
    form.addEventListener('input', refresh);
    form.addEventListener('change', refresh);
    refresh();

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      let ok = true;
      $$('.field', form).forEach((f) => {
        const input = $('input, textarea', f);
        const valid = input.value.trim() !== '';
        f.classList.toggle('is-invalid', !valid);
        if (!valid && ok) { input.focus(); ok = false; }
      });
      if (!ok) { msg.textContent = 'Add your name and a short message first.'; return; }
      const { subject, body } = compose();
      const url = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(TO)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      const tab = window.open(url, '_blank');
      if (tab) tab.opener = null;
      msg.innerHTML = !tab
        ? `Your browser blocked the new tab. <a href="${url}" target="_blank" rel="noopener">Open Gmail</a>, or use another email app.`
        : 'Gmail opened in a new tab with your message filled in. Hit Send there and we will get back to you.';
      showToast('Opening Gmail');
    });
    $$('input, textarea', form).forEach((i) => i.addEventListener('input', () => i.closest('.field')?.classList.remove('is-invalid')));
  }

  // ---------- Ion field in the hero ----------
  const canvas = $('[data-ions]');
  const ctx = canvas.getContext('2d');
  let W = 0, H = 0, dpr = 1, ions = [], heroVisible = true;
  let px = -9999, py = -9999;
  const resize = () => {
    dpr = Math.min(devicePixelRatio || 1, 2);
    W = canvas.clientWidth; H = canvas.clientHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = Math.round(clamp((W * H) / 14000, 30, 110));
    ions = Array.from({ length: count }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3,
      r: Math.random() * 1.6 + 0.6,
    }));
  };
  resize();
  addEventListener('resize', resize);
  canvas.parentElement.addEventListener('pointermove', (e) => {
    const r = canvas.getBoundingClientRect();
    px = e.clientX - r.left; py = e.clientY - r.top;
  });
  canvas.parentElement.addEventListener('pointerleave', () => { px = py = -9999; });
  new IntersectionObserver(([e]) => { heroVisible = e.isIntersecting; }).observe(canvas);

  const drawIons = () => {
    ctx.clearRect(0, 0, W, H);
    for (const p of ions) {
      const dx = p.x - px, dy = p.y - py, d2 = dx * dx + dy * dy;
      if (d2 < 22000) { const f = (1 - d2 / 22000) * 0.9; const d = Math.sqrt(d2) || 1; p.vx += (dx / d) * f; p.vy += (dy / d) * f; }
      p.vx *= 0.96; p.vy *= 0.96;
      p.vx += (Math.random() - 0.5) * 0.04; p.vy += (Math.random() - 0.5) * 0.04;
      p.x += p.vx; p.y += p.vy;
      if (p.x < -10) p.x = W + 10; if (p.x > W + 10) p.x = -10;
      if (p.y < -10) p.y = H + 10; if (p.y > H + 10) p.y = -10;
    }
    ctx.lineWidth = 1;
    for (let i = 0; i < ions.length; i++) {
      for (let j = i + 1; j < ions.length; j++) {
        const a = ions[i], b = ions[j];
        const dx = a.x - b.x, dy = a.y - b.y, d2 = dx * dx + dy * dy;
        if (d2 < 12000) {
          ctx.strokeStyle = `rgba(255,255,255,${(1 - d2 / 12000) * 0.22})`;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      }
    }
    ctx.fillStyle = 'rgba(255,255,255,.75)';
    for (const p of ions) { ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill(); }
  };

  // ---------- Main loop ----------
  const tick = () => {
    // Cursor follows with a little lag on the ring
    if (finePointer && !reduced) {
      rx = lerp(rx, mx, 0.18); ry = lerp(ry, my, 0.18);
      dot.style.transform = `translate(${mx}px, ${my}px)`;
      ring.style.transform = `translate(${rx}px, ${ry}px)`;
    }
    if (heroVisible) {
      if (!reduced) {
        pinVel *= 0.955;
        pinAngle += pinVel * 0.1;
        tiltX = lerp(tiltX, tTiltX, 0.06); tiltY = lerp(tiltY, tTiltY, 0.06);
        pin.style.transform = `perspective(900px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) rotate(${pinAngle + pinScroll}deg)`;
        drawIons();
      } else if (!tick.drawn) { drawIons(); tick.drawn = true; }
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);

  // Kick off the hero headline once fonts are ready so letters don't jump
  (document.fonts?.ready || Promise.resolve()).then(() => $('.hero-title').classList.add('is-in'));
})();
