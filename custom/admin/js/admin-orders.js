// custom/admin/js/admin-orders.js
// Gestion des commandes custom : liste temps réel, filtres, détail, statut.
// Protégé par auth Firebase.

import { db, auth } from '../../js/custom-firebase.js';
import {
    collection, query, orderBy, onSnapshot,
    doc, updateDoc, deleteDoc, getDoc, setDoc
} from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js';
import { onAuthStateChanged, signOut }
    from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js';

const STATUTS = ['non-traitée', 'en-cours', 'terminée', 'annulée'];

let allOrders   = [];
let activeFilter = 'all';

// ---- GUARD AUTH ----
onAuthStateChanged(auth, user => {
    if (!user) {
        window.location.href = 'login.html';
    } else {
        init();
    }
});

// ---- UPSELL TOGGLE ----
const UPSELL_DOC = doc(db, 'settings', 'upsell');

async function initUpsellToggle() {
    const btn = document.getElementById('upsell-toggle-btn');
    if (!btn) return;

    // Lire l'état actuel
    try {
        const snap = await getDoc(UPSELL_DOC);
        const enabled = snap.exists() ? snap.data().enabled !== false : true;
        updateToggleBtn(btn, enabled);
    } catch (err) {
        btn.textContent = 'Erreur';
    }

    btn.addEventListener('click', async () => {
        btn.disabled = true;
        try {
            const snap = await getDoc(UPSELL_DOC);
            const current = snap.exists() ? snap.data().enabled !== false : true;
            await setDoc(UPSELL_DOC, { enabled: !current });
            updateToggleBtn(btn, !current);
        } catch (err) {
            console.error('Toggle upsell :', err);
        }
        btn.disabled = false;
    });
}

function updateToggleBtn(btn, enabled) {
    btn.textContent = enabled ? '✓ Popup upsell active' : '✗ Popup upsell désactivée';
    btn.style.background = enabled ? '#2d7a4f' : '#8b0000';
}

// ---- INIT ----
function init() {
    document.getElementById('logout-btn').addEventListener('click', () => {
        signOut(auth).then(() => window.location.href = 'login.html');
    });

    initUpsellToggle();

    // Filtres
    document.querySelectorAll('.filter-pill').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-pill').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activeFilter = btn.dataset.filter;
            renderOrders();
        });
    });

    // Drawer
    document.getElementById('drawer-close').addEventListener('click', closeDrawer);
    document.getElementById('drawer-overlay').addEventListener('click', closeDrawer);

    loadOrders();
}

// ---- CHARGEMENT EN TEMPS RÉEL ----
function loadOrders() {
    const q = query(collection(db, 'custom_orders'), orderBy('createdAt', 'desc'));

    onSnapshot(q, snapshot => {
        allOrders = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        renderOrders();
    }, err => {
        document.getElementById('orders-list').innerHTML =
            `<tr><td colspan="7" class="table-empty feedback error">Erreur : ${err.message}</td></tr>`;
    });
}

// ---- RENDU TABLEAU ----
function renderOrders() {
    const tbody = document.getElementById('orders-list');
    tbody.innerHTML = '';

    const filtered = activeFilter === 'all'
        ? allOrders
        : allOrders.filter(o => o.status === activeFilter);

    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="table-empty">Aucune commande.</td></tr>';
        return;
    }

    filtered.forEach(order => tbody.appendChild(renderOrderRow(order)));
}

