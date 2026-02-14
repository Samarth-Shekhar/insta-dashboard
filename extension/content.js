// Enhanced Instagram Scraper v5.0 - API Interception Method
// Uses Instagram's internal API instead of DOM scraping

// 1. EXTENDED UI
function injectButton() {
    const existing = document.getElementById('insta-monitor-ui');
    if (existing) return;

    const div = document.createElement('div');
    div.id = 'insta-monitor-ui';
    div.style.cssText = 'position:fixed;bottom:20px;left:20px;width:340px;background:white;border:1px solid #ccc;border-radius:12px;padding:15px;z-index:2147483647;box-shadow:0 4px 12px rgba(0,0,0,0.15);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;';

    div.innerHTML = `
        <h3 style="margin:0 0 10px;font-size:16px;color:#262626;">🚀 Insta Scraper v5.0</h3>
        <div style="font-size:10px;color:#8e8e8e;margin-bottom:10px;">API Interception Mode</div>
        
        <div style="margin-bottom:10px;padding-bottom:10px;border-bottom:1px solid #eee;">
            <label style="display:block;font-size:12px;font-weight:bold;margin-bottom:4px;color:#262626;">📝 Current Post Comments</label>
            <button id="btn-scrape-comments" style="width:100%;padding:10px;background:#0095f6;color:white;border:none;border-radius:8px;cursor:pointer;font-weight:bold;margin-bottom:5px;">
                💬 Scrape ALL Comments
            </button>
            <div style="font-size:9px;color:#999;">Works on individual post pages</div>
        </div>
        
        <div style="margin-bottom:10px;">
            <label style="display:block;font-size:12px;font-weight:bold;margin-bottom:4px;color:#262626;">🔍 Hashtag Search</label>
            <input id="hashtag-input" type="text" placeholder="#keyword or keyword" style="width:100%;padding:8px;margin-bottom:8px;border:1px solid #dbdbdb;border-radius:6px;box-sizing:border-box;color:#262626 !important;background:#fff !important;">
            
            <label style="display:block;font-size:11px;margin-bottom:4px;color:#262626;">Filter by keyword in caption (optional):</label>
            <input id="keyword-filter" type="text" placeholder="e.g., dropshipping, store" style="width:100%;padding:6px;margin-bottom:8px;border:1px solid #dbdbdb;border-radius:6px;box-sizing:border-box;font-size:11px;color:#262626 !important;background:#fff !important;">
            
            <button id="btn-crawl-tag" style="width:100%;padding:10px;background:#8e44ad;color:white;border:none;border-radius:8px;cursor:pointer;font-weight:bold;">
                🔍 Start API Scraping
            </button>
        </div>

        <div style="border-top:1px solid #eee;padding-top:10px;margin-top:10px;">
            <div style="display:flex;gap:5px;">
                <button id="btn-suggest-hashtags" style="flex:1;padding:8px;background:#27ae60;color:white;border:none;border-radius:6px;cursor:pointer;font-size:11px;">
                    💡 Suggest
                </button>
                <button id="btn-stop-scrape" style="flex:1;padding:8px;background:#e74c3c;color:white;border:none;border-radius:6px;cursor:pointer;font-size:11px;">
                    ⏹️ Stop
                </button>
            </div>
        </div>
        
        <div id="status-log" style="margin-top:10px;font-size:10px;color:#666;max-height:120px;overflow-y:auto;border:1px solid #eee;padding:8px;background:#f9f9f9;border-radius:4px;">
            Ready. API interceptor active.
        </div>
    `;

    document.body.appendChild(div);

    // Event listeners
    document.getElementById('btn-scrape-comments')?.addEventListener('click', scrapeComments);
    document.getElementById('btn-crawl-tag')?.addEventListener('click', startAPIScraping);
    document.getElementById('btn-suggest-hashtags')?.addEventListener('click', suggestHashtags);
    document.getElementById('btn-stop-scrape')?.addEventListener('click', stopScraping);

    console.log('✅ UI Injected');
}

