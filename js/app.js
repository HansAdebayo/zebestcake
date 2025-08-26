// js/app.js - Logique principale du site ZeBestCake

// js/app.js - Logique principale du site ZeBestCake (partagée)

document.addEventListener('DOMContentLoaded', () => {
    console.log("Scripts partagés (app.js) chargés !");

    // --- MENU BURGER ---
    const burgerMenu = document.getElementById('burger-menu');
    const navLinks = document.querySelector('.nav-links');

    if (burgerMenu && navLinks) {
        burgerMenu.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            burgerMenu.classList.toggle('active');
        });
        navLinks.addEventListener('click', () => {
            if (navLinks.classList.contains('active')) {
                navLinks.classList.remove('active');
                burgerMenu.classList.remove('active');
            }
        });
    }

    // --- SCROLL HEADER ---
    let lastScrollTop = 0;
    const header = document.querySelector('header');
    window.addEventListener('scroll', () => {
        let scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        if (scrollTop > lastScrollTop) {
            header.style.top = '-100px';
        } else {
            header.style.top = '0';
        }
        lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
    });

    // --- ANIMATIONS AU SCROLL ---
    const animatedElements = document.querySelectorAll('.animate-on-scroll');

    if (animatedElements.length > 0) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { 
            threshold: 0.1,
            rootMargin: "0px 0px -50px 0px" // Déclenche un peu avant que l'élément soit totalement visible
        });

        animatedElements.forEach(element => {
            observer.observe(element);
        });
    }
});