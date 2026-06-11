// admin/js/admin-plans.js
// Gestion des plans : liste ordonnée, création, édition, archivage.
// Protégé par auth Firebase.

import { db, auth } from '../../js/custom-firebase.js';
import {
    collection, onSnapshot,
    doc, addDoc, updateDoc, deleteDoc, Timestamp, getDoc, setDoc
} from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js';
import { onAuthStateChanged, signOut }
    from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js';

// ---- GUARD AUTH ----
onAuthStateChanged(auth, user => {
    if (!user) { window.location.href = 'login.html'; }
    else        { init(); }
});

// ---- CLOUDINARY ----
const CLOUDINARY_CLOUD  = 'do5yllup7';
const CLOUDINARY_PRESET = 'Zebest_custom_upload';

let mainWidget   = null;
let extrasWidget = null;
let mainImage    = '';    // images[0]
let extraImages  = [];   // images[1..n]

function makeWidget(multiple, onSuccess) {
    return cloudinary.createUploadWidget(
        {
            cloudName:           CLOUDINARY_CLOUD,
            uploadPreset:        CLOUDINARY_PRESET,
            sources:             ['local', 'url', 'camera'],
            multiple,
            cropping:            true,
            croppingAspectRatio: 0.8,
            language:            'fr'
        },
        (error, result) => {
            if (error) { console.error('Cloudinary error:', error); return; }
            if (result.event === 'success') onSuccess(result.info.secure_url);
        }
    );
}

function renderMainImage() {
    const wrap = document.getElementById('main-image-wrap');
    wrap.innerHTML = '';
    if (!mainImage) return;

    const div = document.createElement('div');
    div.className = 'main-image-preview';
    div.innerHTML = `
        <img src="${mainImage}" alt="Photo principale">
        <button type="button" class="thumb-remove" aria-label="Supprimer">×</button>
    `;
    div.querySelector('.thumb-remove').addEventListener('click', () => {
        mainImage = '';
        renderMainImage();
    });
    wrap.appendChild(div);
}

function renderExtraThumbs() {
    const container = document.getElementById('extras-thumbs');
    container.innerHTML = '';
    extraImages.forEach((url, i) => {
        const wrap = document.createElement('div');
        wrap.className = 'image-thumb';
        wrap.innerHTML = `
            <img src="${url}" alt="Exemple ${i + 1}">
            <button type="button" class="thumb-remove" data-index="${i}" aria-label="Supprimer">×</button>
        `;
        container.appendChild(wrap);
    });
    container.querySelectorAll('.thumb-remove').forEach(btn => {
        btn.addEventListener('click', () => {
            extraImages.splice(parseInt(btn.dataset.index, 10), 1);
            renderExtraThumbs();
        });
    });
}

// ---- UPSELL TOGGLE ----
const UPSELL_DOC = doc(db, 'settings', 'upsell');

async function initUpsellToggle() {
    const btn = document.getElementById('upsell-toggle-btn');
    if (!btn) return;
    try {
        const snap    = await getDoc(UPSELL_DOC);
        const enabled = snap.exists() ? snap.data().enabled !== false : true;
        updateToggleBtn(btn, enabled);
    } catch { btn.textContent = 'Popup ?'; }

    btn.addEventListener('click', async () => {
        btn.disabled = true;
        try {
            const snap    = await getDoc(UPSELL_DOC);
            const current = snap.exists() ? snap.data().enabled !== false : true;
            await setDoc(UPSELL_DOC, { enabled: !current });
            updateToggleBtn(btn, !current);
        } catch (err) { console.error(err); }
        btn.disabled = false;
    });
}

function updateToggleBtn(btn, enabled) {
    btn.textContent     = enabled ? 'Popup ON' : 'Popup OFF';
    btn.dataset.enabled = enabled;
}

// ---- DONNÉES ----
let allPlans = [];

function getSorted() {
    return [...allPlans].sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999));
}

// Assigne des sortOrder aux plans qui n'en ont pas encore
async function ensureSortOrders(plans) {
    const missing = plans.filter(p => p.sortOrder == null);
    if (missing.length === 0) return;

    const maxOrder = plans.reduce((m, p) => p.sortOrder != null ? Math.max(m, p.sortOrder) : m, -1);
    const writes   = missing.map((p, i) =>
        updateDoc(doc(db, 'custom_plans', p.id), { sortOrder: maxOrder + i + 1 })
    );
    await Promise.all(writes);
    // onSnapshot se chargera du re-rendu
}

