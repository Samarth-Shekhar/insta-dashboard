# 🔧 DEBUGGING GUIDE - Enhanced Logging

## What I Changed:

I've added detailed logging to both the content script and background script to help us see exactly what's happening when you scrape data.

## How to Test:

### Step 1: Reload the Extension
1. Go to `chrome://extensions/`
2. Find "Insta-Extractor"
3. Click the refresh icon 🔄

### Step 2: Open Instagram
1. Go to: `https://www.instagram.com/explore/tags/cat/`
2. Open the browser console (F12)
3. Make sure you're on the "Console" tab

### Step 3: Start Scraping
1. Click the big purple "🔍 START SCRAPING" button
2. Watch the console for detailed logs

### Step 4: Check the Logs

You should see logs like:
```
[Scraper] 🎯 Starting scrape for #cat
[Scraper] 📜 Scroll 1/5
[Scraper] ✅ Collected X posts so far
...
[UPLOAD] Posts to upload: [...]
[UPLOAD] Response received: {...}
[UPLOAD] Upload successful, count: X
```

### Step 5: Check Background Console
1. Go to `chrome://extensions/`
2. Find "Insta-Extractor"
3. Click "service worker" (or "background page")
4. Check the console there for:
```
[Background] Received upload request
[Background] Number of posts: X
[Background] Response status: 200
[Background] Upload Success: {...}
```

### Step 6: Check Backend Logs
Look at the terminal running the backend server. You should see:
```
[Hashtag Import] Received X posts.
[Hashtag Import] Sample Post: {...}
[Hashtag Import] BulkWrite Result: {...}
```

### Step 7: Refresh Dashboard
1. Go to `http://localhost:5173/`
2. Click "Hashtag Posts" tab
3. Click "Refresh Data" button
4. The new posts should appear!

## If It Still Doesn't Work:

Please share the console logs from:
1. Instagram page console (F12)
2. Extension background console (chrome://extensions/ → service worker)
3. Backend terminal

This will help me identify exactly where the issue is!

## Quick Database Check:

Run this in the server folder to see all posts:
```bash
cd server
node test-db.js
```
