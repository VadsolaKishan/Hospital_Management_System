import { useState, useEffect } from 'react';
import { FlaskConical, Download, FileText, Clock, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { labService, LabRequest } from '@/services/labService';
import { PageLoader } from '@/components/common/Loader';
import { Breadcrumbs } from '@/components/common/Breadcrumbs';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { formatDate } from '@/utils/helpers';

const statusConfig: Record<string, { label: string; class: string; icon: any }> = {
  REQUESTED: { label: 'Pending', class: 'bg-orange-100 text-orange-700', icon: Clock },
  VISITED: { label: 'In Progress', class: 'bg-blue-100 text-blue-700', icon: FlaskConical },
  COMPLETED: { label: 'Completed', class: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
};

export const MyLabReports = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState<LabRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>('ALL');

  useEffect(() => {
    const fetchReports = async () => {
      try {
        // Get all lab requests for the current patient
        const data = await labService.getRequests();
        setReports(data);
      } catch (error) {
        console.error('Failed to fetch lab reports:', error);
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to load lab reports' });
      } finally {
        setIsLoading(false);
      }
    };
    fetchReports();
  }, []);

  const filtered = filter === 'ALL' ? reports : reports.filter(r => r.status === filter);

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Breadcrumbs />
          <h1 className="text-2xl font-bold text-foreground tracking-tight">My Lab Reports</h1>
          <p className="text-muted-foreground">View your laboratory test reports</p>
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
              ({s === 'ALL' ? reports.length : reports.filter(r => r.status === s).length})
            </span>
          </button>
        ))}
      </div>

      {/* Reports Grid */}
      {filtered.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((report) => {
            const sc = statusConfig[report.status];
            return (
              <div
                key={report.id}
                className="group relative rounded-2xl border border-border bg-card p-6 shadow-sm transition-all duration-500 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-2 hover:border-primary/30 overflow-hidden"
              >
                {/* Gradient glow effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="relative z-10">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-100 to-purple-50 group-hover:from-purple-200 group-hover:to-purple-100 transition-colors duration-300 shadow-sm">
                        <FlaskConical className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors duration-300">{report.test_name}</h3>
                        <p className="text-sm text-muted-foreground">Dr. {report.doctor_name}</p>
                      </div>
                    </div>
                    <span className={cn('px-2.5 py-1 rounded-full text-xs font-medium shadow-sm', sc?.class)}>
                      {sc?.label || report.status}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Requested:</span>
                      <span className="font-medium">{formatDate(report.created_at)}</span>
                    </div>
                    {report.report?.uploaded_at && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Completed:</span>
                        <span className="font-medium">{formatDate(report.report.uploaded_at)}</span>
                      </div>
                    )}
                  </div>

                  {report.report?.notes && (
                    <div className="mt-4 p-3 rounded-xl bg-muted/30 text-sm border border-border/50">
                      <p className="text-muted-foreground font-medium mb-1">Notes:</p>
                      <p className="text-foreground">{report.report.notes}</p>
                    </div>
                  )}

                  {report.status === 'COMPLETED' && report.report?.report_file_url ? (
                    <a
                      href={report.report.report_file_url.replace('/upload/', '/upload/fl_attachment/')}
                      download
                      className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-medium hover:from-primary/90 hover:to-primary/70 transition-all duration-300 shadow-md hover:shadow-lg hover:shadow-primary/20"
                    >
                      <Download className="h-4 w-4" />
                      Download Report
                    </a>
                  ) : (
                    <div className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-muted/50 text-muted-foreground border border-border/50">
                      <Clock className="h-4 w-4 animate-pulse" />
                      {report.status === 'REQUESTED' ? 'Awaiting Visit' : 'Processing...'}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card p-12 text-center">
          <FlaskConical className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No Lab Reports</h3>
          <p className="text-muted-foreground">
            {filter === 'ALL'
              ? "You don't have any lab test requests yet."
              : `No ${statusConfig[filter]?.label.toLowerCase() || filter.toLowerCase()} reports found.`}
          </p>
        </div>
      )}
    </div>
  );
};
