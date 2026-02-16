# Fixes Applied (v3) - Critical Production Fix

## 1. Fixed "Clear Data" on Deployed Site (404 Error)
**Issue:** The deployed dashboard (`vercel.app`) was trying to use a relative API path (`/api`), which doesn't exist on the frontend server. It needs to talk to the Backend server.
**Fix:** Updated `client/src/utils/api.js` to be environment-aware:
- **Localhost:** Uses `/api` (proxied to `localhost:5001` for local DB).
- **Production:** Uses `https://insta-backend-azure.vercel.app/api` (connects to Cloud DB).

**Action Required:**
1.  **Redeploy Frontend:** You need to push these changes to GitHub/Vercel for the deployed site to work.
2.  **Local Test:** Restart `npm run dev` in the client folder to ensure local dev still works.

## 2. Clarification on Hashtag Scraping
**Issue:** "Hashtag scraping of comments is not working" often comes from confusion between "Scraping Posts" and "Scraping Comments".
- **Step 1 (Hashtag Page):** The bucket/bot scrapes **Posts** (links/thumbnails). It saves them to the "Hashtag Posts" tab.
- **Step 2 (Dashboard):** You must go to the **Hashtag Posts** tab, select posts, and click **"Scrape Selected"**.
- **Step 3 (New Tabs):** This opens the actual posts. The extension *then* scrapes the **Comments** from those posts and saves them with the proper Hashtag.

**Verification:**
1.  Open Dashboard (Local or Cloud).
2.  Go to "Hashtag Posts".
3.  If empty, go to Instagram Hashtag Page -> Open Extension -> Click "Start Smart Bot" -> Wait for "Auto-Saved" logs.
4.  Refresh Dashboard "Hashtag Posts". You should see posts.
5.  Select a few -> Click "Scrape Selected".
6.  Allow Popups.
7.  Wait for tabs to open, scrape, and close.
8.  Go to "Scraped Comments" tab -> filtering by Hashtag should now work.

## 3. Data Sync Check
Your extension now attempts to save data to `localhost:5001` *first*.
- If your local server is running, data goes to **Local DB**.
- If local server is OFF, data goes to **Cloud DB**.
**Be careful:** If you scrape locally, the data won't show up on the Vercel Dashboard, and vice-versa (unless you configure them to use the same database).
