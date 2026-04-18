/**
 * main.js — Single entry point for all UI behaviour.
 *
 * Depends on globals loaded before this file:
 *   - THEMES  (js/themes.js)
 *   - CURSORS (js/cursors.js)
 */
(() => {
  'use strict';

  /* ── Shared state ── */
  const state = { accentColor: '#F5F5F7' };

  /* ── Utility: debounce ── */
  function debounce(fn, delay) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  }

  /* ── Utility: createDropdownItem ── */
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

  /* ── Dropdown controller factory ── */
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

    trigger.addEventListener('click', (e) => { e.stopPropagation(); toggle(); });
    dropdown.addEventListener('click', (e) => e.stopPropagation());

    return { trigger, dropdown, open, close, closeInstant };
  }

  const dropdownControllers = [];

  document.addEventListener('click', () => {
    dropdownControllers.forEach((ctrl) => ctrl.close());
  });

  /* ── Theme picker ── */
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

  /* ── Custom cursor ── */
  function initCursor() {
    const dot   = document.createElement('div');
    const ghost = document.createElement('div');
    dot.id   = 'cursor-dot';
    ghost.id = 'cursor-ghost';
    document.body.prepend(ghost, dot);
    dot.style.display   = 'none';
    ghost.style.display = 'none';

    let targetX = 0, targetY = 0, ghostX = 0, ghostY = 0, rafId = null;

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

  /* ── Cursor picker ── */
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
              currentId = c.id;
              label.textContent = c.name;
              c.id === 'ghost' ? cursor.enable() : cursor.disable();
              closeInstant();
              renderItems();
            },
          })
        );
      });
    }

    label.textContent = CURSORS.find((c) => c.id === currentId).name;
    renderItems();
  }

  /* ── Scroll-driven behaviours ── */
  function initScrollBehaviours() {
    const nav     = document.getElementById('site-nav');
    const backTop = document.getElementById('back-top');
    window.addEventListener('scroll', () => {
      nav.classList.toggle('scrolled', window.scrollY > 10);
      backTop.classList.toggle('visible', window.scrollY > 400);
    }, { passive: true });
    backTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  /* ── Sidebar highlight ── */
  function initSidebarHighlight() {
    const links    = document.querySelectorAll('.sidebar-link');
    const sections = Array.from(document.querySelectorAll('section[id]'));
    let isScrollingToAnchor = false, scrollTimeout = null;

    function setActive(id) {
      links.forEach((link) => {
        link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
      });
    }

    function getActiveSection() {
      const threshold = window.scrollY + window.innerHeight / 2;
      let active = sections[0];
      for (const section of sections) {
        if (section.offsetTop <= threshold) active = section;
      }
      return active;
    }

    links.forEach((link) => {
      link.addEventListener('click', () => {
        setActive(link.getAttribute('href').slice(1));
        isScrollingToAnchor = true;
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => { isScrollingToAnchor = false; }, 800);
      });
    });

    window.addEventListener('scroll', () => {
      if (isScrollingToAnchor) return;
      setActive(getActiveSection().id);
    }, { passive: true });

    setActive(getActiveSection().id);
  }

  /* ── Fade-in on scroll ── */
  function initFadeIn() {
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
  }

  /* ── Matrix canvas ── */
  function initMatrix() {
    const canvas = document.getElementById('matrix-canvas');
    const ctx    = canvas.getContext('2d');
    const CHARS  = 'abcdefghijklmnopqrstuvwxyz0123456789$+-*/=%"\'#&_(),.;:?!<>[]\\|{}^~';
    const CELL_GAP = 32, FONT_SIZE = 14;
    let cells = [], active = false, running = false, lastFrame = 0, rafId = null, activeCells = 0, gridBuilt = false;

    const randomChar      = () => CHARS[Math.floor(Math.random() * CHARS.length)];
    const randomRange     = (a, b) => a + Math.random() * (b - a);
    const randomAmplitude = () => randomRange(0.02, 0.12);

    function makeCell(x, y) {
      return { x, y, char: randomChar(), amp: 0, targetAmp: randomAmplitude(), t: randomRange(0, Math.PI * 2), speed: randomRange(0.08, 0.18) };
    }

    function buildGrid() {
      const dpr = window.devicePixelRatio || 1;
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
        if (cell.amp < cell.targetAmp) cell.amp = Math.min(cell.amp + 0.008, cell.targetAmp);
        else if (cell.amp > cell.targetAmp) cell.amp = Math.max(cell.amp - 0.012, cell.targetAmp);
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

    function enable()  { active = running = true; if (!gridBuilt) { buildGrid(); gridBuilt = true; } rafId = requestAnimationFrame(draw); }
    function disable() { active = false; cells.forEach((cell) => { cell.targetAmp = 0; }); }

    const btn = document.getElementById('glyphs-toggle');
    btn.addEventListener('click', () => {
      const isActive = !active;
      isActive ? enable() : disable();
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-pressed', String(isActive));
    });
  }

  /* ════════════════════════════════════════════════════════
     Projects — stacked cards with swipe + generative visuals
  ════════════════════════════════════════════════════════ */
  function initProjects() {

    /* ── Canvas helpers ── */
    function initCanvas(canvas) {
      const dpr = window.devicePixelRatio || 1;
      const W = canvas.clientWidth;
      const H = canvas.clientHeight;
      canvas.width  = W * dpr;
      canvas.height = H * dpr;
      const ctx = canvas.getContext('2d');
      ctx.scale(dpr, dpr);
      return { ctx, W, H };
    }

    function getAccent() {
      return getComputedStyle(document.documentElement)
        .getPropertyValue('--color-text-secondary').trim() || '#8E8E93';
    }

    /* ── Viz A: Terminal streaming (LLM Chatbot) ── */
    function drawTerminal(canvas) {
      const { ctx, W, H } = initCanvas(canvas);
      const lines = [
        { bold: true,  text: '> classify: "book a flight to Paris"' },
        { bold: false, text: '  symbolic match → travel.book  [0.94]' },
        { bold: false, text: '  routing to LLM with context…' },
        { bold: false, text: '' },
        { bold: true,  text: '⟡  Sure! Here are available flights' },
        { bold: false, text: '   to Paris based on your preferences.' },
        { bold: false, text: '   Cheapest option departs at 08:15.' },
        { bold: false, text: '' },
        { bold: true,  text: '> classify: "i hate this airline"' },
        { bold: false, text: '  symbolic match → feedback.neg  [0.88]' },
        { bold: false, text: '  routing to LLM with context…' },
        { bold: false, text: '' },
        { bold: true,  text: '⟡  I\'m sorry to hear that. Let me' },
        { bold: false, text: '   connect you with support.' },
      ];

      const CHAR_W = 7.5, LINE_H = 17, PAD = { x: 22, y: 20 };
      const SPEED = 22, PAUSE = 2000;
      const totalChars = lines.reduce((s, l) => s + l.text.length, 0);
      let charCount = 0, lastTime = 0, pausing = false, pauseStart = 0;
      let blink = true;
      setInterval(() => { blink = !blink; }, 530);

      function frame(now) {
        if (pausing) {
          if (now - pauseStart > PAUSE) { charCount = 0; pausing = false; }
          return requestAnimationFrame(frame);
        }
        if (now - lastTime > SPEED) { charCount++; lastTime = now; }
        if (charCount >= totalChars) { pausing = true; pauseStart = now; }

        const accent = getAccent();
        ctx.clearRect(0, 0, W, H);
        ctx.font = `300 11.5px 'Courier New'`;

        let rendered = 0, cursorX = PAD.x, cursorY = PAD.y + LINE_H;

        lines.forEach((line, li) => {
          if (!line.text) return;
          const y   = PAD.y + (li + 1) * LINE_H;
          const bot = line.text.startsWith('⟡');
          const cmd = line.text.startsWith('>');

          for (let ci = 0; ci < line.text.length; ci++) {
            if (rendered >= charCount) break;
            ctx.fillStyle   = accent;
            ctx.globalAlpha = bot && ci >= 3 ? 0.72 : cmd ? (ci === 0 ? 0.5 : 0.88) : line.bold ? 0.55 : 0.28;
            ctx.fillText(line.text[ci], PAD.x + ci * CHAR_W, y);
            cursorX = PAD.x + ci * CHAR_W + CHAR_W;
            cursorY = y;
            rendered++;
          }
        });

        if (blink && !pausing) {
          ctx.fillStyle   = accent;
          ctx.globalAlpha = 0.75;
          ctx.fillRect(cursorX, cursorY - LINE_H + 4, 5, LINE_H - 2);
        }

        ctx.globalAlpha = 1;
        requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    }

    /* ── Viz B: Attention heatmap (RoBERTa) ── */
    function drawAttention(canvas) {
      const { ctx, W, H } = initCanvas(canvas);
      const N = 7, margin = 0.18;
      const gW = W * (1 - margin * 2), gH = H * (1 - margin * 2);
      const ox = W * margin, oy = H * margin;
      const cW = gW / N, cH = gH / N;
      const base = Array.from({ length: N }, () => Array.from({ length: N }, () => Math.random()));
      const tokens = ['I', 'build', 'sys', 'that', 'think', 'deep', 'ly'];
      let t = 0;

      function frame() {
        const accent = getAccent();
        ctx.clearRect(0, 0, W, H);
        t += 0.010;
        for (let r = 0; r < N; r++) {
          for (let c = 0; c < N; c++) {
            const a = Math.max(0, Math.min(1, (base[r][c] + 0.45 * Math.sin(t + r * 0.5 + c * 0.7)) / 1.45));
            ctx.fillStyle   = accent;
            ctx.globalAlpha = a * 0.65;
            ctx.fillRect(ox + c * cW + 1, oy + r * cH + 1, cW - 2, cH - 2);
          }
        }
        ctx.globalAlpha = 0.22;
        ctx.fillStyle   = accent;
        ctx.font = `10px 'Courier New'`;
        ctx.textAlign = 'center';
        tokens.forEach((l, i) => {
          ctx.fillText(l, ox + i * cW + cW / 2, oy - 6);
          ctx.save();
          ctx.translate(ox - 7, oy + i * cH + cH / 2 + 3);
          ctx.rotate(-Math.PI / 2);
          ctx.fillText(l, 0, 0);
          ctx.restore();
        });
        ctx.globalAlpha = 1;
        requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    }

    /* ── Viz C: Time series (LSTM/GRU) ── */
    function drawTimeSeries(canvas) {
      const { ctx, W, H } = initCanvas(canvas);
      const POINTS = 90;
      const padX = W * 0.09, padY = H * 0.18;
      const pw = W - padX * 2, ph = H - padY * 2;
      let t = 0;

      function sig(i, off) {
        return Math.sin(i * 0.17 + off) * 0.28
             + Math.sin(i * 0.055 + off * 0.6) * 0.48
             + Math.cos(i * 0.29 + off) * 0.14;
      }

      function frame() {
        const accent = getAccent();
        ctx.clearRect(0, 0, W, H);
        t += 0.022;
        const off = t * 0.28;

        ctx.beginPath();
        for (let i = 0; i <= POINTS; i++) {
          const x = padX + (i / POINTS) * pw;
          const spread = 0.055 + 0.035 * (i / POINTS);
          ctx.lineTo(x, padY + ph * 0.5 - (sig(i, off + 0.12) + spread) * ph * 0.36);
        }
        for (let i = POINTS; i >= 0; i--) {
          const x = padX + (i / POINTS) * pw;
          const spread = 0.055 + 0.035 * (i / POINTS);
          ctx.lineTo(x, padY + ph * 0.5 - (sig(i, off + 0.12) - spread) * ph * 0.36);
        }
        ctx.closePath();
        ctx.fillStyle = accent; ctx.globalAlpha = 0.055; ctx.fill();

        ctx.beginPath(); ctx.setLineDash([4, 5]); ctx.lineWidth = 1;
        for (let i = 0; i <= POINTS; i++) {
          const x = padX + (i / POINTS) * pw;
          const y = padY + ph * 0.5 - sig(i, off + 0.12) * ph * 0.36;
          i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.strokeStyle = accent; ctx.globalAlpha = 0.28; ctx.stroke();

        ctx.beginPath(); ctx.setLineDash([]); ctx.lineWidth = 1.5;
        for (let i = 0; i <= POINTS; i++) {
          const x = padX + (i / POINTS) * pw;
          const y = padY + ph * 0.5 - sig(i, off) * ph * 0.36;
          i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.strokeStyle = accent; ctx.globalAlpha = 0.60; ctx.stroke();

        ctx.beginPath(); ctx.lineWidth = 0.5;
        ctx.moveTo(padX, padY + ph); ctx.lineTo(padX + pw, padY + ph);
        ctx.strokeStyle = accent; ctx.globalAlpha = 0.10; ctx.stroke();

        ctx.globalAlpha = 0.22; ctx.fillStyle = accent;
        ctx.font = `10px 'Courier New'`; ctx.textAlign = 'left';
        ctx.fillText('ground truth', padX + 4, padY - 4);
        ctx.fillText('— — forecast', padX + 4, padY + 12);
        ctx.globalAlpha = 1;
        requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    }

    /* ── Viz D: Scatter polarity field (Sentiment) ── */
    function drawScatter(canvas) {
      const { ctx, W, H } = initCanvas(canvas);
      const comments = Array.from({ length: 60 }, () => {
        const s = (Math.random() - 0.5) * 2;
        const conf = 0.4 + Math.random() * 0.6;
        return {
          bx: 0.5 + s * 0.42,
          by: 0.14 + Math.random() * 0.68,
          s, conf,
          phase: Math.random() * Math.PI * 2,
          speed: 0.003 + Math.random() * 0.004,
          size:  1.8 + conf * 2.8,
        };
      });
      let t = 0;

      function ptColor(s, alpha) {
        if (s >  0.25) return `rgba(120,200,140,${alpha})`;
        if (s < -0.25) return `rgba(200,100,100,${alpha})`;
        return `rgba(180,180,180,${alpha})`;
      }

      function frame() {
        ctx.clearRect(0, 0, W, H);
        t += 0.010;

        ctx.beginPath();
        ctx.moveTo(W * 0.5, H * 0.07); ctx.lineTo(W * 0.5, H * 0.90);
        ctx.strokeStyle = 'rgba(180,180,180,0.15)'; ctx.globalAlpha = 1;
        ctx.lineWidth = 0.5; ctx.setLineDash([3, 5]); ctx.stroke();
        ctx.setLineDash([]);

        ctx.font = `300 9px 'Courier New'`;
        ctx.globalAlpha = 0.28;
        ctx.fillStyle = 'rgba(200,100,100,0.8)'; ctx.textAlign = 'left';
        ctx.fillText('negative', W * 0.06, H * 0.055);
        ctx.fillStyle = 'rgba(120,200,140,0.8)'; ctx.textAlign = 'right';
        ctx.fillText('positive', W * 0.94, H * 0.055);

        comments.forEach(p => {
          const dx = Math.sin(t * p.speed * 80 + p.phase) * 0.008;
          const dy = Math.cos(t * p.speed * 60 + p.phase) * 0.006;
          ctx.beginPath();
          ctx.arc((p.bx + dx) * W, (p.by + dy) * H, p.size, 0, Math.PI * 2);
          ctx.fillStyle   = ptColor(p.s, 0.28 + Math.sin(t * 1.2 + p.phase) * 0.12);
          ctx.globalAlpha = 1;
          ctx.fill();
        });

        const live = Math.sin(t * 0.7) * 0.32 + Math.cos(t * 0.4) * 0.22;
        const lx   = W * 0.5 + live * W * 0.42;
        const ly   = H * 0.91;

        ctx.beginPath();
        ctx.moveTo(lx, H * 0.07); ctx.lineTo(lx, H * 0.88);
        ctx.strokeStyle = ptColor(live, 0.3); ctx.globalAlpha = 1;
        ctx.lineWidth = 0.5; ctx.stroke();

        ctx.beginPath();
        ctx.arc(lx, ly, 4.5, 0, Math.PI * 2);
        ctx.fillStyle = ptColor(live, 0.85); ctx.fill();

        ctx.font = `400 9px 'Courier New'`;
        ctx.textAlign   = 'center';
        ctx.fillStyle   = ptColor(live, 0.55);
        ctx.fillText(`avg ${live >= 0 ? '+' : ''}${live.toFixed(2)}`, lx, ly - 11);
        ctx.globalAlpha = 1;
        requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    }

    /* ── Project data ── */
    const projects = [
      {
        num: '01',
        tags: ['Mistral 7B', 'PyTorch', 'Docker'],
        title: 'LLM Chatbot',
        desc: 'Hybrid architecture combining symbolic AI for intent resolution with Mistral 7B for generation — orchestrated via a custom message broker, containerized with Docker.',
        href: 'https://github.com/Nestallum/llm-chatbot',
        viz: drawTerminal,
      },
      {
        num: '02',
        tags: ['HuggingFace', 'RoBERTa', 'NLP'],
        title: 'RoBERTa Fine-tuning',
        desc: 'Fine-tuned RoBERTa on large-scale argument classification — 83% F1, 90% recall. Custom tokenization pipelines and optimized DataLoader workflows.',
        href: 'https://github.com/Nestallum/argument-mining-llm',
        viz: drawAttention,
      },
      {
        num: '03',
        tags: ['TensorFlow', 'LSTM', 'GRU'],
        title: 'Time Series Forecasting',
        desc: 'RNN-based forecasting at ±0.3°C accuracy on 22k temperature samples. Benchmarked LSTM vs GRU architectures on 100-step ahead prediction.',
        href: 'https://github.com/Nestallum/time-series-forecasting',
        viz: drawTimeSeries,
      },
      {
        num: '04',
        tags: ['NLTK', 'MongoDB', 'YouTube API'],
        title: 'Sentiment Analysis',
        desc: 'End-to-end NLP pipeline for opinion classification on YouTube comments — data collection, anonymization, NLTK preprocessing and MongoDB storage.',
        href: 'https://github.com/Nestallum/yt-comment-sentiment-analysis',
        viz: drawScatter,
      },
    ];

    const stackEl   = document.getElementById('projects-stack');
    const dotsEl    = document.getElementById('projects-dots');
    const counterEl = document.getElementById('projects-counter');
    const N         = projects.length;
    let current     = 0;
    let animating   = false;

    /* Build all cards once, manage visibility via data-state */
    const cardEls = projects.map((p, i) => {
      const card = document.createElement('div');
      card.className   = 'project-stack-card';
      card.dataset.idx = i;
      card.innerHTML   = `
        <div class="pcard-left">
          <span class="pcard-num">${p.num}</span>
          <div class="pcard-spacer"></div>
          <div class="pcard-meta">
            <div class="pcard-tags">${p.tags.map(t => `<span class="tag">${t}</span>`).join('')}</div>
            <h3 class="pcard-title">${p.title}</h3>
            <p class="pcard-desc">${p.desc}</p>
            <a class="pcard-link" href="${p.href}" target="_blank" rel="noopener" aria-label="${p.title} on GitHub">
              View on GitHub
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17 17 7M7 7h10v10"/></svg>
            </a>
          </div>
        </div>
        <div class="pcard-right"><canvas id="pcanvas-${i}"></canvas></div>
      `;
      stackEl.appendChild(card);
      return card;
    });

    /* Start canvas animations — always running, invisible when off-screen */
    requestAnimationFrame(() => {
      projects.forEach((p, i) => {
        const c = document.getElementById(`pcanvas-${i}`);
        if (c) p.viz(c);
      });
    });

    function applyPositions() {
      cardEls.forEach((c, i) => {
        if (c.classList.contains('dropping')) return;
        const d = ((i - current) % N + N) % N;
        c.dataset.pos = Math.min(d, 3);
        c.style.display = '';
      });
    }

    function updateUI() {
      counterEl.textContent = `0${current + 1} / 0${N}`;
      dotsEl.querySelectorAll('.projects-dot').forEach((d, i) => {
        d.classList.toggle('active', i === current);
      });
    }

    function go(dir) {
      if (animating) return;
      animating = true;

      const leaving = cardEls[current];
      leaving.classList.add('dropping');

      current = ((current + dir) % N + N) % N;
      applyPositions();
      updateUI();

      setTimeout(() => {
        leaving.classList.remove('dropping');
        const d = ((cardEls.indexOf(leaving) - current + N) % N);
        leaving.dataset.pos = Math.min(d, 3);
        animating = false;
      }, 520);
    }

    /* Build dots */
    projects.forEach((_, i) => {
      const d = document.createElement('div');
      d.className = 'projects-dot' + (i === 0 ? ' active' : '');
      d.addEventListener('click', () => {
        const diff = ((i - current) % N + N) % N;
        go(diff <= N / 2 ? diff : diff - N);
      });
      dotsEl.appendChild(d);
    });

    document.getElementById('projects-next').addEventListener('click', () => go(1));
    document.getElementById('projects-prev').addEventListener('click', () => go(-1));

    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft')  go(-1);
    });

    /* Disable transitions on first paint to avoid initial animation */
    cardEls.forEach(c => { c.style.transition = 'none'; });
    applyPositions();
    updateUI();
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        cardEls.forEach(c => { c.style.transition = ''; });
      });
    });
  }

  /* ── Boot ── */
  const cursor = initCursor();
  initCursorPicker(cursor);
  initThemePicker();
  initScrollBehaviours();
  initSidebarHighlight();
  initFadeIn();
  initMatrix();
  initProjects();

})();
