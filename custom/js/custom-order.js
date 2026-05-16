// custom/js/custom-order.js
// Gestion du panier (commander.html) et de la confirmation (confirmation.html).
// Schéma custom_orders :
//   items[]      : { planId, planName, selectedOptions, unitPrice }
//   totalPrice   : somme des unitPrice
//   source       : 'upsell' | 'direct'
//   linkedCakeOrderId : string | null
//   customer     : { firstName, lastName, email, phone }
//   status       : 'non-traitée'
//   createdAt    : Timestamp

import { db } from './custom-firebase.js';
import { collection, addDoc, doc, getDoc, Timestamp }
    from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js';

const CART_KEY = 'zebest_custom_cart';

document.addEventListener('DOMContentLoaded', () => {
    initNav();

    const page = document.body.dataset.page;

    if (document.getElementById('checkout-form')) {
        // Page commander.html
        renderCart();
        tryPrefill();
        document.getElementById('checkout-form').addEventListener('submit', handleCheckout);
    }

    if (document.getElementById('order-ref')) {
        // Page confirmation.html
        showOrderRef();
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

// ---- RENDU DU PANIER ----

function renderCart() {
    const cart         = getCart();
    const emptyEl      = document.getElementById('cart-empty');
    const filledEl     = document.getElementById('cart-filled');
    const listEl       = document.getElementById('cart-items-list');
    const summaryEl    = document.getElementById('summary-lines');
    const totalEl      = document.getElementById('cart-total');
    const cartCountEl  = document.getElementById('cart-count');

    // Badge compteur
    if (cartCountEl) {
        cartCountEl.textContent = cart.length;
        cartCountEl.dataset.count = cart.length;
    }

    if (cart.length === 0) {
        emptyEl.classList.remove('hidden');
        filledEl.classList.add('hidden');
        return;
    }

    emptyEl.classList.add('hidden');
    filledEl.classList.remove('hidden');

    // Items
    listEl.innerHTML = '';
    summaryEl.innerHTML = '';
    let total = 0;

    cart.forEach((item, index) => {
        total += item.unitPrice;

        // Options formatées
        const optionsText = Object.entries(item.selectedOptions || {})
            .map(([k, v]) => `${k} : ${v}`)
            .join(' · ');

        // Li item
        const li = document.createElement('li');
        li.className = 'cart-item';
        li.innerHTML = `
            <div class="cart-item-image">
                <img src="${item.image || '../assets/images/gateau.jpg'}"
                     alt="${item.planName}" loading="lazy">
            </div>
            <div class="cart-item-info">
                <p class="cart-item-name">${item.planName}</p>
                <p class="cart-item-options">${optionsText}</p>
                ${item.notes ? `<p class="cart-item-options" style="font-style:italic">${item.notes}</p>` : ''}
                <p class="cart-item-price">${item.unitPrice.toFixed(2)} €</p>
                <button class="cart-item-remove" data-index="${index}"
                        aria-label="Supprimer ${item.planName}">
                    Supprimer
                </button>
            </div>
        `;
        listEl.appendChild(li);

        // Ligne récapitulatif
        const line = document.createElement('div');
        line.className = 'summary-line';
        line.innerHTML = `
            <span>${item.planName}</span>
            <span>${item.unitPrice.toFixed(2)} €</span>
        `;
        summaryEl.appendChild(line);
    });

    totalEl.textContent = `${total.toFixed(2)} €`;

    // Suppression
    listEl.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-index]');
        if (btn) removeItem(parseInt(btn.dataset.index, 10));
    });
}

function removeItem(index) {
    const cart = getCart();
    cart.splice(index, 1);
    saveCart(cart);
    renderCart();
}

// ---- PRÉ-REMPLISSAGE DEPUIS COMMANDE GÂTEAU ----
// Si le client vient de l'upsell, on récupère ses infos depuis Firestore
// pour lui éviter de les ressaisir.

async function tryPrefill() {
    const cakeId = sessionStorage.getItem('custom_cake_id');
    if (!cakeId) return;

    try {
        const snap = await getDoc(doc(db, 'orders', cakeId));
        if (!snap.exists()) return;

        const data = snap.data();
        // Compatibilité avec les deux structures possibles de la collection orders
        const info = data.customerInfo || data.customer || data;

        setValue('first-name', info.firstName  || info.first_name || '');
        setValue('last-name',  info.lastName   || info.last_name  || '');
        setValue('email',      info.email       || '');
        setValue('phone',      info.phone       || '');
    } catch (err) {
        // Silencieux — le pré-remplissage est optionnel
        console.warn('Pré-remplissage impossible :', err);
    }
}

function setValue(id, value) {
    const el = document.getElementById(id);
    if (el && value) el.value = value;
}

// ---- SOUMISSION ----

async function handleCheckout(e) {
    e.preventDefault();

    const cart = getCart();
    if (cart.length === 0) return;

    const submitBtn  = document.getElementById('submit-btn');
    const feedback   = document.getElementById('checkout-feedback');

    submitBtn.disabled    = true;
    submitBtn.textContent = 'Envoi en cours…';
    feedback.className    = 'feedback loading';
    feedback.textContent  = 'Enregistrement de votre commande…';
    feedback.classList.remove('hidden');

    const source      = sessionStorage.getItem('custom_source')  || 'direct';
    const cakeOrderId = sessionStorage.getItem('custom_cake_id') || null;

    // Nettoyage des items pour correspondre au schéma Firestore
    // (on retire `image` et `addedAt` qui ne sont utiles que côté client)
    const items = cart.map(item => ({
        planId:          item.planId,
        planName:        item.planName,
        selectedOptions: item.selectedOptions,
        notes:           item.notes || '',
        unitPrice:       item.unitPrice
    }));

    const orderData = {
        items,
        totalPrice:       items.reduce((sum, i) => sum + i.unitPrice, 0),
        source,
        linkedCakeOrderId: cakeOrderId,
        customer: {
            firstName: document.getElementById('first-name').value.trim(),
            lastName:  document.getElementById('last-name').value.trim(),
            email:     document.getElementById('email').value.trim(),
            phone:     document.getElementById('phone').value.trim()
        },
        status:    'non-traitée',
        createdAt: Timestamp.now()
    };

    try {
        const ref = await addDoc(collection(db, 'custom_orders'), orderData);

        // Nettoyage
        localStorage.removeItem(CART_KEY);
        sessionStorage.removeItem('custom_source');
        sessionStorage.removeItem('custom_cake_id');

        // On transmet l'ID à la page de confirmation via sessionStorage
        sessionStorage.setItem('custom_last_order_id', ref.id);

        window.location.href = 'confirmation.html';

    } catch (err) {
        console.error('Erreur commande :', err);
        feedback.className   = 'feedback error';
        feedback.textContent = 'Une erreur est survenue. Veuillez réessayer.';
        submitBtn.disabled    = false;
        submitBtn.textContent = 'Envoyer ma demande';
    }
}

// ---- PAGE CONFIRMATION ----

function showOrderRef() {
    const orderId = sessionStorage.getItem('custom_last_order_id');
    const refEl   = document.getElementById('order-ref');
    if (refEl && orderId) {
        refEl.textContent = orderId;
        sessionStorage.removeItem('custom_last_order_id');
    }
}

// ---- UTILS ----

function getCart()       { return JSON.parse(localStorage.getItem(CART_KEY) || '[]'); }
function saveCart(cart)  { localStorage.setItem(CART_KEY, JSON.stringify(cart)); }
