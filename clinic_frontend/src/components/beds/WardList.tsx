import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bedService, Ward } from '@/services/bedService';
import { Plus, Trash2, Edit2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { ButtonLoader } from '@/components/common/Loader';

export const WardList = () => {
    const queryClient = useQueryClient();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        ward_type: 'GENERAL',
        floor_number: '',
        description: '',
    });

    const { data: wards, isLoading } = useQuery({
        queryKey: ['wards'],
        queryFn: bedService.getWards,
    });

    const createMutation = useMutation({
        mutationFn: bedService.createWard,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['wards'] });
            closeForm();
            toast({ title: 'Success', description: 'Ward created successfully' });
        },
        onError: () => {
            toast({ title: 'Error', description: 'Failed to create ward', variant: 'destructive' });
        }
    });

    const updateMutation = useMutation({
        mutationFn: (data: any) => bedService.updateWard(editingId!, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['wards'] });
            closeForm();
            toast({ title: 'Success', description: 'Ward updated successfully' });
        },
        onError: () => {
            toast({ title: 'Error', description: 'Failed to update ward', variant: 'destructive' });
        }
    });

    const deleteMutation = useMutation({
        mutationFn: bedService.deleteWard,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['wards'] });
            toast({ title: 'Success', description: 'Ward deleted successfully' });
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingId) {
            updateMutation.mutate(formData);
        } else {
            createMutation.mutate(formData);
        }
    };

    const handleEdit = (ward: Ward) => {
        setEditingId(ward.id);
        setFormData({
            name: ward.name,
            ward_type: ward.ward_type,
            floor_number: ward.floor_number,
            description: ward.description || ''
        });
        setIsFormOpen(true);
    };

    const closeForm = () => {
        setIsFormOpen(false);
        setEditingId(null);
        setFormData({ name: '', ward_type: 'GENERAL', floor_number: '', description: '' });
    };

    if (isLoading) return <ButtonLoader className="text-primary" />;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Hospital Wards</h2>
                <button
                    onClick={() => { closeForm(); setIsFormOpen(!isFormOpen); }}
                    className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
                >
                    <Plus className="h-4 w-4" /> Add Ward
                </button>
            </div>

            {isFormOpen && (
                <div className="bg-white p-6 rounded-xl border shadow-sm animate-fade-in-up">
                    <h3 className="text-lg font-medium mb-4">{editingId ? 'Edit Ward' : 'New Ward Details'}</h3>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Ward Name</label>
                            <input
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="e.g. North Wing ICU"
                                className="w-full border rounded-lg px-3 py-2"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Type</label>
                            <select
                                value={formData.ward_type}
                                onChange={(e) => setFormData({ ...formData, ward_type: e.target.value })}
                                className="w-full border rounded-lg px-3 py-2"
                            >
                                <option value="GENERAL">General Ward</option>
                                <option value="ICU">ICU</option>
                                <option value="PRIVATE">Private Room</option>
                                <option value="SEMI_PRIVATE">Semi-Private Room</option>
                                <option value="EMERGENCY">Emergency</option>
                                <option value="MATERNITY">Maternity</option>
                                <option value="PEDIATRIC">Pediatric</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Floor Number</label>
                            <input
                                required
                                value={formData.floor_number}
                                onChange={(e) => setFormData({ ...formData, floor_number: e.target.value })}
                                placeholder="e.g. 2nd Floor"
                                className="w-full border rounded-lg px-3 py-2"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium mb-1">Description</label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="w-full border rounded-lg px-3 py-2 h-20"
                            />
                        </div>
                        <div className="md:col-span-2 flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={closeForm}
                                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={createMutation.isPending || updateMutation.isPending}
                                className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 flex items-center gap-2"
                            >
                                {(createMutation.isPending || updateMutation.isPending) && <ButtonLoader />} {editingId ? 'Update' : 'Save'} Ward
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b">
                        <tr>
                            <th className="px-6 py-3 text-xs font-semibold uppercase text-slate-500">Name</th>
                            <th className="px-6 py-3 text-xs font-semibold uppercase text-slate-500">Type</th>
                            <th className="px-6 py-3 text-xs font-semibold uppercase text-slate-500">Floor</th>
                            <th className="px-6 py-3 text-xs font-semibold uppercase text-slate-500">Capacity</th>
                            <th className="px-6 py-3 text-xs font-semibold uppercase text-slate-500">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {wards?.map((ward: Ward) => (
                            <tr key={ward.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4 font-medium">{ward.name}</td>
                                <td className="px-6 py-4">
                                    <span className="px-2 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium">
                                        {ward.ward_type}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-slate-600">{ward.floor_number}</td>
                                <td className="px-6 py-4">
                                    <span className="text-slate-600">{ward.total_beds} Beds</span>
                                    {ward.available_beds > 0 && <span className="ml-2 text-xs text-emerald-600 font-medium">({ward.available_beds} Free)</span>}
                                </td>
                                <td className="px-6 py-4 flex items-center gap-2">
                                    <button
                                        onClick={() => handleEdit(ward)}
                                        className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                                    >
                                        <Edit2 className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (confirm('Are you sure you want to delete this ward? All beds inside will be deleted.')) {
                                                deleteMutation.mutate(ward.id);
                                            }
                                        }}
                                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {wards?.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                                    No wards created yet.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
