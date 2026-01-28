const pool = require('../config/database');

// @desc    Process payment for selected items
// @route   POST /api/payments
// @access  Public
const processPayment = async (req, res) => {
    const client = await pool.connect();
    
    try {
        const { billId, customerName, itemIds, paymentMethod } = req.body;
        
        // Validate input
        if (!billId || !itemIds || itemIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Please provide bill ID and items to pay'
            });
        }
        
        await client.query('BEGIN');
        
        // Get items to pay
        const itemsResult = await client.query(
            'SELECT * FROM bill_items WHERE id = ANY($1) AND bill_id = $2 AND is_paid = false',
            [itemIds, billId]
        );
        
        if (itemsResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({
                success: false,
                message: 'No valid unpaid items found'
            });
        }
        
        // Calculate total amount
        const totalAmount = itemsResult.rows.reduce((sum, item) => sum + parseFloat(item.total_price), 0);
        
        // Create payment record
        const paymentResult = await client.query(
            `INSERT INTO payments (bill_id, customer_name, amount, payment_method, payment_status, transaction_id)
             VALUES ($1, $2, $3, $4, 'completed', $5)
             RETURNING *`,
            [billId, customerName, totalAmount, paymentMethod || 'card', `TXN-${Date.now()}`]
        );
        
        const payment = paymentResult.rows[0];
        
        // Mark items as paid
        await client.query(
            'UPDATE bill_items SET is_paid = true, paid_by = $1 WHERE id = ANY($2)',
            [customerName, itemIds]
        );
        
        // Update bill paid amount
        await client.query(
            `UPDATE bills SET paid_amount = paid_amount + $1 WHERE id = $2`,
            [totalAmount, billId]
        );
        
        // Check if bill is fully paid
        const billCheck = await client.query(
            'SELECT total_amount, paid_amount FROM bills WHERE id = $1',
            [billId]
        );
        
        const bill = billCheck.rows[0];
        if (parseFloat(bill.paid_amount) >= parseFloat(bill.total_amount)) {
            await client.query(
                "UPDATE bills SET status = 'paid' WHERE id = $1",
                [billId]
            );
        }
        
        await client.query('COMMIT');
        
        res.json({
            success: true,
            message: 'Payment processed successfully',
            data: {
                payment,
                itemsPaid: itemsResult.rows.length,
                totalAmount
            }
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Process payment error:', error);
        res.status(500).json({
            success: false,
            message: 'Payment processing failed',
            error: error.message
        });
    } finally {
        client.release();
    }
};

// @desc    Get payment history
// @route   GET /api/payments
// @access  Private
const getPayments = async (req, res) => {
    try {
        const { billId } = req.query;
        
        let query = 'SELECT * FROM payments WHERE 1=1';
        const params = [];
        
        if (billId) {
            query += ' AND bill_id = $1';
            params.push(billId);
        }
        
        query += ' ORDER BY created_at DESC';
        
        const result = await pool.query(query, params);
        
        res.json({
            success: true,
            count: result.rows.length,
            data: result.rows
        });
    } catch (error) {
        console.error('Get payments error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

module.exports = {
    processPayment,
    getPayments
};