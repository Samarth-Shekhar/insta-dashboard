import axios from 'axios';

const api = axios.create({
    baseURL: '/api', // Use relative path to leverage Vercel Rewrites (Bypasses CORS)
});

// Removed interceptor to prevent any weird Authorization headers
// for this public-style dashboard.

export default api;
