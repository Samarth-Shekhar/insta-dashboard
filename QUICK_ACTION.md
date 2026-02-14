# 🚨 QUICK FIX - Dashboard Not Showing Data

## ✅ I Just Added Test Data

I added 15 test posts to your database. 

## 🎯 DO THIS NOW:

### Step 1: Refresh Dashboard
1. Go to your dashboard tab
2. Press **Ctrl + Shift + R** (hard refresh)
3. Click **"Refresh Data"** button
4. You should see 15 posts!

---

## 🔍 If You Still Don't See Data:

### Check 1: Is the backend running?
Look at your terminal - you should see:
```
Server running on port 5001
MongoDB connected
```

### Check 2: Hard refresh the dashboard
- Press **Ctrl + Shift + R** in the dashboard tab
- Click "Refresh Data" button

### Check 3: Check browser console
- Press F12 on the dashboard
- Look for "Dashboard: Received: Array(15)"
- If you see Array(0), the backend isn't responding

---

## 🚀 To Test Real Scraping:

### Step 1: Reload Extension
1. Go to `chrome://extensions/`
2. Find "Insta-Extractor"  
3. Click the refresh icon 🔄

### Step 2: Go to Instagram
1. Open: `https://www.instagram.com/explore/tags/bike/`
2. Wait for page to load completely
3. Scroll down a bit manually first

### Step 3: Open Extension Console
1. Go to `chrome://extensions/`
2. Find "Insta-Extractor"
3. Click "service worker" (opens background console)
4. Keep this open

### Step 4: Start Scraping
1. On the Instagram page, click **"START SCRAPING"**
2. Watch the status log in the extension panel
3. Watch the background console for upload messages
4. Wait for success alert

### Step 5: Check Backend
Look at your server terminal for:
```
[Hashtag Import] Received X posts.
[Hashtag Import] BulkWrite Result: ...
```

---

## 🔧 Common Issues:

### Issue: "Permissions policy violation"
This is just a warning, ignore it. It won't affect scraping.

### Issue: No posts collected
- Scroll manually on Instagram first
- Wait for images to load
- Try a popular hashtag like #cat or #dog

### Issue: Upload fails
- Check if backend is running (port 5001)
- Check background console for errors
- Try reloading the extension

---

## ✅ Quick Test:

Run this in the server folder to see current data:
```bash
cd server
node test-db.js
```

Should show 15 posts now.

---

## 📞 Next Steps:

1. **Refresh dashboard NOW** - You should see 15 test posts
2. **Try scraping** - Follow the steps above
3. **Report back** - Tell me what you see in the console

The test data is there now, so the dashboard should work!
