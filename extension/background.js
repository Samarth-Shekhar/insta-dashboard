chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    const ENDPOINTS = [
        'http://localhost:5001/api',
        'https://insta-backend-azure.vercel.app/api'
    ];

    async function sendToBackend(path, body, token = null) {
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        for (const base of ENDPOINTS) {
            try {
                console.log(`[Background] Trying upload to: ${base}${path}`);
                const res = await fetch(`${base}${path}`, {
                    method: 'POST',
                    headers: headers,
                    body: JSON.stringify(body)
                });
                if (res.ok) {
                    const data = await res.json();
                    console.log(`[Background] Success with ${base}`);
                    return data;
                }
            } catch (e) {
                console.warn(`[Background] Failed to reach ${base}:`, e);
            }
        }
        throw new Error('All backend endpoints failed');
    }

    if (request.action === 'UPLOAD_HASHTAGS') {
        sendToBackend('/hashtags/import', { posts: request.data, token: request.token }, request.token)
            .then(data => sendResponse({ success: true, count: data.count }))
            .catch(err => sendResponse({ success: false, error: err.message }));
        return true;
    }

    if (request.action === 'UPLOAD_COMMENTS') {
        sendToBackend('/comments/import', { comments: request.data, token: request.token }, request.token)
            .then(data => sendResponse(data))
            .catch(err => sendResponse({ error: err.message }));
        return true;
    }

    if (request.action === 'MARK_SCRAPED') {
        sendToBackend('/hashtags/mark-scraped', { id: request.id, count: request.count }, request.token);
        return true;
    }

    if (request.action === 'PING') {
        sendResponse({ success: true, message: 'PONG' });
    }
});
