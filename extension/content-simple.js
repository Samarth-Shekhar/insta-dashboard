// Insta-Extractor v10.1 - "The Best of Both Worlds"
// Features: Full UI (v9), Auth Support (v10), Deep Scraping (v10), Smart Bot

console.log('🚀 Insta-Extractor v10.1 Loaded');

// --- UTILS ---
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// --- STATE ---
let isSmartRunning = false;
let smartStats = { batchCount: 0, total: 0 };
let hasAutoRun = false;

// --- CONFIG ---
const DEFAULT_CONFIG = {
    SCROLL_DELAY_SEC: 8.2,
    JITTER_MS: 2000,
    BATCH_LIMIT_MIN: 20,
    BATCH_LIMIT_MAX: 30,
    COOLING_MIN_MS: 120000,
    COOLING_MAX_MS: 300000
};

// --- LOGGING ---
function log(msg, type = 'info') {
    const el = document.getElementById('v7-log');
    if (el) {
        const time = new Date().toLocaleTimeString().split(' ')[0];
        let color = '#ecf0f1';
        if (type === 'success') color = '#2ecc71';
        if (type === 'warn') color = '#f1c40f';
        if (type === 'error') color = '#e74c3c';
        el.innerHTML += `<div style="margin-bottom:2px; color:${color};"><span style="opacity:0.6">[${time}]</span> ${msg}</div>`;
        el.scrollTop = el.scrollHeight;
    }
    console.log('[Bot]', msg);
}

// --- NETWORK UPLOAD ---
function uploadData(data, action, isSilent = false) {
    if (!data || data.length === 0) return;

    // Get token from URL if present (passed by Dashboard)
    // #scrape_comments&tag=foo&token=JWT_TOKEN
    let token = null;
    try {
        const hash = window.location.hash.substring(1);
        const params = new URLSearchParams(hash);
        token = params.get('token');
    } catch (e) { }

    chrome.runtime.sendMessage({
        action: action,
        data: data,
        token: token // Pass token to background
    }, (response) => {
        if (!isSilent) {
            if (response && (response.success || response.count)) {
                log(`✅ Uploaded ${data.length} items!`, 'success');
            } else {
                log(`❌ Upload Failed: ${response?.error || 'Unknown'}`, 'error');
            }
        }
    });
}

