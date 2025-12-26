import axios from 'axios';

// Use the environment variable from vite.config.ts or default to localhost
// 🛠️ FIX: Dynamic URL Calculation
// If I am at "10.11.9.4:3000", I want backend at "10.11.9.4:3001"
// If I am at "localhost:3000", I want backend at "localhost:3001"
export const api = axios.create({
    baseURL: 'http://localhost:3000/api', // Match your Fastify port
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