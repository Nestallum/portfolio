/**
 * main.js — Single entry point for all UI behaviour.
 *
 * Depends on globals loaded before this file:
 *   - THEMES  (js/themes.js)
 *   - CURSORS (js/cursors.js)
 */
(() => {
  'use strict';

  /* ──────────────────────────────────────────────────────────
     Shared state
     Centralising mutable state avoids the global `currentAccent`
     leak that previously existed between the matrix and theme modules.
  ────────────────────────────────────────────────────────── */
  const state = {
    accentColor: '#E8E8ED',
  };

  /* ──────────────────────────────────────────────────────────
     Utility: debounce
     Prevents expensive callbacks (e.g. canvas rebuild) from firing
     on every pixel of a resize event.
  ────────────────────────────────────────────────────────── */
  function debounce(fn, delay) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  }

  /* ──────────────────────────────────────────────────────────
     Utility: createDropdownItem
     Builds a dropdown button safely using the DOM API instead
     of innerHTML, which avoids potential XSS vectors when
     theme/cursor data originates from external sources.
  ────────────────────────────────────────────────────────── */
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

    // Checkmark SVG — visible only on active item via CSS
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

  /* ──────────────────────────────────────────────────────────
     Dropdown controller factory
     Encapsulates open/close logic so both the theme and cursor
     pickers share one implementation instead of duplicating it.
  ────────────────────────────────────────────────────────── */
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
      setTimeout(() => {
        dropdown.style.transition = '';
      }, 50);
    }

    function toggle() {
      if (dropdown.classList.contains('open')) {
        close();
      } else {
        // Close all other dropdowns before opening this one
        dropdownControllers.forEach((ctrl) => ctrl.close());
        open();
      }
    }

    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      toggle();
    });

    // Prevent clicks inside the dropdown from bubbling to the
    // document listener that closes it.
    dropdown.addEventListener('click', (e) => e.stopPropagation());

    return { trigger, dropdown, open, close, closeInstant };
  }

  /* ──────────────────────────────────────────────────────────
     Global click-outside handler
     A single document listener handles closing of both dropdowns,
     replacing the two separate listeners in the original code.
  ────────────────────────────────────────────────────────── */
  const dropdownControllers = [];

  document.addEventListener('click', () => {
    dropdownControllers.forEach((ctrl) => ctrl.close());
  });

  /* ──────────────────────────────────────────────────────────
     Theme picker
  ────────────────────────────────────────────────────────── */
  function initThemePicker() {
    let currentId = localStorage.getItem('theme-id') ?? 'ethereal'; // <- persist selected theme across sessions

    const { trigger, dropdown, close, closeInstant } = createDropdownController('theme-trigger', 'theme-dropdown');
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

      // Propagate the new accent to the matrix renderer via shared state.
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
              localStorage.setItem('theme-id', t.id); // <- persist
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

    // Seed initial state
    const initialTheme = THEMES.find((t) => t.id === currentId) ?? THEMES[0];
    if (initialTheme) {
      dot.style.background = initialTheme.colorAccent;
      label.textContent    = initialTheme.name;
      applyTheme(initialTheme);
    }
    renderItems();
  }

  /* ──────────────────────────────────────────────────────────
     Custom cursor
  ────────────────────────────────────────────────────────── */
  function initCursor() {
    const dot   = document.createElement('div');
    const ghost = document.createElement('div');
    dot.id   = 'cursor-dot';
    ghost.id = 'cursor-ghost';

    // Inserted at body start so z-index works across stacking contexts
    document.body.prepend(ghost, dot);

    dot.style.display   = 'none';
    ghost.style.display = 'none';

    let targetX = 0, targetY = 0;
    let ghostX  = 0, ghostY  = 0;
    let rafId   = null;

    document.addEventListener('mousemove', (e) => {
      targetX = e.clientX;
      targetY = e.clientY;
      // Snap ghost to cursor on first move so it never slides in from 0,0
      if (ghostX === 0 && ghostY === 0) {
        ghostX = targetX;
        ghostY = targetY;
      }
      dot.style.left = `${targetX}px`;
      dot.style.top  = `${targetY}px`;
    });

    // Lazy lerp loop — only runs while the cursor is active
    function animateGhost() {
      ghostX += (targetX - ghostX) * 0.1;
      ghostY += (targetY - ghostY) * 0.1;
      ghost.style.left = `${ghostX}px`;
      ghost.style.top  = `${ghostY}px`;
      rafId = requestAnimationFrame(animateGhost);
    }

    // Expand ghost ring on interactive elements
    function onEnter() { ghost.classList.add('hovered'); }
    function onLeave() { ghost.classList.remove('hovered'); }

    document.querySelectorAll('a, button').forEach((el) => {
      el.addEventListener('mouseenter', onEnter);
      el.addEventListener('mouseleave', onLeave);
    });

    return {
      enable() {
        // Snap ghost to current cursor position before starting the loop
        ghostX = targetX;
        ghostY = targetY;
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
        if (rafId) {
          cancelAnimationFrame(rafId);
          rafId = null;
        }
      },
    };
  }

  /* ──────────────────────────────────────────────────────────
     Cursor picker
  ────────────────────────────────────────────────────────── */
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

              if (c.id === 'ghost') {
                cursor.enable();
              } else {
                cursor.disable();
              }

              closeInstant();
              renderItems();
            },
          })
        );
      });
    }

    const defaultCursor  = CURSORS.find((c) => c.id === currentId);
    label.textContent    = defaultCursor.name;
    renderItems();
  }

  /* ──────────────────────────────────────────────────────────
     Scroll-driven behaviours
  ────────────────────────────────────────────────────────── */
  function initScrollBehaviours() {
    const nav     = document.getElementById('site-nav');
    const backTop = document.getElementById('back-top');

    window.addEventListener('scroll', () => {
      nav.classList.toggle('scrolled', window.scrollY > 10);
      backTop.classList.toggle('visible', window.scrollY > 400);
    }, { passive: true });

    backTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ──────────────────────────────────────────────────────────
     Intersection Observer — fade-in on scroll
  ────────────────────────────────────────────────────────── */
  function initFadeIn() {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('visible');
          observer.unobserve(entry.target); // Observe once, then detach
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    document.querySelectorAll('.fade-in').forEach((el) => observer.observe(el));
  }

  /* ──────────────────────────────────────────────────────────
     Matrix canvas background
  ────────────────────────────────────────────────────────── */
  function initMatrix() {
    const canvas = document.getElementById('matrix-canvas');
    const ctx    = canvas.getContext('2d');

    const CHARS    = 'abcdefghijklmnopqrstuvwxyz0123456789$+-*/=%"\'#&_(),.;:?!<>[]\\|{}^~';
    const CELL_GAP = 32;
    const FONT_SIZE = 14;

    let cells   = [];
    let active  = false;
    let running = false;
    let lastFrame = 0;
    let rafId   = null;
    let activeCells = 0;
    let gridBuilt = false;

    function randomChar()       { return CHARS[Math.floor(Math.random() * CHARS.length)]; }
    function randomRange(a, b)  { return a + Math.random() * (b - a); }
    function randomAmplitude()  { return randomRange(0.02, 0.12); }

    function makeCell(x, y) {
      return {
        x,
        y,
        char:      randomChar(),
        amp:       0,
        targetAmp: randomAmplitude(),
        t:         randomRange(0, Math.PI * 2),
        speed:     randomRange(0.08, 0.18),
      };
    }

    function buildGrid() {
      const dpr = window.devicePixelRatio || 1;

      // Reset transform before applying a new scale to avoid
      // cumulative scaling on repeated resize events.
      ctx.setTransform(1, 0, 0, 1, 0, 0);

      canvas.width  = window.innerWidth  * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width  = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.scale(dpr, dpr);

      const cols = Math.floor(window.innerWidth  / CELL_GAP);
      const rows = Math.floor(window.innerHeight / CELL_GAP);

      cells = [];
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          cells.push(makeCell(
            c * CELL_GAP + CELL_GAP / 2,
            r * CELL_GAP + CELL_GAP / 2
          ));
        }
      }
    }

    const debouncedBuild = debounce(() => {
      buildGrid();
      gridBuilt = true;
    }, 150);
    window.addEventListener('resize', debouncedBuild, { passive: true });

    function draw(now) {
      if (!running) return;
      rafId = requestAnimationFrame(draw);

      // Cap the frame rate at ~20 fps for the matrix effect
      if (now - lastFrame < 50) return;
      lastFrame = now;

      // Skip rendering while the tab is hidden to save CPU
      if (document.hidden) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.font      = `${FONT_SIZE}px 'MatrixCode'`;
      ctx.textAlign = 'center';
      ctx.fillStyle = state.accentColor;

      activeCells = 0;
      cells.forEach((cell) => {
        // Smooth amplitude towards target
        if (cell.amp < cell.targetAmp) {
          cell.amp = Math.min(cell.amp + 0.008, cell.targetAmp);
        } else if (cell.amp > cell.targetAmp) {
          cell.amp = Math.max(cell.amp - 0.012, cell.targetAmp);
        }
        if (cell.amp > 0) activeCells++;

        const prevT = cell.t;
        cell.t += cell.speed;

        // Flip character and randomise target amplitude on each half-cycle
        const halfCycleCrossed = Math.floor(prevT / Math.PI) !== Math.floor(cell.t / Math.PI);
        if (halfCycleCrossed && active) {
          cell.char      = randomChar();
          cell.targetAmp = randomAmplitude();
        }

        if (cell.amp <= 0) return;

        ctx.globalAlpha = cell.amp * (0.15 + 0.85 * Math.max(0, Math.sin(cell.t)));
        ctx.fillText(cell.char, cell.x, cell.y);
      });

      ctx.globalAlpha = 1;

      // Stop the RAF loop once all cells have faded out
      if (!active && activeCells <= 0) {
        running = false;
        cancelAnimationFrame(rafId);
        rafId = null;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }

    function enable() {
      active  = true;
      running = true;
      if (!gridBuilt) {
        buildGrid();
        gridBuilt = true;
      }
      rafId = requestAnimationFrame(draw);
    }

    function disable() {
      active = false;
      // Cells will fade out naturally; the RAF loop stops itself
      cells.forEach((cell) => { cell.targetAmp = 0; });
    }

    const btn = document.getElementById('glyphs-toggle');

    btn.addEventListener('click', () => {
      const isActive = !active;
      if (isActive) {
        enable();
        btn.classList.add('active');
      } else {
        disable();
        btn.classList.remove('active');
      }
      // Keep aria-pressed in sync with actual state
      btn.setAttribute('aria-pressed', String(isActive));
    });
  }

  /* ──────────────────────────────────────────────────────────
     Boot sequence
  ────────────────────────────────────────────────────────── */
  const cursor = initCursor();
  initCursorPicker(cursor);
  initThemePicker();
  initScrollBehaviours();
  initFadeIn();
  initMatrix();

})();