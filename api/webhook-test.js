const { getConfig } = require('./_lib/storage');
const { sendToDiscord } = require('./_lib/utils');

module.exports = async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const config = await getConfig();

    if (!config.webhook.url) {
        return res.status(400).json({ error: 'No webhook URL configured' });
    }

    const testArticle = {
        title: '🎉 Test de connexion FeedRelay',
        link: 'https://github.com',
        contentSnippet: 'Votre webhook Discord est correctement configuré! Les articles RSS seront envoyés ici.',
        isoDate: new Date().toISOString()
    };

    const success = await sendToDiscord(
        config.webhook,
        testArticle,
        'FeedRelay Test',
        config.settings.embedColor
    );

    res.status(200).json({ success });
};
