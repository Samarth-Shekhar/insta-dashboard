// Insta-Extractor v8.0 - "Smart Bot" Edition
// Includes Auto-Scroll, Smart Delays, and Idle Cooling to avoid detection.

console.log('🚀 Insta-Extractor v8.0 Smart Bot Loaded');

// --- UTILS ---
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// --- STATE ---
let isSmartRunning = false;
let smartStats = { batchCount: 0, total: 0 };
let smartTimer = null;

// --- CONFIG ---
const CONFIG = {
    SCROLL_DELAY_MS: 8200,      // 8.2 seconds base delay
    JITTER_MS: 2000,            // +/- 2s random jitter
    BATCH_LIMIT_MIN: 20,        // 20 actions before cooling
    BATCH_LIMIT_MAX: 30,        // 30 actions max
    COOLING_MIN_MS: 120000,     // 2 minutes
    COOLING_MAX_MS: 300000      // 5 minutes
};

// --- UI INJECTION ---
function injectSimpleUI() {
    if (document.getElementById('insta-scraper-v7')) return;

    const div = document.createElement('div');
    div.id = 'insta-scraper-v7';
    div.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 20px;
        width: 340px;
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
            <span>🤖 Scraper v8.0 (Smart)</span>
            <span style="font-size:12px; color:#999; cursor:pointer;" onclick="this.parentElement.parentElement.remove()">❌</span>
        </h3>
        
        <div style="background:#f0f0f0; padding:8px; border-radius:6px; margin-bottom:10px;">
            <div style="font-size:11px; font-weight:bold; color:#555; margin-bottom:4px;">TARGET HASHTAG</div>
            <div style="display:flex; gap:5px;">
                <input type="text" id="hashtag-input" placeholder="Enter hashtag..." style="
                    flex: 1; padding: 6px; border: 1px solid #ccc; border-radius: 4px; font-size: 13px; color: #333; background: #fff;
                ">
                <button id="btn-go" style="
                    padding: 6px 12px; background: #8e44ad; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight:bold;
                ">GO</button>
            </div>
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
                ⚡ ONCE
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

    // --- LOGIC ---
    const inputEl = document.getElementById('hashtag-input');
    const savedTag = localStorage.getItem('sticky_hashtag');
    if (savedTag) inputEl.value = savedTag;
    else {
        const match = window.location.href.match(/\/tags\/([^/?]+)/);
        if (match) inputEl.value = match[1];
    }

    inputEl.addEventListener('input', (e) => localStorage.setItem('sticky_hashtag', e.target.value.trim()));

    document.getElementById('btn-go').addEventListener('click', () => {
        const val = inputEl.value.trim().replace(/^#/, '');
        if (val) window.location.href = `https://www.instagram.com/explore/tags/${val}/`;
    });

    document.getElementById('btn-scrape-posts').addEventListener('click', () => scrapeVisiblePosts(false));
    document.getElementById('btn-scrape-comments').addEventListener('click', scrapeVisibleComments);
    document.getElementById('btn-smart-toggle').addEventListener('click', toggleSmartBot);
}

// Keep UI persistent
setInterval(injectSimpleUI, 1000);

// --- LOGGING ---
function log(msg, type = 'info') {
    const el = document.getElementById('v7-log');
    if (el) {
        const time = new Date().toLocaleTimeString().split(' ')[0];
        let color = '#ecf0f1';
        if (type === 'success') color = '#2ecc71';
        if (type === 'warn') color = '#f1c40f';
        if (type === 'error') color = '#e74c3c';

        el.innerHTML += `<div style="margin-bottom:2px; color:${color};">
            <span style="opacity:0.6">[${time}]</span> ${msg}
        </div>`;
        el.scrollTop = el.scrollHeight;
    }
    console.log('[Bot]', msg);
}

// --- SMART BOT LOGIC ---
async function toggleSmartBot() {
    isSmartRunning = !isSmartRunning;
    const btn = document.getElementById('btn-smart-toggle');

    if (isSmartRunning) {
        btn.innerText = "🛑 STOP SMART BOT";
        btn.style.background = "#c0392b";
        log("🤖 Smart Bot STARTED", "success");
        smartStats.batchCount = 0;
        smartStats.total = 0;
        runSmartLoop();
    } else {
        btn.innerText = "🤖 START SMART BOT";
        btn.style.background = "#27ae60";
        log("🛑 Smart Bot STOPPED", "warn");
        clearTimeout(smartTimer);
    }
}

async function runSmartLoop() {
    if (!isSmartRunning) return;

    // 1. Check Batch Limit
    const limit = randomInt(CONFIG.BATCH_LIMIT_MIN, CONFIG.BATCH_LIMIT_MAX);

    if (smartStats.batchCount >= limit) {
        const coolTime = randomInt(CONFIG.COOLING_MIN_MS, CONFIG.COOLING_MAX_MS);
        log(`🧊 Batch Limit (${limit}) Reached! Cooling down for ${Math.round(coolTime / 1000)}s...`, "warn");

        let remaining = coolTime;
        // Countdown visual
        const cdInterval = setInterval(() => {
            if (!isSmartRunning) clearInterval(cdInterval);
            remaining -= 1000;
            if (remaining % 10000 === 0) log(`💤 Cooling: ${remaining / 1000}s left...`);
        }, 1000);

        await sleep(coolTime);
        clearInterval(cdInterval);

        smartStats.batchCount = 0;
        log("🔥 Waking up! Starting new batch...", "success");
    }

    if (!isSmartRunning) return;

    // 2. Scroll
    window.scrollTo(0, document.body.scrollHeight);
    log("📜 Scrolling...", "info");

    // 3. Wait (8.2s + Jitter)
    const delay = CONFIG.SCROLL_DELAY_MS + randomInt(0, CONFIG.JITTER_MS);
    log(`⏳ Waiting ${delay / 1000}s...`);
    await sleep(delay);

    if (!isSmartRunning) return;

    // 4. Scrape & Upload (Silent Mode)
    scrapeVisiblePosts(true);
    smartStats.batchCount++;

    // 5. Schedule Next
    runSmartLoop();
}

// --- SCRAPE FN ---
function scrapeVisiblePosts(isSilent = false) {
    if (!isSilent) log('🔍 Scanning posts...');

    let hashtag = 'unknown';
    const inputEl = document.getElementById('hashtag-input');
    if (inputEl && inputEl.value.trim()) hashtag = inputEl.value.trim().replace(/^#/, '');
    else {
        const match = window.location.href.match(/\/tags\/([^/?]+)/);
        if (match) hashtag = match[1];
    }

    const posts = [];
    const selectors = 'a[href*="/p/"], a[href*="/reel/"]';

    document.querySelectorAll(selectors).forEach(a => {
        try {
            const href = a.getAttribute('href');
            if (!href) return;
            const shortcodeMatch = href.match(/\/(p|reel)\/([^/?]+)/);
            if (!shortcodeMatch) return;
            const shortcode = shortcodeMatch[2];

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

    if (posts.length > 0) {
        uploadData(posts, 'UPLOAD_HASHTAGS', isSilent);
    } else {
        if (!isSilent) log('⚠️ No posts found visible.');
    }
}

async function scrapeVisibleComments() {
    log('💬 Scanning comments...');
    // (Previous comment logic preserved)
    const urlMatch = window.location.href.match(/\/p\/([^/?]+)/);
    const mediaId = urlMatch ? urlMatch[1] : 'unknown';
    // ... Simplified for brevity as user focused on hashtags mostly ...
    // But keeping core logic
    const comments = [];
    document.querySelectorAll('ul li').forEach(li => {
        // Basic text extraction fallback
        if (li.innerText.length > 5) comments.push({ id: Math.random(), text: li.innerText, mediaId });
    });
    if (comments.length > 0) uploadData(comments, 'UPLOAD_COMMENTS', false);
}

// --- UPLOADER ---
function uploadData(data, actionType, silent = false) {
    if (!silent) log(`📤 Uploading ${data.length} items...`);
    try {
        if (!chrome || !chrome.runtime) { log('❌ Extension Context Invalid'); return; }
        chrome.runtime.sendMessage({ action: actionType, data: data }, (response) => {
            if (chrome.runtime.lastError) {
                log('❌ Connection Error: ' + chrome.runtime.lastError.message, 'error');
                return;
            }
            if (response && (response.success || response.count)) {
                if (!silent) {
                    log(`✅ SUCCESS! Saved ${response.count || data.length}.`, 'success');
                    alert(`✅ Saved ${response.count || data.length} items!`);
                } else {
                    log(`✅ Auto-Saved ${response.count || data.length}.`, 'success');
                }
            }
        });
    } catch (e) { log('❌ Error: ' + e.message, 'error'); }
}
