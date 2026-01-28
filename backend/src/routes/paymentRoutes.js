const express = require('express');
const {
    processPayment,
    getPayments
} = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/', processPayment); // Public for customer payments
router.get('/', protect, getPayments);

module.exports = router;