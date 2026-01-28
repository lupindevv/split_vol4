const pool = require('../config/database');
const { generateQRCode } = require('../utils/qrcode');
const { v4: uuidv4 } = require('uuid');

// @desc    Get all bills
// @route   GET /api/bills
// @access  Private
const getBills = async (req, res) => {
    try {
        const { status } = req.query;
        
        let query = `
            SELECT b.*, t.table_number, 
                   COUNT(DISTINCT bi.id) as total_items,
                   COUNT(DISTINCT p.id) as total_payments
            FROM bills b
            LEFT JOIN tables t ON b.table_id = t.id
            LEFT JOIN bill_items bi ON b.id = bi.bill_id
            LEFT JOIN payments p ON b.id = p.bill_id
            WHERE 1=1
        `;
        
        const params = [];
        
        if (status) {
            query += ` AND b.status = $${params.length + 1}`;
            params.push(status);
        }
        
        query += ' GROUP BY b.id, t.table_number ORDER BY b.created_at DESC';
        
        const result = await pool.query(query, params);
        
        res.json({
            success: true,
            count: result.rows.length,
            data: result.rows
        });
    } catch (error) {
        console.error('Get bills error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get single bill with items
// @route   GET /api/bills/:id
// @access  Public (customers need to access via QR)
const getBill = async (req, res) => {
    try {
        const { id } = req.params;
        
        const billResult = await pool.query(
            `SELECT b.*, t.table_number 
             FROM bills b
             LEFT JOIN tables t ON b.table_id = t.id
             WHERE b.id = $1`,
            [id]
        );
        
        if (billResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Bill not found'
            });
        }
        
        const bill = billResult.rows[0];
        
        const itemsResult = await pool.query(
            'SELECT * FROM bill_items WHERE bill_id = $1 ORDER BY created_at',
            [id]
        );
        
        const paymentsResult = await pool.query(
            'SELECT * FROM payments WHERE bill_id = $1 ORDER BY created_at',
            [id]
        );
        
        res.json({
            success: true,
            data: {
                ...bill,
                items: itemsResult.rows,
                payments: paymentsResult.rows
            }
        });
    } catch (error) {
        console.error('Get bill error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get bill by bill number (for QR code scan)
// @route   GET /api/bills/number/:billNumber
// @access  Public
const getBillByNumber = async (req, res) => {
    try {
        const { billNumber } = req.params;
        
        const billResult = await pool.query(
            `SELECT b.*, t.table_number 
             FROM bills b
             LEFT JOIN tables t ON b.table_id = t.id
             WHERE b.bill_number = $1`,
            [billNumber]
        );
        
        if (billResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Bill not found'
            });
        }
        
        const bill = billResult.rows[0];
        
        const itemsResult = await pool.query(
            'SELECT * FROM bill_items WHERE bill_id = $1 AND is_paid = false ORDER BY created_at',
            [bill.id]
        );
        
        res.json({
            success: true,
            data: {
                ...bill,
                items: itemsResult.rows
            }
        });
    } catch (error) {
        console.error('Get bill by number error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get active bill by table number
// @route   GET /api/bills/table/:tableNumber
// @access  Public
const getBillByTableNumber = async (req, res) => {
    try {
        const { tableNumber } = req.params;
        
        const billResult = await pool.query(
            `SELECT b.*, t.table_number 
             FROM bills b
             LEFT JOIN tables t ON b.table_id = t.id
             WHERE t.table_number = $1 AND b.status = 'active'
             ORDER BY b.created_at DESC
             LIMIT 1`,
            [tableNumber]
        );
        
        if (billResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No active bill found for this table'
            });
        }
        
        const bill = billResult.rows[0];
        
        const itemsResult = await pool.query(
            'SELECT * FROM bill_items WHERE bill_id = $1 AND is_paid = false ORDER BY created_at',
            [bill.id]
        );
        
        res.json({
            success: true,
            data: {
                ...bill,
                items: itemsResult.rows
            }
        });
    } catch (error) {
        console.error('Get bill by table number error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Create new bill
// @route   POST /api/bills
// @access  Private
const createBill = async (req, res) => {
    try {
        const { tableNumber, numberOfGuests, waiterName, items } = req.body;
        
        if (!tableNumber) {
            return res.status(400).json({
                success: false,
                message: 'Please provide table number'
            });
        }
        
        let tableResult = await pool.query(
            'SELECT * FROM tables WHERE table_number = $1 AND restaurant_id = $2',
            [tableNumber, 1]
        );
        
        let table;
        if (tableResult.rows.length === 0) {
            const createTableResult = await pool.query(
                "INSERT INTO tables (restaurant_id, table_number, status) VALUES ($1, $2, 'occupied') RETURNING *",
                [1, tableNumber]
            );
            table = createTableResult.rows[0];
        } else {
            table = tableResult.rows[0];
            await pool.query(
                "UPDATE tables SET status = 'occupied' WHERE id = $1",
                [table.id]
            );
        }
        
        const billNumber = `BILL-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
        const qrCodeUrl = `${process.env.FRONTEND_URL}/table/${tableNumber}`;
        const qrCode = await generateQRCode(qrCodeUrl);
        
        const billResult = await pool.query(
            `INSERT INTO bills (table_id, bill_number, number_of_guests, waiter_name, qr_code, status)
             VALUES ($1, $2, $3, $4, $5, 'active')
             RETURNING *`,
            [table.id, billNumber, numberOfGuests || 1, waiterName, qrCode]
        );
        
        const bill = billResult.rows[0];
        
        if (items && items.length > 0) {
            for (const item of items) {
                await pool.query(
                    `INSERT INTO bill_items (bill_id, menu_item_id, item_name, quantity, unit_price, total_price)
                     VALUES ($1, $2, $3, $4, $5, $6)`,
                    [bill.id, item.menuItemId, item.name, item.quantity, item.price, item.quantity * item.price]
                );
            }
            
            const totalResult = await pool.query(
                'SELECT SUM(total_price) as total FROM bill_items WHERE bill_id = $1',
                [bill.id]
            );
            
            await pool.query(
                'UPDATE bills SET total_amount = $1 WHERE id = $2',
                [totalResult.rows[0].total, bill.id]
            );
        }
        
        const completeBill = await pool.query(
            `SELECT b.*, t.table_number,
                    (SELECT json_agg(bi.*) FROM bill_items bi WHERE bi.bill_id = b.id) as items
             FROM bills b
             LEFT JOIN tables t ON b.table_id = t.id
             WHERE b.id = $1`,
            [bill.id]
        );
        
        res.status(201).json({
            success: true,
            message: 'Bill created successfully',
            data: completeBill.rows[0]
        });
    } catch (error) {
        console.error('Create bill error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Add items to bill
// @route   POST /api/bills/:id/items
// @access  Private
const addItemsToBill = async (req, res) => {
    try {
        const { id } = req.params;
        const { items } = req.body;
        
        if (!items || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Please provide items to add'
            });
        }
        
        const billCheck = await pool.query(
            'SELECT * FROM bills WHERE id = $1 AND status = $2',
            [id, 'active']
        );
        
        if (billCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Active bill not found'
            });
        }
        
        for (const item of items) {
            await pool.query(
                `INSERT INTO bill_items (bill_id, menu_item_id, item_name, quantity, unit_price, total_price)
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [id, item.menuItemId, item.name, item.quantity, item.price, item.quantity * item.price]
            );
        }
        
        const totalResult = await pool.query(
            'SELECT SUM(total_price) as total FROM bill_items WHERE bill_id = $1',
            [id]
        );
        
        await pool.query(
            'UPDATE bills SET total_amount = $1 WHERE id = $2',
            [totalResult.rows[0].total, id]
        );
        
        const updatedBill = await pool.query(
            `SELECT b.*, 
                    (SELECT json_agg(bi.*) FROM bill_items bi WHERE bi.bill_id = b.id) as items
             FROM bills b
             WHERE b.id = $1`,
            [id]
        );
        
        res.json({
            success: true,
            message: 'Items added successfully',
            data: updatedBill.rows[0]
        });
    } catch (error) {
        console.error('Add items error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Close bill
// @route   PUT /api/bills/:id/close
// @access  Private
const closeBill = async (req, res) => {
    try {
        const { id } = req.params;
        
        const unpaidItems = await pool.query(
            'SELECT COUNT(*) as count FROM bill_items WHERE bill_id = $1 AND is_paid = false',
            [id]
        );
        
        if (parseInt(unpaidItems.rows[0].count) > 0) {
            return res.status(400).json({
                success: false,
                message: 'Cannot close bill with unpaid items'
            });
        }
        
        const result = await pool.query(
            `UPDATE bills SET status = 'closed', closed_at = CURRENT_TIMESTAMP 
             WHERE id = $1 RETURNING *`,
            [id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Bill not found'
            });
        }
        
        const bill = result.rows[0];
        await pool.query(
            "UPDATE tables SET status = 'available' WHERE id = $1",
            [bill.table_id]
        );
        
        res.json({
            success: true,
            message: 'Bill closed successfully',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Close bill error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Finish/Complete bill (marks as paid and closed)
// @route   PUT /api/bills/:id/finish
// @access  Private
const finishBill = async (req, res) => {
    const client = await pool.connect();
    
    try {
        const { id } = req.params;
        
        await client.query('BEGIN');
        
        // Check if bill exists and is active
        const billCheck = await client.query(
            'SELECT * FROM bills WHERE id = $1',
            [id]
        );
        
        if (billCheck.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({
                success: false,
                message: 'Bill not found'
            });
        }
        
        const bill = billCheck.rows[0];
        
        // Check if there are unpaid items
        const unpaidItems = await client.query(
            'SELECT COUNT(*) as count FROM bill_items WHERE bill_id = $1 AND is_paid = false',
            [id]
        );
        
        if (parseInt(unpaidItems.rows[0].count) > 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({
                success: false,
                message: 'Cannot finish bill with unpaid items. All items must be paid first.'
            });
        }
        
        // Mark all items as paid (in case any were missed)
        await client.query(
            'UPDATE bill_items SET is_paid = true WHERE bill_id = $1',
            [id]
        );
        
        // Update bill to finished/closed status
        const result = await client.query(
            `UPDATE bills 
             SET status = 'closed', 
                 paid_amount = total_amount,
                 closed_at = CURRENT_TIMESTAMP 
             WHERE id = $1 
             RETURNING *`,
            [id]
        );
        
        // Update table status to available
        await client.query(
            "UPDATE tables SET status = 'available' WHERE id = $1",
            [bill.table_id]
        );
        
        await client.query('COMMIT');
        
        res.json({
            success: true,
            message: 'Bill finished successfully',
            data: result.rows[0]
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Finish bill error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    } finally {
        client.release();
    }
};

// @desc    Delete bill (only if no payments made)
// @route   DELETE /api/bills/:id
// @access  Private
// Add this to backend/src/controllers/billController.js
// Replace the existing deleteBill function with this one:

// @desc    Delete bill (force delete - removes payments too)
// @route   DELETE /api/bills/:id
// @access  Private
const deleteBill = async (req, res) => {
    const client = await pool.connect();
    
    try {
        const { id } = req.params;
        
        await client.query('BEGIN');
        
        // Check if bill exists
        const billCheck = await client.query(
            'SELECT * FROM bills WHERE id = $1',
            [id]
        );
        
        if (billCheck.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({
                success: false,
                message: 'Bill not found'
            });
        }
        
        const bill = billCheck.rows[0];
        
        // Force delete: Remove all related data
        // Delete payments first (foreign key constraint)
        await client.query(
            'DELETE FROM payments WHERE bill_id = $1',
            [id]
        );
        
        // Delete bill items
        await client.query(
            'DELETE FROM bill_items WHERE bill_id = $1',
            [id]
        );
        
        // Delete the bill
        await client.query(
            'DELETE FROM bills WHERE id = $1',
            [id]
        );
        
        // Update table status to available
        await client.query(
            "UPDATE tables SET status = 'available' WHERE id = $1",
            [bill.table_id]
        );
        
        await client.query('COMMIT');
        
        res.json({
            success: true,
            message: 'Bill and all associated data deleted successfully'
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Delete bill error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    } finally {
        client.release();
    }
};

module.exports = {
    getBills,
    getBill,
    getBillByNumber,
    getBillByTableNumber,
    createBill,
    addItemsToBill,
    closeBill,
    finishBill,
    deleteBill
};