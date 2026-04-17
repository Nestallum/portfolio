/**
 * main.js — Single entry point for all UI behaviour.
 *
 * Depends on globals loaded before this file:
 *   - THEMES  (js/themes.js)
 *   - CURSORS (js/cursors.js)
 */
(() => {
  'use strict';

  const state = {
    accentColor: '#F5F5F7',
  };

  /* ── Utilities ──────────────────────────────────────────── */
  function debounce(fn, delay) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  }

  function createDropdownItem({ label, dotColor, isActive, onSelect }) {
    const btn = document.createElement('button');
    btn.className = 'dropdown-item' + (isActive ? ' active' : '');
    btn.setAttribute('role', 'option');
    btn.setAttribute('aria-selected', isActive ? 'true' : 'false');

    if (dotColor) {
      const dot = document.createElement('span');
      dot.className = 'dropdown-dot';
      dot.style.background = dotColor;
      btn.appendChild(dot);
    }

    const name = document.createElement('span');
    name.className = 'dropdown-name';
    name.textContent = label;
    btn.appendChild(name);

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'dropdown-check');
    svg.setAttribute('viewBox', '0 0 12 12');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', dotColor || 'var(--color-accent)');
    svg.setAttribute('stroke-width', '1.8');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    svg.setAttribute('aria-hidden', 'true');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', 'M2 6l3 3 5-5');
    svg.appendChild(path);
    btn.appendChild(svg);

    btn.addEventListener('click', onSelect);
    return btn;
  }

  /* ── Dropdown controller ────────────────────────────────── */
  const dropdownControllers = [];

  function createDropdownController(triggerId, dropdownId) {
    const trigger  = document.getElementById(triggerId);
    const dropdown = document.getElementById(dropdownId);

    function open() {
      dropdown.classList.add('open');
      trigger.classList.add('open');
      trigger.setAttribute('aria-expanded', 'true');
    }

    function close() {
      dropdown.classList.remove('open');
      trigger.classList.remove('open');
      trigger.setAttribute('aria-expanded', 'false');
    }

    function closeInstant() {
      dropdown.style.transition = 'none';
      dropdown.classList.remove('open');
      trigger.classList.remove('open');
      trigger.setAttribute('aria-expanded', 'false');
      setTimeout(() => { dropdown.style.transition = ''; }, 50);
    }

    function toggle() {
      if (dropdown.classList.contains('open')) {
        close();
      } else {
        dropdownControllers.forEach((ctrl) => ctrl.close());
        open();
      }
    }

    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      toggle();
    });

    dropdown.addEventListener('click', (e) => e.stopPropagation());

    return { trigger, dropdown, open, close, closeInstant };
  }

  document.addEventListener('click', () => {
    dropdownControllers.forEach((ctrl) => ctrl.close());
  });

  /* ── Theme picker ───────────────────────────────────────── */
  function initThemePicker() {
    let currentId = localStorage.getItem('theme-id') ?? 'ethereal';

    const { dropdown, close, closeInstant } = createDropdownController('theme-trigger', 'theme-dropdown');
    dropdownControllers.push({ close });

    const dot   = document.getElementById('theme-dot');
    const label = document.getElementById('theme-label');

    function applyTheme(theme) {
      const root = document.documentElement.style;
      root.setProperty('--color-bg-rgb',            theme.colorBgRgb);
      root.setProperty('--color-bg',                theme.colorBg);
      root.setProperty('--color-surface',           theme.colorSurface);
      root.setProperty('--color-surface-elevated',  theme.colorSurfaceElevated);
      root.setProperty('--color-accent',            theme.colorAccent);
      root.setProperty('--color-accent-subtle',     theme.colorAccentSubtle);
      root.setProperty('--color-text-primary',      theme.colorTextPrimary);
      root.setProperty('--color-text-secondary',    theme.colorTextSecondary);
      root.setProperty('--color-tag-text',          theme.colorTagText);
      root.setProperty('--color-tag-bg',            theme.colorTagBg);
      root.setProperty('--color-tag-border',        theme.colorTagBorder);
      state.accentColor = theme.colorAccent;
    }

    function renderItems() {
      dropdown.innerHTML = '';
      THEMES.forEach((t) => {
        dropdown.appendChild(
          createDropdownItem({
            label:    t.name,
            dotColor: t.colorAccent,
            isActive: t.id === currentId,
            onSelect: () => {
              currentId = t.id;
              localStorage.setItem('theme-id', t.id);
              applyTheme(t);
              dot.style.background = t.colorAccent;
              label.textContent    = t.name;
              closeInstant();
              renderItems();
            },
          })
        );
      });
    }

    const initialTheme = THEMES.find((t) => t.id === currentId) ?? THEMES[0];
    if (initialTheme) {
      dot.style.background = initialTheme.colorAccent;
      label.textContent    = initialTheme.name;
      applyTheme(initialTheme);
    }
    renderItems();
  }

  /* ── Custom cursor ──────────────────────────────────────── */
  function initCursor() {
    const dot   = document.createElement('div');
    const ghost = document.createElement('div');
    dot.id   = 'cursor-dot';
    ghost.id = 'cursor-ghost';
    document.body.prepend(ghost, dot);
    dot.style.display   = 'none';
    ghost.style.display = 'none';

    let targetX = 0, targetY = 0;
    let ghostX  = 0, ghostY  = 0;
    let rafId   = null;

    document.addEventListener('mousemove', (e) => {
      targetX = e.clientX;
      targetY = e.clientY;
      if (ghostX === 0 && ghostY === 0) { ghostX = targetX; ghostY = targetY; }
      dot.style.left = `${targetX}px`;
      dot.style.top  = `${targetY}px`;
    });

    function animateGhost() {
      ghostX += (targetX - ghostX) * 0.1;
      ghostY += (targetY - ghostY) * 0.1;
      ghost.style.left = `${ghostX}px`;
      ghost.style.top  = `${ghostY}px`;
      rafId = requestAnimationFrame(animateGhost);
    }

    function onEnter() { ghost.classList.add('hovered'); }
    function onLeave() { ghost.classList.remove('hovered'); }

    document.querySelectorAll('a, button').forEach((el) => {
      el.addEventListener('mouseenter', onEnter);
      el.addEventListener('mouseleave', onLeave);
    });

    return {
      enable() {
        ghostX = targetX; ghostY = targetY;
        ghost.style.left = `${ghostX}px`;
        ghost.style.top  = `${ghostY}px`;
        dot.style.display   = 'block';
        ghost.style.display = 'block';
        document.body.classList.add('custom-cursor');
        if (!rafId) rafId = requestAnimationFrame(animateGhost);
      },
      disable() {
        dot.style.display   = 'none';
        ghost.style.display = 'none';
        document.body.classList.remove('custom-cursor');
        if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
      },
    };
  }

  /* ── Cursor picker ──────────────────────────────────────── */
  function initCursorPicker(cursor) {
    let currentId = 'default';
    const { dropdown, close, closeInstant } = createDropdownController('cursor-trigger', 'cursor-dropdown');
    dropdownControllers.push({ close });
    const label = document.getElementById('cursor-label');

    function renderItems() {
      dropdown.innerHTML = '';
      CURSORS.forEach((c) => {
        dropdown.appendChild(
          createDropdownItem({
            label:    c.name,
            dotColor: null,
            isActive: c.id === currentId,
            onSelect: () => {
              currentId         = c.id;
              label.textContent = c.name;
              if (c.id === 'ghost') { cursor.enable(); } else { cursor.disable(); }
              closeInstant();
              renderItems();
            },
          })
        );
      });
    }

    const defaultCursor = CURSORS.find((c) => c.id === currentId);
    label.textContent   = defaultCursor.name;
    renderItems();
  }

  /* ── Scroll behaviours ──────────────────────────────────── */
  function initScrollBehaviours() {
    const container = document.getElementById('scroll-container');
    const backTop   = document.getElementById('back-top');

    container.addEventListener('scroll', () => {
      backTop.classList.toggle('visible', container.scrollTop > 400);
    }, { passive: true });

    backTop.addEventListener('click', () => {
      container.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ── Sidebar highlight ──────────────────────────────────── */
  function initSidebarHighlight() {
    const container = document.getElementById('scroll-container');
    const links     = document.querySelectorAll('.sidebar-link');
    const sections  = Array.from(document.querySelectorAll('.snap-section[id]'));
    let isScrollingToAnchor = false;
    let scrollTimeout = null;

    function setActive(id) {
      links.forEach((link) => {
        link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
      });
    }

    function getActiveSection() {
      const threshold = container.scrollTop + window.innerHeight / 2;
      let active = sections[0];
      for (const section of sections) {
        if (section.offsetTop <= threshold) active = section;
      }
      return active;
    }

    links.forEach((link) => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const id = link.getAttribute('href').slice(1);
        const target = document.getElementById(id);
        if (target) {
          setActive(id);
          isScrollingToAnchor = true;
          clearTimeout(scrollTimeout);
          container.scrollTo({ top: target.offsetTop, behavior: 'smooth' });
          scrollTimeout = setTimeout(() => { isScrollingToAnchor = false; }, 1000);
        }
      });
    });

    container.addEventListener('scroll', () => {
      if (isScrollingToAnchor) return;
      setActive(getActiveSection().id);
    }, { passive: true });

    setActive(getActiveSection().id);
  }

  /* ── Projects carousel ──────────────────────────────────── */
  function initProjects() {
    const cards = Array.from(document.querySelectorAll('.proj-card'));
    const dots  = Array.from(document.querySelectorAll('.proj-dot'));
    let current = 0;

    function showCard(idx) {
      cards[current].classList.remove('active');
      dots[current].classList.remove('active');
      current = (idx + cards.length) % cards.length;
      cards[current].classList.add('active');
      dots[current].classList.add('active');
    }

    document.getElementById('projNext').addEventListener('click', () => showCard(current + 1));
    document.getElementById('projPrev').addEventListener('click', () => showCard(current - 1));
    dots.forEach((dot) => {
      dot.addEventListener('click', () => showCard(parseInt(dot.dataset.index)));
    });

    // Shine effect
    cards.forEach((card) => {
      const shine = card.querySelector('.shine');
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        shine.style.background = `radial-gradient(circle 180px at ${x}% ${y}%, rgba(255,255,255,0.06) 0%, transparent 100%)`;
      });
      card.addEventListener('mouseenter', () => { shine.style.opacity = '1'; });
      card.addEventListener('mouseleave', () => { shine.style.opacity = '0'; });
    });
  }

  /* ── Fade-in on scroll ──────────────────────────────────── */
  function initFadeIn() {
    const container = document.getElementById('scroll-container');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px', root: container }
    );

    document.querySelectorAll('.fade-in').forEach((el) => observer.observe(el));
  }

  /* ── Matrix canvas ──────────────────────────────────────── */
  function initMatrix() {
    const canvas = document.getElementById('matrix-canvas');
    const ctx    = canvas.getContext('2d');

    const CHARS     = 'abcdefghijklmnopqrstuvwxyz0123456789$+-*/=%"\'#&_(),.;:?!<>[]\\|{}^~';
    const CELL_GAP  = 32;
    const FONT_SIZE = 14;

    let cells = [], active = false, running = false;
    let lastFrame = 0, rafId = null, activeCells = 0, gridBuilt = false;

    function randomChar()      { return CHARS[Math.floor(Math.random() * CHARS.length)]; }
    function randomRange(a, b) { return a + Math.random() * (b - a); }
    function randomAmplitude() { return randomRange(0.02, 0.12); }

    function makeCell(x, y) {
      return { x, y, char: randomChar(), amp: 0, targetAmp: randomAmplitude(), t: randomRange(0, Math.PI * 2), speed: randomRange(0.08, 0.18) };
    }

    function buildGrid() {
      const dpr = window.devicePixelRatio || 1;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      canvas.width  = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width  = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.scale(dpr, dpr);
      const cols = Math.floor(window.innerWidth  / CELL_GAP);
      const rows = Math.floor(window.innerHeight / CELL_GAP);
      cells = [];
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          cells.push(makeCell(c * CELL_GAP + CELL_GAP / 2, r * CELL_GAP + CELL_GAP / 2));
        }
      }
    }

    const debouncedBuild = debounce(() => { buildGrid(); gridBuilt = true; }, 150);
    window.addEventListener('resize', debouncedBuild, { passive: true });

    function draw(now) {
      if (!running) return;
      rafId = requestAnimationFrame(draw);
      if (now - lastFrame < 50) return;
      lastFrame = now;
      if (document.hidden) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.font      = `${FONT_SIZE}px 'MatrixCode'`;
      ctx.textAlign = 'center';
      ctx.fillStyle = state.accentColor;

      activeCells = 0;
      cells.forEach((cell) => {
        if (cell.amp < cell.targetAmp)       cell.amp = Math.min(cell.amp + 0.008, cell.targetAmp);
        else if (cell.amp > cell.targetAmp)  cell.amp = Math.max(cell.amp - 0.012, cell.targetAmp);
        if (cell.amp > 0) activeCells++;

        const prevT = cell.t;
        cell.t += cell.speed;
        const halfCycleCrossed = Math.floor(prevT / Math.PI) !== Math.floor(cell.t / Math.PI);
        if (halfCycleCrossed && active) { cell.char = randomChar(); cell.targetAmp = randomAmplitude(); }
        if (cell.amp <= 0) return;

        ctx.globalAlpha = cell.amp * (0.15 + 0.85 * Math.max(0, Math.sin(cell.t)));
        ctx.fillText(cell.char, cell.x, cell.y);
      });

      ctx.globalAlpha = 1;

      if (!active && activeCells <= 0) {
        running = false;
        cancelAnimationFrame(rafId);
        rafId = null;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }

    function enable() {
      active = true; running = true;
      if (!gridBuilt) { buildGrid(); gridBuilt = true; }
      rafId = requestAnimationFrame(draw);
    }

    function disable() {
      active = false;
      cells.forEach((cell) => { cell.targetAmp = 0; });
    }

    const btn = document.getElementById('glyphs-toggle');
    btn.addEventListener('click', () => {
      const isActive = !active;
      if (isActive) { enable(); btn.classList.add('active'); }
      else          { disable(); btn.classList.remove('active'); }
      btn.setAttribute('aria-pressed', String(isActive));
    });
  }

  /* ── Boot ───────────────────────────────────────────────── */
  const cursor = initCursor();
  initCursorPicker(cursor);
  initThemePicker();
  initScrollBehaviours();
  initSidebarHighlight();
  initFadeIn();
  initProjects();
  initMatrix();

})();
