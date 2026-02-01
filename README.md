# FeedRelay

**Relay RSS feed news to Discord via webhooks - Deployed on Vercel**

## Features

- 📡 Add and manage RSS feeds
- 🎮 Send articles to Discord via webhooks
- ⏰ Automatic check every 5 minutes (Vercel Cron)
- 🎨 Modern dark theme dashboard
- ☁️ Serverless architecture on Vercel

## Deployment

### 1. Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

Or connect your GitHub repo to Vercel Dashboard.

### 2. Add Vercel KV Storage

1. Go to your Vercel project dashboard
2. **Storage** → **Create Database** → **KV**
3. Connect it to your project
4. Vercel will auto-add `KV_REST_API_URL` and `KV_REST_API_TOKEN` env vars

### 3. Configure Cron (Pro Plan)

Vercel Cron jobs require a Pro plan. The cron is configured in `vercel.json` to run every 5 minutes.

For Hobby plan, use an external cron service (like cron-job.org) to call:
```
POST https://your-project.vercel.app/api/cron
```

## Usage

1. Open your deployed site
2. **Configure Discord Webhook**: Paste your webhook URL
3. **Add RSS Feeds**: Enter RSS feed URLs to monitor
4. Articles will be sent to Discord automatically!

## Tech Stack

- Vercel Serverless Functions
- Vercel KV (Redis) for storage
- rss-parser for feed parsing
- Vanilla HTML/CSS/JS frontend