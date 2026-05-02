import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, FlaskConical, X } from 'lucide-react';
import { labService, LabTestType } from '@/services/labService';
import { PageLoader, ButtonLoader } from '@/components/common/Loader';
import { Breadcrumbs } from '@/components/common/Breadcrumbs';
import { ConfirmModal } from '@/components/common/Modal';
import { toast } from '@/hooks/use-toast';
import { formatDate } from '@/utils/helpers';

export const LabTestTypeList = () => {
  const [tests, setTests] = useState<LabTestType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTest, setEditingTest] = useState<LabTestType | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<LabTestType | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({ test_name: '', description: '', price: '' });

  const fetchTests = async () => {
    try {
      const data = await labService.getTestTypes();
      setTests(data);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to load test types' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchTests(); }, []);

  const openAddForm = () => {
    setEditingTest(null);
    setFormData({ test_name: '', description: '', price: '' });
    setShowForm(true);
  };

  const openEditForm = (test: LabTestType) => {
    setEditingTest(test);
    setFormData({ test_name: test.test_name, description: test.description, price: String(test.price) });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!formData.test_name.trim()) {
      toast({ variant: 'destructive', title: 'Error', description: 'Test name is required' });
      return;
    }
    setIsSaving(true);
    try {
      const payload = { test_name: formData.test_name, description: formData.description, price: Number(formData.price) || 0 };
      if (editingTest) {
        await labService.updateTestType(editingTest.id, payload);
        toast({ title: 'Success', description: 'Test type updated' });
      } else {
        await labService.createTestType(payload);
        toast({ title: 'Success', description: 'Test type created' });
      }
      setShowForm(false);
      fetchTests();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to save test type' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await labService.deleteTestType(deleteTarget.id);
      toast({ title: 'Deleted', description: 'Test type has been deleted' });
      setDeleteTarget(null);
      fetchTests();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete test type' });
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Breadcrumbs />
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Lab Test Types</h1>
          <p className="text-muted-foreground">Manage available laboratory tests</p>
        </div>
        <button onClick={openAddForm} className="btn-gradient flex items-center gap-2 shadow-lg shadow-blue-500/20">
          <Plus className="h-4 w-4" /> Add Test Type
        </button>
      </div>

      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="px-6 py-3 text-muted-foreground font-medium">Test Name</th>
                <th className="px-6 py-3 text-muted-foreground font-medium">Description</th>
                <th className="px-6 py-3 text-muted-foreground font-medium">Price</th>
                <th className="px-6 py-3 text-muted-foreground font-medium">Created</th>
                <th className="px-6 py-3 text-muted-foreground font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {tests.length > 0 ? tests.map((test) => (
                <tr key={test.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4 font-medium">{test.test_name}</td>
                  <td className="px-6 py-4 text-muted-foreground max-w-[250px] truncate">{test.description || '-'}</td>
                  <td className="px-6 py-4 font-medium">{Number(test.price).toFixed(2)}</td>
                  <td className="px-6 py-4 text-muted-foreground">{formatDate(test.created_at)}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button onClick={() => openEditForm(test)} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => setDeleteTarget(test)} className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                    <FlaskConical className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p>No test types found. Add one to get started.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowForm(false)}>
          <div className="bg-card rounded-2xl border border-border shadow-xl w-full max-w-md mx-4 p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">{editingTest ? 'Edit Test Type' : 'Add Test Type'}</h3>
              <button onClick={() => setShowForm(false)} className="p-1 rounded-lg hover:bg-muted transition-colors">
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Test Name <span className="text-destructive">*</span></label>
              <input
                type="text"
                value={formData.test_name}
                onChange={(e) => setFormData({ ...formData, test_name: e.target.value })}
                className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="e.g. CBC, Blood Sugar"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Brief description of the test"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Price</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="0.00"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-xl text-muted-foreground hover:bg-muted transition-colors font-medium">
                Cancel
              </button>
              <button onClick={handleSave} disabled={isSaving} className="btn-gradient flex items-center gap-2 disabled:opacity-50">
                {isSaving ? <ButtonLoader /> : (editingTest ? 'Update' : 'Create')}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Test Type"
        message={`Are you sure you want to delete "${deleteTarget?.test_name}"? This action cannot be undone.`}
        confirmText="Yes, Delete"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};
