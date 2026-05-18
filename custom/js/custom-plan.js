// custom/js/custom-plan.js
// Peuple la page plan.html depuis Firestore.
// NE TOUCHE PAS au layout HTML — uniquement au contenu.

import { db } from './custom-firebase.js';
import { doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js';

let currentPlan = null;

document.addEventListener('DOMContentLoaded', () => {
    initNav();
    initCartCount();

    const planId = new URLSearchParams(window.location.search).get('id');
    if (planId) {
        loadPlan(planId);
    } else {
        showError('Aucun produit sélectionné.');
    }
});

// ---- NAVIGATION ----

function initNav() {
    const header = document.querySelector('header');
    if (!header) return;

    let lastScroll = 0;
    let ticking    = false;
    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(() => {
                const current = window.pageYOffset;
                header.style.transform = current > lastScroll && current > 80
                    ? 'translateY(-100%)'
                    : 'translateY(0)';
                lastScroll = current <= 0 ? 0 : current;
                ticking = false;
            });
            ticking = true;
        }
    });
}

function initCartCount() {
    const badge = document.getElementById('cart-count');
    if (!badge) return;
    const cart = JSON.parse(localStorage.getItem('zebest_custom_cart') || '[]');
    badge.textContent  = cart.length;
    badge.dataset.count = cart.length;
}

function showError(msg) {
    const el = document.getElementById('plan-content');
    if (el) el.innerHTML = `<p class="text-pierre">${msg}</p>`;
}

// ---- CHARGEMENT DU PLAN ----

const PLAN_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

async function loadPlan(id) {
    try {
        // Chercher d'abord dans le cache catalogue (évite une lecture Firestore)
        const catalogueRaw = sessionStorage.getItem('zbcustom_catalogue');
        if (catalogueRaw) {
            const { data, ts } = JSON.parse(catalogueRaw);
            if (Date.now() - ts < PLAN_CACHE_TTL) {
                const cached = data.find(p => p.id === id);
                if (cached) {
                    currentPlan = cached;
                    document.title = `${cached.title} — ZeBest Custom`;
                    renderPlan(cached);
                    return;
                }
            }
        }

        // Pas en cache → lecture Firestore
        const snap = await getDoc(doc(db, 'custom_plans', id));

        if (!snap.exists()) { showError('Produit introuvable.'); return; }

        const plan = { id: snap.id, ...snap.data() };

        if (!plan.isActive) { showError('Ce produit n\'est plus disponible.'); return; }

        currentPlan = plan;
        document.title = `${plan.title} — ZeBest Custom`;
        renderPlan(plan);

    } catch (err) {
        console.error('Erreur chargement plan :', err);
        showError('Une erreur est survenue. Veuillez réessayer.');
    }
}

// ---- RENDU ----

