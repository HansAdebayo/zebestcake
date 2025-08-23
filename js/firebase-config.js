// firebase-config.js - Configuration Firebase pour ZeBestCake

// IMPORTANT: Assurez-vous d'importer les fonctions nécessaires dans les fichiers où vous les utilisez.
// Exemple: import { db } from './firebase-config.js';

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js';
import { getStorage } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-storage.js';
import { getAnalytics } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-analytics.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js'; // Import getAuth

// Configuration Firebase ZeBestCake
// TODO: Remplacer par vos propres clés si nécessaire, mais celles-ci sont celles sauvegardées.
const firebaseConfig = {
    apiKey: "AIzaSyDnAlm0_nZV_oMCQzXyyzVTqsf_iaLN2os",
    authDomain: "zebestcake-6d1d9.firebaseapp.com",
    projectId: "zebestcake-6d1d9",
    storageBucket: "zebestcake-6d1d9.appspot.com",
    messagingSenderId: "501213547498",
    appId: "1:501213547498:web:a5250319a00ef16df38093",
    measurementId: "G-2NELJ9QF7M"
};

// Initialiser Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);
const analytics = getAnalytics(app);
const auth = getAuth(app); // Initialize auth

console.log('🔥 Firebase ZeBestCake initialisé avec succès !');

// Exporter les instances pour les utiliser dans d'autres modules
export { db, storage, analytics, app, auth }; // Export auth