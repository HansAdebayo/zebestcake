// Animations et effets visuels pour ZeBestCake

document.addEventListener('DOMContentLoaded', function() {
    initializeScrollAnimations();
    initializeHoverEffects();
    initializeTypingEffect();
    initializeCounterAnimations();
});

// Animations au scroll avec Intersection Observer
function initializeScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                
                // Animation spéciale pour les cartes produits
                if (entry.target.classList.contains('product-card')) {
                    animateProductCard(entry.target);
                }
                
                // Ne plus observer l'élément une fois animé (optimisation)
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observer tous les éléments à animer
    const elementsToAnimate = document.querySelectorAll([
        '.fade-in',
        '.section-title',
        '.product-card',
        '.order-option',
        '.about-text',
        '.about-image',
        '.contact-info',
        '.contact-form',
        '.order-form-container'
    ].join(', '));

    elementsToAnimate.forEach(el => {
        observer.observe(el);
    });

    // Animation progressive des cartes produits
    const productCards = document.querySelectorAll('.product-card');
    productCards.forEach((card, index) => {
        card.style.transitionDelay = `${index * 0.2}s`;
    });
}

// Animation spéciale pour les cartes produits
function animateProductCard(card) {
    const image = card.querySelector('.product-image');
    const title = card.querySelector('h3');
    const description = card.querySelector('p');
    const price = card.querySelector('.product-price');
    const button = card.querySelector('.product-button');

    // Animation en cascade
    setTimeout(() => {
        if (image) image.style.transform = 'scale(1.05)';
    }, 100);

    setTimeout(() => {
        if (title) title.style.transform = 'translateY(0)';
    }, 200);

    setTimeout(() => {
        if (description) description.style.opacity = '1';
    }, 300);

    setTimeout(() => {
        if (price) price.style.transform = 'scale(1.1)';
    }, 400);

    setTimeout(() => {
        if (button) button.style.transform = 'translateY(0)';
    }, 500);

    // Reset après animation
    setTimeout(() => {
        if (image) image.style.transform = '';
        if (price) price.style.transform = '';
    }, 1000);
}

