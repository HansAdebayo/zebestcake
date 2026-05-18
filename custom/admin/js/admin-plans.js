// custom/admin/js/admin-plans.js
// Gestion des plans de custom : liste, création, édition, archivage.
// Protégé par auth Firebase.

import { db, auth } from '../../js/custom-firebase.js';
import {
    collection, query, orderBy, onSnapshot,
    doc, addDoc, updateDoc, deleteDoc, Timestamp, getDoc, setDoc
} from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js';
import { onAuthStateChanged, signOut }
    from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js';

// ---- GUARD AUTH ----
onAuthStateChanged(auth, user => {
    if (!user) {
        window.location.href = 'login.html';
    } else {
        init();
    }
});

// ---- CLOUDINARY ----
const CLOUDINARY_CLOUD  = 'do5yllup7';
const CLOUDINARY_PRESET = 'Zebest_custom_upload';

let cloudinaryWidget = null;
let currentImages    = []; // tableau d'URLs

function initCloudinaryWidget() {
    cloudinaryWidget = cloudinary.createUploadWidget(
        {
            cloudName:    CLOUDINARY_CLOUD,
            uploadPreset: CLOUDINARY_PRESET,
            sources:      ['local', 'url', 'camera'],
            multiple:     true,
            cropping:     true,
            croppingAspectRatio: 0.8,
            language:     'fr'
        },
        (error, result) => {
            if (error) { console.error('Cloudinary error:', error); return; }
            if (result.event === 'success') {
                currentImages.push(result.info.secure_url);
                renderThumbs();
            }
        }
    );
}

function renderThumbs() {
    const container = document.getElementById('images-thumbs');
    container.innerHTML = '';
    currentImages.forEach((url, index) => {
        const wrap = document.createElement('div');
        wrap.className = 'image-thumb';
        if (index === 0) wrap.classList.add('image-thumb-main');
        wrap.innerHTML = `
            <img src="${url}" alt="Image ${index + 1}">
            ${index === 0 ? '<span class="thumb-label">Principale</span>' : ''}
            <button type="button" class="thumb-remove" data-index="${index}" aria-label="Supprimer">&times;</button>
        `;
        container.appendChild(wrap);
    });
    container.querySelectorAll('.thumb-remove').forEach(btn => {
        btn.addEventListener('click', () => {
            currentImages.splice(parseInt(btn.dataset.index, 10), 1);
            renderThumbs();
        });
    });
}

// ---- HERO IMAGE ----
const HOMEPAGE_DOC = doc(db, 'settings', 'homepage');
let heroWidget = null;

