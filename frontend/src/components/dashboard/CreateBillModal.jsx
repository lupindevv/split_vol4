import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { billAPI, menuAPI } from '../../services/api';

const CreateBillModal = ({ onClose, onSuccess }) => {
    const [tableNumber, setTableNumber] = useState('');
    const [numberOfGuests, setNumberOfGuests] = useState('');
    const [waiterName, setWaiterName] = useState('');
    const [menuItems, setMenuItems] = useState([]);
    const [selectedItems, setSelectedItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        loadMenuItems();
    }, []);

    const loadMenuItems = async () => {
        try {
            const response = await menuAPI.getAll({ available: true });
            setMenuItems(response.data.data);
        } catch (error) {
            console.error('Load menu error:', error);
        }
    };

    const addItem = (menuItem) => {
        const existingItem = selectedItems.find(item => item.menuItemId === menuItem.id);
        if (existingItem) {
            setSelectedItems(selectedItems.map(item =>
                item.menuItemId === menuItem.id
                    ? { ...item, quantity: item.quantity + 1 }
                    : item
            ));
        } else {
            setSelectedItems([...selectedItems, {
                menuItemId: menuItem.id,
                name: menuItem.name,
                price: parseFloat(menuItem.price),
                quantity: 1
            }]);
        }
    };

    const removeItem = (menuItemId) => {
        setSelectedItems(selectedItems.filter(item => item.menuItemId !== menuItemId));
    };

    const updateQuantity = (menuItemId, quantity) => {
        if (quantity <= 0) {
            removeItem(menuItemId);
        } else {
            setSelectedItems(selectedItems.map(item =>
                item.menuItemId === menuItemId
                    ? { ...item, quantity: parseInt(quantity) }
                    : item
            ));
        }
    };

    const calculateTotal = () => {
        return selectedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!tableNumber || !numberOfGuests) {
            setError('Please fill in all required fields');
            return;
        }

        if (selectedItems.length === 0) {
            setError('Please add at least one item');
            return;
        }

        setLoading(true);

        try {
            await billAPI.create({
                tableNumber: tableNumber,
                numberOfGuests: parseInt(numberOfGuests),
                waiterName,
                items: selectedItems
            });

            onSuccess();
        } catch (error) {
            setError(error.response?.data?.message || 'Failed to create bill');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-slate-800 border-b border-slate-700 p-6 flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-white">Create New Bill</h2>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-white transition"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded mb-4">
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div>
                            <label className="block text-slate-300 mb-2">
                                Table Number *
                            </label>
                            <input
                                type="text"
                                value={tableNumber}
                                onChange={(e) => setTableNumber(e.target.value)}
                                className="w-full px-4 py-2 bg-slate-700 text-white rounded border border-slate-600 focus:border-blue-500 focus:outline-none"
                                placeholder="Enter table number (1-5)"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-slate-300 mb-2">
                                Number of Guests *
                            </label>
                            <input
                                type="number"
                                value={numberOfGuests}
                                onChange={(e) => setNumberOfGuests(e.target.value)}
                                className="w-full px-4 py-2 bg-slate-700 text-white rounded border border-slate-600 focus:border-blue-500 focus:outline-none"
                                min="1"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-slate-300 mb-2">
                                Waiter Name
                            </label>
                            <input
                                type="text"
                                value={waiterName}
                                onChange={(e) => setWaiterName(e.target.value)}
                                className="w-full px-4 py-2 bg-slate-700 text-white rounded border border-slate-600 focus:border-blue-500 focus:outline-none"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h3 className="text-lg font-bold text-white mb-4">Menu Items</h3>
                            <div className="space-y-2 max-h-96 overflow-y-auto">
                                {menuItems.map((item) => (
                                    <div
                                        key={item.id}
                                        onClick={() => addItem(item)}
                                        className="bg-slate-900 p-3 rounded cursor-pointer hover:bg-slate-700 transition"
                                    >
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <p className="text-white font-semibold">{item.name}</p>
                                                <p className="text-slate-400 text-sm">{item.category}</p>
                                            </div>
                                            <p className="text-green-500 font-semibold">
                                                €{parseFloat(item.price).toFixed(2)}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h3 className="text-lg font-bold text-white mb-4">
                                Selected Items ({selectedItems.length})
                            </h3>
                            {selectedItems.length === 0 ? (
                                <p className="text-slate-400 text-center py-8">
                                    Click items to add them
                                </p>
                            ) : (
                                <div className="space-y-2 max-h-96 overflow-y-auto">
                                    {selectedItems.map((item) => (
                                        <div key={item.menuItemId} className="bg-slate-900 p-3 rounded">
                                            <div className="flex justify-between items-start mb-2">
                                                <p className="text-white font-semibold">{item.name}</p>
                                                <button
                                                    type="button"
                                                    onClick={() => removeItem(item.menuItemId)}
                                                    className="text-red-500 hover:text-red-400"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => updateQuantity(item.menuItemId, item.quantity - 1)}
                                                        className="w-8 h-8 bg-slate-700 hover:bg-slate-600 text-white rounded"
                                                    >
                                                        -
                                                    </button>
                                                    <span className="text-white w-8 text-center">{item.quantity}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => updateQuantity(item.menuItemId, item.quantity + 1)}
                                                        className="w-8 h-8 bg-slate-700 hover:bg-slate-600 text-white rounded"
                                                    >
                                                        +
                                                    </button>
                                                </div>
                                                <p className="text-white font-semibold">
                                                    €{(item.price * item.quantity).toFixed(2)}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                    <div className="bg-blue-600 p-4 rounded">
                                        <div className="flex justify-between items-center">
                                            <span className="text-white font-bold">Total:</span>
                                            <span className="text-white font-bold text-xl">
                                                €{calculateTotal().toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex gap-3 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50"
                        >
                            {loading ? 'Creating...' : 'Create Bill'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateBillModal;