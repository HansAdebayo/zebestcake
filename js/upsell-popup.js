// js/upsell-popup.js
// Popup upsell ZeBest Custom après commande gâteau.
// Bottom-sheet mobile / overlay desktop. localStorage deduplication + A/B test.

import { db } from './firebase-config.js';
import {
    collection, query, where, limit, getDocs
} from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js';

const CUSTOM_DOMAIN = 'https://zebestcustom.netlify.app';
const SEEN_KEY    = 'zebest_upsell_last_order'; // stocke l'ID de la dernière commande vue
const VARIANT_KEY = 'zebest_upsell_variant';

export async function showUpsellModal(cakeOrderId) {
    // Deduplication — une seule popup par commande
    if (localStorage.getItem(SEEN_KEY) === cakeOrderId) return;

    // A/B variant
    let variant = localStorage.getItem(VARIANT_KEY);
    if (!variant) {
        variant = Math.random() < 0.5 ? 'A' : 'B';
        localStorage.setItem(VARIANT_KEY, variant);
    }

    // Analytics
    try {
        if (window.gtag) window.gtag('event', 'upsell_shown', { variant, cake_order_id: cakeOrderId });
    } catch (_) {}

    // Fetch un plan actif mis en avant
    let plan = null;
    try {
        const snap = await getDocs(
            query(collection(db, 'custom_plans'), where('isActive', '==', true), limit(1))
        );
        if (!snap.empty) plan = { id: snap.docs[0].id, ...snap.docs[0].data() };
    } catch (_) {}

    const ctaUrl = `${CUSTOM_DOMAIN}/index.html?source=upsell&cakeOrderId=${encodeURIComponent(cakeOrderId)}`;

    const headline = variant === 'A'
        ? 'Faites durer le plaisir&hellip;'
        : 'Un souvenir unique pour vos invités';

    const planImg = plan
        ? (Array.isArray(plan.images) && plan.images[0]) ? plan.images[0] : (plan.image || '')
        : '';

    const planHtml = plan
        ? `<div class="upsell-plan">
            ${planImg ? `<img src="${planImg}" alt="${plan.title}" class="upsell-plan-img">` : ''}
            <div>
                <p class="upsell-plan-name">${plan.title}</p>
                ${typeof plan.basePrice === 'number'
                    ? `<p class="upsell-plan-price">à partir de ${plan.basePrice.toFixed(2)} €</p>`
                    : ''}
            </div>
           </div>`
        : `<p class="upsell-plan-name">Porte-clés, bijoux, figurines — personnalisés à votre image.</p>`;

    const overlay = document.createElement('div');
    overlay.id = 'upsell-overlay';
    overlay.innerHTML = `
        <div id="upsell-sheet" role="dialog" aria-modal="true" aria-label="ZeBest Custom">
            <button id="upsell-close" aria-label="Fermer">&times;</button>
            <p class="upsell-eyebrow">ZeBest Custom</p>
            <h2 class="upsell-headline">${headline}</h2>
            ${planHtml}
            <a href="${ctaUrl}" class="upsell-cta" id="upsell-cta-link">Découvrir ZeBest Custom</a>
            <button class="upsell-dismiss" id="upsell-dismiss">Non merci, peut-être plus tard</button>
        </div>
    `;

    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';

    requestAnimationFrame(() => {
        overlay.classList.add('visible');
        document.getElementById('upsell-sheet').classList.add('visible');
        // Marquer comme vu seulement une fois affiché
        localStorage.setItem(SEEN_KEY, cakeOrderId);
    });

    function close() {
        overlay.classList.remove('visible');
        document.getElementById('upsell-sheet').classList.remove('visible');
        setTimeout(() => {
            overlay.remove();
            document.body.style.overflow = '';
        }, 300);
        try {
            if (window.gtag) window.gtag('event', 'upsell_dismissed', { variant });
        } catch (_) {}
    }

    document.getElementById('upsell-close').addEventListener('click', close);
    document.getElementById('upsell-dismiss').addEventListener('click', close);
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });

    document.getElementById('upsell-cta-link').addEventListener('click', (e) => {
        e.preventDefault();
        try {
            if (window.gtag) window.gtag('event', 'upsell_clicked', { variant, cake_order_id: cakeOrderId });
        } catch (_) {}

        // Remplace le contenu par l'écran de confirmation
        const sheet = document.getElementById('upsell-sheet');
        sheet.innerHTML = `
            <p class="upsell-eyebrow">Commande confirmée</p>
            <h2 class="upsell-headline" style="font-size:1.15rem;">Votre commande est bien enregistrée&nbsp;!</h2>
            <p style="font-size:0.85rem; color:var(--gris-txt); margin-bottom:1.25rem; line-height:1.65;">
                Vous allez maintenant être redirigé vers <strong>ZeBest Custom</strong> pour personnaliser vos cadeaux. Notez votre numéro de commande gâteau pour suivre votre livraison.
            </p>

            <div style="background:var(--gris-sep); padding:0.9rem 1rem; margin-bottom:1.25rem; display:flex; align-items:center; justify-content:space-between; gap:1rem;">
                <span style="font-family:monospace; font-size:0.8rem; word-break:break-all; color:var(--noir);">${cakeOrderId}</span>
                <button id="upsell-copy-btn" style="background:none; border:1px solid var(--noir); font-size:0.7rem; padding:0.3rem 0.65rem; cursor:pointer; white-space:nowrap; font-family:inherit; flex-shrink:0;">
                    Copier
                </button>
            </div>

            <a href="${ctaUrl}" class="upsell-cta">Continuer vers ZeBest Custom</a>
        `;

        document.getElementById('upsell-copy-btn').addEventListener('click', () => {
            navigator.clipboard.writeText(cakeOrderId).then(() => {
                document.getElementById('upsell-copy-btn').textContent = 'Copié !';
            });
        });
    });
}
