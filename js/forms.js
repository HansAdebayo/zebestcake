// Gestion des formulaires pour ZeBestCake

document.addEventListener('DOMContentLoaded', function() {
    initializeOrderForm();
    initializeContactForm();
    initializeFormValidation();
});

// Configuration des formulaires
const FORM_CONFIG = {
    // Remplacez par votre URL Google Apps Script
    ORDER_ENDPOINT:'https://script.google.com/macros/s/AKfycbx1Ad8fqKV543C-M2hBzyq7KQk_mNInoye5S6EKgUJkIRZW0Kg0idG0I1qklqaxqQuUQA/exec',
    CONTACT_ENDPOINT: 'https://script.google.com/macros/s/AKfycbx1Ad8fqKV543C-M2hBzyq7KQk_mNInoye5S6EKgUJkIRZW0Kg0idG0I1qklqaxqQuUQA/exec'
};

// Initialisation du formulaire de commande
function initializeOrderForm() {
    const orderForm = document.getElementById('orderFormElement');
    if (!orderForm) return;

    orderForm.addEventListener('submit', handleOrderSubmission);
    
    // Validation en temps réel
    const inputs = orderForm.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
        input.addEventListener('blur', validateField);
        input.addEventListener('input', clearFieldError);
    });

    // Auto-resize textarea
    const textarea = orderForm.querySelector('textarea');
    if (textarea) {
        textarea.addEventListener('input', autoResizeTextarea);
    }

    // Calcul automatique du prix estimé
    const cakeTypeSelect = orderForm.querySelector('#cakeType');
    const quantityInput = orderForm.querySelector('#quantity');
    
    if (cakeTypeSelect && quantityInput) {
        [cakeTypeSelect, quantityInput].forEach(element => {
            element.addEventListener('change', updateEstimatedPrice);
        });
    }
}

// Initialisation du formulaire de contact
function initializeContactForm() {
    const contactForm = document.getElementById('contactForm');
    if (!contactForm) return;

    contactForm.addEventListener('submit', handleContactSubmission);
    
    // Validation en temps réel
    const inputs = contactForm.querySelectorAll('input, textarea');
    inputs.forEach(input => {
        input.addEventListener('blur', validateField);
        input.addEventListener('input', clearFieldError);
    });

    // Auto-resize textarea
    const textarea = contactForm.querySelector('textarea');
    if (textarea) {
        textarea.addEventListener('input', autoResizeTextarea);
    }
}

// Gestion de la soumission du formulaire de commande
async function handleOrderSubmission(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    
    // Validation complète avant envoi
    if (!validateCompleteForm(form)) {
        showFormError(form, 'Veuillez corriger les erreurs du formulaire');
        return;
    }

    // Préparer les données
    const orderData = {
        type: 'order',
        orderName: formData.get('orderName'),
        orderPhone: formData.get('orderPhone'),
        orderEmail: formData.get('orderEmail'),
        orderDate: formData.get('orderDate'),
        cakeType: formData.get('cakeType'),
        quantity: formData.get('quantity'),
        flavor: formData.get('flavor'),
        orderMessage: formData.get('orderMessage'),
        timestamp: new Date().toISOString(),
        estimatedPrice: calculateEstimatedPrice(formData.get('cakeType'), formData.get('quantity'))
    };

    // Afficher le loading
    const originalContent = window.ZeBestCake.showFormLoading(form);

    try {
        const response = await submitFormData(FORM_CONFIG.ORDER_ENDPOINT, orderData);
        
        if (response.success !== false) {
            window.ZeBestCake.showFormSuccess(form, 'Commande envoyée! Nous vous recontactons rapidement 🎂');
            
            // Envoyer un email de confirmation (optionnel)
            sendConfirmationEmail(orderData);
            
            // Reset du formulaire après succès
            setTimeout(() => {
                form.reset();
                clearAllFieldErrors(form);
            }, 2000);
        } else {
            throw new Error(response.message || 'Erreur lors de l\'envoi');
        }
        
    } catch (error) {
        console.error('Erreur soumission commande:', error);
        window.ZeBestCake.showFormError(form, 'Erreur - Appelez le 05 61 00 00 00 📞');
    } finally {
        window.ZeBestCake.resetFormButton(form, originalContent);
    }
}

