/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useCallback } from 'react';
import { PatientFormData } from '@/types/patient';

interface UsePatientFormReturn {
  formData: PatientFormData;

  setFormData: React.Dispatch<React.SetStateAction<PatientFormData>>;
  formErrors: Record<string, string>;

  setFormErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  validateForm: () => boolean;
  handleChange: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => void;
  handleNestedChange: (
    parent: keyof PatientFormData,
    field: string,
    value: any
  ) => void;
  handleArrayChange: (
    field: 'allergies' | 'medications',
    value: string[]
  ) => void;
  addArrayItem: (field: 'allergies' | 'medications', value: string) => void;
  removeArrayItem: (field: 'allergies' | 'medications', index: number) => void;
  resetForm: () => void;
  isFormValid: boolean;
  isFormDirty: boolean;
  touchedFields: Set<string>;
  markFieldAsTouched: (fieldName: string) => void;
}

export const usePatientForm = (
  initialData: PatientFormData
): UsePatientFormReturn => {
  const [formData, setFormData] = useState<PatientFormData>(initialData);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());

  const validateForm = useCallback((): boolean => {
    const errors: Record<string, string> = {};

    // Personal Information
    if (!formData.firstName.trim()) {
      errors.firstName = 'First name is required';
    } else if (formData.firstName.trim().length < 2) {
      errors.firstName = 'First name must be at least 2 characters';
    }

    if (!formData.lastName.trim()) {
      errors.lastName = 'Last name is required';
    } else if (formData.lastName.trim().length < 2) {
      errors.lastName = 'Last name must be at least 2 characters';
    }

    // NIC Validation
    if (!formData.nic.trim()) {
      errors.nic = 'NIC is required';
    } else if (!/^[0-9]{9}[vVxX]?$|^[0-9]{12}$/.test(formData.nic.trim())) {
      errors.nic = 'Please enter a valid NIC number';
    }

    // Email Validation
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid';
    }

    // Phone Validation
    if (!formData.phone.trim()) {
      errors.phone = 'Phone number is required';
    } else if (!/^[0-9+-\s()]{10,}$/.test(formData.phone.replace(/\s/g, ''))) {
      errors.phone = 'Please enter a valid phone number';
    }

    // Date of Birth Validation
    if (!formData.dateOfBirth) {
      errors.dateOfBirth = 'Date of birth is required';
    } else {
      const birthDate = new Date(formData.dateOfBirth);
      const today = new Date();

      if (birthDate > today) {
        errors.dateOfBirth = 'Date of birth cannot be in the future';
      }

      // Check if patient is at least 1 year old
      const minDate = new Date();
      minDate.setFullYear(today.getFullYear() - 1);
      if (birthDate > minDate) {
        errors.dateOfBirth = 'Patient must be at least 1 year old';
      }
    }

    // Address Validation
    if (formData.address.street && !formData.address.city) {
      errors['address.city'] = 'City is required when address is provided';
    }

    // Emergency Contact Validation
    if (formData.emergencyContact?.name || formData.emergencyContact?.phone) {
      if (!formData.emergencyContact?.name?.trim()) {
        errors['emergencyContact.name'] = 'Emergency contact name is required';
      }
      if (!formData.emergencyContact?.phone?.trim()) {
        errors['emergencyContact.phone'] =
          'Emergency contact phone is required';
      } else if (
        !/^[0-9+-\s()]{10,}$/.test(
          (formData.emergencyContact?.phone ?? '').replace(/\s/g, '')
        )
      ) {
        errors['emergencyContact.phone'] = 'Please enter a valid phone number';
      }
      if (!formData.emergencyContact?.relationship?.trim()) {
        errors['emergencyContact.relationship'] = 'Relationship is required';
      }
    }

    // Insurance Validation
    if (formData.insurance?.provider || formData.insurance?.policyNumber) {
      if (!formData.insurance?.provider?.trim()) {
        errors['insurance.provider'] = 'Insurance provider is required';
      }
      if (!formData.insurance?.policyNumber?.trim()) {
        errors['insurance.policyNumber'] = 'Policy number is required';
      }
      if (!formData.insurance?.validUntil) {
        errors['insurance.validUntil'] = 'Valid until date is required';
      } else if (
        formData.insurance?.validUntil &&
        new Date(formData.insurance.validUntil) < new Date()
      ) {
        errors['insurance.validUntil'] = 'Insurance has expired';
      }
    }

    // Medical Information
    if (formData.height && (formData.height < 30 || formData.height > 250)) {
      errors.height = 'Height must be between 30cm and 250cm';
    }

    if (formData.weight && (formData.weight < 1 || formData.weight > 300)) {
      errors.weight = 'Weight must be between 1kg and 300kg';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData]);

  const handleChange = useCallback(
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >
    ) => {
      const { name, value, type } = e.target;
      const checked = (e.target as HTMLInputElement).checked;

      markFieldAsTouched(name);

      if (name.includes('.')) {
        const [parent, child] = name.split('.');
        setFormData(prev => {
          const parentValue = prev[parent as keyof PatientFormData];

          if (
            typeof parentValue === 'object' &&
            parentValue !== null &&
            !Array.isArray(parentValue)
          ) {
            return {
              ...prev,
              [parent]: {
                ...parentValue,
                [child]: type === 'checkbox' ? checked : value,
              },
            };
          }

          return prev;
        });
      } else {
        setFormData(prev => ({
          ...prev,
          [name]: type === 'checkbox' ? checked : value,
        }));
      }

      // Clear error when user starts typing
      if (formErrors[name]) {
        setFormErrors(prev => ({
          ...prev,
          [name]: '',
        }));
      }
    },
    [formErrors]
  );

  const handleNestedChange = useCallback(
    (parent: keyof PatientFormData, field: string, value: any) => {
      markFieldAsTouched(`${parent}.${field}`);

      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent] as any),
          [field]: value,
        },
      }));

      // Clear error
      const errorKey = `${parent}.${field}`;
      if (formErrors[errorKey]) {
        setFormErrors(prev => ({
          ...prev,
          [errorKey]: '',
        }));
      }
    },
    [formErrors]
  );

  const handleArrayChange = useCallback(
    (field: 'allergies' | 'medications', value: string[]) => {
      setFormData(prev => ({
        ...prev,
        [field]: value,
      }));
    },
    []
  );

  const addArrayItem = useCallback(
    (field: 'allergies' | 'medications', value: string) => {
      if (value.trim()) {
        setFormData(prev => ({
          ...prev,
          [field]: [...(prev[field] || []), value.trim()],
        }));
      }
    },
    []
  );

  const removeArrayItem = useCallback(
    (field: 'allergies' | 'medications', index: number) => {
      setFormData(prev => ({
        ...prev,
        [field]: (prev[field] || []).filter((_, i) => i !== index),
      }));
    },
    []
  );

  const resetForm = useCallback(() => {
    setFormData(initialData);
    setFormErrors({});
    setTouchedFields(new Set());
  }, [initialData]);

  const markFieldAsTouched = useCallback((fieldName: string) => {
    setTouchedFields(prev => new Set(prev).add(fieldName));
  }, []);

  const isFormValid = Object.keys(formErrors).length === 0;
  const isFormDirty = JSON.stringify(formData) !== JSON.stringify(initialData);

  return {
    formData,
    setFormData,
    formErrors,
    setFormErrors,
    validateForm,
    handleChange,
    handleNestedChange,
    handleArrayChange,
    addArrayItem,
    removeArrayItem,
    resetForm,
    isFormValid,
    isFormDirty,
    touchedFields,
    markFieldAsTouched,
  };
};
