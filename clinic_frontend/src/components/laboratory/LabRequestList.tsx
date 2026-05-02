import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { FlaskConical, Eye, Upload, X, FileText, Clock, CheckCircle2 } from 'lucide-react';
import { labService, LabRequest } from '@/services/labService';
import { PageLoader, ButtonLoader } from '@/components/common/Loader';
import { Breadcrumbs } from '@/components/common/Breadcrumbs';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { formatDate } from '@/utils/helpers';

const statusConfig: Record<string, { label: string; class: string; icon: any }> = {
  REQUESTED: { label: 'Requested', class: 'bg-orange-100 text-orange-700', icon: Clock },
  VISITED: { label: 'Visited', class: 'bg-blue-100 text-blue-700', icon: Eye },
  COMPLETED: { label: 'Completed', class: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
};

export const LabRequestList = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const [requests, setRequests] = useState<LabRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>('ALL');
  const [uploadModal, setUploadModal] = useState<LabRequest | null>(null);
  const [reportFile, setReportFile] = useState<File | null>(null);
  const [notes, setNotes] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isMarking, setIsMarking] = useState<number | null>(null);

  const fetchRequests = async () => {
    try {
      const data = await labService.getRequests();
      setRequests(data);
    } catch (error) {
      console.error('Failed to fetch lab requests:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to load lab requests' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchRequests(); }, []);

  const handleMarkVisited = async (id: number) => {
    setIsMarking(id);
    try {
      await labService.markVisited(id);
      toast({ title: 'Success', description: 'Patient marked as visited' });
      fetchRequests();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.response?.data?.error || 'Failed to update status' });
    } finally {
      setIsMarking(null);
    }
  };

  const handleUploadReport = async () => {
    if (!uploadModal || !reportFile) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('report_file', reportFile);
      formData.append('notes', notes);
      await labService.uploadReport(uploadModal.id, formData);
      toast({ title: 'Success', description: 'Lab report uploaded successfully' });
      setUploadModal(null);
      setReportFile(null);
      setNotes('');
      fetchRequests();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.response?.data?.error || 'Failed to upload report' });
    } finally {
      setIsUploading(false);
    }
  };

  const filtered = filter === 'ALL' ? requests : requests.filter(r => r.status === filter);

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Breadcrumbs />
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Lab Requests</h1>
          <p className="text-muted-foreground">Manage laboratory test requests</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {['ALL', 'REQUESTED', 'VISITED', 'COMPLETED'].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={cn(
              'px-4 py-2 rounded-xl text-sm font-medium transition-colors',
              filter === s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
            )}
          >
            {s === 'ALL' ? 'All' : statusConfig[s]?.label || s}
            <span className="ml-2 text-xs opacity-70">
              ({s === 'ALL' ? requests.length : requests.filter(r => r.status === s).length})
            </span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="px-6 py-3 text-muted-foreground font-medium">Patient</th>
                <th className="px-6 py-3 text-muted-foreground font-medium">Test</th>
                <th className="px-6 py-3 text-muted-foreground font-medium">Doctor</th>
                <th className="px-6 py-3 text-muted-foreground font-medium">Date</th>
                <th className="px-6 py-3 text-muted-foreground font-medium">Status</th>
                <th className="px-6 py-3 text-muted-foreground font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length > 0 ? (
                filtered.map((req) => {
                  const sc = statusConfig[req.status];
                  return (
                    <tr key={req.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium">{req.patient_name}</p>
                          <p className="text-xs text-muted-foreground">{req.patient_uhid}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium">{req.test_name}</td>
                      <td className="px-6 py-4 text-muted-foreground">Dr. {req.doctor_name}</td>
                      <td className="px-6 py-4 text-muted-foreground">{formatDate(req.created_at)}</td>
                      <td className="px-6 py-4">
                        <span className={cn('px-2.5 py-0.5 rounded-full text-xs font-medium', sc?.class)}>
                          {sc?.label || req.status}
                        </span>
                      </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            {!isAdmin && req.status === 'REQUESTED' && (
                              <button
                                onClick={() => handleMarkVisited(req.id)}
                                disabled={isMarking === req.id}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-500 text-white text-xs font-medium hover:bg-blue-600 transition-colors disabled:opacity-50"
                              >
                                {isMarking === req.id ? <ButtonLoader /> : <><Eye className="h-3 w-3" /> Visit</>}
                              </button>
                            )}
                            {!isAdmin && req.status === 'VISITED' && (
                              <button
                                onClick={() => {
                                  setReportFile(null);
                                  setNotes('');
                                  setUploadModal(req);
                                }}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500 text-white text-xs font-medium hover:bg-emerald-600 transition-colors"
                              >
                                <Upload className="h-3 w-3" /> Upload Report
                              </button>
                            )}
                            {req.status === 'COMPLETED' && req.report && (
                              <a
                                href={req.report.report_file_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-muted text-foreground text-xs font-medium hover:bg-muted/80 transition-colors"
                              >
                                <FileText className="h-3 w-3" /> View Report
                              </a>
                            )}
                            {isAdmin && req.status !== 'COMPLETED' && (
                              <span className="text-xs text-muted-foreground italic">View only</span>
                            )}
                          </div>
                        </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                    <FlaskConical className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p>No lab requests found.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upload Report Modal */}
      {uploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setUploadModal(null)}>
          <div className="bg-card rounded-2xl border border-border shadow-xl w-full max-w-md mx-4 p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">Upload Lab Report</h3>
              <button onClick={() => setUploadModal(null)} className="p-1 rounded-lg hover:bg-muted transition-colors">
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
              <p><strong>Patient:</strong> {uploadModal.patient_name}</p>
              <p><strong>Test:</strong> {uploadModal.test_name}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Report Image <span className="text-destructive">*</span>
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setReportFile(e.target.files?.[0] || null)}
                className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:bg-primary file:text-primary-foreground file:text-sm file:font-medium hover:file:bg-primary/90"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Notes (optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes about the test results..."
                rows={3}
                className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground resize-none text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setUploadModal(null)}
                className="px-4 py-2 rounded-xl text-muted-foreground hover:bg-muted transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleUploadReport}
                disabled={!reportFile || isUploading}
                className="btn-gradient flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUploading ? <ButtonLoader /> : <><Upload className="h-4 w-4" /> Upload</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
