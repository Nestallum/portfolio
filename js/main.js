(() => {
  'use strict';

  /* ── Theme ─────────────────────────────────────────────── */

  const DEFAULT_THEME_ID = 'system';
  let currentAccent = '#a8c0d8';

  function applyTheme(theme) {
    const r = document.documentElement.style;
    r.setProperty('--color-bg-rgb',            theme.colorBgRgb);
    r.setProperty('--color-bg',                theme.colorBg);
    r.setProperty('--color-surface',           theme.colorSurface);
    r.setProperty('--color-surface-elevated',  theme.colorSurfaceElevated);
    r.setProperty('--color-accent',            theme.colorAccent);
    r.setProperty('--color-accent-subtle',     theme.colorAccentSubtle);
    r.setProperty('--color-text-primary',      theme.colorTextPrimary);
    r.setProperty('--color-text-secondary',    theme.colorTextSecondary);
    r.setProperty('--color-text-tertiary',     theme.colorTextTertiary);
    r.setProperty('--color-tag-text',          theme.colorTagText);
    currentAccent = theme.colorAccent;
  }

  function initThemePicker() {
    let currentId = DEFAULT_THEME_ID;

    const trigger  = document.getElementById('theme-trigger');
    const dot      = document.getElementById('theme-dot');
    const label    = document.getElementById('theme-label');
    const dropdown = document.getElementById('theme-dropdown');

    function renderDropdown() {
      dropdown.innerHTML = '';
      THEMES.forEach((t) => {
        const item = document.createElement('button');
        item.className = 'theme-dd-item' + (t.id === currentId ? ' active' : '');
        item.dataset.id = t.id;
        item.innerHTML = `
          <span class="theme-dd-dot" style="background:${t.colorAccent};"></span>
          <span class="theme-dd-name">${t.name}</span>
          <svg class="theme-dd-check" viewBox="0 0 12 12" fill="none"
               stroke="${t.colorAccent}" stroke-width="1.8"
               stroke-linecap="round" stroke-linejoin="round">
            <path d="M2 6l3 3 5-5"/>
          </svg>
        `;
        item.addEventListener('click', () => selectTheme(t.id));
        dropdown.appendChild(item);
      });
    }

    function selectTheme(id) {
      const t = THEMES.find((x) => x.id === id);
      if (!t) return;
      currentId = id;
      applyTheme(t);
      dot.style.background = t.colorAccent;
      label.textContent = t.name;
      closeDropdown();
      renderDropdown();
    }

    function openDropdown()  { dropdown.classList.add('open'); trigger.classList.add('open'); }
    function closeDropdown() { dropdown.classList.remove('open'); trigger.classList.remove('open'); }

    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.classList.contains('open') ? closeDropdown() : openDropdown();
    });
    document.addEventListener('click', closeDropdown);
    dropdown.addEventListener('click', (e) => e.stopPropagation());

    const defaultTheme = THEMES.find((t) => t.id === DEFAULT_THEME_ID);
    dot.style.background   = defaultTheme.colorAccent;
    label.textContent      = defaultTheme.name;
    renderDropdown();
  }

  /* ── Scroll nav ─────────────────────────────────────────── */
  const nav = document.getElementById('site-nav');
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 10);
  }, { passive: true });

  /* ── Fade-in on scroll ──────────────────────────────────── */
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
  );
  document.querySelectorAll('.fade-in').forEach((el) => observer.observe(el));

  /* ── Back to top ────────────────────────────────────────── */
  const backTop = document.getElementById('back-top');
  window.addEventListener('scroll', () => {
    backTop.classList.toggle('visible', window.scrollY > 400);
  }, { passive: true });
  backTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  /* ── Matrix background ──────────────────────────────────── */
  const CHARS = 'ｦｱｳｴｵｶｷｹｺｻｼｽｾｿﾀﾂﾃﾅﾆﾇﾈﾊﾋﾎﾏﾐﾑﾒﾓﾔﾕﾗﾘﾙﾚﾛﾜﾝ0123456789';

  function initMatrix(canvasId) {
    const canvas = document.getElementById(canvasId);
    const ctx    = canvas.getContext('2d');

    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);

    const particles = [];
    let lastSpawn   = 0;

    function spawnChar() {
      particles.push({
        x:     Math.random() * canvas.width,
        y:     Math.random() * canvas.height,
        vx:    0,
        vy:    -(30 + Math.random() * 60),
        char:  CHARS[Math.floor(Math.random() * CHARS.length)],
        size:  10 + Math.random() * 8,
        alpha: 0.08 + Math.random() * 0.2,
        dur:   1200 + Math.random() * 1200,
        born:  performance.now(),
      });
    }

    function draw(now) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (now - lastSpawn > 240) {
        const n = 1 + Math.floor(Math.random() * 2);
        for (let i = 0; i < n; i++) spawnChar();
        lastSpawn = now;
      }
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        const t = (now - p.born) / p.dur;
        if (t >= 1) { particles.splice(i, 1); continue; }
        const ease = 1 - Math.pow(1 - t, 2);
        ctx.globalAlpha = p.alpha * (1 - t);
        ctx.font        = `${p.size}px monospace`;
        ctx.fillStyle = currentAccent;
        ctx.fillText(p.char, p.x + p.vx * ease, p.y + p.vy * ease * (p.dur / 1000));
      }
      requestAnimationFrame(draw);
    }
    requestAnimationFrame(draw);
  }

  /* ── Cursor ─────────────────────────────────────────────── */
  function initCursor() {
    const dot  = document.createElement('div');
    const ghost = document.createElement('div');
    dot.id  = 'cursor-dot';
    ghost.id = 'cursor-ghost';
    document.body.appendChild(ghost);
    document.body.appendChild(dot);
    dot.style.display  = 'none';
    ghost.style.display = 'none';

    let x = 0, y = 0;
    let cx = 0, cy = 0;

    document.addEventListener('mousemove', (e) => {
      x = e.clientX;
      y = e.clientY;
      dot.style.left = x + 'px';
      dot.style.top  = y + 'px';
    });

    function animate() {
      cx += (x - cx) * 0.10;
      cy += (y - cy) * 0.10;
      ghost.style.left = cx + 'px';
      ghost.style.top  = cy + 'px';
      requestAnimationFrame(animate);
    }
    animate();

    document.querySelectorAll('a, button').forEach((el) => {
      el.addEventListener('mouseenter', () => ghost.classList.add('hovered'));
      el.addEventListener('mouseleave', () => ghost.classList.remove('hovered'));
    });
  }

  /* ── Cursor picker ──────────────────────────────────────── */
  function initCursorPicker() {
    let currentId = 'default';

    const trigger  = document.getElementById('cursor-trigger');
    const label    = document.getElementById('cursor-label');
    const dropdown = document.getElementById('cursor-dropdown');

    function renderDropdown() {
      dropdown.innerHTML = '';
      CURSORS.forEach((c) => {
        const item = document.createElement('button');
        item.className = 'theme-dd-item' + (c.id === currentId ? ' active' : '');
        item.dataset.id = c.id;
        item.innerHTML = `
          <span class="theme-dd-name">${c.name}</span>
          <svg class="theme-dd-check" viewBox="0 0 12 12" fill="none"
              stroke="var(--color-accent)" stroke-width="1.8"
              stroke-linecap="round" stroke-linejoin="round">
            <path d="M2 6l3 3 5-5"/>
          </svg>
        `;
        item.addEventListener('click', () => selectCursor(c.id));
        dropdown.appendChild(item);
      });
    }

    function selectCursor(id) {
      currentId = id;
      label.textContent = CURSORS.find((c) => c.id === id).name;

      const dot  = document.getElementById('cursor-dot');
      const ghost = document.getElementById('cursor-ghost');

      if (id === 'default') {
        document.body.classList.remove('custom-cursor');
        if (dot)  dot.style.display = 'none';
        if (ghost) ghost.style.display = 'none';
      } else if (id === 'ghost') {
        document.body.classList.add('custom-cursor');
        if (dot)  dot.style.display = 'block';
        if (ghost) ghost.style.display = 'block';
      }

      closeDropdown();
      renderDropdown();
    }

    function openDropdown()  { dropdown.classList.add('open'); trigger.classList.add('open'); }
    function closeDropdown() { dropdown.classList.remove('open'); trigger.classList.remove('open'); }

    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.classList.contains('open') ? closeDropdown() : openDropdown();
    });
    document.addEventListener('click', closeDropdown);
    dropdown.addEventListener('click', (e) => e.stopPropagation());

    const defaultCursor = CURSORS.find((c) => c.id === 'default');
    label.textContent = defaultCursor.name;
    renderDropdown();
  }

  initMatrix('matrix-canvas-back');
  initMatrix('matrix-canvas-front');
  initCursor();
  initCursorPicker();
  initThemePicker();
})();