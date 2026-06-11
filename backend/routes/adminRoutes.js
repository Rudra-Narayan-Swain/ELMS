const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../config/db');
const { authMiddleware, isManager } = require('../middleware/auth');

const router = express.Router();

// All admin routes require manager authentication
router.use(authMiddleware);
router.use(isManager);

// ========================================
// USER MANAGEMENT
// ========================================

// Get all users with pagination and filtering
router.get('/users', async (req, res) => {
    try {
        const { role, status, search } = req.query;

        let query = `
            SELECT 
                id, email, first_name, last_name, phone, role, is_active, created_at, updated_at
            FROM users
            WHERE 1=1
        `;
        const params = [];

        // Apply filters
        if (role) {
            query += ' AND role = ?';
            params.push(role);
        }

        if (status === 'active') {
            query += ' AND is_active = TRUE';
        } else if (status === 'inactive') {
            query += ' AND is_active = FALSE';
        }

        if (search) {
            query += ' AND (first_name LIKE ? OR last_name LIKE ? OR email LIKE ?)';
            const searchPattern = `%${search}%`;
            params.push(searchPattern, searchPattern, searchPattern);
        }

        query += ' ORDER BY created_at DESC';

        const [users] = await db.query(query, params);

        res.json({
            success: true,
            users
        });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// Create new user
router.post('/users', async (req, res) => {
    try {
        const { email, password, first_name, last_name, phone, role } = req.body;

        // Validate input
        if (!email || !password || !first_name || !last_name) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields'
            });
        }

        // Check if user already exists
        const [existingUsers] = await db.query(
            'SELECT id FROM users WHERE email = ?',
            [email]
        );

        if (existingUsers.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'User already exists with this email'
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert user
        const [result] = await db.query(
            'INSERT INTO users (email, password, first_name, last_name, phone, role) VALUES (?, ?, ?, ?, ?, ?)',
            [email, hashedPassword, first_name, last_name, phone || null, role || 'employee']
        );

        const userId = result.insertId;

        // Get current year
        const currentYear = new Date().getFullYear();

        // Assign default leave balances
        const [leaveTypes] = await db.query('SELECT id, annual_quota FROM leave_types WHERE is_active = TRUE');

        for (const leaveType of leaveTypes) {
            await db.query(
                'INSERT INTO leave_balances (user_id, leave_type_id, year, total_days, used_days) VALUES (?, ?, ?, ?, 0)',
                [userId, leaveType.id, currentYear, leaveType.annual_quota]
            );
        }

        res.status(201).json({
            success: true,
            message: 'User created successfully',
            userId
        });
    } catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// Update user
router.put('/users/:id', async (req, res) => {
    try {
        const userId = req.params.id;
        const { email, first_name, last_name, phone, role, is_active, password } = req.body;

        // Build update query dynamically based on provided fields
        const updates = [];
        const params = [];

        if (email) {
            // Check if email is already taken by another user
            const [existingUsers] = await db.query(
                'SELECT id FROM users WHERE email = ? AND id != ?',
                [email, userId]
            );

            if (existingUsers.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Email already in use by another user'
                });
            }
            updates.push('email = ?');
            params.push(email);
        }

        if (first_name) {
            updates.push('first_name = ?');
            params.push(first_name);
        }

        if (last_name) {
            updates.push('last_name = ?');
            params.push(last_name);
        }

        if (phone !== undefined) {
            updates.push('phone = ?');
            params.push(phone || null);
        }

        if (role) {
            updates.push('role = ?');
            params.push(role);
        }

        if (is_active !== undefined) {
            updates.push('is_active = ?');
            params.push(is_active);
        }

        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            updates.push('password = ?');
            params.push(hashedPassword);
        }

        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No fields to update'
            });
        }

        params.push(userId);

        const query = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;
        await db.query(query, params);

        res.json({
            success: true,
            message: 'User updated successfully'
        });
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// Soft delete user (deactivate)
router.delete('/users/:id', async (req, res) => {
    try {
        const userId = req.params.id;

        // Prevent self-deletion
        if (userId == req.user.id) {
            return res.status(400).json({
                success: false,
                message: 'You cannot delete your own account'
            });
        }

        await db.query(
            'UPDATE users SET is_active = FALSE WHERE id = ?',
            [userId]
        );

        res.json({
            success: true,
            message: 'User deactivated successfully'
        });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// ========================================
// LEAVE TYPES MANAGEMENT
// ========================================

// Get all leave types
router.get('/leave-types', async (req, res) => {
    try {
        const [types] = await db.query(
            'SELECT * FROM leave_types ORDER BY name'
        );

        res.json({
            success: true,
            types
        });
    } catch (error) {
        console.error('Get leave types error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// Create new leave type
router.post('/leave-types', async (req, res) => {
    try {
        const { name, description, annual_quota, color } = req.body;

        // Validate input
        if (!name || annual_quota === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Please provide name and annual quota'
            });
        }

        // Check if leave type already exists
        const [existing] = await db.query(
            'SELECT id FROM leave_types WHERE name = ?',
            [name]
        );

        if (existing.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Leave type with this name already exists'
            });
        }

        // Insert leave type
        const [result] = await db.query(
            'INSERT INTO leave_types (name, description, annual_quota, color) VALUES (?, ?, ?, ?)',
            [name, description || null, annual_quota, color || '#3498db']
        );

        // Assign this leave type to all active users
        const currentYear = new Date().getFullYear();
        const [users] = await db.query('SELECT id FROM users WHERE is_active = TRUE');

        for (const user of users) {
            await db.query(
                'INSERT INTO leave_balances (user_id, leave_type_id, year, total_days, used_days) VALUES (?, ?, ?, ?, 0)',
                [user.id, result.insertId, currentYear, annual_quota]
            );
        }

        res.status(201).json({
            success: true,
            message: 'Leave type created successfully',
            typeId: result.insertId
        });
    } catch (error) {
        console.error('Create leave type error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// Update leave type
router.put('/leave-types/:id', async (req, res) => {
    try {
        const typeId = req.params.id;
        const { name, description, annual_quota, color, is_active } = req.body;

        const updates = [];
        const params = [];

        if (name) {
            // Check if name is already taken by another type
            const [existing] = await db.query(
                'SELECT id FROM leave_types WHERE name = ? AND id != ?',
                [name, typeId]
            );

            if (existing.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Leave type name already in use'
                });
            }
            updates.push('name = ?');
            params.push(name);
        }

        if (description !== undefined) {
            updates.push('description = ?');
            params.push(description || null);
        }

        if (annual_quota !== undefined) {
            updates.push('annual_quota = ?');
            params.push(annual_quota);
        }

        if (color) {
            updates.push('color = ?');
            params.push(color);
        }

        if (is_active !== undefined) {
            updates.push('is_active = ?');
            params.push(is_active);
        }

        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No fields to update'
            });
        }

        params.push(typeId);

        const query = `UPDATE leave_types SET ${updates.join(', ')} WHERE id = ?`;
        await db.query(query, params);

        res.json({
            success: true,
            message: 'Leave type updated successfully'
        });
    } catch (error) {
        console.error('Update leave type error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// Deactivate leave type
router.delete('/leave-types/:id', async (req, res) => {
    try {
        const typeId = req.params.id;

        await db.query(
            'UPDATE leave_types SET is_active = FALSE WHERE id = ?',
            [typeId]
        );

        res.json({
            success: true,
            message: 'Leave type deactivated successfully'
        });
    } catch (error) {
        console.error('Delete leave type error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// ========================================
// LEAVE BALANCE MANAGEMENT
// ========================================

// Get all leave balances with filtering
router.get('/balances', async (req, res) => {
    try {
        const { user_id, leave_type_id, year } = req.query;
        const currentYear = year || new Date().getFullYear();

        let query = `
            SELECT 
                lb.*,
                CONCAT(u.first_name, ' ', u.last_name) as user_name,
                u.email as user_email,
                lt.name as leave_type_name,
                lt.color as leave_type_color
            FROM leave_balances lb
            JOIN users u ON lb.user_id = u.id
            JOIN leave_types lt ON lb.leave_type_id = lt.id
            WHERE lb.year = ?
        `;
        const params = [currentYear];

        if (user_id) {
            query += ' AND lb.user_id = ?';
            params.push(user_id);
        }

        if (leave_type_id) {
            query += ' AND lb.leave_type_id = ?';
            params.push(leave_type_id);
        }

        query += ' ORDER BY u.last_name, u.first_name, lt.name';

        const [balances] = await db.query(query, params);

        res.json({
            success: true,
            balances
        });
    } catch (error) {
        console.error('Get balances error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// Update leave balance
router.put('/balances/:id', async (req, res) => {
    try {
        const balanceId = req.params.id;
        const { total_days, used_days } = req.body;

        const updates = [];
        const params = [];

        if (total_days !== undefined) {
            updates.push('total_days = ?');
            params.push(total_days);
        }

        if (used_days !== undefined) {
            updates.push('used_days = ?');
            params.push(used_days);
        }

        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No fields to update'
            });
        }

        params.push(balanceId);

        const query = `UPDATE leave_balances SET ${updates.join(', ')} WHERE id = ?`;
        await db.query(query, params);

        res.json({
            success: true,
            message: 'Leave balance updated successfully'
        });
    } catch (error) {
        console.error('Update balance error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// ========================================
// SYSTEM STATISTICS
// ========================================

// Get system statistics
router.get('/stats', async (req, res) => {
    try {
        // Total users
        const [totalUsers] = await db.query(
            'SELECT COUNT(*) as count FROM users WHERE is_active = TRUE'
        );

        // Total employees
        const [totalEmployees] = await db.query(
            'SELECT COUNT(*) as count FROM users WHERE role = "employee" AND is_active = TRUE'
        );

        // Total managers
        const [totalManagers] = await db.query(
            'SELECT COUNT(*) as count FROM users WHERE role = "manager" AND is_active = TRUE'
        );

        // Pending requests
        const [pendingRequests] = await db.query(
            'SELECT COUNT(*) as count FROM leave_requests WHERE status = "pending"'
        );

        // Approved requests this month
        const [approvedThisMonth] = await db.query(
            `SELECT COUNT(*) as count FROM leave_requests 
             WHERE status = "approved" 
             AND MONTH(created_at) = MONTH(CURRENT_DATE()) 
             AND YEAR(created_at) = YEAR(CURRENT_DATE())`
        );

        // Total leave types
        const [totalLeaveTypes] = await db.query(
            'SELECT COUNT(*) as count FROM leave_types WHERE is_active = TRUE'
        );

        // Recent activity (last 10 requests)
        const [recentActivity] = await db.query(
            `SELECT 
                lr.id,
                lr.status,
                lr.created_at,
                CONCAT(u.first_name, ' ', u.last_name) as employee_name,
                lt.name as leave_type,
                lr.total_days
            FROM leave_requests lr
            JOIN users u ON lr.user_id = u.id
            JOIN leave_types lt ON lr.leave_type_id = lt.id
            ORDER BY lr.created_at DESC
            LIMIT 10`
        );

        res.json({
            success: true,
            stats: {
                totalUsers: totalUsers[0].count,
                totalEmployees: totalEmployees[0].count,
                totalManagers: totalManagers[0].count,
                pendingRequests: pendingRequests[0].count,
                approvedThisMonth: approvedThisMonth[0].count,
                totalLeaveTypes: totalLeaveTypes[0].count,
                recentActivity
            }
        });
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

module.exports = router;
