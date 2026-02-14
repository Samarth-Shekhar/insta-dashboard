chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'UPLOAD_HASHTAGS') {
        console.log('[Background] Received upload request');
        console.log('[Background] Number of posts:', request.data?.length);
        console.log('[Background] Sample post:', request.data?.[0]);


        // Fetch from Background Script (Bypasses Page CSP)
        fetch('https://insta-backend-azure.vercel.app/api/hashtags/import', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ posts: request.data })
        })
            .then(async res => {
                console.log('[Background] Response status:', res.status);
                if (!res.ok) {
                    const errorText = await res.text();
                    console.error('[Background] Error response:', errorText);
                    throw new Error(errorText);
                }
                return res.json();
            })
            .then(data => {
                console.log('[Background] Upload Success:', data);
                sendResponse({ success: true, count: data.count });
            })
            .catch(err => {
                console.error('[Background] Upload Error:', err);
                sendResponse({ success: false, error: err.message });
            });

        return true; // Keep channel open for async response
    }

    if (request.action === 'UPLOAD_COMMENTS') {
        console.log('[Background] Uploading comments:', request.data?.length);
        fetch('https://insta-backend-azure.vercel.app/api/comments/import', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ comments: request.data })
        })
            .then(res => res.json())
            .then(data => sendResponse(data))
            .catch(err => sendResponse({ error: err.message }));
        return true;
    }

    if (request.action === 'PING') {
        sendResponse({ success: true, message: 'PONG' });
    }
});
