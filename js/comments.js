import { db } from './firebase-config.js';
import { collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js';

document.addEventListener('DOMContentLoaded', () => {
    const commentListTbody = document.getElementById('comment-list-tbody');
    const commentModal = document.getElementById('comment-modal');
    const commentModalClose = document.getElementById('comment-modal-close');
    const addCommentBtn = document.getElementById('add-comment-btn');
    const commentForm = document.getElementById('comment-form');
    const commentFormTitle = document.getElementById('comment-form-title');
    const commentIdInput = document.getElementById('comment-id');
    const customerNameInput = document.getElementById('comment-author');
    const commentInput = document.getElementById('comment-text');
    const commentRatingInput = document.getElementById('comment-rating');

    let comments = [];

    function formatDate(date) {
        if (!date) {
            return 'N/A';
        }

        if (typeof date === 'string') {
            return date;
        }

        if (date.seconds) {
            const d = new Date(date.seconds * 1000);
            return d.toLocaleDateString();
        }

        return 'N/A';
    }

    function renderComments() {
        if (commentListTbody) {
            commentListTbody.innerHTML = '';
            comments.forEach(comment => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${comment.customerName}</td>
                    <td>${comment.comment}</td>
                    <td>${comment.rating}/5</td>
                    <td>${formatDate(comment.date)}</td>
                    <td>
                        <button class="edit-btn" data-id="${comment.id}">Modifier</button>
                        <button class="delete-btn" data-id="${comment.id}">Supprimer</button>
                    </td>
                `;
                commentListTbody.appendChild(row);
            });
        }
    }

    onSnapshot(collection(db, 'testimonials'), snapshot => {
        comments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderComments();
    });

    if (addCommentBtn) {
        addCommentBtn.addEventListener('click', () => {
            commentFormTitle.textContent = 'Ajouter un Commentaire';
            commentIdInput.value = '';
            customerNameInput.value = '';
            commentInput.value = '';
            commentRatingInput.value = 5;
            commentModal.style.display = 'block';
        });
    }

    if (commentModalClose) {
        commentModalClose.addEventListener('click', () => {
            commentModal.style.display = 'none';
        });
    }

    window.addEventListener('click', (event) => {
        if (event.target === commentModal) {
            commentModal.style.display = 'none';
        }
    });

    if (commentForm) {
        commentForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const id = commentIdInput.value;
            const customerName = customerNameInput.value;
            const comment = commentInput.value;
            const rating = commentRatingInput.value;

            console.log('Submitting comment:', { id, customerName, comment, rating });

            if (id) {
                // Update
                console.log('Updating comment...');
                await updateDoc(doc(db, 'testimonials', id), {
                    customerName,
                    comment,
                    rating
                });
                console.log('Comment updated!');
            } else {
                // Add
                console.log('Adding new comment...');
                await addDoc(collection(db, 'testimonials'), {
                    customerName,
                    comment,
                    rating,
                    date: new Date().toISOString().split('T')[0]
                });
                console.log('New comment added!');
            }
            commentModal.style.display = 'none';
        });
    }

    if (commentListTbody) {
        commentListTbody.addEventListener('click', async (event) => {
            const target = event.target;
            const id = target.dataset.id;

            if (target.classList.contains('delete-btn')) {
                if (confirm('Êtes-vous sûr de vouloir supprimer ce commentaire ?')) {
                    await deleteDoc(doc(db, 'testimonials', id));
                }
            }

            if (target.classList.contains('edit-btn')) {
                const comment = comments.find(c => c.id === id);
                if (comment) {
                    commentFormTitle.textContent = 'Modifier le Commentaire';
                    commentIdInput.value = comment.id;
                    customerNameInput.value = comment.customerName;
                    commentInput.value = comment.comment;
                    commentRatingInput.value = comment.rating;
                    commentModal.style.display = 'block';
                }
            }
        });
    }
});
