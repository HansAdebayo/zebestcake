// custom/js/custom-firebase.js
// Config Firebase autonome pour ZeBest Custom.
// Même projet Firebase que ZeBestCake, mais sans dépendance au chemin parent
// (nécessaire pour le déploiement Netlify séparé).

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js';
import { getFirestore }  from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js';
import { getStorage }    from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-storage.js';
import { getAuth }       from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js';

const firebaseConfig = {
    apiKey:            "AIzaSyDnAlm0_nZV_oMCQzXyyzVTqsf_iaLN2os",
    authDomain:        "zebestcake-6d1d9.firebaseapp.com",
    projectId:         "zebestcake-6d1d9",
    storageBucket:     "zebestcake-6d1d9.appspot.com",
    messagingSenderId: "501213547498",
    appId:             "1:501213547498:web:a5250319a00ef16df38093",
    measurementId:     "G-2NELJ9QF7M"
};

const app     = initializeApp(firebaseConfig, 'zebest-custom');
const db      = getFirestore(app);
const storage = getStorage(app);
const auth    = getAuth(app);

export { db, storage, auth };
