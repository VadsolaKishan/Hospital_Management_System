import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { User, Phone, Mail, Shield, Calendar, Edit, Save, X, Loader2, HeartPulse } from 'lucide-react';
import { Breadcrumbs } from '@/components/common/Breadcrumbs';
import { authService } from '@/services/authService';
import { patientService, Patient } from '@/services/patientService';
import { useToast } from '@/hooks/use-toast';

export const Profile = () => {
    const { user, refreshUser } = useAuth();
    const { toast } = useToast();
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        first_name: user?.first_name || '',
        last_name: user?.last_name || '',
        phone: user?.phone || '',
    });

    const [patientData, setPatientData] = useState<Patient | null>(null);
    const [patientFormData, setPatientFormData] = useState({
        date_of_birth: '',
        gender: 'M',
        blood_group: '',
        address: '',
        emergency_contact: '',
    });

    useEffect(() => {
        if (user?.role === 'PATIENT') {
            const fetchPatientProfile = async () => {
                try {
                    const data = await patientService.getMyProfile();
                    setPatientData(data);
                    setPatientFormData({
                        date_of_birth: data.date_of_birth || '',
                        gender: data.gender || 'M',
                        blood_group: data.blood_group || '',
                        address: data.address || '',
                        emergency_contact: data.emergency_contact || '',
                    });
                } catch (err) {
                    console.error('Failed to fetch patient profile:', err);
                }
            };
            fetchPatientProfile();
        }
    }, [user]);

    if (!user) {
        return <div className="p-8 text-center text-muted-foreground">Loading profile...</div>;
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        if (name in formData) {
            setFormData(prev => ({ ...prev, [name]: value }));
        } else {
            setPatientFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleEdit = () => {
        setFormData({
            first_name: user.first_name || '',
            last_name: user.last_name || '',
            phone: user.phone || '',
        });
        if (patientData) {
            setPatientFormData({
                date_of_birth: patientData.date_of_birth || '',
                gender: patientData.gender || 'M',
                blood_group: patientData.blood_group || '',
                address: patientData.address || '',
                emergency_contact: patientData.emergency_contact || '',
            });
        }
        setIsEditing(true);
    };

    const handleCancel = () => {
        setIsEditing(false);
        // Reset form data to current user state
        setFormData({
            first_name: user.first_name || '',
            last_name: user.last_name || '',
            phone: user.phone || '',
        });
        if (patientData) {
            setPatientFormData({
                date_of_birth: patientData.date_of_birth || '',
                gender: patientData.gender || 'M',
                blood_group: patientData.blood_group || '',
                address: patientData.address || '',
                emergency_contact: patientData.emergency_contact || '',
            });
        }
    };

    const handleSave = async () => {
        setIsLoading(true);
        try {
            await authService.updateProfile(formData);

            if (user?.role === 'PATIENT') {
                const updatedPatient = await patientService.updateMyProfile(patientFormData);
                setPatientData(updatedPatient);
            }

            await refreshUser(); // Refresh global auth state
            toast({
                title: "Profile Updated",
                description: "Your information has been successfully saved.",
                className: "bg-success/20 border-success/50 text-success-text"
            });
            setIsEditing(false);
        } catch (error) {
            console.error('Update failed:', error);
            toast({
                title: "Update Failed",
                description: "Could not update profile. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <Breadcrumbs />
                    <h1 className="text-2xl font-bold text-foreground tracking-tight mt-1">My Profile</h1>
                    <p className="text-muted-foreground">Manage your account settings and personal information</p>
                </div>

                {isEditing ? (
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleCancel}
                            disabled={isLoading}
                            className="px-4 py-2 rounded-xl text-muted-foreground hover:bg-muted font-medium transition-colors flex items-center gap-2"
                        >
                            <X className="h-4 w-4" /> Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isLoading}
                            className="btn-gradient flex items-center gap-2 shadow-sm"
                        >
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            Save Changes
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={handleEdit}
                        className="btn-gradient flex items-center gap-2 shadow-sm"
                    >
                        <Edit className="h-4 w-4" />
                        <span>Edit Profile</span>
                    </button>
                )}
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Profile Card */}
                <div className="md:col-span-1">
                    <div className="glass-card rounded-2xl p-6 flex flex-col items-center text-center h-full border-t-4 border-t-primary">
                        <div className="h-32 w-32 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4 shadow-lg shadow-primary/10 ring-4 ring-background">
                            <span className="text-4xl font-bold">{user.first_name?.[0]}{user.last_name?.[0]}</span>
                        </div>
                        <h2 className="text-xl font-bold text-foreground">{user.full_name}</h2>
                        <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider">
                            <Shield className="h-3 w-3 mr-1" />
                            <span className="text-xs">{user.role}</span>
                        </div>

                        <div className="mt-8 w-full space-y-4 text-left">
                            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 transition-colors hover:bg-muted/60">
                                <Mail className="h-5 w-5 text-primary" />
                                <div className="overflow-hidden">
                                    <p className="text-xs text-muted-foreground font-medium">Email Address</p>
                                    <p className="text-sm font-medium text-foreground truncate">{user.email}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 transition-colors hover:bg-muted/60">
                                <Phone className="h-5 w-5 text-primary" />
                                <div>
                                    <p className="text-xs text-muted-foreground font-medium">Phone Number</p>
                                    <p className="text-sm font-medium text-foreground">{user.phone || 'Not provided'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Details Section */}
                <div className="md:col-span-2 space-y-6">
                    <div className="glass-card rounded-2xl p-6">
                        <h3 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2 pb-4 border-b border-border">
                            <User className="h-5 w-5 text-primary" />
                            Personal Information
                        </h3>

                        <div className="grid sm:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">First Name</label>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        name="first_name"
                                        value={formData.first_name}
                                        onChange={handleChange}
                                        className="w-full rounded-xl border border-input bg-background px-4 py-3 text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                                    />
                                ) : (
                                    <div className="p-3 rounded-xl bg-muted/30 border border-transparent text-foreground font-medium min-h-[46px] flex items-center">
                                        {user.first_name}
                                    </div>
                                )}
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">Last Name</label>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        name="last_name"
                                        value={formData.last_name}
                                        onChange={handleChange}
                                        className="w-full rounded-xl border border-input bg-background px-4 py-3 text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                                    />
                                ) : (
                                    <div className="p-3 rounded-xl bg-muted/30 border border-transparent text-foreground font-medium min-h-[46px] flex items-center">
                                        {user.last_name}
                                    </div>
                                )}
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">Role / Designation</label>
                                <div className="p-3 rounded-xl bg-muted/10 border border-transparent text-muted-foreground font-medium cursor-not-allowed min-h-[46px] flex items-center">
                                    {user.role}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">Phone</label>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        className="w-full rounded-xl border border-input bg-background px-4 py-3 text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                                        placeholder="+1 (555) 000-0000"
                                    />
                                ) : (
                                    <div className="p-3 rounded-xl bg-muted/30 border border-transparent text-foreground font-medium min-h-[46px] flex items-center">
                                        {user.phone || 'Not provided'}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {user.role === 'PATIENT' && (
                        <div className="glass-card rounded-2xl p-6">
                            <h3 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2 pb-4 border-b border-border">
                                <HeartPulse className="h-5 w-5 text-primary" />
                                Patient Details
                            </h3>
                            <div className="grid sm:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-muted-foreground">Date of Birth <span className="text-destructive">*</span></label>
                                    {isEditing ? (
                                        <input
                                            type="date"
                                            name="date_of_birth"
                                            value={patientFormData.date_of_birth}
                                            onChange={handleChange}
                                            className="w-full rounded-xl border border-input bg-background px-4 py-3 text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                                        />
                                    ) : (
                                        <div className="p-3 rounded-xl bg-muted/30 border border-transparent text-foreground font-medium min-h-[46px] flex items-center">
                                            {patientData?.date_of_birth || 'Not provided'}
                                        </div>
                                    )}
                                </div>
                                <div className="hidden sm:block"></div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-muted-foreground">Gender <span className="text-destructive">*</span></label>
                                    {isEditing ? (
                                        <div className="relative">
                                            <select
                                                name="gender"
                                                value={patientFormData.gender}
                                                onChange={handleChange}
                                                className="w-full rounded-xl border border-input bg-background px-4 py-3 text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium appearance-none"
                                            >
                                                <option value="M">Male</option>
                                                <option value="F">Female</option>
                                                <option value="O">Other</option>
                                            </select>
                                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-muted-foreground">
                                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="p-3 rounded-xl bg-muted/30 border border-transparent text-foreground font-medium min-h-[46px] flex items-center">
                                            {patientData?.gender === 'M' ? 'Male' : patientData?.gender === 'F' ? 'Female' : patientData?.gender === 'O' ? 'Other' : 'Not provided'}
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-muted-foreground">Blood Group <span className="text-destructive">*</span></label>
                                    {isEditing ? (
                                        <div className="relative">
                                            <select
                                                name="blood_group"
                                                value={patientFormData.blood_group}
                                                onChange={handleChange}
                                                className="w-full rounded-xl border border-input bg-background px-4 py-3 text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium appearance-none"
                                            >
                                                <option value="">Select blood group</option>
                                                <option value="A+">A+</option>
                                                <option value="A-">A-</option>
                                                <option value="B+">B+</option>
                                                <option value="B-">B-</option>
                                                <option value="O+">O+</option>
                                                <option value="O-">O-</option>
                                                <option value="AB+">AB+</option>
                                                <option value="AB-">AB-</option>
                                            </select>
                                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-muted-foreground">
                                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="p-3 rounded-xl bg-muted/30 border border-transparent text-foreground font-medium min-h-[46px] flex items-center">
                                            {patientData?.blood_group || 'Not provided'}
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-2 sm:col-span-2">
                                    <label className="text-sm font-medium text-muted-foreground">Address <span className="text-destructive">*</span></label>
                                    {isEditing ? (
                                        <textarea
                                            name="address"
                                            value={patientFormData.address}
                                            onChange={handleChange}
                                            rows={2}
                                            placeholder="Enter full address"
                                            className="w-full rounded-xl border border-input bg-background px-4 py-3 text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium resize-none"
                                        />
                                    ) : (
                                        <div className="p-3 rounded-xl bg-muted/30 border border-transparent text-foreground font-medium min-h-[46px] flex items-center">
                                            {patientData?.address || 'Not provided'}
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-2 sm:col-span-2">
                                    <label className="text-sm font-medium text-muted-foreground">Emergency Contact <span className="text-destructive">*</span></label>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            name="emergency_contact"
                                            value={patientFormData.emergency_contact}
                                            onChange={handleChange}
                                            placeholder="Name and phone number"
                                            className="w-full rounded-xl border border-input bg-background px-4 py-3 text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                                        />
                                    ) : (
                                        <div className="p-3 rounded-xl bg-muted/30 border border-transparent text-foreground font-medium min-h-[46px] flex items-center">
                                            {patientData?.emergency_contact || 'Not provided'}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="glass-card rounded-2xl p-6">
                        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-primary" />
                            Activity Overview
                        </h3>
                        <div className="p-8 text-center rounded-xl border border-dashed border-border bg-muted/5 flex flex-col items-center justify-center">
                            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                                <Calendar className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <h4 className="text-sm font-medium text-foreground">No recent activity</h4>
                            <p className="text-xs text-muted-foreground mt-1 max-w-xs">Your recent login activity and actions will appear here once available.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
