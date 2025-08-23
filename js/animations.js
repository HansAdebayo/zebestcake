// Animations optimisées pour mobile - animations.js

document.addEventListener('DOMContentLoaded', function() {
    const isMobile = detectMobileDevice();
    
    if (isMobile) {
        initializeMobileOptimizedAnimations();
    } else {
        initializeDesktopAnimations();
    }
});

// Détection mobile
function detectMobileDevice() {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
    const screenSize = window.innerWidth <= 768;
    const touchDevice = 'ontouchstart' in window;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    return mobileRegex.test(userAgent) || screenSize || touchDevice || prefersReducedMotion;
}

// Animations optimisées pour mobile
function initializeMobileOptimizedAnimations() {
    // Désactiver la plupart des animations sur mobile
    disableCostlyAnimations();
    
    // Garder seulement les animations essentielles
    initializeEssentialAnimations();
    
    // Optimiser les transitions
    optimizeTransitionsForMobile();
}

// Animations complètes pour desktop
function initializeDesktopAnimations() {
    initializeScrollAnimations();
    initializeHoverEffects();
    initializeTypingEffect();
    initializeCounterAnimations();
}

// Désactiver les animations coûteuses sur mobile
function disableCostlyAnimations() {
    // Ajouter des styles pour désactiver les animations
    const mobileStyles = document.createElement('style');
    mobileStyles.id = 'mobile-animation-optimizations';
    mobileStyles.textContent = `
        /* Désactiver les animations coûteuses sur mobile */
        @media (max-width: 768px), (prefers-reduced-motion: reduce) {
            .hero::before {
                display: none !important;
                animation: none !important;
            }
            
            .hero-content {
                animation: none !important;
                opacity: 1 !important;
                transform: none !important;
            }
            
            .fade-in {
                opacity: 1 !important;
                transform: none !important;
                transition: none !important;
            }
            
            .product-card,
            .order-option,
            .section-title,
            .about-text,
            .about-image,
            .contact-info,
            .contact-form,
            .order-form-container {
                opacity: 1 !important;
                transform: none !important;
                transition: opacity 0.1s ease !important;
            }
            
            /* Simplifier les hovers sur mobile */
            .product-card:hover,
            .order-option:hover,
            .contact-item:hover {
                transform: none !important;
            }
            
            .product-card:hover .product-image {
                transform: none !important;
            }
            
            /* Désactiver le parallax */
            .hero {
                transform: none !important;
            }
            
            /* Optimiser les boutons */
            .cta-button:hover,
            .product-button:hover,
            .submit-button:hover {
                transform: none !important;
                box-shadow: var(--shadow-light) !important;
            }
            
            /* Désactiver les particules flottantes */
            .floating-particle,
            [class*="float"] {
                display: none !important;
            }
        }
    `;
    
    document.head.appendChild(mobileStyles);
}

// Animations essentielles pour mobile
function initializeEssentialAnimations() {
    // Garder seulement les animations critiques pour l'UX
    
    // Animation de navigation mobile
    initializeMobileNavigation();
    
    // Feedback tactile simple
    initializeMobileFeedback();
    
    // Animation de chargement des formulaires (simplifiée)
    initializeFormAnimations();
}

// Navigation mobile avec animations optimisées
function initializeMobileNavigation() {
    const menuToggle = document.getElementById('menuToggle');
    const navLinks = document.getElementById('navLinks');
    
    if (menuToggle && navLinks) {
        // Animation simple et performante pour le menu
        menuToggle.addEventListener('click', function() {
            const isActive = navLinks.classList.contains('active');
            
            if (isActive) {
                navLinks.style.transform = 'translateX(-100%)';
                setTimeout(() => {
                    navLinks.classList.remove('active');
                }, 150);
            } else {
                navLinks.classList.add('active');
                setTimeout(() => {
                    navLinks.style.transform = 'translateX(0)';
                }, 10);
            }
        });
    }
}

// Feedback tactile simple pour mobile
function initializeMobileFeedback() {
    // Ajouter un feedback visuel simple aux éléments interactifs
    const interactiveElements = document.querySelectorAll('.cta-button, .product-button, .submit-button, button');
    
    interactiveElements.forEach(element => {
        // Utiliser les events tactiles
        element.addEventListener('touchstart', function() {
            this.style.opacity = '0.8';
            this.style.transform = 'scale(0.95)';
        }, { passive: true });
        
        element.addEventListener('touchend', function() {
            this.style.opacity = '';
            this.style.transform = '';
        }, { passive: true });
        
        element.addEventListener('touchcancel', function() {
            this.style.opacity = '';
            this.style.transform = '';
        }, { passive: true });
    });
}