// Gestion de la soumission du formulaire de contact
async function handleContactSubmission(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    
    // Validation complète avant envoi
    if (!validateCompleteForm(form)) {
        showFormError(form, 'Veuillez corriger les erreurs du formulaire');
        return;
    }

    // Préparer les données
    const contactData = {
        type: 'contact',
        name: formData.get('name'),
        email: formData.get('email'),
        message: formData.get('message'),
        timestamp: new Date().toISOString()
    };

    // Afficher le loading
    const originalContent = window.ZeBestCake.showFormLoading(form);

    try {
        const response = await submitFormData(FORM_CONFIG.CONTACT_ENDPOINT, contactData);
        
        if (response.success !== false) {
            window.ZeBestCake.showFormSuccess(form, 'Message envoyé avec succès! ✨');
            
            // Reset du formulaire après succès
            setTimeout(() => {
                form.reset();
                clearAllFieldErrors(form);
            }, 2000);
        } else {
            throw new Error(response.message || 'Erreur lors de l\'envoi');
        }
        
    } catch (error) {
        console.error('Erreur soumission contact:', error);
        window.ZeBestCake.showFormError(form, 'Erreur - Réessayez plus tard');
    } finally {
        window.ZeBestCake.resetFormButton(form, originalContent);
    }
}

// Fonction générique pour envoyer les données
async function submitFormData(endpoint, data) {
    const response = await fetch(endpoint, {
        method: 'POST',
        mode: 'no-cors', // Pour Google Apps Script
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    });

    // Note: avec no-cors, on ne peut pas lire la réponse
    // On considère que c'est un succès si pas d'erreur de réseau
    return { success: true };
}

// Validation des champs individuels
function validateField(e) {
    const field = e.target;
    const value = field.value.trim();
    const fieldName = field.name;
    
    clearFieldError(field);

    let errorMessage = '';

    // Validation selon le type de champ
    switch (fieldName) {
        case 'orderName':
        case 'name':
            if (!value) {
                errorMessage = 'Le nom est requis';
            } else if (value.length < 2) {
                errorMessage = 'Le nom doit contenir au moins 2 caractères';
            }
            break;

        case 'orderPhone':
            if (!value) {
                errorMessage = 'Le téléphone est requis';
            } else if (!isValidPhone(value)) {
                errorMessage = 'Format de téléphone invalide';
            }
            break;

        case 'orderEmail':
        case 'email':
            if (!value) {
                errorMessage = 'L\'email est requis';
            } else if (!isValidEmail(value)) {
                errorMessage = 'Format d\'email invalide';
            }
            break;

        case 'orderDate':
            if (!value) {
                errorMessage = 'La date de livraison est requise';
            } else if (!isValidDate(value)) {
                errorMessage = 'La date doit être au moins 48h à l\'avance';
            }
            break;

        case 'cakeType':
            if (!value) {
                errorMessage = 'Veuillez choisir un type de gâteau';
            }
            break;

        case 'orderMessage':
        case 'message':
            if (!value) {
                errorMessage = 'Ce champ est requis';
            } else if (value.length < 10) {
                errorMessage = 'Veuillez donner plus de détails (au moins 10 caractères)';
            }
            break;
    }

    if (errorMessage) {
        showFieldError(field, errorMessage);
        return false;
    }

    showFieldSuccess(field);
    return true;
}

// Validation d'email
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Validation de téléphone
function isValidPhone(phone) {
    const phoneRegex = /^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
}

// Validation de date
function isValidDate(dateString) {
    const selectedDate = new Date(dateString);
    const now = new Date();
    const minDate = new Date(now.getTime() + 48 * 60 * 60 * 1000); // 48h à l'avance
    
    return selectedDate >= minDate;
}

// Afficher une erreur sur un champ
function showFieldError(field, message) {
    field.style.borderColor = '#ff6b6b';
    field.style.backgroundColor = '#fff5f5';
    
    // Supprimer l'ancien message d'erreur
    const existingError = field.parentNode.querySelector('.field-error');
    if (existingError) {
        existingError.remove();
    }

    // Ajouter le nouveau message d'erreur
    const errorDiv = document.createElement('div');
    errorDiv.className = 'field-error';
    errorDiv.style.cssText = `
        color: #ff6b6b;
        font-size: 0.85rem;
        margin-top: 0.25rem;
        animation: slideIn 0.3s ease;
    `;
    errorDiv.textContent = message;
    
    field.parentNode.appendChild(errorDiv);
}

// Afficher le succès sur un champ
function showFieldSuccess(field) {
    field.style.borderColor = '#4CAF50';
    field.style.backgroundColor = '#f8fff8';
}

// Effacer l'erreur d'un champ
function clearFieldError(field) {
    if (typeof field === 'object' && field.target) {
        field = field.target; // Si c'est un événement
    }
    
    field.style.borderColor = '';
    field.style.backgroundColor = '';
    
    const errorDiv = field.parentNode.querySelector('.field-error');
    if (errorDiv) {
        errorDiv.remove();
    }
}

