# ZeBestCake

Site vitrine de pâtisserie artisanale (Toulouse). Refonte frontend en cours, backend fonctionnel et conservé.

## Stack

- Frontend : HTML / CSS / JS vanilla
- Hébergement : Netlify
- Pages : `/`, `/gateaux`, `/commander`, `/a-propos`, `/contact`, `/suivi-commande`
- Données dynamiques (produits, témoignages) : fetch JS au chargement vers les endpoints existants

## Direction artistique (verrouillée)

Style **éditorial boutique haut de gamme**. Références mentales : Poilâne, Du Pain et des Idées, Cédric Grolet en ligne, Aesop pour la rigueur typographique.

- Palette stricte :
  - Blanc `#FFFFFF` — fond principal
  - Noir `#0A0A0A` — texte et accents
  - Gris `#E5E5E5` — séparateurs uniquement
  - Gris texte `#6B6B6B` — texte secondaire (prix, mentions, eyebrow)
- Photos produit en vedette, ratio 4/5 portrait obligatoire
- Bords carrés. Pas d'ombres. Pas de gradients. Pas d'animations décoratives.

## Règles non négociables

- Ne JAMAIS toucher au backend ni aux endpoints existants
- Ne JAMAIS introduire un framework CSS (Bootstrap, Tailwind) ou JS (React, Vue, jQuery)
- Garder le HTML sémantique : `<article>`, `<section>`, `<nav>`, `<figure>`, `<main>`
- Un seul fichier CSS principal, modulaire avec sections commentées
- JS uniquement pour : fetch données, soumission formulaires, navigation mobile. Rien d'autre.
- Ne pas arrondir les coins partout. `border-radius` interdit sauf 2px max sur les images.

## Workflow attendu

1. Lire la page existante avant toute proposition (`view` les fichiers concernés)
2. Identifier ce qui est data (fetch backend, conservé) vs présentation (refait)
3. Proposer le HTML minimal sémantique d'abord, sans style
4. Ajouter le CSS dans le fichier dédié, section commentée
5. JS allégé en dernier, vérifier que les fetch backend marchent toujours
6. Commit propre par page refaite, sur une branche dédiée

## Skills disponibles dans ce repo

- `editorial-redesign` — refonte visuelle d'une page ou section
- `refactor-js` — allègement du JS, suppression des libs décoratives
- `product-card` — composant card gâteau (réutilisé partout)
- `new-page` — création d'une page from scratch dans le style du site

## À éviter activement

- Animations au scroll, parallax, carrousels, sliders
- Multiplication de classes utilitaires anonymes (`.mt-4`, `.flex-center`)
- Empilement de `<div>` wrappers inutiles
- `!important` non commenté
- Icônes décoratives (Font Awesome, Material Icons). Si nécessaire : SVG inline 16px stroke noir.
