const express = require('express');
const {
    getMenuItems,
    getMenuItem,
    createMenuItem,
    updateMenuItem,
    deleteMenuItem,
    getCategories
} = require('../controllers/menuController');
const { protect, isAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/categories', getCategories);
router.get('/', getMenuItems);
router.get('/:id', getMenuItem);
router.post('/', protect, isAdmin, createMenuItem);
router.put('/:id', protect, isAdmin, updateMenuItem);
router.delete('/:id', protect, isAdmin, deleteMenuItem);

module.exports = router;