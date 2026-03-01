import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    FileText,
    Calendar,
    User,
    Stethoscope,
    Printer,
    ArrowLeft,
    Clock,
    Activity,
    Pill,
    ClipboardList
} from 'lucide-react';
import { PageLoader } from '@/components/common/Loader';
import { recordService, Prescription } from '@/services/recordService';
import { formatDate } from '@/utils/helpers';
import { toast } from '@/hooks/use-toast';

export const PrescriptionDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [prescription, setPrescription] = useState<Prescription | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchPrescription = async () => {
            if (!id) return;
            try {
                const data = await recordService.getById(parseInt(id));
                setPrescription(data);
            } catch (error) {
                console.error('Failed to fetch prescription:', error);
                toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: 'Failed to load prescription details',
                });
                navigate('/records');
            } finally {
                setIsLoading(false);
            }
        };

        fetchPrescription();
    }, [id, navigate]);

    if (isLoading) return <PageLoader />;
    if (!prescription) return null;

    return (
        <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 no-print">
                <button
                    onClick={() => navigate('/records')}
                    className="p-2 rounded-xl hover:bg-muted transition-colors"
                >
                    <ArrowLeft className="h-6 w-6 text-muted-foreground" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Prescription Details</h1>
                    <p className="text-muted-foreground">View detailed medical record</p>
                </div>
            </div>

            <div className="glass-card rounded-2xl overflow-hidden print-content">
                {/* Banner/Top Info */}
                <div className="bg-primary/5 p-6 border-b border-border">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                                <FileText className="h-8 w-8 text-primary" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Prescription ID</p>
                                <h2 className="text-xl font-bold text-foreground">#{prescription.id}</h2>
                                <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                                    <Clock className="h-4 w-4" />
                                    {formatDate(prescription.created_at)}
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => window.open(`/records/prescription/${id}/print`, '_blank')}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border hover:bg-background transition-colors text-foreground font-medium no-print"
                        >
                            <Printer className="h-4 w-4" />
                            Print
                        </button>
                    </div>
                </div>

                <div className="p-8 space-y-8">
                    {/* Patient & Doctor Info */}
                    <div className="grid md:grid-cols-2 gap-8">
                        <div className="p-4 rounded-xl bg-muted/30 space-y-3">
                            <div className="flex items-center gap-2 text-primary font-semibold">
                                <User className="h-5 w-5" />
                                <h3>Patient Information</h3>
                            </div>
                            <div>
                                <p className="text-lg font-medium text-foreground">
                                    {prescription.patient_name || `Patient #${prescription.patient}`}
                                </p>
                                <p className="text-sm text-muted-foreground">Patient ID: {prescription.patient}</p>
                            </div>
                        </div>

                        <div className="p-4 rounded-xl bg-muted/30 space-y-3">
                            <div className="flex items-center gap-2 text-primary font-semibold">
                                <Stethoscope className="h-5 w-5" />
                                <h3>Doctor Information</h3>
                            </div>
                            <div>
                                <p className="text-lg font-medium text-foreground">
                                    Dr. {prescription.doctor_name || `#${prescription.doctor}`}
                                </p>
                                <p className="text-sm text-muted-foreground">Doctor ID: {prescription.doctor}</p>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-border" />

                    {/* Diagnosis */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-foreground font-semibold text-lg">
                            <Activity className="h-5 w-5 text-destructive" />
                            <h3>Diagnosis</h3>
                        </div>
                        <div className="p-4 rounded-xl bg-background border border-border">
                            <p className="text-foreground whitespace-pre-wrap leading-relaxed">
                                {prescription.diagnosis}
                            </p>
                        </div>
                    </div>

                    {/* Medications */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-foreground font-semibold text-lg">
                            <Pill className="h-5 w-5 text-blue-500" />
                            <h3>Medications</h3>
                        </div>
                        <div className="p-4 rounded-xl bg-background border border-border">
                            <p className="text-foreground whitespace-pre-wrap leading-relaxed font-mono text-sm">
                                {prescription.medications}
                            </p>
                        </div>
                    </div>

                    {/* Instructions */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-foreground font-semibold text-lg">
                            <ClipboardList className="h-5 w-5 text-orange-500" />
                            <h3>Instructions</h3>
                        </div>
                        <div className="p-4 rounded-xl bg-background border border-border">
                            <p className="text-foreground whitespace-pre-wrap leading-relaxed">
                                {prescription.instructions}
                            </p>
                        </div>
                    </div>

                    {/* Follow Up */}
                    {prescription.follow_up_date && (
                        <div className="mt-8 flex items-center justify-center">
                            <div className="inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-blue-50 text-blue-700 border border-blue-100">
                                <Calendar className="h-5 w-5" />
                                <span className="font-semibold">
                                    Follow-up Required: {formatDate(prescription.follow_up_date)}
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
