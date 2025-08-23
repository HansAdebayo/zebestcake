// Corrections pour les problèmes mobiles - main.js

document.addEventListener('DOMContentLoaded', function() {
    // Détecter le type d'appareil dès le début
    const isMobileDevice = detectMobileDevice();
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    
    // Optimiser selon l'appareil
    if (isMobileDevice) {
        optimizeForMobile();
    }
    
    initializeNavigation();
    initializeScrollEffects();
    initializeSmoothScroll();
    initializeDateValidation();
    
    // Ne créer les particules que sur desktop
    if (!isMobileDevice) {
        createFloatingParticles();
    }
    
    initializeImageFallbacks();
    
    // Fix spécial pour iOS
    if (isIOS) {
        fixIOSViewport();
        fixIOSDatePicker();
    }
});

// Fonction améliorée pour détecter les mobiles
function detectMobileDevice() {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
    const screenSize = window.innerWidth <= 768;
    const touchDevice = 'ontouchstart' in window;
    
    return mobileRegex.test(userAgent) || screenSize || touchDevice;
}

// Optimisations spécifiques pour mobile
function optimizeForMobile() {
    // Désactiver les animations coûteuses
    document.documentElement.style.setProperty('--transition', 'all 0.1s ease');
    
    // Ajouter une classe mobile au body
    document.body.classList.add('mobile-device');
    
    // Réduire la fréquence des événements scroll
    let ticking = false;
    const originalScrollHandler = window.addEventListener;
    
    // Override scroll events pour mobile
    window.addEventListener = function(event, handler, options) {
        if (event === 'scroll' && detectMobileDevice()) {
            const throttledHandler = function() {
                if (!ticking) {
                    requestAnimationFrame(function() {
                        handler();
                        ticking = false;
                    });
                    ticking = true;
                }
            };
            return originalScrollHandler.call(this, event, throttledHandler, options);
        }
        return originalScrollHandler.call(this, event, handler, options);
    };
}

// Fix pour le viewport iOS
function fixIOSViewport() {
    // Fix pour la hauteur du viewport sur iOS
    function setVH() {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
    }
    
    setVH();
    window.addEventListener('resize', setVH);
    window.addEventListener('orientationchange', () => {
        setTimeout(setVH, 100);
    });
}

// Fix spécial pour le sélecteur de date iOS
function fixIOSDatePicker() {
    const dateInputs = document.querySelectorAll('input[type="date"]');
    
    dateInputs.forEach(input => {
        // Créer un wrapper pour le date picker
        const wrapper = document.createElement('div');
        wrapper.className = 'date-picker-wrapper';
        wrapper.style.cssText = `
            position: relative;
            width: 100%;
        `;
        
        input.parentNode.insertBefore(wrapper, input);
        wrapper.appendChild(input);
        
        // Améliorer l'interaction tactile
        input.addEventListener('touchstart', function(e) {
            e.stopPropagation();
            this.focus();
            this.showPicker && this.showPicker();
        }, { passive: false });
        
        input.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            this.focus();
            
            // Force l'ouverture du calendrier sur iOS
            if (this.showPicker) {
                this.showPicker();
            } else {
                // Fallback pour les anciens navigateurs
                this.type = 'text';
                setTimeout(() => {
                    this.type = 'date';
                    this.focus();
                }, 10);
            }
        }, { passive: false });
        
        // Empêcher la fermeture immédiate
        input.addEventListener('blur', function(e) {
            setTimeout(() => {
                if (document.activeElement !== this) {
                    // Le champ a vraiment perdu le focus
                }
            }, 200);
        });
        
        // Améliorer la visibilité
        input.style.cssText += `
            position: relative;
            z-index: 999;
            background: white;
            -webkit-user-select: none;
            user-select: none;
            cursor: pointer;
        `;
    });
}

