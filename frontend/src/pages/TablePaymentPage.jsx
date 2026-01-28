import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import CustomerPaymentPage from './CustomerPaymentPage';

const TablePaymentPage = () => {
    const { tableNumber } = useParams();
    const [billNumber, setBillNumber] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        loadTableBill();
    }, [tableNumber]);

    const loadTableBill = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/api/bills/table/${tableNumber}`);
            setBillNumber(response.data.data.bill_number);
        } catch (error) {
            setError(error.response?.data?.message || 'No active bill for this table');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <div className="text-white text-xl">Loading table information...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
                <div className="bg-slate-800 rounded-lg p-8 max-w-md w-full text-center">
                    <div className="text-yellow-500 text-5xl mb-4">🍽️</div>
                    <h2 className="text-2xl font-bold text-white mb-2">Table #{tableNumber}</h2>
                    <p className="text-slate-400 mb-4">{error}</p>
                    <p className="text-slate-500 text-sm">
                        Please ask staff to create a bill for your table.
                    </p>
                </div>
            </div>
        );
    }

    // Reuse the existing CustomerPaymentPage with the found bill number
    return <CustomerPaymentPage billNumberProp={billNumber} tableNumber={tableNumber} />;
};

export default TablePaymentPage;