import { db } from './firebase-config.js';
import { doc, getDoc, updateDoc, Timestamp } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js';

// --- DOM Elements ---
const searchForm = document.getElementById('search-order-form');
const editForm = document.getElementById('edit-order-form');
const cancelBtn = document.getElementById('cancel-order-btn');
const searchFeedback = document.getElementById('search-feedback');
const updateFeedback = document.getElementById('update-feedback');
const resultsBox = document.getElementById('results-box');
const orderIdInput = document.getElementById('order-id-input');

// --- Main Logic ---
document.addEventListener('DOMContentLoaded', () => {
    if (!searchForm || !editForm) {
        console.error('Les éléments du formulaire de suivi sont introuvables.');
        return;
    }
    searchForm.addEventListener('submit', handleSearch);
    editForm.addEventListener('submit', handleUpdate);
    cancelBtn.addEventListener('click', handleCancel);

    const closeEditBtn = document.getElementById('close-edit-btn');
    if (closeEditBtn) {
        closeEditBtn.addEventListener('click', resetSearchForm);
    }

    console.log('Page de suivi de commande initialisée.');
});

/**
 * Handles the search form submission.
 * @param {Event} event The form submission event.
 */
async function handleSearch(event) {
    event.preventDefault();
    const orderId = orderIdInput.value.trim();
    resultsBox.style.display = 'none'; // Hide previous results

    if (!orderId) {
        showFeedback(searchFeedback, 'Veuillez entrer un numéro de commande.', 'error');
        return;
    }

    showFeedback(searchFeedback, 'Recherche de votre commande...', 'loading');

    try {
        const orderRef = doc(db, 'orders', orderId);
        const orderSnap = await getDoc(orderRef);

        if (orderSnap.exists()) {
            const orderData = orderSnap.data();
            if (orderData.status === 'Annulée') {
                showFeedback(searchFeedback, 'Cette commande a déjà été annulée et ne peut plus être modifiée.', 'error');
                resultsBox.style.display = 'none';
            } else if (orderData.status === 'Terminée') {
                showFeedback(searchFeedback, 'Cette commande est terminée et ne peut plus être modifiée.', 'success');
                resultsBox.style.display = 'none';
            } else {
                showFeedback(searchFeedback, '', 'clear');
                displayOrderDetails(orderData, orderId);
                resultsBox.style.display = 'block';
            }
        } else {
            showFeedback(searchFeedback, 'Aucune commande trouvée avec ce numéro. Vérifiez la référence et réessayez.', 'error');
        }
    } catch (err) {
        console.error("Erreur lors de la recherche : ", err);
        showFeedback(searchFeedback, 'Une erreur technique est survenue. Veuillez réessayer plus tard.', 'error');
    }
}

/**
 * Displays the fetched order details in the edit form.
 * @param {object} order The order data from Firestore.
 * @param {string} orderId The ID of the order document.
 */
function displayOrderDetails(order, orderId) {
    document.getElementById('order-id-display').textContent = `(#${orderId})`;
    document.getElementById('order-id-hidden').value = orderId;

    // --- Fill Form Fields ---
    // Customer Info
    document.getElementById('first-name').value = order.customerInfo?.firstName || '';
    document.getElementById('last-name').value = order.customerInfo?.lastName || '';
    document.getElementById('email').value = order.customerInfo?.email || '';
    document.getElementById('phone').value = order.customerInfo?.phone || '';

    // Delivery & Customization
    const deliveryDateInput = document.getElementById('delivery-date');
    if (order.delivery?.date) {
        const deliveryDate = order.delivery.date.toDate();
        deliveryDateInput.value = deliveryDate.toISOString().split('T')[0];
        
        const minDate = new Date();
        minDate.setDate(minDate.getDate() + 3);
        deliveryDateInput.min = minDate.toISOString().split('T')[0];
    }
    document.getElementById('special-requests').value = order.customization?.specialRequests || '';

    // --- Fill Summary (Read-Only) ---
    document.getElementById('summary-cake').textContent = `${order.product?.name || 'N/A'} (${order.product?.size || 'N/A'})`;
    document.getElementById('summary-total').textContent = `${(order.pricing?.totalPrice || 0).toFixed(2)} €`;

    // Enable form for editing
    editForm.querySelectorAll('input, textarea, button').forEach(el => el.disabled = false);
}

/**
 * Resets the search form view.
 */
function resetSearchForm() {
    resultsBox.style.display = 'none';
    document.getElementById('search-box').style.display = 'block';
    orderIdInput.value = '';
    searchFeedback.innerHTML = '';
    updateFeedback.innerHTML = '';
    window.scrollTo(0, 0);
}

/**
 * Handles the update form submission.
 * @param {Event} event The form submission event.
 */
async function handleUpdate(event) {
    event.preventDefault();
    const orderId = document.getElementById('order-id-hidden').value;
    
    if (!orderId) return;

    showFeedback(updateFeedback, 'Mise à jour en cours...', 'loading');

    const updatedData = {
        'customerInfo.firstName': document.getElementById('first-name').value,
        'customerInfo.lastName': document.getElementById('last-name').value,
        'customerInfo.email': document.getElementById('email').value,
        'customerInfo.phone': document.getElementById('phone').value,
        'delivery.date': Timestamp.fromDate(new Date(document.getElementById('delivery-date').value)),
        'customization.specialRequests': document.getElementById('special-requests').value,
        isModified: true,
        updatedAt: Timestamp.now()
    };

    try {
        const orderRef = doc(db, 'orders', orderId);
        await updateDoc(orderRef, updatedData);
        showFeedback(updateFeedback, 'Votre commande a été mise à jour avec succès !', 'success');
        setTimeout(resetSearchForm, 2000); // Wait 2 seconds before resetting
    } catch (err) {
        console.error("Erreur lors de la mise à jour : ", err);
        showFeedback(updateFeedback, 'Une erreur est survenue lors de la mise à jour.', 'error');
    }
}

/**
 * Handles the order cancellation.
 */
async function handleCancel() {
    const orderId = document.getElementById('order-id-hidden').value;
    if (!orderId) return;

    const confirmation = confirm("Etes-vous sur de vouloir annuler cette commande ? Cette action est irreversible.");

    if (confirmation) {
        showFeedback(updateFeedback, 'Annulation en cours...', 'loading');
        try {
            const orderRef = doc(db, 'orders', orderId);
            await updateDoc(orderRef, {
                status: 'Annulée',
                updatedAt: Timestamp.now()
            });
            showFeedback(updateFeedback, 'Votre commande a ete annulee avec succes.', 'success');
            editForm.querySelectorAll('input, textarea, button').forEach(el => el.disabled = true);
            setTimeout(() => {
                location.reload();
            }, 2000);
        } catch (err) {
            console.error("Erreur lors de l annulation: ", err);
            showFeedback(updateFeedback, 'Une erreur est survenue lors de l annulation.', 'error');
        }
    }
}


/**
 * Displays feedback messages to the user.
 * @param {HTMLElement} element The container element for the feedback.
 * @param {string} message The message to display.
 * @param {'success'|'error'|'loading'|'clear'} type The type of message.
 */
function showFeedback(element, message, type) {
    element.className = 'feedback-message'; // Reset classes
    if (type === 'clear') {
        element.innerHTML = '';
    } else {
        element.innerHTML = `<p class="${type}">${message}</p>`;
    }
}