/* eslint-disable no-undef */
import { useState } from 'react';
import { PatientFormData } from '@/types/patient';
import { validatePatientForm, validateField } from '@/validation/patientSchema';

export const usePatientForm = (initialData: PatientFormData) => {
  const [formData, setFormData] = useState<PatientFormData>(initialData);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value, type } = e.target;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setFormData((prev: any) => ({
      ...prev,
      [name]:
        type === 'number' ? (value ? parseFloat(value) : undefined) : value,
    }));

    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleBlur = (
    e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    const result = validateField(name, value);
    if (!result.valid && result.error) {
      setFormErrors(prev => ({
        ...prev,
        [name]: result.error!,
      }));
    }
  };

  const handleSubmit = async (
    onSuccess: (data: PatientFormData) => Promise<void>
  ) => {
    setIsSubmitting(true);

    const result = validatePatientForm(formData);

    if (result.success) {
      try {
        await onSuccess(result.data as PatientFormData);
        setFormErrors({});
        return { success: true };
      } catch (error) {
        setFormErrors({ _form: 'Failed to submit form. Please try again.' });
        return { success: false, error };
      }
    } else {
      setFormErrors(result.errors || {});

      // Scroll to first error
      const firstErrorField = Object.keys(result.errors || {})[0];
      const element = document.getElementById(firstErrorField);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.focus();
      }

      return { success: false };
    }
  };

  const resetForm = () => {
    setFormData(initialData);
    setFormErrors({});
  };

  return {
    formData,
    formErrors,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    resetForm,
    setFormData,
  };
};
