import axios from 'axios';

const api = axios.create({
    // In development, use relative path '/api' which Vite proxies to localhost:5001
    // In production, use the full backend URL directly
    baseURL: import.meta.env.MODE === 'development'
        ? '/api'
        : 'https://insta-backend-azure.vercel.app/api',
});

// Request interceptor to add token
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

export default api;
