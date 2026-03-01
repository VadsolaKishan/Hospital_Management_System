import { useState, useEffect, useRef } from 'react';
import { Calendar, Clock, User, Stethoscope, Search, Check, ChevronsUpDown } from 'lucide-react';
import { doctorService, Doctor } from '@/services/doctorService';
import { patientService, Patient } from '@/services/patientService';
import { appointmentService } from '@/services/appointmentService';
import { useAuth } from '@/context/AuthContext';
import { ButtonLoader } from '@/components/common/Loader';
import { toast } from '@/hooks/use-toast';
import { ROLES, GENDERS } from '@/utils/constants';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface AppointmentFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export const AppointmentForm = ({ onSuccess, onCancel }: AppointmentFormProps) => {
  const { user } = useAuth();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [patientProfile, setPatientProfile] = useState<Patient | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [patientSearchOpen, setPatientSearchOpen] = useState(false);
  const [formData, setFormData] = useState({
    patient: '',
    doctor: '',
    date: '',
    time: '',
    reason: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isPatient = user?.role === ROLES.PATIENT;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [doctorsData, patientsData] = await Promise.all([
          doctorService.getAvailable(),
          !isPatient ? patientService.getAll() : Promise.resolve([]),
        ]);
        setDoctors(Array.isArray(doctorsData) ? doctorsData : []);
        setPatients(Array.isArray(patientsData) ? patientsData : []);

        // If patient, get their own patient ID
        if (isPatient) {
          setProfileLoading(true);
          try {
            const myProfile = await patientService.getMyProfile();
            setPatientProfile(myProfile);
            setFormData((prev) => ({ ...prev, patient: String(myProfile.id) }));
          } catch (error) {
            console.error('Failed to fetch patient profile:', error);
            setPatientProfile(null);
          } finally {
            setProfileLoading(false);
          }
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [isPatient]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.patient) newErrors.patient = 'Patient is required';
    if (!formData.doctor) newErrors.doctor = 'Doctor is required';
    if (!formData.date) newErrors.date = 'Date is required';
    if (!formData.time) newErrors.time = 'Time is required';
    if (!formData.reason.trim()) newErrors.reason = 'Reason is required';

    // Validate date is in the future
    const selectedDate = new Date(formData.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate < today) {
      newErrors.date = 'Date must be in the future';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const patientId = parseInt(formData.patient);
      if (!patientId || isNaN(patientId)) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Invalid patient selection',
        });
        setIsSubmitting(false);
        return;
      }

      await appointmentService.create({
        patient: patientId,
        doctor: parseInt(formData.doctor),
        appointment_date: formData.date,
        appointment_time: formData.time,
        reason: formData.reason,
      });

      toast({
        title: 'Success',
        description: 'Appointment booked successfully',
      });
      onSuccess();
    } catch (error: any) {
      console.error('Failed to create appointment:', error);

      let errorMessage = 'Failed to book appointment. Please try again.';

      if (error.response?.data) {
        const data = error.response.data;
        if (data.error) {
          errorMessage = data.error;
        } else if (data.detail) {
          errorMessage = data.detail;
        } else if (data.message) {
          errorMessage = data.message;
        } else if (data.non_field_errors?.[0]) {
          errorMessage = data.non_field_errors[0];
        } else {
          for (const [key, value] of Object.entries(data)) {
            if (Array.isArray(value) && value.length > 0) {
              errorMessage = `${key}: ${value[0]}`;
              break;
            } else if (typeof value === 'string') {
              errorMessage = `${key}: ${value}`;
              break;
            }
          }
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        variant: 'destructive',
        title: 'Error',
        description: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Patient Selection */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          <User className="inline h-4 w-4 mr-2" />
          Patient
        </label>
        {isPatient ? (
          <div className="space-y-2">
            {profileLoading ? (
              <div className="input-field bg-muted py-3">
                <p className="text-sm text-muted-foreground">Loading your profile...</p>
              </div>
            ) : patientProfile ? (
              <div className="bg-green-50 border border-green-200 rounded p-3 space-y-1">
                <p className="text-sm font-medium text-green-900">{patientProfile.user_name || 'Your Profile'}</p>
                <p className="text-xs text-green-700">
                  Gender: {GENDERS.find(g => g.value === patientProfile.gender)?.label || 'Not set'} |
                  Blood Group: {patientProfile.blood_group || 'Not set'} |
                  DOB: {patientProfile.date_of_birth || 'Not set'}
                </p>
                {patientProfile.medical_history && (
                  <p className="text-xs text-green-700">Medical History: {patientProfile.medical_history}</p>
                )}
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
                <p className="text-sm text-yellow-800 mb-2">
                  <strong>Profile not found:</strong> Your patient profile will be automatically created.
                  If you still see this message after refreshing, please contact support.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <Popover open={patientSearchOpen} onOpenChange={setPatientSearchOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={patientSearchOpen}
                  className={cn(
                    "w-full justify-between",
                    errors.patient
                      ? 'border-destructive focus:outline-none focus:ring-2 focus:ring-destructive'
                      : 'border-input focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary',
                    !formData.patient && "text-muted-foreground"
                  )}
                  disabled={isLoading}
                >
                  {formData.patient
                    ? (() => {
                        const selectedPatient = patients.find(p => p.id === parseInt(formData.patient));
                        return selectedPatient
                          ? `${selectedPatient.uhid} | ${selectedPatient.user_name || `Patient #${selectedPatient.id}`}`
                          : "Select patient..."
                      })()
                    : "Select patient..."
                  }
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search patients..." />
                  <CommandList>
                    <CommandEmpty>No patient found.</CommandEmpty>
                    <CommandGroup>
                      {patients.map((patient) => (
                        <CommandItem
                          key={patient.id}
                          value={`${patient.uhid} ${patient.user_name || `Patient #${patient.id}`} ${patient.phone || ''}`}
                          onSelect={() => {
                            setFormData({ ...formData, patient: String(patient.id) });
                            setPatientSearchOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              formData.patient === String(patient.id) ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {patient.uhid} | {patient.user_name || `Patient #${patient.id}`}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              {GENDERS.find(g => g.value === patient.gender)?.label || 'Not set'} • {patient.phone || 'No phone'}
                            </span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

            {/* Selected Patient Card */}
            {formData.patient && !errors.patient && (() => {
              const selectedPatient = patients.find(p => p.id === parseInt(formData.patient));
              if (!selectedPatient) return null;
              return (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 mt-2 animate-fade-in">
                  <div className="flex items-start gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500 text-white font-bold text-lg shrink-0">
                      {selectedPatient.user_name?.charAt(0).toUpperCase() || 'P'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-blue-900 text-base">{selectedPatient.user_name}</p>
                      <p className="text-sm text-blue-700 font-medium mt-0.5">{selectedPatient.uhid}</p>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-blue-600">
                        <span className="flex items-center gap-1">
                          <span className="font-medium">Gender:</span> {GENDERS.find(g => g.value === selectedPatient.gender)?.label}
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="font-medium">Blood:</span> {selectedPatient.blood_group}
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="font-medium">DOB:</span> {selectedPatient.date_of_birth}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {errors.patient && (
              <p className="text-sm text-destructive mt-1">{errors.patient}</p>
            )}
          </div>
        )}
      </div>

      {/* Doctor Selection */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          <Stethoscope className="inline h-4 w-4 mr-2" />
          Doctor
        </label>
        <select
          value={formData.doctor}
          onChange={(e) => setFormData({ ...formData, doctor: e.target.value })}
          className={`input-field ${errors.doctor ? 'border-destructive' : ''}`}
          disabled={isLoading}
        >
          <option value="">Select a doctor</option>
          {doctors.map((doctor) => (
            <option key={doctor.id} value={doctor.id}>
              Dr. {doctor.user_name} - {doctor.specialization} ({doctor.department_name})
            </option>
          ))}
        </select>
        {errors.doctor && (
          <p className="text-sm text-destructive mt-1">{errors.doctor}</p>
        )}
      </div>

      {/* Date and Time */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            <Calendar className="inline h-4 w-4 mr-2" />
            Date
          </label>
          <input
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            min={today}
            className={`input-field ${errors.date ? 'border-destructive' : ''}`}
          />
          {errors.date && (
            <p className="text-sm text-destructive mt-1">{errors.date}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            <Clock className="inline h-4 w-4 mr-2" />
            Time
          </label>
          <input
            type="time"
            value={formData.time}
            onChange={(e) => setFormData({ ...formData, time: e.target.value })}
            className={`input-field ${errors.time ? 'border-destructive' : ''}`}
          />
          {errors.time && (
            <p className="text-sm text-destructive mt-1">{errors.time}</p>
          )}
        </div>
      </div>

      {/* Reason */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Reason for Visit
        </label>
        <textarea
          value={formData.reason}
          onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
          rows={3}
          className={`input-field ${errors.reason ? 'border-destructive' : ''}`}
          placeholder="Describe your symptoms or reason for visit..."
        />
        {errors.reason && (
          <p className="text-sm text-destructive mt-1">{errors.reason}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3 justify-end pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2.5 border border-border rounded-xl text-foreground hover:bg-muted transition-colors"
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="btn-gradient px-6 py-2.5 rounded-xl flex items-center gap-2"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <ButtonLoader />
              <span>Booking...</span>
            </>
          ) : (
            <span>Book Appointment</span>
          )}
        </button>
      </div>
    </form>
  );
};
