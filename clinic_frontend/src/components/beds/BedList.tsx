import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bedService, Bed, Ward } from '@/services/bedService';
import { patientService, Patient } from '@/services/patientService';
import { Plus, Trash2, Filter, UserPlus, LogOut } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { ButtonLoader } from '@/components/common/Loader';

export const BedList = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isAdmitOpen, setIsAdmitOpen] = useState(false);

    // Selection state
    const [selectedWard, setSelectedWard] = useState<string>('');
    const [selectedBedForAdmission, setSelectedBedForAdmission] = useState<number | null>(null);
    const [selectedBedForDischarge, setSelectedBedForDischarge] = useState<number | null>(null);
    const [isDischargeOpen, setIsDischargeOpen] = useState(false);

    // Forms
    const [formData, setFormData] = useState({
        ward: '',
        bed_number: '',
        bed_type: 'STANDARD',
        price_per_day: '',
        status: 'AVAILABLE',
    });

    const [admitData, setAdmitData] = useState({
        patient: '',
        reason: '',
        notes: ''
    });

    const [dischargeData, setDischargeData] = useState({
        discharge_date: new Date().toISOString().slice(0, 16) // Default to now
    });

    // Queries
    const { data: wards } = useQuery({ queryKey: ['wards'], queryFn: bedService.getWards });
    const { data: patients } = useQuery({ queryKey: ['patients'], queryFn: patientService.getAll });

    const { data: beds, isLoading } = useQuery({
        queryKey: ['beds', selectedWard],
        queryFn: () => bedService.getBeds(selectedWard ? { ward: selectedWard } : {}),
    });

    // Mutations
    const createMutation = useMutation({
        mutationFn: bedService.createBed,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['beds'] });
            setIsAddOpen(false);
            setFormData({ ward: '', bed_number: '', bed_type: 'STANDARD', price_per_day: '', status: 'AVAILABLE' });
            toast({ title: 'Success', description: 'Bed added successfully' });
        },
        onError: (err: any) => {
            toast({ title: 'Error', description: err.response?.data?.detail || 'Failed to add bed', variant: 'destructive' });
        }
    });

    const deleteMutation = useMutation({
        mutationFn: bedService.deleteBed,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['beds'] });
            toast({ title: 'Success', description: 'Bed deleted successfully' });
        }
    });

    const admitMutation = useMutation({
        mutationFn: bedService.admitPatient,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['beds'] });
            setIsAdmitOpen(false);
            setSelectedBedForAdmission(null);
            setAdmitData({ patient: '', reason: '', notes: '' });
            toast({ title: 'Success', description: 'Patient admitted successfully' });
        },
        onError: (err: any) => {
            toast({ title: 'Error', description: err.response?.data?.detail || 'Failed to admit patient', variant: 'destructive' });
        }
    });

    const dischargeMutation = useMutation({
        mutationFn: async ({ bed, date }: { bed: Bed, date: string }) => {
            if (bed.current_allocation?.id) {
                return bedService.dischargePatient(bed.current_allocation.id, date);
            }
            throw new Error("No active allocation found");
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['beds'] });
            setIsDischargeOpen(false);
            setDischargeData({ discharge_date: new Date().toISOString().slice(0, 16) });
            setSelectedBedForDischarge(null);
            toast({ title: 'Success', description: 'Patient discharged successfully' });
        },
        onError: (err: any) => {
            toast({ title: 'Error', description: err.response?.data?.error || 'Failed to discharge patient', variant: 'destructive' });
        }
    });

    // Handlers
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        createMutation.mutate({
            ...formData,
            ward: parseInt(formData.ward),
            price_per_day: parseFloat(formData.price_per_day),
            is_active: true,
            bed_type: formData.bed_type as any
        } as Partial<Bed>);
    };

    const handleAdmitSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedBedForAdmission) return;
        admitMutation.mutate({
            bed: selectedBedForAdmission,
            patient: parseInt(admitData.patient),
            reason: admitData.reason,
            notes: admitData.notes,
            status: 'ACTIVE'
        });
    };

    const openAdmitModal = (bedId: number) => {
        setSelectedBedForAdmission(bedId);
        setIsAdmitOpen(true);
    };

    const openDischargeModal = (bedId: number) => {
        setSelectedBedForDischarge(bedId);
        setIsDischargeOpen(true);
        // Default to now
        setDischargeData({ discharge_date: new Date().toISOString().slice(0, 16) });
    };

    const handleDischargeSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedBedForDischarge) return;

        const bed = beds?.find((b: Bed) => b.id === selectedBedForDischarge);
        if (bed) {
            dischargeMutation.mutate({ bed, date: dischargeData.discharge_date });
        }
    };

    if (isLoading) return <div className="flex justify-center p-8">< ButtonLoader className="text-primary" /></div >;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-4">
                    <h2 className="text-xl font-semibold">Beds</h2>
                    <select
                        value={selectedWard}
                        onChange={(e) => setSelectedWard(e.target.value)}
                        className="px-3 py-1.5 border rounded-lg text-sm bg-white"
                    >
                        <option value="">All Wards</option>
                        {wards?.map((w: Ward) => (
                            <option key={w.id} value={w.id}>{w.name} ({w.ward_type})</option>
                        ))}
                    </select>
                </div>

                <button
                    onClick={() => setIsAddOpen(!isAddOpen)}
                    className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
                >
                    <Plus className="h-4 w-4" /> Add Bed
                </button>
            </div>

            {/* Add Bed Modal/Panel */}
            {isAddOpen && (
                <div className="bg-white p-6 rounded-xl border shadow-sm animate-fade-in-up">
                    <h3 className="text-lg font-medium mb-4">New Bed Details</h3>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Ward</label>
                            <select
                                required
                                value={formData.ward}
                                onChange={(e) => setFormData({ ...formData, ward: e.target.value })}
                                className="w-full border rounded-lg px-3 py-2"
                            >
                                <option value="">Select Ward</option>
                                {wards?.map((w: Ward) => (
                                    <option key={w.id} value={w.id}>{w.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Bed Number/Code</label>
                            <input
                                required
                                value={formData.bed_number}
                                onChange={(e) => setFormData({ ...formData, bed_number: e.target.value })}
                                placeholder="e.g. ICU-01"
                                className="w-full border rounded-lg px-3 py-2"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Type</label>
                            <select
                                value={formData.bed_type}
                                onChange={(e) => setFormData({ ...formData, bed_type: e.target.value })}
                                className="w-full border rounded-lg px-3 py-2"
                            >
                                <option value="STANDARD">Standard</option>
                                <option value="ADJUSTABLE">Adjustable</option>
                                <option value="ICU">ICU</option>
                                <option value="VENTILATOR">Ventilator</option>
                                <option value="PEDIATRIC">Pediatric</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Price/Day ($)</label>
                            <input
                                required
                                type="number"
                                value={formData.price_per_day}
                                onChange={(e) => setFormData({ ...formData, price_per_day: e.target.value })}
                                placeholder="0.00"
                                className="w-full border rounded-lg px-3 py-2"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Initial Status</label>
                            <select
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                className="w-full border rounded-lg px-3 py-2"
                            >
                                <option value="AVAILABLE">Available</option>
                                <option value="MAINTENANCE">Maintenance</option>
                                <option value="CLEANING">Cleaning</option>
                            </select>
                        </div>

                        <div className="md:col-span-3 flex justify-end gap-2 mt-2">
                            <button
                                type="button"
                                onClick={() => setIsAddOpen(false)}
                                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={createMutation.isPending}
                                className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 flex items-center gap-2"
                            >
                                {createMutation.isPending && <ButtonLoader />} Save Bed
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Admit Patient Modal */}
            {isAdmitOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-md animate-scale-in">
                        <h3 className="text-xl font-bold mb-4">Admit Patient</h3>
                        <form onSubmit={handleAdmitSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Select Patient</label>
                                <select
                                    required
                                    value={admitData.patient}
                                    onChange={(e) => setAdmitData({ ...admitData, patient: e.target.value })}
                                    className="w-full border rounded-lg px-3 py-2"
                                >
                                    <option value="">Select Patient</option>
                                    {patients?.map((p: Patient) => (
                                        <option key={p.id} value={p.id}>
                                            {p.user_name || `Patient #${p.id}`}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Reason for Admission</label>
                                <textarea
                                    required
                                    value={admitData.reason}
                                    onChange={(e) => setAdmitData({ ...admitData, reason: e.target.value })}
                                    className="w-full border rounded-lg px-3 py-2 h-20"
                                    placeholder="Diagnosis or reason..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Notes (Optional)</label>
                                <input
                                    value={admitData.notes}
                                    onChange={(e) => setAdmitData({ ...admitData, notes: e.target.value })}
                                    className="w-full border rounded-lg px-3 py-2"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsAdmitOpen(false);
                                        setSelectedBedForAdmission(null);
                                    }}
                                    className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={admitMutation.isPending}
                                    className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 flex items-center gap-2"
                                >
                                    {admitMutation.isPending && <ButtonLoader />} Admit Patient
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Discharge Modal */}
            {isDischargeOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-sm animate-scale-in">
                        <h3 className="text-xl font-bold mb-4 text-amber-600">Discharge Patient</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            Please confirm the discharge date. <br />
                            <span className="font-semibold text-amber-700">Note:</span> The bed will be freed, but the admission will remain open until the bill is fully paid.
                        </p>
                        <form onSubmit={handleDischargeSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Discharge Date</label>
                                <input
                                    required
                                    type="datetime-local"
                                    value={dischargeData.discharge_date}
                                    onChange={(e) => setDischargeData({ ...dischargeData, discharge_date: e.target.value })}
                                    className="w-full border rounded-lg px-3 py-2"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsDischargeOpen(false);
                                        setSelectedBedForDischarge(null);
                                    }}
                                    className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={dischargeMutation.isPending}
                                    className="bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 flex items-center gap-2"
                                >
                                    {dischargeMutation.isPending && <ButtonLoader />} Confirm Discharge
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b">
                        <tr>
                            <th className="px-6 py-3 text-xs font-semibold uppercase text-slate-500">Bed No.</th>
                            <th className="px-6 py-3 text-xs font-semibold uppercase text-slate-500">Ward</th>
                            <th className="px-6 py-3 text-xs font-semibold uppercase text-slate-500">Type</th>
                            <th className="px-6 py-3 text-xs font-semibold uppercase text-slate-500">Status</th>
                            <th className="px-6 py-3 text-xs font-semibold uppercase text-slate-500">Occupant</th>
                            <th className="px-6 py-3 text-xs font-semibold uppercase text-slate-500">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {beds?.map((bed: Bed) => (
                            <tr
                                key={bed.id}
                                onClick={() => {
                                    if (bed.status === 'OCCUPIED' && bed.current_allocation) {
                                        // Navigate to patient details which shows admission info
                                        const patientId = typeof bed.current_allocation === 'object' ? (bed.current_allocation as any).patient : bed.current_allocation;
                                        navigate(`/patients/${patientId}`);
                                    } else if (bed.status === 'AVAILABLE') {
                                        openAdmitModal(bed.id);
                                    }
                                }}
                                className="hover:bg-slate-50 transition-colors cursor-pointer"
                            >
                                <td className="px-6 py-4 font-bold text-slate-700">{bed.bed_number}</td>
                                <td className="px-6 py-4 text-slate-600">{bed.ward_name}</td>
                                <td className="px-6 py-4 text-sm">{bed.bed_type}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium border
                                        ${bed.status === 'AVAILABLE' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : ''}
                                        ${bed.status === 'OCCUPIED' ? 'bg-amber-50 text-amber-700 border-amber-200' : ''}
                                        ${bed.status === 'MAINTENANCE' ? 'bg-red-50 text-red-700 border-red-200' : ''}
                                        ${bed.status === 'CLEANING' ? 'bg-blue-50 text-blue-700 border-blue-200' : ''}
                                     `}>
                                        {bed.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm">
                                    {bed.status === 'OCCUPIED' && bed.current_allocation ? (
                                        <div className="flex flex-col">
                                            <span className="font-medium text-slate-900">
                                                {(bed.current_allocation as any).patient_name || (bed.current_allocation as any).patient_details?.user_name || 'Patient'}
                                            </span>
                                            {(bed.current_allocation as any).patient_uhid && (
                                                <span className="text-xs font-mono text-primary">
                                                    {(bed.current_allocation as any).patient_uhid}
                                                </span>
                                            )}
                                            <span className="text-xs text-slate-500">
                                                Admitted: {new Date(bed.current_allocation.admission_date).toLocaleDateString()}
                                            </span>
                                        </div>
                                    ) : (
                                        <span className="text-slate-400 text-xs italic">Empty</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 flex items-center gap-2">
                                    {bed.status === 'AVAILABLE' && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                openAdmitModal(bed.id);
                                            }}
                                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded transition-colors tooltip"
                                            title="Admit Patient"
                                        >
                                            <UserPlus className="h-4 w-4" />
                                        </button>
                                    )}
                                    {bed.status === 'OCCUPIED' && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                openDischargeModal(bed.id);
                                            }}
                                            className="p-1.5 text-amber-600 hover:bg-amber-50 rounded transition-colors tooltip"
                                            title="Discharge Patient"
                                        >
                                            <LogOut className="h-4 w-4" />
                                        </button>
                                    )}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (confirm('Delete bed?')) {
                                                deleteMutation.mutate(bed.id);
                                            }
                                        }}
                                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {beds?.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                                    No beds found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