// Gestion des fallbacks d'images (optimisée)
function initializeImageFallbacks() {
    const images = document.querySelectorAll('.product-image img, .about-image img');
    
    images.forEach(img => {
        img.addEventListener('error', function() {
            this.style.display = 'none';
            const fallback = this.nextElementSibling;
            if (fallback && fallback.classList.contains('emoji-fallback')) {
                fallback.style.display = 'block';
            }
        });
        
        // Chargement lazy pour mobile
        if (detectMobileDevice() && 'IntersectionObserver' in window) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        if (img.dataset.src) {
                            img.src = img.dataset.src;
                            img.removeAttribute('data-src');
                        }
                        observer.unobserve(img);
                    }
                });
            });
            observer.observe(img);
        }
    });
}

// Navigation mobile optimisée
function initializeNavigation() {
    const menuToggle = document.getElementById('menuToggle');
    const navLinks = document.getElementById('navLinks');

    if (menuToggle && navLinks) {
        // Utiliser touch events pour mobile
        const isTouchDevice = 'ontouchstart' in window;
        const eventType = isTouchDevice ? 'touchstart' : 'click';
        
        menuToggle.addEventListener(eventType, (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            const isActive = navLinks.classList.contains('active');
            
            if (isActive) {
                closeMenu();
            } else {
                openMenu();
            }
        }, { passive: false });

        function openMenu() {
            navLinks.classList.add('active');
            menuToggle.innerHTML = '✕';
            menuToggle.setAttribute('aria-expanded', 'true');
            
            // Empêcher le scroll du body
            document.body.style.overflow = 'hidden';
        }
        
        function closeMenu() {
            navLinks.classList.remove('active');
            menuToggle.innerHTML = '☰';
            menuToggle.setAttribute('aria-expanded', 'false');
            
            // Réactiver le scroll
            document.body.style.overflow = '';
        }

        // Fermer le menu lors du clic sur les liens
        navLinks.addEventListener(eventType, (e) => {
            if (e.target.tagName === 'A') {
                closeMenu();
            }
        });

        // Fermer lors du clic en dehors (optimisé pour mobile)
        document.addEventListener(eventType, (e) => {
            if (!menuToggle.contains(e.target) && !navLinks.contains(e.target)) {
                if (navLinks.classList.contains('active')) {
                    closeMenu();
                }
            }
        });
    }
}

// Effets de scroll optimisés pour mobile
function initializeScrollEffects() {
    const header = document.getElementById('header');
    let lastScrollY = window.scrollY;
    let ticking = false;

    function updateHeader() {
        const currentScrollY = window.scrollY;

        // Header background effect
        if (currentScrollY > 100) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }

        // Sur mobile, désactiver le hide/show du header
        if (!detectMobileDevice()) {
            if (currentScrollY > lastScrollY && currentScrollY > 200) {
                header.style.transform = 'translateY(-100%)';
            } else {
                header.style.transform = 'translateY(0)';
            }
        }

        lastScrollY = currentScrollY;
        ticking = false;
    }

    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(updateHeader);
            ticking = true;
        }
    }, { passive: true });
}

// Smooth scroll amélioré pour mobile
function initializeSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            
            if (target) {
                const headerHeight = document.getElementById('header').offsetHeight;
                const targetPosition = target.offsetTop - headerHeight - 20;
                
                // Sur mobile, utiliser un scroll plus rapide
                const behavior = detectMobileDevice() ? 'auto' : 'smooth';
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: behavior
                });

                // Fermer le menu mobile si ouvert
                const navLinks = document.getElementById('navLinks');
                const menuToggle = document.getElementById('menuToggle');
                if (navLinks && menuToggle && navLinks.classList.contains('active')) {
                    navLinks.classList.remove('active');
                    menuToggle.innerHTML = '☰';
                    document.body.style.overflow = '';
                }
            }
        });
    });
}

