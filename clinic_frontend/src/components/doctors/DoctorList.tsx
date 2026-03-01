import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Star,
  Clock,
  DollarSign,
  Calendar,
  Stethoscope,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { PageLoader } from '@/components/common/Loader';
import { Modal } from '@/components/common/Modal';
import { doctorService, Doctor, Department } from '@/services/doctorService';
import { formatCurrency, getInitials } from '@/utils/helpers';
import { ROLES } from '@/utils/constants';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { DoctorForm } from './DoctorForm';

export const DoctorList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [showNewModal, setShowNewModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterDoctors();
  }, [doctors, searchTerm, departmentFilter]);

  const fetchData = async () => {
    try {
      const [doctorsData, deptData] = await Promise.all([
        doctorService.getAll(),
        doctorService.getDepartments(),
      ]);
      setDoctors(Array.isArray(doctorsData) ? doctorsData : []);
      setDepartments(Array.isArray(deptData) ? deptData : []);
    } catch (error) {
      console.error('Failed to fetch doctors:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load doctors',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterDoctors = () => {
    let filtered = [...doctors];

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (doc) =>
          doc.user_name?.toLowerCase().includes(search) ||
          doc.specialization?.toLowerCase().includes(search)
      );
    }

    if (departmentFilter !== 'ALL') {
      filtered = filtered.filter((doc) => doc.department === parseInt(departmentFilter));
    }

    setFilteredDoctors(filtered);
  };

  const canManage = user?.role === ROLES.ADMIN || user?.role === ROLES.STAFF;

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Doctors</h1>
          <p className="text-muted-foreground">Browse and find healthcare professionals</p>
        </div>
        {canManage && (
          <button onClick={() => setShowNewModal(true)} className="btn-gradient flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Doctor
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
            placeholder="Search doctors by name or specialization..."
            className="input-field pl-12 bg-background/50 focus:bg-background transition-all"
          />
        </div>
        <select
          value={departmentFilter}
          onChange={(e) => setDepartmentFilter(e.target.value)}
          className="input-field appearance-none min-w-[180px]"
        >
          <option value="ALL">All Departments</option>
          {departments.map((dept) => (
            <option key={dept.id} value={dept.id}>
              {dept.name}
            </option>
          ))}
        </select>
      </div>

      {/* Doctors Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredDoctors.length > 0 ? (
          filteredDoctors.map((doctor) => (
            <div
              key={doctor.id}
              className="glass-card rounded-2xl p-6 card-hover"
            >
              {/* Avatar & Name */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl gradient-primary text-lg font-bold text-primary-foreground">
                    {getInitials(doctor.user_name || 'Dr')}
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">
                      Dr. {doctor.user_name || `Doctor #${doctor.id}`}
                    </h3>
                    <p className="text-sm text-primary font-medium">{doctor.specialization}</p>
                  </div>
                </div>
                {doctor.is_available && (
                  <span className="badge badge-approved shadow-sm shadow-success/20">Available</span>
                )}
              </div>

              {/* Details */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-muted-foreground group/item">
                  <div className="p-2 rounded-full bg-primary/5 text-primary group-hover/item:bg-primary/10 transition-colors">
                    <Stethoscope className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-medium">{doctor.department_name || 'General'}</span>
                </div>
                <div className="flex items-center gap-3 text-muted-foreground group/item">
                  <div className="p-2 rounded-full bg-primary/5 text-primary group-hover/item:bg-primary/10 transition-colors">
                    <Clock className="h-4 w-4" />
                  </div>
                  <span className="text-sm">{doctor.experience_years} years experience</span>
                </div>
                <div className="flex items-center gap-3 text-muted-foreground group/item">
                  <div className="p-2 rounded-full bg-primary/5 text-primary group-hover/item:bg-primary/10 transition-colors">
                    <DollarSign className="h-4 w-4" />
                  </div>
                  <span className="text-sm">{formatCurrency(doctor.consultation_fee)}</span>
                </div>
                <div className="flex items-center gap-3 text-muted-foreground group/item">
                  <div className="p-2 rounded-full bg-warning/5 text-warning group-hover/item:bg-warning/10 transition-colors">
                    <Star className="h-4 w-4 fill-warning" />
                  </div>
                  <span className="text-sm">4.8 (120 reviews)</span>
                </div>
              </div>

              {/* Bio */}
              {doctor.bio && (
                <p className="text-sm text-muted-foreground mb-6 line-clamp-2">
                  {doctor.bio}
                </p>
              )}

              {/* Actions */}
              {user?.role === ROLES.PATIENT && (
                <div className="flex gap-3">
                  <button
                    onClick={() => navigate('/appointments/new', { state: { doctorId: doctor.id } })}
                    className="btn-gradient flex-1 text-sm py-2"
                  >
                    <Calendar className="h-4 w-4 inline mr-2" />
                    Book Appointment
                  </button>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            No doctors found
          </div>
        )}
      </div>

      {/* New Doctor Modal */}
      <Modal
        isOpen={showNewModal}
        onClose={() => setShowNewModal(false)}
        title="Add New Doctor"
        size="lg"
      >
        <DoctorForm
          departments={departments}
          onSuccess={() => {
            setShowNewModal(false);
            fetchData();
          }}
          onCancel={() => setShowNewModal(false)}
        />
      </Modal>
    </div>
  );
};
