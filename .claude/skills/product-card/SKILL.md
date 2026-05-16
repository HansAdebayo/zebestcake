---
name: product-card
description: Use this skill when the user asks to create, modify, or restyle a product card, card gâteau, vignette produit, tile gâteau, or any tile-style component showing a cake. Triggers on "card produit", "card gâteau", "vignette", "tile gâteau", "composant gâteau". The card is reused on the home page and the /gateaux page — keep it strictly consistent.
---

# ZeBestCake — Card Produit

## Markup canonique

```html
<a href="/gateaux/{slug}" class="card">
  <article>
    <figure class="card__image">
      <img src="{image_url}" alt="{name}" loading="lazy" width="320" height="400">
    </figure>
    <div class="card__info">
      <h3 class="card__name">{name}</h3>
      <p class="card__price">{price} €</p>
    </div>
  </article>
</a>
```

Notes :
- Le `<a>` enrobe tout : la card entière est cliquable
- `<article>` pour la sémantique (chaque gâteau est un contenu autonome)
- `<figure>` pour l'image (norme HTML5)
- `loading="lazy"` natif, pas de lib

## CSS canonique

```css
/* === CARD PRODUIT === */

.card {
  display: block;
  color: inherit;
  text-decoration: none;
  transition: opacity 150ms ease;
}

.card article {
  margin: 0;
}

.card__image {
  margin: 0;
  aspect-ratio: 4 / 5;
  overflow: hidden;
  background: #F5F3EE; /* fallback subtil pendant le load image */
}

.card__image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: opacity 150ms ease;
}

.card:hover .card__image img {
  opacity: 0.75;
}

.card__info {
  padding-top: 16px;
}

.card__name {
  font-family: var(--font-display);
  font-size: 22px;
  font-weight: 400;
  line-height: 1.2;
  margin: 0 0 4px;
}

.card__price {
  font-family: var(--font-body);
  font-size: 13px;
  color: var(--gray-text);
  margin: 0;
}
```

## Règles VERROUILLÉES

- Ratio image **toujours** 4/5 (portrait éditorial). Si la photo source ne respecte pas, `object-fit: cover` la recadre.
- **Pas** de bouton "Commander" sur la card. La card entière est le lien.
- **Pas** de description sur la card. Juste nom + prix.
- **Pas** de badge décoratif (Nouveau / Promo / Bestseller). Si vraiment nécessaire pour le business, texte 12px en haut à gauche de l'image, fond blanc, pas de couleur, pas d'animation.
- **Pas** de bordure autour de la card.
- **Pas** d'ombre.
- **Pas** de fond.
- **Pas** de coins arrondis (sauf 2px max sur l'image si vraiment besoin).
- Au hover : `opacity: 0.75` sur l'image, 150ms. Rien d'autre. Pas de scale, pas de translate.
- Nom de gâteau aligné à gauche, jamais centré.
- Cohérence absolue entre l'accueil et `/gateaux` : **une seule définition CSS** partagée dans `main.css`.

## Variantes acceptables

Aucune. Si le user demande une variante (card avec description, card horizontale, card avec note), il faut **d'abord refuser** et expliquer que la cohérence du système exige une card unique. Si le user insiste après explication, créer une classe modifier explicite (`.card--detailed`) et documenter pourquoi cette exception existe.

## Cas particuliers

### Card avec image manquante

```html
<figure class="card__image card__image--empty">
  <span>Photo bientôt disponible</span>
</figure>
```

```css
.card__image--empty {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #F5F3EE;
  color: var(--gray-text);
  font-size: 13px;
}
```

### Card en état "loading"

Pendant le fetch, afficher des cards squelettes :

```html
<div class="card card--skeleton">
  <div class="card__image"></div>
  <div class="card__info">
    <div class="card__name-skeleton"></div>
    <div class="card__price-skeleton"></div>
  </div>
</div>
```

Pas d'animation de pulse / shimmer. Juste des blocs gris clair statiques (`background: #F5F3EE`).
