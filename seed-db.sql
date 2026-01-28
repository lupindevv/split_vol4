-- Insert sample restaurant
INSERT INTO restaurants (name, address, phone) 
VALUES ('Restaurant Deluxe', '123 Main Street, Sofia', '+359 2 123 4567');

-- Insert sample user (password is 'admin123' - we'll hash it properly later)
INSERT INTO users (restaurant_id, email, password, name, role)
VALUES (
    1, 
    'admin@restaurant.com', 
    '$2a$10$rZ5N8YlBGKGXQ1mKxKqKZeYvF0YvGHvH0KhGQGqF5JvF0YvGHvH0K',
    'John Doe',
    'admin'
);

-- Insert sample menu items
INSERT INTO menu_items (restaurant_id, name, description, category, price, available) VALUES
(1, 'Margherita Pizza', 'Classic tomato, mozzarella, basil', 'Main Course', 12.50, true),
(1, 'Pepperoni Pizza', 'Tomato, mozzarella, pepperoni', 'Main Course', 14.00, true),
(1, 'Caesar Salad', 'Romaine, parmesan, croutons, Caesar dressing', 'Appetizer', 8.00, true),
(1, 'Greek Salad', 'Tomatoes, cucumber, olives, feta cheese', 'Appetizer', 7.50, true),
(1, 'Pasta Carbonara', 'Eggs, bacon, parmesan, black pepper', 'Main Course', 14.00, true),
(1, 'Spaghetti Bolognese', 'Ground beef, tomato sauce, parmesan', 'Main Course', 13.50, true),
(1, 'Tiramisu', 'Italian coffee-flavored dessert', 'Dessert', 6.50, true),
(1, 'Chocolate Cake', 'Rich chocolate cake with ganache', 'Dessert', 6.00, true),
(1, 'Coca Cola', '0.33L bottle', 'Beverage', 3.50, true),
(1, 'Water', '0.5L bottle', 'Beverage', 2.00, true),
(1, 'Red Wine (Glass)', 'House red wine, 150ml', 'Beverage', 5.50, true),
(1, 'White Wine (Glass)', 'House white wine, 150ml', 'Beverage', 5.50, true);

-- Insert sample tables
INSERT INTO tables (restaurant_id, table_number, status) VALUES
(1, '1', 'available'),
(1, '2', 'available'),
(1, '5', 'available'),
(1, '8', 'available'),
(1, '10', 'available'),
(1, '12', 'available'),
(1, '15', 'available');