function renderOrderRow(order) {
    const tr = document.createElement('tr');

    const date = order.createdAt
        ? order.createdAt.toDate().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' })
        : '—';

    const customer = order.customer || {};
    const items    = order.items || [];

    const itemsSummary = items.map(i => {
        const opts = Object.entries(i.selectedOptions || {})
            .map(([k, v]) => `${k} : ${v}`)
            .join(' · ');
        return `<div><strong>${i.planName}</strong>${opts ? ` — ${opts}` : ''}</div>`;
    }).join('');

    const sourceClass = order.source === 'upsell' ? 'source-upsell' : 'source-direct';
    const sourceLabel = order.source === 'upsell' ? 'Upsell' : 'Direct';

    const total = typeof order.totalPrice === 'number'
        ? order.totalPrice.toFixed(2) + ' €'
        : '—';

    // Select statut
    const statusOptions = STATUTS.map(s =>
        `<option value="${s}" ${order.status === s ? 'selected' : ''}>${capitalize(s)}</option>`
    ).join('');

    tr.innerHTML = `
        <td>${date}</td>
        <td>
            <strong>${customer.firstName || ''} ${customer.lastName || ''}</strong><br>
            <span style="font-size:0.78rem; color:var(--pierre);">${customer.phone || ''}</span>
        </td>
        <td style="font-size:0.8rem;">${itemsSummary || '—'}</td>
        <td style="font-weight:500; color:var(--terracotta);">${total}</td>
        <td>
            <span class="source-badge ${sourceClass}">${sourceLabel}</span>
            ${order.linkedCakeOrderId
                ? `<br><span style="font-size:0.7rem; color:var(--pierre);">🎂 #${order.linkedCakeOrderId.slice(0, 8)}…</span>`
                : ''}
        </td>
        <td>
            <select class="status-select" data-id="${order.id}">
                ${statusOptions}
            </select>
        </td>
        <td>
            <button class="btn btn-ghost btn-sm detail-btn" data-id="${order.id}">Détail</button>
        </td>
    `;

    tr.querySelector('.status-select').addEventListener('change', function () {
        updateStatus(order.id, this.value);
    });

    tr.querySelector('.detail-btn').addEventListener('click', () => openDrawer(order));

    return tr;
}

// ---- MISE À JOUR STATUT ----
async function updateStatus(id, status) {
    try {
        await updateDoc(doc(db, 'custom_orders', id), { status });
    } catch (err) {
        console.error('Erreur statut :', err);
    }
}

// ---- DRAWER DÉTAIL ----
function openDrawer(order) {
    const body     = document.getElementById('drawer-body');
    const drawer   = document.getElementById('order-drawer');
    const overlay  = document.getElementById('drawer-overlay');
    const customer = order.customer || {};
    const items    = order.items || [];

    const date = order.createdAt
        ? order.createdAt.toDate().toLocaleString('fr-FR')
        : '—';

    const itemsHtml = items.map(item => {
        const opts = Object.entries(item.selectedOptions || {})
            .map(([k, v]) => `<span>${k} : <strong>${v}</strong></span>`)
            .join('<br>');
        return `
            <div class="drawer-item">
                ${item.selectedExample ? `
                    <div class="drawer-example-wrap">
                        <img src="${item.selectedExample}" alt="Photo exemple" class="drawer-example-img" loading="lazy">
                        <p class="drawer-example-label">Photo exemple choisie par le client</p>
                    </div>
                ` : ''}
                <p class="drawer-item-name">${item.planName}</p>
                <p class="drawer-item-opts">${opts || '—'}</p>
                ${item.notes ? `<p class="drawer-item-opts" style="font-style:italic; margin-top:0.35rem;">"${item.notes}"</p>` : ''}
                <p class="drawer-item-price">${item.unitPrice.toFixed(2)} €</p>
            </div>
        `;
    }).join('');

    body.innerHTML = `
        <h2 style="font-size: 1.1rem; margin-bottom: 2rem; margin-top: 0.5rem;">
            Commande <span style="color:var(--pierre); font-size:0.8rem;">#${order.id.slice(0, 10)}…</span>
        </h2>

        <div class="drawer-section">
            <h3>Client</h3>
            <p><strong>${customer.firstName || ''} ${customer.lastName || ''}</strong></p>
            <p style="font-size:0.85rem; color:var(--pierre);">${customer.email || ''}</p>
            <p style="font-size:0.85rem; color:var(--pierre);">${customer.phone || ''}</p>
        </div>

        <div class="drawer-section">
            <h3>Articles (${items.length})</h3>
            ${itemsHtml}
            <p style="font-size:0.9rem; font-weight:500; text-align:right; margin-top:0.75rem;">
                Total : ${typeof order.totalPrice === 'number' ? order.totalPrice.toFixed(2) + ' €' : '—'}
            </p>
        </div>

        <div class="drawer-section">
            <h3>Informations</h3>
            <p style="font-size:0.82rem; color:var(--pierre);">Date : ${date}</p>
            <p style="font-size:0.82rem; color:var(--pierre);">Source : ${order.source || '—'}</p>
            ${order.linkedCakeOrderId
                ? `<p style="font-size:0.82rem; color:var(--pierre);">Commande gâteau liée : #${order.linkedCakeOrderId}</p>`
                : ''}
            <p style="font-size:0.82rem; color:var(--pierre);">Statut : ${order.status || '—'}</p>
        </div>
    `;

    drawer.classList.add('open');
    overlay.classList.remove('hidden');
    drawer.setAttribute('aria-hidden', 'false');
}

function closeDrawer() {
    document.getElementById('order-drawer').classList.remove('open');
    document.getElementById('drawer-overlay').classList.add('hidden');
    document.getElementById('order-drawer').setAttribute('aria-hidden', 'true');
}

// ---- UTILS ----
function capitalize(str) {
    return str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
}
