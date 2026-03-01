import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Search,
  Calendar,
  User,
  Stethoscope,
  Printer,
  Eye,
} from 'lucide-react';
import { PageLoader } from '@/components/common/Loader';
import { recordService, Prescription } from '@/services/recordService';
import { formatDate, getInitials } from '@/utils/helpers';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export const PrescriptionList = () => {
  const navigate = useNavigate();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [filteredPrescriptions, setFilteredPrescriptions] = useState<Prescription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      setFilteredPrescriptions(
        prescriptions.filter(
          (p) =>
            p.patient_name?.toLowerCase().includes(search) ||
            p.doctor_name?.toLowerCase().includes(search) ||
            p.diagnosis?.toLowerCase().includes(search)
        )
      );
    } else {
      setFilteredPrescriptions(prescriptions);
    }
  }, [prescriptions, searchTerm]);

  const fetchPrescriptions = async () => {
    try {
      const data = await recordService.getAll();
      setPrescriptions(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch prescriptions:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load prescriptions',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Medical Records</h1>
          <p className="text-muted-foreground">View prescriptions and medical history</p>
        </div>
      </div>

      {/* Search */}
      <div className="glass-card rounded-2xl p-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by patient, doctor, or diagnosis..."
            className="input-field pl-12"
          />
        </div>
      </div>

      {/* Prescriptions Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredPrescriptions.length > 0 ? (
          filteredPrescriptions.map((prescription) => (
            <div
              key={prescription.id}
              onClick={() => navigate(`/records/${prescription.id}`)}
              className="glass-card rounded-2xl p-6 card-hover cursor-pointer"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <span className="text-sm text-muted-foreground">
                  {formatDate(prescription.created_at)}
                </span>
              </div>

              {/* Diagnosis */}
              <h3 className="font-semibold text-foreground mb-2 line-clamp-1">
                {prescription.diagnosis}
              </h3>

              {/* Details */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span className="text-sm">
                    {prescription.patient_name || `Patient #${prescription.patient}`}
                    {prescription.patient_uhid && (
                      <span className="text-xs font-mono text-primary ml-2">({prescription.patient_uhid})</span>
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Stethoscope className="h-4 w-4" />
                  <span className="text-sm">
                    Dr. {prescription.doctor_name || `#${prescription.doctor}`}
                  </span>
                </div>
                {prescription.follow_up_date && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span className="text-sm">
                      Follow-up: {formatDate(prescription.follow_up_date)}
                    </span>
                  </div>
                )}
              </div>

              {/* Medications Preview */}
              <div className="mb-4 p-3 rounded-xl bg-muted/50">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {prescription.medications}
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/records/${prescription.id}`);
                  }}
                  className="w-full flex items-center justify-center gap-2 rounded-xl border border-border py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
                >
                  <Eye className="h-4 w-4" />
                  View Details
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full">
            <div className="glass-card rounded-2xl p-12 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted mx-auto mb-4">
                <FileText className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">No Medical Records Yet</h3>
              <p className="text-muted-foreground mb-4">
                Medical records and prescriptions will appear here once doctors create them during or after appointments.
              </p>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>✓ Book an appointment with a doctor</p>
                <p>✓ Doctor will complete the appointment and create a prescription</p>
                <p>✓ Prescription will appear in your medical records</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