// Initialize UI
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectButton);
} else {
    injectButton();
}
setInterval(injectButton, 2000);

console.log('🚀 Insta-Extractor v5.0 - API Interception Mode');

// Global state
let scrapingActive = false;
let collectedPosts = [];
let currentHashtag = '';
let keywordFilter = '';

// Listen for API data from interceptor
window.addEventListener('message', (event) => {
    if (event.data.type === 'INSTAGRAM_API_DATA' && scrapingActive) {
        const posts = event.data.posts || [];
        log(`📡 Received ${posts.length} posts from API`);

        // Apply keyword filter if set
        let filteredPosts = posts;
        if (keywordFilter) {
            filteredPosts = posts.filter(post => {
                const caption = (post.caption || '').toLowerCase();
                return caption.includes(keywordFilter.toLowerCase());
            });
            log(`🔍 Filtered to ${filteredPosts.length} posts matching "${keywordFilter}"`);
        }

        // Add searchQuery field
        filteredPosts = filteredPosts.map(post => ({
            ...post,
            searchQuery: currentHashtag
        }));

        collectedPosts.push(...filteredPosts);
        log(`✅ Total collected: ${collectedPosts.length} posts`);
    }
});

// Start API-based scraping
async function startAPIScraping() {
    const input = document.getElementById('hashtag-input')?.value.trim();
    const filter = document.getElementById('keyword-filter')?.value.trim();

    if (!input) {
        alert('Please enter a hashtag or keyword');
        return;
    }

    // Clean hashtag
    currentHashtag = input.replace(/^#/, '');
    keywordFilter = filter;

    log(`🎯 Starting API scraping for #${currentHashtag}`);
    if (keywordFilter) {
        log(`🔍 Filtering by keyword: "${keywordFilter}"`);
    }

    // Check if we're on the hashtag page
    const currentUrl = window.location.href;
    const targetUrl = `https://www.instagram.com/explore/tags/${currentHashtag}/`;

    if (!currentUrl.includes(`/tags/${currentHashtag}`)) {
        log(`📍 Navigating to ${targetUrl}`);
        window.location.href = targetUrl;
        return;
    }

    // Start interceptor
    if (window.instagramInterceptor) {
        window.instagramInterceptor.start();
        window.instagramInterceptor.clearData();
    }

    scrapingActive = true;
    collectedPosts = [];

    // Show visual indicator
    showScrapingOverlay();

    // Scroll to trigger API calls
    await performIntelligentScrolling();

    // Wait for final data
    await new Promise(r => setTimeout(r, 3000));

    // Stop and upload
    stopScraping();
}

// Intelligent scrolling with delays
async function performIntelligentScrolling() {
    log('📜 Starting intelligent scrolling...');

    const scrollSteps = 8;
    const baseDelay = 2000;

    for (let i = 0; i < scrollSteps && scrapingActive; i++) {
        // Random delay to avoid detection
        const delay = baseDelay + Math.random() * 1000;

        // Scroll with easing
        const targetScroll = document.body.scrollHeight;
        window.scrollTo({
            top: targetScroll,
            behavior: 'smooth'
        });

        log(`📜 Scroll ${i + 1}/${scrollSteps} (waiting ${Math.round(delay / 1000)}s)`);
        await new Promise(r => setTimeout(r, delay));

        // Check if we have enough posts
        if (collectedPosts.length >= 50) {
            log('✅ Collected 50+ posts, stopping early');
            break;
        }
    }
}

// Stop scraping and upload
function stopScraping() {
    if (!scrapingActive) return;

    scrapingActive = false;

    if (window.instagramInterceptor) {
        window.instagramInterceptor.stop();
    }

    log(`🛑 Scraping stopped. Collected ${collectedPosts.length} posts`);

    if (collectedPosts.length > 0) {
        uploadPosts(collectedPosts);
    } else {
        alert('No posts collected. Try scrolling manually or check console for errors.');
        hideScrapingOverlay();
    }
}

// Upload posts to backend
async function uploadPosts(posts) {
    log('📤 Uploading to dashboard...');

    try {
        chrome.runtime.sendMessage({
            action: 'UPLOAD_HASHTAGS',
            data: posts
        }, (response) => {
            if (chrome.runtime.lastError) {
                log('❌ Error: ' + chrome.runtime.lastError.message);
                alert('Upload failed: ' + chrome.runtime.lastError.message);
                hideScrapingOverlay();
                return;
            }

            if (response && response.success) {
                const msg = `✅ Success! Uploaded ${response.count || posts.length} posts`;
                log(msg);
                alert(msg + '\n\nRefresh your dashboard to see the data.');
                showSuccessOverlay();
                setTimeout(hideScrapingOverlay, 3000);
            } else {
                log('❌ Upload failed: ' + (response?.error || 'Unknown'));
                alert('Upload failed. Check console.');
                hideScrapingOverlay();
            }
        });
    } catch (e) {
        log('❌ Error: ' + e.message);
        alert('Error: ' + e.message);
        hideScrapingOverlay();
    }
}

// Suggest related hashtags
async function suggestHashtags() {
    const input = document.getElementById('hashtag-input')?.value.trim().replace(/^#/, '');

    if (!input) {
        alert('Enter a keyword first');
        return;
    }

    log(`💡 Generating hashtag suggestions for "${input}"...`);

    // Generate variations
    const suggestions = [
        `#${input}`,
        `#${input}s`,
        `#${input}ing`,
        `#${input}tips`,
        `#${input}coach`,
        `#${input}mentor`,
        `#${input}business`,
        `#${input}life`,
        `#online${input}`,
        `#best${input}`
    ];

    const uniqueSuggestions = [...new Set(suggestions)];

    log('💡 Suggestions:');
    uniqueSuggestions.forEach(tag => log(`  ${tag}`));

    alert('Hashtag Suggestions:\n\n' + uniqueSuggestions.join('\n'));
}

// Visual overlays
function showScrapingOverlay() {
    let overlay = document.getElementById('scraping-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'scraping-overlay';
        document.body.appendChild(overlay);
    }
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:60px;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);z-index:999999;color:white;text-align:center;font-size:20px;line-height:60px;font-weight:bold;box-shadow:0 4px 12px rgba(0,0,0,0.3);';
    overlay.innerHTML = '🔄 API SCRAPING IN PROGRESS... <span style="font-size:14px;opacity:0.8;">(collecting data)</span>';
}

function showSuccessOverlay() {
    const overlay = document.getElementById('scraping-overlay');
    if (overlay) {
        overlay.style.background = 'linear-gradient(135deg,#11998e 0%,#38ef7d 100%)';
        overlay.innerHTML = '✅ UPLOAD SUCCESSFUL! <span style="font-size:14px;opacity:0.8;">(check dashboard)</span>';
    }
}

function hideScrapingOverlay() {
    const overlay = document.getElementById('scraping-overlay');
    if (overlay) {
        overlay.remove();
    }
}

// Logging
function log(msg) {
    const el = document.getElementById('status-log');
    if (el) {
        const time = new Date().toLocaleTimeString();
        el.innerHTML += `<div style="margin-bottom:2px;"><span style="color:#999;">[${time}]</span> ${msg}</div>`;
        el.scrollTop = el.scrollHeight;
    }
    console.log('[InstaScraper]', msg);
}

// Comment Scraping Function
async function scrapeComments() {
    log('💬 Starting comment scraping...');

    // Find scroll container
    let scrollTarget = null;
    let maxScroll = 0;

    document.querySelectorAll('*').forEach(el => {
        if (el.scrollHeight > el.clientHeight * 1.5 && el.scrollHeight > maxScroll) {
            const style = window.getComputedStyle(el);
            if (style.overflowY === 'scroll' || style.overflowY === 'auto') {
                maxScroll = el.scrollHeight;
                scrollTarget = el;
            }
        }
    });

    if (!scrollTarget) {
        scrollTarget = window;
    }

    log(scrollTarget === window ? 'Scrolling window' : 'Scrolling modal');

    // Scroll to load all comments
    let lastHeight = 0;
    let sameHeightCount = 0;
    const maxRetries = 10;

    for (let i = 0; i < maxRetries; i++) {
        if (scrollTarget === window) {
            window.scrollTo(0, document.body.scrollHeight);
        } else {
            scrollTarget.scrollTop = scrollTarget.scrollHeight;
        }

        await new Promise(r => setTimeout(r, 2000));

        let newHeight = scrollTarget === window ? document.body.scrollHeight : scrollTarget.scrollHeight;
        if (newHeight === lastHeight) {
            sameHeightCount++;
            if (sameHeightCount >= 3) break;
        } else {
            sameHeightCount = 0;
        }
        lastHeight = newHeight;
        log(`Scrolling... (${i + 1}/${maxRetries})`);
    }

    // Extract comments
    const comments = [];
    const seen = new Set();
    const anchors = Array.from(document.querySelectorAll('a'));

    anchors.forEach(a => {
        const href = a.getAttribute('href');
        const username = a.innerText.trim();

        if (href && href.startsWith('/') && !href.includes('/p/') && !href.includes('/explore/') && username.length > 1 && !username.includes(' ')) {
            if (['Log in', 'Sign up', 'Follow', 'View replies', 'See translation'].includes(username)) return;

            let container = a.parentElement;
            for (let i = 0; i < 6; i++) {
                if (!container) break;
                const text = container.innerText;
                if (text.includes(username)) {
                    const lines = text.split('\n');
                    const idx = lines.findIndex(l => l.includes(username));
                    if (idx !== -1 && lines[idx + 1]) {
                        let comment = lines[idx + 1];
                        if (!comment.match(/^[0-9]+[dhwms]$/) && comment !== 'Reply') {
                            const key = username + comment;
                            if (!seen.has(key)) {
                                seen.add(key);
                                comments.push({
                                    username,
                                    text: comment,
                                    timestamp: new Date().toISOString(),
                                    id: `ext_${Date.now()}_${comments.length}`,
                                    mediaId: window.location.href
                                });
                            }
                        }
                    }
                }
                container = container.parentElement;
            }
        }
    });

    log(`Found ${comments.length} comments`);

    if (comments.length > 0) {
        // Upload to backend
        try {
            const res = await fetch('http://localhost:5001/api/comments/import', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ comments })
            });
            const json = await res.json();
            log(`✅ Uploaded ${json.count} comments`);
            alert(`Success! Uploaded ${json.count} comments.\n\nCheck the Comments Data tab in your dashboard.`);
        } catch (e) {
            log('❌ Upload error: ' + e.message);
            alert('Upload failed: ' + e.message);
        }
    } else {
        alert('No comments found. Make sure you\'re on a post page with comments.');
    }
}

// Auto-start on hashtag pages (optional)
setTimeout(() => {
    if (window.location.href.includes('/explore/tags/') && !window.hasAutoStarted) {
        window.hasAutoStarted = true;
        log('ℹ️ On hashtag page. Click "Start API Scraping" or it will auto-start in 10s');

        setTimeout(() => {
            if (!scrapingActive) {
                log('🤖 Auto-starting...');
                // Auto-fill hashtag from URL
                const match = window.location.href.match(/\/tags\/([^/?]+)/);
                if (match) {
                    const hashtagInput = document.getElementById('hashtag-input');
                    if (hashtagInput) {
                        hashtagInput.value = match[1];
                    }
                }
                startAPIScraping();
            }
        }, 10000);
    }
}, 3000);
