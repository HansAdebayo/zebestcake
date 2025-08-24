import { db } from './firebase-config.js';
import { doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js';

document.addEventListener('DOMContentLoaded', () => {
    const invoiceIdSpan = document.getElementById('invoice-id');
    const invoiceDateSpan = document.getElementById('invoice-date');
    const customerNameP = document.getElementById('customer-name');
    const customerEmailP = document.getElementById('customer-email');
    const customerPhoneP = document.getElementById('customer-phone');
    const itemsTableBody = document.getElementById('invoice-items-body');
    const subtotalTd = document.getElementById('summary-subtotal');
    const deliveryTd = document.getElementById('summary-delivery');
    const totalTd = document.getElementById('summary-total');

    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('orderId');

    if (orderId) {
        loadInvoiceData(orderId);
    } else {
        displayError('Aucun identifiant de commande fourni.');
    }

    async function loadInvoiceData(id) {
        try {
            const orderRef = doc(db, 'orders', id);
            const orderSnap = await getDoc(orderRef);

            if (orderSnap.exists()) {
                const orderData = orderSnap.data();
                populateInvoice(id, orderData);
            } else {
                displayError(`La commande avec l'identifiant ${id} n'a pas été trouvée.`);
            }
        } catch (error) {
            console.error('Erreur lors du chargement de la facture:', error);
            displayError('Une erreur est survenue lors du chargement des données de la facture.');
        }
    }

    function populateInvoice(id, order) {
        // --- Details --- //
        invoiceIdSpan.textContent = id;
        invoiceDateSpan.textContent = new Date().toLocaleDateString('fr-FR');

        // --- Customer --- //
        if (order.customerInfo) {
            customerNameP.textContent = `${order.customerInfo.firstName} ${order.customerInfo.lastName}`;
            customerEmailP.textContent = order.customerInfo.email;
            customerPhoneP.textContent = order.customerInfo.phone;
        }

        // --- Items --- //
        itemsTableBody.innerHTML = ''; // Clear any placeholder
        if (order.product) {
            const item = order.product;
            const itemRow = document.createElement('tr');
            const totalPriceForItem = order.pricing.basePrice; // Assuming one item for now

            itemRow.innerHTML = `
                <td>${item.name} - ${item.size}</td>
                <td>1</td>
                <td>${order.pricing.basePrice.toFixed(2)} €</td>
                <td>${totalPriceForItem.toFixed(2)} €</td>
            `;
            itemsTableBody.appendChild(itemRow);
        }

        // --- Summary --- //
        if (order.pricing) {
            subtotalTd.textContent = `${order.pricing.basePrice.toFixed(2)} €`;
            deliveryTd.textContent = `${order.pricing.deliveryPrice.toFixed(2)} €`;
            totalTd.textContent = `${order.pricing.totalPrice.toFixed(2)} €`;
        }
    }

    function displayError(message) {
        const container = document.querySelector('.invoice-container');
        if (container) {
            container.innerHTML = `<p style="color: red; text-align: center;">${message}</p>`;
        }
    }
});
