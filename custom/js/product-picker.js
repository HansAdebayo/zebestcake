/* product-picker.js — ZeBest Custom : modal carousel de sélection de modèle */
(function () {
    'use strict';

    var CACHE_KEY = 'zbcustom_catalogue';
    var YOYO_CAT  = 'yoyo nfc';

    /* ---- Références DOM ---- */
    var modal        = document.getElementById('product-modal');
    var backdrop     = document.getElementById('modal-backdrop');
    var closeBtn     = document.getElementById('modal-close');
    var carousel     = document.getElementById('modal-carousel');
    var dotsEl       = document.getElementById('modal-dots');
    var prevBtn      = document.getElementById('modal-prev');
    var nextBtn      = document.getElementById('modal-next');
    var modelNameEl  = document.getElementById('modal-model-name');
    var modelPriceEl = document.getElementById('modal-model-price');
    var thumbsEl      = document.getElementById('modal-thumbs');
    var counterEl     = document.getElementById('modal-counter');
    var selectedInput = document.getElementById('selected-model');
    var ctaBtn        = document.getElementById('modal-cta');
    var openBtn      = document.getElementById('keychain-open');
    var countEl      = document.getElementById('keychain-count');
    var previewImg   = document.getElementById('keychain-preview-img');

    if (!modal || !carousel || !openBtn) return;

    var plans        = [];
    var currentIndex = -1;
    var slideObserver;

    /* ---- Lecture des données depuis le cache sessionStorage ---- */
    function loadPlans(cb) {
        var raw  = sessionStorage.getItem(CACHE_KEY);
        var bust = parseInt(localStorage.getItem('zbcustom_cache_bust') || '0', 10);

        if (raw) {
            try {
                var parsed = JSON.parse(raw);
                /* Cache invalidé par l'admin depuis un autre onglet */
                if (bust > (parsed.ts || 0)) {
                    sessionStorage.removeItem(CACHE_KEY);
                    raw = null;
                } else {
                    cb(filterPlans(parsed.data || []));
                    return;
                }
            } catch (e) {
                sessionStorage.removeItem(CACHE_KEY);
                raw = null;
            }
        }

        /* Cache pas encore prêt : on attend que custom-home.js peuple #plans-grid */
        var grid = document.getElementById('plans-grid');
        if (!grid) return;

        var obs = new MutationObserver(function () {
            var raw2 = sessionStorage.getItem(CACHE_KEY);
            if (raw2) {
                obs.disconnect();
                try {
                    cb(filterPlans(JSON.parse(raw2).data || []));
                } catch (e) {}
            }
        });
        obs.observe(grid, { childList: true });
    }

    function filterPlans(data) {
        return data
            .filter(function (p) {
                return (p.category || '').toLowerCase() !== YOYO_CAT;
            })
            .sort(function (a, b) {
                return (a.sortOrder != null ? a.sortOrder : 999) - (b.sortOrder != null ? b.sortOrder : 999);
            });
    }

    /* ---- Construction du carousel ---- */
    function buildCarousel() {
        carousel.innerHTML = '';
        dotsEl.innerHTML   = '';

        plans.forEach(function (plan, i) {
            /* Slide */
            var slide = document.createElement('div');
            slide.className      = 'modal-slide';
            slide.dataset.index  = i;
            slide.setAttribute('role', 'listitem');

            var mainSrc = imgSrc(plan, 0);
            slide.innerHTML =
                '<figure class="modal-slide-img" aria-hidden="true">' +
                    '<img src="' + mainSrc + '" alt="' + esc(plan.title) + '" loading="' + (i === 0 ? 'eager' : 'lazy') + '">' +
                '</figure>';

            carousel.appendChild(slide);

            /* Dot */
            var dot = document.createElement('button');
            dot.className = 'modal-dot' + (i === 0 ? ' active' : '');
            dot.setAttribute('aria-label', 'Modèle ' + (i + 1));
            dot.dataset.index = i;
            dot.addEventListener('click', function () {
                scrollToSlide(i);
            });
            dotsEl.appendChild(dot);
        });

        /* IntersectionObserver : détecte le slide centré */
        if (slideObserver) slideObserver.disconnect();

        slideObserver = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
                    setActive(parseInt(entry.target.dataset.index, 10));
                }
            });
        }, { root: carousel, threshold: 0.6 });

        carousel.querySelectorAll('.modal-slide').forEach(function (s) {
            slideObserver.observe(s);
        });
    }

    function scrollToSlide(idx) {
        var slides = carousel.querySelectorAll('.modal-slide');
        if (slides[idx]) {
            slides[idx].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
    }

    /* ---- Mise à jour des flèches ---- */
    function updateNav() {
        if (!prevBtn || !nextBtn) return;
        prevBtn.disabled = currentIndex <= 0;
        nextBtn.disabled = currentIndex >= plans.length - 1;
    }

    /* ---- Activation d'un modèle ---- */
    function setActive(idx) {
        if (idx === currentIndex) return;
        currentIndex = idx;

        var plan  = plans[idx];
        if (!plan) return;

        var price = typeof plan.basePrice === 'number'
            ? 'À partir de ' + plan.basePrice.toFixed(2) + ' €'
            : '';

        modelNameEl.textContent  = plan.title;
        modelPriceEl.textContent = price;
        selectedInput.value      = plan.id + '|' + esc(plan.title);
        ctaBtn.href              = 'plan.html?id=' + plan.id;

        /* Mise à jour des dots, compteur et flèches */
        dotsEl.querySelectorAll('.modal-dot').forEach(function (d, i) {
            d.classList.toggle('active', i === idx);
        });
        if (counterEl) counterEl.textContent = (idx + 1) + ' / ' + plans.length;
        updateNav();

        /* Mise à jour des miniatures */
        buildThumbs(plan, idx);
    }

    /* ---- Miniatures du modèle actif (images[1..n] seulement) ---- */
    function buildThumbs(plan, planIdx) {
        thumbsEl.innerHTML = '';

        var allImages = Array.isArray(plan.images) ? plan.images
                      : (plan.image ? [plan.image] : []);

        /* images[0] est déjà dans le carousel — les thumbs = photos exemples */
        var extras = allImages.slice(1);
        if (extras.length === 0) return;

        extras.forEach(function (src, i) {
            var btn = document.createElement('button');
            btn.className = 'modal-thumb' + (i === 0 ? ' active' : '');
            btn.setAttribute('aria-label', plan.title + ' — photo ' + (i + 2));

            var img = document.createElement('img');
            img.src     = src;
            img.alt     = '';
            img.loading = 'lazy';
            btn.appendChild(img);

            btn.addEventListener('click', function () {
                /* Remplace l'image principale du slide courant */
                var slide = carousel.querySelectorAll('.modal-slide')[planIdx];
                if (slide) slide.querySelector('img').src = src;

                /* Passe la photo exemple dans l'URL du CTA */
                if (ctaBtn) {
                    ctaBtn.href = 'plan.html?id=' + plan.id + '&photo=' + encodeURIComponent(src);
                }

                thumbsEl.querySelectorAll('.modal-thumb').forEach(function (t) {
                    t.classList.remove('active');
                });
                btn.classList.add('active');
            });

            thumbsEl.appendChild(btn);
        });
    }

    /* ---- Ouverture / Fermeture ---- */
    function openModal() {
        modal.classList.add('open');
        modal.setAttribute('aria-hidden', 'false');
        document.body.classList.add('modal-open');
        closeBtn.focus();

        if (currentIndex === -1 && plans.length) {
            /* Scroll to first slide before activating */
            requestAnimationFrame(function () {
                if (carousel.firstElementChild) {
                    carousel.scrollLeft = 0;
                }
                setActive(0);
            });
        }
    }

    function closeModal() {
        modal.classList.remove('open');
        modal.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('modal-open');
        openBtn.focus();
    }

    /* ---- Helpers ---- */
    function imgSrc(plan, idx) {
        if (Array.isArray(plan.images) && plan.images[idx]) return plan.images[idx];
        return plan.image || '../assets/images/gateau.jpg';
    }

    function esc(str) {
        return String(str || '')
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }

    /* ---- Init ---- */
    var autoOpen = new URLSearchParams(window.location.search).get('picker') === '1';

    loadPlans(function (data) {
        plans = data;

        /* Mise à jour de la carte d'entrée */
        if (countEl) {
            countEl.textContent = data.length + ' modèle' + (data.length > 1 ? 's' : '') + ' disponible' + (data.length > 1 ? 's' : '');
        }
        if (previewImg && data.length > 0) {
            var first = imgSrc(data[0], 0);
            if (first) previewImg.src = first;
        }

        buildCarousel();

        /* Rouvrir la modal si le client revient depuis plan.html */
        if (autoOpen) openModal();
    });

    openBtn.addEventListener('click', openModal);
    closeBtn.addEventListener('click', closeModal);
    backdrop.addEventListener('click', closeModal);

    if (prevBtn) prevBtn.addEventListener('click', function () {
        scrollToSlide(currentIndex - 1);
    });
    if (nextBtn) nextBtn.addEventListener('click', function () {
        scrollToSlide(currentIndex + 1);
    });

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && modal.classList.contains('open')) closeModal();
    });

})();
