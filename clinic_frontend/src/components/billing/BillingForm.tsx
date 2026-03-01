import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { PageLoader, ButtonLoader } from '@/components/common/Loader';
import { billingService } from '@/services/billingService';
import { appointmentService, Appointment as ApiAppointment } from '@/services/appointmentService';
import { toast } from '@/hooks/use-toast';
import { formatDate, formatCurrency } from '@/utils/helpers';

interface Appointment {
  id: number;
  patient_name?: string;
  doctor_name?: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
}

export const BillingForm = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [formData, setFormData] = useState({
    total_amount: '',
    notes: '',
  });
  const [feeDetails, setFeeDetails] = useState<any>(null);

  useEffect(() => {
    fetchAppointments();
  }, []);

  useEffect(() => {
    filterAppointments();
  }, [appointments, searchTerm]);

  const fetchAppointments = async () => {
    try {
      const data = await appointmentService.getAll();
      // Filter completed appointments that don't have billing
      const completed = (Array.isArray(data) ? data : []).filter(
        (a: any) => (a.status === 'VISITED' || a.status === 'APPROVED') && !a.has_billing
      ) as ApiAppointment[];
      setAppointments(completed as any);
    } catch (error) {
      console.error('Failed to fetch appointments:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load appointments',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterAppointments = () => {
    let filtered = [...appointments];

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.patient_name?.toLowerCase().includes(search) ||
          a.doctor_name?.toLowerCase().includes(search)
      );
    }

    setFilteredAppointments(filtered);
  };

  const handleSelectAppointment = async (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setFeeDetails(null);
    try {
      const data = await billingService.calculateFees(appointment.id);
      setFeeDetails(data);
      // Optional: set total_amount just for any checks, but backend handles it
      setFormData(prev => ({ ...prev, total_amount: data.final_amount.toString() }));
    } catch (e) {
      console.error(e);
      toast({ title: "Error calculating fees", variant: "destructive" });
    }
  };

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!selectedAppointment) {
      newErrors.appointment = 'Please select an appointment';
    }
    if (!selectedAppointment) {
      newErrors.appointment = 'Please select an appointment';
    }
    // Removed manual total_amount validation as it is auto-calculated

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    if (!selectedAppointment) return; // Should be caught by validateForm

    setIsSubmitting(true);
    try {
      await billingService.create({
        appointment_id: selectedAppointment.id,
        // Backend handles fees calculation, we don't send total_amount manually
        total_amount: 0, // Placeholder
        notes: formData.notes,
      });

      toast({
        title: 'Success',
        description: 'Billing record created successfully',
      });

      navigate('/billing');
    } catch (error) {
      console.error('Billing creation error:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to create billing record',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/billing')}
          className="p-2 rounded-lg hover:bg-muted transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Create Billing</h1>
          <p className="text-muted-foreground">Create invoice from completed appointment</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Appointments List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="glass-card rounded-2xl p-6">
            <h2 className="text-lg font-semibold mb-4 text-foreground">Select Appointment</h2>

            {/* Search */}
            <div className="mb-4">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by patient or doctor name..."
                className="input-field w-full"
              />
            </div>

            {/* Appointments */}
            <div className={`space-y-3 max-h-96 overflow-y-auto rounded-xl border ${errors.appointment ? 'border-destructive' : 'border-transparent'}`}>
              {filteredAppointments.length > 0 ? (
                filteredAppointments.map((appointment) => (
                  <button
                    key={appointment.id}
                    type="button"
                    onClick={() => handleSelectAppointment(appointment)}
                    className={`w-full p-4 rounded-xl border-2 transition-all text-left ${selectedAppointment?.id === appointment.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                      }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-foreground">
                          {appointment.patient_name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Dr. {appointment.doctor_name}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDate(appointment.appointment_date)} at{' '}
                          {appointment.appointment_time}
                        </p>
                      </div>
                      <div
                        className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${selectedAppointment?.id === appointment.id
                          ? 'border-primary bg-primary'
                          : 'border-border'
                          }`}
                      >
                        {selectedAppointment?.id === appointment.id && (
                          <div className="h-2 w-2 bg-white rounded-full" />
                        )}
                      </div>
                    </div>
                  </button>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  {appointments.length === 0 ? 'No completed appointments found' : 'No matching appointments'}
                </div>
              )}
            </div>
            {errors.appointment && (
              <p className="text-sm text-destructive mt-1">{errors.appointment}</p>
            )}
          </div>
        </div>

        {/* Form */}
        <div className="lg:col-span-1">
          <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-6 space-y-6 sticky top-6">
            <h2 className="text-lg font-semibold text-foreground">Billing Details</h2>

            {selectedAppointment ? (
              <div className="space-y-3 pb-4 border-b border-border">
                <div>
                  <p className="text-sm text-muted-foreground">Patient</p>
                  <p className="font-medium text-foreground">
                    {selectedAppointment.patient_name}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Doctor</p>
                  <p className="font-medium text-foreground">
                    Dr. {selectedAppointment.doctor_name}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date & Time</p>
                  <p className="font-medium text-foreground">
                    {formatDate(selectedAppointment.appointment_date)} at{' '}
                    {selectedAppointment.appointment_time}
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-muted/50 rounded-lg text-center text-muted-foreground text-sm">
                Select an appointment to continue
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Fees & Charges (Auto-calculated)
              </label>

              {feeDetails ? (
                <div className="space-y-3 p-4 bg-muted/30 rounded-xl border border-border">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Doctor Fee:</span>
                    <span>{formatCurrency(feeDetails.doctor_fee)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Hospital Charge (10%):</span>
                    <span>{formatCurrency(feeDetails.hospital_charge)}</span>
                  </div>

                  {feeDetails.bed_charge > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        Bed Charge ({feeDetails.bed_days} days × {formatCurrency(feeDetails.bed_charge_per_day)}):
                      </span>
                      <span>{formatCurrency(feeDetails.bed_charge)}</span>
                    </div>
                  )}

                  <div className="border-t border-border pt-2 flex justify-between text-sm font-medium">
                    <span>Gross Amount:</span>
                    <span>{formatCurrency(feeDetails.gross_amount)}</span>
                  </div>

                  {feeDetails.discount_amount > 0 ? (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>25% Old Patient Discount Applied (Valid within 3 months):</span>
                      <span>- {formatCurrency(feeDetails.discount_amount)}</span>
                    </div>
                  ) : (
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Discount (New Case):</span>
                      <span>0%</span>
                    </div>
                  )}

                  <div className="border-t border-border pt-2 flex justify-between font-bold text-lg text-primary">
                    <span>Total Payable:</span>
                    <span>{formatCurrency(feeDetails.final_amount)}</span>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-muted/50 rounded-lg text-center text-muted-foreground text-sm">
                  Select an appointment to calculate fees
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Add any notes..."
                className="input-field w-full resize-none"
                rows={4}
                disabled={!selectedAppointment}
              />
            </div>

            <div className="flex gap-3 pt-4 border-t border-border">
              <button
                type="button"
                onClick={() => navigate('/billing')}
                className="flex-1 rounded-xl px-4 py-2 text-muted-foreground hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !selectedAppointment || !feeDetails}
                className="flex-1 btn-gradient flex items-center justify-center gap-2"
              >
                {isSubmitting ? <ButtonLoader /> : <Plus className="h-4 w-4" />}
                Create Invoice
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
