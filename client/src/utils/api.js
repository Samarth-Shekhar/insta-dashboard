import axios from 'axios';

const api = axios.create({
    // In development, use relative path '/api' which Vite proxies to localhost:5001
    // In production, use the full backend URL directly
    baseURL: import.meta.env.MODE === 'development'
        ? '/api'
        : 'https://insta-backend-azure.vercel.app/api',
});

// Removed interceptor to prevent any weird Authorization headers
// for this public-style dashboard.

export default api;
