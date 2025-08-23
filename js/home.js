// js/home.js - Logique pour la page d'accueil

import { db } from './firebase-config.js';
import { collection, getDocs } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js';

document.addEventListener('DOMContentLoaded', () => {
    loadHomeProducts();
    loadHomeTestimonials();
});


async function loadHomeProducts() {
    const productsGrid = document.getElementById('specialites-grid');
    if (!productsGrid) return;

    try {
        const querySnapshot = await getDocs(collection(db, "products"));
        productsGrid.innerHTML = ''; // Clear existing static content
        querySnapshot.forEach((doc) => {
            const product = doc.data();
            const productElement = document.createElement('div');
            productElement.className = 'specialite-item';
            productElement.innerHTML = `
                <img src="${product.imageUrl}" alt="${product.name}">
                <h3>${product.name}</h3>
                <p>${product.description}</p>
            `;
            productsGrid.appendChild(productElement);
        });
    } catch (error) {
        console.error("Error loading products: ", error);
        productsGrid.innerHTML = '<p>Erreur lors du chargement des produits. Veuillez réessayer plus tard.</p>';
    }
}

async function loadHomeTestimonials() {
    const testimonialsGrid = document.getElementById('temoignages-grid');
    if (!testimonialsGrid) return;

    try {
        const querySnapshot = await getDocs(collection(db, "testimonials"));
        testimonialsGrid.innerHTML = ''; // Clear existing static content
        querySnapshot.forEach((doc) => {
            const testimonial = doc.data();
            const testimonialElement = document.createElement('div');
            testimonialElement.className = 'temoignage-card';
            
            let ratingStars = '';
            for (let i = 0; i < 5; i++) {
                ratingStars += i < testimonial.rating ? '★' : '☆';
            }

            testimonialElement.innerHTML = `
                <p class="rating">${ratingStars}</p>
                <p class="comment">"${testimonial.comment}"</p>
                <p class="author">- ${testimonial.customerName}</p>
            `;
            testimonialsGrid.appendChild(testimonialElement);
        });
    } catch (error) {
        console.error("Error loading testimonials: ", error);
        testimonialsGrid.innerHTML = '<p>Erreur lors du chargement des témoignages.</p>';
    }
}
