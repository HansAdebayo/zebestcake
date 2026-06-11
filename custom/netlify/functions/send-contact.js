exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const data = JSON.parse(event.body);

    if (!data.name || !data.email || !data.message) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Champs manquants' }) };
    }

    const webhook1 = "https://discord.com/api/webhooks/1487754588105871360/3tFnPQ0GzztswFSGLP8n6eigPiOJ6ul6kZjH0db_zWmRWcuoXVJTG4x4Olpd8QCCwIAz";
    const webhook2 = "https://discord.com/api/webhooks/1487756721869820116/VXy9genLunKDjq4Hf5pyaXb0xh5910N0IvAW-AVa-GWsfv4fgCaFPMW7yRzsz1fA3mot";

    const message = {
      username: 'ZeBest Custom Bot',
      embeds: [{
        title: '📩 NOUVEAU MESSAGE CONTACT',
        color: 0xC8553D,
        fields: [
          { name: '👤 Nom',     value: data.name,              inline: true },
          { name: '📧 Email',   value: data.email,             inline: true },
          { name: '📌 Sujet',   value: data.subject || '(aucun)', inline: false },
          { name: '💬 Message', value: data.message,           inline: false }
        ],
        timestamp: new Date().toISOString()
      }]
    };

    await Promise.all([webhook1, webhook2].map(url =>
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
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ message: 'Message envoyé.' })
    };

  } catch (err) {
    console.error('send-contact error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
