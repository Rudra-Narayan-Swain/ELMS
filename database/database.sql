-- ========================================
-- EMPLOYEE LEAVE MANAGEMENT SYSTEM
-- Complete Database Setup for XAMPP
-- ========================================
-- Just run this ONE file in phpMyAdmin!
-- ========================================

-- Create Database
CREATE DATABASE IF NOT EXISTS elms_db;
USE elms_db;

-- Drop existing tables if they exist
DROP TABLE IF EXISTS leave_request_approvals;
DROP TABLE IF EXISTS leave_requests;
DROP TABLE IF EXISTS leave_balances;
DROP TABLE IF EXISTS leave_types;
DROP TABLE IF EXISTS users;

-- ========================================
-- CREATE TABLES
-- ========================================

-- Users Table
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    role ENUM('employee', 'manager') DEFAULT 'employee',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Leave Types Table
CREATE TABLE leave_types (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    annual_quota INT NOT NULL DEFAULT 0,
    color VARCHAR(7) DEFAULT '#3498db',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Leave Balances Table
CREATE TABLE leave_balances (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    leave_type_id INT NOT NULL,
    year INT NOT NULL,
    total_days DECIMAL(5,2) NOT NULL DEFAULT 0,
    used_days DECIMAL(5,2) NOT NULL DEFAULT 0,
    remaining_days DECIMAL(5,2) GENERATED ALWAYS AS (total_days - used_days) STORED,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (leave_type_id) REFERENCES leave_types(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_leave_year (user_id, leave_type_id, year),
    INDEX idx_user_year (user_id, year)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Leave Requests Table
CREATE TABLE leave_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    leave_type_id INT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_days DECIMAL(5,2) NOT NULL,
    reason TEXT,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    reviewed_by INT DEFAULT NULL,
    reviewed_at TIMESTAMP NULL DEFAULT NULL,
    manager_comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (leave_type_id) REFERENCES leave_types(id),
    FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user (user_id),
    INDEX idx_status (status),
    INDEX idx_dates (start_date, end_date),
    INDEX idx_reviewed_by (reviewed_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Leave Approvals History Table
CREATE TABLE leave_request_approvals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    leave_request_id INT NOT NULL,
    manager_id INT NOT NULL,
    action ENUM('approved', 'rejected') NOT NULL,
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (leave_request_id) REFERENCES leave_requests(id) ON DELETE CASCADE,
    FOREIGN KEY (manager_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_request (leave_request_id),
    INDEX idx_manager (manager_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ========================================
-- INSERT DATA
-- ========================================

-- Insert Leave Types
INSERT INTO leave_types (name, description, annual_quota, color) VALUES
('Vacation Leave', 'Annual vacation days', 15, '#3498db'),
('Sick Leave', 'Medical leave', 12, '#e74c3c'),
('Personal Leave', 'Personal days', 5, '#9b59b6'),
('Maternity Leave', 'Leave for new mothers', 90, '#e91e63'),
('Paternity Leave', 'Leave for new fathers', 10, '#2196f3'),
('Casual Leave', 'Short-term leave', 7, '#f39c12');

-- Insert Users (Password: password123 for ALL users)
INSERT INTO users (email, password, first_name, last_name, phone, role) VALUES
('admin@company.com', '$2a$10$rXQd8HJB1gs1YbeL2J3TUeFjTHzF6Q1KQF0JGgG0H1lHZFGQ0q5Im', 'Admin', 'Manager', '+1234567890', 'manager'),
('john.manager@company.com', '$2a$10$rXQd8HJB1gs1YbeL2J3TUeFjTHzF6Q1KQF0JGgG0H1lHZFGQ0q5Im', 'John', 'Manager', '+1234567891', 'manager'),
('sarah.lead@company.com', '$2a$10$rXQd8HJB1gs1YbeL2J3TUeFjTHzF6Q1KQF0JGgG0H1lHZFGQ0q5Im', 'Sarah', 'Lead', '+1234567892', 'manager'),
('alice.smith@company.com', '$2a$10$rXQd8HJB1gs1YbeL2J3TUeFjTHzF6Q1KQF0JGgG0H1lHZFGQ0q5Im', 'Alice', 'Smith', '+1234567893', 'employee'),
('bob.jones@company.com', '$2a$10$rXQd8HJB1gs1YbeL2J3TUeFjTHzF6Q1KQF0JGgG0H1lHZFGQ0q5Im', 'Bob', 'Jones', '+1234567894', 'employee'),
('carol.white@company.com', '$2a$10$rXQd8HJB1gs1YbeL2J3TUeFjTHzF6Q1KQF0JGgG0H1lHZFGQ0q5Im', 'Carol', 'White', '+1234567895', 'employee');

-- Insert Leave Balances (auto-assign to all users)
INSERT INTO leave_balances (user_id, leave_type_id, year, total_days, used_days)
SELECT u.id, lt.id, 2026, lt.annual_quota, 0
FROM users u CROSS JOIN leave_types lt;

-- Insert Sample Leave Requests
INSERT INTO leave_requests (user_id, leave_type_id, start_date, end_date, total_days, reason, status, reviewed_by, reviewed_at, manager_comment) VALUES
(4, 1, '2026-02-10', '2026-02-14', 5, 'Family vacation', 'approved', 1, '2026-01-20 10:30:00', 'Approved'),
(5, 2, '2026-01-25', '2026-01-27', 3, 'Flu recovery', 'pending', NULL, NULL, NULL);

-- Update balances for approved requests
UPDATE leave_balances lb
JOIN leave_requests lr ON lb.user_id = lr.user_id AND lb.leave_type_id = lr.leave_type_id
SET lb.used_days = lb.used_days + lr.total_days
WHERE lr.status = 'approved' AND lb.year = 2026;

-- ========================================
-- SETUP COMPLETE!
-- ========================================
-- Database: elms_db
-- 
-- LOGIN CREDENTIALS:
-- Manager: admin@company.com / password123
-- Employee: alice.smith@company.com / password123
-- ========================================
