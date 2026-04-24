if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
}

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const nav = document.getElementById('nav');
const main = document.getElementById('main');
const loader = document.getElementById('loader');
const heroContent = document.getElementById('heroContent');
const heroScroll = document.getElementById('heroScroll');
const backToTop = document.getElementById('back-to-top');
const navHomeTrigger = document.getElementById('nav-home-trigger');

const root = document.documentElement;

function setIntroState(state) {
    root.classList.remove('intro-pending', 'intro-started', 'intro-complete');
    root.classList.add(state);
}

function showCoreUi() {
    nav?.classList.add('visible');
    main?.classList.add('visible');
    heroContent?.classList.add('in');
}

function initReducedMotionMode() {
    document.documentElement.style.scrollBehavior = 'auto';
    document.querySelectorAll('.reveal').forEach((el) => el.classList.add('in'));

    if (loader) {
        loader.style.display = 'none';
    }

    document.body.style.overflow = '';
    setIntroState('intro-complete');
    showCoreUi();
    heroScroll?.classList.add('visible');
}

function initLoaderSequence() {
    if (sessionStorage.getItem('reload')) {
        sessionStorage.removeItem('reload');
        window.scrollTo(0, 0);
    }

    document.body.style.overflow = 'hidden';
    window.scrollTo(0, 0);

    window.addEventListener('load', () => {
        const loaderBar = document.querySelector('.loader-bar-fill');
        if (!loaderBar || !loader) {
            document.body.style.overflow = '';
            setIntroState('intro-complete');
            showCoreUi();
            heroScroll?.classList.add('visible');
            return;
        }

        loaderBar.addEventListener('animationend', () => {
            setTimeout(() => {
                document.body.style.overflow = '';
                setIntroState('intro-started');
                loader.classList.add('slide-up');

                loader.addEventListener('transitionend', () => {
                    loader.style.display = 'none';
                    setIntroState('intro-complete');
                    nav?.classList.add('visible');

                    if (heroScroll) {
                        heroScroll.style.transition = 'opacity 0.5s var(--ease-out)';
                        heroScroll.classList.add('visible');
                    }
                }, { once: true });

                main?.classList.add('visible');

                setTimeout(() => {
                    heroContent?.classList.add('in');
                }, 100);
            }, 150);
        }, { once: true });
    });
}

function initRevealObserver() {
    if (reduceMotion) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('in');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12 });

    document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
}

function initBackToTop() {
    window.addEventListener('scroll', () => {
        const trigger = window.innerHeight * 0.6;
        backToTop?.classList.toggle('visible', window.scrollY > trigger);
    }, { passive: true });

    backToTop?.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: reduceMotion ? 'auto' : 'smooth'
        });
    });
}

function initHeroScrollIndicator() {
    let hasScrolled = false;

    window.addEventListener('scroll', () => {
        if (!heroScroll || hasScrolled) return;

        if (window.scrollY > 20) {
            heroScroll.style.transition = 'opacity 0.25s ease-in';
            heroScroll.classList.add('hidden');
            hasScrolled = true; // 👈 empêche tout retour
        }
    }, { passive: true });
}

function initAnchorScroll() {
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
        anchor.addEventListener('click', (event) => {
            const targetSelector = anchor.getAttribute('href');
            const target = targetSelector ? document.querySelector(targetSelector) : null;

            if (!target) return;

            event.preventDefault();

            const offset = 60;
            const top = target.getBoundingClientRect().top + window.scrollY - offset;

            window.scrollTo({
                top,
                behavior: reduceMotion ? 'auto' : 'smooth'
            });

            history.pushState(null, '', targetSelector);

            if (!target.hasAttribute('tabindex')) {
                target.setAttribute('tabindex', '-1');
            }

            target.focus({ preventScroll: true });
        });
    });
}

function initNavReload() {
    navHomeTrigger?.addEventListener('click', () => {
        sessionStorage.setItem('reload', '1');
        window.location.reload();
    });
}

