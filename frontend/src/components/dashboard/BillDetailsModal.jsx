import { useState, useEffect } from 'react';
import { X, CheckCircle, Trash2 } from 'lucide-react';
import { billAPI } from '../../services/api';

const BillDetailsModal = ({ billId, onClose, onUpdate }) => {
    const [bill, setBill] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showFinishConfirm, setShowFinishConfirm] = useState(false);

    useEffect(() => {
        loadBillDetails();
    }, [billId]);

    const loadBillDetails = async () => {
        try {
            const response = await billAPI.getById(billId);
            setBill(response.data.data);
        } catch (error) {
            console.error('Load bill error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFinishBill = async () => {
        setActionLoading(true);
        try {
            await billAPI.finish(billId);
            onUpdate();
            onClose();
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to finish bill');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteBill = async () => {
        setActionLoading(true);
        try {
            await billAPI.delete(billId);
            onUpdate();
            onClose();
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to delete bill');
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-slate-800 rounded-lg p-6">
                    <p className="text-white">Loading...</p>
                </div>
            </div>
        );
    }

    if (!bill) return null;

    const hasPayments = bill.payments && bill.payments.length > 0;
    const allItemsPaid = bill.items?.every(item => item.is_paid) || false;
    const paidAmount = parseFloat(bill.paid_amount);
    const totalAmount = parseFloat(bill.total_amount);
    const fullyPaid = paidAmount >= totalAmount;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-slate-800 border-b border-slate-700 p-6 flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold text-white">
                            Table #{bill.table_number}
                        </h2>
                        <p className="text-slate-400 text-sm">{bill.bill_number}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-white transition"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6">
                    {/* Bill Info */}
                    <div className="bg-slate-900 rounded-lg p-4 mb-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-slate-400 text-sm">Guests</p>
                                <p className="text-white font-semibold">{bill.number_of_guests}</p>
                            </div>
                            <div>
                                <p className="text-slate-400 text-sm">Waiter</p>
                                <p className="text-white font-semibold">{bill.waiter_name}</p>
                            </div>
                            <div>
                                <p className="text-slate-400 text-sm">Total Amount</p>
                                <p className="text-white font-semibold">€{totalAmount.toFixed(2)}</p>
                            </div>
                            <div>
                                <p className="text-slate-400 text-sm">Paid Amount</p>
                                <p className="text-green-500 font-semibold">€{paidAmount.toFixed(2)}</p>
                            </div>
                        </div>
                    </div>

                    {/* Items */}
                    <h3 className="text-lg font-bold text-white mb-4">Items</h3>
                    <div className="space-y-2 mb-6">
                        {bill.items?.map((item) => (
                            <div
                                key={item.id}
                                className={`bg-slate-900 rounded-lg p-4 ${
                                    item.is_paid ? 'opacity-50' : ''
                                }`}
                            >
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <p className="text-white font-semibold">{item.item_name}</p>
                                        <p className="text-slate-400 text-sm">
                                            {item.quantity}x €{parseFloat(item.unit_price).toFixed(2)}
                                        </p>
                                        {item.is_paid && item.paid_by && (
                                            <p className="text-green-500 text-sm mt-1">
                                                Paid by {item.paid_by}
                                            </p>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        <p className="text-white font-semibold">
                                            €{parseFloat(item.total_price).toFixed(2)}
                                        </p>
                                        {item.is_paid && (
                                            <span className="text-green-500 text-xs">✓ Paid</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Payments */}
                    {hasPayments && (
                        <>
                            <h3 className="text-lg font-bold text-white mb-4">Payment History</h3>
                            <div className="space-y-2 mb-6">
                                {bill.payments.map((payment) => (
                                    <div key={payment.id} className="bg-slate-900 rounded-lg p-4">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <p className="text-white font-semibold">
                                                    {payment.customer_name || 'Anonymous'}
                                                </p>
                                                <p className="text-slate-400 text-sm">
                                                    {payment.payment_method} • {payment.transaction_id}
                                                </p>
                                            </div>
                                            <p className="text-green-500 font-semibold">
                                                €{parseFloat(payment.amount).toFixed(2)}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3 mt-6">
                        {/* Delete Button - Only show if no payments */}
                        {!hasPayments && (
                            <button
                                onClick={() => setShowDeleteConfirm(true)}
                                disabled={actionLoading}
                                className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                <Trash2 className="w-4 h-4" />
                                Delete Bill
                            </button>
                        )}

                        {/* Finish Button - Only show if all items paid */}
                        {allItemsPaid && fullyPaid && bill.status !== 'closed' && (
                            <button
                                onClick={() => setShowFinishConfirm(true)}
                                disabled={actionLoading}
                                className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                <CheckCircle className="w-4 h-4" />
                                Finish Bill
                            </button>
                        )}

                        {/* Status messages */}
                        {!allItemsPaid && (
                            <div className="flex-1 px-6 py-3 bg-yellow-600/20 text-yellow-500 rounded-lg text-center">
                                Some items are still unpaid
                            </div>
                        )}

                        {bill.status === 'closed' && (
                            <div className="flex-1 px-6 py-3 bg-slate-700 text-slate-400 rounded-lg text-center">
                                Bill is closed
                            </div>
                        )}
                    </div>

                    {/* QR Code */}
                    {bill.qr_code && (
                        <div className="mt-6 text-center">
                            <h3 className="text-lg font-bold text-white mb-4">Payment QR Code</h3>
                            <img
                                src={bill.qr_code}
                                alt="Bill QR Code"
                                className="mx-auto w-48 h-48 bg-white p-2 rounded-lg"
                            />
                            <p className="text-slate-400 text-sm mt-2">
                                Customers can scan this to pay
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60]">
                    <div className="bg-slate-800 rounded-lg p-6 max-w-md w-full mx-4">
                        <h3 className="text-xl font-bold text-white mb-4">Delete Bill?</h3>
                        <p className="text-slate-400 mb-6">
                            Are you sure you want to delete this bill? This action cannot be undone.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteBill}
                                disabled={actionLoading}
                                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition disabled:opacity-50"
                            >
                                {actionLoading ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Finish Confirmation Modal */}
            {showFinishConfirm && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60]">
                    <div className="bg-slate-800 rounded-lg p-6 max-w-md w-full mx-4">
                        <h3 className="text-xl font-bold text-white mb-4">Finish Bill?</h3>
                        <p className="text-slate-400 mb-6">
                            This will close the bill and mark the table as available. All items are paid.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowFinishConfirm(false)}
                                className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleFinishBill}
                                disabled={actionLoading}
                                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition disabled:opacity-50"
                            >
                                {actionLoading ? 'Finishing...' : 'Finish'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BillDetailsModal;