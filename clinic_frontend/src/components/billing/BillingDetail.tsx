import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    FileText,
    User,
    Stethoscope,
    Printer,
    ArrowLeft,
    Clock,
    CreditCard,
    DollarSign,
    CheckCircle,
    XCircle,
    Calendar,
} from 'lucide-react';
import { PageLoader } from '@/components/common/Loader';
import { billingService, Bill } from '@/services/billingService';
import { formatDate, formatCurrency, capitalizeFirst } from '@/utils/helpers';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { PAYMENT_METHODS, BILL_STATUS } from '@/utils/constants';

export const BillingDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [bill, setBill] = useState<Bill | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchBill = async () => {
            if (!id) return;
            try {
                const data = await billingService.getById(parseInt(id));
                setBill(data);
            } catch (error) {
                console.error('Failed to fetch bill:', error);
                toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: 'Failed to load invoice details',
                });
                navigate('/billing');
            } finally {
                setIsLoading(false);
            }
        };

        fetchBill();
    }, [id, navigate]);

    const getStatusBadgeClass = (status: string) => {
        const classes: Record<string, string> = {
            PENDING: 'bg-warning/15 text-warning border-warning/20',
            PAID: 'bg-success/15 text-success border-success/20',
            CANCELLED: 'bg-destructive/10 text-destructive border-destructive/20',
        };
        return classes[status] || 'bg-muted text-muted-foreground';
    };

    if (isLoading) return <PageLoader />;
    if (!bill) return null;

    return (
        <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 no-print">
                <button
                    onClick={() => navigate('/billing')}
                    className="p-2 rounded-xl hover:bg-muted transition-colors"
                >
                    <ArrowLeft className="h-6 w-6 text-muted-foreground" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Invoice Details</h1>
                    <p className="text-muted-foreground">View payment and billing information</p>
                </div>
            </div>

            <div className="glass-card rounded-2xl overflow-hidden print-content">
                {/* Banner/Top Info */}
                <div className="bg-primary/5 p-6 border-b border-border">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                                <DollarSign className="h-8 w-8 text-primary" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Invoice Number</p>
                                <h2 className="text-xl font-bold text-foreground">{bill.invoice_number}</h2>
                                <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                                    <Clock className="h-4 w-4" />
                                    Created: {formatDate(bill.created_at)}
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className={cn('px-4 py-2 rounded-lg border text-sm font-semibold', getStatusBadgeClass(bill.payment_status))}>
                                {capitalizeFirst(bill.payment_status)}
                            </div>
                            <button
                                onClick={() => window.open(`/billing/invoice/${bill.id}`, '_blank')}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border hover:bg-background transition-colors text-foreground font-medium no-print"
                            >
                                <Printer className="h-4 w-4" />
                                Print
                            </button>
                        </div>
                    </div>
                </div>

                <div className="p-8 space-y-8">
                    {/* Patient & Doctor Info */}
                    <div className="grid md:grid-cols-2 gap-8">
                        <div className="p-4 rounded-xl bg-muted/30 space-y-3">
                            <div className="flex items-center gap-2 text-primary font-semibold">
                                <User className="h-5 w-5" />
                                <h3>Billed To</h3>
                            </div>
                            <div>
                                <p className="text-lg font-medium text-foreground">
                                    {bill.patient_name || `Patient #${bill.patient}`}
                                </p>
                                <p className="text-sm text-muted-foreground">Patient ID: {bill.patient}</p>
                                {bill.patient_uhid && <p className="text-sm text-primary font-mono mt-1">UHID: {bill.patient_uhid}</p>}
                            </div>
                        </div>

                        <div className="p-4 rounded-xl bg-muted/30 space-y-3">
                            <div className="flex items-center gap-2 text-primary font-semibold">
                                <Stethoscope className="h-5 w-5" />
                                <h3>Consulting Doctor</h3>
                            </div>
                            <div>
                                <p className="text-lg font-medium text-foreground">
                                    {bill.doctor_name || 'N/A'}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-border" />

                    {/* Payment Details */}
                    <div>
                        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                            <CreditCard className="h-5 w-5 text-primary" />
                            Payment Summary
                        </h3>
                        <div className="bg-background border border-border rounded-xl overflow-hidden">
                            <div className="p-4 border-b border-border bg-muted/10">
                                <div className="flex justify-between py-2 border-b border-border border-dashed">
                                    <span className="text-muted-foreground">Doctor Fee</span>
                                    <span className="font-medium">{formatCurrency(bill.doctor_fee)}</span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-border border-dashed">
                                    <span className="text-muted-foreground">Hospital Charge</span>
                                    <span className="font-medium">{formatCurrency(bill.hospital_charge)}</span>
                                </div>
                                {Number(bill.bed_charge) > 0 && (
                                    <div className="flex flex-col py-2 border-b border-border border-dashed">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Bed Charges</span>
                                            <span className="font-medium">{formatCurrency(bill.bed_charge)}</span>
                                        </div>
                                        <div className="text-xs text-muted-foreground mt-0.5 ml-2">
                                            {bill.bed_days || 0} days @ {formatCurrency(bill.bed_charge_per_day || 0)}/day
                                        </div>
                                    </div>
                                )}
                                <div className="flex justify-between py-2 text-sm">
                                    <span className="text-muted-foreground">Discount ({bill.discount_percentage}%)</span>
                                    <span className="font-medium text-success">-{formatCurrency(bill.discount_amount)}</span>
                                </div>
                            </div>
                            <div className="p-4 flex items-center justify-between border-b border-border">
                                <span className="text-muted-foreground">Total Amount</span>
                                <span className="text-xl font-bold text-foreground">{formatCurrency(bill.final_amount ?? bill.total_amount)}</span>
                            </div>
                            <div className="p-4 flex items-center justify-between border-b border-border bg-muted/20">
                                <span className="text-muted-foreground">Paid Amount</span>
                                <span className="text-lg font-semibold text-success">{formatCurrency(bill.paid_amount)}</span>
                            </div>
                            <div className="p-4 flex items-center justify-between bg-primary/5">
                                <span className="text-foreground font-medium">Balance Due</span>
                                <span className="text-xl font-bold text-destructive">{formatCurrency((bill.final_amount ?? bill.total_amount) - bill.paid_amount)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Additional Info */}
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <p className="text-sm font-medium text-muted-foreground">Payment Method</p>
                            <div className="p-3 rounded-lg border border-border bg-background text-foreground">
                                {PAYMENT_METHODS.find(m => m.value === bill.payment_method)?.label || bill.payment_method}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <p className="text-sm font-medium text-muted-foreground">Appointment Date</p>
                            <div className="p-3 rounded-lg border border-border bg-background text-foreground flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                {formatDate(bill.appointment_date)}
                            </div>
                        </div>
                    </div>

                    {bill.notes && (
                        <div className="space-y-2">
                            <p className="text-sm font-medium text-muted-foreground">Notes</p>
                            <div className="p-4 rounded-xl bg-muted/30 text-foreground text-sm leading-relaxed">
                                {bill.notes}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer for print */}
                <div className="hidden print:block p-8 pt-0 text-center text-sm text-muted-foreground mt-auto">
                    <p>Thank you for choosing our clinic.</p>
                    <p className="text-xs mt-1">This is a computer generated invoice and does not require a physical signature.</p>
                </div>
            </div>
        </div>
    );
};
