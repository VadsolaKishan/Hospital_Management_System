import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Filter,
  CreditCard,
  CheckCircle,
  Eye,
  Printer,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { PageLoader } from '@/components/common/Loader';
import { Modal } from '@/components/common/Modal';
import { billingService, Bill } from '@/services/billingService';
import { formatDate, formatCurrency, capitalizeFirst } from '@/utils/helpers';
import { ROLES, BILL_STATUS, PAYMENT_METHODS } from '@/utils/constants';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { ButtonLoader } from '@/components/common/Loader';

export const BillingList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bills, setBills] = useState<Bill[]>([]);
  const [filteredBills, setFilteredBills] = useState<Bill[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [paymentData, setPaymentData] = useState({ amount: '', method: 'CASH' });
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchBills();
  }, []);

  useEffect(() => {
    filterBills();
  }, [bills, searchTerm, statusFilter]);

  const fetchBills = async () => {
    try {
      const data = await billingService.getAll();
      setBills(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch bills:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load billing records',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterBills = () => {
    let filtered = [...bills];

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (b) =>
          b.invoice_number?.toLowerCase().includes(search) ||
          b.patient_name?.toLowerCase().includes(search)
      );
    }

    if (statusFilter !== 'ALL') {
      filtered = filtered.filter((b) => b.payment_status === statusFilter);
    }

    setFilteredBills(filtered);
  };

  const handleMarkPaid = async () => {
    if (!selectedBill || !paymentData.amount) return;
    setIsProcessing(true);
    try {
      const response = await billingService.markPaid(selectedBill.id, {
        amount: parseFloat(paymentData.amount),
        payment_method: paymentData.method,
      });

      if (response.success) {
        toast({
          title: 'Success',
          description: response.message || 'Payment recorded successfully',
          className: 'bg-green-50 border-green-200 text-green-800',
        });
        setShowPayModal(false);
        setSelectedBill(null);
        setPaymentData({ amount: '', method: 'CASH' });
        // Update the specific bill in the list instead of refetching all, for smoother UX
        setBills(prev => prev.map(b => b.id === selectedBill.id ? response.billing : b));
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Payment completed but status update failed', // Should not happen with current backend logic
        });
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.response?.data?.error || error.message || 'Failed to record payment',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    const classes: Record<string, string> = {
      PENDING: 'badge-pending',
      PAID: 'badge-paid',
      CANCELLED: 'badge-cancelled',
    };
    return classes[status] || 'bg-muted text-muted-foreground';
  };

  const canManage = user?.role === ROLES.ADMIN || user?.role === ROLES.STAFF;

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Billing</h1>
          <p className="text-muted-foreground">Manage invoices and payments</p>
        </div>
        {canManage && (
          <button
            onClick={() => navigate('/billing/create')}
            className="btn-gradient flex items-center gap-2 w-fit"
          >
            <Plus className="h-4 w-4" />
            Create Invoice
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="glass-card rounded-2xl p-4 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-warning/10">
            <CreditCard className="h-6 w-6 text-warning" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Pending</p>
            <p className="text-xl font-bold text-foreground">
              {formatCurrency(
                bills.filter((b) => b.payment_status === 'PENDING').reduce((sum, b) => sum + (Number(b.total_amount) || 0) - (Number(b.paid_amount) || 0), 0)
              )}
            </p>
          </div>
        </div>
        <div className="glass-card rounded-2xl p-4 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/10">
            <CheckCircle className="h-6 w-6 text-success" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Collected</p>
            <p className="text-xl font-bold text-foreground">
              {formatCurrency(bills.reduce((sum, b) => sum + (Number(b.paid_amount) || 0), 0))}
            </p>
          </div>
        </div>
        <div className="glass-card rounded-2xl p-4 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <CreditCard className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Invoices</p>
            <p className="text-xl font-bold text-foreground">{bills.length}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card rounded-2xl p-4 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by invoice number or patient..."
            className="input-field pl-12"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field pl-12 pr-8 appearance-none min-w-[160px]"
          >
            <option value="ALL">All Status</option>
            {Object.values(BILL_STATUS).map((status) => (
              <option key={status} value={status}>
                {capitalizeFirst(status)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Invoice #
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Patient
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Amount
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Paid
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Date
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredBills.length > 0 ? (
                filteredBills.map((bill, index) => (
                  <tr
                    key={bill.id}
                    onClick={() => navigate(`/billing/${bill.id}`)}
                    className={cn('table-row cursor-pointer hover:bg-muted/50 transition-colors', index % 2 === 0 && 'bg-muted/20')}
                  >
                    <td className="px-6 py-4 font-medium text-foreground">
                      {bill.invoice_number}
                    </td>
                    <td className="px-6 py-4 text-foreground">
                      <div className="flex flex-col">
                        <span>{bill.patient_name || `Patient #${bill.patient}`}</span>
                        {bill.patient_uhid && (
                          <span className="text-xs font-mono text-primary">{bill.patient_uhid}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-foreground">
                      {formatCurrency(bill.total_amount)}
                    </td>
                    <td className="px-6 py-4 text-success font-medium">
                      {formatCurrency(bill.paid_amount)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn('badge', getStatusBadgeClass(bill.payment_status))}>
                        {capitalizeFirst(bill.payment_status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {formatDate(bill.created_at)}
                    </td>
                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => window.open(`/billing/invoice/${bill.id}`, '_blank')}
                          className="p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                          title="Print"
                        >
                          <Printer className="h-4 w-4" />
                        </button>
                        {canManage && bill.payment_status === 'PENDING' && (
                          <button
                            onClick={() => {
                              setSelectedBill(bill);
                              setPaymentData({
                                amount: String(bill.final_amount - bill.paid_amount),
                                method: 'CASH',
                              });
                              setShowPayModal(true);
                            }}
                            className="p-2 rounded-lg text-success hover:bg-success/10 transition-colors"
                            title="Mark Paid"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                    No billing records found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Modal */}
      <Modal
        isOpen={showPayModal}
        onClose={() => {
          setShowPayModal(false);
          setSelectedBill(null);
        }}
        title="Record Payment"
        size="sm"
      >
        <div className="space-y-6">
          <div>
            <p className="text-sm text-muted-foreground mb-2">Invoice</p>
            <p className="font-medium text-foreground">{selectedBill?.invoice_number}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-2">Balance Due</p>
            <p className="text-2xl font-bold text-foreground">
              {selectedBill && formatCurrency(selectedBill.final_amount - selectedBill.paid_amount)}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Amount Received
            </label>
            <input
              type="number"
              value={paymentData.amount}
              onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Payment Method
            </label>
            <select
              value={paymentData.method}
              onChange={(e) => setPaymentData({ ...paymentData, method: e.target.value })}
              className="input-field"
            >
              {PAYMENT_METHODS.map((pm) => (
                <option key={pm.value} value={pm.value}>
                  {pm.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-4 pt-4">
            <button
              onClick={() => setShowPayModal(false)}
              className="rounded-xl px-4 py-2 text-muted-foreground hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleMarkPaid}
              disabled={isProcessing}
              className="btn-gradient flex items-center gap-2"
            >
              {isProcessing ? <ButtonLoader /> : 'Confirm Payment'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
