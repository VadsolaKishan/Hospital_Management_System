import { useState } from 'react';
import { doctorService, Department } from '@/services/doctorService';
import { ButtonLoader } from '@/components/common/Loader';
import { toast } from '@/hooks/use-toast';
import { ArrowRight, ArrowLeft } from 'lucide-react';

interface DoctorFormProps {
  departments: Department[];
  onSuccess: () => void;
  onCancel: () => void;
}

export const DoctorForm = ({ departments, onSuccess, onCancel }: DoctorFormProps) => {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    // Step 1: Basic Info
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    password: '',
    confirm_password: '',
    
    // Step 2: Doctor Info
    department: '',
    specialization: '',
    qualification: '',
    experience_years: '',
    consultation_fee: '',
    license_number: '',
    bio: '',
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.first_name.trim()) newErrors.first_name = 'First name is required';
    if (!formData.last_name.trim()) newErrors.last_name = 'Last name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Invalid email format';
    if (!formData.phone.trim()) newErrors.phone = 'Phone is required';
    
    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    
    if (formData.password !== formData.confirm_password) newErrors.confirm_password = 'Passwords do not match';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.department) newErrors.department = 'Department is required';
    if (!formData.specialization.trim()) newErrors.specialization = 'Specialization is required';
    if (!formData.qualification.trim()) newErrors.qualification = 'Qualification is required';
    if (formData.experience_years === '') newErrors.experience_years = 'Experience is required';
    if (formData.consultation_fee === '') newErrors.consultation_fee = 'Consultation fee is required';
    if (!formData.license_number.trim()) newErrors.license_number = 'License number is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep1()) {
      setStep(2);
    }
  };

  const handleBack = () => {
    setStep(1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep2()) return;

    setIsSubmitting(true);
    try {
      const docData = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        department: parseInt(formData.department),
        specialization: formData.specialization,
        qualification: formData.qualification,
        experience_years: parseInt(formData.experience_years),
        consultation_fee: parseFloat(formData.consultation_fee),
        license_number: formData.license_number,
        bio: formData.bio,
      };

      await doctorService.createNewDoctor(docData);
      toast({
        title: 'Success!',
        description: 'Doctor account created successfully',
      });
      onSuccess();
    } catch (error: any) {
       let errorMessage = 'Failed to create doctor account';

      if (error.response?.data) {
        const data = error.response.data;
        if (typeof data === 'string') {
          errorMessage = data;
        } else if (data.error) {
          errorMessage = data.error;
        } else if (data.detail) {
          errorMessage = data.detail;
        } else if (data.message) {
          errorMessage = data.message;
        } else if (data.non_field_errors?.[0]) {
          errorMessage = data.non_field_errors[0];
        } else {
          // Flatten first error found
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


  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in">
      
      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-2 mb-6">
         <div className={`w-3 h-3 rounded-full ${step >= 1 ? 'bg-emerald-500' : 'bg-slate-200'}`} />
         <div className={`w-12 h-1 rounded-full ${step >= 2 ? 'bg-emerald-500' : 'bg-slate-200'}`} />
         <div className={`w-3 h-3 rounded-full ${step >= 2 ? 'bg-emerald-500' : 'bg-slate-200'}`} />
      </div>

      {step === 1 && (
        <div className="space-y-4 animate-fade-in">
           <h3 className="text-lg font-medium text-foreground">Step 1: Personal Details</h3>
           <div className="grid grid-cols-2 gap-4">
              <div className="col-span-1">
                <label className="block text-sm font-medium text-foreground mb-2">First Name</label>
                <input
                  type="text"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  className={`input-field ${errors.first_name ? 'border-destructive' : ''}`}
                />
                {errors.first_name && <p className="mt-1 text-xs text-destructive">{errors.first_name}</p>}
              </div>
              <div className="col-span-1">
                <label className="block text-sm font-medium text-foreground mb-2">Last Name</label>
                <input
                  type="text"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  className={`input-field ${errors.last_name ? 'border-destructive' : ''}`}
                />
                {errors.last_name && <p className="mt-1 text-xs text-destructive">{errors.last_name}</p>}
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-foreground mb-2">Email (Username)</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={`input-field ${errors.email ? 'border-destructive' : ''}`}
                  placeholder="doctor@hospital.com"
                />
                {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email}</p>}
              </div>
              
              <div className="col-span-2">
                <label className="block text-sm font-medium text-foreground mb-2">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className={`input-field ${errors.phone ? 'border-destructive' : ''}`}
                />
                {errors.phone && <p className="mt-1 text-xs text-destructive">{errors.phone}</p>}
              </div>

               <div className="col-span-1">
                <label className="block text-sm font-medium text-foreground mb-2">Password</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className={`input-field ${errors.password ? 'border-destructive' : ''}`}
                  placeholder="Min 8 characters"
                />
                {errors.password && <p className="mt-1 text-xs text-destructive">{errors.password}</p>}
              </div>
              <div className="col-span-1">
                <label className="block text-sm font-medium text-foreground mb-2">Confirm Password</label>
                <input
                  type="password"
                  value={formData.confirm_password}
                  onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
                  className={`input-field ${errors.confirm_password ? 'border-destructive' : ''}`}
                />
                {errors.confirm_password && <p className="mt-1 text-xs text-destructive">{errors.confirm_password}</p>}
              </div>
           </div>
           
           <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="btn-gradient px-6 py-2 flex items-center gap-2"
              >
                Next Step <ArrowRight className="w-4 h-4" />
              </button>
           </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4 animate-fade-in">
           <h3 className="text-lg font-medium text-foreground">Step 2: Professional Details</h3>
           <div className="grid grid-cols-2 gap-4">
            {/* Department */}
            <div className="col-span-2">
            <label className="block text-sm font-medium text-foreground mb-2">
              Department
            </label>
            <select
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              className={`input-field ${errors.department ? 'border-destructive' : ''}`}
            >
              <option value="">Select department</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
            {errors.department && (
              <p className="mt-1 text-xs text-destructive">{errors.department}</p>
            )}
            </div>

            {/* Specialization */}
            <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Specialization
            </label>
            <input
              type="text"
              value={formData.specialization}
              onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
              placeholder="e.g., Cardiology"
              className={`input-field ${errors.specialization ? 'border-destructive' : ''}`}
            />
            {errors.specialization && (
              <p className="mt-1 text-xs text-destructive">{errors.specialization}</p>
            )}
            </div>

            {/* Qualification */}
            <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Qualification
            </label>
            <input
              type="text"
              value={formData.qualification}
              onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
              placeholder="e.g., MBBS, MD"
              className={`input-field ${errors.qualification ? 'border-destructive' : ''}`}
            />
            {errors.qualification && (
              <p className="mt-1 text-xs text-destructive">{errors.qualification}</p>
            )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {/* Experience */}
            <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Exp. (yrs)
            </label>
            <input
              type="number"
              min="0"
              value={formData.experience_years}
              onChange={(e) => setFormData({ ...formData, experience_years: e.target.value })}
              placeholder="e.g. 5"
              className={`input-field ${errors.experience_years ? 'border-destructive' : ''}`}
            />
            {errors.experience_years && (
              <p className="mt-1 text-xs text-destructive">{errors.experience_years}</p>
            )}
            </div>

            {/* Consultation Fee */}
            <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Fee (₹)
            </label>
            <input
              type="number"
              min="0"
              value={formData.consultation_fee}
              onChange={(e) => setFormData({ ...formData, consultation_fee: e.target.value })}
              placeholder="e.g. 500"
              className={`input-field ${errors.consultation_fee ? 'border-destructive' : ''}`}
            />
            {errors.consultation_fee && (
              <p className="mt-1 text-xs text-destructive">{errors.consultation_fee}</p>
            )}
            </div>

            {/* License Number */}
            <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              License No.
            </label>
            <input
              type="text"
              value={formData.license_number}
              onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
              placeholder="e.g. LIC-123456"
              className={`input-field ${errors.license_number ? 'border-destructive' : ''}`}
            />
            {errors.license_number && (
              <p className="mt-1 text-xs text-destructive">{errors.license_number}</p>
            )}
            </div>
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Bio (Optional)
            </label>
            <textarea
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              placeholder="Brief description..."
              rows={2}
              className="input-field resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-between gap-4 pt-4">
            <button
              type="button"
              onClick={handleBack}
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted rounded-lg flex items-center gap-1"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-gradient px-6 py-2 flex items-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? <ButtonLoader /> : 'Create Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
};
