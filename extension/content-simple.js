// Insta-Extractor v8.1 - "Configurable Bot"
// Includes User-Defined Delays

console.log('🚀 Insta-Extractor v8.1 Configurable Bot Loaded');

// --- UTILS ---
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// --- STATE ---
let isSmartRunning = false;
let smartStats = { batchCount: 0, total: 0 };
let smartTimer = null;

// --- CONFIG DEFAULTS ---
const DEFAULT_CONFIG = {
    SCROLL_DELAY_SEC: 8.2,      // Default 8.2s
    JITTER_MS: 2000,            // +/- 2s random jitter
    BATCH_LIMIT_MIN: 20,
    BATCH_LIMIT_MAX: 30,
    COOLING_MIN_MS: 120000,     // 2 mins
    COOLING_MAX_MS: 300000      // 5 mins
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
            <span>🤖 Scraper v8.1</span>
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

        <div style="background:#fff3cd; padding:8px; border-radius:6px; margin-bottom:10px; border:1px solid #ffeeba;">
            <div style="font-size:11px; font-weight:bold; color:#856404; margin-bottom:4px; display:flex; justify-content:space-between;">
                <span>SCROLL DELAY (Seconds)</span>
                <span id="delay-display" style="font-weight:normal">8.2s</span>
            </div>
            <input type="number" id="delay-input" step="0.1" min="1" value="8.2" style="
                width: 100%; padding: 4px; border: 1px solid #ccc; border-radius: 4px; font-size: 13px; text-align: center;
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
                ⚡ ONCE
            </button>
            <button id="btn-scrape-comments" style="flex: 1; padding: 8px; background: #3498db; color: white; border: none; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 12px;">
                💬 COMMENTS
            </button>
        </div>

        <div id="v7-log" style="
            height: 120px; overflow-y: auto; background: #2c3e50; border: 1px solid #34495e; padding: 8px; font-size: 11px; color: #ecf0f1; border-radius: 4px; font-family: monospace;
        ">Ready. Set delay above.</div>
    `;

    document.body.appendChild(div);

    // --- LOGIC ---
    const inputEl = document.getElementById('hashtag-input');
    const delayEl = document.getElementById('delay-input');

    // Restore Hashtag
    const savedTag = localStorage.getItem('sticky_hashtag');
    if (savedTag) inputEl.value = savedTag;
    else {
        const match = window.location.href.match(/\/tags\/([^/?]+)/);
        if (match) inputEl.value = match[1];
    }

    // Restore Delay
    const savedDelay = localStorage.getItem('sticky_delay');
    if (savedDelay) {
        delayEl.value = savedDelay;
        document.getElementById('delay-display').innerText = savedDelay + 's';
    }

    // Listeners
    inputEl.addEventListener('input', (e) => localStorage.setItem('sticky_hashtag', e.target.value.trim()));

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
    const limit = randomInt(DEFAULT_CONFIG.BATCH_LIMIT_MIN, DEFAULT_CONFIG.BATCH_LIMIT_MAX);

    if (smartStats.batchCount >= limit) {
        log(`🧊 Batch Limit (${limit}) Reached! Cooling...`, "warn");
        // ... (Cooling Logic simplified for brevity, kept mostly silent)
        const coolTime = randomInt(DEFAULT_CONFIG.COOLING_MIN_MS, DEFAULT_CONFIG.COOLING_MAX_MS);

        let remaining = coolTime;
        const cdInterval = setInterval(() => {
            if (!isSmartRunning) clearInterval(cdInterval);
            remaining -= 1000;
            if (remaining % 30000 === 0) log(`💤 Cooling: ${Math.round(remaining / 1000)}s left...`);
        }, 1000);

        await sleep(coolTime);
        clearInterval(cdInterval);

        smartStats.batchCount = 0;
        log("🔥 Waking up!", "success");
    }

    if (!isSmartRunning) return;

    // 2. Scroll
    window.scrollTo(0, document.body.scrollHeight);

    // 3. Wait (User Defined + Jitter)
    const userDelaySec = parseFloat(localStorage.getItem('sticky_delay')) || DEFAULT_CONFIG.SCROLL_DELAY_SEC;
    const delayMs = (userDelaySec * 1000) + randomInt(0, DEFAULT_CONFIG.JITTER_MS);

    log(`⏳ Waiting ${Math.round(delayMs / 100) / 10}s...`);
    await sleep(delayMs);

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

    // ... (Same Scraping Logic as Before) ...
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
    // ... (Simplified Comment Logic) ...
    const comments = [];
    const urlMatch = window.location.href.match(/\/p\/([^/?]+)/);
    const mediaId = urlMatch ? urlMatch[1] : 'unknown';

    document.querySelectorAll('ul li').forEach(li => {
        if (li.innerText.length > 5) comments.push({ id: Math.random(), text: li.innerText, mediaId });
    });
    if (comments.length > 0) uploadData(comments, 'UPLOAD_COMMENTS', false);
    else log('⚠️ No comments found (open a post first!)');
}

// --- UPLOADER ---
function uploadData(data, actionType, silent = false) {
    if (!silent) log(`📤 Uploading ${data.length} items...`);
    try {
        if (!chrome || !chrome.runtime) { log('❌ Extension Context Invalid'); return; }
        chrome.runtime.sendMessage({ action: actionType, data: data }, (response) => {
            if (chrome.runtime.lastError) { return; }
            if (response && (response.success || response.count)) {
                if (!silent) {
                    log(`✅ SUCCESS! Saved ${response.count || data.length}.`, 'success');
                    alert(`✅ Saved ${response.count || data.length} items!`);
                } else {
                    log(`✅ Auto-Saved ${response.count || data.length}.`, 'success');
                }
            }
        });
    } catch (e) { }
}
