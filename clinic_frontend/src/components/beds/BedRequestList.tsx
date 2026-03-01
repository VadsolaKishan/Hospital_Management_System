import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bedService, BedRequest, Ward, Bed } from '@/services/bedService';
import { Check, X, BedDouble } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { ButtonLoader } from '@/components/common/Loader';

export const BedRequestList = () => {
    const queryClient = useQueryClient();
    const [selectedRequest, setSelectedRequest] = useState<BedRequest | null>(null);
    const [assignModalOpen, setAssignModalOpen] = useState(false);

    // Assignment Form State
    const [selectedWard, setSelectedWard] = useState('');
    const [selectedBed, setSelectedBed] = useState('');
    const [notes, setNotes] = useState('');

    // Queries
    const { data: requests, isLoading } = useQuery({
        queryKey: ['bed-requests'],
        queryFn: bedService.getBedRequests,
    });

    const { data: wards } = useQuery({
        queryKey: ['wards'],
        queryFn: bedService.getWards,
        enabled: assignModalOpen
    });

    const { data: availableBeds } = useQuery({
        queryKey: ['beds', selectedWard, 'AVAILABLE'],
        queryFn: () => bedService.getBeds({ ward: selectedWard, status: 'AVAILABLE' }),
        enabled: !!selectedWard && assignModalOpen
    });

    // Mutations
    const updateRequestMutation = useMutation({
        mutationFn: ({ id, status }: { id: number, status: 'APPROVED' | 'REJECTED' }) =>
            bedService.updateBedRequest(id, { status }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['bed-requests'] });
            toast({ title: 'Success', description: 'Request updated' });
        }
    });

    const assignBedMutation = useMutation({
        mutationFn: async () => {
            if (!selectedRequest || !selectedBed) return;

            // 1. Admit Patient (Create Allocation)
            await bedService.admitPatient({
                bed: parseInt(selectedBed),
                patient: selectedRequest.patient,
                reason: 'Prescription Requirement', // Or fetch from prescription
                notes: `Expected stay: ${selectedRequest.expected_bed_days} days. ${notes}`,
                status: 'ACTIVE'
            });

            // 2. Mark Request as Approved
            await bedService.updateBedRequest(selectedRequest.id, { status: 'APPROVED' });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['bed-requests'] });
            queryClient.invalidateQueries({ queryKey: ['beds'] });
            setAssignModalOpen(false);
            setSelectedRequest(null);
            setSelectedWard('');
            setSelectedBed('');
            setNotes('');
            toast({ title: 'Success', description: 'Bed assigned successfully' });
        },
        onError: (err: any) => {
            toast({ title: 'Error', description: err.response?.data?.detail || 'Failed to assign bed', variant: 'destructive' });
        }
    });

    const handleOpenAssign = (request: BedRequest) => {
        setSelectedRequest(request);
        setAssignModalOpen(true);
    };

    const handleReject = (id: number) => {
        if (confirm('Are you sure you want to reject this bed request?')) {
            updateRequestMutation.mutate({ id, status: 'REJECTED' });
        }
    };

    if (isLoading) return <div className="flex justify-center p-8"><ButtonLoader className="text-primary" /></div>;

    const pendingRequests = requests?.filter((r: BedRequest) => r.status === 'PENDING') || [];
    const historyRequests = requests?.filter((r: BedRequest) => r.status !== 'PENDING') || [];

    return (
        <div className="space-y-6">
            {/* Active Requests */}
            <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b flex justify-between items-center bg-blue-50/50">
                    <h2 className="font-semibold text-lg">Pending Bed Requests</h2>
                    <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-medium">
                        {pendingRequests.length} Pending
                    </span>
                </div>

                {pendingRequests.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                        No pending bed requests.
                    </div>
                ) : (
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b">
                            <tr>
                                <th className="px-6 py-3 text-xs font-semibold uppercase text-slate-500">Date</th>
                                <th className="px-6 py-3 text-xs font-semibold uppercase text-slate-500">Patient</th>
                                <th className="px-6 py-3 text-xs font-semibold uppercase text-slate-500">Doctor</th>
                                <th className="px-6 py-3 text-xs font-semibold uppercase text-slate-500">Exp. Days</th>
                                <th className="px-6 py-3 text-xs font-semibold uppercase text-slate-500">Status</th>
                                <th className="px-6 py-3 text-xs font-semibold uppercase text-slate-500 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {pendingRequests.map((req: BedRequest) => (
                                <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 text-sm text-slate-600">
                                        {new Date(req.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 font-medium text-slate-900">
                                        {req.patient_name}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-600">
                                        Dr. {req.doctor_name}
                                    </td>
                                    <td className="px-6 py-4 text-sm font-semibold text-blue-600">
                                        {req.expected_bed_days} Days
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                                            {req.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => handleReject(req.id)}
                                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Reject"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => handleOpenAssign(req)}
                                                className="flex items-center gap-1 bg-primary text-white px-3 py-1.5 rounded-lg text-sm hover:bg-primary/90 transition-colors shadow-sm"
                                            >
                                                <BedDouble className="h-4 w-4" /> Assign Bed
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* History - Collapsible or separate table */}
            {historyRequests.length > 0 && (
                <div className="bg-white border rounded-xl overflow-hidden shadow-sm opacity-75">
                    <div className="px-6 py-4 border-b bg-slate-50">
                        <h2 className="font-semibold text-md text-slate-600">Request History</h2>
                    </div>
                    {/* Simplified table for history */}
                    <table className="w-full text-left">
                        <tbody className="divide-y">
                            {historyRequests.slice(0, 5).map((req: BedRequest) => (
                                <tr key={req.id} className="text-sm text-slate-500">
                                    <td className="px-6 py-3">{new Date(req.created_at).toLocaleDateString()}</td>
                                    <td className="px-6 py-3">{req.patient_name}</td>
                                    <td className="px-6 py-3">Dr. {req.doctor_name}</td>
                                    <td className="px-6 py-3">{req.expected_bed_days} Days</td>
                                    <td className="px-6 py-3">
                                        <span className={`px-2 py-0.5 rounded text-xs border ${req.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-red-50 text-red-600 border-red-200'
                                            }`}>
                                            {req.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Assign Modal */}
            {assignModalOpen && selectedRequest && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-md animate-scale-in">
                        <h3 className="text-xl font-bold mb-1">Assign Bed</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            Patient: {selectedRequest.patient_name} | Expected Stay: {selectedRequest.expected_bed_days} days
                        </p>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Select Ward</label>
                                <select
                                    className="w-full border rounded-lg px-3 py-2"
                                    value={selectedWard}
                                    onChange={(e) => {
                                        setSelectedWard(e.target.value);
                                        setSelectedBed('');
                                    }}
                                >
                                    <option value="">Select Ward</option>
                                    {wards?.map((w: Ward) => (
                                        <option key={w.id} value={w.id}>{w.name} ({w.ward_type})</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Select Available Bed</label>
                                <select
                                    className="w-full border rounded-lg px-3 py-2 disabled:bg-slate-100"
                                    value={selectedBed}
                                    onChange={(e) => setSelectedBed(e.target.value)}
                                    disabled={!selectedWard}
                                >
                                    <option value="">
                                        {!selectedWard ? 'Select a ward first' : 'Select Bed'}
                                    </option>
                                    {availableBeds?.map((b: Bed) => (
                                        <option key={b.id} value={b.id}>
                                            {b.bed_number} ({b.bed_type}) - ${b.price_per_day}/day
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Notes</label>
                                <textarea
                                    className="w-full border rounded-lg px-3 py-2 h-20"
                                    placeholder="Add any admission notes..."
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-4">
                                <button
                                    onClick={() => setAssignModalOpen(false)}
                                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => assignBedMutation.mutate()}
                                    disabled={!selectedBed || assignBedMutation.isPending}
                                    className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 flex items-center gap-2 text-sm font-medium disabled:opacity-50"
                                >
                                    {assignBedMutation.isPending && <ButtonLoader />} Confirm Assignment
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
