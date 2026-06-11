/* animations.js — ZeBest Custom : GSAP reveals, burger, header glass */
(function () {
    'use strict';

    /* ---- HEADER : glass effect au scroll ---- */
    var header = document.getElementById('site-header');
    if (header) {
        window.addEventListener('scroll', function () {
            header.classList.toggle('scrolled', window.scrollY > 60);
        }, { passive: true });
    }

    /* ---- BURGER TOGGLE ---- */
    var burger   = document.getElementById('burger');
    var navLinks = document.getElementById('nav-links');

    if (burger && navLinks) {
        burger.addEventListener('click', function () {
            var isOpen = navLinks.classList.toggle('open');
            burger.classList.toggle('active', isOpen);
            burger.setAttribute('aria-expanded', String(isOpen));
        });

        /* Fermer le menu au clic sur un lien */
        navLinks.querySelectorAll('a').forEach(function (link) {
            link.addEventListener('click', function () {
                navLinks.classList.remove('open');
                burger.classList.remove('active');
                burger.setAttribute('aria-expanded', 'false');
            });
        });
    }

    /* ---- GSAP ---- */
    if (typeof gsap === 'undefined') return;

    gsap.registerPlugin(ScrollTrigger);

    /* Hero — reveal staggeré au chargement */
    var heroEls = document.querySelectorAll('[data-reveal]');
    if (heroEls.length) {
        gsap.set(heroEls, { opacity: 0, y: 36 });
        gsap.to(heroEls, {
            opacity:  1,
            y:        0,
            duration: 1.0,
            stagger:  0.14,
            ease:     'power3.out',
            delay:    0.3
        });
    }

    /* Scroll line — appear après le texte */
    var scrollLine = document.querySelector('.scroll-line');
    if (scrollLine) {
        gsap.to(scrollLine, {
            scaleY:   1,
            duration: 1.5,
            ease:     'power2.inOut',
            delay:    1.3
        });
    }

    /* Sections — reveal sur scroll */
    document.querySelectorAll('[data-reveal-section]').forEach(function (el) {
        gsap.fromTo(el,
            { opacity: 0, y: 48 },
            {
                opacity:  1,
                y:        0,
                duration: 0.9,
                ease:     'power3.out',
                scrollTrigger: {
                    trigger: el,
                    start:   'top 82%',
                    once:    true
                }
            }
        );
    });

    /* Process steps — stagger en cascade sur scroll */
    var processSteps = document.querySelectorAll('[data-reveal-step]');
    if (processSteps.length) {
        gsap.fromTo(processSteps,
            { opacity: 0, y: 36 },
            {
                opacity:  1,
                y:        0,
                duration: 0.75,
                stagger:  0.18,
                ease:     'power2.out',
                scrollTrigger: {
                    trigger: processSteps[0].parentElement,
                    start:   'top 78%',
                    once:    true
                }
            }
        );
    }

    /* Key cards — stagger en cascade sur scroll */
    var keysGrid = document.querySelector('.keys-grid');
    if (keysGrid) {
        gsap.fromTo(
            keysGrid.querySelectorAll('.key-card'),
            { opacity: 0, y: 44 },
            {
                opacity:  1,
                y:        0,
                duration: 0.65,
                stagger:  0.04,
                ease:     'power2.out',
                scrollTrigger: {
                    trigger: keysGrid,
                    start:   'top 78%',
                    once:    true
                }
            }
        );
    }

    /* Plan cards Firestore — GSAP déclenché quand le DOM se remplit */
    var plansGrid = document.getElementById('plans-grid');
    if (plansGrid) {
        var gsapFired = false;
        var mo = new MutationObserver(function () {
            /* Supprimer les cartes Yoyo NFC à chaque re-rendu */
            plansGrid.querySelectorAll('.plan-category').forEach(function (el) {
                if (el.textContent.trim().toLowerCase() === 'yoyo nfc') {
                    el.closest('.plan-card').remove();
                }
            });

            /* Lancer l'animation GSAP une seule fois au premier chargement */
            if (!gsapFired) {
                var cards = plansGrid.querySelectorAll('.plan-card');
                if (cards.length > 0) {
                    gsapFired = true;
                    gsap.fromTo(cards,
                        { opacity: 0, y: 28 },
                        {
                            opacity:  1,
                            y:        0,
                            duration: 0.6,
                            stagger:  0.055,
                            ease:     'power2.out'
                        }
                    );
                }
            }
        });
        mo.observe(plansGrid, { childList: true, subtree: true });
    }

})();
