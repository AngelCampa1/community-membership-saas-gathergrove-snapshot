import { toast } from 'sonner';

export interface ValidationRule {
  (value: unknown): string | null;
}

export interface ValidationRules {
  [field: string]: ValidationRule;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  firstError?: string;
}

/**
 * Centralized validation service for client-side form validation
 * Provides consistent validation rules and error messaging
 */
export class ValidationService {
  /**
   * Common validation rules
   */
  static rules = {
    required: (fieldName: string): ValidationRule => (value: unknown) => {
      if (!value || (typeof value === 'string' && !value.trim())) {
        return `${fieldName} is required`;
      }
      return null;
    },

    email: (): ValidationRule => (value: unknown) => {
      const strValue = String(value || '');
      if (!strValue) return null; // Use required rule separately
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(strValue)) {
        return 'Please enter a valid email address';
      }
      return null;
    },

    password: (): ValidationRule => (value: unknown) => {
      const strValue = String(value || '');
      if (!strValue) return null; // Use required rule separately
      
      const errors: string[] = [];
      if (strValue.length < 8) {
        errors.push('at least 8 characters');
      }
      if (!/[a-z]/.test(strValue)) {
        errors.push('one lowercase letter');
      }
      if (!/[A-Z]/.test(strValue)) {
        errors.push('one uppercase letter');
      }
      if (!/\d/.test(strValue)) {
        errors.push('one number');
      }
      if (!/[@$!%*?&]/.test(strValue)) {
        errors.push('one special character (@$!%*?&)');
      }

      if (errors.length > 0) {
        return `Password must contain ${errors.join(', ')}`;
      }
      return null;
    },

    confirmPassword: (originalPassword: string): ValidationRule => (value: unknown) => {
      const strValue = String(value || '');
      if (!strValue) return null; // Use required rule separately
      if (strValue !== originalPassword) {
        return 'Passwords do not match';
      }
      return null;
    },

    minLength: (min: number): ValidationRule => (value: unknown) => {
      const strValue = String(value || '');
      if (!strValue) return null; // Use required rule separately
      if (strValue.length < min) {
        return `Must be at least ${min} characters long`;
      }
      return null;
    },

    maxLength: (max: number): ValidationRule => (value: unknown) => {
      const strValue = String(value || '');
      if (!strValue) return null; // Use required rule separately
      if (strValue.length > max) {
        return `Must be no more than ${max} characters long`;
      }
      return null;
    },

    phone: (): ValidationRule => (value: unknown) => {
      const strValue = String(value || '');
      if (!strValue) return null; // Use required rule separately
      // Basic phone validation - adjust regex as needed for your requirements
      const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
      if (!phoneRegex.test(strValue.replace(/[\s\-\(\)]/g, ''))) {
        return 'Please enter a valid phone number';
      }
      return null;
    },

    url: (): ValidationRule => (value: unknown) => {
      const strValue = String(value || '');
      if (!strValue) return null; // Use required rule separately
      try {
        new URL(strValue);
        return null;
      } catch {
        return 'Please enter a valid URL';
      }
    },

    number: (): ValidationRule => (value: unknown) => {
      if (value === '' || value === null || value === undefined) return null; // Use required rule separately
      if (isNaN(Number(value))) {
        return 'Please enter a valid number';
      }
      return null;
    },

    min: (minimum: number): ValidationRule => (value: unknown) => {
      if (value === '' || value === null || value === undefined) return null; // Use required rule separately
      const num = Number(value);
      if (isNaN(num) || num < minimum) {
        return `Value must be at least ${minimum}`;
      }
      return null;
    },

    max: (maximum: number): ValidationRule => (value: unknown) => {
      if (value === '' || value === null || value === undefined) return null; // Use required rule separately
      const num = Number(value);
      if (isNaN(num) || num > maximum) {
        return `Value must be no more than ${maximum}`;
      }
      return null;
    },

