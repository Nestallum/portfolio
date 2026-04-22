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
const themeToggle = document.getElementById('theme-toggle');
const themeColorMeta = document.getElementById('theme-color-meta');
const navHomeTrigger = document.getElementById('nav-home-trigger');
const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)');

function updateThemeColor(theme) {
    if (!themeColorMeta) return;
    themeColorMeta.setAttribute('content', theme === 'dark' ? '#111111' : '#f5f5f7');
}

function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    updateThemeColor(theme);

    if (themeToggle) {
        themeToggle.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
    }
}

function initTheme() {
    const isMobile = window.matchMedia('(max-width: 700px)').matches;

    if (isMobile) {
        const systemTheme = systemPrefersDark.matches ? 'dark' : 'light';
        applyTheme(systemTheme);

        const handleSystemThemeChange = (event) => {
            applyTheme(event.matches ? 'dark' : 'light');
        };

        if (typeof systemPrefersDark.addEventListener === 'function') {
            systemPrefersDark.addEventListener('change', handleSystemThemeChange);
        } else if (typeof systemPrefersDark.addListener === 'function') {
            systemPrefersDark.addListener(handleSystemThemeChange);
        }

        return;
    }

    const savedTheme = localStorage.getItem('theme');
    const initialTheme = savedTheme || (systemPrefersDark.matches ? 'dark' : 'light');

    applyTheme(initialTheme);

    themeToggle?.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        applyTheme(next);
        localStorage.setItem('theme', next);
    });

    const handleSystemThemeChange = (event) => {
        const hasManualPreference = localStorage.getItem('theme');
        if (hasManualPreference) return;

        applyTheme(event.matches ? 'dark' : 'light');
    };

    if (typeof systemPrefersDark.addEventListener === 'function') {
        systemPrefersDark.addEventListener('change', handleSystemThemeChange);
    } else if (typeof systemPrefersDark.addListener === 'function') {
        systemPrefersDark.addListener(handleSystemThemeChange);
    }
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
            showCoreUi();
            heroScroll?.classList.add('visible');
            return;
        }

        loaderBar.addEventListener('animationend', () => {
            setTimeout(() => {
                document.body.style.overflow = '';
                loader.classList.add('slide-up');

                loader.addEventListener('transitionend', () => {
                    loader.style.display = 'none';
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
        backToTop?.classList.toggle('visible', window.scrollY > 400);
    }, { passive: true });

    backToTop?.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: reduceMotion ? 'auto' : 'smooth'
        });
    });
}

function initHeroScrollIndicator() {
    window.addEventListener('scroll', () => {
        if (window.scrollY > 20 && heroScroll) {
            heroScroll.style.transition = 'opacity 0.25s ease-in';
            heroScroll.classList.add('hidden');
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

            const top = target.getBoundingClientRect().top + window.scrollY - 60;
            window.scrollTo({
                top,
                behavior: reduceMotion ? 'auto' : 'smooth'
            });
        });
    });
}

function initNavReload() {
    navHomeTrigger?.addEventListener('click', () => {
        sessionStorage.setItem('reload', '1');
        window.location.reload();
    });
}

function init() {
    initTheme();
    initNavReload();
    initRevealObserver();
    initBackToTop();
    initHeroScrollIndicator();
    initAnchorScroll();

    if (reduceMotion) {
        initReducedMotionMode();
    } else {
        initLoaderSequence();
    }
}

init();