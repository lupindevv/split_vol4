import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { billAPI, paymentAPI } from '../services/api';
import { CheckCircle, ArrowLeft } from 'lucide-react';

const CustomerPaymentPage = ({ billNumberProp, tableNumber: tableNumberProp }) => {
    const { billNumber: billNumberParam } = useParams();
    const billNumber = billNumberProp || billNumberParam; // Use prop if provided, otherwise URL param
    const navigate = useNavigate();
    const [bill, setBill] = useState(null);
    const [selectedItems, setSelectedItems] = useState([]);
    const [customerName, setCustomerName] = useState('');
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (billNumber) {
            loadBill();
        }
    }, [billNumber]);

    const loadBill = async () => {
        try {
            setLoading(true);
            const response = await billAPI.getByNumber(billNumber);
            setBill(response.data.data);
        } catch (error) {
            setError('Bill not found or already closed');
        } finally {
            setLoading(false);
        }
    };

    const toggleItem = (itemId) => {
        if (selectedItems.includes(itemId)) {
            setSelectedItems(selectedItems.filter(id => id !== itemId));
        } else {
            setSelectedItems([...selectedItems, itemId]);
        }
    };

    const calculateTotal = () => {
        if (!bill) return 0;
        return bill.items
            .filter(item => selectedItems.includes(item.id))
            .reduce((sum, item) => sum + parseFloat(item.total_price), 0);
    };

    const handlePayment = async () => {
        if (selectedItems.length === 0) {
            setError('Please select at least one item to pay');
            return;
        }

        if (!customerName.trim()) {
            setError('Please enter your name');
            return;
        }

        setError('');
        setProcessing(true);

        try {
            await paymentAPI.process({
                billId: bill.id,
                customerName: customerName.trim(),
                itemIds: selectedItems,
                paymentMethod: 'card'
            });

            setSuccess(true);
            
            // Redirect after 3 seconds
            setTimeout(() => {
                navigate('/');
            }, 3000);
        } catch (error) {
            setError(error.response?.data?.message || 'Payment failed. Please try again.');
        } finally {
            setProcessing(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <div className="text-white text-xl">Loading bill...</div>
            </div>
        );
    }

    if (error && !bill) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
                <div className="bg-slate-800 rounded-lg p-8 max-w-md w-full text-center">
                    <div className="text-red-500 text-5xl mb-4">⚠️</div>
                    <h2 className="text-2xl font-bold text-white mb-2">Bill Not Found</h2>
                    <p className="text-slate-400">{error}</p>
                </div>
            </div>
        );
    }

    if (success) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
                <div className="bg-slate-800 rounded-lg p-8 max-w-md w-full text-center">
                    <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
                    <h2 className="text-3xl font-bold text-white mb-2">Payment Successful!</h2>
                    <p className="text-slate-400 mb-4">
                        Thank you, {customerName}!
                    </p>
                    <p className="text-green-500 font-semibold text-2xl mb-4">
                        €{calculateTotal().toFixed(2)} paid
                    </p>
                    <p className="text-slate-500 text-sm">
                        Redirecting...
                    </p>
                </div>
            </div>
        );
    }

    const unpaidItems = bill?.items?.filter(item => !item.is_paid) || [];

    return (
        <div className="min-h-screen bg-slate-900">
            {/* Header */}
            <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-10">
                <div className="max-w-2xl mx-auto px-4 py-4">
                    <h1 className="text-2xl font-bold text-white text-center">
                        SplitBill Payment
                    </h1>
                    <p className="text-slate-400 text-center text-sm mt-1">
                        Table #{bill?.table_number}
                    </p>
                </div>
            </header>

            <main className="max-w-2xl mx-auto px-4 py-6">
                {error && (
                    <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded mb-4">
                        {error}
                    </div>
                )}

                {/* Bill Info */}
                <div className="bg-slate-800 rounded-lg p-4 mb-6 border border-slate-700">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <p className="text-slate-400">Total Bill</p>
                            <p className="text-white font-semibold text-lg">
                                €{parseFloat(bill?.total_amount || 0).toFixed(2)}
                            </p>
                        </div>
                        <div>
                            <p className="text-slate-400">Remaining</p>
                            <p className="text-yellow-500 font-semibold text-lg">
                                €{(parseFloat(bill?.total_amount || 0) - parseFloat(bill?.paid_amount || 0)).toFixed(2)}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Customer Name Input */}
                <div className="mb-6">
                    <label className="block text-slate-300 mb-2 font-semibold">
                        Your Name
                    </label>
                    <input
                        type="text"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Enter your name"
                        className="w-full px-4 py-3 bg-slate-800 text-white rounded-lg border border-slate-700 focus:border-blue-500 focus:outline-none"
                    />
                </div>

                {/* Items Selection */}
                <div className="mb-6">
                    <h2 className="text-xl font-bold text-white mb-4">
                        Select Your Items ({unpaidItems.length} available)
                    </h2>
                    
                    {unpaidItems.length === 0 ? (
                        <div className="bg-slate-800 rounded-lg p-8 text-center border border-slate-700">
                            <p className="text-slate-400">All items have been paid</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {unpaidItems.map((item) => (
                                <div
                                    key={item.id}
                                    onClick={() => toggleItem(item.id)}
                                    className={`bg-slate-800 rounded-lg p-4 cursor-pointer transition border-2 ${
                                        selectedItems.includes(item.id)
                                            ? 'border-blue-500 bg-blue-500/10'
                                            : 'border-slate-700 hover:border-slate-600'
                                    }`}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-3 flex-1">
                                            <div className={`w-6 h-6 rounded border-2 flex items-center justify-center mt-1 ${
                                                selectedItems.includes(item.id)
                                                    ? 'border-blue-500 bg-blue-500'
                                                    : 'border-slate-600'
                                            }`}>
                                                {selectedItems.includes(item.id) && (
                                                    <CheckCircle className="w-4 h-4 text-white" />
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-white font-semibold">{item.item_name}</p>
                                                <p className="text-slate-400 text-sm">
                                                    {item.quantity}x €{parseFloat(item.unit_price).toFixed(2)}
                                                </p>
                                            </div>
                                        </div>
                                        <p className="text-white font-bold text-lg">
                                            €{parseFloat(item.total_price).toFixed(2)}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Total and Pay Button */}
                {unpaidItems.length > 0 && (
                    <div className="sticky bottom-0 bg-slate-900 pt-4 pb-6">
                        <div className="bg-slate-800 rounded-lg p-4 mb-4 border border-slate-700">
                            <div className="flex justify-between items-center">
                                <span className="text-slate-400">Your Total:</span>
                                <span className="text-white font-bold text-2xl">
                                    €{calculateTotal().toFixed(2)}
                                </span>
                            </div>
                            {selectedItems.length > 0 && (
                                <p className="text-slate-500 text-sm mt-2 text-right">
                                    {selectedItems.length} item{selectedItems.length > 1 ? 's' : ''} selected
                                </p>
                            )}
                        </div>
                        
                        <button
                            onClick={handlePayment}
                            disabled={processing || selectedItems.length === 0 || !customerName.trim()}
                            className="w-full py-4 bg-green-600 hover:bg-green-700 text-white font-bold text-lg rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {processing ? 'Processing...' : `Pay €${calculateTotal().toFixed(2)}`}
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
};

export default CustomerPaymentPage;