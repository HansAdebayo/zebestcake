import { auth, db } from './firebase-config.js';
import { onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js';
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js';

let allOrders = [];
let deliveryChart = null;

// Admin emails
const ADMIN_EMAILS = {
    hans: 'hansordenbada@gmail.com',
    malika: 'aboudoumalika@gmail.com'
};

// Helper function to generate a CSS class from a status string
const getStatusClass = (status) => {
    if (!status) return '';
    return 'status-' + status.toLowerCase().replace(/\s+/g, '-');
};

document.addEventListener('DOMContentLoaded', () => {
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const sidebar = document.querySelector('.sidebar');

    if (mobileMenuBtn && sidebar) {
        mobileMenuBtn.addEventListener('click', () => {
            document.body.classList.toggle('sidebar-open');
        });
    }

    const ordersTbody = document.getElementById('orders-tbody');
    const logoutBtn = document.getElementById('logout-btn');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const modal = document.getElementById('order-modal');
    const closeModalBtn = document.querySelector('.close-button');

    // --- Authentication Check ---
    onAuthStateChanged(auth, (user) => {
        if (user) {
            updateAdminStatus(user);
            loadOrders();
        } else {
            window.location.href = 'login.html';
        }
    });

    // --- Update Admin Status Display ---
    function updateAdminStatus(currentUser) {
        const hansStatus = document.getElementById('status-dot-hans');
        const malikaStatus = document.getElementById('status-dot-malika');

        if (!currentUser || !currentUser.email) return;

        // Reset both to offline initially
        if(hansStatus) {
            hansStatus.classList.remove('online');
            hansStatus.classList.add('offline');
        }
        if(malikaStatus) {
            malikaStatus.classList.remove('online');
            malikaStatus.classList.add('offline');
        }

        // Set the current user to online
        if (currentUser.email.toLowerCase() === ADMIN_EMAILS.hans.toLowerCase()) {
            if(hansStatus) {
                hansStatus.classList.add('online');
                hansStatus.classList.remove('offline');
            }
        } else if (currentUser.email.toLowerCase() === ADMIN_EMAILS.malika.toLowerCase()) {
            if(malikaStatus) {
                malikaStatus.classList.add('online');
                malikaStatus.classList.remove('offline');
            }
        }
    }

    // --- Logout ---
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            signOut(auth).then(() => {
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
            modal.classList.remove('is-open');
        });
    }

    window.addEventListener('click', (event) => {
        if (event.target == modal) {
            modal.classList.remove('is-open');
        }
    });

    // --- Load Orders ---
    async function loadOrders() {
        try {
            const querySnapshot = await getDocs(collection(db, "orders"));
            allOrders = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            displayOrders('all');
            displayStats(allOrders);
            displayDeliveryChart(allOrders);
        } catch (error) {
            console.error("Error loading orders: ", error);
        }
    }

    // --- Display Stats ---
    function displayStats(orders) {
        const totalRevenueEl = document.getElementById('stats-total-revenue');
        const totalOrdersEl = document.getElementById('stats-total-orders');
        const completedOrdersEl = document.getElementById('stats-completed-orders');
        const pendingOrdersEl = document.getElementById('stats-pending-orders');
        const deliveryTypesEl = document.getElementById('stats-delivery-types');

        const activeOrders = orders.filter(order => order.status !== 'Annulée');

        const totalRevenue = activeOrders.reduce((sum, order) => sum + (order.pricing?.totalPrice || 0), 0);
        const totalOrders = activeOrders.length;
        const completedOrders = orders.filter(order => order.status === 'Terminée').length;
        const pendingOrders = orders.filter(order => order.status === 'Non traitée' || order.status === 'En cours').length;

        // Corrected delivery type tracking
        const deliveryCounts = {
            'retrait': 0,
            'livraison-centre': 0,
            'livraison-peripherie': 0
        };

        activeOrders.forEach(order => {
            const type = order.delivery?.type;
            if (type && deliveryCounts.hasOwnProperty(type)) {
                deliveryCounts[type]++;
            }
        });

        const deliveryTypesHTML = `
            <div class="delivery-type-item">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
                <span class="delivery-name">Retrait en magasin</span>
                <span class="count">${deliveryCounts['retrait']}</span>
            </div>
            <div class="delivery-type-item">
                 <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><line x1="10" y1="9" x2="8" y2="9"></line></svg>
                <span class="delivery-name">Toulouse Centre</span>
                <span class="count">${deliveryCounts['livraison-centre']}</span>
            </div>
            <div class="delivery-type-item">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 16.5V8.28a2 2 0 0 0-.6-1.42L12 5.4l-1.4 1.46a2 2 0 0 0-.6 1.42V16.5m5.5 0v-1.8a2 2 0 0 0-1-1.72l-1.4-.82a2 2 0 0 1-1-1.72V8.5m-10 8V9.8a2 2 0 0 1 1-1.72l1.4-.82a2 2 0 0 0 1-1.72V4.5"></path><path d="M2 16.5h20"></path></svg>
                <span class="delivery-name">Périphérie</span>
                <span class="count">${deliveryCounts['livraison-peripherie']}</span>
            </div>
        `;

        if(totalRevenueEl) totalRevenueEl.textContent = `${totalRevenue.toFixed(2)} €`;
        if(totalOrdersEl) totalOrdersEl.textContent = totalOrders;
        if(completedOrdersEl) completedOrdersEl.textContent = completedOrders;
        if(pendingOrdersEl) pendingOrdersEl.textContent = pendingOrders;
        if(deliveryTypesEl) deliveryTypesEl.innerHTML = deliveryTypesHTML;
    }

    // --- Display Delivery Chart ---
    function displayDeliveryChart(orders) {
        const activeOrders = orders.filter(order => order.status !== 'Annulée');
        const ctx = document.getElementById('delivery-chart');
        if (!ctx) return;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const deliveryDates = activeOrders
            .filter(order => order.delivery?.date?.toDate() >= today)
            .reduce((acc, order) => {
                const dateStr = order.delivery.date.toDate().toLocaleDateString('fr-FR');
                acc[dateStr] = (acc[dateStr] || 0) + 1;
                return acc;
            }, {});

        const sortedDates = Object.entries(deliveryDates).sort((a, b) => {
            const dateA = new Date(a[0].split('/').reverse().join('-'));
            const dateB = new Date(b[0].split('/').reverse().join('-'));
            return dateA - dateB;
        });

        const labels = sortedDates.map(entry => entry[0]);
        const data = sortedDates.map(entry => entry[1]);

        if (deliveryChart) {
            deliveryChart.destroy();
        }

        deliveryChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Livraisons prévues',
                    data: data,
                    backgroundColor: 'rgba(108, 92, 231, 0.6)',
                    borderColor: 'rgba(108, 92, 231, 1)',
                    borderWidth: 1,
                    borderRadius: 5,
                    barPercentage: 0.6,
                    categoryPercentage: 0.8
                }]
            },
            options: {
                scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    title: { display: true, text: 'Nombre de livraisons prévues par jour' }
                }
            }
        });
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
            const statusClass = getStatusClass(order.status);
            tr.innerHTML = `
                <td>${order.id}</td>
                <td>${order.customerInfo ? order.customerInfo.firstName : 'N/A'} ${order.customerInfo ? order.customerInfo.lastName : 'N/A'}</td>
                <td>${order.product ? order.product.name : 'N/A'}</td>
                <td>${order.delivery && order.delivery.date ? order.delivery.date.toDate().toLocaleDateString() : 'N/A'}</td>
                <td class="status-cell" data-order-id="${order.id}">
                    <span class="current-status ${statusClass}">${order.status}</span>
                    <button class="edit-status-btn">Modifier</button>
                </td>
                <td>
                    <button class="view-details-btn" data-order-id="${order.id}">Voir</button>
                    <a href="facture.html?orderId=${order.id}" target="_blank" class="invoice-btn">Facture</a>
                    <button class="delete-order-btn" data-order-id="${order.id}">Supprimer</button>
                </td>
            `;
            ordersTbody.appendChild(tr);
        });

        document.querySelectorAll('.edit-status-btn').forEach(btn => {
            btn.addEventListener('click', enterEditMode);
        });
        document.querySelectorAll('.view-details-btn').forEach(btn => {
            btn.addEventListener('click', showOrderDetails);
        });
        document.querySelectorAll('.delete-order-btn').forEach(btn => {
            btn.addEventListener('click', deleteOrder);
        });
    }

    // --- Delete Order ---
    async function deleteOrder(event) {
        const orderId = event.target.dataset.orderId;
        if (confirm(`Êtes-vous sûr de vouloir supprimer la commande ${orderId} ? Cette action est irréversible.`)) {
            try {
                const orderRef = doc(db, "orders", orderId);
                await deleteDoc(orderRef);

                allOrders = allOrders.filter(order => order.id !== orderId);
                const activeFilter = document.querySelector('.filter-btn.active').dataset.status;
                displayOrders(activeFilter);
                displayStats(allOrders);
                displayDeliveryChart(allOrders);

                showNotification('Commande supprimée avec succès.', 'success');
            } catch (error) {
                console.error("Error deleting order: ", error);
                showNotification('Erreur lors de la suppression de la commande.', 'error');
            }
        }
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
                <option value="Annulée" ${currentStatus === 'Annulée' ? 'selected' : ''}>Annulée</option>
            </select>
            <button class="validate-status-btn cta-button">Valider</button>
            <button class="cancel-status-btn secondary-btn">Annuler</button>
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
            <span class="current-status ${getStatusClass(order.status)}">${order.status}</span>
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
            await updateDoc(orderRef, { status: newStatus });
            
            const orderToUpdate = allOrders.find(order => order.id === orderId);
            if (orderToUpdate) orderToUpdate.status = newStatus;

            showNotification(`Statut de la commande mis à jour !`, 'success');
            
            statusCell.innerHTML = `
                <span class="current-status ${getStatusClass(newStatus)}">${newStatus}</span>
                <button class="edit-status-btn">Modifier</button>
            `;
            statusCell.querySelector('.edit-status-btn').addEventListener('click', enterEditMode);

        } catch (error) {
            console.error("Error updating order status: ", error);
            showNotification(`Erreur lors de la mise à jour.`, 'error');
            cancelEditMode(event); // Revert on error
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
                <p><strong>Client:</strong> ${order.customerInfo?.firstName || 'N/A'} ${order.customerInfo?.lastName || 'N/A'}</p>
                <p><strong>Email:</strong> ${order.customerInfo?.email || 'N/A'}</p>
                <p><strong>Téléphone:</strong> ${order.customerInfo?.phone || 'N/A'}</p>
                <hr>
                <p><strong>Gâteau:</strong> ${order.product?.name || 'N/A'} (${order.product?.size || 'N/A'})</p>
                <p><strong>Demandes spéciales:</strong> ${order.customization?.specialRequests || 'Aucune'}</p>
                <hr>
                <p><strong>Livraison:</strong> ${order.delivery?.type}</p>
                <p><strong>Date:</strong> ${order.delivery?.date.toDate().toLocaleDateString('fr-FR')}</p>
                <hr>
                <p><strong>Total:</strong> ${order.pricing?.totalPrice.toFixed(2)} €</p>
            `;
            modal.classList.add('is-open');

            const printTicketBtn = document.getElementById('print-ticket-btn');
            if (printTicketBtn) {
                printTicketBtn.onclick = () => {
                    printTicket(modalDetails.innerHTML);
                };
            }

            const sendConfirmationBtn = document.getElementById('send-confirmation-btn');
            if (sendConfirmationBtn) {
                sendConfirmationBtn.onclick = () => {
                    sendConfirmationEmail(order);
                };
            }
        }
    }

    // --- Send Confirmation Email via Gmail ---
    function sendConfirmationEmail(order) {
        if (!order.customerInfo?.email) {
            alert("L'adresse e-mail du client n'est pas disponible.");
            return;
        }

        const recipient = order.customerInfo.email;
        const subject = `Confirmation de votre commande ZeBestCake #${order.id}`;
        const deliveryDate = order.delivery?.date?.toDate().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

        const body = `Bonjour ${order.customerInfo.firstName || 'client(e)'},

Nous avons le plaisir de vous confirmer que votre commande #${order.id} a bien été reçue et est en cours de traitement.

Voici les détails pour la récupération de votre gâteau :

Mode de récupération : ${order.delivery.type}
Date : ${deliveryDate}

Nous vous remercions pour votre confiance.

Cordialement,
L'équipe ZeBestCake`;

        const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(recipient)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.open(gmailUrl, '_blank');
    }

    // --- Print Ticket ---
    function printTicket(content) {
        const printWindow = window.open('', '', 'height=600,width=800');
        printWindow.document.write('<html><head><title>Ticket de commande</title>');
        printWindow.document.write('<link rel="stylesheet" href="css/style.css">');
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

        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
});
