import { useState, useCallback } from 'react';
import { ValidationService, ValidationRules, ValidationResult } from '@/lib/validationService';

export interface UseFormValidationProps {
  validationRules: ValidationRules;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
}

export interface UseFormValidationReturn {
  errors: Record<string, string>;
  isValid: boolean;
  validate: (field?: string) => boolean;
  validateForm: (data: Record<string, unknown>) => ValidationResult;
  validateField: (field: string, value: unknown) => boolean;
  clearErrors: (field?: string) => void;
  clearAllErrors: () => void;
  setFieldError: (field: string, error: string) => void;
}

/**
 * Custom hook for form validation using ValidationService
 * Provides state management for form errors and validation methods
 */
export const useFormValidation = ({
  validationRules
}: UseFormValidationProps): UseFormValidationReturn => {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateField = useCallback((field: string, value: unknown): boolean => {
    const rule = validationRules[field];
    if (!rule) return true;

    const error = rule(value);
    
    setErrors(prev => ({
      ...prev,
      [field]: error || ''
    }));

    return !error;
  }, [validationRules]);

  const validate = useCallback((field?: string): boolean => {
    if (field) {
      // Validate single field - but we need the value, so this is mainly for external use
      return !errors[field];
    }
    
    // Validate all fields that have errors
    return Object.values(errors).every(error => !error);
  }, [errors]);

  const validateForm = useCallback((data: Record<string, unknown>): ValidationResult => {
    const result = ValidationService.validateFields(data, validationRules);
    setErrors(result.errors);
    return result;
  }, [validationRules]);

  const clearErrors = useCallback((field?: string) => {
    if (field) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    } else {
      setErrors({});
    }
  }, []);

  const clearAllErrors = useCallback(() => {
    setErrors({});
  }, []);

  const setFieldError = useCallback((field: string, error: string) => {
    setErrors(prev => ({
      ...prev,
      [field]: error
    }));
  }, []);

  const isValid = Object.values(errors).every(error => !error);

  return {
    errors,
    isValid,
    validate,
    validateForm,
    validateField,
    clearErrors,
    clearAllErrors,
    setFieldError
  };
};

/**
 * Hook specifically for simple field validation with automatic error display
 * Useful for individual field validation with toast notifications
 */
export const useFieldValidation = () => {
  const validateAndShow = useCallback((value: unknown, rules: Parameters<typeof ValidationService.validateField>[1]): boolean => {
    return ValidationService.validateAndShow(value, rules);
  }, []);

  const validateFormAndShow = useCallback((
    data: Record<string, unknown>, 
    validationRules: ValidationRules
  ): ValidationResult => {
    return ValidationService.validateFormAndShow(data, validationRules);
  }, []);

  return {
    validateAndShow,
    validateFormAndShow
  };
};