function renderPlan(plan) {
    const images = Array.isArray(plan.images) && plan.images.length > 0
        ? plan.images
        : (plan.image ? [plan.image] : []);

    // Image principale
    const photo = document.getElementById('cfg-photo');
    if (photo && images[0]) {
        photo.src = images[0];
        photo.alt = plan.title;
    }

    // Miniatures (si plusieurs images)
    const thumbsWrap = document.getElementById('plan-thumbs');
    if (thumbsWrap && images.length > 1) {
        images.forEach((url, i) => {
            const btn = document.createElement('button');
            btn.className = 'plan-thumb' + (i === 0 ? ' active' : '');
            btn.type = 'button';
            btn.setAttribute('aria-label', `Image ${i + 1}`);
            btn.innerHTML = `<img src="${url}" alt="">`;
            btn.addEventListener('click', () => {
                photo.src = url;
                thumbsWrap.querySelectorAll('.plan-thumb').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
            thumbsWrap.appendChild(btn);
        });
    }

    // Contenu formulaire
    const content = document.getElementById('plan-content');
    content.innerHTML = `
        <p class="plan-category">${plan.category || ''}</p>
        <h1>${plan.title}</h1>
        <p class="plan-price-display" id="price-display">${plan.basePrice.toFixed(2)} €</p>
        <p class="plan-description">${plan.description || ''}</p>

        <form id="configurator-form" novalidate>
            <div id="options-container"></div>

            <div class="form-group">
                <label for="custom-notes">Notes (optionnel)</label>
                <textarea id="custom-notes" rows="3"
                    placeholder="Une précision, une envie particulière ?"></textarea>
            </div>

            <div id="form-feedback" class="feedback hidden"></div>

            <button type="submit" class="btn btn-full">
                Ajouter au panier
            </button>
        </form>
    `;

    renderOptions(plan);

    document.getElementById('configurator-form').addEventListener('submit', (e) => {
        e.preventDefault();
        addToCart(plan, images[0] || '');
    });
}

// ---- OPTIONS DYNAMIQUES ----

function renderOptions(plan) {
    const container = document.getElementById('options-container');
    if (!plan.options || plan.options.length === 0) return;

    plan.options.forEach((opt, index) => {
        const group = document.createElement('div');
        group.className = 'form-group';

        const label = document.createElement('label');
        label.setAttribute('for', `opt-${index}`);
        label.textContent = opt.label + (opt.required ? '' : ' (optionnel)');
        group.appendChild(label);

        let field;

        if (opt.type === 'select') {
            field = document.createElement('select');
            field.id            = `opt-${index}`;
            field.name          = `opt-${index}`;
            field.dataset.optId = opt.id;
            if (opt.required) field.required = true;

            const placeholder = document.createElement('option');
            placeholder.value    = '';
            placeholder.textContent = 'Choisir…';
            placeholder.disabled = true;
            placeholder.selected = true;
            field.appendChild(placeholder);

            (opt.choices || []).forEach(choice => {
                const option = document.createElement('option');
                option.value = choice.value;
                option.textContent = choice.label +
                    (choice.priceModifier > 0 ? ` (+${choice.priceModifier} €)` : '');
                option.dataset.modifier = choice.priceModifier || 0;
                field.appendChild(option);
            });

            field.addEventListener('change', () => updatePriceDisplay(plan));

        } else {
            field = document.createElement('input');
            field.type          = 'text';
            field.id            = `opt-${index}`;
            field.name          = `opt-${index}`;
            field.dataset.optId = opt.id;
            field.placeholder   = opt.placeholder || '';
            if (opt.maxLength) field.maxLength = opt.maxLength;
            if (opt.required)  field.required  = true;
        }

        group.appendChild(field);

        if (opt.hint) {
            const hint = document.createElement('p');
            hint.className   = 'form-hint';
            hint.textContent = opt.hint;
            group.appendChild(hint);
        }

        container.appendChild(group);
    });
}

// ---- PRIX ----

function updatePriceDisplay(plan) {
    const display = document.getElementById('price-display');
    if (!display) return;
    display.textContent = `${computeUnitPrice(plan).toFixed(2)} €`;
}

function computeUnitPrice(plan) {
    let total = plan.basePrice;
    document.querySelectorAll('#options-container select').forEach(select => {
        const selected = select.options[select.selectedIndex];
        if (selected && selected.dataset.modifier) {
            total += parseFloat(selected.dataset.modifier) || 0;
        }
    });
    return total;
}

// ---- PANIER ----

function addToCart(plan, mainImage) {
    const form     = document.getElementById('configurator-form');
    const feedback = document.getElementById('form-feedback');

    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const selectedOptions = {};
    if (plan.options) {
        plan.options.forEach((opt, index) => {
            const field = document.getElementById(`opt-${index}`);
            if (field) selectedOptions[opt.id] = field.value;
        });
    }

    const cartItem = {
        planId:          plan.id,
        planName:        plan.title,
        selectedOptions,
        notes:           document.getElementById('custom-notes').value.trim(),
        unitPrice:       computeUnitPrice(plan),
        image:           mainImage,
        addedAt:         Date.now()
    };

    const cart = JSON.parse(localStorage.getItem('zebest_custom_cart') || '[]');
    cart.push(cartItem);
    localStorage.setItem('zebest_custom_cart', JSON.stringify(cart));

    feedback.className   = 'feedback success';
    feedback.textContent = 'Ajouté au panier ! Redirection…';
    feedback.classList.remove('hidden');

    setTimeout(() => { window.location.href = 'commander.html'; }, 800);
}