// --- UI INJECTION ---
function injectSimpleUI() {
    // 1. Check for Auto-Run Trigger from Dashboard URL
    if (!hasAutoRun && window.location.hash.includes('#scrape_comments')) {
        hasAutoRun = true;
        console.log('🤖 Auto-Scrape Triggered by URL!');
        // We delay slightly to let React hydration/page load finish
        setTimeout(() => scrapeVisibleComments(true), 2500);
    }

    if (document.getElementById('insta-scraper-v7')) return;

    const div = document.createElement('div');
    div.id = 'insta-scraper-v7';
    div.style.cssText = `
        position: fixed; bottom: 20px; left: 20px; width: 350px;
        background: white; border: 2px solid #8e44ad; border-radius: 12px;
        padding: 15px; z-index: 9999999; box-shadow: 0 10px 30px rgba(0,0,0,0.3); font-family: sans-serif;
    `;

    div.innerHTML = `
        <h3 style="margin:0 0 10px; color:#8e44ad; display:flex; justify-content:space-between; align-items:center;">
            <span>🤖 Scraper v10.1</span>
            <span style="font-size:12px; color:#999; cursor:pointer;" onclick="this.parentElement.parentElement.remove()">❌</span>
        </h3>
        
        <div style="background:#f0f0f0; padding:8px; border-radius:6px; margin-bottom:10px;">
            <div style="font-size:11px; font-weight:bold; color:#555; margin-bottom:4px;">TARGET HASHTAG</div>
            <div style="display:flex; gap:5px;">
                <input type="text" id="hashtag-input" placeholder="Enter hashtag..." style="
                    flex: 1; padding: 6px; border: 1px solid #ccc; border-radius: 4px; font-size: 13px; color: #333 !important; background: #fff !important;
                ">
                <button id="btn-go" style="
                    padding: 6px 12px; background: #8e44ad; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight:bold;
                ">GO</button>
            </div>
        </div>

        <div style="background:#fff3cd; padding:8px; border-radius:6px; margin-bottom:10px; border:1px solid #ffeeba;">
            <div style="font-size:11px; font-weight:bold; color:#856404; margin-bottom:4px; display:flex; justify-content:space-between;">
                <span>🛑 AUTO-STOP TIME (Optional)</span>
            </div>
            <input type="time" id="stop-time-input" style="
                width: 100%; padding: 6px; border: 1px solid #999; border-radius: 4px; font-size: 14px; text-align: center;
                color: #000000 !important; background: #ffffff !important; font-weight: bold;
            ">
            <div style="font-size:11px; font-weight:bold; color:#856404; margin-top:8px; display:flex; justify-content:space-between;">
                <span>⏳ SCROLL DELAY (Seconds)</span>
                <span id="delay-display" style="font-weight:normal; color:#856404;">8.2s</span>
            </div>
            <input type="number" id="delay-input" step="0.1" min="1" value="8.2" style="
                width: 100%; padding: 6px; border: 1px solid #999; border-radius: 4px; font-size: 14px; text-align: center;
                color: #000000 !important; background: #ffffff !important; font-weight: bold;
            ">
        </div>

        <div style="margin-bottom:10px; display:flex; gap:8px;">
            <button id="btn-smart-toggle" style="
                flex: 1.5; padding: 12px; background: #27ae60; color: white; border: none; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 14px;
            ">
                🤖 START SMART BOT
            </button>
        </div>

        <div style="margin-bottom:10px; display:flex; gap:8px;">
            <button id="btn-scrape-posts" style="flex: 1; padding: 8px; background: #9b59b6; color: white; border: none; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 12px;">
                ⚡ POSTS
            </button>
            <button id="btn-scrape-comments" style="flex: 1; padding: 8px; background: #3498db; color: white; border: none; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 12px;">
                💬 COMMENTS
            </button>
        </div>

        <div id="v7-log" style="
            height: 120px; overflow-y: auto; background: #2c3e50; border: 1px solid #34495e; padding: 8px; font-size: 11px; color: #ecf0f1; border-radius: 4px; font-family: monospace;
        ">Ready.</div>
    `;

    document.body.appendChild(div);

    // --- RESTORE UI STATE ---
    const inputEl = document.getElementById('hashtag-input');
    const delayEl = document.getElementById('delay-input');
    const stopTimeEl = document.getElementById('stop-time-input');

    if (inputEl) inputEl.value = localStorage.getItem('sticky_hashtag') || '';
    if (delayEl) {
        delayEl.value = localStorage.getItem('sticky_delay') || '8.2';
        document.getElementById('delay-display').innerText = delayEl.value + 's';
    }
    if (stopTimeEl) stopTimeEl.value = localStorage.getItem('sticky_stop_time') || '';

    // Listeners and Bindings
    inputEl.addEventListener('input', (e) => localStorage.setItem('sticky_hashtag', e.target.value.trim()));
    stopTimeEl.addEventListener('input', (e) => localStorage.setItem('sticky_stop_time', e.target.value));
    delayEl.addEventListener('input', (e) => {
        let val = parseFloat(e.target.value);
        if (val < 1) val = 1;
        document.getElementById('delay-display').innerText = val + 's';
        localStorage.setItem('sticky_delay', val);
    });

    document.getElementById('btn-go').addEventListener('click', () => {
        const val = inputEl.value.trim().replace(/^#/, '');
        if (val) window.location.href = `https://www.instagram.com/explore/tags/${val}/`;
    });

    document.getElementById('btn-scrape-posts').addEventListener('click', () => scrapeVisiblePosts(false));
    document.getElementById('btn-scrape-comments').addEventListener('click', () => scrapeVisibleComments(false));
    document.getElementById('btn-smart-toggle').addEventListener('click', toggleSmartBot);
}

setInterval(injectSimpleUI, 1000);

// --- SMART BOT LOGIC ---
async function toggleSmartBot() {
    isSmartRunning = !isSmartRunning;
    const btn = document.getElementById('btn-smart-toggle');
    if (isSmartRunning) {
        btn.innerText = "🛑 STOP SMART BOT";
        btn.style.background = "#c0392b";
        log("🤖 Smart Bot STARTED", "success");
        runSmartLoop();
    } else {
        btn.innerText = "🤖 START SMART BOT";
        btn.style.background = "#27ae60";
        log("🛑 Smart Bot STOPPED", "warn");
    }
}

async function runSmartLoop() {
    if (!isSmartRunning) return;

    // CHECK STOP TIME
    const stopTimeInput = document.getElementById('stop-time-input');
    if (stopTimeInput && stopTimeInput.value) {
        const [h, m] = stopTimeInput.value.split(':');
        const now = new Date();
        const target = new Date();
        target.setHours(h, m, 0, 0);
        if (now >= target) {
            log(`🛑 STOP TIME REACHED! Stopping.`, 'error');
            toggleSmartBot();
            return;
        }
    }

    const limit = randomInt(DEFAULT_CONFIG.BATCH_LIMIT_MIN, DEFAULT_CONFIG.BATCH_LIMIT_MAX);
    if (smartStats.batchCount >= limit) {
        log(`🧊 Batch Limit (${limit}) Reached! Cooling...`, "warn");
        await sleep(randomInt(DEFAULT_CONFIG.COOLING_MIN_MS, DEFAULT_CONFIG.COOLING_MAX_MS));
        smartStats.batchCount = 0;
        log("🔥 Waking up!", "success");
    }
    if (!isSmartRunning) return;

    window.scrollTo(0, document.body.scrollHeight);
    const userDelaySec = parseFloat(localStorage.getItem('sticky_delay')) || DEFAULT_CONFIG.SCROLL_DELAY_SEC;
    await sleep((userDelaySec * 1000) + randomInt(0, DEFAULT_CONFIG.JITTER_MS));

    if (!isSmartRunning) return;
    scrapeVisiblePosts(true); // Scrapes posts and uploads automatically
    smartStats.batchCount++;
    runSmartLoop();
}

// --- POST SCRAPING ---
function scrapeVisiblePosts(isSilent = false) {
    if (!isSilent) log('🔍 Scanning posts...');

    // Try to get hashtag from URL or Input
    let hashtag = 'unknown';
    // 1. Priority: Input Field
    const inputEl = document.getElementById('hashtag-input');
    if (inputEl && inputEl.value.trim()) {
        hashtag = inputEl.value.trim().replace(/^#/, '');
    }
    // 2. Fallback: URL
    else {
        const match = window.location.href.match(/\/tags\/([^/]+)/);
        if (match) hashtag = match[1];
    }

    const posts = [];
    document.querySelectorAll('a[href*="/p/"], a[href*="/reel/"]').forEach(a => {
        try {
            const href = a.getAttribute('href');
            if (href) {
                const shortcodeMatch = href.match(/\/(p|reel)\/([^/?]+)/);
                if (shortcodeMatch) {
                    posts.push({
                        id: shortcodeMatch[2],
                        shortcode: shortcodeMatch[2],
                        url: href.startsWith('http') ? href : `https://www.instagram.com${href}`,
                        caption: a.querySelector('img')?.alt || '',
                        owner: 'Unknown',
                        likes: '0',
                        commentsCount: '0',
                        timestamp: new Date().toISOString(),
                        searchQuery: hashtag
                    });
                }
            }
        } catch (e) { }
    });

    if (posts.length > 0) uploadData(posts, 'UPLOAD_HASHTAGS', isSilent);
    else if (!isSilent) log('⚠️ No visible posts.');
}

// --- COMMENT SCRAPING (Fixed Logic v10) ---
async function scrapeVisibleComments(isAuto = false) {
    let targetHashtag = '';

    // 1. Parse Hash Params (Primary for Auto)
    let params;
    try {
        const hash = window.location.hash.substring(1);
        params = new URLSearchParams(hash);
    } catch (e) {
        log('⚠️ Hash Parse Error', 'warn');
        params = new URLSearchParams();
    }

    // Fix for "scrape_comments&tag=..." format
    if (!params.get('tag')) {
        const parts = window.location.hash.split('&tag=');
        if (parts.length > 1) targetHashtag = decodeURIComponent(parts[1].split('&')[0]);
    } else {
        targetHashtag = params.get('tag');
    }

    // 2. Fallback: Input Field (Manual Mode)
    const inputEl = document.getElementById('hashtag-input');
    if (!targetHashtag && inputEl && inputEl.value.trim()) {
        targetHashtag = inputEl.value.trim().replace(/^#/, '');
    }

    if (targetHashtag) log(`🏷️ Hashtag Context: #${targetHashtag}`);

    // v10 Deep Scrape Logic
    if (isAuto) {
        log('🔄 Expanding comments (max 5 loops)...');
        for (let i = 0; i < 5; i++) {
            const loadMoreButtons = Array.from(document.querySelectorAll('svg[aria-label="Load more comments"], svg[aria-label="Load more"]'));
            document.querySelectorAll('span, div').forEach(el => {
                if (el.innerText === 'View more comments') loadMoreButtons.push(el);
            });

            if (loadMoreButtons.length > 0) {
                const btn = loadMoreButtons[0].closest('div[role="button"]') || loadMoreButtons[0].parentElement;
                if (btn) {
                    btn.click();
                    log(`Clicking Load More (${i + 1}/5)...`);
                    await sleep(3000);
                }
            } else {
                log('No more "Load More" buttons found.');
                break;
            }
        }
    }

    // Parse Hierarchically
    log('💬 Parsing visible comments...');
    const comments = [];
    const mediaId = window.location.href.match(/\/p\/([^/?]+)/)?.[1] || 'unknown';

    const container = document.querySelector('div[role="dialog"]') || document.querySelector('article') || document;
    if (!container) return log('❌ No container found', 'error');

    const uls = container.querySelectorAll('ul');
    let commentList = null;
    uls.forEach(ul => {
        if (ul.querySelectorAll('li').length > 1) commentList = ul;
    });

    const items = commentList ? commentList.querySelectorAll('li') : container.querySelectorAll('div[role="button"]');

    items.forEach(li => {
        try {
            const userLink = li.querySelector('h3 a') || li.querySelector('span > a');

            if (userLink) {
                const username = userLink.innerText;
                const textContainer = li.querySelector(`span[dir="auto"]`);
                let text = textContainer ? textContainer.innerText : '';

                if (text === username) {
                    const parent = userLink.closest('div');
                    if (parent && parent.nextElementSibling) {
                        text = parent.nextElementSibling.innerText;
                    }
                }

                if (username && text && text.length > 1 && text !== username) {
                    comments.push({
                        id: username + '_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
                        username: username,
                        text: text.trim(),
                        timestamp: new Date().toISOString(),
                        mediaId: `https://www.instagram.com/p/${mediaId}/`,
                        hashtag: targetHashtag || null
                    });
                }
            }
        } catch (e) { }
    });

    if (comments.length > 0) {
        log(`✅ Found ${comments.length} comments!`);
        uploadData(comments, 'UPLOAD_COMMENTS');

        if (isAuto && mediaId) {
            const shortcode = mediaId;
            chrome.runtime.sendMessage({
                action: 'MARK_SCRAPED',
                id: shortcode,
                count: comments.length,
                token: params.get('token')
            });
        }
    } else {
        log('⚠️ No comments found (or Parsing failed).', 'warn');
    }

    if (isAuto) {
        await sleep(5000);
        window.close();
    }
}