function initWinston() {
    const root = document.getElementById('winston');
    const pill = document.getElementById('winston-pill');
    const preview = document.getElementById('winston-preview');
    const chat = document.getElementById('winston-chat');
    const previewClose = document.getElementById('winston-preview-close');
    const chatClose = document.getElementById('winston-chat-close');
    const previewCta = document.getElementById('winston-preview-cta');
    const form = document.getElementById('winston-form');
    const input = document.getElementById('winston-input');
    const messages = document.getElementById('winston-messages');

    if (!root || !pill || !preview || !chat) return;

    let state = 'closed';

    const getCurrentTime = () => {
        const now = new Date();
        return now.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const setPressed = (isPressed) => {
        pill.classList.toggle('is-pressed', isPressed);
    };

    const setActive = (isActive) => {
        pill.classList.toggle('is-active', isActive);
        pill.setAttribute('aria-expanded', isActive ? 'true' : 'false');
    };

    const openPreview = () => {
        root.classList.remove('chat-open');

        chat.classList.remove('is-open');
        chat.setAttribute('aria-hidden', 'true');
        setTimeout(() => {
            if (state !== 'chat') chat.hidden = true;
        }, 220);

        preview.hidden = false;
        preview.setAttribute('aria-hidden', 'false');
        requestAnimationFrame(() => preview.classList.add('is-open'));

        setActive(true);
        state = 'preview';
    };

    const openChat = () => {
        preview.classList.remove('is-open');
        preview.setAttribute('aria-hidden', 'true');
        setTimeout(() => {
            if (state !== 'preview') preview.hidden = true;
        }, 220);

        chat.hidden = false;
        chat.setAttribute('aria-hidden', 'false');
        requestAnimationFrame(() => chat.classList.add('is-open'));

        root.classList.add('chat-open');
        setActive(true);
        state = 'chat';
        input?.focus();
    };

    const closeAll = () => {
        preview.classList.remove('is-open');
        chat.classList.remove('is-open');

        preview.setAttribute('aria-hidden', 'true');
        chat.setAttribute('aria-hidden', 'true');

        setTimeout(() => {
            if (state === 'closed') {
                preview.hidden = true;
                chat.hidden = true;
            }
        }, 220);

        root.classList.remove('chat-open');
        setActive(false);
        state = 'closed';
    };

    pill.addEventListener('pointerdown', () => setPressed(true));
    pill.addEventListener('pointerup', () => setPressed(false));
    pill.addEventListener('pointerleave', () => setPressed(false));
    pill.addEventListener('blur', () => setPressed(false));

    pill.addEventListener('click', () => {
        if (state === 'closed') {
            openPreview();
            return;
        }

        if (state === 'preview') {
            state = 'closed';
            closeAll();
            return;
        }

        if (state === 'chat') {
            state = 'closed';
            closeAll();
        }
    });

    previewClose?.addEventListener('click', () => {
        state = 'closed';
        closeAll();
    });

    chatClose?.addEventListener('click', () => {
        state = 'closed';
        closeAll();
    });

    previewCta?.addEventListener('click', () => {
        openChat();
    });

    document.addEventListener('click', (event) => {
        const insideWinston = event.target.closest('#winston');

        if (!insideWinston && state !== 'closed') {
            state = 'closed';
            closeAll();
        }
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && state !== 'closed') {
            state = 'closed';
            closeAll();
        }
    });

    const addMessage = (text, role = 'assistant') => {
        if (!messages) return;

        const row = document.createElement('div');
        row.className = `winston-message ${role}`;

        if (role === 'assistant') {
            const meta = document.createElement('div');
            meta.className = 'winston-message-meta';

            const author = document.createElement('span');
            author.className = 'winston-message-author';
            author.textContent = 'Winston';

            meta.appendChild(author);
            row.appendChild(meta);
        }

        const bubble = document.createElement('div');
        bubble.className = 'winston-bubble';

        const bubbleText = document.createElement('div');
        bubbleText.className = 'winston-bubble-text';
        bubbleText.textContent = text;

        const time = document.createElement('div');
        time.className = 'winston-time';
        time.textContent = getCurrentTime();

        bubble.appendChild(bubbleText);
        row.appendChild(bubble);
        row.appendChild(time);
        messages.appendChild(row);
        messages.scrollTop = messages.scrollHeight;
    };

    const getWinstonReply = (question) => {
        const q = question.toLowerCase();

        if (q.includes('project')) {
            return 'Nassim has worked on several AI-focused projects, including an LLM chatbot, RoBERTa fine-tuning, time series forecasting, and sentiment analysis.';
        }

        if (q.includes('skill') || q.includes('stack') || q.includes('tools')) {
            return 'His stack includes PyTorch, TensorFlow, Hugging Face, OpenCV, Optuna, Python, C++, Docker, Kubernetes, CUDA, ONNX and more.';
        }

        if (q.includes('experience') || q.includes('internship') || q.includes('sodern') || q.includes('ariane')) {
            return 'He completed an AI Research internship at Sodern, part of ArianeGroup, where he built an end-to-end deep learning pipeline for image restoration on embedded space systems.';
        }

        if (q.includes('education') || q.includes('master') || q.includes('msc')) {
            return 'He holds an MSc in Computer Science specialized in Artificial Intelligence from Université Paris Cité, where he graduated first in class.';
        }

        if (q.includes('job') || q.includes('role') || q.includes('looking') || q.includes('open')) {
            return 'He is currently open to full-time AI and machine learning engineering roles.';
        }

        return 'I can help with questions about Nassim’s experience, projects, skills, education, and current career goals.';
    };

    form?.addEventListener('submit', (event) => {
        event.preventDefault();

        const value = input?.value.trim();
        if (!value) return;

        addMessage(value, 'user');
        input.value = '';

        window.setTimeout(() => {
            addMessage(getWinstonReply(value), 'assistant');
        }, 220);
    });

    const initialTimes = document.querySelectorAll('.winston-time');
    initialTimes.forEach(el => {
        el.textContent = getCurrentTime();
    });
}

function init() {
    setIntroState('intro-pending');
    initNavReload();
    initRevealObserver();
    initBackToTop();
    initHeroScrollIndicator();
    initAnchorScroll();
    initWinston();

    if (reduceMotion) {
        initReducedMotionMode();
    } else {
        initLoaderSequence();
    }
}

init();