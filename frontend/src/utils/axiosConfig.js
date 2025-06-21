import axios from 'axios';

// Create an axios instance
const instance = axios.create({
    baseURL: 'http://localhost:8080', // Adjust to your backend URL
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add a request interceptor
instance.interceptors.request.use(
    config => {
        // Add auth token to requests if available
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    error => {
        return Promise.reject(error);
    }
);

// Add a response interceptor
instance.interceptors.response.use(
    response => {
        return response;
    },
    error => {
        // Handle setup required errors
        if (error.response &&
            error.response.status === 403 &&
            error.response.data &&
            error.response.data.setupRequired) {

            // Redirect to setup page
            window.location.href = '/setup';
            return Promise.reject(error);
        }

        // Handle authentication errors
        if (error.response && error.response.status === 401) {
            // Clear token and redirect to login
            localStorage.removeItem('token');
            window.location.href = '/login';
            return Promise.reject(error);
        }

        return Promise.reject(error);
    }
);

export default instance;