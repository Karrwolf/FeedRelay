const { getConfig, saveConfig } = require('./_lib/storage');
const { sendToDiscord } = require('./_lib/utils');

module.exports = async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const config = await getConfig();

    // POST - Update webhook
    if (req.method === 'POST') {
        const { url, username, avatarUrl } = req.body;

        config.webhook = {
            url: url || config.webhook.url,
            username: username || config.webhook.username || 'FeedRelay',
            avatarUrl: avatarUrl || config.webhook.avatarUrl
        };

        await saveConfig(config);
        return res.status(200).json({ success: true, webhook: config.webhook });
    }

    // GET - Get webhook config
    if (req.method === 'GET') {
        return res.status(200).json(config.webhook);
    }

    res.status(405).json({ error: 'Method not allowed' });
};
