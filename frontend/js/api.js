// API Configuration
const API_BASE_URL = 'http://localhost:3000/api';

// API Client
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
        localStorage.removeItem('user');
    },

    // Get stored user
    getUser() {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    },

    // Set stored user
    setUser(user) {
        localStorage.setItem('user', JSON.stringify(user));
    },

    // Make authenticated request
    async request(endpoint, options = {}) {
        const token = this.getToken();

        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` }),
                ...options.headers,
            },
            ...options,
        };

        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Request failed');
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    // Auth endpoints
    async login(email, password) {
        const data = await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });

        if (data.token) {
            this.setToken(data.token);
            this.setUser(data.user);
        }

        return data;
    },

    async register(userData) {
        return await this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData),
        });
    },

    async getProfile() {
        return await this.request('/auth/profile');
    },

    // Leave endpoints
    async getLeaveRequests() {
        return await this.request('/leaves');
    },

    async submitLeaveRequest(requestData) {
        return await this.request('/leaves', {
            method: 'POST',
            body: JSON.stringify(requestData),
        });
    },

    async approveLeaveRequest(requestId, comment) {
        return await this.request(`/leaves/${requestId}/approve`, {
            method: 'PUT',
            body: JSON.stringify({ comment }),
        });
    },

    async rejectLeaveRequest(requestId, comment) {
        return await this.request(`/leaves/${requestId}/reject`, {
            method: 'PUT',
            body: JSON.stringify({ comment }),
        });
    },

    async getLeaveBalance() {
        return await this.request('/leaves/balance');
    },

    async getLeaveTypes() {
        return await this.request('/leaves/types');
    },

    async getCalendarData(month, year) {
        const params = month && year ? `?month=${month}&year=${year}` : '';
        return await this.request(`/leaves/calendar${params}`);
    },

    // Admin endpoints
    async getUsers(filters = {}) {
        const params = new URLSearchParams(filters);
        return await this.request(`/admin/users?${params}`);
    },

    async createUser(userData) {
        return await this.request('/admin/users', {
            method: 'POST',
            body: JSON.stringify(userData),
        });
    },

    async updateUser(userId, userData) {
        return await this.request(`/admin/users/${userId}`, {
            method: 'PUT',
            body: JSON.stringify(userData),
        });
    },

    async deleteUser(userId) {
        return await this.request(`/admin/users/${userId}`, {
            method: 'DELETE',
        });
    },

    async getLeaveTypesAdmin() {
        return await this.request('/admin/leave-types');
    },

    async createLeaveType(typeData) {
        return await this.request('/admin/leave-types', {
            method: 'POST',
            body: JSON.stringify(typeData),
        });
    },

    async updateLeaveType(typeId, typeData) {
        return await this.request(`/admin/leave-types/${typeId}`, {
            method: 'PUT',
            body: JSON.stringify(typeData),
        });
    },

    async deleteLeaveType(typeId) {
        return await this.request(`/admin/leave-types/${typeId}`, {
            method: 'DELETE',
        });
    },

    async getBalances(filters = {}) {
        const params = new URLSearchParams(filters);
        return await this.request(`/admin/balances?${params}`);
    },

    async updateBalance(balanceId, balanceData) {
        return await this.request(`/admin/balances/${balanceId}`, {
            method: 'PUT',
            body: JSON.stringify(balanceData),
        });
    },

    async getAdminStats() {
        return await this.request('/admin/stats');
    },

    // Logout
    logout() {
        this.removeToken();
        window.location.href = 'index.html';
    }
};
