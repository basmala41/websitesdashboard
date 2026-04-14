
export const BASE_URL = 'https://apitest.geniussystemapi.com/api';

// API Endpoints
export const API_ENDPOINTS = {
    AUTH: {
        LOGIN: '/admin/AdminAuth/login',
        GET_USERNAME: '/admin/AdminAuth/getUsername',
    },
    ADMIN_OPTIONS: {
        APP_OPTIONS: '/admin/AdminOptions/appOptions',
    },
};

// Default Headers
export const DEFAULT_HEADERS = {
    'Content-Type': 'application/json',
};

// Helper function to get auth headers
export const getAuthHeaders = (token) => ({
    ...DEFAULT_HEADERS,
    Authorization: `Bearer ${token}`,
});

// Helper function to build full URL
export const buildUrl = (endpoint, params = {}) => {
    const url = new URL(`${BASE_URL}${endpoint}`);
    Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null) {
            url.searchParams.append(key, params[key]);
        }
    });
    return url.toString();
};