// Effets au survol améliorés
function initializeHoverEffects() {
    // Effet de survol pour tous les boutons
    document.querySelectorAll('button, .cta-button, .product-button').forEach(button => {
        button.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-3px) scale(1.02)';
        });
        
        button.addEventListener('mouseleave', function() {
            this.style.transform = '';
        });

        // Effet de clic
        button.addEventListener('mousedown', function() {
            this.style.transform = 'translateY(-1px) scale(0.98)';
        });

        button.addEventListener('mouseup', function() {
            this.style.transform = 'translateY(-3px) scale(1.02)';
        });
    });

    // Effet parallaxe pour les images produits
    document.querySelectorAll('.product-image, .about-image').forEach(img => {
        img.addEventListener('mousemove', function(e) {
            const rect = this.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const rotateX = (y - centerY) / 10;
            const rotateY = (centerX - x) / 10;
            
            this.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.05)`;
        });

        img.addEventListener('mouseleave', function() {
            this.style.transform = '';
        });
    });

    // Effet de vague sur les cartes
    document.querySelectorAll('.product-card, .order-option, .contact-item').forEach(card => {
        card.addEventListener('mouseenter', function() {
            createRippleEffect(this);
        });
    });
}

// Créer un effet de vague (ripple)
function createRippleEffect(element) {
    const ripple = document.createElement('div');
    ripple.style.cssText = `
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 105, 180, 0.3);
        transform: scale(0);
        animation: ripple 0.6s linear;
        pointer-events: none;
        top: 50%;
        left: 50%;
        width: 20px;
        height: 20px;
        margin-left: -10px;
        margin-top: -10px;
    `;

    element.style.position = 'relative';
    element.style.overflow = 'hidden';
    element.appendChild(ripple);

    setTimeout(() => {
        ripple.remove();
    }, 600);
}

// Effet de frappe pour le titre hero
function initializeTypingEffect() {
    const heroTitle = document.querySelector('.hero h1');
    if (!heroTitle) return;

    const text = heroTitle.textContent;
    heroTitle.textContent = '';
    heroTitle.style.opacity = '1';

    setTimeout(() => {
        let i = 0;
        const typeWriter = () => {
            if (i < text.length) {
                heroTitle.textContent += text.charAt(i);
                i++;
                setTimeout(typeWriter, 150);
            } else {
                // Ajouter un curseur clignotant temporaire
                const cursor = document.createElement('span');
                cursor.textContent = '|';
                cursor.style.animation = 'blink 1s infinite';
                heroTitle.appendChild(cursor);

                setTimeout(() => {
                    cursor.remove();
                }, 3000);
            }
        };
        typeWriter();
    }, 1000);
}

// Animations de compteur pour les statistiques (si vous en ajoutez)
function initializeCounterAnimations() {
    const counters = document.querySelectorAll('[data-count]');
    
    counters.forEach(counter => {
        const target = parseInt(counter.dataset.count);
        const duration = 2000;
        const increment = target / (duration / 16);
        let current = 0;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const timer = setInterval(() => {
                        current += increment;
                        counter.textContent = Math.floor(current);

                        if (current >= target) {
                            counter.textContent = target;
                            clearInterval(timer);
                        }
                    }, 16);

                    observer.unobserve(counter);
                }
            });
        });

        observer.observe(counter);
    });
}

// Animation de chargement pour le formulaire
function showFormLoading(form) {
    const submitButton = form.querySelector('.submit-button');
    const originalContent = submitButton.innerHTML;
    
    submitButton.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
            <div class="loading-spinner"></div>
            <span>Envoi en cours...</span>
        </div>
    `;
    submitButton.disabled = true;

    // Ajouter les styles du spinner s'ils n'existent pas
    if (!document.querySelector('#loading-spinner-styles')) {
        const style = document.createElement('style');
        style.id = 'loading-spinner-styles';
        style.textContent = `
            .loading-spinner {
                width: 20px;
                height: 20px;
                border: 2px solid rgba(255, 255, 255, 0.3);
                border-radius: 50%;
                border-top-color: white;
                animation: spin 1s ease-in-out infinite;
            }
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
            @keyframes blink {
                0%, 50% { opacity: 1; }
                51%, 100% { opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }

    return originalContent;
}

// Animation de succès pour le formulaire
function showFormSuccess(form, message = 'Envoyé avec succès!') {
    const submitButton = form.querySelector('.submit-button');
    
    submitButton.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
            <span>✅</span>
            <span>${message}</span>
        </div>
    `;
    submitButton.style.background = 'linear-gradient(135deg, #4CAF50, #45a049)';
    
    // Animation de succès
    submitButton.style.animation = 'pulse 0.5s ease-in-out';
}

// Animation d'erreur pour le formulaire
function showFormError(form, message = 'Erreur lors de l\'envoi') {
    const submitButton = form.querySelector('.submit-button');
    
    submitButton.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
            <span>❌</span>
            <span>${message}</span>
        </div>
    `;
    submitButton.style.background = 'linear-gradient(135deg, #ff6b6b, #ff5252)';
    
    // Animation de secousse
    submitButton.style.animation = 'shake 0.5s ease-in-out';
}

// Réinitialiser le bouton du formulaire
function resetFormButton(form, originalContent) {
    const submitButton = form.querySelector('.submit-button');
    
    setTimeout(() => {
        submitButton.innerHTML = originalContent;
        submitButton.style.background = '';
        submitButton.style.animation = '';
        submitButton.disabled = false;
    }, 3000);
}

// Ajouter les animations CSS manquantes
const additionalStyles = document.createElement('style');
additionalStyles.textContent = `
    @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.05); }
        100% { transform: scale(1); }
    }
    
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-5px); }
        75% { transform: translateX(5px); }
    }
    
    @keyframes ripple {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
`;
document.head.appendChild(additionalStyles);

// Export des fonctions pour les autres modules
window.ZeBestCake = window.ZeBestCake || {};
Object.assign(window.ZeBestCake, {
    showFormLoading,
    showFormSuccess,
    showFormError,
    resetFormButton,
    createRippleEffect
});