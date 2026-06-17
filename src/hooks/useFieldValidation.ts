import { useCallback } from 'react';

export const useFieldValidation = (
  errors: Record<string, string>,
  touchedFields: Set<string>
) => {
  const getFieldError = useCallback(
    (fieldName: string): string | undefined => {
      return touchedFields.has(fieldName) ? errors[fieldName] : undefined;
    },
    [errors, touchedFields]
  );

  const getFieldClassName = useCallback(
    (fieldName: string): string => {
      const hasError = touchedFields.has(fieldName) && errors[fieldName];
      return hasError
        ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
        : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500';
    },
    [errors, touchedFields]
  );

  const isFieldValid = useCallback(
    (fieldName: string): boolean => {
      return !errors[fieldName] || !touchedFields.has(fieldName);
    },
    [errors, touchedFields]
  );

  return {
    getFieldError,
    getFieldClassName,
    isFieldValid,
  };
};