// ---- CHARGEMENT EN TEMPS RÉEL ----
function loadPlans() {
    const listEl = document.getElementById('plans-list');

    onSnapshot(collection(db, 'custom_plans'), snapshot => {
        allPlans = [];
        snapshot.forEach(snap => allPlans.push({ id: snap.id, ...snap.data() }));

        // Plans sans sortOrder → écriture en arrière-plan, le prochain snapshot re-rendra
        const missing = allPlans.filter(p => p.sortOrder == null);
        if (missing.length > 0) ensureSortOrders(allPlans);

        renderList();
    }, err => {
        listEl.innerHTML = `<p class="admin-empty" style="color:#8b0000;">Erreur : ${err.message}</p>`;
    });
}

function renderList() {
    const listEl  = document.getElementById('plans-list');
    const sorted  = getSorted();
    listEl.innerHTML = '';

    if (sorted.length === 0) {
        listEl.innerHTML = '<p class="admin-empty">Aucun plan. Cliquez sur "+ Nouveau plan" pour commencer.</p>';
        return;
    }

    sorted.forEach((plan, idx) => {
        listEl.appendChild(renderPlanRow(plan, idx, sorted.length));
    });
}

function renderPlanRow(plan, idx, total) {
    const row      = document.createElement('div');
    row.className  = 'plan-row';
    row.dataset.id = plan.id;

    const imgSrc     = (Array.isArray(plan.images) && plan.images[0]) ? plan.images[0]
                     : (plan.image || '');
    const price      = typeof plan.basePrice === 'number' ? plan.basePrice.toFixed(2) + ' €' : '—';
    const badgeClass = plan.isActive ? 'badge-active' : 'badge-archived';
    const badgeLabel = plan.isActive ? 'Actif' : 'Archivé';
    const optsCount  = (plan.options || []).length;

    row.innerHTML = `
        <div class="plan-row-order">
            <button class="sort-btn sort-up" ${idx === 0 ? 'disabled' : ''} aria-label="Remonter">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
            </button>
            <span class="sort-num">${idx + 1}</span>
            <button class="sort-btn sort-down" ${idx === total - 1 ? 'disabled' : ''} aria-label="Descendre">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M19 12l-7 7-7-7"/></svg>
            </button>
        </div>
        <div class="plan-row-img">
            ${imgSrc
                ? `<img src="${imgSrc}" alt="${plan.title}" loading="lazy">`
                : '<div class="plan-row-img-placeholder"></div>'
            }
        </div>
        <div class="plan-row-info">
            <h3>${plan.title}</h3>
            <p>${plan.category || '—'} · ${price}</p>
            <p class="plan-row-opts">${optsCount} option${optsCount !== 1 ? 's' : ''} · ${(plan.images || []).length} image${(plan.images || []).length !== 1 ? 's' : ''}</p>
        </div>
        <div class="plan-row-status">
            <span class="badge ${badgeClass}">${badgeLabel}</span>
        </div>
        <div class="plan-row-actions">
            <button class="btn btn-outline btn-sm edit-btn">Modifier</button>
            <button class="btn btn-ghost btn-sm toggle-btn">${plan.isActive ? 'Archiver' : 'Activer'}</button>
            <button class="btn btn-danger btn-sm delete-btn">Suppr.</button>
        </div>
    `;

    row.querySelector('.sort-up').addEventListener('click',    () => movePlan(plan.id, 'up'));
    row.querySelector('.sort-down').addEventListener('click',  () => movePlan(plan.id, 'down'));
    row.querySelector('.edit-btn').addEventListener('click',   () => openModal(plan));
    row.querySelector('.toggle-btn').addEventListener('click', () => toggleActive(plan));
    row.querySelector('.delete-btn').addEventListener('click', () => deletePlan(plan.id, plan.title));

    return row;
}

// ---- ORDRE (swap sortOrder) ----
async function movePlan(planId, direction) {
    const sorted = getSorted();
    const idx    = sorted.findIndex(p => p.id === planId);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;

    if (swapIdx < 0 || swapIdx >= sorted.length) return;

    const planA  = sorted[idx];
    const planB  = sorted[swapIdx];

    // Boutons désactivés le temps du write
    const rows = document.querySelectorAll('.plan-row');
    rows.forEach(r => {
        r.querySelectorAll('.sort-btn').forEach(b => { b.disabled = true; });
    });

    try {
        await Promise.all([
            updateDoc(doc(db, 'custom_plans', planA.id), { sortOrder: planB.sortOrder }),
            updateDoc(doc(db, 'custom_plans', planB.id), { sortOrder: planA.sortOrder })
        ]);
    } catch (err) {
        console.error('Erreur swap sortOrder :', err);
    }
    // onSnapshot re-renders automatiquement
}

