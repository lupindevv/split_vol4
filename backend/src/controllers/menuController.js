const pool = require('../config/database');

// @desc    Get all menu items
// @route   GET /api/menu
// @access  Public
const getMenuItems = async (req, res) => {
    try {
        const { category, available } = req.query;
        let query = 'SELECT * FROM menu_items WHERE restaurant_id = $1';
        const params = [1]; // Default restaurant ID

        // Filter by category
        if (category) {
            query += ' AND category = $2';
            params.push(category);
        }

        // Filter by availability
        if (available !== undefined) {
            query += ` AND available = $${params.length + 1}`;
            params.push(available === 'true');
        }

        query += ' ORDER BY category, name';

        const result = await pool.query(query, params);

        res.json({
            success: true,
            count: result.rows.length,
            data: result.rows
        });
    } catch (error) {
        console.error('Get menu items error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get single menu item
// @route   GET /api/menu/:id
// @access  Public
const getMenuItem = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            'SELECT * FROM menu_items WHERE id = $1',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Menu item not found'
            });
        }

        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Get menu item error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Create menu item
// @route   POST /api/menu
// @access  Private/Admin
const createMenuItem = async (req, res) => {
    try {
        const { name, description, category, price, available, imageUrl } = req.body;

        // Validate input
        if (!name || !category || !price) {
            return res.status(400).json({
                success: false,
                message: 'Please provide name, category, and price'
            });
        }

        const result = await pool.query(
            'INSERT INTO menu_items (restaurant_id, name, description, category, price, available, image_url) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
            [1, name, description, category, price, available !== false, imageUrl]
        );

        res.status(201).json({
            success: true,
            message: 'Menu item created successfully',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Create menu item error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Update menu item
// @route   PUT /api/menu/:id
// @access  Private/Admin
const updateMenuItem = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, category, price, available, imageUrl } = req.body;

        const result = await pool.query(
            'UPDATE menu_items SET name = COALESCE($1, name), description = COALESCE($2, description), category = COALESCE($3, category), price = COALESCE($4, price), available = COALESCE($5, available), image_url = COALESCE($6, image_url), updated_at = CURRENT_TIMESTAMP WHERE id = $7 RETURNING *',
            [name, description, category, price, available, imageUrl, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Menu item not found'
            });
        }

        res.json({
            success: true,
            message: 'Menu item updated successfully',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Update menu item error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Delete menu item
// @route   DELETE /api/menu/:id
// @access  Private/Admin
const deleteMenuItem = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            'DELETE FROM menu_items WHERE id = $1 RETURNING *',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Menu item not found'
            });
        }

        res.json({
            success: true,
            message: 'Menu item deleted successfully'
        });
    } catch (error) {
        console.error('Delete menu item error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get menu categories
// @route   GET /api/menu/categories
// @access  Public
const getCategories = async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT DISTINCT category FROM menu_items WHERE restaurant_id = $1 ORDER BY category',
            [1]
        );

        const categories = result.rows.map(row => row.category);

        res.json({
            success: true,
            data: categories
        });
    } catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

module.exports = {
    getMenuItems,
    getMenuItem,
    createMenuItem,
    updateMenuItem,
    deleteMenuItem,
    getCategories
};