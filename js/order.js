// js/order.js - Logique pour le formulaire de commande

import { db, storage } from './firebase-config.js';
import { collection, getDocs, addDoc, Timestamp } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js';
import { ref, uploadBytes, getDownloadURL } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-storage.js';

let products = [];

document.addEventListener('DOMContentLoaded', () => {
    console.log("order.js: DOMContentLoaded, initialisation du script.");

    const form = document.getElementById('order-form');
    if (!form) {
        return;
    }

    // --- State for multi-step form ---
    let currentStep = 1;
    const steps = Array.from(form.querySelectorAll("fieldset"));
    const nextBtn = document.getElementById("next-btn");
    const prevBtn = document.getElementById("prev-btn");
    const submitBtn = form.querySelector('button[type="submit"]');
    const progressSteps = document.querySelectorAll(".progress-step");

    // --- Initial UI setup ---
    showStep(currentStep);

    // --- Event Listeners ---
    nextBtn.addEventListener('click', () => {
        if (validateStep(currentStep)) {
            currentStep++;
            showStep(currentStep);
        }
    });

    prevBtn.addEventListener('click', () => {
        currentStep--;
        showStep(currentStep);
    });

    // --- Éléments du DOM (pour la logique métier) ---
    const cakeTypeSelect = document.getElementById('cake-type');
    const cakeSizeSelect = document.getElementById('cake-size');
    const deliveryType = document.getElementById('delivery-type');

    // --- Initialisation & Écouteurs (logique métier) ---
    if (cakeTypeSelect) {
        loadProductsIntoSelect().then(() => {
            // Vérifier si un gâteau est passé en paramètre d'URL
            const urlParams = new URLSearchParams(window.location.search);
            const cakeId = urlParams.get('cakeId');
            if (cakeId) {
                cakeTypeSelect.value = cakeId;
                // Déclencher manuellement l'événement change pour mettre à jour les tailles et le prix
                cakeTypeSelect.dispatchEvent(new Event('change'));
            }
            updatePriceSummary();
        });
        cakeTypeSelect.addEventListener('change', onCakeTypeChange);
    }

    if (cakeSizeSelect) cakeSizeSelect.addEventListener('change', updatePriceSummary);
    if (deliveryType) deliveryType.addEventListener('change', updatePriceSummary);

    setupDatePicker();

    console.log("order.js: Attachement de l'écouteur de soumission au formulaire.");
    form.addEventListener('submit', handleOrderSubmit);

    // --- Fonctions du formulaire à étapes ---
    function showStep(stepNumber) {
        const activeStepElement = steps[stepNumber - 1];

        steps.forEach((step, index) => {
            const isActive = index + 1 === stepNumber;
            step.classList.toggle('active', isActive);
        });

        // Après avoir rendu le fieldset visible, on scrolle dessus.
        if (activeStepElement) {
            // On utilise un petit délai pour s'assurer que le DOM est à jour, surtout sur les navigateurs plus lents.
            setTimeout(() => {
                activeStepElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100); 
        }

        updateProgress(stepNumber);
        updateNavButtons(stepNumber);
    }

    function updateProgress(stepNumber) {
        progressSteps.forEach((step, index) => {
            if (index < stepNumber) {
                step.classList.add('active');
            } else {
                step.classList.remove('active');
            }
        });
    }

    function updateNavButtons(stepNumber) {
        prevBtn.classList.toggle('hidden', stepNumber === 1);
        nextBtn.classList.toggle('hidden', stepNumber === steps.length);
        submitBtn.classList.toggle('hidden', stepNumber !== steps.length);
    }

    function validateStep(stepNumber) {
        const currentFieldset = steps[stepNumber - 1];
        const requiredInputs = currentFieldset.querySelectorAll("[required]");
        let isValid = true;
        requiredInputs.forEach(input => {
            if (!input.value) {
                isValid = false;
                input.style.borderColor = 'red';
            } else {
                input.style.borderColor = '#ccc';
            }
        });
        if (!isValid) {
            alert("Veuillez remplir tous les champs obligatoires de cette étape.");
        }
        return isValid;
    }
});

/**
 * Charge les produits depuis Firestore et les injecte dans le <select>
 */
async function loadProductsIntoSelect() {
    const cakeTypeSelect = document.getElementById('cake-type');
    try {
        const querySnapshot = await getDocs(collection(db, "products"));
        products = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        cakeTypeSelect.innerHTML = '<option value="">Choisissez un modèle</option>'; // Reset

        products.forEach(product => {
            if (product.available) {
                const option = document.createElement('option');
                option.value = product.id;
                option.textContent = product.name;
                cakeTypeSelect.appendChild(option);
            }
        });
    } catch (error) {
        console.error("Erreur lors du chargement des produits: ", error);
        cakeTypeSelect.innerHTML = '<option value="">Erreur de chargement</option>';
    }
}

/**
 * Gère le changement du type de gâteau sélectionné.
 */
function onCakeTypeChange() {
    const cakeTypeSelect = document.getElementById('cake-type');
    const cakeSizeSelect = document.getElementById('cake-size');
    const selectedProductId = cakeTypeSelect.value;

    cakeSizeSelect.innerHTML = ''; // Reset sizes
    cakeSizeSelect.disabled = true;

    if (!selectedProductId) return;

    const selectedProduct = products.find(p => p.id === selectedProductId);

    if (selectedProduct && selectedProduct.prices) {
        // Remplir les options de taille/prix
        Object.entries(selectedProduct.prices).forEach(([sizeKey, price]) => {
            const option = document.createElement('option');
            option.value = price; // La valeur est le prix directement
            option.dataset.name = selectedProduct.name; // Stocker le nom pour le récap
            
            // Formatter le texte de l'option pour être plus lisible
            let sizeText = sizeKey.replace('size', '').replace('_', '-').replace('piece', '');
            if(sizeKey.includes('plus')) sizeText = sizeText.replace('plus', '') + ' et plus';
            if(sizeKey.includes('piece')) sizeText += ' pièce(s)';
            else sizeText += ' parts';

            option.textContent = `Taille ${sizeText} - ${price}€`;
            cakeSizeSelect.appendChild(option);
        });
        cakeSizeSelect.disabled = false;
    } else {
        const option = document.createElement('option');
        option.textContent = 'Aucune taille disponible';
        cakeSizeSelect.appendChild(option);
    }
    updatePriceSummary(); // Mettre à jour le récapitulatif du prix
}

/**
 * Configure le sélecteur de date avec les contraintes métier.
 */
function setupDatePicker() {
    const dateInput = document.getElementById('delivery-date');
    const today = new Date();
    
    // Empêcher la sélection de dates passées
    const minDateString = today.toISOString().split('T')[0];
    dateInput.setAttribute('min', minDateString);
}

/**
 * Calcule le prix total en temps réel et met à jour le récapitulatif.
 */
function updatePriceSummary() {
    const pricing = calculateFinalPrice();
    const { basePrice, deliveryPrice, totalPrice, cakeName, cakeSize, deliveryText } = pricing;

    document.getElementById('summary-cake').textContent = `Gâteau : ${cakeName ? `${cakeName} (${cakeSize})` : '-'}`;
    document.getElementById('summary-delivery').textContent = `Livraison : ${deliveryText}`;
    document.getElementById('summary-total').textContent = `Total : ${totalPrice.toFixed(2)} €`;
}

function calculateFinalPrice() {
    let basePrice = 0, deliveryPrice = 0;
    let cakeName = '', cakeSize = '', deliveryText = '';

    const cakeSizeSelect = document.getElementById('cake-size');
    const selectedSizeOption = cakeSizeSelect.options[cakeSizeSelect.selectedIndex];
    if (selectedSizeOption && selectedSizeOption.value) {
        basePrice = parseFloat(selectedSizeOption.value);
        const selectedCake = products.find(p => p.id === document.getElementById('cake-type').value);
        cakeName = selectedCake ? selectedCake.name : '';
        cakeSize = selectedSizeOption.text.split(' - ')[0];
    }

    const deliverySelect = document.getElementById('delivery-type');
    deliveryText = deliverySelect.options[deliverySelect.selectedIndex].text;
    switch (deliverySelect.value) {
        case 'livraison-centre': deliveryPrice = 8; break;
        case 'livraison-peripherie': deliveryPrice = 12; break;
    }

    const totalPrice = basePrice + deliveryPrice;

    return { basePrice, deliveryPrice, totalPrice, cakeName, cakeSize, deliveryText };
}

/**
 * Gère la soumission finale du formulaire de commande.
 */
async function handleOrderSubmit(event) {
    event.preventDefault();
    console.log("handleOrderSubmit: Démarrage de la soumission.");
    const form = event.target;
    const submitButton = form.querySelector('button[type="submit"]');

    // --- VALIDATION --- //
    let isValid = true;
    const requiredFields = ['cake-type', 'cake-size', 'delivery-date', 'first-name', 'last-name', 'email', 'phone'];
    requiredFields.forEach(fieldId => {
        const input = document.getElementById(fieldId);
        if (!input.value) {
            isValid = false;
            input.style.borderColor = 'red';
        } else {
            input.style.borderColor = '#ccc';
        }
    });

    if (!isValid) {
        alert('Veuillez remplir tous les champs obligatoires.');
        console.warn("handleOrderSubmit: Validation échouée.");
        return;
    }
    console.log("handleOrderSubmit: Validation réussie.");

    submitButton.disabled = true;
    submitButton.textContent = 'Envoi en cours...';

    try {
        // --- PRÉPARATION DES DONNÉES ---
        console.log("handleOrderSubmit: Préparation des données de la commande.");
        const formElements = form.elements;
        const selectedCakeId = formElements['cake-type'].value;
        const selectedCake = products.find(p => p.id === selectedCakeId);
        const selectedSizeOption = formElements['cake-size'].options[formElements['cake-size'].selectedIndex];

        const pricing = calculateFinalPrice();

        const orderData = {
            customerInfo: {
                firstName: formElements['first-name'].value,
                lastName: formElements['last-name'].value,
                email: formElements['email'].value,
                phone: formElements['phone'].value,
            },
            product: {
                id: selectedCakeId,
                name: selectedCake.name,
                size: selectedSizeOption.text.split(' - ')[0],
                basePrice: parseFloat(selectedSizeOption.value),
            },
            customization: {
                specialRequests: formElements['custom-requests'].value.trim(),
            },
            delivery: {
                type: formElements['delivery-type'].value,
                date: Timestamp.fromDate(new Date(formElements['delivery-date'].value)),
                timeSlot: 'Non spécifié',
                address: ''
            },
            pricing: pricing,
            status: 'pending',
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
        };

        console.log("handleOrderSubmit: Données prêtes à être envoyées à Firestore:", orderData);

        // --- ENVOI VERS FIREBASE ---
        const docRef = await addDoc(collection(db, "orders"), orderData);
        console.log("handleOrderSubmit: Commande enregistrée avec succès ! ID du document:", docRef.id);

        // Afficher la confirmation
        document.getElementById('order-form-section').innerHTML = `
            <div class="order-confirmation">
                <h2>Merci pour votre commande !</h2>
                <p>Votre commande a bien été enregistrée. Nous vous enverrons un email de confirmation très prochainement.</p>
                <p>Référence de votre commande : <strong>${docRef.id}</strong></p>
            </div>
        `;

    } catch (error) {
        console.error("handleOrderSubmit: ERREUR CATCHÉE lors de la soumission: ", error);
        alert(`Une erreur est survenue: ${error.message}`);
        submitButton.disabled = false;
        submitButton.textContent = 'Valider la Commande';
    }
}