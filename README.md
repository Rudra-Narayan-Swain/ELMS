# 🏢 Employee Leave Management System (ELMS)

A comprehensive, full-stack web application for managing employee leave requests, approvals, and balances for small to medium-sized companies (~50 employees). Built with modern technologies and featuring a premium glassmorphic UI design.

---

## 📑 Table of Contents

- [Features](#-features)
- [Technology Stack](#-technology-stack)
- [Project Structure](#-project-structure)
- [Prerequisites](#-prerequisites)
- [Installation & Setup](#-installation--setup)
- [Quick Start](#-quick-start)
- [Database Schema](#-database-schema)
- [API Documentation](#-api-documentation)
- [User Roles & Permissions](#-user-roles--permissions)
- [Usage Guide](#-usage-guide)
- [Default Login Credentials](#-default-login-credentials)
- [Troubleshooting](#-troubleshooting)
- [Security Features](#-security-features)

---

## ✨ Features

### Core Functionality
- **User Authentication**: Secure JWT-based authentication with bcrypt password hashing
- **Role-Based Access Control**: Employee and Manager roles with different permissions
- **Leave Request Management**: Submit, approve, reject, and track leave requests
- **Leave Balance Tracking**: Automatic balance calculation and updates
- **Interactive Calendar**: Visual representation of approved leaves
- **Admin Panel**: Complete system administration interface for managers

### Employee Features
- Submit leave requests with date range and reason
- View personal leave balances across all leave types
- Track request status (pending, approved, rejected)
- View manager comments on requests
- Interactive calendar showing approved leaves

### Manager Features
- View all employee leave requests
- Approve or reject requests with comments
- View team calendar with all employee leaves
- Access admin panel for system management
- Manage users, leave types, and balances

### Admin Panel Features (Manager Only)
- **User Management**: Create, edit, deactivate users
- **Leave Type Management**: Configure leave types with quotas and colors
- **Balance Management**: Adjust leave balances for employees
- **System Statistics**: Real-time analytics and recent activity
- Advanced filtering and search capabilities

### UI/UX Features
- **Premium Design**: Modern glassmorphic design with gradient animations
- **Responsive Layout**: Works on desktop, tablet, and mobile devices
- **Floating Orbs Background**: Animated gradient orbs for visual appeal
- **Smooth Animations**: Micro-interactions and transitions throughout
- **Dark Mode Theme**: Eye-friendly dark color scheme

---

## 🛠️ Technology Stack

### Backend
- **Runtime**: Node.js (v14+)
- **Framework**: Express.js
- **Database**: MySQL (v5.7+)
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcryptjs
- **Database Driver**: mysql2 with promise support

### Frontend
- **Structure**: HTML5
- **Styling**: Vanilla CSS with custom properties
- **Scripting**: Vanilla JavaScript
- **Design**: Glassmorphism with gradient animations
- **Typography**: Inter font family from Google Fonts

### Dependencies
```json
{
  "bcryptjs": "^2.4.3",
  "cors": "^2.8.5",
  "dotenv": "^16.3.1",
  "express": "^4.18.2",
  "jsonwebtoken": "^9.0.2",
  "mysql2": "^3.6.5"
}
```

---

## 📁 Project Structure

```
Elms/
├── backend/
│   ├── config/
│   │   └── db.js                  # Database connection pool configuration
│   ├── middleware/
│   │   └── auth.js                # JWT authentication & authorization middleware
│   ├── routes/
│   │   ├── authRoutes.js          # Authentication endpoints (login, register, profile)
│   │   ├── leaveRoutes.js         # Leave management endpoints (CRUD, approve, reject)
│   │   └── adminRoutes.js         # Admin panel endpoints (users, types, balances, stats)
│   ├── .env                       # Environment variables (DB credentials, JWT secret)
│   ├── gen_hash.js                # Utility to generate bcrypt password hashes
│   ├── test_password.js           # Utility to test password verification
│   ├── package.json               # Backend dependencies
│   └── server.js                  # Main Express server file
│
├── database/
│   ├── database.sql               # Complete database schema + seed data (MAIN FILE)
│   └── FIX_LOGIN.sql              # Login fix script for password hash updates
│
├── frontend/
│   ├── css/
│   │   └── styles.css             # Global styles with glassmorphic theme
│   ├── js/
│   │   ├── api.js                 # API client with auth token management
│   │   ├── auth.js                # Login/registration logic
│   │   ├── dashboard.js           # Dashboard page logic
│   │   ├── calendar.js            # Calendar page logic
│   │   └── admin.js               # Admin panel logic
│   ├── index.html                 # Login/Registration page
│   ├── dashboard.html             # Employee/Manager dashboard
│   ├── calendar.html              # Leave calendar view
│   ├── admin.html                 # Admin panel (manager only)
│   └── logo.png                   # Application logo
│
├── start.bat                      # Quick start script for Windows
├── README.md                      # This file
└── HOW_TO_FIX_LOGIN.md           # Login troubleshooting guide
```

---

## 📋 Prerequisites

Before installing, ensure you have:

- **Node.js**: Version 14.0 or higher ([Download](https://nodejs.org/))
- **npm**: Comes bundled with Node.js
- **MySQL**: Version 5.7 or higher ([Download](https://dev.mysql.com/downloads/mysql/))
- **Web Browser**: Modern browser (Chrome, Firefox, Edge, Safari)
- **Text Editor**: (Optional) VS Code, Sublime Text, etc.

---

## 🚀 Installation & Setup

### Step 1: Database Setup

1. **Start MySQL Server**
   ```bash
   # Windows: Start MySQL from Services or XAMPP
   # Mac: brew services start mysql
   # Linux: sudo service mysql start
   ```

2. **Open MySQL Command Line**
   ```bash
   mysql -u root -p
   ```

3. **Import Database Schema and Seed Data**
   
   **Option A: Using MySQL Command Line**
   ```sql
   SOURCE d:/TEST-PROJECT/Elms/Elms/database/database.sql;
   ```

   **Option B: Using Command Prompt**
   ```bash
   mysql -u root -p < database/database.sql
   ```

   **Option C: Using phpMyAdmin (XAMPP Users)**
   - Go to http://localhost/phpmyadmin
   - Click "Import" tab
   - Choose `database/database.sql`
   - Click "Go"

4. **Verify Database Creation**
   ```sql
   USE elms_db;
   SHOW TABLES;
   -- Should show: users, leave_types, leave_balances, leave_requests, leave_request_approvals
   ```

### Step 2: Backend Configuration

1. **Navigate to Backend Directory**
   ```bash
   cd backend
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   
   Edit the `.env` file in the `backend` directory:
   ```env
   # Server Configuration
   PORT=3000
   NODE_ENV=development

   # Database Configuration
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=elms_db
   DB_PORT=3306

   # JWT Configuration
   JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
   JWT_EXPIRES_IN=24h
   ```

   > ⚠️ **IMPORTANT**: Change `JWT_SECRET` to a strong, random string before deploying to production!

4. **Start the Backend Server**
   ```bash
   npm start
   ```

   You should see:
   ```
   ═══════════════════════════════════════════════════
     Employee Leave Management System - API Server
   ═══════════════════════════════════════════════════
     Server running on: http://localhost:3000
     Environment: development
   ═══════════════════════════════════════════════════
   ✓ Database connected successfully
   ```

### Step 3: Frontend Setup

1. **Open Frontend in Browser**

   **Option A: Direct File Opening**
   - Navigate to `frontend` folder
   - Right-click on `index.html`
   - Select "Open with" → Your browser

   **Option B: Using HTTP Server (Recommended)**
   ```bash
   cd frontend
   npx serve
   # Or use Python's built-in server:
   # python -m http.server 8000
   ```
   Then open: http://localhost:3000 or http://localhost:8000

---

## ⚡ Quick Start

### Using start.bat (Windows Only)

Double-click `start.bat` in the root directory to:
1. Check MySQL connection status
2. Display database setup instructions
3. Start the backend server automatically
4. Open the frontend in your default browser

---



## 👥 User Roles & Permissions

### Employee Role
- ✅ Submit leave requests
- ✅ View own leave requests and status
- ✅ View own leave balances
- ✅ View own calendar
- ❌ Cannot approve/reject requests
- ❌ Cannot access admin panel
- ❌ Cannot view other employees' data

### Manager Role
- ✅ All employee permissions
- ✅ View ALL leave requests
- ✅ Approve/reject leave requests
- ✅ View team calendar (all employees)
- ✅ Access admin panel
- ✅ Manage users (create, edit, deactivate)
- ✅ Manage leave types
- ✅ Adjust leave balances
- ✅ View system statistics

---

## 📖 Usage Guide

### For Employees

1. **Login**
   - Go to `index.html`
   - Enter email and password
   - Click "Sign In"

2. **View Dashboard**
   - See leave balances at the top
   - View pending/approved/rejected requests
   - Check remaining days for each leave type

3. **Request Leave**
   - Click "Request Leave" button
   - Select leave type from dropdown
   - Choose start and end dates
   - Enter reason (optional but recommended)
   - Click "Submit Request"

4. **Track Requests**
   - View all requests in "My Leave Requests" section
   - Check status: 🕐 Pending, ✓ Approved, ✗ Rejected
   - Read manager comments if any

5. **View Calendar**
   - Click "Calendar" in navigation
   - See visual representation of approved leaves
   - Color-coded by leave type

### For Managers

1. **Review Requests**
   - Login with manager credentials
   - View "Pending Leave Requests" section
   - Click ✓ (Approve) or ✗ (Reject)
   - Add optional comment
   - Confirm action

2. **View Team Calendar**
   - Click "Calendar" in navigation
   - See all employees' approved leaves
   - Plan team availability

3. **Access Admin Panel**
   - Click "Admin Panel" button
   - Manage users, leave types, and balances
   - View system statistics and recent activity

4. **Manage Users**
   - Go to Admin Panel → Users tab
   - Add new users with ➕ Add User
   - Edit existing users
   - Deactivate users if needed
   - Filter by role and status

5. **Configure Leave Types**
   - Go to Admin Panel → Leave Types tab
   - Create custom leave types
   - Set annual quotas
   - Choose colors for calendar
   - Activate/deactivate types

6. **Adjust Balances**
   - Go to Admin Panel → Balances tab
   - Filter by user or leave type
   - Edit balances as needed
   - Track usage across the team

---

## 🔑 Default Login Credentials

### Manager Accounts

**Primary Admin**
- Email: `admin@company.com`
- Password: `password123`
- Role: Manager
- Can: Approve requests, access admin panel

**Additional Managers**
- Email: `john.manager@company.com` | Password: `password123`
- Email: `sarah.lead@company.com` | Password: `password123`

### Employee Accounts

- Email: `alice.smith@company.com` | Password: `password123`
- Email: `bob.jones@company.com` | Password: `password123`
- Email: `carol.white@company.com` | Password: `password123`

> ⚠️ **Security Note**: Change all default passwords after first login in production!

---

## 🔧 Troubleshooting

### Database Connection Issues

**Problem**: "Database connection failed"
```bash
Solution:
1. Ensure MySQL server is running
2. Check credentials in backend/.env
3. Verify database 'elms_db' exists
4. Test connection: mysql -u root -p
```

### Backend Not Starting

**Problem**: "Port 3000 is already in use"
```bash
Solution:
1. Check if another app is using port 3000
2. Change PORT in .env file
3. Kill process: netstat -ano | findstr :3000
```

**Problem**: "Cannot find module"
```bash
Solution:
1. Delete node_modules folder
2. Delete package-lock.json
3. Run: npm install
```

### Frontend API Errors

**Problem**: "Failed to fetch" or CORS errors
```bash
Solution:
1. Ensure backend server is running on http://localhost:3000
2. Check API_BASE_URL in frontend/js/api.js
3. Clear browser cache and cookies
4. Check browser console for detailed errors
```

### Login Issues

**Problem**: "Invalid email or password"
```bash
Solution:
1. Verify user exists in database
2. Check password hash in database
3. Run: backend/test_password.js to test passwords
4. If needed, run: database/FIX_LOGIN.sql
```

### Token Expiration

**Problem**: "Token expired. Please login again."
```bash
Solution:
1. This is normal after 24 hours (default)
2. Simply login again
3. To extend: Change JWT_EXPIRES_IN in .env
```

---

## 🔐 Security Features

### Authentication & Authorization
- **JWT Tokens**: Secure stateless authentication
- **Bcrypt Hashing**: Password hashing with salt rounds (10)
- **Token Expiration**: 24-hour default expiry
- **Role-Based Access**: Middleware enforces role permissions

### Data Protection
- **SQL Injection Prevention**: Parameterized queries throughout
- **Input Validation**: Server-side validation on all endpoints
- **Password Requirements**: Enforced on frontend and backend
- **CORS Enabled**: Configured for cross-origin requests

### Best Practices
- **Environment Variables**: Sensitive data in .env file
- **Active Status**: Soft delete for user deactivation
- **Audit Trail**: leave_request_approvals table tracks all actions
- **Connection Pooling**: Efficient database connection management

---

## 📝 Additional Documentation

- **HOW_TO_FIX_LOGIN.md**: Detailed login troubleshooting guide
- **database/database.sql**: Complete database structure with comments
- **backend/gen_hash.js**: Generate password hashes for testing
- **backend/test_password.js**: Verify password hashes

---

## 🎯 Future Enhancements

Potential features for future versions:
- Email notifications for leave status changes
- Multi-level approval workflow
- Leave request drafts
- Export leave reports to PDF/Excel
- Mobile application (React Native)
- Integration with calendar apps (Google Calendar, Outlook)
- Bulk leave import/export
- Custom leave policies per department
- Attachment support for medical certificates
- Analytics dashboard with charts and graphs

---

## 📄 License

This project is created for educational purposes.

---

## 👨‍💻 Support

For issues, questions, or feature requests:
1. Check the [Troubleshooting](#-troubleshooting) section
2. Review the API documentation
3. Contact your system administrator

---

## 🙏 Acknowledgments

- Built with modern web technologies
- Inspired by enterprise leave management systems
- Premium UI design using glassmorphism principles
- Font: Inter by Google Fonts

---

**Version**: 1.0.0  
**Last Updated**: January 2026  
**Developed For**: Small to Medium Companies (~50 employees)

---

