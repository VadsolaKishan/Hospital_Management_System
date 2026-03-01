import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal } from '@/components/common/Modal';
import { appointmentService, Appointment } from '@/services/appointmentService';
import { formatDate, formatTime } from '@/utils/helpers';
import { Calendar, Clock, FileText, CheckCircle, XCircle, Stethoscope, Pill } from 'lucide-react';
import { PageLoader } from '@/components/common/Loader';

interface PatientHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    patientId: number;
    patientName: string;
}

export const PatientHistoryModal: React.FC<PatientHistoryModalProps> = ({ isOpen, onClose, patientId, patientName }) => {
    const navigate = useNavigate();
    const [history, setHistory] = useState<Appointment[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen && patientId) {
            fetchHistory();
        }
    }, [isOpen, patientId]);

    const fetchHistory = async () => {
        setIsLoading(true);
        try {
            const data = await appointmentService.getHistory(patientId);
            setHistory(data);
        } catch (error) {
            console.error('Failed to fetch history', error);
        } finally {
            setIsLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'APPROVED': return 'text-green-600 bg-green-50 border-green-200';
            case 'VISITED': return 'text-blue-600 bg-blue-50 border-blue-200';
            case 'COMPLETED': return 'text-blue-600 bg-blue-50 border-blue-200'; // Fallback
            case 'CANCELLED': return 'text-red-600 bg-red-50 border-red-200';
            case 'REJECTED': return 'text-red-600 bg-red-50 border-red-200';
            default: return 'text-gray-600 bg-gray-50 border-gray-200';
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Medical History - ${patientName}`}
            size="lg"
        >
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                {isLoading ? (
                    <div className="flex justify-center p-8">
                        <PageLoader />
                    </div>
                ) : history.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        No history found for this patient.
                    </div>
                ) : (
                    <div className="space-y-3">
                        {history.map((apt) => (
                            <div key={apt.id} className="p-4 rounded-xl border border-border hover:bg-muted/30 transition-colors">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className={`px-2 py-0.5 rounded text-xs font-medium border ${getStatusColor(apt.status)}`}>
                                            {apt.status}
                                        </span>
                                        <span className="text-xs text-muted-foreground">#{apt.id}</span>
                                    </div>
                                    <div className="text-sm text-muted-foreground flex items-center gap-3">
                                        <span className="flex items-center gap-1">
                                            <Calendar className="h-3 w-3" />
                                            {formatDate(apt.appointment_date)}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            {formatTime(apt.appointment_time)}
                                        </span>
                                    </div>
                                </div>
                                
                                <div className="space-y-2">
                                    <div>
                                        <p className="text-sm font-medium text-foreground">Reason</p>
                                        <p className="text-sm text-muted-foreground">{apt.reason}</p>
                                    </div>
                                    
                                    {apt.notes && (
                                        <div className="mt-2 pt-2 border-t border-border/50">
                                            <p className="text-xs font-medium text-muted-foreground">Notes</p>
                                            <p className="text-sm text-foreground">{apt.notes}</p>
                                        </div>
                                    )}

                                    {apt.prescription_info && (
                                        <div className="mt-3 pt-3 border-t border-dashed border-border flex flex-col gap-2">
                                            <div>
                                                <div className="flex items-center gap-1.5 text-xs font-medium text-primary mb-1">
                                                    <Stethoscope className="h-3.5 w-3.5" />
                                                    Diagnosis
                                                </div>
                                                <p className="text-sm text-foreground pl-5">{apt.prescription_info.diagnosis}</p>
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-1.5 text-xs font-medium text-primary mb-1">
                                                    <Pill className="h-3.5 w-3.5" />
                                                    Medications
                                                </div>
                                                <div className="text-sm text-foreground pl-5 whitespace-pre-line">
                                                    {apt.prescription_info.medications}
                                                </div>
                                            </div>
                                            {apt.prescription_info.instructions && (
                                                <div>
                                                    <div className="flex items-center gap-1.5 text-xs font-medium text-primary mb-1">
                                                        <FileText className="h-3.5 w-3.5" />
                                                        Doctor Instruction
                                                    </div>
                                                    <div className="text-sm text-foreground pl-5 whitespace-pre-line">
                                                        {apt.prescription_info.instructions}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/50">
                                        <div className="text-xs text-muted-foreground">
                                            <span>Dr. {apt.doctor_name}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </Modal>
    );
};
