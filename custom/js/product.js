import { db } from '../../js/firebase-config.js';
import { doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js';

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const planId = urlParams.get('id');
    
    if (planId) {
        loadProduct(planId);
    }
});

async function loadProduct(id) {
    const container = document.querySelector('.product-detail-grid');
    
    try {
        const docRef = doc(db, "custom_plans", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const plan = { id: docSnap.id, ...docSnap.data() };
            if (plan.isActive) {
                renderProduct(plan);
            } else {
                container.innerHTML = '<h2>Ce produit n\'est plus disponible.</h2>';
            }
        } else {
            container.innerHTML = '<h2>Produit introuvable.</h2>';
        }
    } catch (error) {
        console.error("Erreur Firestore :", error);
        if (error.code === 'permission-denied') {
            container.innerHTML = '<h2>Erreur : Accès refusé. Avez-vous déployé les règles Firestore ?</h2><p style="font-size:12px; color:var(--pierre)">Lancer : firebase deploy --only firestore:rules</p>';
        } else {
            container.innerHTML = '<h2>Une erreur est survenue lors du chargement.</h2>';
        }
    }
}

function renderProduct(plan) {
    document.title = `${plan.title} | ZeBest Custom`;
    
    // Update basic info
    document.querySelector('.product-category').innerText = plan.category;
    document.querySelector('.configurator h1').innerText = plan.title;
    document.querySelector('.price').innerText = `${plan.basePrice.toFixed(2)} €`;
    document.querySelector('.description p').innerText = plan.description;
    
    if (plan.image) {
        document.querySelector('.main-image img').src = plan.image;
    }

    // Generate Dynamic Options
    const form = document.getElementById('custom-form');
    const submitBtn = form.querySelector('button');
    form.innerHTML = ''; // Clear static fields

    if (plan.options && plan.options.length > 0) {
        plan.options.forEach((opt, index) => {
            const group = document.createElement('div');
            group.className = 'form-group';
            
            const label = document.createElement('label');
            label.innerText = opt.name;
            group.appendChild(label);

            if (opt.type === 'text') {
                const input = document.createElement('input');
                input.type = 'text';
                input.name = `opt_${index}`;
                input.required = true;
                input.placeholder = `Votre ${opt.name.toLowerCase()}...`;
                group.appendChild(input);
            } else if (opt.type === 'select') {
                // For select, we'd need choices. For now let's assume text if choices not in schema
                // or add a default textarea for notes if it's complex.
                // Let's stick to text for now as simple MVP or use a generic input.
                const input = document.createElement('input');
                input.type = 'text';
                input.name = `opt_${index}`;
                input.required = true;
                group.appendChild(input);
            }
            
            form.appendChild(group);
        });
    }

    // Add generic Notes field
    const notesGroup = document.createElement('div');
    notesGroup.className = 'form-group';
    notesGroup.innerHTML = `
        <label>Notes (optionnel)</label>
        <textarea id="custom-notes" rows="3" placeholder="Une envie particulière ?"></textarea>
    `;
    form.appendChild(notesGroup);
    form.appendChild(submitBtn);

    // Handle Cart
    form.onsubmit = (e) => {
        e.preventDefault();
        addToCart(plan);
    };
}

function addToCart(plan) {
    const form = document.getElementById('custom-form');
    const selectedOptions = {};
    
    plan.options.forEach((opt, index) => {
        const input = form.querySelector(`[name="opt_${index}"]`);
        selectedOptions[opt.name] = input.value;
    });

    const cartItem = {
        planId: plan.id,
        title: plan.title,
        price: plan.basePrice,
        image: plan.image || '../assets/images/inspiration.webp',
        options: selectedOptions,
        notes: document.getElementById('custom-notes').value,
        timestamp: Date.now()
    };

    // Get current cart
    let cart = JSON.parse(localStorage.getItem('zebest_custom_cart') || '[]');
    cart.push(cartItem);
    localStorage.setItem('zebest_custom_cart', JSON.stringify(cart));

    // Redirect to cart
    window.location.href = 'cart.html';
}