// ---- MODAL ----
function openModal(plan = null) {
    const modal    = document.getElementById('plan-modal');
    const titleEl  = document.getElementById('modal-title');
    const optsList = document.getElementById('options-list');
    const feedback = document.getElementById('plan-form-feedback');

    document.getElementById('plan-form').reset();
    optsList.innerHTML   = '';
    feedback.className   = 'feedback hidden';
    document.getElementById('plan-id').value = '';
    mainImage   = '';
    extraImages = [];
    renderMainImage();
    renderExtraThumbs();
    /* Réinitialise les widgets pour le prochain upload */
    mainWidget   = null;
    extrasWidget = null;

    if (plan) {
        titleEl.textContent = 'Modifier le plan';
        document.getElementById('plan-id').value          = plan.id;
        document.getElementById('plan-title').value       = plan.title        || '';
        document.getElementById('plan-category').value    = plan.category     || '';
        document.getElementById('plan-price').value       = plan.basePrice    ?? '';
        document.getElementById('plan-description').value = plan.description  || '';
        document.getElementById('plan-status').value      = String(plan.isActive !== false);

        const allImgs = Array.isArray(plan.images) && plan.images.length
            ? plan.images
            : (plan.image ? [plan.image] : []);
        mainImage   = allImgs[0] || '';
        extraImages = allImgs.slice(1);
        renderMainImage();
        renderExtraThumbs();

        (plan.options || []).forEach(opt => addOptionRow(opt));
    } else {
        titleEl.textContent = 'Nouveau plan';
        document.getElementById('plan-status').value = 'true';
        addOptionRow();
    }

    modal.classList.add('open');
    document.body.classList.add('modal-open');
}

function closeModal() {
    document.getElementById('plan-modal').classList.remove('open');
    document.body.classList.remove('modal-open');
}

// ---- OPTIONS BUILDER ----
function addOptionRow(opt = null) {
    const list     = document.getElementById('options-list');
    const row      = document.createElement('div');
    row.className  = 'option-row';
    const isSelect = opt?.type === 'select';
    const choices  = opt?.choices || [{ value: '', label: '', priceModifier: 0 }];

    row.innerHTML = `
        <div class="option-row-header">
            <div class="form-group">
                <label>ID (slug)</label>
                <input type="text" class="opt-id" value="${opt?.id || ''}" placeholder="ex: prenom" pattern="[a-z0-9_]+" required>
                <p class="form-hint">Minuscules, sans espace</p>
            </div>
            <div class="form-group">
                <label>Label affiché</label>
                <input type="text" class="opt-label" value="${opt?.label || ''}" placeholder="ex: Prénom à graver" required>
            </div>
            <div class="form-group" style="max-width:130px;">
                <label>Type</label>
                <select class="opt-type">
                    <option value="text"   ${!isSelect ? 'selected' : ''}>Texte</option>
                    <option value="select" ${isSelect  ? 'selected' : ''}>Liste</option>
                </select>
            </div>
            <div class="form-group" style="max-width:90px; padding-top:1.5rem;">
                <label style="display:flex; align-items:center; gap:0.4rem; text-transform:none; letter-spacing:0;">
                    <input type="checkbox" class="opt-required" ${opt?.required ? 'checked' : ''}> Requis
                </label>
            </div>
            <button type="button" class="remove-btn remove-option" title="Supprimer">×</button>
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
            <label style="font-size:0.72rem; text-transform:uppercase; letter-spacing:0.08em; font-weight:500;">Choix disponibles</label>
            <div class="choices-list" style="margin-top:0.5rem;"></div>
            <button type="button" class="btn btn-ghost btn-sm add-choice-btn" style="margin-top:0.5rem;">+ Choix</button>
        </div>
    `;

    row.querySelector('.opt-type').addEventListener('change', function () {
        const sel = this.value === 'select';
        row.querySelector('.opt-text-meta').style.display   = sel ? 'none' : '';
        row.querySelector('.opt-select-meta').style.display = sel ? '' : 'none';
    });
    row.querySelector('.remove-option').addEventListener('click', () => row.remove());
    row.querySelector('.add-choice-btn').addEventListener('click', () => {
        addChoiceRow(row.querySelector('.choices-list'));
    });

    if (isSelect) {
        const cl = row.querySelector('.choices-list');
        choices.forEach(c => addChoiceRow(cl, c));
    }

    list.appendChild(row);
}

function addChoiceRow(container, choice = null) {
    const row      = document.createElement('div');
    row.className  = 'choice-row';
    row.innerHTML  = `
        <input type="text"   class="choice-value"    placeholder="valeur"  value="${choice?.value || ''}">
        <input type="text"   class="choice-label"    placeholder="affiché" value="${choice?.label || ''}">
        <input type="number" class="choice-modifier" placeholder="+€"      value="${choice?.priceModifier ?? 0}" min="0" step="0.01" style="max-width:70px;">
        <button type="button" class="remove-btn remove-choice" title="Supprimer">×</button>
    `;
    row.querySelector('.remove-choice').addEventListener('click', () => row.remove());
    container.appendChild(row);
}

