# 🚀 Deployment Guide for Insta-Extractor

So you want to take your scraper live! Here is the complete step-by-step guide to deploying all parts of the application.

---

## 🏗️ Architecture to Deploy

1.  **Backend (Server)**: Needs to run 24/7 on a cloud platform.
2.  **Database (MongoDB)**: Needs a cloud-hosted database.
3.  **Frontend (Dashboard)**: Needs to be hosted as a static site.
4.  **Extension**: Needs to know where your new server is located.

---

## ✅ Step 1: Set up MongoDB Atlas (Cloud Database)

1.  Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and sign up (Free Tier).
2.  Create a **New Cluster** (Shared Tier -> M0 Sandbox is Free).
3.  **Database Access**: Create a database user (e.g., `admin` / `password`).
4.  **Network Access**: Click "Add IP Address" -> **Allow Access from Anywhere (0.0.0.0/0)**.
5.  **Get Connection String**:
    *   Click **Connect** -> **Connect your application**.
    *   Copy the string (e.g., `mongodb+srv://admin:<password>@cluster0.mongodb.net/?retryWrites=true&w=majority`).
    *   Replace `<password>` with your actual password.
    *   **Save this string!** You'll need it for the server.

---

## ✅ Step 2: Deploy Backend (Render.com)

Render is great for Node.js apps.

1.  Push your code to **GitHub** (if you haven't already).
2.  Go to [Render.com](https://render.com/) and sign up.
3.  Click **New +** -> **Web Service**.
4.  Connect your GitHub repository.
5.  **Configuration**:
    *   **Root Directory**: `server` (Important! Your server code is in the `./server` folder).
    *   **Build Command**: `npm install`
    *   **Start Command**: `npm start` (Make sure `package.json` has `"start": "node server.js"`).
6.  **Environment Variables**:
    *   Key: `MONGO_URI` | Value: (Your MongoDB Connection String from Step 1).
    *   Key: `PORT` | Value: `5000` (Optional, Render sets this automatically).
7.  Click **Create Web Service**.
8.  Wait for it to deploy. Render will give you a **URL** (e.g., `https://insta-backend.onrender.com`).
    *   **Copy this URL!**

---

## ✅ Step 3: Deploy Frontend (Vercel)

Vercel is perfect for React/Vite apps.

1.  Go to [Vercel.com](https://vercel.com/) and sign up.
2.  Click **Add New...** -> **Project**.
3.  Import your GitHub repository.
4.  **Framework Preset**: Select **Vite**.
5.  **Root Directory**: Click "Edit" and select `client`.
6.  **Environment Variables**:
    *   Key: `VITE_API_URL`
    *   Value: `https://insta-backend.onrender.com/api` (Use your Render Backend URL + `/api`).
7.  Click **Deploy**.
8.  Vercel will give you a **Frontend URL** (e.g., `https://insta-dashboard.vercel.app`).
    *   This is your live dashboard!

---

## ✅ Step 4: Update the Extension

Now that your server is live, the extension needs to talk to the live server, not `localhost`.

1.  Open `extension/background.js` in your code editor.
2.  Find the lines with `fetch('http://localhost:5001/api/...')`.
3.  **Replace** `http://localhost:5001` with your **Render Backend URL**.
    *   Example: `fetch('https://insta-backend.onrender.com/api/hashtags/import', ...)`
    *   (Do this for both hashtags and comments endpoints).
4.  **Save the file**.
5.  **Reload the Extension** in Chrome (`chrome://extensions` -> Refresh).

---

## 🎉 Verification

1.  Go to Instagram.
2.  Use the Scraper Extension (type a hashtag, click Fetch).
3.  Go to your **Vercel Dashboard URL**.
4.  Click "Refresh Data".
5.  If you see the new data, **Congratulations! You are fully deployed!** 🚀
