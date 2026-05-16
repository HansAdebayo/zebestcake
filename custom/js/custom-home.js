// custom/js/custom-home.js
// Page d'accueil ZeBest Custom : catalogue + navigation partagée.

import { db } from './custom-firebase.js';
import { collection, query, where, getDocs } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js';

document.addEventListener('DOMContentLoaded', () => {
    initNav();
    initCartCount();
    captureUpsellContext();
    loadCatalogue();
});

// ---- NAVIGATION ----

function initNav() {
    const burger  = document.getElementById('burger');
    const navLinks = document.getElementById('nav-links');
    const header  = document.querySelector('header');

    // Burger mobile
    if (burger && navLinks) {
        burger.addEventListener('click', () => {
            const isOpen = navLinks.classList.toggle('open');
            burger.classList.toggle('active', isOpen);
            burger.setAttribute('aria-expanded', isOpen);
        });

        // Ferme le menu au clic sur un lien
        navLinks.addEventListener('click', () => {
            navLinks.classList.remove('open');
            burger.classList.remove('active');
            burger.setAttribute('aria-expanded', false);
        });
    }

    // Masquage du header au scroll (GPU via transform)
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

// ---- PANIER : badge compteur ----

function initCartCount() {
    const badge = document.getElementById('cart-count');
    if (!badge) return;

    const cart  = JSON.parse(localStorage.getItem('zebest_custom_cart') || '[]');
    const count = cart.length;

    badge.textContent       = count;
    badge.dataset.count     = count;
}

// ---- CONTEXTE UPSELL ----
// Capture les paramètres URL transmis par la pop-up ZeBestCake
// et les persiste en sessionStorage pour le tunnel de commande.

function captureUpsellContext() {
    const params      = new URLSearchParams(window.location.search);
    const source      = params.get('source');
    const cakeOrderId = params.get('cakeOrderId');

    if (source)      sessionStorage.setItem('custom_source', source);
    if (cakeOrderId) sessionStorage.setItem('custom_cake_id', cakeOrderId);
}

// ---- CATALOGUE ----

async function loadCatalogue() {
    const grid = document.getElementById('plans-grid');
    if (!grid) return;

    try {
        const q  = query(collection(db, 'custom_plans'), where('isActive', '==', true));
        const qs = await getDocs(q);

        if (qs.empty) {
            grid.innerHTML = '<p class="text-pierre">Bientôt de nouveaux produits…</p>';
            return;
        }

        grid.innerHTML = '';
        qs.forEach(docSnap => {
            const plan = { id: docSnap.id, ...docSnap.data() };
            grid.appendChild(renderPlanCard(plan));
        });
    } catch (err) {
        console.error('Erreur chargement catalogue :', err);
        grid.innerHTML = '<p class="text-pierre">Erreur de chargement. Veuillez réessayer.</p>';
    }
}

function renderPlanCard(plan) {
    const article  = document.createElement('article');
    article.className = 'plan-card';

    const imageUrl = plan.image || '../assets/images/gateau.jpg';
    const price    = typeof plan.basePrice === 'number'
        ? `À partir de ${plan.basePrice.toFixed(2)} €`
        : '';

    article.innerHTML = `
        <a href="plan.html?id=${plan.id}">
            <div class="plan-image">
                <img src="${imageUrl}" alt="${plan.title}" loading="lazy">
            </div>
            <div class="plan-info">
                <p class="plan-category">${plan.category || ''}</p>
                <h3 class="plan-name">${plan.title}</h3>
                <p class="plan-price">${price}</p>
            </div>
        </a>
    `;

    return article;
}
