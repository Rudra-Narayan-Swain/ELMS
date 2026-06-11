const express = require('express');
const db = require('../config/db');
const { authMiddleware, isManager } = require('../middleware/auth');

const router = express.Router();

// Get all leave requests (filtered by role)
router.get('/', authMiddleware, async (req, res) => {
    try {
        let query;
        let params;

        if (req.user.role === 'manager') {
            // Managers see all requests
            query = `
                SELECT 
                    lr.*,
                    CONCAT(u.first_name, ' ', u.last_name) as employee_name,
                    u.email as employee_email,
                    lt.name as leave_type_name,
                    lt.color as leave_type_color,
                    CONCAT(r.first_name, ' ', r.last_name) as reviewed_by_name
                FROM leave_requests lr
                JOIN users u ON lr.user_id = u.id
                JOIN leave_types lt ON lr.leave_type_id = lt.id
                LEFT JOIN users r ON lr.reviewed_by = r.id
                ORDER BY lr.created_at DESC
            `;
            params = [];
        } else {
            // Employees see only their requests
            query = `
                SELECT 
                    lr.*,
                    lt.name as leave_type_name,
                    lt.color as leave_type_color,
                    CONCAT(r.first_name, ' ', r.last_name) as reviewed_by_name
                FROM leave_requests lr
                JOIN leave_types lt ON lr.leave_type_id = lt.id
                LEFT JOIN users r ON lr.reviewed_by = r.id
                WHERE lr.user_id = ?
                ORDER BY lr.created_at DESC
            `;
            params = [req.user.id];
        }

        const [requests] = await db.query(query, params);

        res.json({
            success: true,
            requests
        });
    } catch (error) {
        console.error('Get requests error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// Submit new leave request
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { leave_type_id, start_date, end_date, reason } = req.body;

        // Validate input
        if (!leave_type_id || !start_date || !end_date) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields'
            });
        }

        // Calculate total days
        const start = new Date(start_date);
        const end = new Date(end_date);
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // Include both start and end dates

        // Check if end date is after start date
        if (end < start) {
            return res.status(400).json({
                success: false,
                message: 'End date must be after start date'
            });
        }

        // Check leave balance
        const currentYear = new Date().getFullYear();
        const [balances] = await db.query(
            'SELECT remaining_days FROM leave_balances WHERE user_id = ? AND leave_type_id = ? AND year = ?',
            [req.user.id, leave_type_id, currentYear]
        );

        if (balances.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No leave balance found for this leave type'
            });
        }

        if (balances[0].remaining_days < diffDays) {
            return res.status(400).json({
                success: false,
                message: `Insufficient leave balance. Available: ${balances[0].remaining_days} days, Requested: ${diffDays} days`
            });
        }

        // Insert leave request
        const [result] = await db.query(
            'INSERT INTO leave_requests (user_id, leave_type_id, start_date, end_date, total_days, reason) VALUES (?, ?, ?, ?, ?, ?)',
            [req.user.id, leave_type_id, start_date, end_date, diffDays, reason || null]
        );

        res.status(201).json({
            success: true,
            message: 'Leave request submitted successfully',
            requestId: result.insertId
        });
    } catch (error) {
        console.error('Submit request error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// Approve leave request (manager only)
router.put('/:id/approve', authMiddleware, isManager, async (req, res) => {
    try {
        const requestId = req.params.id;
        const { comment } = req.body;

        // Get request details
        const [requests] = await db.query(
            'SELECT * FROM leave_requests WHERE id = ?',
            [requestId]
        );

        if (requests.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Leave request not found'
            });
        }

        const request = requests[0];

        if (request.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'Request has already been processed'
            });
        }

        // Start transaction
        const connection = await db.getConnection();
        await connection.beginTransaction();

        try {
            // Update request status
            await connection.query(
                'UPDATE leave_requests SET status = ?, reviewed_by = ?, reviewed_at = NOW(), manager_comment = ? WHERE id = ?',
                ['approved', req.user.id, comment || null, requestId]
            );

            // Update leave balance
            const currentYear = new Date().getFullYear();
            await connection.query(
                'UPDATE leave_balances SET used_days = used_days + ? WHERE user_id = ? AND leave_type_id = ? AND year = ?',
                [request.total_days, request.user_id, request.leave_type_id, currentYear]
            );

            // Insert approval record
            await connection.query(
                'INSERT INTO leave_request_approvals (leave_request_id, manager_id, action, comment) VALUES (?, ?, ?, ?)',
                [requestId, req.user.id, 'approved', comment || null]
            );

            await connection.commit();
            connection.release();

            res.json({
                success: true,
                message: 'Leave request approved successfully'
            });
        } catch (error) {
            await connection.rollback();
            connection.release();
            throw error;
        }
    } catch (error) {
        console.error('Approve request error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// Reject leave request (manager only)
router.put('/:id/reject', authMiddleware, isManager, async (req, res) => {
    try {
        const requestId = req.params.id;
        const { comment } = req.body;

        // Get request details
        const [requests] = await db.query(
            'SELECT * FROM leave_requests WHERE id = ?',
            [requestId]
        );

        if (requests.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Leave request not found'
            });
        }

        const request = requests[0];

        if (request.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'Request has already been processed'
            });
        }

        // Update request status
        await db.query(
            'UPDATE leave_requests SET status = ?, reviewed_by = ?, reviewed_at = NOW(), manager_comment = ? WHERE id = ?',
            ['rejected', req.user.id, comment || null, requestId]
        );

        // Insert approval record
        await db.query(
            'INSERT INTO leave_request_approvals (leave_request_id, manager_id, action, comment) VALUES (?, ?, ?, ?)',
            [requestId, req.user.id, 'rejected', comment || null]
        );

        res.json({
            success: true,
            message: 'Leave request rejected'
        });
    } catch (error) {
        console.error('Reject request error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// Get leave balances
router.get('/balance', authMiddleware, async (req, res) => {
    try {
        const currentYear = new Date().getFullYear();

        const [balances] = await db.query(`
            SELECT 
                lb.*,
                lt.name as leave_type_name,
                lt.color as leave_type_color
            FROM leave_balances lb
            JOIN leave_types lt ON lb.leave_type_id = lt.id
            WHERE lb.user_id = ? AND lb.year = ?
            ORDER BY lt.name
        `, [req.user.id, currentYear]);

        res.json({
            success: true,
            balances
        });
    } catch (error) {
        console.error('Get balance error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// Get calendar data
router.get('/calendar', authMiddleware, async (req, res) => {
    try {
        const { month, year } = req.query;

        let query;
        let params;

        if (req.user.role === 'manager') {
            // Managers see all approved leaves
            query = `
                SELECT 
                    lr.id,
                    lr.start_date,
                    lr.end_date,
                    lr.total_days,
                    CONCAT(u.first_name, ' ', u.last_name) as employee_name,
                    lt.name as leave_type_name,
                    lt.color as leave_type_color
                FROM leave_requests lr
                JOIN users u ON lr.user_id = u.id
                JOIN leave_types lt ON lr.leave_type_id = lt.id
                WHERE lr.status = 'approved'
            `;
            params = [];
        } else {
            // Employees see only their approved leaves
            query = `
                SELECT 
                    lr.id,
                    lr.start_date,
                    lr.end_date,
                    lr.total_days,
                    lt.name as leave_type_name,
                    lt.color as leave_type_color
                FROM leave_requests lr
                JOIN leave_types lt ON lr.leave_type_id = lt.id
                WHERE lr.user_id = ? AND lr.status = 'approved'
            `;
            params = [req.user.id];
        }

        // Add date filter if month and year provided
        if (month && year) {
            query += ` AND (
                (MONTH(start_date) = ? AND YEAR(start_date) = ?) OR
                (MONTH(end_date) = ? AND YEAR(end_date) = ?) OR
                (start_date <= ? AND end_date >= ?)
            )`;
            const firstDay = `${year}-${month.padStart(2, '0')}-01`;
            const lastDay = new Date(year, month, 0).toISOString().split('T')[0];
            params.push(month, year, month, year, lastDay, firstDay);
        }

        const [leaves] = await db.query(query, params);

        res.json({
            success: true,
            leaves
        });
    } catch (error) {
        console.error('Get calendar error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// Get leave types
router.get('/types', authMiddleware, async (req, res) => {
    try {
        const [types] = await db.query(
            'SELECT * FROM leave_types WHERE is_active = TRUE ORDER BY name'
        );

        res.json({
            success: true,
            types
        });
    } catch (error) {
        console.error('Get types error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

module.exports = router;
