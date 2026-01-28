import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { billAPI } from '../services/api';
import { LogOut, Plus, RefreshCw, Trash2 } from 'lucide-react';
import CreateBillModal from '../components/dashboard/CreateBillModal';
import BillCard from '../components/dashboard/BillCard';

const DashboardPage = () => {
    const { user, logout } = useAuth();
    const [bills, setBills] = useState([]);
    const [stats, setStats] = useState({
        activeTables: 0,
        pendingPayments: 0
    });
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [billToDelete, setBillToDelete] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            setLoading(true);
            const response = await billAPI.getAll({ status: 'active' });
            const billsData = response.data.data;
            setBills(billsData);

            const activeTables = billsData.length;
            const pendingPayments = billsData.reduce(
                (sum, bill) => sum + (parseFloat(bill.total_amount) - parseFloat(bill.paid_amount)),
                0
            );

            setStats({ activeTables, pendingPayments });
        } catch (error) {
            console.error('Load dashboard error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleBillCreated = () => {
        setShowCreateModal(false);
        loadDashboardData();
    };

    const handleDeleteClick = (bill) => {
        setBillToDelete(bill);
        setShowDeleteConfirm(true);
    };

    const handleDeleteConfirm = async () => {
        if (!billToDelete) return;

        setDeleteLoading(true);
        try {
            // Force delete by calling the backend delete endpoint
            await billAPI.delete(billToDelete.id);
            
            // Refresh the dashboard
            await loadDashboardData();
            
            // Close modal and reset
            setShowDeleteConfirm(false);
            setBillToDelete(null);
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to delete bill');
        } finally {
            setDeleteLoading(false);
        }
    };

    const handleDeleteCancel = () => {
        setShowDeleteConfirm(false);
        setBillToDelete(null);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <div className="text-white text-xl">Loading...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-900">
            <header className="bg-slate-800 border-b border-slate-700">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-2xl font-bold text-white">Restaurant Dashboard</h1>
                            <p className="text-slate-400 text-sm mt-1">Welcome, {user?.name}</p>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={loadDashboardData} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg flex items-center gap-2">
                                <RefreshCw className="w-4 h-4" />
                                Refresh
                            </button>
                            <button onClick={logout} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center gap-2">
                                <LogOut className="w-4 h-4" />
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 py-8">
                <div className="grid grid-cols-4 gap-6 mb-8">
                    <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
                        <h3 className="text-slate-400 text-sm mb-2">Active Tables</h3>
                        <p className="text-3xl font-bold text-blue-500">{stats.activeTables}</p>
                    </div>
                    <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
                        <h3 className="text-slate-400 text-sm mb-2">Pending Payments</h3>
                        <p className="text-3xl font-bold text-yellow-500">€{stats.pendingPayments.toFixed(2)}</p>
                    </div>
                    <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
                        <button onClick={() => setShowCreateModal(true)} className="w-full h-full flex items-center justify-center gap-2 text-green-500 hover:text-green-400 transition">
                            <Plus className="w-6 h-6" />
                            <span className="text-lg font-semibold">Create Bill</span>
                        </button>
                    </div>
                    <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
                        <button 
                            onClick={() => bills.length > 0 && handleDeleteClick(bills[0])} 
                            disabled={bills.length === 0}
                            className="w-full h-full flex items-center justify-center gap-2 text-red-500 hover:text-red-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Trash2 className="w-6 h-6" />
                            <span className="text-lg font-semibold">Delete Bill</span>
                        </button>
                    </div>
                </div>

                <div className="mb-8">
                    <h2 className="text-xl font-bold text-white mb-4">Restaurant Tables</h2>
                    <div className="grid grid-cols-5 gap-4">
                        {[1, 2, 3, 4, 5].map((num) => {
                            const bill = bills.find(b => b.table_number === String(num));
                            return (
                                <div key={num} className={`rounded-lg p-6 border-2 text-center ${bill ? 'bg-blue-500/10 border-blue-500' : 'bg-slate-800 border-slate-700'}`}>
                                    <div className="text-4xl mb-2">🪑</div>
                                    <h3 className="text-2xl font-bold text-white mb-2">Table {num}</h3>
                                    {bill ? (
                                        <div>
                                            <p className="text-blue-400 text-sm font-semibold mb-2">OCCUPIED</p>
                                            <p className="text-slate-400 text-xs mb-3">€{parseFloat(bill.total_amount).toFixed(2)}</p>
                                            <button
                                                onClick={() => handleDeleteClick(bill)}
                                                className="inline-block px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <p className="text-green-400 text-sm font-semibold mb-2">AVAILABLE</p>
                                            <a href={`http://localhost:5173/table/${num}`} target="_blank" rel="noopener noreferrer" className="inline-block px-3 py-1 bg-slate-700 text-white text-xs rounded">
                                                QR Link
                                            </a>
                                        </>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div>
                    <h2 className="text-xl font-bold text-white mb-4">Active Bills ({bills.length})</h2>
                    {bills.length === 0 ? (
                        <div className="bg-slate-800 rounded-lg p-12 text-center border border-slate-700">
                            <p className="text-slate-400 text-lg">No active bills</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-3 gap-6">
                            {bills.map((bill) => (
                                <BillCard key={bill.id} bill={bill} onUpdate={loadDashboardData} />
                            ))}
                        </div>
                    )}
                </div>
            </main>

            {showCreateModal && (
                <CreateBillModal onClose={() => setShowCreateModal(false)} onSuccess={handleBillCreated} />
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && billToDelete && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-800 rounded-lg p-6 max-w-md w-full">
                        <h3 className="text-xl font-bold text-white mb-4">Delete Bill?</h3>
                        <div className="bg-slate-900 rounded-lg p-4 mb-4">
                            <p className="text-slate-400 text-sm mb-1">Table</p>
                            <p className="text-white font-semibold mb-3">#{billToDelete.table_number}</p>
                            <p className="text-slate-400 text-sm mb-1">Bill Number</p>
                            <p className="text-white font-semibold mb-3">{billToDelete.bill_number}</p>
                            <p className="text-slate-400 text-sm mb-1">Total Amount</p>
                            <p className="text-white font-semibold">€{parseFloat(billToDelete.total_amount).toFixed(2)}</p>
                        </div>
                        <p className="text-red-400 mb-6">
                            ⚠️ Warning: This will permanently delete this bill and all associated data. This action cannot be undone.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={handleDeleteCancel}
                                disabled={deleteLoading}
                                className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteConfirm}
                                disabled={deleteLoading}
                                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition disabled:opacity-50"
                            >
                                {deleteLoading ? 'Deleting...' : 'Delete Bill'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DashboardPage;