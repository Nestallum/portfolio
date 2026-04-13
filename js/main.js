(() => {
  'use strict';

  /* ── Theme ─────────────────────────────────────────────── */

  const DEFAULT_THEME_ID = 'system';
  let currentAccent = '#6898a8';

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
  function initMatrix() {
    const canvas = document.getElementById('matrix-canvas');
    const ctx    = canvas.getContext('2d');

    const CHARS = 'abcdefghijklmnopqrstuvwxyz0123456789$+-*/=%"\'#&_(),.;:?!<>[]\\|{}^~';

    const GAP  = 32;
    const SIZE = 14;

    function rc()      { return CHARS[Math.floor(Math.random() * CHARS.length)]; }
    function rnd(a, b) { return a + Math.random() * (b - a); }
    function randAmp() { return rnd(0.02, 0.12); }

    let cells = [];

    function makeCell(x, y) {
      return {
        x, y,
        char: rc(),
        amp:  randAmp(),
        t:    rnd(0, Math.PI * 2),
        s:    rnd(0.08, 0.18),
      };
    }

    function build() {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;

      const cols = Math.floor(canvas.width  / GAP);
      const rows = Math.floor(canvas.height / GAP);

      cells = [];
      for (let r = 0; r < rows; r++)
        for (let c = 0; c < cols; c++)
          cells.push(makeCell(c * GAP + GAP / 2, r * GAP + GAP / 2));
    }

    build();
    window.addEventListener('resize', build);

    let lastFrame = 0;

    function draw(now) {
      requestAnimationFrame(draw);
      if (now - lastFrame < 50) return;
      lastFrame = now;

      if (document.hidden) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.font      = `${SIZE}px 'MatrixCode'`;
      ctx.textAlign = 'center';
      ctx.fillStyle = currentAccent;

      cells.forEach((g) => {
        const prevT = g.t;
        g.t += g.s;

        const crossed = Math.floor(prevT / Math.PI) !== Math.floor(g.t / Math.PI);
        if (crossed) {
          g.char = rc();
          g.amp  = randAmp();
        }

        ctx.globalAlpha = g.amp * (0.15 + 0.85 * Math.max(0, Math.sin(g.t)));
        ctx.fillText(g.char, g.x, g.y);
      });

      ctx.globalAlpha = 1;
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

  initMatrix();
  initCursor();
  initCursorPicker();
  initThemePicker();
})();