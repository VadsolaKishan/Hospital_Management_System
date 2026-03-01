import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { billingService, Bill } from '@/services/billingService';
import { formatDate, formatCurrency } from '@/utils/helpers';
import { Loader2 } from 'lucide-react';

export const InvoicePrint = () => {
    const { id } = useParams();
    const [bill, setBill] = useState<Bill | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchBill = async () => {
            if (!id) return;
            try {
                // We use getById which now includes the extra fields from serializer
                const data = await billingService.getById(parseInt(id));
                setBill(data);
                // Auto print when loaded
                setTimeout(() => {
                    window.print();
                }, 1000);
            } catch (err) {
                console.error(err);
                setError('Failed to load invoice');
            } finally {
                setLoading(false);
            }
        };
        fetchBill();
    }, [id]);

    if (loading) return (
        <div className="flex h-screen w-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );

    if (error || !bill) return (
        <div className="flex h-screen w-full items-center justify-center text-destructive">
            {error || 'Invoice not found'}
        </div>
    );

    // Calculate gross if not explicitly available (fallback)
    const grossAmount = bill.doctor_fee && bill.hospital_charge
        ? Number(bill.doctor_fee) + Number(bill.hospital_charge)
        : bill.total_amount; // Fallback

    return (
        <div className="bg-white min-h-screen text-black p-8 max-w-[210mm] mx-auto">
            {/* Header */}
            <div className="flex justify-between items-start border-b border-gray-300 pb-6 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">INVOICE</h1>
                    <p className="text-gray-600 mt-2">Hospital Management System</p>
                    <p className="text-sm text-gray-500">123 Health Street, Medicity</p>
                    <p className="text-sm text-gray-500">Phone: +1 234 567 890</p>
                </div>
                <div className="text-right">
                    <h2 className="text-xl font-semibold text-gray-800">#{bill.invoice_number}</h2>
                    <p className="text-sm text-gray-600 mt-1">Date: {formatDate(bill.created_at)}</p>
                    {bill.case_type && (
                        <div className="mt-2 inline-block px-3 py-1 rounded border border-gray-300 text-sm font-medium">
                            {bill.case_type} CASE
                        </div>
                    )}
                </div>
            </div>

            {/* Patient & Doctor */}
            <div className="flex justify-between mb-8">
                <div className="w-1/2 pr-4">
                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Patient Details</h3>
                    <p className="font-semibold text-lg">{bill.patient_name}</p>
                    <p className="text-gray-600">Patient ID: {bill.patient}</p>
                    {bill.patient_uhid && <p className="text-gray-600 font-mono text-sm">UHID: {bill.patient_uhid}</p>}
                </div>
                <div className="w-1/2 pl-4 text-right">
                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Doctor Details</h3>
                    <p className="font-semibold text-lg">{bill.doctor_name}</p>
                    <p className="text-gray-600">Appointment: {formatDate(bill.appointment_date)} at {bill.appointment_time}</p>
                </div>
            </div>

            {/* Fees Table */}
            <div className="mb-8">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b-2 border-gray-200">
                            <th className="py-3 text-sm font-bold text-gray-600 uppercase">Description</th>
                            <th className="py-3 text-right text-sm font-bold text-gray-600 uppercase">Amount</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        <tr>
                            <td className="py-4 text-gray-800">Doctor Consultation Fee</td>
                            <td className="py-4 text-right font-medium">{formatCurrency(bill.doctor_fee || 0)}</td>
                        </tr>
                        <tr>
                            <td className="py-4 text-gray-800">Hospital Charge (10%)</td>
                            <td className="py-4 text-right font-medium">{formatCurrency(bill.hospital_charge || 0)}</td>
                        </tr>
                        {Number(bill.bed_charge) > 0 && (
                            <tr>
                                <td className="py-4 text-gray-800">
                                    Bed Charges
                                    <span className="text-xs text-gray-500 block font-normal mt-1">
                                        Stay Duration: {bill.bed_days || 0} days × {formatCurrency(bill.bed_charge_per_day || 0)}/day
                                    </span>
                                </td>
                                <td className="py-4 text-right font-medium">{formatCurrency(bill.bed_charge)}</td>
                            </tr>
                        )}

                        {/* Summary Section within Table or separate */}
                    </tbody>
                    <tfoot className="border-t-2 border-gray-200">
                        <tr>
                            <td className="py-3 text-right font-medium text-gray-600">Gross Amount</td>
                            <td className="py-3 text-right font-bold text-gray-800">{formatCurrency(bill.total_amount)}</td>
                        </tr>
                        {bill.discount_amount > 0 && (
                            <tr className="text-emerald-600">
                                <td className="py-3 text-right font-medium">Discount ({bill.discount_percentage}%) {bill.case_type === 'OLD' ? '(Old Case Benefit)' : ''}</td>
                                <td className="py-3 text-right font-bold">-{formatCurrency(bill.discount_amount)}</td>
                            </tr>
                        )}
                        <tr className="text-lg">
                            <td className="py-4 text-right font-bold text-gray-900">Total Payable</td>
                            <td className="py-4 text-right font-extrabold text-primary">{formatCurrency(bill.final_amount ?? bill.total_amount)}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            {/* Payment Status */}
            <div className="border border-gray-200 rounded-lg p-4 mb-12 flex justify-between items-center bg-gray-50">
                <div>
                    <span className="text-sm font-medium text-gray-500">Payment Status:</span>
                    <span className={`ml-2 font-bold ${bill.payment_status === 'PAID' ? 'text-green-600' : 'text-amber-600'}`}>
                        {bill.payment_status}
                    </span>
                </div>
                {bill.paid_amount > 0 && (
                    <div>
                        <span className="text-sm font-medium text-gray-500">Paid Amount:</span>
                        <span className="ml-2 font-bold text-gray-900">{formatCurrency(bill.paid_amount)}</span>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="text-center pt-8 border-t border-gray-200 mt-auto">
                <div className="flex justify-between mb-8 px-12">
                    <div className="text-center">
                        <div className="h-12 w-32 border-b border-gray-300 mb-2"></div>
                        <p className="text-xs text-gray-500">Authorized Signature</p>
                    </div>
                    <div className="text-center">
                        <div className="h-12 w-32 border-b border-gray-300 mb-2"></div>
                        <p className="text-xs text-gray-500">Receiver Signature</p>
                    </div>
                </div>
                <p className="text-sm text-gray-500 mb-1">Thank you for trusting us with your health.</p>
                <p className="text-xs text-gray-400">System Generated Invoice</p>
            </div>

            <style>{`
                @media print {
                    @page { margin: 0; size: auto; }
                    body { -webkit-print-color-adjust: exact; }
                }
            `}</style>
        </div>
    );
};
