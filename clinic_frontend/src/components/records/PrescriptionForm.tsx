import { useState } from 'react';
import { recordService } from '@/services/recordService';
import { ButtonLoader } from '@/components/common/Loader';
import { toast } from '@/hooks/use-toast';


interface PrescriptionFormProps {
  appointmentId: number;
  patientName: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export const PrescriptionForm = ({
  appointmentId,
  patientName,
  onSuccess,
  onCancel,
}: PrescriptionFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    diagnosis: '',
    medications: '',
    instructions: '',
    bed_required: false,
    expected_bed_days: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.diagnosis.trim()) newErrors.diagnosis = 'Diagnosis is required';
    if (!formData.medications.trim()) newErrors.medications = 'Medications are required';
    if (!formData.instructions.trim()) newErrors.instructions = 'Instructions are required';

    if (formData.bed_required) {
      if (!formData.expected_bed_days || Number(formData.expected_bed_days) <= 0) {
        newErrors.expected_bed_days = 'Please enter a valid number of days';
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const prescriptionData = {
        appointment: appointmentId,
        diagnosis: formData.diagnosis,
        medications: formData.medications,
        instructions: formData.instructions,
        bed_required: formData.bed_required,
        expected_bed_days: formData.bed_required ? Number(formData.expected_bed_days) : null,
      };

      await recordService.create(prescriptionData);
      toast({
        title: 'Success!',
        description: 'Prescription created successfully',
      });
      onSuccess();
    } catch (error: any) {
      console.error('Prescription creation error:', error);
      let errorMessage = 'Failed to create prescription';

      if (error.response?.data) {
        const data = error.response.data;
        if (typeof data === 'string') {
          errorMessage = data;
        } else if (data.detail) {
          errorMessage = data.detail;
        } else if (data.error) {
          errorMessage = data.error;
        } else {
          for (const [key, value] of Object.entries(data)) {
            if (Array.isArray(value) && value.length > 0) {
              errorMessage = `${key}: ${value[0]}`;
              break;
            }
          }
        }
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
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-sm text-blue-900">
          <strong>Patient:</strong> {patientName}
        </p>
      </div>

      {/* Diagnosis */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Diagnosis <span className="text-destructive">*</span>
        </label>
        <textarea
          value={formData.diagnosis}
          onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
          placeholder="Enter diagnosis based on examination..."
          rows={3}
          className={`w-full px-3 py-2 border rounded-lg bg-background text-foreground resize-none transition-colors ${errors.diagnosis
            ? 'border-destructive focus:outline-none focus:ring-2 focus:ring-destructive'
            : 'border-input focus:outline-none focus:ring-2 focus:ring-primary'
            }`}
        />
        {errors.diagnosis && (
          <p className="mt-1 text-sm text-destructive">⚠ {errors.diagnosis}</p>
        )}
      </div>

      {/* Medications */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Medications <span className="text-destructive">*</span>
        </label>
        <textarea
          value={formData.medications}
          onChange={(e) => setFormData({ ...formData, medications: e.target.value })}
          placeholder="Prescription details. Example:&#10;1. Paracetamol 500mg - 2 tablets twice daily for 5 days&#10;2. Rest and hydration"
          rows={4}
          className={`w-full px-3 py-2 border rounded-lg bg-background text-foreground resize-none transition-colors ${errors.medications
            ? 'border-destructive focus:outline-none focus:ring-2 focus:ring-destructive'
            : 'border-input focus:outline-none focus:ring-2 focus:ring-primary'
            }`}
        />
        {errors.medications && (
          <p className="mt-1 text-sm text-destructive">⚠ {errors.medications}</p>
        )}
      </div>

      {/* Instructions */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Instructions <span className="text-destructive">*</span>
        </label>
        <textarea
          value={formData.instructions}
          onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
          placeholder="Special instructions for patient. Example:&#10;- Take medications with food&#10;- Avoid strenuous activity&#10;- Monitor temperature&#10;- Contact if symptoms persist"
          rows={4}
          className={`w-full px-3 py-2 border rounded-lg bg-background text-foreground resize-none transition-colors ${errors.instructions
            ? 'border-destructive focus:outline-none focus:ring-2 focus:ring-destructive'
            : 'border-input focus:outline-none focus:ring-2 focus:ring-primary'
            }`}
        />
        {errors.instructions && (
          <p className="mt-1 text-sm text-destructive">⚠ {errors.instructions}</p>
        )}
      </div>

      {/* Bed Requirement */}
      <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-4">
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="bed_required"
            checked={formData.bed_required}
            onChange={(e) => setFormData({ ...formData, bed_required: e.target.checked })}
            className="w-5 h-5 text-primary border-gray-300 rounded focus:ring-primary"
          />
          <label htmlFor="bed_required" className="font-medium text-foreground cursor-pointer">
            Bed Required for Admission?
          </label>
        </div>

        {formData.bed_required && (
          <div className="pl-8 animate-in fade-in slide-in-from-top-2">
            <label className="block text-sm font-medium text-foreground mb-2">
              Expected Stay (Days) <span className="text-destructive">*</span>
            </label>
            <input
              type="number"
              min="1"
              value={formData.expected_bed_days}
              onChange={(e) => setFormData({ ...formData, expected_bed_days: e.target.value })}
              className={`w-full max-w-[200px] px-3 py-2 border rounded-lg bg-background text-foreground transition-colors ${errors.expected_bed_days
                ? 'border-destructive focus:outline-none focus:ring-2 focus:ring-destructive'
                : 'border-input focus:outline-none focus:ring-2 focus:ring-primary'
                }`}
            />
            {errors.expected_bed_days && (
              <p className="mt-1 text-sm text-destructive">⚠ {errors.expected_bed_days}</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              This request will be sent to the admin for bed allocation.
            </p>
          </div>
        )}
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
          {isSubmitting ? <ButtonLoader /> : 'Create Prescription'}
        </button>
      </div>
    </form>
  );
};
