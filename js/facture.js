import { db } from './firebase-config.js';
import { doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js';

document.addEventListener('DOMContentLoaded', () => {
    const invoiceIdSpan = document.getElementById('invoice-id');
    const invoiceDateSpan = document.getElementById('invoice-date');
    const customerNameP = document.getElementById('customer-name');
    const customerEmailP = document.getElementById('customer-email');
    const customerPhoneP = document.getElementById('customer-phone');
    const itemsTableBody = document.getElementById('invoice-items-body');
    const subtotalTd = document.getElementById('summary-subtotal');
    const deliveryTd = document.getElementById('summary-delivery');
    const totalTd = document.getElementById('summary-total');
    const downloadPdfBtn = document.getElementById('download-pdf-btn');
    const sendEmailBtn = document.getElementById('send-email-btn');
    const stampEl = document.getElementById('paid-stamp');

    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('orderId');

    if (orderId) {
        loadInvoiceData(orderId);
    } else {
        displayError('Aucun identifiant de commande fourni.');
    }

    async function loadInvoiceData(id) {
        try {
            const orderRef = doc(db, 'orders', id);
            const orderSnap = await getDoc(orderRef);

            if (orderSnap.exists()) {
                const orderData = orderSnap.data();
                populateInvoice(id, orderData);
                
                // Setup buttons
                downloadPdfBtn.addEventListener('click', () => downloadPDF(id));
                sendEmailBtn.addEventListener('click', () => sendInvoiceEmail(id, orderData));

            } else {
                displayError(`La commande avec l'identifiant ${id} n'a pas été trouvée.`);
            }
        } catch (error) {
            console.error('Erreur lors du chargement de la facture:', error);
            displayError('Une erreur est survenue lors du chargement des données de la facture.');
        }
    }

    function populateInvoice(id, order) {
        // --- Details --- //
        invoiceIdSpan.textContent = id;
        invoiceDateSpan.textContent = new Date().toLocaleDateString('fr-FR');

        // --- Customer --- //
        if (order.customerInfo) {
            customerNameP.textContent = `${order.customerInfo.firstName} ${order.customerInfo.lastName}`;
            customerEmailP.textContent = order.customerInfo.email;
            customerPhoneP.textContent = order.customerInfo.phone;
        }

        // --- Items --- //
        itemsTableBody.innerHTML = ''; // Clear any placeholder
        if (order.product) {
            const item = order.product;
            const itemRow = document.createElement('tr');
            const totalPriceForItem = order.pricing.basePrice;

            itemRow.innerHTML = `
                <td>${item.name} - ${item.size}</td>
                <td>1</td>
                <td>${order.pricing.basePrice.toFixed(2)} €</td>
                <td>${totalPriceForItem.toFixed(2)} €</td>
            `;
            itemsTableBody.appendChild(itemRow);
        }

        // --- Summary --- //
        if (order.pricing) {
            subtotalTd.textContent = `${order.pricing.basePrice.toFixed(2)} €`;
            deliveryTd.textContent = `${order.pricing.deliveryPrice.toFixed(2)} €`;
            totalTd.textContent = `${order.pricing.totalPrice.toFixed(2)} €`;
        }

        // --- Paid Stamp --- //
        if (order.status === 'Terminée' && order.delivery?.date) {
            const deliveryDate = order.delivery.date.toDate().toLocaleDateString('fr-FR');
            stampEl.innerHTML = `PAYÉ<br><span class="date">${deliveryDate}</span>`;
            stampEl.style.display = 'block';
        }
    }

    function downloadPDF(orderId) {
        const { jsPDF } = window.jspdf;
        const invoiceElement = document.querySelector(".invoice-container");
        const actions = document.querySelector(".actions-container");

        actions.style.display = 'none';

        html2canvas(invoiceElement, { 
            scale: 2,
            useCORS: true
        }).then(canvas => {
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'p',
                unit: 'mm',
                format: 'a4'
            });
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`facture-${orderId}.pdf`);
        }).catch(error => {
            console.error("Erreur lors de la génération du PDF:", error);
            alert("Une erreur est survenue lors de la création du PDF. Veuillez vérifier la console pour plus de détails.");
        }).finally(() => {
            actions.style.display = 'flex';
        });
    }

    function sendInvoiceEmail(orderId, order) {
        if (!order.customerInfo?.email) {
            alert("L'adresse e-mail du client n'est pas disponible.");
            return;
        }

        const recipient = order.customerInfo.email;
        const subject = `Votre facture ZeBestCake pour la commande #${orderId}`;
        const body = `Bonjour ${order.customerInfo.firstName || 'client(e)'},

Veuillez trouver ci-joint la facture correspondant à votre commande.
Nous vous remercions de votre confiance et espérons que vous vous régalerez !

N'hésitez pas à nous contacter pour toute question.

Cordialement,
L'équipe ZeBestCake

(N'oubliez pas de joindre le PDF de la facture que vous avez téléchargé).`;

        const gmailComposeUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(recipient)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        
        const gmailUrl = `https://accounts.google.com/AccountChooser?continue=${encodeURIComponent(gmailComposeUrl)}`;

        window.open(gmailUrl, '_blank');
    }

    function displayError(message) {
        const container = document.querySelector('.invoice-container');
        if (container) {
            container.innerHTML = `<p style="color: red; text-align: center;">${message}</p>`;
        }
    }
});