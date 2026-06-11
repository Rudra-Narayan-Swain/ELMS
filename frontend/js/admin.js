// Admin Panel JavaScript
// Manages all admin operations including users, leave types, and balances

// Check authentication and authorization
function checkAuth() {
    const user = api.getUser();
    if (!user || user.role !== 'manager') {
        alert('Access denied. This page is only accessible to managers.');
        window.location.href = 'dashboard.html';
        return false;
    }
    return true;
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    if (checkAuth()) {
        loadOverview();
        setupSearchHandlers();
        setupColorPicker();
    }
});

// ========================================
// TAB MANAGEMENT
// ========================================

function switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    event.target.classList.add('active');

    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    document.getElementById(`${tabName}-tab`).classList.add('active');

    // Load data for the selected tab
    switch (tabName) {
        case 'overview':
            loadOverview();
            break;
        case 'users':
            loadUsers();
            break;
        case 'leave-types':
            loadLeaveTypes();
            break;
        case 'balances':
            loadBalances();
            loadBalanceFilters();
            break;
    }
}

// ========================================
// OVERVIEW TAB
// ========================================

async function loadOverview() {
    try {
        const response = await api.getAdminStats();

        if (response.success) {
            displayStats(response.stats);
            displayRecentActivity(response.stats.recentActivity);
        }
    } catch (error) {
        console.error('Error loading stats:', error);
        showAlert('Failed to load statistics', 'error');
    }
}

function displayStats(stats) {
    const statsGrid = document.getElementById('statsGrid');

    statsGrid.innerHTML = `
        <div class="stat-card">
            <div class="stat-icon">👥</div>
            <div class="stat-value">${stats.totalUsers}</div>
            <div class="stat-label">Total Users</div>
        </div>
        <div class="stat-card">
            <div class="stat-icon">💼</div>
            <div class="stat-value">${stats.totalEmployees}</div>
            <div class="stat-label">Employees</div>
        </div>
        <div class="stat-card">
            <div class="stat-icon">👔</div>
            <div class="stat-value">${stats.totalManagers}</div>
            <div class="stat-label">Managers</div>
        </div>
        <div class="stat-card">
            <div class="stat-icon">⏳</div>
            <div class="stat-value">${stats.pendingRequests}</div>
            <div class="stat-label">Pending Requests</div>
        </div>
        <div class="stat-card">
            <div class="stat-icon">✅</div>
            <div class="stat-value">${stats.approvedThisMonth}</div>
            <div class="stat-label">Approved This Month</div>
        </div>
        <div class="stat-card">
            <div class="stat-icon">📋</div>
            <div class="stat-value">${stats.totalLeaveTypes}</div>
            <div class="stat-label">Leave Types</div>
        </div>
    `;
}

function displayRecentActivity(activities) {
    const tbody = document.getElementById('recentActivityBody');

    if (!activities || activities.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="empty-state">
                    <div class="empty-state-icon">📭</div>
                    <p>No recent activity</p>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = activities.map(activity => `
        <tr>
            <td>${activity.employee_name}</td>
            <td>${activity.leave_type}</td>
            <td>${activity.total_days}</td>
            <td><span class="badge badge-${activity.status}">${activity.status}</span></td>
            <td>${formatDate(activity.created_at)}</td>
        </tr>
    `).join('');
}

// ========================================
// USERS MANAGEMENT
// ========================================

let usersData = [];
let userSearchTimeout;

function setupSearchHandlers() {
    const searchInput = document.getElementById('userSearch');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            clearTimeout(userSearchTimeout);
            userSearchTimeout = setTimeout(() => {
                filterUsers(e.target.value);
            }, 300);
        });
    }
}

async function loadUsers() {
    try {
        const roleFilter = document.getElementById('roleFilter')?.value || '';
        const statusFilter = document.getElementById('statusFilter')?.value || '';

        const filters = {};
        if (roleFilter) filters.role = roleFilter;
        if (statusFilter) filters.status = statusFilter;

        const response = await api.getUsers(filters);

        if (response.success) {
            usersData = response.users;
            displayUsers(usersData);
        }
    } catch (error) {
        console.error('Error loading users:', error);
        showAlert('Failed to load users', 'error');
    }
}

