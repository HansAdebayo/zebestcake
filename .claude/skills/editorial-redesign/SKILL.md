---
name: editorial-redesign
description: Use this skill whenever the user asks to redesign, restyle, refactor, simplify, rebuild, or improve the visual design of any page, section, or component of the ZeBestCake site. Triggers on "refais", "redesign", "restyle", "épure", "allège", "simplifie", "minimaliste", "éditorial", "page gâteaux", "page accueil", "page commander", "page contact", "navbar", "header", "footer", "hero", "grille produits". Backend untouched — only HTML structure and CSS change.
---

# ZeBestCake — Editorial Redesign

## Référence visuelle

Boulangerie / pâtisserie haut de gamme. Pense Poilâne, Du Pain et des Idées, Cédric Grolet en ligne, Aesop pour la rigueur typographique. La photo du gâteau est la star. Le texte respire. Rien ne distrait.

## Système de design

### Couleurs (strictes)

```css
:root {
  --white: #FFFFFF;       /* fond principal */
  --black: #0A0A0A;       /* texte, accents, bordures */
  --gray: #E5E5E5;        /* séparateurs uniquement */
  --gray-text: #6B6B6B;   /* texte secondaire : prix, mentions, eyebrow */
}
```

Aucune autre couleur. Les photos de gâteaux apportent toute la chaleur visuelle.

### Typographie

Deux familles maximum :

```css
:root {
  --font-display: 'Cormorant Garamond', 'Playfair Display', Georgia, serif;
  --font-body: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}
```

Le serif pour titres et nom des gâteaux (touche éditoriale boutique). Sans-serif pour tout le reste.

**Échelle stricte** (aucune valeur entre) :

| Taille | Usage |
|--------|-------|
| 12px | Mentions légales, métadonnées, eyebrow text |
| 13px | Navigation, footer, prix |
| 15px | Body |
| 22px | Sous-titres section, nom de gâteau |
| 40px | Titres de page (serif) |
| 56px | Hero (serif) |

`line-height: 1.6` pour body, `1.15` pour titres serif.

- Pas d'`uppercase` décoratif, sauf eyebrow text (12px, `letter-spacing: 0.15em`)
- Letter-spacing 0 partout sauf navigation (`0.04em`) et eyebrow (`0.15em`)

### Espacement

Échelle : `8 / 16 / 24 / 32 / 48 / 64 / 96 / 144` px. Rien entre.

- Padding section : `96px` vertical desktop, `48px` mobile
- Gap grille produits : `48px` vertical, `32px` horizontal
- Container : `max-width: 1280px`, padding latéral `clamp(24px, 5vw, 64px)`

### Grille produits (verrouillée)

```css
.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 48px 32px;
  padding: 0 clamp(24px, 5vw, 64px) 96px;
}
```

Mêmes règles partout : page `/gateaux` ET section "Nos Créations" de l'accueil. Cohérence > variété.

### Navigation

- Texte simple noir sur blanc, 13px, espacement 32px entre items
- Logo serif à gauche (22px), items à droite
- Item actif : `border-bottom: 1px solid #0A0A0A` avec `padding-bottom: 2px`
- Au hover : `opacity: 0.5`. Pas de soulignement animé.
- Au scroll : aucun effet. La navbar reste identique.
- Mobile (< 768px) : menu hamburger basique, ouverture d'un overlay plein écran blanc

### Hero (page d'accueil)

- Pleine largeur, hauteur `80vh` desktop / `60vh` mobile
- Photo grande qualité, ratio respecté, `object-fit: cover`
- Texte centré minimal :
  - Eyebrow 12px uppercase letter-spaced
  - Titre serif 56px
  - Sous-titre sans-serif 15px gris-texte
  - Un seul lien-bouton : texte noir avec `border-bottom: 1px solid #0A0A0A`, pas de background, pas de bordure box

### Section de page (header)

Pour chaque page autre que l'accueil :

```html
<section class="page-header">
  <p class="eyebrow">Collection</p>
  <h1 class="page-title">Nos Gâteaux</h1>
  <p class="page-subtitle">Une sélection de créations artisanales...</p>
</section>
```

- `padding: 80px 32px 48px`, texte centré
- Eyebrow gris, titre serif 56px, sous-titre 15px gris-texte max 440px de large

## Anti-patterns INTERDITS

- `border-radius` > 2px (et 2px réservé aux images uniquement)
- `box-shadow`, `text-shadow`, `filter: drop-shadow`
- `linear-gradient`, `radial-gradient`
- `transform: scale()` ou `rotate()` au hover
- Animations au scroll (AOS, ScrollReveal, etc.)
- Carrousels, sliders, parallax
- Icônes décoratives Font Awesome / Material. Si vraiment nécessaire : SVG inline 16px, stroke 1.5px, noir.
- `!important` sauf justifié et commenté
- Wrappers `<div>` superflus
- Classes utilitaires anonymes (`.mt-4`, `.text-center`)
- Centrer du texte de body. Seuls les hero et page-header sont centrés.

## Workflow pour chaque refonte

1. **Lire** la page existante (`view` le HTML, le CSS, le JS associé)
2. **Inventaire** : lister ce qui est data (fetch backend, conservé) vs présentation (refait)
3. **HTML d'abord** : markup sémantique minimal, sans aucun style
4. **CSS ensuite** : ajouter au fichier CSS principal, section commentée `/* === PAGE GÂTEAUX === */`
5. **JS en dernier** : ne toucher que si nécessaire pour adapter au nouveau markup
6. **Vérification** : relire en s'assurant qu'aucune règle ci-dessus n'est violée
7. **Diff propre** : montrer ce qui a changé, ce qui reste

## Si tu hésites

Demande-toi : *"Est-ce qu'une boulangerie parisienne avec un site fait par un studio de design ferait ça ?"*. Si non, ne le fais pas. En cas de vrai doute, demander avant d'ajouter quoi que ce soit.

## Template HTML de base pour une page

```html
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>[Titre] - ZeBestCake</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500&family=Inter:wght@400;500&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/assets/css/main.css">
</head>
<body>
  <nav class="nav">...</nav>
  <main>
    <section class="page-header">...</section>
    <section class="products-grid">...</section>
  </main>
  <footer class="footer">...</footer>
  <script type="module" src="/assets/js/main.js"></script>
</body>
</html>
```
