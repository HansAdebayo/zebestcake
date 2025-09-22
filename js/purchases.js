import { db } from './firebase-config.js';
import { collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc, Timestamp } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js';

document.addEventListener('DOMContentLoaded', () => {
    const purchaseListTbody = document.getElementById('purchase-list-tbody');
    const purchaseModal = document.getElementById('purchase-modal');
    const purchaseModalClose = document.getElementById('purchase-modal-close');
    const addPurchaseBtn = document.getElementById('add-purchase-btn');
    const purchaseForm = document.getElementById('purchase-form');
    const purchaseFormTitle = document.getElementById('purchase-form-title');
    const purchaseIdInput = document.getElementById('purchase-id');
    const productNameInput = document.getElementById('purchase-product-name');
    const supplierInput = document.getElementById('purchase-supplier');
    const purchaseDateInput = document.getElementById('purchase-date');
    const quantityInput = document.getElementById('purchase-quantity');
    const unitPriceInput = document.getElementById('purchase-unit-price');

    const monthlySpendingEl = document.getElementById('stats-monthly-spending');
    const totalSpendingEl = document.getElementById('stats-total-spending');

    let purchases = [];

    function renderPurchases() {
        if (purchaseListTbody) {
            purchaseListTbody.innerHTML = '';
            purchases.forEach(purchase => {
                const row = document.createElement('tr');
                const total = purchase.totalPrice || (purchase.quantity * purchase.unitPrice);
                row.innerHTML = `
                    <td>${purchase.productName}</td>
                    <td>${purchase.supplier}</td>
                    <td>${formatDate(purchase.purchaseDate)}</td>
                    <td>${purchase.quantity}</td>
                    <td>${purchase.unitPrice.toFixed(2)} €</td>
                    <td>${total.toFixed(2)} €</td>
                    <td>
                        <button class="edit-btn" data-id="${purchase.id}">Modifier</button>
                        <button class="delete-btn" data-id="${purchase.id}">Supprimer</button>
                    </td>
                `;
                purchaseListTbody.appendChild(row);
            });
        }
    }

    function calculateStats() {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        const monthlySpending = purchases
            .filter(p => {
                const purchaseDate = p.purchaseDate.toDate();
                return purchaseDate.getMonth() === currentMonth && purchaseDate.getFullYear() === currentYear;
            })
            .reduce((sum, p) => sum + (p.totalPrice || (p.quantity * p.unitPrice)), 0);

        const totalSpending = purchases.reduce((sum, p) => sum + (p.totalPrice || (p.quantity * p.unitPrice)), 0);

        if (monthlySpendingEl) {
            monthlySpendingEl.textContent = `${monthlySpending.toFixed(2)} €`;
        }
        if (totalSpendingEl) {
            totalSpendingEl.textContent = `${totalSpending.toFixed(2)} €`;
        }
    }

    onSnapshot(collection(db, 'purchases'), snapshot => {
        purchases = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderPurchases();
        calculateStats();
    });

    if (addPurchaseBtn) {
        addPurchaseBtn.addEventListener('click', () => {
            purchaseFormTitle.textContent = 'Ajouter un Achat';
            purchaseIdInput.value = '';
            purchaseForm.reset();
            purchaseModal.style.display = 'block';
        });
    }

    if (purchaseModalClose) {
        purchaseModalClose.addEventListener('click', () => {
            purchaseModal.style.display = 'none';
        });
    }

    window.addEventListener('click', (event) => {
        if (event.target === purchaseModal) {
            purchaseModal.style.display = 'none';
        }
    });

    if (purchaseForm) {
        purchaseForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const id = purchaseIdInput.value;
            const productName = productNameInput.value;
            const supplier = supplierInput.value;
            const purchaseDate = purchaseDateInput.value;
            const quantity = parseFloat(quantityInput.value);
            const unitPrice = parseFloat(unitPriceInput.value);
            const totalPrice = quantity * unitPrice;

            const purchaseData = {
                productName,
                supplier,
                purchaseDate: Timestamp.fromDate(new Date(purchaseDate)),
                quantity,
                unitPrice,
                totalPrice
            };

            if (id) {
                // Update
                await updateDoc(doc(db, 'purchases', id), purchaseData);
            } else {
                // Add
                await addDoc(collection(db, 'purchases'), purchaseData);
            }
            purchaseModal.style.display = 'none';
        });
    }

    if (purchaseListTbody) {
        purchaseListTbody.addEventListener('click', async (event) => {
            const target = event.target;
            const id = target.dataset.id;

            if (target.classList.contains('delete-btn')) {
                if (confirm('Êtes-vous sûr de vouloir supprimer cet achat ?')) {
                    await deleteDoc(doc(db, 'purchases', id));
                }
            }

            if (target.classList.contains('edit-btn')) {
                const purchase = purchases.find(p => p.id === id);
                if (purchase) {
                    purchaseFormTitle.textContent = 'Modifier un Achat';
                    purchaseIdInput.value = purchase.id;
                    productNameInput.value = purchase.productName;
                    supplierInput.value = purchase.supplier;
                    purchaseDateInput.value = purchase.purchaseDate.toDate().toISOString().split('T')[0];
                    quantityInput.value = purchase.quantity;
                    unitPriceInput.value = purchase.unitPrice;
                    purchaseModal.style.display = 'block';
                }
            }
        });
    }

    function formatDate(date) {
        if (!date) {
            return 'N/A';
        }

        if (typeof date === 'string') {
            return date;
        }

        if (date.seconds) {
            const d = new Date(date.seconds * 1000);
            return d.toLocaleDateString();
        }

        return 'N/A';
    }
});