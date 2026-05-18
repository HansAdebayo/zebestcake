// js/home.js - Logique pour la page d'accueil

import { db } from './firebase-config.js';
import { collection, getDocs } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js';

const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

document.addEventListener('DOMContentLoaded', () => {
    loadHomeProducts();
    loadHomeTestimonials();
});


async function loadHomeProducts() {
    const productsGrid = document.getElementById('specialites-grid');
    if (!productsGrid) return;

    try {
        let products;

        const cached = sessionStorage.getItem('zbc_products');
        if (cached) {
            const { data, ts } = JSON.parse(cached);
            if (Date.now() - ts < CACHE_TTL) {
                products = data;
            }
        }

        if (!products) {
            const querySnapshot = await getDocs(collection(db, "products"));
            products = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            sessionStorage.setItem('zbc_products', JSON.stringify({ data: products, ts: Date.now() }));
        }

        productsGrid.innerHTML = '';
        products.forEach(product => {
            const productElement = document.createElement('div');
            productElement.className = 'specialite-item';
            productElement.innerHTML = `
                <a href="commander.html?cakeId=${product.id}" class="specialite-image-container">
                    <img src="${product.imageUrl}" alt="${product.name}">
                </a>
                <div class="specialite-text-container">
                    <h3>${product.name}</h3>
                    <p>${product.description}</p>
                    <a href="commander.html?cakeId=${product.id}" class="cta-button">Commander</a>
                </div>
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
        let testimonials;

        const cached = sessionStorage.getItem('zbc_testimonials');
        if (cached) {
            const { data, ts } = JSON.parse(cached);
            if (Date.now() - ts < CACHE_TTL) {
                testimonials = data;
            }
        }

        if (!testimonials) {
            const querySnapshot = await getDocs(collection(db, "testimonials"));
            testimonials = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            sessionStorage.setItem('zbc_testimonials', JSON.stringify({ data: testimonials, ts: Date.now() }));
        }

        testimonialsGrid.innerHTML = '';
        testimonials.forEach(testimonial => {
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
