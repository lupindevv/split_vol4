const express = require('express');
const {
    getBills,
    getBill,
    getBillByNumber,
    getBillByTableNumber,
    createBill,
    addItemsToBill,
    closeBill,
    finishBill,    // New
    deleteBill     // New
} = require('../controllers/billController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.get('/number/:billNumber', getBillByNumber);
router.get('/table/:tableNumber', getBillByTableNumber);
router.get('/:id', getBill);

// Protected routes
router.get('/', protect, getBills);
router.post('/', protect, createBill);
router.post('/:id/items', protect, addItemsToBill);
router.put('/:id/close', protect, closeBill);
router.put('/:id/finish', protect, finishBill);    // New
router.delete('/:id', protect, deleteBill);         // New

module.exports = router;