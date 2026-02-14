// Insta-Extractor v7.3 - "Sticky" Edition
// Remembers your hashtag and prioritizes it.

console.log('🚀 Insta-Extractor v7.3 Loaded');

// --- UTILS ---
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// --- UI INJECTION ---
function injectSimpleUI() {
    if (document.getElementById('insta-scraper-v7')) return;

    const div = document.createElement('div');
    div.id = 'insta-scraper-v7';
    div.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 20px;
        width: 320px;
        background: white;
        border: 2px solid #8e44ad;
        border-radius: 12px;
        padding: 15px;
        z-index: 9999999;
        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        font-family: sans-serif;
    `;

    div.innerHTML = `
        <h3 style="margin:0 0 10px; color:#8e44ad; display:flex; justify-content:space-between; align-items:center;">
            <span>🚀 Scraper v7.3</span>
            <span style="font-size:12px; color:#999; cursor:pointer;" onclick="this.parentElement.parentElement.remove()">❌</span>
        </h3>
        
        <div style="background:#f0f0f0; padding:8px; border-radius:6px; margin-bottom:10px;">
            <div style="font-size:11px; font-weight:bold; color:#555; margin-bottom:4px;">TARGET HASHTAG</div>
            <div style="display:flex; gap:5px;">
                <input type="text" id="hashtag-input" placeholder="Enter hashtag..." style="
                    flex: 1;
                    padding: 6px;
                    border: 1px solid #ccc;
                    border-radius: 4px;
                    font-size: 13px;
                    color: #333 !important;
                    background: #ffffff !important;
                ">
                <button id="btn-go" style="
                    padding: 6px 12px;
                    background: #8e44ad;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-weight:bold;
                ">GO</button>
            </div>
        </div>

        <div style="margin-bottom:10px; display:flex; gap:8px;">
            <button id="btn-scrape-posts" style="
                flex: 1;
                padding: 10px;
                background: #8e44ad;
                color: white;
                border: none;
                border-radius: 6px;
                font-weight: bold;
                cursor: pointer;
                font-size: 13px;
            ">
                ⚡ POSTS
            </button>
            <button id="btn-scrape-comments" style="
                flex: 1;
                padding: 10px;
                background: #3498db;
                color: white;
                border: none;
                border-radius: 6px;
                font-weight: bold;
                cursor: pointer;
                font-size: 13px;
            ">
                💬 COMMENTS
            </button>
        </div>

        <div id="v7-log" style="
            height: 100px;
            overflow-y: auto;
            background: #f8f9fa;
            border: 1px solid #eee;
            padding: 8px;
            font-size: 11px;
            color: #333;
            border-radius: 4px;
        ">Ready.</div>
    `;

    document.body.appendChild(div);

    // --- LOGIC ---
    const inputEl = document.getElementById('hashtag-input');

    // 1. Restore Sticky Value
    const savedTag = localStorage.getItem('sticky_hashtag');
    if (savedTag) {
        inputEl.value = savedTag;
    } else {
        // Try to auto-detect from URL if no saved tag
        const match = window.location.href.match(/\/tags\/([^/?]+)/);
        if (match) {
            inputEl.value = match[1];
        }
    }

    // 2. Save on Type
    inputEl.addEventListener('input', (e) => {
        localStorage.setItem('sticky_hashtag', e.target.value.trim());
    });

    // 3. Buttons
    document.getElementById('btn-go').addEventListener('click', () => {
        const val = inputEl.value.trim().replace(/^#/, '');
        if (val) {
            log(`Navigating to #${val}...`);
            window.location.href = `https://www.instagram.com/explore/tags/${val}/`;
        }
    });

    document.getElementById('btn-scrape-posts').addEventListener('click', scrapeVisiblePosts);
    document.getElementById('btn-scrape-comments').addEventListener('click', scrapeVisibleComments);
}

// Ensure UI stays on screen
setInterval(injectSimpleUI, 1000);

// --- LOGGING ---
function log(msg) {
    const el = document.getElementById('v7-log');
    if (el) {
        const time = new Date().toLocaleTimeString().split(' ')[0];
        el.innerHTML += `<div style="margin-bottom:4px; border-bottom:1px solid #eee; padding-bottom:2px;">
            <span style="color:#999">[${time}]</span> ${msg}
        </div>`;
        el.scrollTop = el.scrollHeight;
    }
    console.log('[Scraper v7.3]', msg);
}

