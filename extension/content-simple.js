// Insta-Extractor v10.0 - "Precision & Segregation"
// Features: Auth Support, robust "Load More", Hierarchical Parsing

console.log('🚀 Insta-Extractor v10.0 Loaded');

// --- UTILS ---
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// --- STATE ---
let hasAutoRun = false;

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
            if (response && response.success) {
                log(`✅ Uploaded ${data.length} items!`, 'success');
            } else {
                log(`❌ Upload Failed: ${response?.error || 'Unknown'}`, 'error');
            }
        }
    });
}

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
            <span>🤖 Scraper v10.0</span>
            <span style="font-size:12px; color:#999; cursor:pointer;" onclick="this.parentElement.parentElement.remove()">❌</span>
        </h3>
        <div id="v7-log" style="height: 120px; overflow-y: auto; background: #2c3e50; border: 1px solid #34495e; padding: 8px; font-size: 11px; color: #ecf0f1; border-radius: 4px; font-family: monospace;">Ready.</div>
        <div style="margin-top:10px; display:flex; gap:8px;">
            <button id="btn-scrape-posts" style="flex: 1; padding: 8px; background: #9b59b6; color: white; border: none; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 12px;">⚡ POSTS</button>
            <button id="btn-scrape-comments" style="flex: 1; padding: 8px; background: #3498db; color: white; border: none; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 12px;">💬 COMMENTS</button>
        </div>
    `;
    document.body.appendChild(div);

    document.getElementById('btn-scrape-posts').addEventListener('click', () => scrapeVisiblePosts(false));
    document.getElementById('btn-scrape-comments').addEventListener('click', () => scrapeVisibleComments(false));
}

setInterval(injectSimpleUI, 1000);

// --- POST SCRAPING ---
function scrapeVisiblePosts(isSilent = false) {
    if (!isSilent) log('🔍 Scanning posts...');

    // Try to get hashtag from URL or Input
    let hashtag = 'unknown';
    const match = window.location.href.match(/\/tags\/([^/]+)/);
    if (match) hashtag = match[1];

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

// --- COMMENT SCRAPING (Fixed Logic) ---
async function scrapeVisibleComments(isAuto = false) {
    let targetHashtag = '';

    // Parse Hash Params
    let params;
    try {
        const hash = window.location.hash.substring(1);
        params = new URLSearchParams(hash);
    } catch (e) {
        log('⚠️ Hash Parse Error', 'warn');
        params = new URLSearchParams();
    }

    // Fix for "scrape_comments&tag=..." format which isn't standard querystring
    // Fallback manual parsing if get() fails
    if (!params.get('tag')) {
        const parts = window.location.hash.split('&tag=');
        if (parts.length > 1) targetHashtag = decodeURIComponent(parts[1].split('&')[0]);
    } else {
        targetHashtag = params.get('tag');
    }

    if (targetHashtag) log(`🏷️ Hashtag Context: #${targetHashtag}`);

    // 1. Expand Comments (Load More)
    if (isAuto) {
        log('🔄 Expanding comments (max 5 loops)...');
        for (let i = 0; i < 5; i++) {
            // Look for "+" circle SVG or "View more comments" text
            const loadMoreButtons = Array.from(document.querySelectorAll('svg[aria-label="Load more comments"], svg[aria-label="Load more"]'));

            // Also look for button text
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

    // 2. Parse Hierarchically
    log('💬 Parsing visible comments...');
    const comments = [];
    const mediaId = window.location.href.match(/\/p\/([^/?]+)/)?.[1] || 'unknown';

    // Find all List Items that look like comments
    // Strategy: Find ULs inside the Dialog (if modal) or Article
    const container = document.querySelector('div[role="dialog"]') || document.querySelector('article') || document;
    if (!container) return log('❌ No container found', 'error');

    // Instagram comments are typically in UL > LI structure or DIV structure
    // We try to find the UL that has multiple LIs
    const uls = container.querySelectorAll('ul');
    let commentList = null;
    uls.forEach(ul => {
        if (ul.querySelectorAll('li').length > 1) commentList = ul;
    });

    const items = commentList ? commentList.querySelectorAll('li') : container.querySelectorAll('div[role="button"]'); // Fallback

    items.forEach(li => {
        try {
            // Must contain a username (anchor) and text
            // Look for the user link. It's usually a bold anchor.
            const userLink = li.querySelector('h3 a') || li.querySelector('span > a');

            if (userLink) {
                const username = userLink.innerText;

                // Text extraction: Get all text in the line, remove username
                // This is tricky. Let's look for the span that contains the text.
                // It's often: div > span > (user) space (text)
                const textContainer = li.querySelector(`span[dir="auto"]`);
                let text = textContainer ? textContainer.innerText : '';

                // If text is same as username, it's wrong parsing
                if (text === username) {
                    // Try getting next sibling of the user link container?
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

        // Mark as scraped if we have ID
        // Note: we need to send the SHORTCODE (mediaId) not the full URL
        if (isAuto && mediaId) {
            const shortcode = mediaId;
            chrome.runtime.sendMessage({
                action: 'MARK_SCRAPED',
                id: shortcode, // This matches HashtagPost.id
                count: comments.length,
                token: params.get('token')
            });
        }
    } else {
        log('⚠️ No comments found (or Parsing failed).', 'warn');
    }

    // Close tab if auto
    if (isAuto) {
        await sleep(5000);
        window.close();
    }
}