    membershipTypeName: (): ValidationRule => (value: unknown) => {
      const strValue = String(value || '');
      if (!strValue) return null; // Use required rule separately
      if (strValue.length < 2) {
        return 'Membership type name must be at least 2 characters';
      }
      if (strValue.length > 50) {
        return 'Membership type name must be no more than 50 characters';
      }
      return null;
    },

    eventTitle: (): ValidationRule => (value: unknown) => {
      const strValue = String(value || '');
      if (!strValue) return null; // Use required rule separately
      if (strValue.length < 3) {
        return 'Event title must be at least 3 characters';
      }
      if (strValue.length > 100) {
        return 'Event title must be no more than 100 characters';
      }
      return null;
    },

    clubName: (): ValidationRule => (value: unknown) => {
      const strValue = String(value || '');
      if (!strValue) return null; // Use required rule separately
      if (strValue.length < 2) {
        return 'Club name must be at least 2 characters';
      }
      if (strValue.length > 100) {
        return 'Club name must be no more than 100 characters';
      }
      return null;
    }
  };

  /**
   * Validate a single field with multiple rules
   */
  static validateField(value: unknown, rules: ValidationRule[]): string | null {
    for (const rule of rules) {
      const error = rule(value);
      if (error) {
        return error;
      }
    }
    return null;
  }

  /**
   * Validate multiple fields with their respective rules
   */
  static validateFields(data: Record<string, unknown>, validationRules: ValidationRules): ValidationResult {
    const errors: Record<string, string> = {};
    let firstError: string | undefined;

    for (const [field, rule] of Object.entries(validationRules)) {
      const error = rule(data[field]);
      if (error) {
        errors[field] = error;
        if (!firstError) {
          firstError = error;
        }
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      firstError
    };
  }

  /**
   * Show validation error using toast
   */
  static showValidationError(message: string): void {
    toast.error(message, {
      className: 'validation-error',
      duration: 4000,
    });
  }

  /**
   * Validate and show error if validation fails
   * Returns true if valid, false if invalid
   */
  static validateAndShow(value: unknown, rules: ValidationRule[]): boolean {
    const error = this.validateField(value, rules);
    if (error) {
      this.showValidationError(error);
      return false;
    }
    return true;
  }

  /**
   * Validate form data and show first error if validation fails
   * Returns validation result
   */
  static validateFormAndShow(data: Record<string, unknown>, validationRules: ValidationRules): ValidationResult {
    const result = this.validateFields(data, validationRules);
    if (!result.isValid && result.firstError) {
      this.showValidationError(result.firstError);
    }
    return result;
  }

  /**
   * Common validation schemas for frequently used forms
   */
  static schemas = {
    login: {
      email: this.rules.email(),
      password: this.rules.required('Password')
    },

    register: {
      fullName: this.rules.required('Full name'),
      email: this.rules.email(),
      password: this.rules.password(),
      clubName: this.rules.clubName()
    },

    forgotPassword: {
      email: this.rules.email()
    },

    resetPassword: (newPassword: string) => ({
      newPassword: this.rules.password(),
      confirmPassword: this.rules.confirmPassword(newPassword)
    }),

    membershipType: {
      name: this.rules.membershipTypeName(),
      description: this.rules.maxLength(500)
    },

    event: {
      title: this.rules.eventTitle(),
      description: this.rules.maxLength(1000),
      startDateTime: this.rules.required('Start date and time'),
      endDateTime: this.rules.required('End date and time')
    },

    member: {
      firstName: this.rules.required('First name'),
      lastName: this.rules.required('Last name'),
      email: this.rules.email(),
      phone: this.rules.phone()
    },

    payment: {
      amount: this.rules.min(0.01),
      description: this.rules.required('Description')
    },

    adminInvite: {
      email: this.rules.email()
    },

    chatMessage: {
      messageContent: this.rules.required('Message')
    }
  };
}

// Export commonly used validation rules for convenience
export const { rules, validateField, validateFields, showValidationError, validateAndShow, validateFormAndShow, schemas } = ValidationService;