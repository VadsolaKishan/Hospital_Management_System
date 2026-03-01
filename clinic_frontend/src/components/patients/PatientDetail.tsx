import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    User,
    Calendar,
    Phone,
    Droplet,
    MapPin,
    Clock,
    ArrowLeft,
    FileText,
    AlertCircle,
    Edit,
    Trash2,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { PageLoader } from '@/components/common/Loader';
import { ConfirmModal } from '@/components/common/Modal';
import { patientService, Patient } from '@/services/patientService';
import { calculateAge, formatDate, getInitials } from '@/utils/helpers';
import { ROLES, GENDERS } from '@/utils/constants';
import { toast } from '@/hooks/use-toast';

export const PatientDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [patient, setPatient] = useState<Patient | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        const fetchPatient = async () => {
            if (!id) return;
            try {
                const data = await patientService.getById(parseInt(id));
                setPatient(data);
            } catch (error) {
                console.error('Failed to fetch patient:', error);
                toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: 'Failed to load patient details',
                });
                navigate('/patients');
            } finally {
                setIsLoading(false);
            }
        };

        fetchPatient();
    }, [id, navigate]);

    const handleDelete = async () => {
        if (!patient) return;
        setIsDeleting(true);
        try {
            await patientService.delete(patient.id);
            toast({
                title: 'Deleted',
                description: 'Patient record has been deleted',
            });
            navigate('/patients');
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to delete patient',
            });
            setShowDeleteModal(false);
        } finally {
            setIsDeleting(false);
        }
    };

    const canManage = user?.role === ROLES.ADMIN || user?.role === ROLES.STAFF;

    if (isLoading) return <PageLoader />;
    if (!patient) return null;

    return (
        <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/patients')}
                    className="p-2 rounded-xl hover:bg-muted transition-colors"
                >
                    <ArrowLeft className="h-6 w-6 text-muted-foreground" />
                </button>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-foreground">Patient Details</h1>
                    <p className="text-muted-foreground">View patient information</p>
                </div>
                {canManage && (
                    <div className="flex gap-2">
                        <button
                            onClick={() => navigate(`/patients/${patient.id}/edit`)}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border hover:bg-muted transition-colors text-foreground font-medium"
                        >
                            <Edit className="h-4 w-4" />
                            Edit
                        </button>
                        <button
                            onClick={() => setShowDeleteModal(true)}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-colors text-foreground font-medium"
                        >
                            <Trash2 className="h-4 w-4" />
                            Delete
                        </button>
                    </div>
                )}
            </div>

            <div className="glass-card rounded-2xl overflow-hidden">
                {/* Banner/Profile Header */}
                <div className="bg-primary/5 p-8 border-b border-border">
                    <div className="flex flex-col sm:flex-row items-center gap-6">
                        <div className="h-24 w-24 rounded-2xl gradient-primary flex items-center justify-center text-3xl font-bold text-primary-foreground shadow-lg shadow-primary/20">
                            {getInitials(patient.user_name || 'Patient')}
                        </div>
                        <div className="text-center sm:text-left space-y-2">
                            <h2 className="text-3xl font-bold text-foreground">{patient.user_name}</h2>
                            <div className="flex flex-wrap justify-center sm:justify-start gap-4 text-muted-foreground">
                                <span className="flex items-center gap-1">
                                    <User className="h-4 w-4" />
                                    {calculateAge(patient.date_of_birth)} years old
                                </span>
                                <span className="flex items-center gap-1">
                                    <User className="h-4 w-4" />
                                    {GENDERS.find(g => g.value === patient.gender)?.label || patient.gender}
                                </span>
                                {patient.blood_group && (
                                    <span className="flex items-center gap-1 text-red-500 font-medium bg-red-500/10 px-2 py-0.5 rounded-md">
                                        <Droplet className="h-4 w-4" />
                                        {patient.blood_group}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-8 space-y-8">
                    {/* Personal Information */}
                    <div>
                        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                            <User className="h-5 w-5 text-primary" />
                            Personal Information
                        </h3>
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-1">
                                <p className="text-sm font-medium text-muted-foreground">Date of Birth</p>
                                <div className="p-3 rounded-lg border border-border bg-background text-foreground flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    {formatDate(patient.date_of_birth)}
                                </div>
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm font-medium text-muted-foreground">Contact Number</p>
                                <div className="p-3 rounded-lg border border-border bg-background text-foreground flex items-center gap-2">
                                    <Phone className="h-4 w-4 text-muted-foreground" />
                                    {patient.user_phone || 'Not provided'}
                                </div>
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm font-medium text-muted-foreground">Emergency Contact</p>
                                <div className="p-3 rounded-lg border border-border bg-background text-foreground flex items-center gap-2">
                                    <AlertCircle className="h-4 w-4 text-muted-foreground" />
                                    {patient.emergency_contact || 'Not provided'}
                                </div>
                            </div>
                            <div className="space-y-1 md:col-span-2">
                                <p className="text-sm font-medium text-muted-foreground">Address</p>
                                <div className="p-3 rounded-lg border border-border bg-background text-foreground flex items-center gap-2">
                                    <MapPin className="h-4 w-4 text-muted-foreground" />
                                    {patient.address}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-border" />

                    {/* Medical Information */}
                    <div>
                        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                            <FileText className="h-5 w-5 text-primary" />
                            Medical Information
                        </h3>
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <p className="text-sm font-medium text-muted-foreground">Medical History</p>
                                <div className="p-4 rounded-xl bg-muted/30 text-foreground min-h-[100px] text-sm leading-relaxed">
                                    {patient.medical_history || <span className="text-muted-foreground italic">No medical history recorded.</span>}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                    Allergies
                                    {patient.allergies && <AlertCircle className="h-4 w-4 text-destructive" />}
                                </p>
                                <div className={`p-4 rounded-xl text-foreground min-h-[100px] text-sm leading-relaxed ${patient.allergies ? 'bg-destructive/5 border border-destructive/20' : 'bg-muted/30'}`}>
                                    {patient.allergies || <span className="text-muted-foreground italic">No allergies recorded.</span>}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-border pt-4">
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Patient record created on {formatDate(patient.created_at)}
                        </p>
                    </div>
                </div>
            </div>

            <ConfirmModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleDelete}
                title="Delete Patient"
                message="Are you sure you want to delete this patient record? This action cannot be undone."
                confirmText="Yes, Delete"
                variant="danger"
                isLoading={isDeleting}
            />
        </div>
    );
};