// --- SCRAPE POSTS ---
function scrapeVisiblePosts() {
    log('🔍 Scanning posts...');

    // DETECT HASHTAG
    let hashtag = 'unknown';
    const inputEl = document.getElementById('hashtag-input');

    // PRIORITY 1: Input Box
    if (inputEl && inputEl.value.trim()) {
        hashtag = inputEl.value.trim().replace(/^#/, '');
        log(`🏷️ Using Typed Hashtag: #${hashtag}`);
    }
    // PRIORITY 2: URL
    else {
        const match = window.location.href.match(/\/tags\/([^/?]+)/);
        if (match) {
            hashtag = match[1];
            log(`🏷️ Found in URL: #${hashtag}`);
        } else {
            hashtag = 'manual_scrape'; // Fallback
            log('⚠️ No hashtag found. Using generic.');
        }
    }

    // SCRAPE DOM
    const posts = [];
    const seen = new Set();
    const selectors = 'a[href*="/p/"], a[href*="/reel/"]';

    document.querySelectorAll(selectors).forEach(a => {
        try {
            const href = a.getAttribute('href');
            if (!href) return;
            const shortcodeMatch = href.match(/\/(p|reel)\/([^/?]+)/);
            if (!shortcodeMatch) return;
            const shortcode = shortcodeMatch[2];

            if (seen.has(shortcode)) return;
            seen.add(shortcode);

            const img = a.querySelector('img');
            let caption = img ? (img.alt || '') : '';
            let owner = 'Unknown_Scraper';
            if (caption.includes('Photo by ')) owner = caption.split('Photo by ')[1]?.split(' on ')[0] || owner;

            posts.push({
                id: shortcode,
                shortcode: shortcode,
                url: href.startsWith('http') ? href : `https://www.instagram.com${href}`,
                caption: caption,
                owner: owner,
                likes: '0',
                commentsCount: '0',
                timestamp: new Date().toISOString(),
                searchQuery: hashtag
            });
        } catch (e) { }
    });

    log(`📦 Found ${posts.length} posts.`);

    if (posts.length === 0) {
        log('❌ No posts found. Scroll down!');
        return;
    }

    uploadData(posts, 'UPLOAD_HASHTAGS');
}

// --- SCRAPE COMMENTS ---
async function scrapeVisibleComments() {
    log('💬 Scanning comments...');

    const urlMatch = window.location.href.match(/\/(p|reel)\/([^/?]+)/);
    const mediaId = urlMatch ? urlMatch[2] : 'unknown_post';

    // Try scroll
    const dialog = document.querySelector('div[role="dialog"]');
    if (dialog) {
        const scrollable = dialog.querySelector('div[style*="overflow"]');
        if (scrollable) { scrollable.scrollTop = scrollable.scrollHeight; await sleep(1000); }
    } else {
        window.scrollBy(0, 500);
        await sleep(1000);
    }

    const comments = [];
    const seen = new Set();
    document.querySelectorAll('a[role="link"]').forEach(link => {
        try {
            const username = link.innerText;
            if (!username || username.includes('Likes') || username.includes('Reply')) return;

            const rowText = link.closest('div')?.innerText || '';
            let text = '';
            if (rowText.length > username.length + 2) {
                text = rowText.replace(username, '').replace(/Reply\s*$/, '').replace(/\d+[hw]\s*$/, '').trim();
            }

            if (username && text && text.length > 2 && !seen.has(username + text.substring(0, 10))) {
                seen.add(username + text.substring(0, 10));
                comments.push({
                    id: 'c_' + Math.random().toString(36).substr(2, 9),
                    username: username,
                    text: text,
                    timestamp: new Date().toISOString(),
                    mediaId: mediaId
                });
            }
        } catch (e) { }
    });

    log(`📦 Found ${comments.length} comments.`);
    if (comments.length > 0) uploadData(comments, 'UPLOAD_COMMENTS');
    else log('⚠️ No comments found.');
}

// --- UPLOADER ---
function uploadData(data, actionType) {
    log(`📤 Uploading ${data.length} items...`);
    try {
        if (!chrome || !chrome.runtime) { log('❌ Reload Extension!'); return; }
        chrome.runtime.sendMessage({ action: actionType, data: data }, (response) => {
            if (chrome.runtime.lastError) { log('❌ Connection Error'); return; }
            if (response && (response.success || response.count)) {
                log(`✅ SUCCESS! Saved ${response.count || data.length}.`);
                alert(`✅ Success! Saved ${response.count || data.length} items.`);
            } else {
                log('❌ Upload Failed: ' + (response?.error || 'Unknown Error'));
            }
        });
    } catch (e) { log('❌ Error: ' + e.message); }
}

// --- BACKGROUND LISTENER ---
window.addEventListener('message', (event) => {
    if (event.source !== window) return;
    if (event.data?.type === 'INSTAGRAM_API_DATA' && event.data.posts?.length > 0) {
        log(`📡 API Auto-caught ${event.data.posts.length} posts`);
        uploadData(event.data.posts, 'UPLOAD_HASHTAGS');
    }
});
