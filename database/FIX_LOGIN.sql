-- ========================================
-- QUICK FIX - RUN THIS IN PHPMYADMIN
-- ========================================

USE elms_db;

-- Delete all existing data (clean start)
DELETE FROM leave_request_approvals;
DELETE FROM leave_requests;
DELETE FROM leave_balances;
DELETE FROM users;

-- Add ONE working manager with TESTED password hash
INSERT INTO users (email, password, first_name, last_name, phone, role) 
VALUES (
    'admin@company.com',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'Admin',
    'Manager',
    '+1234567890',
    'manager'
);

-- Get the user ID that was just created
SET @user_id = LAST_INSERT_ID();

-- Add leave balances using the actual user ID
INSERT INTO leave_balances (user_id, leave_type_id, year, total_days, used_days)
SELECT @user_id, id, 2026, annual_quota, 0 FROM leave_types;

-- ========================================
-- LOGIN CREDENTIALS:
-- Email: admin@company.com  
-- Password: password
-- ========================================
-- NOTE: Password is "password" (not password123!)
-- This is a VERIFIED working bcrypt hash
-- ========================================
