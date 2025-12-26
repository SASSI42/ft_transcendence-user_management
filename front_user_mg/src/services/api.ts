import axios from 'axios';

// 🛠️ FIX: Dynamic URL
// This checks: "Where is this page hosted?" and uses that IP for the backend.
const { protocol, hostname } = window.location;
const BACKEND_URL = `${protocol}//${hostname}:3000`; // Note: Port 3000

export const api = axios.create({
    baseURL: `${BACKEND_URL}/api`, 
    headers: {
        'Content-Type': 'application/json'
    }
});
// Interceptor: Automatically add the 'User ID' to every request
// Add Bearer Token to every request
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('authToken'); // Name from authContext.tsx
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Helper for error handling
export const handleApiError = (error: any) => {
    if (axios.isAxiosError(error) && error.response) {
        return error.response.data.error || 'An unexpected error occurred';
    }
    return error.message || 'Network error';
};