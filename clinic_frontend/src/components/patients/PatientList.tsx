import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Phone,
  Mail,
  Droplet,
  Calendar,
  User,
  Eye,
  Edit,
  Trash2,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { PageLoader } from '@/components/common/Loader';
import { Modal, ConfirmModal } from '@/components/common/Modal';
import { patientService, Patient } from '@/services/patientService';
import { calculateAge, getInitials, formatDate } from '@/utils/helpers';
import { ROLES, GENDERS } from '@/utils/constants';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { PatientForm } from './PatientForm';

export const PatientList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [genderFilter, setGenderFilter] = useState('ALL');
  const [showNewModal, setShowNewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    filterPatients();
  }, [patients, searchTerm, genderFilter]);

  const fetchPatients = async () => {
    try {
      const data = await patientService.getAll();
      setPatients(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch patients:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load patients',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterPatients = () => {
    let filtered = [...patients];

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.user_name?.toLowerCase().includes(search) ||
          p.user_email?.toLowerCase().includes(search) ||
          p.blood_group?.toLowerCase().includes(search)
      );
    }

    if (genderFilter !== 'ALL') {
      filtered = filtered.filter((p) => p.gender === genderFilter);
    }

    setFilteredPatients(filtered);
  };

  const handleDelete = async () => {
    if (!selectedPatient) return;
    setIsDeleting(true);
    try {
      await patientService.delete(selectedPatient.id);
      toast({
        title: 'Deleted',
        description: 'Patient record has been deleted',
      });
      setShowDeleteModal(false);
      setSelectedPatient(null);
      fetchPatients();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete patient',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const canManage = user?.role === ROLES.ADMIN || user?.role === ROLES.STAFF;

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {user?.role === ROLES.DOCTOR ? 'My Patients' : 'Patients'}
          </h1>
          <p className="text-muted-foreground">
            {user?.role === ROLES.DOCTOR
              ? 'Patients assigned to you through appointments and admissions'
              : 'Manage patient records and information'}
          </p>
        </div>
        {canManage && (
          <button onClick={() => setShowNewModal(true)} className="btn-gradient flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Patient
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="glass-card rounded-2xl p-4 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search patients..."
            className="input-field pl-12"
          />
        </div>
        <select
          value={genderFilter}
          onChange={(e) => setGenderFilter(e.target.value)}
          className="input-field appearance-none min-w-[150px]"
        >
          <option value="ALL">All Genders</option>
          {GENDERS.map((g) => (
            <option key={g.value} value={g.value}>
              {g.label}
            </option>
          ))}
        </select>
      </div>

      {/* Patients Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredPatients.length > 0 ? (
          filteredPatients.map((patient) => (
            <div
              key={patient.id}
              onClick={() => navigate(`/patients/${patient.id}`)}
              className="glass-card rounded-2xl p-6 card-hover cursor-pointer"
            >
              {/* Avatar & Name */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl gradient-secondary text-lg font-bold text-primary-foreground">
                    {getInitials(patient.user_name || 'P')}
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">
                      {patient.user_name || `Patient #${patient.id}`}
                    </h3>
                    <p className="text-sm font-medium text-primary">
                      {patient.uhid}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {calculateAge(patient.date_of_birth)} years old
                    </p>
                  </div>
                </div>
              </div>

              {/* Details */}
              <div className="space-y-3 mb-6">
                {patient.user_email && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span className="text-sm truncate">{patient.user_email}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span className="text-sm">{GENDERS.find(g => g.value === patient.gender)?.label || patient.gender}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Droplet className="h-4 w-4 text-destructive" />
                  <span className="text-sm font-medium">{patient.blood_group}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span className="text-sm">{formatDate(patient.date_of_birth)}</span>
                </div>
                {patient.emergency_contact && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span className="text-sm">{patient.emergency_contact}</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/patients/${patient.id}`);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-border py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
                >
                  <Eye className="h-4 w-4" />
                  View
                </button>
                {canManage && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/patients/${patient.id}/edit`);
                      }}
                      className="flex items-center justify-center rounded-xl border border-border px-3 py-2 text-primary hover:bg-primary/10 transition-colors"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPatient(patient);
                        setShowDeleteModal(true);
                      }}
                      className="flex items-center justify-center rounded-xl border border-border px-3 py-2 text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            No patients found
          </div>
        )}
      </div>

      {/* New Patient Modal */}
      <Modal
        isOpen={showNewModal}
        onClose={() => setShowNewModal(false)}
        title="Add New Patient"
        size="lg"
      >
        <PatientForm
          onSuccess={() => {
            setShowNewModal(false);
            fetchPatients();
          }}
          onCancel={() => setShowNewModal(false)}
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedPatient(null);
        }}
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
