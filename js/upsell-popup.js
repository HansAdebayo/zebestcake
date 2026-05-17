// js/upsell-popup.js
// Popup upsell ZeBest Custom après commande gâteau.
// Bottom-sheet mobile / overlay desktop. localStorage deduplication + A/B test.

import { db } from './firebase-config.js';
import {
    collection, query, where, limit, getDocs
} from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js';

// En dev/subfolder : chemin relatif. Remplacer par l'URL absolue au déploiement séparé.
const CUSTOM_DOMAIN = '/custom';
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

    const planHtml = plan
        ? `<div class="upsell-plan">
            ${plan.image ? `<img src="${plan.image}" alt="${plan.title}" class="upsell-plan-img">` : ''}
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
    localStorage.setItem(SEEN_KEY, cakeOrderId);

    requestAnimationFrame(() => {
        overlay.classList.add('visible');
        document.getElementById('upsell-sheet').classList.add('visible');
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

    document.getElementById('upsell-cta-link').addEventListener('click', () => {
        try {
            if (window.gtag) window.gtag('event', 'upsell_clicked', { variant, cake_order_id: cakeOrderId });
        } catch (_) {}
    });
}
