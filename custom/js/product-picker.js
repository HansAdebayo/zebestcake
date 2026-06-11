/* product-picker.js — ZeBest Custom : modal sidebar de sélection de modèle */
(function () {
    'use strict';

    var CACHE_KEY = 'zbcustom_catalogue';
    var YOYO_CAT  = 'yoyo nfc';

    /* ---- Références DOM ---- */
    var modal        = document.getElementById('product-modal');
    var backdrop     = document.getElementById('modal-backdrop');
    var closeBtn     = document.getElementById('modal-close');
    var sidebarEl    = document.getElementById('modal-sidebar');
    var mainImgEl    = document.getElementById('modal-main-img');
    var modelNameEl  = document.getElementById('modal-model-name');
    var modelPriceEl = document.getElementById('modal-model-price');
    var thumbsEl     = document.getElementById('modal-thumbs');
    var selectedInput = document.getElementById('selected-model');
    var ctaBtn       = document.getElementById('modal-cta');
    var openBtn      = document.getElementById('keychain-open');
    var countEl      = document.getElementById('keychain-count');
    var previewImg   = document.getElementById('keychain-preview-img');

    if (!modal || !sidebarEl || !openBtn) return;

    var plans        = [];
    var currentIndex = -1;

    /* ---- Lecture des données depuis le cache sessionStorage ---- */
    function loadPlans(cb) {
        var raw  = sessionStorage.getItem(CACHE_KEY);
        var bust = parseInt(localStorage.getItem('zbcustom_cache_bust') || '0', 10);

        if (raw) {
            try {
                var parsed = JSON.parse(raw);
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

    /* ---- Construction de la sidebar ---- */
    function buildSidebar() {
        sidebarEl.innerHTML = '';

        plans.forEach(function (plan, i) {
            var btn = document.createElement('button');
            btn.className = 'modal-sidebar-item' + (i === 0 ? ' active' : '');
            btn.setAttribute('aria-label', plan.title);
            btn.dataset.index = i;

            var img = document.createElement('img');
            img.src     = imgSrc(plan, 0);
            img.alt     = '';
            img.loading = i === 0 ? 'eager' : 'lazy';
            btn.appendChild(img);

            btn.addEventListener('click', function () {
                setActive(i);
            });

            sidebarEl.appendChild(btn);
        });
    }

    /* ---- Activation d'un modèle ---- */
    function setActive(idx) {
        if (idx === currentIndex) return;
        currentIndex = idx;

        var plan = plans[idx];
        if (!plan) return;

        var price = typeof plan.basePrice === 'number'
            ? 'À partir de ' + plan.basePrice.toFixed(2) + ' €'
            : '';

        modelNameEl.textContent  = plan.title;
        modelPriceEl.textContent = price;
        selectedInput.value      = plan.id + '|' + esc(plan.title);
        ctaBtn.href              = 'plan.html?id=' + plan.id;

        /* Image principale */
        mainImgEl.src = imgSrc(plan, 0);
        mainImgEl.alt = plan.title;

        /* Highlight sidebar */
        sidebarEl.querySelectorAll('.modal-sidebar-item').forEach(function (btn, i) {
            btn.classList.toggle('active', i === idx);
        });

        /* Scroll sidebar item dans la vue */
        var activeBtn = sidebarEl.querySelectorAll('.modal-sidebar-item')[idx];
        if (activeBtn) activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

        buildThumbs(plan, idx);
    }

    /* ---- Miniatures du modèle actif (images[1..n] seulement) ---- */
    function buildThumbs(plan) {
        thumbsEl.innerHTML = '';

        var allImages = Array.isArray(plan.images) ? plan.images
                      : (plan.image ? [plan.image] : []);

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
                mainImgEl.src = src;

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
            setActive(0);
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

        if (countEl) {
            countEl.textContent = data.length + ' modèle' + (data.length > 1 ? 's' : '') + ' disponible' + (data.length > 1 ? 's' : '');
        }
        if (previewImg && data.length > 0) {
            var first = imgSrc(data[0], 0);
            if (first) previewImg.src = first;
        }

        buildSidebar();

        if (autoOpen) openModal();
    });

    openBtn.addEventListener('click', openModal);
    closeBtn.addEventListener('click', closeModal);
    backdrop.addEventListener('click', closeModal);

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && modal.classList.contains('open')) closeModal();
    });

})();
