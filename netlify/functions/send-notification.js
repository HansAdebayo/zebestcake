
exports.handler = async (event) => {
  // On n'autorise que les requêtes POST
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const orderData = JSON.parse(event.body);

    // RÉCUPÉRATION DES URLS DEPUIS LES VARIABLES D'ENVIRONNEMENT (CACHÉES)
    const webhook1 = process.env.DISCORD_WEBHOOK_1;
    const webhook2 = process.env.DISCORD_WEBHOOK_2;

    const message = {
      username: "Zebestcake Order Bot",
      embeds: [{
        title: "🎂 NOUVELLE COMMANDE !",
        color: 16742104,
        fields: [
          { name: "Référence", value: orderData.orderId, inline: true },
          { name: "Client", value: orderData.customerName, inline: true },
          { name: "📱 Téléphone", value: orderData.phone, inline: true },
          { name: "📧 Email", value: orderData.email, inline: true },
          { name: "🎂 Gâteau", value: orderData.cakeInfo, inline: false },
          { name: "💰 Prix Total", value: `${orderData.totalPrice} €`, inline: true },
          { name: "📅 Livraison", value: orderData.deliveryDate, inline: true },
          { name: "📝 Notes", value: orderData.notes || "Aucune", inline: false },
          { name: "🔗 Action", value: "[Ouvrir le panneau d'administration](https://zebestcake.netlify.app/admin.html)", inline: false }
        ],
        timestamp: new Date().toISOString()
      }]
    };

    const webhooks = [webhook1, webhook2].filter(url => !!url);
    
    // Envoi aux webhooks
    await Promise.all(webhooks.map(url => 
      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message)
      })
    ));

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Notifications envoyées avec succès" }),
    };
  } catch (error) {
    console.error("Erreur fonction Netlify:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Erreur lors de l'envoi" }),
    };
  }
};
