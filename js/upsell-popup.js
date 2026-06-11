// js/upsell-popup.js
// Popup upsell ZeBest Custom après commande gâteau.
// Bottom-sheet mobile / overlay desktop. localStorage deduplication + A/B test.

import { db } from './firebase-config.js';
import {
    collection, query, where, orderBy, limit, getDocs, doc, getDoc
} from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js';

const CUSTOM_DOMAIN = 'https://zebestcustom.netlify.app';
const SEEN_KEY    = 'zebest_upsell_last_order'; // stocke l'ID de la dernière commande vue
const VARIANT_KEY = 'zebest_upsell_variant';

export async function showUpsellModal(cakeOrderId) {
    // Vérifier si la popup est activée
    try {
        const settingsSnap = await getDoc(doc(db, 'settings', 'upsell'));
        if (settingsSnap.exists() && settingsSnap.data().enabled === false) return;
    } catch (_) {}

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
            query(collection(db, 'custom_plans'), where('isActive', '==', true), orderBy('sortOrder', 'asc'), limit(1))
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

    // Construction DOM sans innerHTML pour éviter XSS
    const planContainer = document.createElement('div');
    if (plan) {
        planContainer.className = 'upsell-plan';
        if (planImg && planImg.startsWith('https://')) {
            const img = document.createElement('img');
            img.src       = planImg;
            img.alt       = '';
            img.className = 'upsell-plan-img';
            planContainer.appendChild(img);
        }
        const info = document.createElement('div');
        const nameP = document.createElement('p');
        nameP.className   = 'upsell-plan-name';
        nameP.textContent = plan.title;
        info.appendChild(nameP);
        if (typeof plan.basePrice === 'number') {
            const priceP = document.createElement('p');
            priceP.className   = 'upsell-plan-price';
            priceP.textContent = `à partir de ${plan.basePrice.toFixed(2)} €`;
            info.appendChild(priceP);
        }
        planContainer.appendChild(info);
    } else {
        planContainer.className   = 'upsell-plan-name';
        planContainer.textContent = 'Porte-clés, bijoux, figurines — personnalisés à votre image.';
    }

    const overlay = document.createElement('div');
    overlay.id = 'upsell-overlay';

    const sheet = document.createElement('div');
    sheet.id = 'upsell-sheet';
    sheet.setAttribute('role', 'dialog');
    sheet.setAttribute('aria-modal', 'true');
    sheet.setAttribute('aria-label', 'ZeBest Custom');

    const closeBtn = document.createElement('button');
    closeBtn.id = 'upsell-close';
    closeBtn.setAttribute('aria-label', 'Fermer');
    closeBtn.textContent = '×';

    const eyebrow = document.createElement('p');
    eyebrow.className   = 'upsell-eyebrow';
    eyebrow.textContent = 'ZeBest Custom';

    const headlineEl = document.createElement('h2');
    headlineEl.className   = 'upsell-headline';
    headlineEl.textContent = variant === 'A' ? 'Faites durer le plaisir…' : 'Un souvenir unique pour vos invités';

    const ctaLink = document.createElement('a');
    ctaLink.href      = ctaUrl;
    ctaLink.className = 'upsell-cta';
    ctaLink.id        = 'upsell-cta-link';
    ctaLink.textContent = 'Découvrir ZeBest Custom';

    const dismissBtn = document.createElement('button');
    dismissBtn.className   = 'upsell-dismiss';
    dismissBtn.id          = 'upsell-dismiss';
    dismissBtn.textContent = 'Non merci, peut-être plus tard';

    sheet.appendChild(closeBtn);
    sheet.appendChild(eyebrow);
    sheet.appendChild(headlineEl);
    sheet.appendChild(planContainer);
    sheet.appendChild(ctaLink);
    sheet.appendChild(dismissBtn);
    overlay.appendChild(sheet);

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

        // Remplace le contenu par l'écran de confirmation (DOM sans innerHTML)
        const sheetEl = document.getElementById('upsell-sheet');
        sheetEl.innerHTML = '';

        const eyebrow2 = document.createElement('p');
        eyebrow2.className   = 'upsell-eyebrow';
        eyebrow2.textContent = 'Commande confirmée';

        const title2 = document.createElement('h2');
        title2.className   = 'upsell-headline';
        title2.style.fontSize = '1.15rem';
        title2.textContent = 'Votre commande est bien enregistrée !';

        const desc2 = document.createElement('p');
        desc2.style.cssText = 'font-size:0.85rem; color:var(--gris-txt); margin-bottom:1.25rem; line-height:1.65;';
        desc2.textContent = 'Vous allez maintenant être redirigé vers ZeBest Custom pour personnaliser vos cadeaux. Notez votre numéro de commande gâteau pour suivre votre livraison.';

        const refBox = document.createElement('div');
        refBox.style.cssText = 'background:var(--gris-sep); padding:0.9rem 1rem; margin-bottom:1.25rem; display:flex; align-items:center; justify-content:space-between; gap:1rem;';

        const refSpan = document.createElement('span');
        refSpan.style.cssText = 'font-family:monospace; font-size:0.8rem; word-break:break-all; color:var(--noir);';
        refSpan.textContent = cakeOrderId; // textContent — pas d'injection possible

        const copyBtn = document.createElement('button');
        copyBtn.style.cssText = 'background:none; border:1px solid var(--noir); font-size:0.7rem; padding:0.3rem 0.65rem; cursor:pointer; white-space:nowrap; font-family:inherit; flex-shrink:0;';
        copyBtn.textContent = 'Copier';
        copyBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(cakeOrderId).then(() => {
                copyBtn.textContent = 'Copié !';
            });
        });

        const ctaLink2 = document.createElement('a');
        ctaLink2.href      = ctaUrl;
        ctaLink2.className = 'upsell-cta';
        ctaLink2.textContent = 'Continuer vers ZeBest Custom';

        refBox.appendChild(refSpan);
        refBox.appendChild(copyBtn);
        sheetEl.appendChild(eyebrow2);
        sheetEl.appendChild(title2);
        sheetEl.appendChild(desc2);
        sheetEl.appendChild(refBox);
        sheetEl.appendChild(ctaLink2);
    });
}
