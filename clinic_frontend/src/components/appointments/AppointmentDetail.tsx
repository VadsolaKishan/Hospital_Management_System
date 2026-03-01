import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    User,
    Calendar,
    Clock,
    ArrowLeft,
    CheckCircle,
    XCircle,
    FileText,
    Stethoscope,
    History
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { PageLoader } from '@/components/common/Loader';
import { Modal } from '@/components/common/Modal';
import { appointmentService, Appointment } from '@/services/appointmentService';
import { formatDate, formatTime, capitalizeFirst, getInitials } from '@/utils/helpers';
import { ROLES, APPOINTMENT_STATUS } from '@/utils/constants';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { PrescriptionForm } from '@/components/records/PrescriptionForm';
import { PatientHistoryModal } from './PatientHistoryModal';

export const AppointmentDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [appointment, setAppointment] = useState<Appointment | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [rejectReason, setRejectReason] = useState('');

    useEffect(() => {
        const fetchAppointment = async () => {
            if (!id) return;
            try {
                const data = await appointmentService.getById(parseInt(id));
                setAppointment(data);
            } catch (error) {
                console.error('Failed to fetch appointment:', error);
                toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: 'Failed to load appointment details',
                });
                navigate('/appointments');
            } finally {
                setIsLoading(false);
            }
        };

        fetchAppointment();
    }, [id, navigate]);

    const handleApprove = async () => {
        if (!appointment) return;
        setIsProcessing(true);
        try {
            await appointmentService.approve(appointment.id);
            toast({ title: 'Success', description: 'Appointment approved successfully' });
            // Refresh
            const data = await appointmentService.getById(appointment.id);
            setAppointment(data);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to approve appointment' });
        } finally {
            setIsProcessing(false);
        }
    };

    const handleCancel = async () => {
        if (!appointment) return;
        setIsProcessing(true);
        try {
            await appointmentService.cancel(appointment.id);
            toast({ title: 'Cancelled', description: 'Appointment has been cancelled' });
            setShowCancelModal(false);
            const data = await appointmentService.getById(appointment.id);
            setAppointment(data);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to cancel appointment' });
        } finally {
            setIsProcessing(false);
        }
    };

    const handleReject = async () => {
        if (!appointment) return;
        setIsProcessing(true);
        try {
            await appointmentService.reject(appointment.id, rejectReason);
            toast({ title: 'Rejected', description: 'Appointment has been rejected' });
            setShowRejectModal(false);
            const data = await appointmentService.getById(appointment.id);
            setAppointment(data);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to reject appointment' });
        } finally {
            setIsProcessing(false);
        }
    };

    const getStatusBadgeClass = (status: string) => {
        const classes: Record<string, string> = {
            PENDING: 'badge-pending',
            APPROVED: 'badge-approved',
            CANCELLED: 'badge-cancelled',
            VISITED: 'bg-blue-100 text-blue-800 border-blue-200',
            COMPLETED: 'badge-approved',
        };
        return classes[status] || 'bg-muted text-muted-foreground';
    };

    const isDoctor = user?.role === ROLES.DOCTOR;
    const isAdmin = user?.role === ROLES.ADMIN;
    const canManage = isDoctor || isAdmin;

    if (isLoading) return <PageLoader />;
    if (!appointment) return null;

    return (
        <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/appointments')}
                    className="p-2 rounded-xl hover:bg-muted transition-colors"
                >
                    <ArrowLeft className="h-6 w-6 text-muted-foreground" />
                </button>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-foreground">Appointment Details</h1>
                    <div className="flex items-center gap-2 mt-1">
                        <span className={cn('badge', getStatusBadgeClass(appointment.status))}>
                            {capitalizeFirst(appointment.status)}
                        </span>
                        <span className="text-sm text-muted-foreground">#{appointment.id}</span>
                    </div>
                </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="md:col-span-2 space-y-6">
                    {/* Patient Card */}
                    <div className="glass-card rounded-2xl p-6">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <User className="h-5 w-5 text-primary" />
                            Patient Information
                        </h3>
                        <div className="flex items-start gap-4">
                            <div className="h-12 w-12 rounded-full gradient-secondary flex items-center justify-center text-primary-foreground font-bold text-lg">
                                {getInitials(appointment.patient_name || 'P')}
                            </div>
                            <div>
                                <p className="font-medium text-lg">{appointment.patient_name}</p>
                                {appointment.patient_uhid && (
                                    <p className="text-sm font-mono text-primary bg-primary/5 px-2 py-0.5 rounded inline-block mt-1">
                                        {appointment.patient_uhid}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Doctor Card */}
                    <div className="glass-card rounded-2xl p-6">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Stethoscope className="h-5 w-5 text-primary" />
                            Doctor Information
                        </h3>
                        <div className="flex items-start gap-4">
                            <div className="h-12 w-12 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold text-lg">
                                {getInitials(appointment.doctor_name || 'Dr')}
                            </div>
                            <div>
                                <p className="font-medium text-lg">Dr. {appointment.doctor_name}</p>
                            </div>
                        </div>
                    </div>

                    {/* Reason/Notes */}
                    <div className="glass-card rounded-2xl p-6">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <FileText className="h-5 w-5 text-primary" />
                            Reason & Notes
                        </h3>
                        <div className="bg-muted/30 p-4 rounded-xl min-h-[100px]">
                            <p className="text-foreground">{appointment.reason || "No reason specified."}</p>
                        </div>
                        {appointment.notes && (
                            <div className="mt-4">
                                <p className="text-sm font-medium text-muted-foreground mb-1">Additional Notes</p>
                                <p className="text-sm text-foreground">{appointment.notes}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Time & Date */}
                    <div className="glass-card rounded-2xl p-6">
                        <h3 className="text-lg font-semibold mb-4">Schedule</h3>
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-primary/5 text-primary">
                                    <Calendar className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Date</p>
                                    <p className="font-medium">{formatDate(appointment.appointment_date)}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-primary/5 text-primary">
                                    <Clock className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Time</p>
                                    <p className="font-medium">{formatTime(appointment.appointment_time)}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    {canManage && (
                        <div className="glass-card rounded-2xl p-6 space-y-3">
                            <h3 className="text-lg font-semibold mb-4">Actions</h3>

                            <button
                                onClick={() => setShowHistoryModal(true)}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-primary/20 text-primary hover:bg-primary/5 rounded-xl transition-colors mb-2"
                            >
                                <History className="h-4 w-4" />
                                View Patient History
                            </button>

                            {appointment.status === 'PENDING' && isAdmin && (
                                <>
                                    <button
                                        onClick={handleApprove}
                                        disabled={isProcessing}
                                        className="w-full btn-gradient flex items-center justify-center gap-2"
                                    >
                                        <CheckCircle className="h-4 w-4" />
                                        Approve Appointment
                                    </button>
                                    <button
                                        onClick={() => setShowRejectModal(true)}
                                        disabled={isProcessing}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-destructive/20 text-destructive hover:bg-destructive/5 rounded-xl transition-colors"
                                    >
                                        <XCircle className="h-4 w-4" />
                                        Reject Appointment
                                    </button>
                                </>
                            )}

                            {appointment.status === 'APPROVED' && isDoctor && (
                                <>
                                    {!appointment.has_prescription ? (
                                        <button
                                            onClick={() => setShowPrescriptionModal(true)}
                                            className="w-full btn-gradient flex items-center justify-center gap-2"
                                        >
                                            <FileText className="h-4 w-4" />
                                            Write Prescription
                                        </button>
                                    ) : (
                                        <div className="w-full p-3 bg-muted/50 rounded-xl flex items-center justify-center gap-2 text-muted-foreground border border-muted">
                                            <CheckCircle className="h-4 w-4 text-green-500" />
                                            Prescription Created
                                        </div>
                                    )}
                                </>
                            )}
                            
                            {appointment.status === 'VISITED' && isDoctor && (
                                <div className="w-full p-3 bg-blue-50/50 rounded-xl flex items-center justify-center gap-2 text-blue-800 border border-blue-100">
                                    <CheckCircle className="h-4 w-4" />
                                    Prescription Created
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Patient History Section (Full Width or Main Column) */}
            {/* Note: Patient history has been moved to a separate modal accessible via "Medical History" button in Doctor dashboard */}

            {/* Modals */}
            <PatientHistoryModal
                isOpen={showHistoryModal}
                onClose={() => setShowHistoryModal(false)}
                patientId={appointment.patient}
                patientName={appointment.patient_name || 'Patient'}
            />

            <Modal
                isOpen={showPrescriptionModal}
                onClose={() => setShowPrescriptionModal(false)}
                title="Create Prescription"
                size="lg"
            >
                <PrescriptionForm
                    appointmentId={appointment.id}
                    patientName={appointment.patient_name || 'Patient'}
                    onSuccess={() => {
                        setShowPrescriptionModal(false);
                        // Refresh
                        const fetchUpdated = async () => {
                            const data = await appointmentService.getById(appointment.id);
                            setAppointment(data);
                        };
                        fetchUpdated();
                    }}
                    onCancel={() => setShowPrescriptionModal(false)}
                />
            </Modal>

            {/* Cancel Modal */}
            <Modal
                isOpen={showCancelModal}
                onClose={() => setShowCancelModal(false)}
                title="Cancel Appointment"
            >
                <div className="p-4">
                    <p className="mb-6 text-muted-foreground">Are you sure you want to cancel this appointment?</p>
                    <div className="flex gap-4 justify-end">
                        <button onClick={() => setShowCancelModal(false)} className="px-4 py-2 rounded-lg hover:bg-muted">Close</button>
                        <button onClick={handleCancel} className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90">Confirm Cancel</button>
                    </div>
                </div>
            </Modal>

            {/* Reject Modal */}
            <Modal
                isOpen={showRejectModal}
                onClose={() => setShowRejectModal(false)}
                title="Reject Appointment"
            >
                <div className="p-4 space-y-4">
                    <p className="text-muted-foreground">Please provide a reason for rejection:</p>
                    <textarea
                        className="w-full border rounded-lg p-2 min-h-[100px]"
                        placeholder="Reason..."
                        value={rejectReason}
                        onChange={e => setRejectReason(e.target.value)}
                    />
                    <div className="flex gap-4 justify-end">
                        <button onClick={() => setShowRejectModal(false)} className="px-4 py-2 rounded-lg hover:bg-muted">Cancel</button>
                        <button onClick={handleReject} className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90">Reject</button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};