async function initHeroImage() {
    // Injecte la section dans le DOM (indépendant du cache HTML)
    const container = document.querySelector('.container');
    const plansHeader = document.querySelector('.admin-page-header');
    if (!container || !plansHeader) return;

    const section = document.createElement('div');
    section.style.cssText = 'border:1px solid #E0D6C8;padding:1.5rem;margin-bottom:2rem;background:#fff;';
    section.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:1rem;margin-bottom:1rem;">
            <div>
                <h2 style="font-size:1.05rem;margin-bottom:0.2rem;">Image d'accueil</h2>
                <p style="font-size:0.82rem;color:#8B7E72;">Image affichée dans le hero de la page d'accueil.</p>
            </div>
            <button id="hero-upload-btn" class="btn btn-outline btn-sm">Changer l'image</button>
        </div>
        <div>
            <img id="hero-preview-img" src="" alt="" style="max-width:300px;width:100%;display:none;">
            <p id="hero-preview-empty" style="font-size:0.82rem;color:#8B7E72;">Aucune image définie — l'image par défaut est utilisée.</p>
        </div>
    `;
    container.insertBefore(section, plansHeader);

    const uploadBtn   = document.getElementById('hero-upload-btn');
    const previewImg  = document.getElementById('hero-preview-img');
    const previewEmpty = document.getElementById('hero-preview-empty');

    // Charger l'image actuelle
    try {
        const snap = await getDoc(HOMEPAGE_DOC);
        if (snap.exists() && snap.data().heroImage) {
            previewImg.src = snap.data().heroImage;
            previewImg.style.display = 'block';
            previewEmpty.style.display = 'none';
        }
    } catch (err) {
        console.error('Hero image load error:', err);
    }

    // Bouton upload
    uploadBtn.addEventListener('click', () => {
        if (!heroWidget) {
            heroWidget = cloudinary.createUploadWidget(
                {
                    cloudName:    CLOUDINARY_CLOUD,
                    uploadPreset: CLOUDINARY_PRESET,
                    sources:      ['local', 'url', 'camera'],
                    multiple:     false,
                    cropping:     false,
                    language:     'fr'
                },
                async (error, result) => {
                    if (error) { console.error('Cloudinary error:', error); return; }
                    if (result.event === 'success') {
                        const url = result.info.secure_url;
                        try {
                            await setDoc(HOMEPAGE_DOC, { heroImage: url }, { merge: true });
                            previewImg.src = url;
                            previewImg.style.display = 'block';
                            previewEmpty.style.display = 'none';
                            uploadBtn.textContent = '✓ Image enregistrée';
                            setTimeout(() => { uploadBtn.textContent = 'Changer l\'image'; }, 2000);
                        } catch (err) {
                            console.error('Hero image save error:', err);
                        }
                    }
                }
            );
        }
        heroWidget.open();
    });
}

// ---- UPSELL TOGGLE ----
const UPSELL_DOC = doc(db, 'settings', 'upsell');

async function initUpsellToggle() {
    const btn = document.getElementById('upsell-toggle-btn');
    if (!btn) return;

    try {
        const snap = await getDoc(UPSELL_DOC);
        const enabled = snap.exists() ? snap.data().enabled !== false : true;
        updateToggleBtn(btn, enabled);
    } catch (err) {
        btn.textContent = 'Erreur';
    }

    btn.addEventListener('click', async () => {
        btn.disabled = true;
        try {
            const snap = await getDoc(UPSELL_DOC);
            const current = snap.exists() ? snap.data().enabled !== false : true;
            await setDoc(UPSELL_DOC, { enabled: !current });
            updateToggleBtn(btn, !current);
        } catch (err) {
            console.error('Toggle upsell :', err);
        }
        btn.disabled = false;
    });
}

function updateToggleBtn(btn, enabled) {
    btn.textContent = enabled ? '✓ Popup upsell active' : '✗ Popup upsell désactivée';
    btn.style.background = enabled ? '#2d7a4f' : '#8b0000';
}

// ---- INIT ----
function init() {
    document.getElementById('logout-btn').addEventListener('click', () => {
        signOut(auth).then(() => window.location.href = 'login.html');
    });

    initHeroImage();
    initUpsellToggle();

    document.getElementById('add-plan-btn').addEventListener('click', () => openModal());
    document.getElementById('modal-close').addEventListener('click', closeModal);
    document.getElementById('cancel-modal-btn').addEventListener('click', closeModal);
    document.getElementById('add-option-btn').addEventListener('click', () => addOptionRow());
    document.getElementById('plan-form').addEventListener('submit', handleSubmit);

    document.getElementById('plan-modal').addEventListener('click', e => {
        if (e.target === e.currentTarget) closeModal();
    });

    document.getElementById('cloudinary-upload-btn').addEventListener('click', () => {
        if (!cloudinaryWidget) initCloudinaryWidget();
        cloudinaryWidget.open();
    });


    loadPlans();
}

// ---- CHARGEMENT EN TEMPS RÉEL ----
function loadPlans() {
    const list = document.getElementById('plans-list');

    onSnapshot(collection(db, 'custom_plans'), snapshot => {
        list.innerHTML = '';

        if (snapshot.empty) {
            list.innerHTML = '<p class="text-pierre">Aucun plan. Cliquez sur "+ Nouveau plan" pour commencer.</p>';
            return;
        }

        snapshot.forEach(snap => {
            const plan = { id: snap.id, ...snap.data() };
            list.appendChild(renderPlanCard(plan));
        });
    }, err => {
        list.innerHTML = `<p class="feedback error">Erreur : ${err.message}</p>`;
    });
}

function renderPlanCard(plan) {
    const card = document.createElement('div');
    card.className = 'plan-admin-card';

    const badgeClass = plan.isActive ? 'badge-active' : 'badge-archived';
    const badgeLabel = plan.isActive ? 'Actif' : 'Archivé';

    card.innerHTML = `
        <div>
            <span class="badge ${badgeClass}">${badgeLabel}</span>
        </div>
        <h3>${plan.title}</h3>
        <p class="plan-meta">${plan.category || '—'}</p>
        <p class="plan-price-tag">${typeof plan.basePrice === 'number' ? plan.basePrice.toFixed(2) + ' €' : '—'}</p>
        <p class="plan-meta" style="margin-top: 0.35rem; font-size: 0.75rem;">
            ${(plan.options || []).length} option(s)
        </p>
        <div class="card-actions">
            <button class="btn btn-outline btn-sm edit-btn">Modifier</button>
            <button class="btn btn-ghost btn-sm toggle-btn">
                ${plan.isActive ? 'Archiver' : 'Activer'}
            </button>
            <button class="btn btn-danger btn-sm delete-btn">Supprimer</button>
        </div>
    `;

    card.querySelector('.edit-btn').addEventListener('click', () => openModal(plan));
    card.querySelector('.toggle-btn').addEventListener('click', () => toggleActive(plan));
    card.querySelector('.delete-btn').addEventListener('click', () => deletePlan(plan.id, plan.title));

    return card;
}

// ---- MODAL ----
function openModal(plan = null) {
    const modal    = document.getElementById('plan-modal');
    const title    = document.getElementById('modal-title');
    const form     = document.getElementById('plan-form');
    const optsList = document.getElementById('options-list');
    const feedback = document.getElementById('plan-form-feedback');

    form.reset();
    optsList.innerHTML = '';
    feedback.className = 'feedback hidden';
    document.getElementById('plan-id').value = '';

    // Reset images
    currentImages = [];
    renderThumbs();

    if (plan) {
        title.textContent = 'Modifier le plan';
        document.getElementById('plan-id').value           = plan.id;
        document.getElementById('plan-title').value        = plan.title || '';
        document.getElementById('plan-category').value     = plan.category || '';
        document.getElementById('plan-price').value        = plan.basePrice ?? '';
        document.getElementById('plan-description').value  = plan.description || '';
        document.getElementById('plan-status').value       = String(plan.isActive !== false);

        // Charger les images existantes (supporte ancien champ `image` et nouveau `images`)
        if (Array.isArray(plan.images) && plan.images.length > 0) {
            currentImages = [...plan.images];
        } else if (plan.image) {
            currentImages = [plan.image];
        }
        renderThumbs();

        (plan.options || []).forEach(opt => addOptionRow(opt));
    } else {
        title.textContent = 'Nouveau plan';
        document.getElementById('plan-status').value = 'true';
        addOptionRow(); // Option vide par défaut
    }

    modal.classList.add('open');
}

function closeModal() {
    document.getElementById('plan-modal').classList.remove('open');
}

// ---- OPTIONS BUILDER ----
function addOptionRow(opt = null) {
    const list = document.getElementById('options-list');
    const row  = document.createElement('div');
    row.className = 'option-row';

    const isSelect  = opt?.type === 'select';
    const choices   = (opt?.choices || [{ value: '', label: '', priceModifier: 0 }]);

    row.innerHTML = `
        <div class="option-row-header">
            <div class="form-group">
                <label>ID (slug)</label>
                <input type="text" class="opt-id" value="${opt?.id || ''}"
                    placeholder="ex: prenom" pattern="[a-z0-9_-]+" required>
                <p class="form-hint">Minuscules, sans espace</p>
            </div>
            <div class="form-group">
                <label>Label affiché</label>
                <input type="text" class="opt-label" value="${opt?.label || ''}"
                    placeholder="ex: Prénom à graver" required>
            </div>
            <div class="form-group" style="max-width: 130px;">
                <label>Type</label>
                <select class="opt-type">
                    <option value="text"   ${!isSelect ? 'selected' : ''}>Texte</option>
                    <option value="select" ${isSelect  ? 'selected' : ''}>Liste</option>
                </select>
            </div>
            <div class="form-group" style="max-width: 90px; padding-top: 1.5rem;">
                <label style="display:flex; align-items:center; gap:0.4rem; text-transform:none; letter-spacing:0;">
                    <input type="checkbox" class="opt-required" ${opt?.required ? 'checked' : ''}>
                    Requis
                </label>
            </div>
            <button type="button" class="remove-btn remove-option" title="Supprimer l'option">×</button>
        </div>

        <div class="option-row-meta opt-text-meta" style="${isSelect ? 'display:none' : ''}">
            <div class="form-group">
                <label>Placeholder</label>
                <input type="text" class="opt-placeholder" value="${opt?.placeholder || ''}">
            </div>
            <div class="form-group">
                <label>Max caractères</label>
                <input type="number" class="opt-maxlength" value="${opt?.maxLength || ''}" min="1" placeholder="—">
            </div>
            <div class="form-group">
                <label>Aide (hint)</label>
                <input type="text" class="opt-hint" value="${opt?.hint || ''}">
            </div>
        </div>

        <div class="option-choices opt-select-meta" style="${isSelect ? '' : 'display:none'}">
            <label style="font-size:0.72rem; text-transform:uppercase; letter-spacing:0.08em; font-weight:500;">
                Choix disponibles
            </label>
            <div class="choices-list" style="margin-top: 0.5rem;"></div>
            <button type="button" class="btn btn-ghost btn-sm add-choice-btn" style="margin-top:0.5rem;">
                + Choix
            </button>
        </div>
    `;

    // Affichage conditionnel text / select
    row.querySelector('.opt-type').addEventListener('change', function () {
        const isNowSelect = this.value === 'select';
        row.querySelector('.opt-text-meta').style.display   = isNowSelect ? 'none' : '';
        row.querySelector('.opt-select-meta').style.display = isNowSelect ? '' : 'none';
    });

    // Suppression de l'option
    row.querySelector('.remove-option').addEventListener('click', () => row.remove());

    // Ajout de choix
    row.querySelector('.add-choice-btn').addEventListener('click', () => {
        addChoiceRow(row.querySelector('.choices-list'));
    });

    // Pré-remplissage des choix existants
    if (isSelect) {
        const choicesList = row.querySelector('.choices-list');
        choices.forEach(c => addChoiceRow(choicesList, c));
    }

    list.appendChild(row);
}

function addChoiceRow(container, choice = null) {
    const row = document.createElement('div');
    row.className = 'choice-row';
    row.innerHTML = `
        <input type="text" class="choice-value" placeholder="valeur" value="${choice?.value || ''}">
        <input type="text" class="choice-label" placeholder="affiché" value="${choice?.label || ''}">
        <input type="number" class="choice-modifier" placeholder="+€" value="${choice?.priceModifier ?? 0}"
            min="0" step="0.01" style="max-width: 70px;">
        <button type="button" class="remove-btn remove-choice" title="Supprimer">×</button>
    `;
    row.querySelector('.remove-choice').addEventListener('click', () => row.remove());
    container.appendChild(row);
}

// ---- COLLECTE DES OPTIONS ----
function collectOptions() {
    const options = [];

    document.querySelectorAll('.option-row').forEach(row => {
        const type = row.querySelector('.opt-type').value;

        const opt = {
            id:       row.querySelector('.opt-id').value.trim(),
            label:    row.querySelector('.opt-label').value.trim(),
            type,
            required: row.querySelector('.opt-required').checked
        };

        if (type === 'text') {
            const maxLength   = parseInt(row.querySelector('.opt-maxlength').value, 10);
            opt.placeholder   = row.querySelector('.opt-placeholder').value.trim();
            opt.hint          = row.querySelector('.opt-hint').value.trim();
            if (!isNaN(maxLength) && maxLength > 0) opt.maxLength = maxLength;
        }

        if (type === 'select') {
            opt.choices = [];
            row.querySelectorAll('.choice-row').forEach(cr => {
                const value    = cr.querySelector('.choice-value').value.trim();
                const label    = cr.querySelector('.choice-label').value.trim();
                const modifier = parseFloat(cr.querySelector('.choice-modifier').value) || 0;
                if (value && label) opt.choices.push({ value, label, priceModifier: modifier });
            });
        }

        if (opt.id && opt.label) options.push(opt);
    });

    return options;
}

// ---- SAUVEGARDE ----
async function handleSubmit(e) {
    e.preventDefault();

    const feedback = document.getElementById('plan-form-feedback');
    const submitBtn = e.target.querySelector('[type="submit"]');
    submitBtn.disabled = true;
    feedback.className   = 'feedback loading';
    feedback.textContent = 'Enregistrement…';
    feedback.classList.remove('hidden');

    const id       = document.getElementById('plan-id').value;
    const isActive = document.getElementById('plan-status').value === 'true';

    const planData = {
        title:       document.getElementById('plan-title').value.trim(),
        category:    document.getElementById('plan-category').value.trim(),
        basePrice:   parseFloat(document.getElementById('plan-price').value),
        description: document.getElementById('plan-description').value.trim(),
        images:      currentImages,
        options:     collectOptions(),
        isActive,
        updatedAt:   Timestamp.now()
    };

    try {
        if (id) {
            await updateDoc(doc(db, 'custom_plans', id), planData);
        } else {
            planData.createdAt = Timestamp.now();
            await addDoc(collection(db, 'custom_plans'), planData);
        }
        closeModal();
    } catch (err) {
        console.error('Erreur sauvegarde plan :', err);
        feedback.className   = 'feedback error';
        feedback.textContent = 'Erreur lors de l\'enregistrement.';
        submitBtn.disabled = false;
    }
}

// ---- ARCHIVAGE ----
async function toggleActive(plan) {
    try {
        await updateDoc(doc(db, 'custom_plans', plan.id), {
            isActive:  !plan.isActive,
            updatedAt: Timestamp.now()
        });
    } catch (err) {
        console.error('Erreur toggle :', err);
    }
}

// ---- SUPPRESSION ----
async function deletePlan(id, title) {
    if (!confirm(`Supprimer définitivement "${title}" ? Cette action est irréversible.`)) return;
    try {
        await deleteDoc(doc(db, 'custom_plans', id));
    } catch (err) {
        console.error('Erreur suppression :', err);
    }
}
