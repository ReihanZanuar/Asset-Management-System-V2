// API Configuration for Docker deployment
const API_BASE_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:5001/api'  // Direct backend for local dev
    : '/api';  // Nginx proxy for Docker deployment

// API Service Layer
const api = {
    // Get auth token from localStorage
    getToken() {
        return localStorage.getItem('token');
    },

    // Set auth token
    setToken(token) {
        localStorage.setItem('token', token);
    },

    // Remove auth token
    removeToken() {
        localStorage.removeItem('token');
    },

    // Get current user from localStorage
    getCurrentUser() {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    },

    // Set current user
    setCurrentUser(user) {
        localStorage.setItem('user', JSON.stringify(user));
    },

    // Remove current user
    removeCurrentUser() {
        localStorage.removeItem('user');
    },

    // Generic fetch wrapper with auth
    async request(endpoint, options = {}) {
        const token = this.getToken();
        
        const config = {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
        };

        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }

        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Request failed');
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    // Auth endpoints
    auth: {
        async login(username, password) {
            const data = await api.request('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ username, password }),
            });
            api.setToken(data.token);
            api.setCurrentUser(data.user);
            return data;
        },

        async register(userData) {
            const data = await api.request('/auth/register', {
                method: 'POST',
                body: JSON.stringify(userData),
            });
            api.setToken(data.token);
            api.setCurrentUser(data.user);
            return data;
        },

        async getProfile() {
            return await api.request('/auth/profile');
        },

        logout() {
            api.removeToken();
            api.removeCurrentUser();
            window.location.href = '/login.html';
        },
    },

    // Inventory endpoints
    inventory: {
        async getAll(params = {}) {
            const query = new URLSearchParams(params).toString();
            return await api.request(`/inventory?${query}`);
        },

        async getById(id) {
            return await api.request(`/inventory/${id}`);
        },

        async create(data) {
            return await api.request('/inventory', {
                method: 'POST',
                body: JSON.stringify(data),
            });
        },

        async update(id, data) {
            return await api.request(`/inventory/${id}`, {
                method: 'PUT',
                body: JSON.stringify(data),
            });
        },

        async delete(id) {
            return await api.request(`/inventory/${id}`, {
                method: 'DELETE',
            });
        },

        async getStats() {
            return await api.request('/inventory/stats');
        },
        
        // Create inventory item with images (FormData)
        async createWithImages(formData) {
            const token = api.getToken();
            const response = await fetch(`${API_BASE_URL}/inventory`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData // Don't set Content-Type - browser will set multipart/form-data
            });
            
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Failed to create item');
            }
            return data;
        },
        
        // Update inventory item with images (FormData)
        async updateWithImages(id, formData) {
            const token = api.getToken();
            const response = await fetch(`${API_BASE_URL}/inventory/${id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });
            
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Failed to update item');
            }
            return data;
        },
    },

    // Loans endpoints
    loans: {
        async getAll(params = {}) {
            const query = new URLSearchParams(params).toString();
            return await api.request(`/loans?${query}`);
        },

        async getActive() {
            return await api.request('/loans/active');
        },

        async getOverdue() {
            return await api.request('/loans/overdue');
        },

        async create(data) {
            return await api.request('/loans', {
                method: 'POST',
                body: JSON.stringify(data),
            });
        },

        async return(id, data) {
            return await api.request(`/loans/${id}/return`, {
                method: 'PUT',
                body: JSON.stringify(data),
            });
        },
    },

    // Consumables endpoints
    consumables: {
        async getAll(params = {}) {
            const query = new URLSearchParams(params).toString();
            return await api.request(`/consumables?${query}`);
        },

        async getLowStock() {
            return await api.request('/consumables/low-stock');
        },

        async create(data) {
            return await api.request('/consumables', {
                method: 'POST',
                body: JSON.stringify(data),
            });
        },

        async update(id, data) {
            return await api.request(`/consumables/${id}`, {
                method: 'PUT',
                body: JSON.stringify(data),
            });
        },

        async delete(id) {
            return await api.request(`/consumables/${id}`, {
                method: 'DELETE',
            });
        },
    },

    // Cannibalization endpoints
    cannibalization: {
        async getAll() {
            return await api.request('/cannibalization');
        },

        async create(data) {
            return await api.request('/cannibalization', {
                method: 'POST',
                body: JSON.stringify(data),
            });
        },

        async delete(id) {
            return await api.request(`/cannibalization/${id}`, {
                method: 'DELETE',
            });
        },
    },

    // Analytics endpoints
    analytics: {
        async getDashboard() {
            return await api.request('/analytics/dashboard');
        },

        async getReports(period = '30') {
            return await api.request(`/analytics/reports?period=${period}`);
        },
    },

    // Stock opname endpoints
    stockAudits: {
        async getAll() {
            return await api.request('/stock-audits');
        },

        async create(data) {
            return await api.request('/stock-audits', {
                method: 'POST',
                body: JSON.stringify(data),
            });
        },

        async getItems(id) {
            return await api.request(`/stock-audits/${id}/items`);
        },

        async scan(id, data) {
            return await api.request(`/stock-audits/${id}/scan`, {
                method: 'POST',
                body: JSON.stringify(data),
            });
        },

        async close(id) {
            return await api.request(`/stock-audits/${id}/close`, {
                method: 'PUT',
            });
        },
    },

    // OCR endpoints
    ocr: {
        async scanImage(formData) {
            const token = api.getToken();
            const response = await fetch(`${API_BASE_URL}/ocr/scan`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData // multipart/form-data
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Failed to scan image');
            }
            return data;
        }
    },

    // Global search endpoint
    search: {
        async global(query, limit = 10) {
            const params = new URLSearchParams({ q: query, limit });
            return await api.request(`/search?${params.toString()}`);
        }
    },
};

// Check authentication on protected pages
function requireAuth() {
    const token = api.getToken();
    if (!token) {
        window.location.href = '/login.html';
        return false;
    }
    return true;
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { api, requireAuth };
}
