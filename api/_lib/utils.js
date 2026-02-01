const RSSParser = require('rss-parser');
const parser = new RSSParser();

// Helper: Load data from Vercel KV or Edge Config
// For simplicity, we'll use environment variable for webhook URL
// and a simple in-memory cache for sent articles
// In production, use Vercel KV: https://vercel.com/docs/storage/vercel-kv

async function getConfig() {
    // Parse config from environment variable
    const configStr = process.env.FEEDRELAY_CONFIG || '{}';
    try {
        return JSON.parse(configStr);
    } catch {
        return {
            webhook: { url: '', username: 'FeedRelay' },
            feeds: [],
            settings: { embedColor: '#5865F2' },
            sentArticles: []
        };
    }
}

// Send to Discord webhook
async function sendToDiscord(webhook, article, feedTitle, embedColor) {
    if (!webhook.url) return false;

    const embed = {
        title: article.title?.substring(0, 256) || 'Sans titre',
        url: article.link,
        description: article.contentSnippet?.substring(0, 300) || article.content?.substring(0, 300) || '',
        color: parseInt((embedColor || '#5865F2').replace('#', ''), 16),
        author: { name: feedTitle },
        timestamp: article.isoDate || new Date().toISOString(),
        footer: { text: 'FeedRelay' }
    };

    if (article.enclosure?.url) {
        embed.thumbnail = { url: article.enclosure.url };
    }

    const payload = {
        username: webhook.username || 'FeedRelay',
        avatar_url: webhook.avatarUrl || undefined,
        embeds: [embed]
    };

    try {
        const response = await fetch(webhook.url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        return response.ok;
    } catch (error) {
        console.error('Discord webhook error:', error);
        return false;
    }
}

// Parse RSS feed
async function parseFeed(url) {
    return await parser.parseURL(url);
}

module.exports = { getConfig, sendToDiscord, parseFeed };
