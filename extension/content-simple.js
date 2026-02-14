// Insta-Extractor v8.6 - "Nuclear Text" Edition
// Features: Text-Based Scraping (DOM-agnostic), 3rd Tab Support

console.log('🚀 Insta-Extractor v8.6 Loaded');

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

// --- UI INJECTION ---
function injectSimpleUI() {
    if (!hasAutoRun && window.location.hash.includes('#scrape_comments')) {
        hasAutoRun = true;
        console.log('🤖 Auto-Scrape Triggered by URL!');
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
            <span>🤖 Scraper v8.6</span>
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

    // --- RESTORE UI ---
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
    scrapeVisiblePosts(true);
    smartStats.batchCount++;
    runSmartLoop();
}

function scrapeVisiblePosts(isSilent = false) {
    if (!isSilent) log('🔍 Scanning posts...');
    let hashtag = 'unknown';
    const inputEl = document.getElementById('hashtag-input');
    if (inputEl && inputEl.value.trim()) hashtag = inputEl.value.trim().replace(/^#/, '');

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

// --- NUCLEAR COMMENT SCRAPING ---
async function scrapeVisibleComments(isAuto = false) {
    let targetHashtag = '';
    const mediaId = window.location.href.match(/\/p\/([^/?]+)/)?.[1] || 'unknown';

    if (isAuto) {
        log('🤖 AUTO-SCRAPING COMMENTS...', 'success');
        const hash = window.location.hash;
        if (hash.includes('&tag=')) {
            targetHashtag = hash.split('&tag=')[1] || '';
            log(`🏷️ Hashtag Detected: #${targetHashtag}`);
        }
        await sleep(1500);
    } else {
        log('💬 Scanning comments...');
    }

    // SCROLL LOOP
    for (let i = 0; i < 6; i++) {
        log(`📜 Deep Scroll ${i + 1}/6...`);
        let scrolled = false;

        // Find MAIN scroll container
        const dialog = document.querySelector('div[role="dialog"] div[style*="overflow"]');
        if (dialog) {
            dialog.scrollTo(0, dialog.scrollHeight);
            scrolled = true;
        }

        // Try generic classes
        if (!scrolled) {
            document.querySelectorAll('div[class*="x1n2onr6"], div[class*="xyamay9"]').forEach(div => {
                if (div.scrollHeight > div.clientHeight) {
                    div.scrollTop = div.scrollHeight;
                    scrolled = true;
                }
            });
        }

        // Fallback
        if (!scrolled) window.scrollBy(0, 800);

        // Click "Load more"
        const loadMoreBtn = document.querySelector('svg[aria-label="Load more comments"]');
        if (loadMoreBtn) loadMoreBtn.parentElement.click();

        await sleep(1500);
    }

    const comments = [];
    const seen = new Set();

    // NUCLEAR EXTRACTION STRATEGY
    // 1. Get ALL text nodes in the dialog
    const container = document.querySelector('div[role="dialog"]') || document.body;

    // 2. Fallback to extracting from SPANs with dir="auto" (Comments usually have this)
    const candidates = container.querySelectorAll('span[dir="auto"], div[dir="auto"]');

    if (candidates.length > 0) {
        log(`🔎 Found ${candidates.length} text blocks. Parsng...`);
        candidates.forEach(node => {
            const text = node.innerText.trim();
            if (text.length < 2) return;
            if (text.match(/^(Reply|See translation|View more|Like|Time|hours|days|w|h|m|s)$/i)) return; // Filters

            // Try to find a sibling or parent that looks like a username
            // Usually username is a Link or an h2/h3 nearby
            let username = 'User';

            // HEURISTIC: Username is often the previous sibling's text or in a container above
            // This is hard. But let's try a simpler approach.
            // Just capturing the text is better than nothing.

            // If the text is long, it's likely a comment.
            // If we can't find a username, we'll label it "Scraped User".
            // Or look for an <a> tag in the parent tree
            let parent = node.parentElement;
            let foundUser = false;
            while (parent && parent !== container && !foundUser) {
                const link = parent.querySelector('a, h3');
                if (link && link.innerText !== text) {
                    username = link.innerText;
                    foundUser = true;
                }
                parent = parent.parentElement;
                if (!foundUser && parent && parent.innerText && parent.innerText.split('\n')[0] !== text) {
                    // Maybe parent text starts with username?
                    const lines = parent.innerText.split('\n');
                    if (lines.length > 1 && lines[1] === text) {
                        username = lines[0];
                        foundUser = true;
                    }
                }
            }

            if (!seen.has(text.substring(0, 20))) {
                seen.add(text.substring(0, 20));
                comments.push({
                    id: Math.random(),
                    username: username.substring(0, 30), // truncated
                    text: text,
                    mediaId: mediaId,
                    hashtag: targetHashtag
                });
            }
        });
    }

    // BACKUP STRATEGY: UL LI
    if (comments.length === 0) {
        log('⚠️ Generic parser failed. Trying Lists...');
        document.querySelectorAll('ul li').forEach(li => {
            const t = li.innerText;
            if (t.length > 5 && !seen.has(t.substring(0, 10))) {
                comments.push({ id: Math.random(), username: 'ListUser', text: t, mediaId, hashtag: targetHashtag });
            }
        });
    }

    log(`📦 Found ${comments.length} comments.`);
    if (comments.length > 0) {
        uploadData(comments, 'UPLOAD_COMMENTS', false);
        if (isAuto) log('✅ Auto-Action Complete.', 'success');
    }
    else {
        log('⚠️ No comments found. Try manually opening comments first.', 'warn');
    }
}

// --- UPLOADER ---
function uploadData(data, actionType, silent = false) {
    if (!silent) log(`📤 Uploading ${data.length} items...`);
    try {
        if (!chrome || !chrome.runtime) { log('❌ Extension Context Invalid'); return; }
        chrome.runtime.sendMessage({ action: actionType, data: data }, (response) => {
            if (chrome.runtime.lastError) return;
            if (response && (response.success || response.count)) {
                if (!silent) {
                    log(`✅ SUCCESS! Saved ${response.count || data.length}.`, 'success');
                    if (actionType === 'UPLOAD_HASHTAGS') alert(`✅ Saved ${response.count} items!`);
                } else {
                    log(`✅ Auto-Saved ${response.count || data.length}.`, 'success');
                }
            }
        });
    } catch (e) { }
}
