---
name: new-page
description: Use this skill when the user asks to create a new page, add a page, build a page from scratch on the ZeBestCake site. Triggers on "nouvelle page", "crée une page", "ajoute une page", "page from scratch", "build the page". Ensures every new page follows the editorial design system from day one.
---

# ZeBestCake — Création de page from scratch

## Avant de commencer

Demander au user :
1. **Quel slug** ? (ex: `/cgv`, `/blog`, `/atelier`)
2. **Quel contenu** ? (statique uniquement, ou avec fetch de données ?)
3. **Quels éléments** ? (juste texte ? avec photos ? avec formulaire ?)

Ne pas commencer à coder avant d'avoir ces trois réponses.

## Structure de fichier

Chaque nouvelle page = un fichier HTML à la racine, qui partage `main.css` et charge son propre JS si besoin :

```
zebestcake/
├── index.html
├── gateaux.html
├── commander.html
├── [nouvelle-page].html         ← ici
├── assets/
│   ├── css/
│   │   └── main.css             ← une seule feuille de style globale
│   └── js/
│       ├── main.js              ← nav + utilitaires
│       └── [nouvelle-page].js   ← si besoin
```

## Template HTML de base

```html
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>[Titre de la page] — ZeBestCake</title>
  <meta name="description" content="[Description SEO 150 chars max]">

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500&family=Inter:wght@400;500&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/assets/css/main.css">
</head>
<body>

  <nav class="nav">
    <a href="/" class="nav__logo">ZeBestCake</a>
    <ul class="nav__menu">
      <li><a href="/">Accueil</a></li>
      <li><a href="/gateaux">Gâteaux</a></li>
      <li><a href="/commander">Commander</a></li>
      <li><a href="/a-propos">À propos</a></li>
      <li><a href="/contact">Contact</a></li>
    </ul>
  </nav>

  <main>
    <section class="page-header">
      <p class="eyebrow">[Eyebrow text en uppercase]</p>
      <h1 class="page-title">[Titre serif]</h1>
      <p class="page-subtitle">[Sous-titre sans-serif gris-texte]</p>
    </section>

    <!-- Contenu spécifique à la page -->
    <section class="page-content">
      ...
    </section>
  </main>

  <footer class="footer">
    <div class="footer__left">
      <p>05.61.23.45.67</p>
      <p>zebestcake@gmail.com</p>
    </div>
    <div class="footer__right">
      <p>Mar–Sam 9h–18h</p>
      <p>Dim 10h–16h</p>
    </div>
  </footer>

  <script type="module" src="/assets/js/main.js" defer></script>
</body>
</html>
```

## Structure de contenu type

Suivant le type de page, utiliser un de ces patterns. Toujours respecter le système de design.

### Page texte longue (À propos, CGV, mentions légales)

```html
<section class="page-content page-content--text">
  <article class="prose">
    <h2>Sous-titre serif</h2>
    <p>Paragraphe en body 15px line-height 1.6...</p>

    <h2>Autre section</h2>
    <p>...</p>
  </article>
</section>
```

```css
.page-content--text {
  max-width: 680px;
  margin: 0 auto;
  padding: 0 clamp(24px, 5vw, 64px) 96px;
}

.prose h2 {
  font-family: var(--font-display);
  font-size: 22px;
  font-weight: 400;
  margin: 48px 0 16px;
}

.prose p {
  font-size: 15px;
  line-height: 1.6;
  margin: 0 0 24px;
  color: var(--black);
}
```

### Page formulaire (Commander, Contact)

```html
<section class="page-content page-content--form">
  <form class="form" id="contact-form">
    <div class="form__field">
      <label for="name">Nom</label>
      <input type="text" id="name" name="name" required>
    </div>

    <div class="form__field">
      <label for="email">Email</label>
      <input type="email" id="email" name="email" required>
    </div>

    <div class="form__field">
      <label for="message">Message</label>
      <textarea id="message" name="message" rows="6" required></textarea>
    </div>

    <button type="submit" class="form__submit">Envoyer</button>
  </form>
</section>
```

```css
.page-content--form {
  max-width: 560px;
  margin: 0 auto;
  padding: 0 clamp(24px, 5vw, 64px) 96px;
}

.form__field {
  margin-bottom: 32px;
}

.form__field label {
  display: block;
  font-size: 12px;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--gray-text);
  margin-bottom: 8px;
}

.form__field input,
.form__field textarea {
  width: 100%;
  border: none;
  border-bottom: 1px solid var(--black);
  background: transparent;
  padding: 8px 0;
  font-family: var(--font-body);
  font-size: 15px;
  color: var(--black);
}

.form__field input:focus,
.form__field textarea:focus {
  outline: none;
  border-bottom-width: 2px;
}

.form__submit {
  background: var(--black);
  color: var(--white);
  border: none;
  padding: 16px 48px;
  font-family: var(--font-body);
  font-size: 13px;
  letter-spacing: 0.04em;
  cursor: pointer;
  transition: opacity 150ms ease;
}

.form__submit:hover {
  opacity: 0.8;
}
```

### Page galerie / liste (Gâteaux, Blog)

Utiliser la `.products-grid` du système si c'est une liste d'items visuels. Voir le skill `product-card` pour le composant.

## Règles de cohérence

- **Toujours** : nav identique en haut, footer identique en bas
- **Toujours** : `<section class="page-header">` avec eyebrow + titre serif + sous-titre
- **Jamais** : nouvelle police, nouvelle couleur, nouveau composant qui n'existe pas déjà ailleurs
- **Jamais** : recopier le CSS d'une autre page dans un nouveau fichier. Tout va dans `main.css`.

## Workflow

1. Recevoir les 3 réponses (slug / contenu / éléments)
2. Choisir le pattern adapté (texte / formulaire / galerie / custom)
3. Créer le HTML en suivant le template
4. Ajouter les règles CSS spécifiques à la page dans `main.css`, section commentée `/* === PAGE [NOM] === */`
5. Si JS nécessaire, créer le fichier dédié et le charger
6. Vérifier la nav : ajouter le lien dans toutes les autres pages si la page doit être accessible depuis le menu
