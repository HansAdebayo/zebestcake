(function () {
    'use strict';

    var form     = document.getElementById('contact-form');
    var submitBtn = document.getElementById('contact-submit');
    var statusEl = document.getElementById('contact-status');

    if (!form) return;

    form.addEventListener('submit', async function (e) {
        e.preventDefault();

        var name    = document.getElementById('contact-name').value.trim();
        var email   = document.getElementById('contact-email').value.trim();
        var subject = document.getElementById('contact-subject').value.trim();
        var message = document.getElementById('contact-message').value.trim();

        if (!name || !email || !message) {
            showStatus('Merci de remplir tous les champs obligatoires.', 'error');
            return;
        }

        submitBtn.disabled    = true;
        submitBtn.textContent = 'Envoi en cours…';
        showStatus('', '');

        try {
            var res = await fetch('/.netlify/functions/send-contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, subject, message })
            });

            if (!res.ok) throw new Error('Erreur serveur');

            form.reset();
            showStatus('Message envoyé. On vous répond sous 24h.', 'success');
            submitBtn.textContent = 'Message envoyé';

        } catch (err) {
            showStatus('Une erreur est survenue. Réessayez ou contactez-nous sur Instagram.', 'error');
            submitBtn.disabled    = false;
            submitBtn.textContent = 'Envoyer le message';
        }
    });

    function showStatus(text, type) {
        statusEl.textContent  = text;
        statusEl.dataset.type = type;
    }

})();
