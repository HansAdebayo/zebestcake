import { db, auth } from '../../../js/firebase-config.js';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, Timestamp, onSnapshot, query, orderBy } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js';

// --- Auth Security ---
onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = '../../login.html';
    } else {
        initAdmin();
    }
});

// --- DOM Elements ---
const plansList = document.getElementById('plans-list');
const planModal = document.getElementById('plan-modal');
const planForm = document.getElementById('plan-form');
const addPlanBtn = document.getElementById('add-plan-btn');
const closeModal = document.querySelector('.close-modal');
const optionsList = document.getElementById('options-list');
const addOptionBtn = document.getElementById('add-option-btn');

let currentPlans = [];

// --- Initialization ---
function initAdmin() {
    console.log("Admin initialisé, chargement des plans...");
    loadPlans();
    
    addPlanBtn.onclick = () => {
        console.log("Ouverture modal nouveau plan");
        openModal();
    };
    closeModal.onclick = () => planModal.style.display = 'none';
    window.onclick = (event) => { if (event.target == planModal) planModal.style.display = 'none'; };
    
    addOptionBtn.onclick = () => addOptionRow();
    planForm.onsubmit = handlePlanSubmit;
}

// --- Plans Management ---
function loadPlans() {
    const q = query(collection(db, "custom_plans"));
    
    onSnapshot(q, (snapshot) => {
        console.log("Snapshot reçu, nb docs:", snapshot.size);
        plansList.innerHTML = '';
        currentPlans = [];
        
        if (snapshot.empty) {
            plansList.innerHTML = '<p class="loading">Aucun plan trouvé. Cliquez sur "Nouveau Plan" pour commencer !</p>';
            return;
        }

        snapshot.forEach((doc) => {
            const plan = { id: doc.id, ...doc.data() };
            currentPlans.push(plan);
            renderPlanCard(plan);
        });
    }, (error) => {
        console.error("Erreur onSnapshot Admin :", error);
        plansList.innerHTML = `<p class="loading" style="color:red">Erreur : ${error.message}</p>`;
    });
}

function renderPlanCard(plan) {
    const card = document.createElement('div');
    card.className = 'plan-card';
    card.innerHTML = `
        <h3>${plan.title}</h3>
        <p class="category">${plan.category}</p>
        <p class="price">${plan.basePrice} €</p>
        <div class="actions">
            <button class="btn btn-outline btn-sm edit-btn" data-id="${plan.id}">Modifier</button>
            <button class="btn btn-danger btn-sm delete-btn" data-id="${plan.id}">Supprimer</button>
        </div>
    `;
    
    card.querySelector('.edit-btn').onclick = () => openModal(plan);
    card.querySelector('.delete-btn').onclick = () => deletePlan(plan.id);
    
    plansList.appendChild(card);
}

// --- Modal & Form Logic ---
function openModal(plan = null) {
    planForm.reset();
    optionsList.innerHTML = '';
    document.getElementById('plan-id').value = plan ? plan.id : '';
    document.getElementById('modal-title').innerText = plan ? 'Modifier le Plan' : 'Nouveau Plan';

    if (plan) {
        document.getElementById('plan-title').value = plan.title;
        document.getElementById('plan-category').value = plan.category;
        document.getElementById('plan-price').value = plan.basePrice;
        document.getElementById('plan-description').value = plan.description;
        document.getElementById('plan-image').value = plan.image || '';
        
        if (plan.options && plan.options.length > 0) {
            plan.options.forEach(opt => addOptionRow(opt));
        }
    } else {
        // Default option for new plan
        addOptionRow({ name: 'Prénom', type: 'text' });
    }

    planModal.style.display = 'block';
}

function addOptionRow(option = { name: '', type: 'text' }) {
    const row = document.createElement('div');
    row.className = 'option-row';
    row.innerHTML = `
        <input type="text" placeholder="Nom de l'option (ex: Couleur)" value="${option.name}" required>
        <select>
            <option value="text" ${option.type === 'text' ? 'selected' : ''}>Texte</option>
            <option value="select" ${option.type === 'select' ? 'selected' : ''}>Liste (Choix)</option>
        </select>
        <span class="remove-option">&times;</span>
    `;
    
    row.querySelector('.remove-option').onclick = () => row.remove();
    optionsList.appendChild(row);
}

async function handlePlanSubmit(e) {
    e.preventDefault();
    
    const id = document.getElementById('plan-id').value;
    const options = Array.from(optionsList.querySelectorAll('.option-row')).map(row => ({
        name: row.querySelector('input').value,
        type: row.querySelector('select').value
    }));

    const planData = {
        title: document.getElementById('plan-title').value,
        category: document.getElementById('plan-category').value,
        basePrice: parseFloat(document.getElementById('plan-price').value),
        description: document.getElementById('plan-description').value,
        image: document.getElementById('plan-image').value,
        options: options,
        updatedAt: Timestamp.now(),
        isActive: true
    };

    try {
        if (id) {
            await updateDoc(doc(db, "custom_plans", id), planData);
        } else {
            planData.createdAt = Timestamp.now();
            await addDoc(collection(db, "custom_plans"), planData);
        }
        planModal.style.display = 'none';
    } catch (error) {
        console.error("Erreur lors de l'enregistrement :", error);
        alert("Une erreur est survenue.");
    }
}

async function deletePlan(id) {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce plan ?")) {
        try {
            await deleteDoc(doc(db, "custom_plans", id));
        } catch (error) {
            console.error("Erreur suppression :", error);
        }
    }
}