function collectOptions() {
    const options = [];
    document.querySelectorAll('.option-row').forEach(row => {
        const type = row.querySelector('.opt-type').value;
        const opt  = {
            id:       row.querySelector('.opt-id').value.trim(),
            label:    row.querySelector('.opt-label').value.trim(),
            type,
            required: row.querySelector('.opt-required').checked
        };
        if (type === 'text') {
            const ml        = parseInt(row.querySelector('.opt-maxlength').value, 10);
            opt.placeholder = row.querySelector('.opt-placeholder').value.trim();
            opt.hint        = row.querySelector('.opt-hint').value.trim();
            if (!isNaN(ml) && ml > 0) opt.maxLength = ml;
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
    const feedback  = document.getElementById('plan-form-feedback');
    const submitBtn = e.target.querySelector('[type="submit"]');

    submitBtn.disabled   = true;
    feedback.className   = 'feedback loading';
    feedback.textContent = 'Enregistrement…';
    feedback.classList.remove('hidden');

    const id       = document.getElementById('plan-id').value;
    const isActive = document.getElementById('plan-status').value === 'true';

    const images = mainImage ? [mainImage, ...extraImages] : [...extraImages];

    const planData = {
        title:       document.getElementById('plan-title').value.trim(),
        category:    document.getElementById('plan-category').value.trim(),
        basePrice:   parseFloat(document.getElementById('plan-price').value),
        description: document.getElementById('plan-description').value.trim(),
        images,
        options:     collectOptions(),
        isActive,
        updatedAt:   Timestamp.now()
    };

    try {
        if (id) {
            await updateDoc(doc(db, 'custom_plans', id), planData);
        } else {
            // sortOrder = max existant + 1
            const maxOrder      = allPlans.reduce((m, p) => p.sortOrder != null ? Math.max(m, p.sortOrder) : m, -1);
            planData.sortOrder  = maxOrder + 1;
            planData.createdAt  = Timestamp.now();
            await addDoc(collection(db, 'custom_plans'), planData);
        }
        // Invalide le cache dans tous les onglets via localStorage
        sessionStorage.removeItem('zbcustom_catalogue');
        localStorage.setItem('zbcustom_cache_bust', Date.now());
        submitBtn.disabled = false;
        closeModal();
    } catch (err) {
        console.error('Erreur sauvegarde :', err);
        feedback.className   = 'feedback error';
        feedback.textContent = 'Erreur lors de l\'enregistrement.';
        submitBtn.disabled   = false;
    }
}

// ---- ARCHIVAGE ----
async function toggleActive(plan) {
    try {
        await updateDoc(doc(db, 'custom_plans', plan.id), {
            isActive:  !plan.isActive,
            updatedAt: Timestamp.now()
        });
        localStorage.setItem('zbcustom_cache_bust', Date.now());
    } catch (err) { console.error('Erreur toggle :', err); }
}

// ---- SUPPRESSION ----
async function deletePlan(id, title) {
    if (!confirm(`Supprimer définitivement "${title}" ? Irréversible.`)) return;
    try {
        await deleteDoc(doc(db, 'custom_plans', id));
        localStorage.setItem('zbcustom_cache_bust', Date.now());
    } catch (err) { console.error('Erreur suppression :', err); }
}

// ---- INIT ----
function init() {
    document.getElementById('logout-btn').addEventListener('click', () => {
        signOut(auth).then(() => window.location.href = 'login.html');
    });

    initUpsellToggle();

    document.getElementById('add-plan-btn').addEventListener('click', () => openModal());
    document.getElementById('modal-close').addEventListener('click', closeModal);
    document.getElementById('cancel-modal-btn').addEventListener('click', closeModal);
    document.getElementById('modal-backdrop-admin').addEventListener('click', closeModal);
    document.getElementById('add-option-btn').addEventListener('click', () => addOptionRow());
    document.getElementById('plan-form').addEventListener('submit', handleSubmit);

    document.getElementById('main-upload-btn').addEventListener('click', () => {
        if (!mainWidget) mainWidget = makeWidget(false, url => {
            mainImage = url;
            renderMainImage();
        });
        mainWidget.open();
    });

    document.getElementById('extras-upload-btn').addEventListener('click', () => {
        if (!extrasWidget) extrasWidget = makeWidget(true, url => {
            extraImages.push(url);
            renderExtraThumbs();
        });
        extrasWidget.open();
    });

    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') closeModal();
    });

    loadPlans();
}
