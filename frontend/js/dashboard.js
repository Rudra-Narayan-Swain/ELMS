// Check authentication
const token = api.getToken();
const user = api.getUser();

if (!token || !user) {
    window.location.href = 'index.html';
}

// Initialize dashboard
let leaveTypes = [];

document.addEventListener('DOMContentLoaded', () => {
    loadDashboard();
});

async function loadDashboard() {
    try {
        // Set welcome message
        document.getElementById('welcomeMessage').textContent = `Welcome, ${user.firstName}!`;
        document.getElementById('userRole').innerHTML = `
            <span class="badge ${user.role === 'manager' ? 'badge-manager' : 'badge-pending'}">
                ${user.role.toUpperCase()}
            </span>
        `;

        // Load data
        await Promise.all([
            loadLeaveTypes(),
            loadLeaveBalance(),
            loadLeaveRequests()
        ]);

        // Show manager section if user is manager
        if (user.role === 'manager') {
            document.getElementById('managerSection').classList.remove('hidden');
            document.getElementById('adminPanelBtn').classList.remove('hidden');
        }
    } catch (error) {
        console.error('Dashboard error:', error);
        showAlert('Failed to load dashboard data', 'error');
    }
}

async function loadLeaveTypes() {
    try {
        const response = await api.getLeaveTypes();
        leaveTypes = response.types;

        // Populate leave type select
        const select = document.getElementById('leaveType');
        select.innerHTML = '<option value="">Select leave type...</option>';

        leaveTypes.forEach(type => {
            const option = document.createElement('option');
            option.value = type.id;
            option.textContent = type.name;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Load types error:', error);
    }
}

async function loadLeaveBalance() {
    try {
        const response = await api.getLeaveBalance();
        const balances = response.balances;

        const grid = document.getElementById('balanceGrid');

        if (balances.length === 0) {
            grid.innerHTML = '<div class="empty-state"><p>No leave balances available</p></div>';
            return;
        }

        grid.innerHTML = balances.map(balance => `
            <div class="glass-card balance-card">
                <div class="balance-label">Total</div>
                <div class="balance-number">${balance.total_days}</div>
                <div class="balance-type">${balance.leave_type_name}</div>
                <div style="margin-top: var(--spacing-md); font-size: 0.875rem; color: rgba(255,255,255,0.8);">
                    Used: ${balance.used_days} | Remaining: ${balance.remaining_days}
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Load balance error:', error);
    }
}

async function loadLeaveRequests() {
    try {
        const response = await api.getLeaveRequests();
        const requests = response.requests;

        // Filter pending requests for manager
        const pendingRequests = requests.filter(r => r.status === 'pending');

        // My requests (for current user)
        const myRequests = user.role === 'manager'
            ? requests.filter(r => r.user_id === user.id)
            : requests;

        // Populate manager table
        if (user.role === 'manager') {
            const tbody = document.getElementById('pendingRequestsBody');

            if (pendingRequests.length === 0) {
                tbody.innerHTML = '<tr><td colspan="7" class="empty-state">No pending requests</td></tr>';
            } else {
                tbody.innerHTML = pendingRequests.map(request => `
                    <tr>
                        <td>${request.employee_name}</td>
                        <td>
                            <span style="display: inline-block; width: 12px; height: 12px; border-radius: 50%; background: ${request.leave_type_color}; margin-right: 8px;"></span>
                            ${request.leave_type_name}
                        </td>
                        <td>${formatDate(request.start_date)}</td>
                        <td>${formatDate(request.end_date)}</td>
                        <td>${request.total_days}</td>
                        <td>${request.reason || '-'}</td>
                        <td class="table-actions">
                            <button onclick="approveRequest(${request.id})" class="btn btn-success btn-sm">✓</button>
                            <button onclick="rejectRequest(${request.id})" class="btn btn-danger btn-sm">✗</button>
                        </td>
                    </tr>
                `).join('');
            }
        }

        // Populate my requests table
        const myTbody = document.getElementById('myRequestsBody');

        if (myRequests.length === 0) {
            myTbody.innerHTML = '<tr><td colspan="7" class="empty-state">No leave requests yet</td></tr>';
        } else {
            myTbody.innerHTML = myRequests.map(request => `
                <tr>
                    <td>
                        <span style="display: inline-block; width: 12px; height: 12px; border-radius: 50%; background: ${request.leave_type_color}; margin-right: 8px;"></span>
                        ${request.leave_type_name}
                    </td>
                    <td>${formatDate(request.start_date)}</td>
                    <td>${formatDate(request.end_date)}</td>
                    <td>${request.total_days}</td>
                    <td>
                        <span class="badge badge-${request.status}">
                            ${request.status}
                        </span>
                    </td>
                    <td>${request.reviewed_by_name || '-'}</td>
                    <td>${request.manager_comment || '-'}</td>
                </tr>
            `).join('');
        }
    } catch (error) {
        console.error('Load requests error:', error);
    }
}

// Leave Request Modal
function openLeaveRequestModal() {
    document.getElementById('leaveRequestModal').classList.add('active');
    document.getElementById('leaveRequestForm').reset();

    // Set min date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('startDate').min = today;
    document.getElementById('endDate').min = today;
}

function closeLeaveRequestModal() {
    document.getElementById('leaveRequestModal').classList.remove('active');
}

document.getElementById('leaveRequestForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = {
        leave_type_id: document.getElementById('leaveType').value,
        start_date: document.getElementById('startDate').value,
        end_date: document.getElementById('endDate').value,
        reason: document.getElementById('reason').value
    };

    try {
        const response = await api.submitLeaveRequest(formData);

        if (response.success) {
            showAlert('Leave request submitted successfully!', 'success');
            closeLeaveRequestModal();
            loadLeaveBalance();
            loadLeaveRequests();
        }
    } catch (error) {
        showAlert(error.message || 'Failed to submit leave request', 'error');
    }
});

// Update end date minimum when start date changes
document.getElementById('startDate').addEventListener('change', (e) => {
    document.getElementById('endDate').min = e.target.value;
});

// Approval functions
function approveRequest(requestId) {
    openApprovalModal(requestId, 'approve');
}

function rejectRequest(requestId) {
    openApprovalModal(requestId, 'reject');
}

function openApprovalModal(requestId, action) {
    document.getElementById('approvalModal').classList.add('active');
    document.getElementById('approvalRequestId').value = requestId;
    document.getElementById('approvalAction').value = action;
    document.getElementById('approvalForm').reset();

    const title = action === 'approve' ? 'Approve Leave Request' : 'Reject Leave Request';
    document.getElementById('approvalTitle').textContent = title;

    const btn = document.getElementById('approvalSubmitBtn');
    btn.className = action === 'approve' ? 'btn btn-success' : 'btn btn-danger';
    btn.textContent = action === 'approve' ? 'Approve' : 'Reject';
}

function closeApprovalModal() {
    document.getElementById('approvalModal').classList.remove('active');
}

document.getElementById('approvalForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const requestId = document.getElementById('approvalRequestId').value;
    const action = document.getElementById('approvalAction').value;
    const comment = document.getElementById('approvalComment').value;

    try {
        let response;
        if (action === 'approve') {
            response = await api.approveLeaveRequest(requestId, comment);
        } else {
            response = await api.rejectLeaveRequest(requestId, comment);
        }

        if (response.success) {
            showAlert(response.message, 'success');
            closeApprovalModal();
            loadLeaveRequests();
        }
    } catch (error) {
        showAlert(error.message || 'Failed to process request', 'error');
    }
});

// Utility functions
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

    const alertClass = type === 'success' ? 'alert-success' :
        type === 'error' ? 'alert-error' : 'alert-info';

    alertContainer.innerHTML = `
        <div class="alert ${alertClass}">
            ${message}
        </div>
    `;

    setTimeout(() => {
        alertContainer.innerHTML = '';
    }, 5000);
}
