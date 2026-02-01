const { getConfig, saveConfig } = require('./_lib/storage');

module.exports = async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const config = await getConfig();

    // POST - Update settings
    if (req.method === 'POST') {
        const { checkInterval, embedColor } = req.body;

        config.settings = {
            ...config.settings,
            checkInterval: checkInterval || config.settings.checkInterval || 5,
            embedColor: embedColor || config.settings.embedColor || '#5865F2'
        };

        await saveConfig(config);
        return res.status(200).json({ success: true, settings: config.settings });
    }

    // GET - Get settings
    if (req.method === 'GET') {
        return res.status(200).json(config.settings);
    }

    res.status(405).json({ error: 'Method not allowed' });
};
