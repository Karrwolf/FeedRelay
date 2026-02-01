// ============================================
// FeedRelay - Frontend Application
// ============================================

const API_BASE = '';

// State
let appData = {
    webhook: { url: '', username: 'FeedRelay', avatarUrl: '' },
    feeds: [],
    settings: { checkInterval: 5, embedColor: '#5865F2' },
    sentArticles: []
};

// ============ UTILITIES ============

function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

async function apiCall(endpoint, method = 'GET', data = null) {
    try {
        const options = {
            method,
            headers: { 'Content-Type': 'application/json' }
        };

        if (data) {
            options.body = JSON.stringify(data);
        }

        const response = await fetch(`${API_BASE}${endpoint}`, options);
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'API Error');
        }

        return result;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

function formatDate(dateString) {
    if (!dateString) return 'Jamais';
    const date = new Date(dateString);
    return date.toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// ============ DATA LOADING ============

async function loadData() {
    try {
        appData = await apiCall('/api/data');
        updateUI();
    } catch (error) {
        showToast('Erreur de chargement des données', 'error');
    }
}

function updateUI() {
    // Update stats
    const enabledFeeds = appData.feeds.filter(f => f.enabled).length;
    document.getElementById('feedCount').textContent = enabledFeeds;
    document.getElementById('articlesSent').textContent = appData.sentArticles.length;
    document.getElementById('webhookStatus').textContent = appData.webhook.url ? '✓ Configuré' : 'Non configuré';
    document.getElementById('webhookStatus').style.color = appData.webhook.url ? '#3ba55d' : '#72767d';

    // Update webhook form
    document.getElementById('webhookUrl').value = appData.webhook.url || '';
    document.getElementById('webhookUsername').value = appData.webhook.username || 'FeedRelay';
    document.getElementById('embedColor').value = appData.settings.embedColor || '#5865F2';

    // Update settings
    document.getElementById('checkInterval').value = appData.settings.checkInterval || 5;

    // Update feeds list
    renderFeedsList();
}

function renderFeedsList() {
    const container = document.getElementById('feedsList');

    if (appData.feeds.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <span>📭</span>
                <p>Aucun feed configuré</p>
                <p class="small">Ajoutez votre premier flux RSS!</p>
            </div>
        `;
        return;
    }

    container.innerHTML = appData.feeds.map(feed => `
        <div class="feed-item ${feed.enabled ? '' : 'disabled'}">
            <div class="feed-status ${feed.status || 'pending'}"></div>
            <div class="feed-info">
                <div class="feed-name">${escapeHtml(feed.name)}</div>
                <div class="feed-url">${escapeHtml(feed.url)}</div>
                <div class="feed-meta">
                    Vérifié: ${formatDate(feed.lastChecked)}
                    ${feed.error ? `• ⚠️ ${feed.error}` : ''}
                </div>
            </div>
            <div class="feed-actions">
                <div class="toggle ${feed.enabled ? 'active' : ''}" onclick="toggleFeed('${feed.id}')"></div>
                <button class="btn btn-icon btn-secondary" onclick="deleteFeed('${feed.id}')" title="Supprimer">
                    🗑️
                </button>
            </div>
        </div>
    `).join('');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============ WEBHOOK ACTIONS ============

async function saveWebhook() {
    const url = document.getElementById('webhookUrl').value.trim();
    const username = document.getElementById('webhookUsername').value.trim() || 'FeedRelay';
    const embedColor = document.getElementById('embedColor').value;

    if (url && !url.includes('discord.com/api/webhooks')) {
        showToast('URL de webhook Discord invalide', 'error');
        return;
    }

    try {
        await apiCall('/api/webhook', 'POST', { url, username });
        await apiCall('/api/settings', 'POST', { embedColor });
        showToast('Webhook sauvegardé!', 'success');
        await loadData();
    } catch (error) {
        showToast('Erreur: ' + error.message, 'error');
    }
}

async function testWebhook() {
    if (!appData.webhook.url) {
        showToast('Configurez d\'abord le webhook', 'error');
        return;
    }

    try {
        showToast('Envoi du test...', 'info');
        const result = await apiCall('/api/webhook-test', 'POST');
        if (result.success) {
            showToast('Message test envoyé sur Discord!', 'success');
        } else {
            showToast('Échec de l\'envoi', 'error');
        }
    } catch (error) {
        showToast('Erreur: ' + error.message, 'error');
    }
}

// ============ FEED ACTIONS ============

async function addFeed() {
    const url = document.getElementById('feedUrl').value.trim();
    const name = document.getElementById('feedName').value.trim();

    if (!url) {
        showToast('Entrez une URL de flux RSS', 'error');
        return;
    }

    try {
        showToast('Vérification du flux...', 'info');
        const result = await apiCall('/api/feeds', 'POST', { url, name });

        // Show preview
        if (result.preview && result.preview.length > 0) {
            showPreview(result.preview);
        }

        showToast(`Feed "${result.feed.name}" ajouté!`, 'success');
        document.getElementById('feedUrl').value = '';
        document.getElementById('feedName').value = '';
        await loadData();
    } catch (error) {
        showToast('Erreur: ' + error.message, 'error');
    }
}

function showPreview(items) {
    const preview = document.getElementById('feedPreview');
    const content = document.getElementById('previewContent');

    content.innerHTML = items.map(item => `
        <div class="preview-item">
            <a href="${item.link}" target="_blank">${escapeHtml(item.title)}</a>
        </div>
    `).join('');

    preview.classList.remove('hidden');

    setTimeout(() => {
        preview.classList.add('hidden');
    }, 10000);
}

async function deleteFeed(id) {
    if (!confirm('Supprimer ce feed?')) return;

    try {
        await apiCall(`/api/feeds?id=${id}`, 'DELETE');
        showToast('Feed supprimé', 'success');
        await loadData();
    } catch (error) {
        showToast('Erreur: ' + error.message, 'error');
    }
}

async function toggleFeed(id) {
    try {
        await apiCall(`/api/feeds?id=${id}`, 'PATCH');
        await loadData();
    } catch (error) {
        showToast('Erreur: ' + error.message, 'error');
    }
}

// ============ SETTINGS ============

async function saveSettings() {
    const checkInterval = parseInt(document.getElementById('checkInterval').value);

    try {
        await apiCall('/api/settings', 'POST', { checkInterval });
        showToast('Paramètres sauvegardés!', 'success');
        await loadData();
    } catch (error) {
        showToast('Erreur: ' + error.message, 'error');
    }
}

async function checkNow() {
    try {
        showToast('Vérification en cours...', 'info');
        await apiCall('/api/cron', 'POST');
        showToast('Vérification terminée!', 'success');
        await loadData();
    } catch (error) {
        showToast('Erreur: ' + error.message, 'error');
    }
}

// ============ INIT ============

document.addEventListener('DOMContentLoaded', () => {
    loadData();

    // Auto-refresh every 30 seconds
    setInterval(loadData, 30000);
});
