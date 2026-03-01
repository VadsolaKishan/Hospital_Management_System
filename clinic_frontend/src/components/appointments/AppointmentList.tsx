import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Filter,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  FileText,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { PageLoader } from '@/components/common/Loader';
import { Modal, ConfirmModal } from '@/components/common/Modal';
import { appointmentService, Appointment } from '@/services/appointmentService';
import { PrescriptionForm } from '@/components/records/PrescriptionForm';
import { PatientHistoryModal } from './PatientHistoryModal';
import { formatDate, formatTime, capitalizeFirst } from '@/utils/helpers';
import { ROLES, APPOINTMENT_STATUS } from '@/utils/constants';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { AppointmentForm } from './AppointmentForm';

export const AppointmentList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showNewModal, setShowNewModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyPatient, setHistoryPatient] = useState<{id: number, name: string} | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [activeAction, setActiveAction] = useState<string | null>(null);

  useEffect(() => {
    fetchAppointments();
  }, []);

  useEffect(() => {
    filterAppointments();
  }, [appointments, searchTerm, statusFilter]);

  const fetchAppointments = async () => {
    try {
      const data = await appointmentService.getAll();
      setAppointments(Array.isArray(data) ? data : []);
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
        (apt) =>
          apt.patient_name?.toLowerCase().includes(search) ||
          apt.doctor_name?.toLowerCase().includes(search) ||
          apt.reason?.toLowerCase().includes(search)
      );
    }

    if (statusFilter !== 'ALL') {
      filtered = filtered.filter((apt) => apt.status === statusFilter);
    }

    setFilteredAppointments(filtered);
  };

  const handleApprove = async (id: number) => {
    setIsProcessing(true);
    try {
      await appointmentService.approve(id);
      toast({
        title: 'Success',
        description: 'Appointment approved successfully',
      });
      setActiveAction(null);
      fetchAppointments();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to approve appointment',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = async () => {
    if (!selectedAppointment) return;
    setIsProcessing(true);
    try {
      await appointmentService.cancel(selectedAppointment.id);
      toast({
        title: 'Cancelled',
        description: 'Appointment has been cancelled',
      });
      setShowCancelModal(false);
      setSelectedAppointment(null);
      setActiveAction(null);
      fetchAppointments();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to cancel appointment',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedAppointment) return;
    setIsProcessing(true);
    try {
      await appointmentService.reject(selectedAppointment.id, rejectReason);
      toast({
        title: 'Rejected',
        description: 'Appointment has been rejected',
      });
      setShowRejectModal(false);
      setSelectedAppointment(null);
      setRejectReason('');
      fetchAppointments();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to reject appointment',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    const classes: Record<string, string> = {
      PENDING: 'badge-pending',
      APPROVED: 'badge-approved',
      CANCELLED: 'badge-cancelled',
      COMPLETED: 'badge-approved',
    };
    return classes[status] || 'bg-muted text-muted-foreground';
  };

  const canManageAppointments = user?.role === ROLES.ADMIN;
  const isDoctor = user?.role === ROLES.DOCTOR;
  const isPatient = user?.role === ROLES.PATIENT;
  const isAdmin = user?.role === ROLES.ADMIN;

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Appointments</h1>
          <p className="text-muted-foreground">Manage and track all appointments</p>
        </div>
        {(isPatient || isAdmin) && (
          <button onClick={() => setShowNewModal(true)} className="btn-gradient flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Book Appointment
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="glass-card rounded-2xl p-4 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search appointments..."
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
            {Object.values(APPOINTMENT_STATUS).map((status) => (
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
                  ID
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Patient
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Doctor
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Date & Time
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredAppointments.length > 0 ? (
                filteredAppointments.map((appointment, index) => (
                  <tr
                    key={appointment.id}
                    onClick={() => navigate(`/appointments/${appointment.id}`)}
                    className={cn('table-row cursor-pointer hover:bg-muted/50 transition-colors', index % 2 === 0 && 'bg-muted/20')}
                  >
                    <td className="px-6 py-4 font-medium text-foreground">
                      #{appointment.id}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-medium">
                          {(appointment.patient_name || 'P')[0]}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-foreground">
                            {appointment.patient_name || `Patient #${appointment.patient}`}
                          </span>
                          {appointment.patient_uhid && (
                            <span className="text-xs font-mono text-primary">UHID: {appointment.patient_uhid}</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-foreground">
                      {appointment.doctor_name || `Dr. #${appointment.doctor}`}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {formatDate(appointment.appointment_date)}
                        <Clock className="h-4 w-4 ml-2" />
                        {formatTime(appointment.appointment_time)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn('badge', getStatusBadgeClass(appointment.status))}>
                        {capitalizeFirst(appointment.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/appointments/${appointment.id}`);
                          }}
                          className="p-2 rounded-lg text-muted-foreground hover:bg-blue-500/10 hover:text-blue-600 transition-colors"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {canManageAppointments && appointment.status === 'PENDING' && (
                          <>
                            {activeAction !== 'reject' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveAction('approve');
                                  handleApprove(appointment.id);
                                }}
                                disabled={isProcessing}
                                className="p-2 rounded-lg text-success hover:bg-success/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                title="Approve"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </button>
                            )}
                            {activeAction !== 'approve' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveAction('reject');
                                  setSelectedAppointment(appointment);
                                  setShowRejectModal(true);
                                }}
                                disabled={isProcessing}
                                className="p-2 rounded-lg text-destructive hover:bg-destructive/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                title="Reject"
                              >
                                <XCircle className="h-4 w-4" />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                    No appointments found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Patient History Modal */}
      <PatientHistoryModal
        isOpen={showHistoryModal}
        onClose={() => {
            setShowHistoryModal(false);
            setHistoryPatient(null);
        }}
        patientId={historyPatient?.id || 0}
        patientName={historyPatient?.name || ''}
      />

      {/* New Appointment Modal */}
      <Modal
        isOpen={showNewModal}
        onClose={() => setShowNewModal(false)}
        title="Book New Appointment"
        size="lg"
      >
        <AppointmentForm
          onSuccess={() => {
            setShowNewModal(false);
            fetchAppointments();
          }}
          onCancel={() => setShowNewModal(false)}
        />
      </Modal>

      {/* Cancel Confirmation Modal */}
      <ConfirmModal
        isOpen={showCancelModal}
        onClose={() => {
          setShowCancelModal(false);
          setSelectedAppointment(null);
        }}
        onConfirm={handleCancel}
        title="Cancel Appointment"
        message="Are you sure you want to cancel this appointment? This action cannot be undone."
        confirmText="Yes, Cancel"
        variant="danger"
        isLoading={isProcessing}
      />

      {/* Reject Appointment Modal */}
      {showRejectModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="glass-card rounded-2xl p-6 max-w-md w-full space-y-4 animate-fade-in">
            <h3 className="text-xl font-bold text-foreground">Reject Appointment</h3>
            <p className="text-sm text-muted-foreground">
              Rejecting appointment for <span className="font-semibold text-foreground">{selectedAppointment.patient_name || `Patient #${selectedAppointment.patient}`}</span>
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Please provide a reason for rejection..."
              className="w-full p-3 rounded-lg border border-border bg-muted/50 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-red-500 min-h-24 resize-none"
            />
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason('');
                  setSelectedAppointment(null);
                }}
                disabled={isProcessing}
                className="flex-1 py-2 px-4 rounded-lg border border-border text-foreground hover:bg-muted disabled:opacity-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={isProcessing || !rejectReason.trim()}
                className="flex-1 py-2 px-4 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors font-semibold"
              >
                {isProcessing ? 'Rejecting...' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Prescription Modal */}
      {showPrescriptionModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="glass-card rounded-2xl p-6 max-w-2xl w-full my-8">
            <h3 className="text-2xl font-bold text-foreground mb-6">Create Prescription</h3>
            <PrescriptionForm
              appointmentId={selectedAppointment.id}
              patientName={selectedAppointment.patient_name || `Patient #${selectedAppointment.patient}`}
              onSuccess={() => {
                setShowPrescriptionModal(false);
                setSelectedAppointment(null);
                fetchAppointments();
                toast({
                  title: 'Success!',
                  description: 'Prescription created successfully',
                });
              }}
              onCancel={() => {
                setShowPrescriptionModal(false);
                setSelectedAppointment(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
