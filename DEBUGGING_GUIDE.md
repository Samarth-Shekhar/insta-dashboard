# 🔍 Debugging Guide - Hashtag Data Not Appearing

## ✅ What We Know Works:
1. Backend API is running (port 5001)
2. Frontend is running (port 5173)
3. Database has data (1 test post confirmed)
4. API endpoint returns data correctly
5. Dashboard fetches data (console shows "Received: [{...}]")
6. Extension UI is working
7. API interceptor is loaded

## ❓ The Problem:
When you scrape NEW hashtag data, it doesn't appear in the dashboard.

## 🧪 Step-by-Step Debugging:

### Test 1: Verify Upload is Working

1. **Open Instagram** (any page)
2. **Open Console** (F12)
3. **Copy and paste this code:**

```javascript
// Test upload
const testData = [{
    id: 'DEBUG_' + Date.now(),
    url: 'https://www.instagram.com/p/debug123/',
    shortcode: 'debug123',
    caption: 'Debug test post - ' + new Date().toLocaleString(),
    likes: 999,
    commentsCount: 888,
    timestamp: new Date().toISOString(),
    owner: 'debuguser',
    searchQuery: 'debug_test'
}];

chrome.runtime.sendMessage({ 
    action: 'UPLOAD_HASHTAGS', 
    data: testData 
}, (response) => {
    console.log('Response:', response);
    if (response && response.success) {
        alert('✅ Test upload successful! Count: ' + response.count);
    } else {
        alert('❌ Upload failed: ' + JSON.stringify(response));
    }
});
```

4. **Expected Result:**
   - Alert: "✅ Test upload successful! Count: 1"
   - Go to dashboard → Click "Refresh Data"
   - Should see the debug post

5. **If this works:** Upload mechanism is fine, issue is with scraping
6. **If this fails:** Upload mechanism is broken

---

### Test 2: Check What Data is Being Collected

1. **Go to a hashtag page:** `https://www.instagram.com/explore/tags/fitness/`
2. **Open Console** (F12)
3. **Start scraping** (either wait for auto-start or click button)
4. **Watch console for:**
   ```
   📡 Received X posts from API
   ✅ Total collected: X posts
   📤 Uploading to dashboard...
   ```

5. **Check what data was collected:**
   - After scraping completes, type in console:
   ```javascript
   // This won't work if scraping already finished, but try:
   console.log('Collected posts:', collectedPosts);
   ```

6. **Expected:** Should see array of post objects
7. **If empty:** API interception isn't working

---

### Test 3: Check Background Script Logs

1. **Go to:** `chrome://extensions/`
2. **Find "Insta-Extractor"**
3. **Click "service worker" link** (blue text)
4. **This opens background script console**
5. **Run a scrape**
6. **Watch for:**
   ```
   Background: Uploading hashtags... [Array]
   Upload Success: {success: true, count: X}
   ```

7. **If you see errors here:** Background script issue
8. **If you see success:** Upload is working, check backend

---

### Test 4: Check Backend Logs

1. **Look at your terminal** running `npm start`
2. **After scraping, you should see:**
   ```
   POST /api/hashtags/import
   Received X posts
   Bulk write result: ...
   ```

3. **If you don't see this:** Data isn't reaching backend
4. **If you see errors:** Backend issue

---

### Test 5: Verify Database

Run this in server folder:
```bash
node test-hashtag-data.js
```

**Expected output:**
```
✅ Connected to MongoDB
📊 Total hashtag posts in database: X
📝 Most recent post: {...}
```

**If count doesn't increase after scraping:** Data isn't being saved

---

## 🎯 Most Likely Issues:

### Issue 1: API Interceptor Not Capturing Data
**Symptoms:**
- Console shows "Collected 0 posts"
- No "📡 Received X posts from API" messages

**Solution:**
1. Reload extension
2. Refresh Instagram page
3. Check console for "✅ Instagram API Interceptor Loaded"
4. Try scrolling manually first to trigger API calls

### Issue 2: Upload Failing Silently
**Symptoms:**
- Console shows posts collected
- No success/error alert
- Background script shows no activity

**Solution:**
1. Check if background script is running (chrome://extensions/)
2. Reload extension
3. Try manual test upload (Test 1 above)

### Issue 3: Dashboard Not Refreshing
**Symptoms:**
- Backend shows data saved
- Database has new posts
- Dashboard still shows old data

**Solution:**
1. **Hard refresh dashboard:** Ctrl+Shift+R
2. **Clear browser cache**
3. **Click "Refresh Data" button multiple times**
4. **Check browser console for errors**

### Issue 4: CORS or Network Error
**Symptoms:**
- Console shows network errors
- "Failed to fetch" errors

**Solution:**
1. Make sure backend is running: `npm start`
2. Check `http://localhost:5001/api/hashtags` in browser
3. Verify `manifest.json` has correct host_permissions

---

## 📋 Quick Checklist:

Before scraping, verify:
- [ ] Extension is loaded and enabled
- [ ] Backend server is running (port 5001)
- [ ] Frontend is running (port 5173)
- [ ] MongoDB is connected
- [ ] Console shows "API Interceptor Loaded"
- [ ] You're on a hashtag page

After scraping:
- [ ] Console shows "Collected X posts" (X > 0)
- [ ] Alert shows "Success! Uploaded X posts"
- [ ] Background console shows "Upload Success"
- [ ] Server terminal shows POST request
- [ ] Database count increased (run test-hashtag-data.js)
- [ ] Dashboard refreshed (click "Refresh Data")

---

## 🆘 If Nothing Works:

1. **Complete Reset:**
   ```bash
   # Stop servers
   # In server folder:
   node test-hashtag-data.js  # Note the count
   
   # Delete all hashtag data:
   # In MongoDB or via script
   
   # Restart everything
   npm start  # in server
   npm run dev  # in client
   
   # Reload extension
   # Try Test 1 (manual upload)
   ```

2. **Check for Errors:**
   - Extension console (F12 on Instagram)
   - Background script console (chrome://extensions/)
   - Server terminal
   - Frontend console (F12 on dashboard)

3. **Share Logs:**
   If still not working, share:
   - Extension console output
   - Background script console output
   - Server terminal output
   - Screenshot of dashboard

---

## 💡 Pro Tips:

1. **Always check all 3 consoles:**
   - Extension (F12 on Instagram)
   - Background (chrome://extensions/ → service worker)
   - Dashboard (F12 on localhost:5173)

2. **Use manual test upload first** (Test 1)
   - This isolates whether issue is scraping or uploading

3. **Check database directly:**
   ```bash
   node test-hashtag-data.js
   ```
   - Run before and after scraping
   - Count should increase

4. **Hard refresh dashboard:**
   - Ctrl+Shift+R
   - Or clear cache
   - React might be caching old data
