// Fonctions principales du site ZeBestCake

document.addEventListener('DOMContentLoaded', function() {
    initializeNavigation();
    initializeScrollEffects();
    initializeSmoothScroll();
    initializeDateValidation();
    createFloatingParticles();
    initializeImageFallbacks();
});

// Gestion des fallbacks d'images
function initializeImageFallbacks() {
    const images = document.querySelectorAll('.product-image img, .about-image img');
    
    images.forEach(img => {
        // Gestion des erreurs de chargement
        img.addEventListener('error', function() {
            this.style.display = 'none';
            const fallback = this.nextElementSibling;
            if (fallback && fallback.classList.contains('emoji-fallback')) {
                fallback.style.display = 'block';
            }
        });
        
        // Vérifier si l'image est déjà en erreur
        if (img.complete && img.naturalHeight === 0) {
            img.style.display = 'none';
            const fallback = img.nextElementSibling;
            if (fallback && fallback.classList.contains('emoji-fallback')) {
                fallback.style.display = 'block';
            }
        }
        
        // Animation de chargement
        img.addEventListener('load', function() {
            this.style.opacity = '0';
            this.style.transition = 'opacity 0.3s ease';
            setTimeout(() => {
                this.style.opacity = '1';
            }, 100);
        });
    });
}

// Navigation mobile
function initializeNavigation() {
    const menuToggle = document.getElementById('menuToggle');
    const navLinks = document.getElementById('navLinks');

    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            
            // Animate hamburger icon
            if (navLinks.classList.contains('active')) {
                menuToggle.innerHTML = '✕';
            } else {
                menuToggle.innerHTML = '☰';
            }
        });

        // Close menu when clicking on links
        navLinks.addEventListener('click', (e) => {
            if (e.target.tagName === 'A') {
                navLinks.classList.remove('active');
                menuToggle.innerHTML = '☰';
            }
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!menuToggle.contains(e.target) && !navLinks.contains(e.target)) {
                navLinks.classList.remove('active');
                menuToggle.innerHTML = '☰';
            }
        });
    }
}

// Effets de scroll
function initializeScrollEffects() {
    const header = document.getElementById('header');
    let lastScrollY = window.scrollY;

    window.addEventListener('scroll', () => {
        const currentScrollY = window.scrollY;

        // Header background effect
        if (currentScrollY > 100) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }

        // Hide/show header on scroll (optional)
        if (currentScrollY > lastScrollY && currentScrollY > 200) {
            header.style.transform = 'translateY(-100%)';
        } else {
            header.style.transform = 'translateY(0)';
        }

        lastScrollY = currentScrollY;

        // Parallax effect on hero
        const hero = document.querySelector('.hero');
        if (hero && currentScrollY < window.innerHeight) {
            hero.style.transform = `translateY(${currentScrollY * 0.5}px)`;
        }
    });
}

// Smooth scroll pour les liens d'ancrage
function initializeSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            
            if (target) {
                const headerHeight = document.getElementById('header').offsetHeight;
                const targetPosition = target.offsetTop - headerHeight - 20;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });

                // Close mobile menu if open
                const navLinks = document.getElementById('navLinks');
                const menuToggle = document.getElementById('menuToggle');
                if (navLinks && menuToggle) {
                    navLinks.classList.remove('active');
                    menuToggle.innerHTML = '☰';
                }
            }
        });
    });
}

// Validation de date (ne pas permettre de commander pour le passé)
function initializeDateValidation() {
    const dateInput = document.getElementById('orderDate');
    if (dateInput) {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const minDate = tomorrow.toISOString().split('T')[0];
        dateInput.min = minDate;
        
        // Add change event to validate
        dateInput.addEventListener('change', function() {
            const selectedDate = new Date(this.value);
            const minDateTime = new Date(minDate);
            
            if (selectedDate < minDateTime) {
                alert('Veuillez sélectionner une date au moins 24h à l\'avance.');
                this.value = '';
            }
        });
    }
}

// Fonction pour scroller vers la section commande
function scrollToOrder() {
    const orderSection = document.getElementById('order');
    if (orderSection) {
        const headerHeight = document.getElementById('header').offsetHeight;
        const targetPosition = orderSection.offsetTop - headerHeight - 20;
        
        window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
        });
    }
}

// Gestion de la modal tarifs
function openPricingModal() {
    const modal = document.getElementById('pricingModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent background scroll
    }
}

function closePricingModal() {
    const modal = document.getElementById('pricingModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
}

// Close modal on outside click
document.addEventListener('click', function(e) {
    const modal = document.getElementById('pricingModal');
    if (modal && e.target === modal) {
        closePricingModal();
    }
});

// Close modal on Escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closePricingModal();
    }
});

// Création des particules flottantes
function createFloatingParticles() {
    const hero = document.querySelector('.hero');
    if (!hero) return;
    
    const particleCount = window.innerWidth > 768 ? 15 : 8; // Moins de particules sur mobile
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
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

// Fonction utilitaire pour debouncer les événements
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

// Optimiser les événements de scroll
const optimizedScrollHandler = debounce(() => {
    // Gestion optimisée du scroll
}, 16); // 60fps

window.addEventListener('scroll', optimizedScrollHandler);

// Gestion des erreurs globales
window.addEventListener('error', function(e) {
    console.warn('Erreur JavaScript:', e.error);
    // En production, vous pourriez envoyer ces erreurs à un service de monitoring
});

// Performance: Preload des images importantes
function preloadImages() {
    const imageUrls = [
        // Ajoutez ici les URLs des images importantes à précharger
    ];
    
    imageUrls.forEach(url => {
        const img = new Image();
        img.src = url;
    });
}

// Fonction pour détecter si on est sur mobile
function isMobile() {
    return window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Ajuster les animations selon l'appareil
function adjustAnimationsForDevice() {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (prefersReducedMotion || isMobile()) {
        // Réduire les animations pour les utilisateurs qui préfèrent moins d'animation
        // ou sur mobile pour économiser la batterie
        document.documentElement.style.setProperty('--transition', 'all 0.2s ease');
    }
}

// Initialiser les ajustements selon l'appareil
adjustAnimationsForDevice();

// Réajuster lors du redimensionnement
window.addEventListener('resize', debounce(() => {
    adjustAnimationsForDevice();
    
    // Recréer les particules si nécessaire
    const existingParticles = document.querySelectorAll('.hero > div[style*="animation: floatParticle"]');
    existingParticles.forEach(particle => particle.remove());
    createFloatingParticles();
}, 250));

// Export des fonctions pour les autres modules
window.ZeBestCake = {
    scrollToOrder,
    openPricingModal,
    closePricingModal,
    isMobile,
    debounce
};