// Animations de formulaires simplifiées pour mobile
function initializeFormAnimations() {
    // Animation de loading simplifiée
    window.showFormLoadingMobile = function(form) {
        const submitButton = form.querySelector('.submit-button');
        const originalContent = submitButton.innerHTML;
        
        submitButton.innerHTML = `
            <span style="opacity: 0.7;">⏳ Envoi...</span>
        `;
        submitButton.disabled = true;
        submitButton.style.opacity = '0.7';
        
        return originalContent;
    };
    
    // Animation de succès simplifiée
    window.showFormSuccessMobile = function(form, message = 'Envoyé!') {
        const submitButton = form.querySelector('.submit-button');
        
        submitButton.innerHTML = `
            <span style="color: white;">✅ ${message}</span>
        `;
        submitButton.style.background = '#4CAF50';
        submitButton.style.opacity = '1';
    };
    
    // Animation d'erreur simplifiée
    window.showFormErrorMobile = function(form, message = 'Erreur') {
        const submitButton = form.querySelector('.submit-button');
        
        submitButton.innerHTML = `
            <span style="color: white;">❌ ${message}</span>
        `;
        submitButton.style.background = '#ff6b6b';
        submitButton.style.opacity = '1';
    };
}

// Optimiser les transitions pour mobile
function optimizeTransitionsForMobile() {
    // Réduire la durée des transitions
    document.documentElement.style.setProperty('--transition', 'all 0.1s ease');
    
    // Utiliser transform au lieu de propriétés layout-changing
    const optimizationStyles = document.createElement('style');
    optimizationStyles.textContent = `
        @media (max-width: 768px) {
            /* Optimiser les transitions pour mobile */
            * {
                transition-duration: 0.1s !important;
            }
            
            /* Utiliser will-change pour les éléments animés */
            .nav-links {
                will-change: transform;
            }
            
            .menu-toggle {
                will-change: transform;
                -webkit-tap-highlight-color: transparent;
            }
            
            /* Optimiser les modals */
            .modal-content {
                will-change: transform;
                transition: transform 0.2s ease !important;
            }
            
            /* Désactiver les animations au scroll sur mobile */
            .fade-in,
            .product-card,
            .order-option {
                will-change: auto;
            }
        }
    `;
    
    document.head.appendChild(optimizationStyles);
}

// Animations au scroll optimisées pour desktop seulement
function initializeScrollAnimations() {
    if (detectMobileDevice()) return; // Pas d'animations scroll sur mobile
    
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                
                // Animation spéciale pour les cartes produits (desktop seulement)
                if (entry.target.classList.contains('product-card')) {
                    animateProductCard(entry.target);
                }
                
                // Ne plus observer l'élément une fois animé
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observer tous les éléments à animer (desktop seulement)
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

// Animation spéciale pour les cartes produits (desktop seulement)
function animateProductCard(card) {
    if (detectMobileDevice()) return;
    
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

// Effets au survol (desktop seulement)
function initializeHoverEffects() {
    if (detectMobileDevice()) return;
    
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

    // Effet parallaxe pour les images produits (desktop seulement)
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

    // Effet de vague sur les cartes (desktop seulement)
    document.querySelectorAll('.product-card, .order-option, .contact-item').forEach(card => {
        card.addEventListener('mouseenter', function() {
            createRippleEffect(this);
        });
    });
}

// Créer un effet de vague (ripple) - desktop seulement
function createRippleEffect(element) {
    if (detectMobileDevice()) return;
    
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

// Effet de frappe pour le titre hero (desktop seulement)
function initializeTypingEffect() {
    if (detectMobileDevice()) return;
    
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

// Animations de compteur pour les statistiques (desktop seulement)
function initializeCounterAnimations() {
    if (detectMobileDevice()) return;
    
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

// Animation de chargement adaptative pour le formulaire
function showFormLoading(form) {
    if (detectMobileDevice()) {
        return window.showFormLoadingMobile ? window.showFormLoadingMobile(form) : showFormLoadingDesktop(form);
    } else {
        return showFormLoadingDesktop(form);
    }
}

function showFormLoadingDesktop(form) {
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

// Animation de succès adaptative pour le formulaire
function showFormSuccess(form, message = 'Envoyé avec succès!') {
    if (detectMobileDevice() && window.showFormSuccessMobile) {
        window.showFormSuccessMobile(form, message);
    } else {
        showFormSuccessDesktop(form, message);
    }
}

function showFormSuccessDesktop(form, message) {
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

// Animation d'erreur adaptative pour le formulaire
function showFormError(form, message = 'Erreur lors de l\'envoi') {
    if (detectMobileDevice() && window.showFormErrorMobile) {
        window.showFormErrorMobile(form, message);
    } else {
        showFormErrorDesktop(form, message);
    }
}

function showFormErrorDesktop(form, message) {
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
        submitButton.style.opacity = '';
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
    
    /* Optimisations spécifiques pour mobile */
    @media (max-width: 768px) {
        /* Désactiver les animations de pulse/shake sur mobile */
        .submit-button {
            animation: none !important;
        }
        
        /* Simplifier les transitions sur mobile */
        button, .cta-button, .product-button, .submit-button {
            transition: opacity 0.1s ease, background-color 0.1s ease !important;
        }
        
        /* Optimiser les performances tactiles */
        .cta-button, .product-button, .submit-button {
            -webkit-tap-highlight-color: rgba(255, 105, 180, 0.3);
            -webkit-touch-callout: none;
            -webkit-user-select: none;
            user-select: none;
        }
    }
    
    /* Préférence utilisateur pour mouvement réduit */
    @media (prefers-reduced-motion: reduce) {
        * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
        }
        
        .hero::before,
        .loading-spinner,
        [class*="float"] {
            animation: none !important;
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
    createRippleEffect,
    detectMobileDevice
});