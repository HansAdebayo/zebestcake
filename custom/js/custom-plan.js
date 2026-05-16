// custom/js/custom-plan.js
// Page configurateur d'un plan ZeBest Custom.
// Charge le plan depuis Firestore, génère les options dynamiquement,
// calcule le prix en temps réel, ajoute au panier localStorage.

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
        document.getElementById('plan-detail').innerHTML =
            '<p class="text-pierre">Aucun produit sélectionné.</p>';
    }
});

// ---- NAVIGATION ----

function initNav() {
    const burger   = document.getElementById('burger');
    const navLinks = document.getElementById('nav-links');
    const header   = document.querySelector('header');

    if (burger && navLinks) {
        burger.addEventListener('click', () => {
            const isOpen = navLinks.classList.toggle('open');
            burger.classList.toggle('active', isOpen);
            burger.setAttribute('aria-expanded', isOpen);
        });
        navLinks.addEventListener('click', () => {
            navLinks.classList.remove('open');
            burger.classList.remove('active');
            burger.setAttribute('aria-expanded', false);
        });
    }

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
    const cart  = JSON.parse(localStorage.getItem('zebest_custom_cart') || '[]');
    badge.textContent = cart.length;
    badge.dataset.count = cart.length;
}

// ---- CHARGEMENT DU PLAN ----

async function loadPlan(id) {
    const container = document.getElementById('plan-detail');

    try {
        const snap = await getDoc(doc(db, 'custom_plans', id));

        if (!snap.exists()) {
            container.innerHTML = '<p class="text-pierre">Produit introuvable.</p>';
            return;
        }

        const plan = { id: snap.id, ...snap.data() };

        if (!plan.isActive) {
            container.innerHTML = '<p class="text-pierre">Ce produit n\'est plus disponible.</p>';
            return;
        }

        currentPlan = plan;
        document.title = `${plan.title} — ZeBest Custom`;
        renderPlan(plan, container);

    } catch (err) {
        console.error('Erreur chargement plan :', err);
        container.innerHTML = '<p class="text-pierre">Une erreur est survenue. Veuillez réessayer.</p>';
    }
}

// ---- RENDU DE LA PAGE ----

function renderPlan(plan, container) {
    const imageUrl = plan.image || '../assets/images/gateau.jpg';

    container.innerHTML = `
        <div class="plan-gallery">
            <div class="plan-main-image">
                <img src="${imageUrl}" alt="${plan.title}">
            </div>
        </div>

        <div class="plan-configurator">
            <p class="plan-category">${plan.category || ''}</p>
            <h1>${plan.title}</h1>
            <p class="plan-price-display" id="price-display">
                ${plan.basePrice.toFixed(2)} €
            </p>
            <p class="plan-description">${plan.description || ''}</p>

            <form id="configurator-form" novalidate>
                <div id="options-container"></div>

                <div class="form-group" style="margin-top: 1.5rem;">
                    <label for="custom-notes">Notes (optionnel)</label>
                    <textarea id="custom-notes" rows="3"
                        placeholder="Une précision, une envie particulière ?"></textarea>
                </div>

                <div id="form-feedback" class="feedback hidden"></div>

                <button type="submit" class="btn btn-full" style="margin-top: 1.5rem;">
                    Ajouter au panier
                </button>
            </form>
        </div>
    `;

    renderOptions(plan);

    document.getElementById('configurator-form').addEventListener('submit', (e) => {
        e.preventDefault();
        addToCart(plan);
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

        if (opt.type === 'text') {
            field = document.createElement('input');
            field.type = 'text';
            field.id   = `opt-${index}`;
            field.name = `opt-${index}`;
            field.dataset.optId = opt.id;
            field.placeholder   = opt.placeholder || '';
            if (opt.maxLength) field.maxLength = opt.maxLength;
            if (opt.required)  field.required  = true;

        } else if (opt.type === 'select' && opt.choices) {
            field = document.createElement('select');
            field.id   = `opt-${index}`;
            field.name = `opt-${index}`;
            field.dataset.optId = opt.id;
            if (opt.required) field.required = true;

            const placeholder = document.createElement('option');
            placeholder.value    = '';
            placeholder.textContent = `Choisir…`;
            placeholder.disabled = true;
            placeholder.selected = true;
            field.appendChild(placeholder);

            opt.choices.forEach(choice => {
                const option = document.createElement('option');
                option.value = choice.value;
                option.textContent = choice.label +
                    (choice.priceModifier > 0 ? ` (+${choice.priceModifier} €)` : '');
                option.dataset.modifier = choice.priceModifier || 0;
                field.appendChild(option);
            });

            // Mise à jour du prix en temps réel
            field.addEventListener('change', () => updatePriceDisplay(plan));
        }

        if (opt.hint) {
            const hint = document.createElement('p');
            hint.className   = 'form-hint';
            hint.textContent = opt.hint;
            group.appendChild(label);
            group.appendChild(field);
            group.appendChild(hint);
        } else {
            group.appendChild(field);
        }

        container.appendChild(group);
    });
}

// ---- CALCUL DU PRIX ----

function updatePriceDisplay(plan) {
    const display = document.getElementById('price-display');
    if (!display) return;

    let total = plan.basePrice;

    document.querySelectorAll('#options-container select').forEach(select => {
        const selected = select.options[select.selectedIndex];
        if (selected && selected.dataset.modifier) {
            total += parseFloat(selected.dataset.modifier) || 0;
        }
    });

    display.textContent = `${total.toFixed(2)} €`;
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

// ---- AJOUT AU PANIER ----

function addToCart(plan) {
    const form     = document.getElementById('configurator-form');
    const feedback = document.getElementById('form-feedback');

    // Validation native HTML5
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    // Collecte des options sélectionnées
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
        selectedOptions: selectedOptions,
        notes:           document.getElementById('custom-notes').value.trim(),
        unitPrice:       computeUnitPrice(plan),
        image:           plan.image || '../assets/images/gateau.jpg',
        addedAt:         Date.now()
    };

    const cart = JSON.parse(localStorage.getItem('zebest_custom_cart') || '[]');
    cart.push(cartItem);
    localStorage.setItem('zebest_custom_cart', JSON.stringify(cart));

    // Feedback visuel avant redirection
    feedback.className  = 'feedback success';
    feedback.textContent = 'Ajouté au panier ! Redirection…';
    feedback.classList.remove('hidden');

    setTimeout(() => {
        window.location.href = 'commander.html';
    }, 800);
}
