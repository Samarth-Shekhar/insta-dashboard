# 🚀 Vercel Deployment Guide

Deploying BOTH Backend and Frontend to Vercel.

## 📌 Prerequisites
1.  **MongoDB Atlas**: You still need the Cloud Database URL from the previous guide (`DEPLOY.md`).
2.  **GitHub**: Push this project to GitHub.

---

## 1️⃣ Deploy Backend (Server) to Vercel

1.  Go to [Vercel](https://vercel.com) -> **Add New Project**.
2.  Import your GitHub Repo.
3.  **Configure Project**:
    *   **Project Name**: `insta-backend` (or similar).
    *   **Root Directory**: Click Edit -> Select `server`.
    *   **Framework Preset**: Select **Other**.
4.  **Environment Variables**:
    *   `MONGO_URI`: Your MongoDB connection string.
5.  Click **Deploy**.
6.  **Copy the Domain**: You will get a URL like `https://insta-backend.vercel.app`.
    *   **Important**: Your API endpoint is now `https://insta-backend.vercel.app/api`. (Wait, confirm via testing. With `vercel.json` rewrite, `server.js` handles everything. So `https://.../api/hashtags` will work).

---

## 2️⃣ Deploy Frontend (Client) to Vercel

1.  Go to [Vercel](https://vercel.com) -> **Add New Project**.
2.  Import the **SAME** GitHub Repo again.
3.  **Configure Project**:
    *   **Project Name**: `insta-dashboard`.
    *   **Root Directory**: Click Edit -> Select `client`.
    *   **Framework Preset**: **Vite**.
4.  **Environment Variables**:
    *   `VITE_API_URL`: `https://insta-backend.vercel.app` (The URL from Step 1).
        *   *Note: Do not add `/api` at the end if your server.js routes already include `/api` prefixes, but ensure consistency.*
        *   My code uses `app.use('/api/hashtags', ...)` so the URL should be the base domain.
5.  Click **Deploy**.
6.  You get a URL like `https://insta-dashboard.vercel.app`. This is your live dashboard!

---

## 3️⃣ Update Extension

The crucial final step.

1.  Open `extension/background.js`.
2.  Replace `http://localhost:5001` with your **Backend Vercel URL**.
    *   E.g. `https://insta-backend.vercel.app`
3.  Reload Extension.

Done! 🚀
