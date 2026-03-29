
exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const orderData = JSON.parse(event.body);

    // TES LIENS SONT ICI : Ils sont sur le serveur, donc INVISIBLES pour les clients.
    const webhook1 = "https://discord.com/api/webhooks/1487754588105871360/3tFnPQ0GzztswFSGLP8n6eigPiOJ6ul6kZjH0db_zWmRWcuoXVJTG4x4Olpd8QCCwIAz";
    const webhook2 = "https://discord.com/api/webhooks/1487756721869820116/VXy9genLunKDjq4Hf5pyaXb0xh5910N0IvAW-AVa-GWsfv4fgCaFPMW7yRzsz1fA3mot";

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
    
    await Promise.all(webhooks.map(url => 
      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message)
      })
    ));

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*", // Autorise ton site à appeler la fonction
      },
      body: JSON.stringify({ message: "Notifications envoyées !" }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Erreur serveur" }),
    };
  }
};