// Effacer toutes les erreurs du formulaire
function clearAllFieldErrors(form) {
    const fields = form.querySelectorAll('input, textarea, select');
    fields.forEach(clearFieldError);
}

// Validation complète du formulaire
function validateCompleteForm(form) {
    const requiredFields = form.querySelectorAll('[required]');
    let isValid = true;

    requiredFields.forEach(field => {
        const event = { target: field };
        if (!validateField(event)) {
            isValid = false;
        }
    });

    return isValid;
}

// Auto-resize des textarea
function autoResizeTextarea(e) {
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
}

// Calcul du prix estimé
function calculateEstimatedPrice(cakeType, quantity) {
    const prices = {
        'bento': { base: 20, bulk: 15 },
        'layer': { base: 40, medium: 60, large: 80 },
        'cupcakes': { base: 2, bulk1: 1.8, bulk2: 1.5 }
    };

    const qty = parseInt(quantity) || 1;
    
    switch (cakeType) {
        case 'bento':
            return qty >= 3 ? qty * prices.bento.bulk : qty * prices.bento.base;
        
        case 'layer':
            if (qty <= 8) return prices.layer.base;
            if (qty <= 12) return prices.layer.medium;
            return prices.layer.large;
        
        case 'cupcakes':
            if (qty >= 24) return qty * prices.cupcakes.bulk2;
            if (qty >= 12) return qty * prices.cupcakes.bulk1;
            return qty * prices.cupcakes.base;
        
        default:
            return 0;
    }
}

// Mettre à jour le prix estimé affiché
function updateEstimatedPrice() {
    const cakeType = document.getElementById('cakeType').value;
    const quantity = document.getElementById('quantity').value;
    
    if (cakeType && quantity) {
        const estimatedPrice = calculateEstimatedPrice(cakeType, quantity);
        
        // Chercher ou créer l'élément d'affichage du prix
        let priceDisplay = document.getElementById('estimatedPrice');
        if (!priceDisplay) {
            priceDisplay = document.createElement('div');
            priceDisplay.id = 'estimatedPrice';
            priceDisplay.style.cssText = `
                background: linear-gradient(135deg, rgba(255, 105, 180, 0.1), rgba(255, 192, 203, 0.1));
                border: 2px solid rgba(255, 105, 180, 0.3);
                border-radius: 15px;
                padding: 1rem;
                margin-top: 1rem;
                text-align: center;
                font-weight: bold;
                color: var(--primary-color);
                animation: slideIn 0.3s ease;
            `;
            
            const quantityGroup = document.getElementById('quantity').closest('.form-group');
            quantityGroup.parentNode.insertBefore(priceDisplay, quantityGroup.nextSibling);
        }
        
        priceDisplay.innerHTML = `
            <span style="font-size: 0.9rem;">Prix estimé :</span><br>
            <span style="font-size: 1.4rem;">${estimatedPrice}€</span>
            <br><small style="opacity: 0.8;">Prix indicatif - peut varier selon la décoration</small>
        `;
    }
}

// Envoi d'email de confirmation (simulation)
function sendConfirmationEmail(orderData) {
    // Cette fonction simule l'envoi d'un email de confirmation
    // En production, cela serait géré côté serveur
    console.log('Email de confirmation envoyé pour la commande:', orderData);
    
    // Vous pourriez ajouter ici l'intégration avec un service d'email
    // comme EmailJS, SendGrid, etc.
}

// Initialisation de la validation en temps réel
function initializeFormValidation() {
    // Ajouter les styles CSS pour les animations
    const styles = document.createElement('style');
    styles.textContent = `
        @keyframes slideIn {
            from {
                opacity: 0;
                transform: translateY(-10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        .field-error {
            animation: slideIn 0.3s ease;
        }
        
        .form-group input:valid,
        .form-group textarea:valid,
        .form-group select:valid {
            border-color: #4CAF50;
        }
        
        .form-group input:invalid:not(:placeholder-shown),
        .form-group textarea:invalid:not(:placeholder-shown),
        .form-group select:invalid:not(:placeholder-shown) {
            border-color: #ff6b6b;
        }
        
        /* Amélioration mobile pour les champs */
        @media (max-width: 768px) {
            .form-group input,
            .form-group textarea,
            .form-group select {
                font-size: 16px; /* Évite le zoom sur iOS */
            }
        }
        
        /* Style pour les champs requis */
        .form-group label[for*="required"]::after,
        .form-group label:has(+ input[required])::after,
        .form-group label:has(+ textarea[required])::after,
        .form-group label:has(+ select[required])::after {
            content: " *";
            color: #ff6b6b;
        }
    `;
    document.head.appendChild(styles);

    // Améliorer l'accessibilité
    addAccessibilityFeatures();
    
    // Ajouter la sauvegarde automatique des formulaires
    initializeFormAutoSave();
}

