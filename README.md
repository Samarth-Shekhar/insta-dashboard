# Instagram Comment Extraction Dashboard

A full-stack application to fetch and manage comments from Instagram posts using the official Graph API.

## Features
- **Dashboard UI**: Clean interface to input post URLs and view comments.
- **Official API**: Uses Instagram Graph API (no scraping).
- **Persistent Storage**: MongoDB database to store fetched comments.
- **Export**: Download comments as CSV.
- **Search & Filter**: Search by username/text and filter by post.

## Prerequisites
- Node.js & npm
- MongoDB (running locally or cloud URI)
- Meta Developer Account with an App set up
- Instagram Business/Creator Account linked to a Facebook Page
- Access Token with `instagram_basic`, `instagram_manage_comments`, `pages_show_list` permissions.

## Setup

### 1. Clone & Install
```bash
# Backend
cd server
npm install

# Frontend
cd client
npm install
```

### 2. Configure Environment
Create `server/.env`:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/insta-comments
META_ACCESS_TOKEN=your_long_lived_access_token
INSTAGRAM_BUSINESS_ACCOUNT_ID=your_instagram_business_account_id
JWT_SECRET=your_jwt_secret
```

### 3. Run Application

**Start Backend:**
```bash
cd server
npm start
```

**Start Frontend:**
```bash
cd client
npm run dev
```

### 4. Usage
1. Open the dashboard at `http://localhost:5173`.
2. Register/Login (default endpoint `/api/auth/register` exists for setup).
3. Paste an Instagram Post URL (e.g., `https://www.instagram.com/p/Cx123...`).
4. Click "Fetch Comments". The app will use the Graph API to find the media ID and retrieve comments.
5. View, Search, and Export the data.

## Notes
- The app searches the most recent 50 posts of the business account to match the URL. If the post is older, it might not be found automatically.
- Ensure your Access Token is valid and has the correct permissions.