function filterUsers(searchTerm) {
    if (!searchTerm) {
        displayUsers(usersData);
        return;
    }

    const filtered = usersData.filter(user =>
        user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    displayUsers(filtered);
}

function displayUsers(users) {
    const tbody = document.getElementById('usersTableBody');

    if (!users || users.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="empty-state">
                    <div class="empty-state-icon">👤</div>
                    <p>No users found</p>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = users.map(user => `
        <tr>
            <td>${user.first_name} ${user.last_name}</td>
            <td>${user.email}</td>
            <td>${user.phone || 'N/A'}</td>
            <td><span class="badge badge-${user.role}">${user.role}</span></td>
            <td><span class="badge badge-${user.is_active ? 'active' : 'inactive'}">${user.is_active ? 'Active' : 'Inactive'}</span></td>
            <td>${formatDate(user.created_at)}</td>
            <td>
                <div class="action-btns">
                    <button class="btn btn-icon btn-edit" onclick="editUser(${user.id})" title="Edit">
                        ✏️
                    </button>
                    <button class="btn btn-icon btn-delete" onclick="deleteUser(${user.id})" title="Deactivate">
                        🗑️
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function openUserModal(userId = null) {
    const modal = document.getElementById('userModal');
    const form = document.getElementById('userForm');
    const title = document.getElementById('userModalTitle');

    form.reset();
    document.getElementById('userId').value = '';

    if (userId) {
        title.textContent = 'Edit User';
        const user = usersData.find(u => u.id === userId);
        if (user) {
            document.getElementById('userId').value = user.id;
            document.getElementById('userEmail').value = user.email;
            document.getElementById('userFirstName').value = user.first_name;
            document.getElementById('userLastName').value = user.last_name;
            document.getElementById('userPhone').value = user.phone || '';
            document.getElementById('userRole').value = user.role;
            document.getElementById('userStatus').value = user.is_active ? '1' : '0';
            document.getElementById('userPassword').required = false;
        }
    } else {
        title.textContent = 'Add User';
        document.getElementById('userPassword').required = true;
    }

    modal.classList.add('active');
}

function closeUserModal() {
    document.getElementById('userModal').classList.remove('active');
}

function editUser(userId) {
    openUserModal(userId);
}

async function deleteUser(userId) {
    if (!confirm('Are you sure you want to deactivate this user?')) {
        return;
    }

    try {
        const response = await api.deleteUser(userId);

        if (response.success) {
            showAlert('User deactivated successfully', 'success');
            loadUsers();
        } else {
            showAlert(response.message || 'Failed to deactivate user', 'error');
        }
    } catch (error) {
        console.error('Error deleting user:', error);
        showAlert(error.message || 'Failed to deactivate user', 'error');
    }
}

// User form submission
document.getElementById('userForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const userId = document.getElementById('userId').value;
    const userData = {
        email: document.getElementById('userEmail').value,
        first_name: document.getElementById('userFirstName').value,
        last_name: document.getElementById('userLastName').value,
        phone: document.getElementById('userPhone').value,
        role: document.getElementById('userRole').value,
        is_active: parseInt(document.getElementById('userStatus').value)
    };

    const password = document.getElementById('userPassword').value;
    if (password) {
        userData.password = password;
    }

    try {
        let response;
        if (userId) {
            response = await api.updateUser(userId, userData);
        } else {
            response = await api.createUser(userData);
        }

        if (response.success) {
            showAlert(userId ? 'User updated successfully' : 'User created successfully', 'success');
            closeUserModal();
            loadUsers();
        } else {
            showAlert(response.message || 'Operation failed', 'error');
        }
    } catch (error) {
        console.error('Error saving user:', error);
        showAlert(error.message || 'Failed to save user', 'error');
    }
});

// ========================================
// LEAVE TYPES MANAGEMENT
// ========================================

let leaveTypesData = [];

async function loadLeaveTypes() {
    try {
        const response = await api.getLeaveTypesAdmin();

        if (response.success) {
            leaveTypesData = response.types;
            displayLeaveTypes(leaveTypesData);
        }
    } catch (error) {
        console.error('Error loading leave types:', error);
        showAlert('Failed to load leave types', 'error');
    }
}

function displayLeaveTypes(types) {
    const tbody = document.getElementById('leaveTypesTableBody');

    if (!types || types.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="empty-state">
                    <div class="empty-state-icon">📋</div>
                    <p>No leave types found</p>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = types.map(type => `
        <tr>
            <td>
                <div class="color-preview" style="background-color: ${type.color}; width: 30px; height: 30px;"></div>
            </td>
            <td>${type.name}</td>
            <td>${type.description || 'N/A'}</td>
            <td>${type.annual_quota} days</td>
            <td><span class="badge badge-${type.is_active ? 'active' : 'inactive'}">${type.is_active ? 'Active' : 'Inactive'}</span></td>
            <td>
                <div class="action-btns">
                    <button class="btn btn-icon btn-edit" onclick="editLeaveType(${type.id})" title="Edit">
                        ✏️
                    </button>
                    <button class="btn btn-icon btn-delete" onclick="deleteLeaveType(${type.id})" title="Deactivate">
                        🗑️
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function setupColorPicker() {
    const colorInput = document.getElementById('leaveTypeColor');
    const colorPreview = document.getElementById('colorPreview');

    if (colorInput && colorPreview) {
        colorInput.addEventListener('input', (e) => {
            colorPreview.style.backgroundColor = e.target.value;
        });
    }
}

function openLeaveTypeModal(typeId = null) {
    const modal = document.getElementById('leaveTypeModal');
    const form = document.getElementById('leaveTypeForm');
    const title = document.getElementById('leaveTypeModalTitle');

    form.reset();
    document.getElementById('leaveTypeId').value = '';
    document.getElementById('leaveTypeColor').value = '#3498db';
    document.getElementById('colorPreview').style.backgroundColor = '#3498db';

    if (typeId) {
        title.textContent = 'Edit Leave Type';
        const type = leaveTypesData.find(t => t.id === typeId);
        if (type) {
            document.getElementById('leaveTypeId').value = type.id;
            document.getElementById('leaveTypeName').value = type.name;
            document.getElementById('leaveTypeDescription').value = type.description || '';
            document.getElementById('leaveTypeQuota').value = type.annual_quota;
            document.getElementById('leaveTypeColor').value = type.color;
            document.getElementById('colorPreview').style.backgroundColor = type.color;
            document.getElementById('leaveTypeStatus').value = type.is_active ? '1' : '0';
        }
    } else {
        title.textContent = 'Add Leave Type';
    }

    modal.classList.add('active');
}

function closeLeaveTypeModal() {
    document.getElementById('leaveTypeModal').classList.remove('active');
}

function editLeaveType(typeId) {
    openLeaveTypeModal(typeId);
}

async function deleteLeaveType(typeId) {
    if (!confirm('Are you sure you want to deactivate this leave type?')) {
        return;
    }

    try {
        const response = await api.deleteLeaveType(typeId);

        if (response.success) {
            showAlert('Leave type deactivated successfully', 'success');
            loadLeaveTypes();
        } else {
            showAlert(response.message || 'Failed to deactivate leave type', 'error');
        }
    } catch (error) {
        console.error('Error deleting leave type:', error);
        showAlert(error.message || 'Failed to deactivate leave type', 'error');
    }
}

// Leave type form submission
document.getElementById('leaveTypeForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const typeId = document.getElementById('leaveTypeId').value;
    const typeData = {
        name: document.getElementById('leaveTypeName').value,
        description: document.getElementById('leaveTypeDescription').value,
        annual_quota: parseInt(document.getElementById('leaveTypeQuota').value),
        color: document.getElementById('leaveTypeColor').value,
        is_active: parseInt(document.getElementById('leaveTypeStatus').value)
    };

    try {
        let response;
        if (typeId) {
            response = await api.updateLeaveType(typeId, typeData);
        } else {
            response = await api.createLeaveType(typeData);
        }

        if (response.success) {
            showAlert(typeId ? 'Leave type updated successfully' : 'Leave type created successfully', 'success');
            closeLeaveTypeModal();
            loadLeaveTypes();
        } else {
            showAlert(response.message || 'Operation failed', 'error');
        }
    } catch (error) {
        console.error('Error saving leave type:', error);
        showAlert(error.message || 'Failed to save leave type', 'error');
    }
});

// ========================================
// BALANCES MANAGEMENT
// ========================================

let balancesData = [];

async function loadBalanceFilters() {
    try {
        // Load users for filter
        const usersResponse = await api.getUsers();
        if (usersResponse.success) {
            const userFilter = document.getElementById('balanceUserFilter');
            userFilter.innerHTML = '<option value="">All Users</option>' +
                usersResponse.users.map(user =>
                    `<option value="${user.id}">${user.first_name} ${user.last_name}</option>`
                ).join('');
        }

        // Load leave types for filter
        const typesResponse = await api.getLeaveTypesAdmin();
        if (typesResponse.success) {
            const typeFilter = document.getElementById('balanceTypeFilter');
            typeFilter.innerHTML = '<option value="">All Types</option>' +
                typesResponse.types.filter(t => t.is_active).map(type =>
                    `<option value="${type.id}">${type.name}</option>`
                ).join('');
        }
    } catch (error) {
        console.error('Error loading filters:', error);
    }
}

async function loadBalances() {
    try {
        const userId = document.getElementById('balanceUserFilter')?.value || '';
        const typeId = document.getElementById('balanceTypeFilter')?.value || '';

        const filters = {};
        if (userId) filters.user_id = userId;
        if (typeId) filters.leave_type_id = typeId;

        const response = await api.getBalances(filters);

        if (response.success) {
            balancesData = response.balances;
            displayBalances(balancesData);
        }
    } catch (error) {
        console.error('Error loading balances:', error);
        showAlert('Failed to load balances', 'error');
    }
}

function displayBalances(balances) {
    const tbody = document.getElementById('balancesTableBody');

    if (!balances || balances.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="empty-state">
                    <div class="empty-state-icon">⚖️</div>
                    <p>No balances found</p>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = balances.map(balance => `
        <tr>
            <td>${balance.user_name}</td>
            <td>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <div class="color-preview" style="background-color: ${balance.leave_type_color}; width: 20px; height: 20px;"></div>
                    ${balance.leave_type_name}
                </div>
            </td>
            <td>${balance.year}</td>
            <td>${balance.total_days}</td>
            <td>${balance.used_days}</td>
            <td><strong>${balance.remaining_days}</strong></td>
            <td>
                <button class="btn btn-icon btn-edit" onclick="editBalance(${balance.id})" title="Edit">
                    ✏️
                </button>
            </td>
        </tr>
    `).join('');
}

function editBalance(balanceId) {
    const balance = balancesData.find(b => b.id === balanceId);
    if (!balance) return;

    document.getElementById('balanceId').value = balance.id;
    document.getElementById('balanceEmployee').value = balance.user_name;
    document.getElementById('balanceLeaveType').value = balance.leave_type_name;
    document.getElementById('balanceTotalDays').value = balance.total_days;
    document.getElementById('balanceUsedDays').value = balance.used_days;

    document.getElementById('balanceModal').classList.add('active');
}

function closeBalanceModal() {
    document.getElementById('balanceModal').classList.remove('active');
}

// Balance form submission
document.getElementById('balanceForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const balanceId = document.getElementById('balanceId').value;
    const balanceData = {
        total_days: parseFloat(document.getElementById('balanceTotalDays').value),
        used_days: parseFloat(document.getElementById('balanceUsedDays').value)
    };

    try {
        const response = await api.updateBalance(balanceId, balanceData);

        if (response.success) {
            showAlert('Balance updated successfully', 'success');
            closeBalanceModal();
            loadBalances();
        } else {
            showAlert(response.message || 'Failed to update balance', 'error');
        }
    } catch (error) {
        console.error('Error updating balance:', error);
        showAlert(error.message || 'Failed to update balance', 'error');
    }
});

// ========================================
// UTILITY FUNCTIONS
// ========================================

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function showAlert(message, type = 'info') {
    const alertContainer = document.getElementById('alertContainer');

    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;

    alertContainer.appendChild(alert);

    setTimeout(() => {
        alert.style.opacity = '0';
        setTimeout(() => alert.remove(), 300);
    }, 3000);
}