// Ajouter des fonctionnalités d'accessibilité
function addAccessibilityFeatures() {
    // Ajouter des descriptions ARIA
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        const submitButton = form.querySelector('.submit-button');
        if (submitButton) {
            submitButton.setAttribute('aria-describedby', 'submit-help');
            
            const helpText = document.createElement('div');
            helpText.id = 'submit-help';
            helpText.className = 'sr-only';
            helpText.textContent = 'Appuyez sur Entrée ou cliquez pour envoyer le formulaire';
            form.appendChild(helpText);
        }
    });

    // Annoncer les erreurs aux lecteurs d'écran
    const originalShowFieldError = window.showFieldError || showFieldError;
    window.showFieldError = function(field, message) {
        originalShowFieldError(field, message);
        
        // Ajouter un attribut aria-invalid
        field.setAttribute('aria-invalid', 'true');
        field.setAttribute('aria-describedby', field.name + '-error');
        
        const errorDiv = field.parentNode.querySelector('.field-error');
        if (errorDiv) {
            errorDiv.id = field.name + '-error';
            errorDiv.setAttribute('role', 'alert');
        }
    };
}

// Sauvegarde automatique des formulaires (localStorage si disponible)
function initializeFormAutoSave() {
    if (typeof Storage === 'undefined') return;

    const forms = document.querySelectorAll('#orderFormElement, #contactForm');
    
    forms.forEach(form => {
        const formId = form.id;
        const storageKey = 'zebestcake_form_' + formId;
        
        // Restaurer les données sauvegardées
        try {
            const savedData = localStorage.getItem(storageKey);
            if (savedData) {
                const data = JSON.parse(savedData);
                Object.keys(data).forEach(key => {
                    const field = form.querySelector(`[name="${key}"]`);
                    if (field && data[key]) {
                        field.value = data[key];
                    }
                });
            }
        } catch (e) {
            console.warn('Erreur lors de la restauration des données du formulaire:', e);
        }
        
        // Sauvegarder automatiquement les modifications
        const fields = form.querySelectorAll('input, textarea, select');
        fields.forEach(field => {
            field.addEventListener('input', debounce(() => {
                saveFormData(form, storageKey);
            }, 1000));
        });
        
        // Nettoyer la sauvegarde après soumission réussie
        form.addEventListener('submit', () => {
            setTimeout(() => {
                localStorage.removeItem(storageKey);
            }, 5000); // Attendre 5s pour s'assurer que l'envoi a réussi
        });
    });
}

// Sauvegarder les données du formulaire
function saveFormData(form, storageKey) {
    if (typeof Storage === 'undefined') return;
    
    try {
        const formData = new FormData(form);
        const data = {};
        
        for (let [key, value] of formData.entries()) {
            if (value.trim()) { // Ne sauvegarder que les champs non vides
                data[key] = value;
            }
        }
        
        localStorage.setItem(storageKey, JSON.stringify(data));
    } catch (e) {
        console.warn('Erreur lors de la sauvegarde du formulaire:', e);
    }
}

// Fonction utilitaire de debounce
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Fonction pour nettoyer les sauvegardes anciennes
function cleanOldFormData() {
    if (typeof Storage === 'undefined') return;
    
    try {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.startsWith('zebestcake_form_')) {
                // Nettoyer les sauvegardes de plus de 7 jours
                const item = localStorage.getItem(key + '_timestamp');
                if (item) {
                    const timestamp = parseInt(item);
                    const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
                    if (timestamp < weekAgo) {
                        localStorage.removeItem(key);
                        localStorage.removeItem(key + '_timestamp');
                    }
                }
            }
        });
    } catch (e) {
        console.warn('Erreur lors du nettoyage des données:', e);
    }
}

// Nettoyer les anciennes données au chargement
cleanOldFormData();

// Validation spéciale pour les champs mobiles
if (window.ZeBestCake && window.ZeBestCake.isMobile && window.ZeBestCake.isMobile()) {
    // Ajuster les validations pour mobile
    document.addEventListener('focusin', function(e) {
        if (e.target.matches('input, textarea, select')) {
            // Scroll vers le champ sur mobile pour éviter que le clavier cache le champ
            setTimeout(() => {
                e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 300);
        }
    });
}

// Export des fonctions pour les autres modules
window.ZeBestCake = window.ZeBestCake || {};
Object.assign(window.ZeBestCake, {
    validateField,
    showFieldError,
    clearFieldError,
    calculateEstimatedPrice,
    updateEstimatedPrice,
    handleOrderSubmission,
    handleContactSubmission
});