import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, Calendar, User, Phone, FileText, Plus, History } from 'lucide-react';
import { appointmentService, Appointment } from '@/services/appointmentService';
import { recordService, Prescription } from '@/services/recordService';
import { PageLoader } from '@/components/common/Loader';
import { PrescriptionForm } from '@/components/records/PrescriptionForm';
import { toast } from '@/hooks/use-toast';
import { formatDate, formatTime, capitalizeFirst } from '@/utils/helpers';
import { cn } from '@/lib/utils';
import { Modal } from '@/components/common/Modal';

export const DoctorAppointments = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [patientHistory, setPatientHistory] = useState<Prescription[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      setIsLoading(true);
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

  const loadPatientHistory = async (patientId: number) => {
      setIsLoadingHistory(true);
      setPatientHistory([]);
      try {
          const history = await recordService.getPatientHistory(patientId);
          setPatientHistory(history);
      } catch (err) {
          console.error("Failed to load history", err);
          toast({
              variant: 'destructive',
              description: 'Failed to load patient history'
          });
      } finally {
          setIsLoadingHistory(false);
      }
  };

  if (isLoading) return <PageLoader />;

  const AppointmentCard = ({ appointment }: { appointment: Appointment }) => {
    const isVisited = appointment.status === 'VISITED';
    
    return (
    <div className={cn(
      'glass-card rounded-lg p-4 space-y-3 border-l-4 transition-all',
      isVisited ? 'border-blue-500 bg-blue-500/5' : 'border-emerald-700 bg-emerald-700/5'
    )}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h4 className="font-semibold text-foreground flex items-center gap-2">
            <User className="h-4 w-4" />
            {appointment.patient_name || `Patient #${appointment.patient}`}
          </h4>
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{appointment.reason}</p>
        </div>
        <span className={cn(
          'badge text-xs whitespace-nowrap',
          isVisited ? 'bg-blue-100 text-blue-800' : 'badge-approved'
        )}>
          {isVisited ? 'Visited' : 'Pending to see patient'}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="h-4 w-4 flex-shrink-0" />
          {formatDate(appointment.appointment_date)}
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="h-4 w-4 flex-shrink-0" />
          {formatTime(appointment.appointment_time)}
        </div>
      </div>

      <div className="pt-3 border-t border-border space-y-2">
          {!isVisited ? (
             <button
                onClick={() => {
                  setSelectedAppointment(appointment);
                  setShowPrescriptionModal(true);
                }}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2 transition-all text-sm font-semibold"
              >
                <Plus className="h-4 w-4" />
                Create Prescription
              </button>
          ) : (
              <div className="w-full text-center py-2 text-sm text-muted-foreground font-medium bg-muted/50 rounded-lg">
                  Consultation Completed
              </div>
          )}
          
          <button
            onClick={() => {
               if (appointment.patient) {
                   setSelectedAppointment(appointment);
                   loadPatientHistory(appointment.patient);
                   setShowHistoryModal(true);
               }
            }}
            className="w-full flex items-center justify-center gap-2 border border-input hover:bg-muted text-foreground rounded-lg py-2 transition-all text-sm font-medium"
          >
            <History className="h-4 w-4" />
            Medical History
          </button>
      </div>
    </div>
  );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Appointments</h1>
          <p className="text-muted-foreground">Manage consultations and patient history</p>
        </div>
      </div>

      {/* Appointments Grid */}
      {appointments.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {appointments.map(apt => (
            <AppointmentCard key={apt.id} appointment={apt} />
          ))}
        </div>
      ) : (
        <div className="glass-card rounded-xl p-8 text-center">
          <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No appointments found</p>
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

      {/* Medical History Modal */}
      <Modal 
          isOpen={showHistoryModal} 
          onClose={() => setShowHistoryModal(false)}
          title="Patient Medical History"
          size="lg"
      >
          <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
             {selectedAppointment && (
                 <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-lg mb-6">
                     <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                         {(selectedAppointment.patient_name || 'P')[0]}
                     </div>
                     <div>
                         <h4 className="font-semibold">{selectedAppointment.patient_name}</h4>
                         {selectedAppointment.patient_uhid && (
                             <p className="text-xs text-muted-foreground">UHID: {selectedAppointment.patient_uhid}</p>
                         )}
                     </div>
                 </div>
             )}

             {isLoadingHistory ? (
                 <div className="py-8 text-center text-muted-foreground">Loading history...</div>
             ) : (
                 <div className="space-y-4">
                     {patientHistory.length > 0 ? (
                         patientHistory.map((record) => (
                             <div key={record.id} className="border border-border rounded-xl p-4 hover:bg-muted/30 transition-colors">
                                 <div className="flex justify-between items-start mb-2">
                                     <div className="flex items-center gap-2">
                                         <BadgeCheck className="h-4 w-4 text-green-600" />
                                         <span className="font-medium text-foreground">{formatDate(record.created_at)}</span>
                                     </div>
                                     <span className="text-xs text-muted-foreground">Dr. {record.doctor_name}</span>
                                 </div>
                                 <div className="space-y-1">
                                    <p className="text-sm font-semibold text-foreground">Diagnosis: {record.diagnosis}</p>
                                    <p className="text-sm text-muted-foreground">{record.medications}</p>
                                 </div>
                             </div>
                         ))
                     ) : (
                         <div className="text-center py-8 text-muted-foreground border border-dashed border-border rounded-xl bg-muted/10">
                             No medical history yet.
                         </div>
                     )}
                 </div>
             )}
          </div>
      </Modal>
    </div>
  );
};

// Internal icon component if not available in lucide-react import
const BadgeCheck = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.78 4.78 4 4 0 0 1-6.74 0 4 4 0 0 1-4.78-4.78 4 4 0 0 1 0-6.74Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
);
