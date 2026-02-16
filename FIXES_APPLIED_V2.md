# Fixes Applied (v2)

## 1. Fixed "Clear Data" Not Working (404 Error)
**Issue:** The dashboard was trying to call `/api/comments/clear` on `localhost:5173`, but the backend runs on port `5001`.
**Fix:** Added a proxy configuration to `client/vite.config.js`.
```javascript
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:5001',
      changeOrigin: true,
      secure: false,
    },
  },
}
```
**Action Required:** Restart your frontend development server (`npm run dev`).

## 2. Fixed Hashtag Comment Scraping
**Issue:** The scraper was picking up sidebar UI elements (like "Also from Meta", "Explore") instead of actual comments because it couldn't find the comment container when the post was opened in a new tab.
**Fix:** Updated `extension/content-simple.js` (v9.0 Fixed) to:
- Prioritize `<article>` tag search if the dialog modal is missing.
- expanded the `UI_BLACKLIST` to include "Also from Meta", "More", etc.
- Added stricter checks for username presence near the comment text.

**Action Required:**
1. Go to `chrome://extensions`.
2. Find **Insta-Extractor**.
3. Click the **Reload** (circular arrow) icon.
4. Refresh the Instagram page.

## 3. Fixed Data Sync (Local vs Cloud)
**Issue:** The extension was uploading scraped data to the **Production** backend (`vercel.app`) even when you were running the dashboard **Locally**, causing the local dashboard to appear empty.
**Fix:** Updated `extension/background.js` to try uploading to `http://localhost:5001` *first*. If that fails, it falls back to the production URL.

**Verification:**
1. Ensure your local server is running (`npm start` in `server` folder).
2. Scrape a post.
3. Check your local dashboard. You should now see the data!
