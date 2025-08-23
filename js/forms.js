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
// Fix spécifique pour le problème du date picker mobile
// À ajouter dans forms.js ou comme script séparé

document.addEventListener('DOMContentLoaded', function() {
    fixMobileDatePicker();
});

function fixMobileDatePicker() {
    const dateInputs = document.querySelectorAll('input[type="date"]');
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    
    if (!isMobile) return; // Pas besoin du fix sur desktop
    
    dateInputs.forEach(dateInput => {
        // Fix spécial pour le problème de fermeture immédiate
        let isPickerOpen = false;
        let touchStartTime = 0;
        
        // Méthode 1: Empêcher la fermeture immédiate sur iOS
        if (isIOS) {
            // Supprimer tous les événements existants sur le champ
            const newDateInput = dateInput.cloneNode(true);
            dateInput.parentNode.replaceChild(newDateInput, dateInput);
            
            // Réappliquer les attributs nécessaires
            const today = new Date();
            const minDate = new Date(today.getTime() + 48 * 60 * 60 * 1000);
            const minDateString = minDate.toISOString().split('T')[0];
            newDateInput.min = minDateString;
            
            // Nouvelle approche pour iOS
            newDateInput.addEventListener('touchstart', function(e) {
                e.preventDefault();
                e.stopPropagation();
                touchStartTime = Date.now();
                isPickerOpen = true;
                
                // Focus avec délai pour iOS
                setTimeout(() => {
                    this.focus();
                    this.click();
                }, 50);
            }, { passive: false });
            
            newDateInput.addEventListener('touchend', function(e) {
                e.preventDefault();
                const touchDuration = Date.now() - touchStartTime;
                
                if (touchDuration < 300 && isPickerOpen) {
                    // Touch rapide, ouvrir le picker
                    setTimeout(() => {
                        this.focus();
                        if (this.showPicker) {
                            this.showPicker();
                        } else {
                            this.click();
                        }
                    }, 100);
                }
            }, { passive: false });
            
            // Empêcher le blur immédiat
            newDateInput.addEventListener('blur', function(e) {
                if (isPickerOpen) {
                    setTimeout(() => {
                        if (document.activeElement !== this) {
                            isPickerOpen = false;
                        }
                    }, 300);
                }
            });
            
            // Détecter quand la valeur change (picker fermé)
            newDateInput.addEventListener('change', function(e) {
                isPickerOpen = false;
                // Validation de la date
                validateSelectedDate(this);
            });
        } 
        // Méthode 2: Fix pour Android et autres mobiles
        else {
            // Wrapper pour améliorer l'interaction
            const wrapper = document.createElement('div');
            wrapper.className = 'date-input-wrapper';
            wrapper.style.cssText = `
                position: relative;
                width: 100%;
                display: block;
            `;
            
            dateInput.parentNode.insertBefore(wrapper, dateInput);
            wrapper.appendChild(dateInput);
            
            // Ajouter un overlay tactile pour Android
            const touchOverlay = document.createElement('div');
            touchOverlay.className = 'date-touch-overlay';
            touchOverlay.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                z-index: 5;
                cursor: pointer;
                background: transparent;
            `;
            
            wrapper.appendChild(touchOverlay);
            
            // Gérer l'interaction via l'overlay
            touchOverlay.addEventListener('touchstart', function(e) {
                e.preventDefault();
                touchStartTime = Date.now();
            }, { passive: false });
            
            touchOverlay.addEventListener('touchend', function(e) {
                e.preventDefault();
                const touchDuration = Date.now() - touchStartTime;
                
                if (touchDuration < 500) {
                    dateInput.focus();
                    setTimeout(() => {
                        dateInput.click();
                        if (dateInput.showPicker) {
                            dateInput.showPicker();
                        }
                    }, 50);
                }
            }, { passive: false });
            
            // Validation quand la valeur change
            dateInput.addEventListener('change', function(e) {
                validateSelectedDate(this);
            });
        }
        
        // Méthode 3: Fallback avec un input text personnalisé
        createDatePickerFallback(dateInput);
    });
}

// Validation de la date sélectionnée
function validateSelectedDate(dateInput) {
    const selectedDate = new Date(dateInput.value);
    const today = new Date();
    const minDate = new Date(today.getTime() + 48 * 60 * 60 * 1000);
    
    if (selectedDate < minDate) {
        alert('Veuillez sélectionner une date au moins 48h à l\'avance.');
        dateInput.value = '';
        setTimeout(() => {
            dateInput.focus();
        }, 100);
        return false;
    }
    
    // Feedback visuel positif
    dateInput.style.borderColor = '#4CAF50';
    dateInput.style.backgroundColor = '#f8fff8';
    
    return true;
}

// Fallback avec un input text et sélection manuelle
function createDatePickerFallback(originalInput) {
    // Cette fonction crée une alternative si le date picker natif ne fonctionne pas
    
    const fallbackButton = document.createElement('button');
    fallbackButton.type = 'button';
    fallbackButton.className = 'date-fallback-button';
    fallbackButton.textContent = '📅 Choisir une date';
    fallbackButton.style.cssText = `
        display: none;
        width: 100%;
        padding: 1rem;
        border: 2px solid #FFE4E1;
        border-radius: 15px;
        background: white;
        font-size: 16px;
        font-family: inherit;
        color: var(--primary-color);
        cursor: pointer;
        margin-top: 0.5rem;
    `;
    
    originalInput.parentNode.appendChild(fallbackButton);
    
    // Si le date picker natif ne fonctionne pas après 3 tentatives
    let failCount = 0;
    
    originalInput.addEventListener('focus', function() {
        setTimeout(() => {
            if (!this.value) {
                failCount++;
                if (failCount >= 3) {
                    // Montrer le fallback
                    this.style.display = 'none';
                    fallbackButton.style.display = 'block';
                }
            }
        }, 1000);
    });
    
    fallbackButton.addEventListener('click', function() {
        showDatePickerModal(originalInput);
    });
}

// Modal de sélection de date personnalisée
function showDatePickerModal(dateInput) {
    const modal = document.createElement('div');
    modal.className = 'date-picker-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        padding: 1rem;
    `;
    
    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background: white;
        border-radius: 15px;
        padding: 2rem;
        max-width: 350px;
        width: 100%;
        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
    `;
    
    const title = document.createElement('h3');
    title.textContent = 'Choisir une date de livraison';
    title.style.cssText = `
        color: var(--primary-color);
        text-align: center;
        margin-bottom: 1rem;
    `;
    
    modalContent.appendChild(title);
    
    // Créer un sélecteur simple
    const today = new Date();
    const datesContainer = document.createElement('div');
    datesContainer.style.cssText = `
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 0.5rem;
        margin-bottom: 1rem;
    `;
    
    // Générer les 14 prochains jours (en commençant par après-demain)
    for (let i = 2; i <= 15; i++) {
        const date = new Date(today.getTime() + i * 24 * 60 * 60 * 1000);
        const dateButton = document.createElement('button');
        dateButton.type = 'button';
        dateButton.textContent = date.toLocaleDateString('fr-FR', { 
            weekday: 'short', 
            day: 'numeric', 
            month: 'short' 
        });
        dateButton.style.cssText = `
            padding: 0.8rem;
            border: 2px solid #FFE4E1;
            border-radius: 8px;
            background: white;
            cursor: pointer;
            font-size: 0.9rem;
            transition: all 0.2s ease;
        `;
        
        dateButton.addEventListener('click', function() {
            dateInput.value = date.toISOString().split('T')[0];
            validateSelectedDate(dateInput);
            document.body.removeChild(modal);
        });
        
        dateButton.addEventListener('touchstart', function() {
            this.style.background = 'var(--accent-color)';
        });
        
        dateButton.addEventListener('touchend', function() {
            this.style.background = 'white';
        });
        
        datesContainer.appendChild(dateButton);
    }
    
    modalContent.appendChild(datesContainer);
    
    const closeButton = document.createElement('button');
    closeButton.type = 'button';
    closeButton.textContent = 'Annuler';
    closeButton.style.cssText = `
        width: 100%;
        padding: 1rem;
        border: 2px solid var(--primary-color);
        border-radius: 8px;
        background: white;
        color: var(--primary-color);
        cursor: pointer;
        font-weight: bold;
    `;
    
    closeButton.addEventListener('click', function() {
        document.body.removeChild(modal);
    });
    
    modalContent.appendChild(closeButton);
    modal.appendChild(modalContent);
    
    // Fermer en cliquant en dehors
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    });
    
    document.body.appendChild(modal);
}

// CSS supplémentaire pour les fixes
const datePickerStyles = document.createElement('style');
datePickerStyles.textContent = `
    /* Améliorer la visibilité des date inputs sur mobile */
    @media (max-width: 768px) {
        input[type="date"] {
            position: relative;
            z-index: 1;
            -webkit-appearance: none;
            -moz-appearance: none;
            appearance: none;
            background: white;
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='%23FF69B4' stroke-width='2'%3E%3Crect x='3' y='4' width='18' height='18' rx='2' ry='2'%3E%3C/rect%3E%3Cline x1='16' y1='2' x2='16' y2='6'%3E%3C/line%3E%3Cline x1='8' y1='2' x2='8' y2='6'%3E%3C/line%3E%3Cline x1='3' y1='10' x2='21' y2='10'%3E%3C/line%3E%3C/svg%3E");
            background-repeat: no-repeat;
            background-position: right 1rem center;
            padding-right: 3rem;
        }
        
        input[type="date"]:focus {
            outline: 3px solid var(--primary-color);
            outline-offset: 2px;
            border-color: var(--primary-color);
            z-index: 999;
        }
        
        /* Style pour le wrapper */
        .date-input-wrapper {
            position: relative;
            isolation: isolate;
        }
        
        .date-touch-overlay {
            border-radius: 15px;
        }
        
        /* Animation pour le feedback tactile */
        input[type="date"]:active,
        .date-touch-overlay:active {
            transform: scale(0.98);
            transition: transform 0.1s ease;
        }
        
        /* Style pour les boutons de la modal */
        .date-picker-modal button:hover {
            background: var(--accent-color) !important;
            transform: scale(1.02);
        }
    }
    
    /* Améliorer la lisibilité sur tous les appareils */
    input[type="date"]::-webkit-calendar-picker-indicator {
        opacity: 0.8;
        cursor: pointer;
    }
    
    input[type="date"]::-webkit-inner-spin-button,
    input[type="date"]::-webkit-outer-spin-button {
        -webkit-appearance: none;
        margin: 0;
    }
`;

document.head.appendChild(datePickerStyles);

// Export pour utilisation dans d'autres modules
window.ZeBestCake = window.ZeBestCake || {};
window.ZeBestCake.fixMobileDatePicker = fixMobileDatePicker;