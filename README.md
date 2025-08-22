# ZeBestCake - Site Web de Pâtisserie Artisanale

Un site web moderne et responsive pour une pâtisserie artisanale spécialisée dans les gâteaux personnalisés.

## 🍰 Fonctionnalités

- **Design responsive** - Optimisé pour tous les appareils (mobile, tablette, desktop)
- **Formulaires intelligents** - Validation en temps réel et sauvegarde automatique
- **Grille tarifaire interactive** - Modal avec tableau des prix détaillé
- **Animations fluides** - Effets visuels modernes et performants
- **Accessibilité** - Conforme aux standards d'accessibilité web
- **Performance optimisée** - Code modulaire et optimisé pour la vitesse

## 🚀 Installation

### Prérequis
- Un navigateur web moderne
- Un serveur web local (optionnel pour le développement)

### Étapes d'installation

1. **Créer la structure du projet** :
```bash
mkdir zebestcake
cd zebestcake
mkdir css js assets assets/images assets/icons
touch index.html README.md
touch css/style.css css/responsive.css
touch js/main.js js/animations.js js/forms.js
```

2. **Copier les fichiers** :
   - Copiez le contenu de chaque artéfact dans les fichiers correspondants
   - Assurez-vous que tous les chemins sont corrects

3. **Configuration** :
   - Modifiez les URLs des endpoints dans `js/forms.js` (lignes 8-11)
   - Ajustez les informations de contact dans `index.html`
   - Personnalisez les prix dans la grille tarifaire

4. **Test** :
   - Ouvrez `index.html` dans votre navigateur
   - Testez la responsivité avec les outils développeur

## 📱 Améliorations Responsives

### Problèmes résolus
- ✅ Formulaire optimisé pour mobile
- ✅ Textarea "Détails de commande" responsive
- ✅ Navigation mobile fluide
- ✅ Grille tarifaire adaptée aux petits écrans
- ✅ Boutons tactiles optimisés

### Nouvelles fonctionnalités
- 🆕 Grille tarifaire interactive
- 🆕 Calcul de prix automatique
- 🆕 Sauvegarde automatique des formulaires
- 🆕 Validation en temps réel
- 🆕 Animations optimisées

## 🛠️ Architecture

```
zebestcake/
├── index.html              # Page principale
├── css/
│   ├── style.css          # Styles principaux
│   └── responsive.css     # Styles responsives
├── js/
│   ├── main.js           # Fonctions principales
│   ├── animations.js     # Animations et effets
│   └── forms.js          # Gestion des formulaires
├── assets/
│   ├── images/           # Images du site
│   └── icons/            # Icônes et favicons
└── README.md             # Documentation
```

## 🎨 Personnalisation

### Couleurs
Les couleurs principales sont définies dans `:root` dans `style.css` :
```css
:root {
    --primary-color: #FF69B4;
    --secondary-color: #FFB6C1;
    --accent-color: #FFC0CB;
}
```

### Tarifs
Modifiez les prix dans `js/forms.js` dans la fonction `calculateEstimatedPrice()`.

### Contenu
- Textes : directement dans `index.html`
- Images : ajoutez vos images dans `assets/images/`
- Coordonnées : section contact dans `index.html`

## 📋 Configuration des Formulaires

### Google Apps Script (recommandé)
1. Créez un nouveau projet Google Apps Script
2. Copiez le code de traitement des formulaires
3. Déployez en tant qu'application web
4. Copiez l'URL dans `js/forms.js`

### Alternative EmailJS
Pour une solution plus simple, vous pouvez utiliser EmailJS :
1. Créez un compte sur EmailJS
2. Configurez vos templates
3. Remplacez les fonctions d'envoi dans `forms.js`

## 🧪 Tests

### Tests Responsifs
```bash
# Testez ces résolutions :
- Mobile : 320px, 375px, 414px
- Tablette : 768px, 1024px
- Desktop : 1200px, 1920px
```

### Tests de Performance
- Utilisez Lighthouse pour tester les performances
- Vérifiez l'accessibilité avec WAVE
- Testez la vitesse avec PageSpeed Insights

## 🔧 Maintenance

### Mise à jour des prix
1. Modifiez `calculateEstimatedPrice()` dans `js/forms.js`
2. Mettez à jour la grille tarifaire dans `index.html`

### Ajout de nouveaux produits
1. Ajoutez une carte produit dans la section `#products`
2. Mettez à jour le select `#cakeType` dans le formulaire
3. Ajustez la fonction de calcul de prix

### Optimisations
- Compressez les images avant de les ajouter
- Minifiez CSS/JS pour la production
- Activez la compression gzip sur votre serveur

## 🚨 Dépannage

### Problèmes courants

**Le formulaire ne s'envoie pas** :
- Vérifiez l'URL de l'endpoint dans `forms.js`
- Assurez-vous que CORS est configuré côté serveur
- Consultez la console pour les erreurs

**Problèmes d'affichage mobile** :
- Vérifiez que `responsive.css` est bien chargé
- Testez avec les outils développeur
- Assurez-vous que la meta viewport est présente

**Animations lentes** :
- Désactivez les animations sur mobile si nécessaire
- Vérifiez `prefers-reduced-motion`
- Optimisez les performances avec `will-change`

## 📞 Support

Pour toute question technique :
1. Vérifiez d'abord cette documentation
2. Consultez les commentaires dans le code
3. Testez sur différents navigateurs
4. Utilisez les outils de développement

## 🔮 Roadmap

### Améliorations futures possibles
- [ ] Système de commande en ligne complet
- [ ] Galerie photo des créations
- [ ] Blog de recettes
- [ ] Intégration système de paiement
- [ ] Application PWA
- [ ] Notifications push
- [ ] Mode sombre

## 📄 Licence

Ce projet est un template personnalisable. Vous pouvez l'adapter selon vos besoins.

---

**Créé avec ❤️ pour ZeBestCake**