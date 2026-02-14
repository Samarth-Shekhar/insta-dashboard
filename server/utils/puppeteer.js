const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

const getShortcode = (url) => {
    const parts = url.split('/');
    const pIndex = parts.indexOf('p');
    if (pIndex !== -1 && parts[pIndex + 1]) return parts[pIndex + 1];
    const rIndex = parts.indexOf('reel');
    if (rIndex !== -1 && parts[rIndex + 1]) return parts[rIndex + 1];

    // Regex fallback
    const match = url.match(/(?:p|reel)\/([A-Za-z0-9_-]+)/);
    return match ? match[1] : null;
};

const fetchCommentsViaPuppeteer = async (url) => {
    const shortcode = getShortcode(url);
    if (!shortcode) throw new Error("Invalid Instagram URL");

    console.log(`[1/2] Attempting to scrape public mirror for ${shortcode}...`);

    const browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        // Target: Imginn (Public Mirror)
        // This avoids Instagram's login wall entirely
        const mirrorUrl = `https://imginn.com/p/${shortcode}/`;
        console.log(`Navigating to ${mirrorUrl}...`);

        await page.goto(mirrorUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

        // Wait for comments container
        try {
            await page.waitForSelector('.post-comment-list', { timeout: 10000 });
        } catch (e) {
            console.log("Mirror comment list not found immediately.");
        }

        const comments = await page.evaluate(() => {
            const data = [];

            // Selector for Imginn comments
            document.querySelectorAll('.post-comment-list .item').forEach(item => {
                const userElem = item.querySelector('.user a');
                const textElem = item.querySelector('.text');
                const timeElem = item.querySelector('.time');

                if (userElem && textElem) {
                    let text = textElem.innerText.trim();
                    // Clean "Reply" text if present
                    text = text.replace(/^Reply/, '').trim();

                    data.push({
                        username: userElem.innerText.trim(),
                        text: text,
                        timestamp: timeElem ? timeElem.innerText.trim() : new Date().toISOString()
                    });
                }
            });
            return data;
        });

        console.log(`Mirror Scrape Results: ${comments.length} comments.`);

        await browser.close();

        if (comments.length === 0) {
            throw new Error("No comments found on mirror.");
        }

        return {
            mediaId: shortcode,
            comments: comments.map((c, i) => ({
                id: `mirror_${Date.now()}_${i}`,
                ...c,
                mediaId: shortcode
            }))
        };

    } catch (error) {
        if (browser) await browser.close();
        console.error(`Mirror scrape failed: ${error.message}`);
        console.log("Fallback: Returning empty list (User can try another post).");

        // Return clear error to UI instead of empty list so user knows
        throw new Error("Could not find comments on public mirrors. The post is likely safe-guarded by Instagram privacy settings.");
    }
};

module.exports = {
    fetchCommentsViaPuppeteer
};
