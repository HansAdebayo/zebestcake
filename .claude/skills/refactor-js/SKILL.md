---
name: refactor-js
description: Use this skill when the user asks to alléger, simplifier, refactoriser, optimiser, accélérer, or clean up the JavaScript on the ZeBestCake site. Triggers on "trop de JS", "allège le JS", "refacto JS", "vire les libs", "page lente", "chargement long", "trop chargé", "performance", "loading des gâteaux", "supprime jQuery". The site backend works — only client-side JS changes.
---

# ZeBestCake — Refacto JS

## Principe

Le site est trop chargé en JS aux yeux du propriétaire. Objectif : garder le strict nécessaire pour que le backend continue de fonctionner, virer le reste.

## Ce qui doit RESTER

- `fetch` vers les endpoints existants (produits, témoignages, commandes, suivi de commande)
- Rendu côté client des données fetchées (templating en template literals natifs)
- Handlers de soumission de formulaire (page commander, page contact)
- Validation basique de formulaire (HTML5 `required`, `type="email"`, `pattern`, JS seulement si nécessaire)
- Toggle du menu mobile (si présent)

## Ce qui doit PARTIR

- Toute lib d'animation : AOS, GSAP, ScrollReveal, Anime.js, Lottie
- Carrousels et sliders : Swiper, Slick, Glide
- Lazy-loading custom : remplacer par `loading="lazy"` natif sur `<img>`
- Smooth scroll JS : remplacer par `scroll-behavior: smooth` en CSS
- Détection de scroll pour animer des éléments
- jQuery si présent (réécrire en vanilla)
- Polyfills inutiles pour navigateurs modernes (>= 2020)
- Trackers analytics multiples (garder un seul tracker si vraiment nécessaire)
- Code mort, console.log oubliés, fonctions jamais appelées

## Workflow

1. **Audit** : lister tout ce qui est chargé
   ```bash
   grep -rn "import\|require\|<script" --include="*.html" --include="*.js" .
   ```
2. **Catégoriser** chaque dépendance :
   - Essentielle (fetch / form / nav mobile) → garder
   - Décorative (animation / carousel / parallax) → supprimer
   - Morte (jamais appelée) → supprimer
3. **Mesurer avant** : taille totale JS, nombre de requêtes au load, LCP via DevTools
4. **Supprimer les décoratives en premier** (gain visuel immédiat + perf)
5. **Réécrire en vanilla** ce qui peut l'être (typiquement : jQuery → `fetch` + `querySelector`)
6. **Mesurer après** et reporter le gain au user en chiffres concrets

## Templating produits (cas spécifique ZeBestCake)

Le pattern "Chargement des gâteaux..." du site actuel suggère un fetch + render. Garder ce pattern mais :

- Utiliser des template literals natifs ou `<template>` HTML, jamais Handlebars/Mustache/EJS
- Render synchrone après fetch, pas de virtual DOM
- Skeleton minimal pendant le load : juste un texte gris `"Chargement..."` centré, AUCUNE animation de skeleton fancy

Exemple de pattern attendu :

```js
// products.js
const grid = document.querySelector('.products-grid');

async function loadProducts() {
  try {
    const res = await fetch('/api/products');
    const products = await res.json();
    grid.innerHTML = products.map(renderCard).join('');
  } catch (err) {
    grid.innerHTML = '<p class="empty">Impossible de charger les gâteaux pour le moment.</p>';
  }
}

function renderCard(p) {
  return `
    <a href="/gateaux/${p.slug}" class="card">
      <article>
        <figure class="card__image">
          <img src="${p.image}" alt="${p.name}" loading="lazy" width="320" height="400">
        </figure>
        <div class="card__info">
          <h3 class="card__name">${p.name}</h3>
          <p class="card__price">${p.price} €</p>
        </div>
      </article>
    </a>
  `;
}

loadProducts();
```

## Structure cible JS

```
assets/js/
├── main.js          # nav mobile, utilitaires partagés
├── products.js      # fetch + render produits (/ et /gateaux)
├── testimonials.js  # fetch + render témoignages (/)
├── order.js         # formulaire /commander
├── contact.js       # formulaire /contact
└── tracking.js      # /suivi-commande
```

Un fichier par responsabilité. Pas de bundler nécessaire. Charger en `<script type="module" defer>`.

## Anti-patterns INTERDITS

- Remplacer une lib par une autre lib
- Refacto en React / Vue / Svelte "pour faire propre"
- Inliner tout le JS dans le HTML
- Supprimer un fetch sans vérifier que le backend n'en dépend pas (analytics serveur, logs)
- Utiliser `innerHTML` avec du contenu utilisateur non échappé
- Ajouter des dépendances npm si vanilla suffit

## Communication

À la fin du refacto, livrer au user :
- Liste des libs supprimées avec gain en KB
- Liste des fichiers JS finaux et leur rôle
- Avant/après : taille bundle total, nombre de requêtes
