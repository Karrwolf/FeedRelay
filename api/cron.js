const { getConfig, saveConfig } = require('./_lib/storage');
const { parseFeed, sendToDiscord } = require('./_lib/utils');

module.exports = async function handler(req, res) {
    // Verify cron secret for security (optional but recommended)
    const authHeader = req.headers.authorization;
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && process.env.CRON_SECRET) {
        // Allow manual triggers without secret for testing
        if (req.method !== 'POST') {
            return res.status(401).json({ error: 'Unauthorized' });
        }
    }

    console.log(`[${new Date().toISOString()}] Running feed check...`);

    const config = await getConfig();

    if (!config.webhook.url) {
        console.log('No webhook configured, skipping');
        return res.status(200).json({ success: true, message: 'No webhook configured' });
    }

    if (config.feeds.length === 0) {
        console.log('No feeds configured, skipping');
        return res.status(200).json({ success: true, message: 'No feeds configured' });
    }

    let sentCount = 0;
    const results = [];

    for (const feed of config.feeds) {
        if (!feed.enabled) continue;

        try {
            const parsedFeed = await parseFeed(feed.url);

            for (const item of parsedFeed.items.slice(0, 5)) {
                const articleId = item.guid || item.link || item.title;

                if (!config.sentArticles.includes(articleId)) {
                    const success = await sendToDiscord(
                        config.webhook,
                        item,
                        parsedFeed.title || feed.name,
                        config.settings.embedColor
                    );

                    if (success) {
                        config.sentArticles.push(articleId);
                        sentCount++;
                        console.log(`✓ Sent: ${item.title?.substring(0, 50)}...`);

                        // Rate limiting - wait 1 second between messages
                        await new Promise(resolve => setTimeout(resolve, 1000));
                    }
                }
            }

            // Keep only last 500 sent articles
            if (config.sentArticles.length > 500) {
                config.sentArticles = config.sentArticles.slice(-500);
            }

            // Update feed status
            feed.lastChecked = new Date().toISOString();
            feed.status = 'ok';
            feed.error = null;

            results.push({ feed: feed.name, status: 'ok' });
        } catch (error) {
            console.error(`Error checking feed ${feed.name}:`, error.message);
            feed.status = 'error';
            feed.error = error.message;
            results.push({ feed: feed.name, status: 'error', error: error.message });
        }
    }

    await saveConfig(config);

    console.log(`Feed check complete. Sent ${sentCount} new articles.`);

    res.status(200).json({
        success: true,
        sentCount,
        results,
        timestamp: new Date().toISOString()
    });
};
