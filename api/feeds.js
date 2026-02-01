const { getConfig, saveConfig } = require('./_lib/storage');
const { parseFeed } = require('./_lib/utils');

module.exports = async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, PATCH, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const config = await getConfig();

    // POST - Add new feed
    if (req.method === 'POST') {
        const { url, name } = req.body;

        if (!url) {
            return res.status(400).json({ error: 'URL required' });
        }

        try {
            // Validate feed
            const parsedFeed = await parseFeed(url);

            const newFeed = {
                id: Date.now().toString(),
                url,
                name: name || parsedFeed.title || 'Feed sans nom',
                enabled: true,
                addedAt: new Date().toISOString(),
                lastChecked: null,
                status: 'ok',
                itemCount: parsedFeed.items?.length || 0
            };

            config.feeds.push(newFeed);
            await saveConfig(config);

            res.status(200).json({
                success: true,
                feed: newFeed,
                preview: parsedFeed.items?.slice(0, 3).map(item => ({
                    title: item.title,
                    link: item.link
                }))
            });
        } catch (error) {
            res.status(400).json({ error: `Invalid RSS feed: ${error.message}` });
        }
        return;
    }

    // GET - List feeds
    if (req.method === 'GET') {
        return res.status(200).json(config.feeds);
    }

    // DELETE - Remove feed
    if (req.method === 'DELETE') {
        const { id } = req.query;
        if (!id) {
            return res.status(400).json({ error: 'Feed ID required' });
        }

        config.feeds = config.feeds.filter(f => f.id !== id);
        await saveConfig(config);
        return res.status(200).json({ success: true });
    }

    // PATCH - Toggle feed
    if (req.method === 'PATCH') {
        const { id } = req.query;
        if (!id) {
            return res.status(400).json({ error: 'Feed ID required' });
        }

        const feed = config.feeds.find(f => f.id === id);
        if (feed) {
            feed.enabled = !feed.enabled;
            await saveConfig(config);
            return res.status(200).json({ success: true, enabled: feed.enabled });
        }
        return res.status(404).json({ error: 'Feed not found' });
    }

    res.status(405).json({ error: 'Method not allowed' });
};
