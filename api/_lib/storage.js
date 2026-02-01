const { kv } = require('@vercel/kv');

// Default config structure
const defaultConfig = {
    webhook: { url: '', username: 'FeedRelay', avatarUrl: '' },
    feeds: [],
    settings: { checkInterval: 5, embedColor: '#5865F2' },
    sentArticles: []
};

// Get config from Vercel KV
async function getConfig() {
    try {
        const config = await kv.get('feedrelay:config');
        return config || defaultConfig;
    } catch (error) {
        console.error('KV get error:', error);
        return defaultConfig;
    }
}

// Save config to Vercel KV
async function saveConfig(config) {
    try {
        await kv.set('feedrelay:config', config);
        return true;
    } catch (error) {
        console.error('KV set error:', error);
        return false;
    }
}

module.exports = { getConfig, saveConfig, defaultConfig };
