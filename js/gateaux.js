// js/gateaux.js - Logique pour la page catalogue

import { db } from './firebase-config.js';
import { collection, getDocs } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js';

let allProducts = [];

document.addEventListener('DOMContentLoaded', async () => {
    const productsGrid = document.getElementById('products-grid');
    if (productsGrid) {
        await loadAllProducts();
        displayProducts('all');
    }

    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Gérer l'état actif du bouton
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            // Filtrer et afficher les produits
            const filter = button.getAttribute('data-filter');
            displayProducts(filter);
        });
    });
});

async function loadAllProducts() {
    const productsGrid = document.getElementById('products-grid');
    try {
        const querySnapshot = await getDocs(collection(db, "products"));
        allProducts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Error loading products: ", error);
        productsGrid.innerHTML = '<p>Erreur lors du chargement des produits. Veuillez réessayer plus tard.</p>';
    }
}

function displayProducts(filter = 'all') {
    const productsGrid = document.getElementById('products-grid');
    productsGrid.innerHTML = '';

    const filteredProducts = allProducts.filter(product => {
        if (filter === 'all') return true;
        return product.category === filter;
    });

    if (filteredProducts.length === 0) {
        productsGrid.innerHTML = '<p>Aucun gâteau trouvé dans cette catégorie.</p>';
        return;
    }

    filteredProducts.forEach(product => {
        const productElement = document.createElement('div');
        productElement.className = 'product-card'; // Utiliser une nouvelle classe pour un style potentiellement différent
        
        // Simplification de l'affichage du prix
        let priceDisplay = '';
        if (product.prices) {
            // Affiche le premier prix trouvé pour la simplicité
            const firstPrice = Object.values(product.prices)[0];
            priceDisplay = `<p class="price">À partir de ${firstPrice}€</p>`;
        }

        productElement.innerHTML = `
            <img src="${product.imageUrl}" alt="${product.name}">
            <div class="product-info">
                <h3>${product.name}</h3>
                <p>${product.description}</p>
                ${priceDisplay}
                <a href="commander.html?cakeId=${product.id}" class="cta-button">Commander</a>
            </div>
        `;
        productsGrid.appendChild(productElement);
    });
}