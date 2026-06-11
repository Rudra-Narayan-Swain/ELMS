// Check if user is already logged in
const token = api.getToken();
if (token) {
    window.location.href = 'dashboard.html';
}

// Login form handler
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        showAlert('Signing in...', 'info');

        const response = await api.login(email, password);

        if (response.success) {
            showAlert('Login successful! Redirecting...', 'success');
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1000);
        }
    } catch (error) {
        showAlert(error.message || 'Login failed. Please check your credentials.', 'error');
    }
});

// Show alert message
function showAlert(message, type = 'info') {
    const alertContainer = document.getElementById('alertContainer');

    const alertClass = type === 'success' ? 'alert-success' :
        type === 'error' ? 'alert-error' : 'alert-info';

    alertContainer.innerHTML = `
        <div class="alert ${alertClass}">
            ${message}
        </div>
    `;

    // Auto-hide after 5 seconds
    if (type !== 'info') {
        setTimeout(() => {
            alertContainer.innerHTML = '';
        }, 5000);
    }
}
