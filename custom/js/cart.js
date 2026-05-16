import { db } from '../../js/firebase-config.js';
import { collection, addDoc, doc, getDoc, Timestamp } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js';

document.addEventListener('DOMContentLoaded', () => {
    renderCart();
    tryPrefill();
    
    document.getElementById('checkout-form').onsubmit = handleCheckout;
});

function renderCart() {
    const cart = JSON.parse(localStorage.getItem('zebest_custom_cart') || '[]');
    const list = document.getElementById('cart-items-list');
    const checkoutSection = document.getElementById('checkout-section');
    const totalDisplay = document.getElementById('cart-total');

    if (cart.length === 0) {
        list.innerHTML = '<p class="loading">Votre panier est vide.</p>';
        checkoutSection.style.display = 'none';
        return;
    }

    list.innerHTML = '';
    checkoutSection.style.display = 'block';
    
    let total = 0;

    cart.forEach((item, index) => {
        total += item.price;
        const div = document.createElement('div');
        div.className = 'cart-item';
        div.style = 'display: flex; gap: 20px; padding: 20px 0; border-bottom: 1px solid var(--ligne);';
        
        const optionsText = Object.entries(item.options).map(([k, v]) => `${k}: ${v}`).join(' | ');

        div.innerHTML = `
            <div class="cart-item-image" style="width: 100px; aspect-ratio: 4/5; background: var(--ligne);">
                <img src="${item.image}" style="width: 100%; height: 100%; object-fit: cover;">
            </div>
            <div class="cart-item-info" style="flex: 1;">
                <h3 style="font-family: var(--font-title); font-size: 18px;">${item.title}</h3>
                <p style="font-size: 14px; color: var(--pierre);">${optionsText}</p>
                <p style="margin-top: 10px; font-weight: 500;">${item.price.toFixed(2)} €</p>
                <button class="remove-item" data-index="${index}" style="background: none; border: none; color: #8b0000; cursor: pointer; font-size: 12px; padding: 0; margin-top: 5px;">Supprimer</button>
            </div>
        `;

        div.querySelector('.remove-item').onclick = () => removeItem(index);
        list.appendChild(div);
    });

    totalDisplay.innerText = `${total.toFixed(2)} €`;
}

function removeItem(index) {
    let cart = JSON.parse(localStorage.getItem('zebest_custom_cart') || '[]');
    cart.splice(index, 1);
    localStorage.setItem('zebest_custom_cart', JSON.stringify(cart));
    renderCart();
}

async function tryPrefill() {
    const cakeId = sessionStorage.getItem('custom_cake_id');
    if (!cakeId) return;

    try {
        const orderRef = doc(db, "orders", cakeId);
        const orderSnap = await getDoc(orderRef);
        
        if (orderSnap.exists()) {
            const data = orderSnap.data();
            if (data.customerInfo) {
                document.getElementById('first-name').value = data.customerInfo.firstName || '';
                document.getElementById('last-name').value = data.customerInfo.lastName || '';
                document.getElementById('email').value = data.customerInfo.email || '';
                document.getElementById('phone').value = data.customerInfo.phone || '';
            }
        }
    } catch (e) {
        console.warn("Échec du pré-remplissage :", e);
    }
}

async function handleCheckout(e) {
    e.preventDefault();
    const submitBtn = e.target.querySelector('button');
    submitBtn.disabled = true;
    submitBtn.innerText = 'Envoi en cours...';

    const cart = JSON.parse(localStorage.getItem('zebest_custom_cart') || '[]');
    const source = sessionStorage.getItem('custom_source') || 'direct';
    const cakeOrderId = sessionStorage.getItem('custom_cake_id') || null;

    const orderData = {
        customerInfo: {
            firstName: document.getElementById('first-name').value,
            lastName: document.getElementById('last-name').value,
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value,
        },
        items: cart,
        totalPrice: cart.reduce((sum, item) => sum + item.price, 0),
        source: source,
        cakeOrderId: cakeOrderId,
        status: 'pending',
        createdAt: Timestamp.now()
    };

    try {
        const docRef = await addDoc(collection(db, "custom_orders"), orderData);
        
        // Confirmation
        localStorage.removeItem('zebest_custom_cart');
        document.querySelector('.cart-container').innerHTML = `
            <div style="text-align: center; padding: 60px 0;">
                <h2 style="font-family: var(--font-title); margin-bottom: 20px;">Merci pour votre demande !</h2>
                <p>Votre commande <strong>#${docRef.id}</strong> a bien été enregistrée.</p>
                <p style="margin-top: 20px;">Je vous recontacte très vite pour valider les détails avec vous.</p>
                <a href="index.html" class="btn" style="margin-top: 40px;">Retour à l'accueil</a>
            </div>
        `;
    } catch (error) {
        console.error("Erreur commande :", error);
        alert("Une erreur est survenue lors de l'envoi.");
        submitBtn.disabled = false;
        submitBtn.innerText = 'Envoyer ma commande';
    }
}
