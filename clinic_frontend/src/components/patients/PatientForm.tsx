import { useState, useEffect } from 'react';
import { patientService } from '@/services/patientService';
import { authService } from '@/services/authService';
import { ButtonLoader } from '@/components/common/Loader';
import { toast } from '@/hooks/use-toast';
import { GENDERS, BLOOD_GROUPS, ROLES } from '@/utils/constants';
import { User } from 'lucide-react';

interface PatientFormProps {
  initialData?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

export const PatientForm = ({ initialData, onSuccess, onCancel }: PatientFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form with initialData if present
  const [formData, setFormData] = useState({
    user: initialData?.user || '',
    first_name: initialData?.user_details?.first_name || initialData?.user_name?.split(' ')[0] || '',
    last_name: initialData?.user_details?.last_name || initialData?.user_name?.split(' ').slice(1).join(' ') || '',
    email: initialData?.user_email || '',
    password: '',
    confirm_password: '',
    date_of_birth: initialData?.date_of_birth || '',
    gender: initialData?.gender || '',
    blood_group: initialData?.blood_group || '',
    address: initialData?.address || '',
    contact_number: initialData?.user_phone || '',
    emergency_contact: initialData?.emergency_contact || '',
    medical_history: initialData?.medical_history || '',
    allergies: initialData?.allergies || '',
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        user: initialData.user || '',
        first_name: initialData.user_details?.first_name || initialData.user_name?.split(' ')[0] || '',
        last_name: initialData.user_details?.last_name || initialData.user_name?.split(' ').slice(1).join(' ') || '',
        email: initialData.user_email || '',
        password: '',
        confirm_password: '',
        date_of_birth: initialData.date_of_birth || '',
        gender: initialData.gender || '',
        blood_group: initialData.blood_group || '',
        address: initialData.address || '',
        contact_number: initialData.user_phone || '',
        emergency_contact: initialData.emergency_contact || '',
        medical_history: initialData.medical_history || '',
        allergies: initialData.allergies || '',
      });
    }
  }, [initialData]);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.first_name.trim()) newErrors.first_name = 'First name is required';
    if (!formData.last_name.trim()) newErrors.last_name = 'Last name is required';

    if (!initialData) {
      if (!formData.email) newErrors.email = 'Email is required';
      else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Invalid email';
      if (!formData.password) newErrors.password = 'Password is required';
      else if (formData.password.length < 8) newErrors.password = 'Min 8 characters';
      if (formData.password !== formData.confirm_password) newErrors.confirm_password = 'Passwords do not match';
    }

    if (!formData.date_of_birth) {
      newErrors.date_of_birth = 'Date of birth is required';
    } else {
      const dob = new Date(formData.date_of_birth);
      const today = new Date();
      if (dob > today) {
        newErrors.date_of_birth = 'Date of birth cannot be in the future';
      }
    }

    if (!formData.gender) newErrors.gender = 'Gender is required';
    if (!formData.blood_group) newErrors.blood_group = 'Blood group is required';

    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    } else if (formData.address.trim().length < 5) {
      newErrors.address = 'Address must be at least 5 characters';
    }

    if (!formData.emergency_contact.trim()) {
      newErrors.emergency_contact = 'Emergency contact is required';
    } else if (formData.emergency_contact.trim().length < 5) {
      newErrors.emergency_contact = 'Emergency contact must be at least 5 characters';
    }

    if (!formData.contact_number || formData.contact_number.trim().length < 5) {
      newErrors.contact_number = 'Contact number is required and must be at least 5 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      let userId = initialData?.user ? parseInt(initialData.user.toString()) : 0;

      if (!initialData) {
        try {
          const newUserData = {
            email: formData.email,
            password: formData.password,
            confirm_password: formData.confirm_password,
            first_name: formData.first_name,
            last_name: formData.last_name,
            phone: formData.contact_number,
            role: ROLES.PATIENT,
          };
          const authResponse = await authService.register(newUserData);
          userId = authResponse.user.id;
        } catch (authError: any) {
          console.error('Registration error:', authError);
          const errorData = authError.response?.data;
          let authMsg = 'Failed to create user account.';
          if (errorData) {
            if (typeof errorData === 'string') authMsg = errorData;
            else if (errorData.email) authMsg = `Email: ${errorData.email[0]}`;
            else if (errorData.message) authMsg = errorData.message;
          }
          toast({
            variant: 'destructive',
            title: 'User Creation Failed',
            description: authMsg,
          });
          setIsSubmitting(false);
          return;
        }
      }

      const patientData: any = {
        user: userId,
        contact_number: formData.contact_number,
        date_of_birth: formData.date_of_birth,
        gender: formData.gender,
        blood_group: formData.blood_group,
        address: formData.address,
        emergency_contact: formData.emergency_contact,
        medical_history: formData.medical_history,
        allergies: formData.allergies,
      };

      if (initialData) {
        patientData.first_name = formData.first_name;
        patientData.last_name = formData.last_name;
      }

      if (initialData?.id) {
        await patientService.update(initialData.id, patientData);
        toast({
          title: 'Success!',
          description: 'Patient updated successfully',
        });
      } else {
        await patientService.create(patientData);
        toast({
          title: 'Success!',
          description: 'Patient added successfully',
        });
      }
      onSuccess();
    } catch (error: any) {
      console.error('Patient save error:', error);
      let errorMessage = initialData ? 'Failed to update patient' : 'Failed to add patient';
      const fieldErrors: Record<string, string> = {};

      if (error.response?.data) {
        const data = error.response.data;
        if (typeof data === 'string') {
          if (data.includes('Duplicate entry') || data.includes('IntegrityError')) {
            errorMessage = 'This User ID is already associated with a patient record.';
          } else {
            errorMessage = 'A server error occurred. Please contact support.';
          }
        } else if (data.error) {
          errorMessage = data.error;
        } else if (data.detail) {
          errorMessage = data.detail;
        } else if (data.message) {
          errorMessage = data.message;
        } else {
          for (const [key, value] of Object.entries(data)) {
            if (Array.isArray(value) && value.length > 0) {
              fieldErrors[key] = value[0] as string;
            } else if (typeof value === 'string') {
              fieldErrors[key] = value;
            }
          }
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      if (Object.keys(fieldErrors).length > 0) {
        setErrors(fieldErrors);
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {initialData && initialData.uhid && (
        <div className="bg-primary/5 p-4 rounded-xl border border-primary/20 mb-6 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-primary uppercase tracking-wider">Patient UHID</p>
            <p className="text-xl font-bold text-foreground font-mono">{initialData.uhid}</p>
          </div>
          <div className="text-right">
            <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">Auto-Generated</span>
          </div>
        </div>
      )}

      <div className="space-y-4 p-5 rounded-2xl border border-border bg-card/50">
        <h3 className="font-semibold flex items-center gap-2">
          <User className="h-4 w-4 text-primary" />
          {initialData ? 'Patient Details' : 'Account Details'}
        </h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">First Name *</label>
            <input
              type="text"
              value={formData.first_name}
              onChange={e => setFormData({ ...formData, first_name: e.target.value })}
              className={`input-field w-full ${errors.first_name ? 'border-destructive' : ''}`}
            />
            {errors.first_name && (
              <p className="mt-1 text-sm text-destructive flex items-center gap-1">
                <span>⚠</span> {errors.first_name}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Last Name *</label>
            <input
              type="text"
              value={formData.last_name}
              onChange={e => setFormData({ ...formData, last_name: e.target.value })}
              className={`input-field w-full ${errors.last_name ? 'border-destructive' : ''}`}
            />
            {errors.last_name && (
              <p className="mt-1 text-sm text-destructive flex items-center gap-1">
                <span>⚠</span> {errors.last_name}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email *</label>
            <input
              type="email"
              value={formData.email}
              disabled={!!initialData}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              className={`input-field w-full ${errors.email ? 'border-destructive' : ''} ${initialData ? 'opacity-70 cursor-not-allowed bg-muted' : ''}`}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-destructive flex items-center gap-1">
                <span>⚠</span> {errors.email}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Contact Number *</label>
            <input
              type="text"
              value={formData.contact_number}
              onChange={(e) => setFormData({ ...formData, contact_number: e.target.value })}
              className={`input-field w-full ${errors.contact_number ? 'border-destructive' : ''}`}
            />
            {errors.contact_number && (
              <p className="mt-1 text-sm text-destructive flex items-center gap-1">
                <span>⚠</span> {errors.contact_number}
              </p>
            )}
          </div>
        </div>

        {!initialData && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Password *</label>
              <input
                type="password"
                value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
                className={`input-field w-full ${errors.password ? 'border-destructive' : ''}`}
              />
              {errors.password && (
                <p className="mt-1 text-sm text-destructive flex items-center gap-1">
                  <span>⚠</span> {errors.password}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Confirm Password *</label>
              <input
                type="password"
                value={formData.confirm_password}
                onChange={e => setFormData({ ...formData, confirm_password: e.target.value })}
                className={`input-field w-full ${errors.confirm_password ? 'border-destructive' : ''}`}
              />
              {errors.confirm_password && (
                <p className="mt-1 text-sm text-destructive flex items-center gap-1">
                  <span>⚠</span> {errors.confirm_password}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Date of Birth */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Date of Birth <span className="text-destructive">*</span>
          </label>
          <input
            type="date"
            value={formData.date_of_birth}
            max={new Date().toISOString().split('T')[0]}
            onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
            className={`w-full px-3 py-2 border rounded-lg bg-background text-foreground transition-colors ${errors.date_of_birth
              ? 'border-destructive focus:outline-none focus:ring-2 focus:ring-destructive'
              : 'border-input focus:outline-none focus:ring-2 focus:ring-primary'
              }`}
          />
          {errors.date_of_birth && (
            <p className="mt-1 text-sm text-destructive flex items-center gap-1">
              <span>⚠</span> {errors.date_of_birth}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Gender */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Gender <span className="text-destructive">*</span>
          </label>
          <select
            value={formData.gender}
            onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
            className={`w-full px-3 py-2 border rounded-lg bg-background text-foreground transition-colors ${errors.gender
              ? 'border-destructive focus:outline-none focus:ring-2 focus:ring-destructive'
              : 'border-input focus:outline-none focus:ring-2 focus:ring-primary'
              }`}
          >
            <option value="">Select gender</option>
            {GENDERS.map((g) => (
              <option key={g.value} value={g.value}>
                {g.label}
              </option>
            ))}
          </select>
          {errors.gender && (
            <p className="mt-1 text-sm text-destructive flex items-center gap-1">
              <span>⚠</span> {errors.gender}
            </p>
          )}
        </div>

        {/* Blood Group */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Blood Group <span className="text-destructive">*</span>
          </label>
          <select
            value={formData.blood_group}
            onChange={(e) => setFormData({ ...formData, blood_group: e.target.value })}
            className={`w-full px-3 py-2 border rounded-lg bg-background text-foreground transition-colors ${errors.blood_group
              ? 'border-destructive focus:outline-none focus:ring-2 focus:ring-destructive'
              : 'border-input focus:outline-none focus:ring-2 focus:ring-primary'
              }`}
          >
            <option value="">Select blood group</option>
            {BLOOD_GROUPS.map((bg) => (
              <option key={bg} value={bg}>
                {bg}
              </option>
            ))}
          </select>
          {errors.blood_group && (
            <p className="mt-1 text-sm text-destructive flex items-center gap-1">
              <span>⚠</span> {errors.blood_group}
            </p>
          )}
        </div>
      </div>

      {/* Address */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Address <span className="text-destructive">*</span>
        </label>
        <textarea
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          placeholder="Enter full address"
          rows={2}
          className={`w-full px-3 py-2 border rounded-lg bg-background text-foreground resize-none transition-colors ${errors.address
            ? 'border-destructive focus:outline-none focus:ring-2 focus:ring-destructive'
            : 'border-input focus:outline-none focus:ring-2 focus:ring-primary'
            }`}
        />
        {errors.address && (
          <p className="mt-1 text-sm text-destructive flex items-center gap-1">
            <span>⚠</span> {errors.address}
          </p>
        )}
      </div>

      {/* Emergency Contact */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Emergency Contact <span className="text-destructive">*</span>
        </label>
        <input
          type="text"
          value={formData.emergency_contact}
          onChange={(e) => setFormData({ ...formData, emergency_contact: e.target.value })}
          placeholder="Emergency number"
          className={`w-full px-3 py-2 border rounded-lg bg-background text-foreground transition-colors ${errors.emergency_contact
            ? 'border-destructive focus:outline-none focus:ring-2 focus:ring-destructive'
            : 'border-input focus:outline-none focus:ring-2 focus:ring-primary'
            }`}
        />
        {errors.emergency_contact && (
          <p className="mt-1 text-sm text-destructive flex items-center gap-1">
            <span>⚠</span> {errors.emergency_contact}
          </p>
        )}
      </div>

      {/* Medical History */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Medical History (Optional)
        </label>
        <textarea
          value={formData.medical_history}
          onChange={(e) => setFormData({ ...formData, medical_history: e.target.value })}
          placeholder="Any previous medical conditions, surgeries, etc."
          rows={3}
          className="input-field resize-none"
        />
      </div>

      {/* Allergies */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Allergies (Optional)
        </label>
        <input
          type="text"
          value={formData.allergies}
          onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
          placeholder="List any known allergies"
          className="input-field"
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-4 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl px-6 py-3 font-medium text-muted-foreground hover:bg-muted transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-gradient flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? <ButtonLoader /> : (initialData ? 'Save Changes' : 'Add Patient')}
        </button>
      </div>
    </form>
  );
};
