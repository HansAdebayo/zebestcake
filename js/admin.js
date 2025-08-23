import { auth, db } from './firebase-config.js';
import { onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js';
import { collection, getDocs, doc, updateDoc } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js';

let allOrders = [];

document.addEventListener('DOMContentLoaded', () => {
    const ordersTbody = document.getElementById('orders-tbody');
    const logoutBtn = document.getElementById('logout-btn');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const modal = document.getElementById('order-modal');
    const closeModalBtn = document.querySelector('.close-button');
    const printTicketBtn = document.getElementById('print-ticket-btn');

    // --- Authentication Check ---
    onAuthStateChanged(auth, (user) => {
        if (user) {
            // User is signed in, load the dashboard
            loadOrders();
        } else {
            // User is signed out, redirect to login
            window.location.href = 'login.html';
        }
    });

    // --- Logout ---
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            signOut(auth).then(() => {
                console.log('User signed out');
                window.location.href = 'index.html';
            }).catch((error) => {
                console.error('Sign out error:', error);
            });
        });
    }

    // --- Filtering ---
    if (filterBtns) {
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const status = btn.dataset.status;
                displayOrders(status);
            });
        });
    }
    
    // --- Modal ---
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });
    }

    window.addEventListener('click', (event) => {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    });

    // --- Load Orders ---
    async function loadOrders() {
        try {
            const querySnapshot = await getDocs(collection(db, "orders"));
            allOrders = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            displayOrders('all');
        } catch (error) {
            console.error("Error loading orders: ", error);
        }
    }

    // --- Display Orders ---
    function displayOrders(statusFilter = 'all') {
        if (!ordersTbody) return;
        ordersTbody.innerHTML = '';

        const filteredOrders = (statusFilter === 'all')
            ? allOrders
            : allOrders.filter(order => order.status === statusFilter);

        filteredOrders.forEach(order => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${order.id}</td>
                <td>${order.customerInfo ? order.customerInfo.firstName : 'N/A'} ${order.customerInfo ? order.customerInfo.lastName : 'N/A'}</td>
                <td>${order.product ? order.product.name : 'N/A'}</td>
                <td>${order.delivery && order.delivery.date ? order.delivery.date.toDate().toLocaleDateString() : 'N/A'}</td>
                <td class="status-cell" data-order-id="${order.id}">
                    <span class="current-status">${order.status}</span>
                    <button class="edit-status-btn">Modifier</button>
                </td>
                <td>
                    <button class="view-details-btn" data-order-id="${order.id}">Voir</button>
                </td>
            `;
            ordersTbody.appendChild(tr);
        });

        // Add event listeners for status change and view details
        document.querySelectorAll('.edit-status-btn').forEach(btn => {
            btn.addEventListener('click', enterEditMode);
        });
        document.querySelectorAll('.view-details-btn').forEach(btn => {
            btn.addEventListener('click', showOrderDetails);
        });
    }

    // --- Enter Edit Mode ---
    function enterEditMode(event) {
        const statusCell = event.target.closest('.status-cell');
        const orderId = statusCell.dataset.orderId;
        const currentStatus = statusCell.querySelector('.current-status').textContent;

        statusCell.innerHTML = `
            <select class="status-select" data-order-id="${orderId}">
                <option value="Non traitée" ${currentStatus === 'Non traitée' ? 'selected' : ''}>Non traitée</option>
                <option value="En cours" ${currentStatus === 'En cours' ? 'selected' : ''}>En cours</option>
                <option value="Terminée" ${currentStatus === 'Terminée' ? 'selected' : ''}>Terminée</option>
            </select>
            <button class="validate-status-btn">Valider</button>
            <button class="cancel-status-btn">Annuler</button>
        `;

        statusCell.querySelector('.validate-status-btn').addEventListener('click', updateOrderStatus);
        statusCell.querySelector('.cancel-status-btn').addEventListener('click', cancelEditMode);
    }

    // --- Cancel Edit Mode ---
    function cancelEditMode(event) {
        const statusCell = event.target.closest('.status-cell');
        const orderId = statusCell.dataset.orderId;
        const order = allOrders.find(o => o.id === orderId);

        statusCell.innerHTML = `
            <span class="current-status">${order.status}</span>
            <button class="edit-status-btn">Modifier</button>
        `;
        statusCell.querySelector('.edit-status-btn').addEventListener('click', enterEditMode);
    }

    // --- Update Order Status ---
    async function updateOrderStatus(event) {
        const statusCell = event.target.closest('.status-cell');
        const orderId = statusCell.dataset.orderId;
        const newStatus = statusCell.querySelector('.status-select').value;

        try {
            const orderRef = doc(db, "orders", orderId);
            await updateDoc(orderRef, {
                status: newStatus
            });
            // Update local data to avoid reloading from Firestore
            const orderToUpdate = allOrders.find(order => order.id === orderId);
            if (orderToUpdate) {
                orderToUpdate.status = newStatus;
            }
            console.log(`Order ${orderId} status updated to ${newStatus}`);
            showNotification(`Statut de la commande ${orderId} mis à jour à "${newStatus}" !`, 'success');
            
            // Revert to display mode after successful update
            statusCell.innerHTML = `
                <span class="current-status">${newStatus}</span>
                <button class="edit-status-btn">Modifier</button>
            `;
            statusCell.querySelector('.edit-status-btn').addEventListener('click', enterEditMode);

        } catch (error) {
            console.error("Error updating order status: ", error);
            showNotification(`Erreur lors de la mise à jour du statut de la commande ${orderId}.`, 'error');
            // Revert to display mode on error
            const order = allOrders.find(o => o.id === orderId);
            statusCell.innerHTML = `
                <span class="current-status">${order.status}</span>
                <button class="edit-status-btn">Modifier</button>
            `;
            statusCell.querySelector('.edit-status-btn').addEventListener('click', enterEditMode);
        }
    }

    // --- Show Order Details ---
    function showOrderDetails(event) {
        const orderId = event.target.dataset.orderId;
        const order = allOrders.find(o => o.id === orderId);
        const modalDetails = document.getElementById('modal-order-details');

        if (order && modalDetails) {
            modalDetails.innerHTML = `
                <p><strong>ID Commande:</strong> ${order.id}</p>
                <p><strong>Client:</strong> ${order.customerInfo ? order.customerInfo.firstName : 'N/A'} ${order.customerInfo ? order.customerInfo.lastName : 'N/A'}</p>
                <p><strong>Email:</strong> ${order.customerInfo ? order.customerInfo.email : 'N/A'}</p>
                <p><strong>Téléphone:</strong> ${order.customerInfo ? order.customerInfo.phone : 'N/A'}</p>
                <hr>
                <p><strong>Gâteau:</strong> ${order.product ? order.product.name : 'N/A'} (${order.product ? order.product.size : 'N/A'})</p>
                <p><strong>Prix de base:</strong> ${order.product ? order.product.basePrice.toFixed(2) : 'N/A'} €</p>
                <p><strong>Demandes spéciales:</strong> ${order.customization ? order.customization.specialRequests : 'Aucune'}</p>
                <hr>
                <p><strong>Livraison:</strong> ${order.delivery.type}</p>
                <p><strong>Date:</strong> ${order.delivery.date.toDate().toLocaleDateString()}</p>
                <p><strong>Prix livraison:</strong> ${order.pricing.deliveryPrice.toFixed(2)} €</p>
                <hr>
                <p><strong>Total:</strong> ${order.pricing.totalPrice.toFixed(2)} €</p>
            `;
            modal.style.display = 'block';

            if (printTicketBtn) {
                printTicketBtn.onclick = () => {
                    printTicket(modalDetails.innerHTML);
                };
            }
        }
    }

    // --- Print Ticket ---
    function printTicket(content) {
        const printWindow = window.open('', '', 'height=600,width=800');
        printWindow.document.write('<html><head><title>Ticket de commande</title>');
        printWindow.document.write('<link rel="stylesheet" href="css/style.css">'); // Optional: for styling
        printWindow.document.write('</head><body>');
        printWindow.document.write(content);
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        printWindow.close();
    }

    // --- Notification System ---
    function showNotification(message, type) {
        const notificationContainer = document.getElementById('notification-container');
        if (!notificationContainer) {
            console.error('Notification container not found!');
            return;
        }

        const notification = document.createElement('div');
        notification.classList.add('notification', type);
        notification.textContent = message;

        notificationContainer.appendChild(notification);

        // Automatically remove the notification after a few seconds
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
});