// Validation de date améliorée pour mobile
function initializeDateValidation() {
    const dateInput = document.getElementById('orderDate');
    if (dateInput) {
        // Définir la date minimum (48h à l'avance)
        const today = new Date();
        const minDate = new Date(today.getTime() + 48 * 60 * 60 * 1000);
        const minDateString = minDate.toISOString().split('T')[0];
        
        dateInput.min = minDateString;
        dateInput.setAttribute('min', minDateString);
        
        // Pour mobile, ajouter un placeholder plus explicite
        if (detectMobileDevice()) {
            dateInput.placeholder = 'Choisir une date (48h min)';
            
            // Ajouter un listener pour les changements
            dateInput.addEventListener('change', function(e) {
                const selectedDate = new Date(this.value);
                const minDateTime = new Date(minDateString);
                
                if (selectedDate < minDateTime) {
                    alert('Veuillez sélectionner une date au moins 48h à l\'avance.');
                    this.value = '';
                    this.focus();
                }
            });
            
            // Focus amélioré pour mobile
            dateInput.addEventListener('focus', function() {
                if (detectMobileDevice()) {
                    // Scroll vers le champ pour éviter que le clavier ne cache
                    setTimeout(() => {
                        this.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }, 300);
                }
            });
        }
    }
}

// Particules flottantes (desktop seulement)
function createFloatingParticles() {
    const hero = document.querySelector('.hero');
    if (!hero || detectMobileDevice()) return;
    
    const particleCount = 10; // Réduire le nombre pour les performances
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'floating-particle';
        particle.style.cssText = `
            position: absolute;
            width: ${Math.random() * 4 + 2}px;
            height: ${Math.random() * 4 + 2}px;
            background: rgba(255, 255, 255, ${Math.random() * 0.3 + 0.2});
            border-radius: 50%;
            animation: floatParticle ${8 + Math.random() * 4}s infinite linear;
            left: ${Math.random() * 100}%;
            top: ${Math.random() * 100}%;
            animation-delay: ${Math.random() * 8}s;
            pointer-events: none;
            z-index: 1;
        `;
        hero.appendChild(particle);
    }
}

// Fonctions utilitaires améliorées
function scrollToOrder() {
    const orderSection = document.getElementById('order');
    if (orderSection) {
        const headerHeight = document.getElementById('header').offsetHeight;
        const targetPosition = orderSection.offsetTop - headerHeight - 20;
        
        // Comportement adaptatif selon l'appareil
        const behavior = detectMobileDevice() ? 'auto' : 'smooth';
        
        window.scrollTo({
            top: targetPosition,
            behavior: behavior
        });
    }
}

// Gestion optimisée des modals pour mobile
function openPricingModal() {
    const modal = document.getElementById('pricingModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Focus management pour l'accessibilité
        const firstFocusable = modal.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (firstFocusable) {
            setTimeout(() => firstFocusable.focus(), 100);
        }
    }
}

function closePricingModal() {
    const modal = document.getElementById('pricingModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// Gestion des événements tactiles pour les modals
document.addEventListener('touchstart', function(e) {
    const modal = document.getElementById('pricingModal');
    if (modal && modal.classList.contains('active') && e.target === modal) {
        closePricingModal();
    }
}, { passive: true });

// Gestion améliorée du redimensionnement
window.addEventListener('resize', debounce(() => {
    // Réajuster selon le nouvel état de l'appareil
    if (detectMobileDevice()) {
        // Nettoyer les particules si on passe en mobile
        const particles = document.querySelectorAll('.floating-particle');
        particles.forEach(particle => particle.remove());
    } else if (!document.querySelector('.floating-particle')) {
        // Recréer les particules si on passe en desktop
        createFloatingParticles();
    }
}, 250));

// Utilitaire debounce amélioré
function debounce(func, wait, immediate) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            timeout = null;
            if (!immediate) func(...args);
        };
        const callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func(...args);
    };
}

// Export global amélioré
window.ZeBestCake = Object.assign(window.ZeBestCake || {}, {
    scrollToOrder,
    openPricingModal,
    closePricingModal,
    isMobile: detectMobileDevice,
    debounce,
    isIOSDevice: () => /iPad|iPhone|iPod/.test(navigator.userAgent)
});