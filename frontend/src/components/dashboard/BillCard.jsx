import { QrCode, Eye, DollarSign } from 'lucide-react';
import { useState } from 'react';
import BillDetailsModal from './BillDetailsModal';
import { formatCurrency } from "../../../utils/formatCurrency";


const BillCard = ({ bill, onUpdate }) => {
    const [showDetails, setShowDetails] = useState(false);

    const paidPercentage = (parseFloat(bill.paid_amount) / parseFloat(bill.total_amount)) * 100;

    return (
        <>
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 hover:border-slate-600 transition">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h3 className="text-xl font-bold text-white">
                            Table #{bill.table_number}
                        </h3>
                        <p className="text-slate-400 text-sm">
                            {bill.bill_number}
                        </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        paidPercentage === 100
                            ? 'bg-green-500/20 text-green-500'
                            : paidPercentage > 0
                            ? 'bg-yellow-500/20 text-yellow-500'
                            : 'bg-blue-500/20 text-blue-500'
                    }`}>
                        {paidPercentage === 100 ? 'Paid' : paidPercentage > 0 ? 'Partial' : 'Unpaid'}
                    </span>
                </div>

                <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Items:</span>
                        <span className="text-white">{bill.total_items || 0}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Guests:</span>
                        <span className="text-white">{bill.number_of_guests}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Total:</span>
                        <span className="text-white font-semibold">
                            {formatCurrency(bill.total_amount)}
                        </span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Paid:</span>
                        <span className="text-green-500 font-semibold">
                            {formatCurrency(bill.paid_amount)}
                        </span>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-700 rounded-full h-2 mb-4">
                    <div
                        className="bg-green-500 h-2 rounded-full transition-all"
                        style={{ width: `${paidPercentage}%` }}
                    />
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={() => setShowDetails(true)}
                        className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition flex items-center justify-center gap-2"
                    >
                        <Eye className="w-4 h-4" />
                        Details
                    </button>
                    <button
                        className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition"
                        title="Show QR Code"
                    >
                        <QrCode className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {showDetails && (
                <BillDetailsModal
                    billId={bill.id}
                    onClose={() => setShowDetails(false)}
                    onUpdate={onUpdate}
                />
            )}
        </>
    );
};

export default BillCard;