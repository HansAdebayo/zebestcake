import { db, auth } from '../../../js/firebase-config.js';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js';

// --- Auth Security ---
onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = '../../login.html';
    } else {
        loadOrders();
    }
});

function loadOrders() {
    const ordersList = document.getElementById('orders-list');
    const q = query(collection(db, "custom_orders"));

    onSnapshot(q, (snapshot) => {
        ordersList.innerHTML = '';
        
        if (snapshot.empty) {
            ordersList.innerHTML = '<tr><td colspan="6" style="padding: 40px; text-align: center; color: var(--pierre);">Aucune commande pour le moment.</td></tr>';
            return;
        }

        snapshot.forEach((doc) => {
            const order = { id: doc.id, ...doc.data() };
            renderOrderRow(order, ordersList);
        });
    });
}

function renderOrderRow(order, container) {
    const tr = document.createElement('tr');
    tr.style.borderBottom = '1px solid var(--ligne)';
    
    const date = order.createdAt ? order.createdAt.toDate().toLocaleDateString('fr-FR') : '-';
    
    // Products summary
    const itemsSummary = order.items.map(item => {
        const opts = Object.entries(item.options).map(([k,v]) => `${k}:${v}`).join(', ');
        return `<div><strong>${item.title}</strong> (${opts})</div>`;
    }).join('');

    // Source display
    const sourceBadge = order.source === 'upsell' 
        ? `<span style="background: var(--terracotta); color: white; padding: 2px 8px; font-size: 10px; text-transform: uppercase;">Upsell</span><br><small>Gâteau: #${order.cakeOrderId}</small>`
        : `<span style="background: var(--pierre); color: white; padding: 2px 8px; font-size: 10px; text-transform: uppercase;">Direct</span>`;

    tr.innerHTML = `
        <td style="padding: 15px;">${date}</td>
        <td style="padding: 15px;">
            <strong>${order.customerInfo.firstName} ${order.customerInfo.lastName}</strong><br>
            <small>${order.customerInfo.phone}</small><br>
            <small>${order.customerInfo.email}</small>
        </td>
        <td style="padding: 15px; font-size: 13px;">${itemsSummary}</td>
        <td style="padding: 15px; text-align: center;">${sourceBadge}</td>
        <td style="padding: 15px;">
            <select class="status-select" data-id="${order.id}" style="padding: 5px; font-size: 12px;">
                <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>En attente</option>
                <option value="confirmed" ${order.status === 'confirmed' ? 'selected' : ''}>Confirmé</option>
                <option value="shipped" ${order.status === 'shipped' ? 'selected' : ''}>Expédié</option>
                <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Annulé</option>
            </select>
        </td>
        <td style="padding: 15px; text-align: right;">
            <button class="btn-danger btn-sm delete-btn" data-id="${order.id}">Supprimer</button>
        </td>
    `;

    tr.querySelector('.status-select').onchange = (e) => updateStatus(order.id, e.target.value);
    tr.querySelector('.delete-btn').onclick = () => deleteOrder(order.id);

    container.appendChild(tr);
}

async function updateStatus(id, status) {
    try {
        await updateDoc(doc(db, "custom_orders", id), { status: status });
    } catch (error) {
        console.error("Erreur statut :", error);
    }
}

async function deleteOrder(id) {
    if (confirm("Supprimer définitivement cette commande ?")) {
        try {
            await deleteDoc(doc(db, "custom_orders", id));
        } catch (error) {
            console.error("Erreur suppression :", error);
        }
    }
}
