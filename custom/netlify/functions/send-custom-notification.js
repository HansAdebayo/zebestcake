exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const data = JSON.parse(event.body);

    if (!data.orderId || !data.customerName || !data.phone || !data.items) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Champs manquants' }) };
    }

    const webhook1 = process.env.DISCORD_WEBHOOK_1;
    const webhook2 = process.env.DISCORD_WEBHOOK_2;

    // Formatage des articles
    const itemsText = (data.items || []).map(item => {
      const opts = Object.entries(item.selectedOptions || {})
        .map(([k, v]) => `${k}: ${v}`)
        .join(', ');
      return `• ${item.planName} — ${item.unitPrice.toFixed(2)} €${opts ? ` (${opts})` : ''}`;
    }).join('\n');

    const message = {
      username: 'ZeBest Custom Bot',
      embeds: [{
        title: '✨ NOUVELLE COMMANDE CUSTOM !',
        color: 0xC8553D,
        fields: [
          { name: '🔖 Référence',    value: data.orderId,      inline: true },
          { name: '👤 Client',       value: data.customerName, inline: true },
          { name: '📱 Téléphone',    value: data.phone,        inline: true },
          { name: '📧 Email',        value: data.email,        inline: true },
          { name: '📦 Source',       value: data.source === 'upsell' ? 'Upsell ZeBestCake' : 'Direct', inline: true },
          { name: '💰 Total',        value: `${data.totalPrice} €`, inline: true },
          { name: '🛍️ Articles',     value: itemsText || '—',  inline: false },
          { name: '🔗 Admin',        value: '[Voir la commande](https://custom.zebestcake.fr/admin/orders.html)', inline: false }
        ],
        timestamp: new Date().toISOString()
      }]
    };

    const webhooks = [webhook1, webhook2].filter(Boolean);

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
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': 'https://zebestcustom.netlify.app'
      },
      body: JSON.stringify({ message: 'Notification envoyée.' })
    };

  } catch (err) {
    console.error('send-custom-notification error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
