/**
 * useFormValidation Tests - Full Coverage
 */

import { renderHook, act } from '@testing-library/react';
import { useFormValidation, useFieldValidation } from '../useFormValidation';
import { ValidationService } from '@/lib/validationService';

// Mock ValidationService
jest.mock('@/lib/validationService', () => ({
  ValidationService: {
    validateFields: jest.fn(),
    validateField: jest.fn(),
    validateAndShow: jest.fn(),
    validateFormAndShow: jest.fn(),
  },
}));

describe('useFormValidation', () => {
  const mockValidationRules = {
    email: (value: unknown) => {
      if (!value) return 'Email is required';
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(String(value)) ? '' : 'Invalid email format';
    },
    password: (value: unknown) => {
      if (!value) return 'Password is required';
      return String(value).length >= 8 ? '' : 'Password must be at least 8 characters';
    },
    username: (value: unknown) => {
      if (!value) return 'Username is required';
      return String(value).length >= 3 ? '' : 'Username must be at least 3 characters';
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should initialize with empty errors and isValid true', () => {
      const { result } = renderHook(() =>
        useFormValidation({ validationRules: mockValidationRules })
      );

      expect(result.current.errors).toEqual({});
      expect(result.current.isValid).toBe(true);
    });

    it('should initialize with provided validation rules', () => {
      const { result } = renderHook(() =>
        useFormValidation({ validationRules: mockValidationRules })
      );

      expect(result.current.validateField).toBeDefined();
      expect(result.current.validateForm).toBeDefined();
    });
  });

  describe('validateField', () => {
    it('should validate field and set error when invalid', () => {
      const { result } = renderHook(() =>
        useFormValidation({ validationRules: mockValidationRules })
      );

      act(() => {
        const isValid = result.current.validateField('email', '');
        expect(isValid).toBe(false);
      });

      expect(result.current.errors.email).toBe('Email is required');
      expect(result.current.isValid).toBe(false);
    });

    it('should validate field and clear error when valid', () => {
      const { result } = renderHook(() =>
        useFormValidation({ validationRules: mockValidationRules })
      );

      // Set initial error
      act(() => {
        result.current.validateField('email', '');
      });
      expect(result.current.errors.email).toBe('Email is required');

      // Validate with valid email
      act(() => {
        const isValid = result.current.validateField('email', 'test@example.com');
        expect(isValid).toBe(true);
      });

      expect(result.current.errors.email).toBe('');
      expect(result.current.isValid).toBe(true);
    });

    it('should return true for field without validation rule', () => {
      const { result } = renderHook(() =>
        useFormValidation({ validationRules: mockValidationRules })
      );

      act(() => {
        const isValid = result.current.validateField('nonexistent', 'value');
        expect(isValid).toBe(true);
      });

      expect(result.current.errors.nonexistent).toBeUndefined();
    });

    it('should validate password field correctly', () => {
      const { result } = renderHook(() =>
        useFormValidation({ validationRules: mockValidationRules })
      );

      act(() => {
        const isValid = result.current.validateField('password', 'short');
        expect(isValid).toBe(false);
      });

      expect(result.current.errors.password).toBe('Password must be at least 8 characters');
    });

    it('should validate multiple fields independently', () => {
      const { result } = renderHook(() =>
        useFormValidation({ validationRules: mockValidationRules })
      );

      act(() => {
        result.current.validateField('email', 'invalid');
        result.current.validateField('password', 'validpassword123');
      });

      expect(result.current.errors.email).toBe('Invalid email format');
      expect(result.current.errors.password).toBe('');
      expect(result.current.isValid).toBe(false);
    });
  });

  describe('validate', () => {
    it('should return true when no errors exist', () => {
      const { result } = renderHook(() =>
        useFormValidation({ validationRules: mockValidationRules })
      );

      const isValid = result.current.validate();
      expect(isValid).toBe(true);
    });

    it('should return false when errors exist', () => {
      const { result } = renderHook(() =>
        useFormValidation({ validationRules: mockValidationRules })
      );

      act(() => {
        result.current.validateField('email', '');
      });

      const isValid = result.current.validate();
      expect(isValid).toBe(false);
    });

    it('should validate specific field by name', () => {
      const { result } = renderHook(() =>
        useFormValidation({ validationRules: mockValidationRules })
      );

      act(() => {
        result.current.setFieldError('email', 'Some error');
        result.current.setFieldError('password', '');
      });

      const emailValid = result.current.validate('email');
      const passwordValid = result.current.validate('password');

      expect(emailValid).toBe(false);
      expect(passwordValid).toBe(true);
    });

    it('should return true for all fields when all errors are empty', () => {
      const { result } = renderHook(() =>
        useFormValidation({ validationRules: mockValidationRules })
      );

      act(() => {
        result.current.validateField('email', 'test@example.com');
        result.current.validateField('password', 'validpass123');
      });

      expect(result.current.validate()).toBe(true);
    });
  });

  describe('validateForm', () => {
    it('should validate entire form and set errors', () => {
      const mockValidationResult = {
        isValid: false,
        errors: {
          email: 'Invalid email',
          password: 'Password too short',
        },
      };

      (ValidationService.validateFields as jest.Mock).mockReturnValue(mockValidationResult);

      const { result } = renderHook(() =>
        useFormValidation({ validationRules: mockValidationRules })
      );

      let validationResult;
      act(() => {
        validationResult = result.current.validateForm({
          email: 'invalid',
          password: 'short',
        });
      });

      expect(ValidationService.validateFields).toHaveBeenCalledWith(
        { email: 'invalid', password: 'short' },
        mockValidationRules
      );
      expect(validationResult).toEqual(mockValidationResult);
      expect(result.current.errors).toEqual(mockValidationResult.errors);
      expect(result.current.isValid).toBe(false);
    });

    it('should validate form with valid data', () => {
      const mockValidationResult = {
        isValid: true,
        errors: {},
      };

      (ValidationService.validateFields as jest.Mock).mockReturnValue(mockValidationResult);

      const { result } = renderHook(() =>
        useFormValidation({ validationRules: mockValidationRules })
      );

      let validationResult;
      act(() => {
        validationResult = result.current.validateForm({
          email: 'test@example.com',
          password: 'validpassword',
        });
      });

      expect(validationResult).toEqual(mockValidationResult);
      expect(result.current.isValid).toBe(true);
    });

    it('should update errors state from ValidationService result', () => {
      const mockValidationResult = {
        isValid: false,
        errors: {
          username: 'Username too short',
        },
      };

      (ValidationService.validateFields as jest.Mock).mockReturnValue(mockValidationResult);

      const { result } = renderHook(() =>
        useFormValidation({ validationRules: mockValidationRules })
      );

      act(() => {
        result.current.validateForm({ username: 'ab' });
      });

      expect(result.current.errors.username).toBe('Username too short');
    });
  });

  describe('clearErrors', () => {
    it('should clear specific field error', () => {
      const { result } = renderHook(() =>
        useFormValidation({ validationRules: mockValidationRules })
      );

      act(() => {
        result.current.setFieldError('email', 'Email error');
        result.current.setFieldError('password', 'Password error');
      });

      expect(result.current.errors.email).toBe('Email error');

      act(() => {
        result.current.clearErrors('email');
      });

      expect(result.current.errors.email).toBe('');
      expect(result.current.errors.password).toBe('Password error');
    });

    it('should clear all errors when no field specified', () => {
      const { result } = renderHook(() =>
        useFormValidation({ validationRules: mockValidationRules })
      );

      act(() => {
        result.current.setFieldError('email', 'Email error');
        result.current.setFieldError('password', 'Password error');
      });

      act(() => {
        result.current.clearErrors();
      });

      expect(result.current.errors).toEqual({});
      expect(result.current.isValid).toBe(true);
    });

    it('should handle clearing non-existent field', () => {
      const { result } = renderHook(() =>
        useFormValidation({ validationRules: mockValidationRules })
      );

      act(() => {
        result.current.clearErrors('nonexistent');
      });

      expect(result.current.errors.nonexistent).toBe('');
    });
  });

  describe('clearAllErrors', () => {
    it('should clear all errors', () => {
      const { result } = renderHook(() =>
        useFormValidation({ validationRules: mockValidationRules })
      );

      act(() => {
        result.current.setFieldError('email', 'Email error');
        result.current.setFieldError('password', 'Password error');
        result.current.setFieldError('username', 'Username error');
      });

      expect(Object.keys(result.current.errors).length).toBe(3);

      act(() => {
        result.current.clearAllErrors();
      });

      expect(result.current.errors).toEqual({});
      expect(result.current.isValid).toBe(true);
    });

    it('should work when no errors exist', () => {
      const { result } = renderHook(() =>
        useFormValidation({ validationRules: mockValidationRules })
      );

      act(() => {
        result.current.clearAllErrors();
      });

      expect(result.current.errors).toEqual({});
      expect(result.current.isValid).toBe(true);
    });
  });

  describe('setFieldError', () => {
    it('should set error for specific field', () => {
      const { result } = renderHook(() =>
        useFormValidation({ validationRules: mockValidationRules })
      );

      act(() => {
        result.current.setFieldError('email', 'Custom email error');
      });

      expect(result.current.errors.email).toBe('Custom email error');
      expect(result.current.isValid).toBe(false);
    });

    it('should overwrite existing error', () => {
      const { result } = renderHook(() =>
        useFormValidation({ validationRules: mockValidationRules })
      );

      act(() => {
        result.current.setFieldError('email', 'First error');
      });
      expect(result.current.errors.email).toBe('First error');

      act(() => {
        result.current.setFieldError('email', 'Second error');
      });
      expect(result.current.errors.email).toBe('Second error');
    });

    it('should set multiple field errors', () => {
      const { result } = renderHook(() =>
        useFormValidation({ validationRules: mockValidationRules })
      );

      act(() => {
        result.current.setFieldError('email', 'Email error');
        result.current.setFieldError('password', 'Password error');
        result.current.setFieldError('username', 'Username error');
      });

      expect(result.current.errors.email).toBe('Email error');
      expect(result.current.errors.password).toBe('Password error');
      expect(result.current.errors.username).toBe('Username error');
      expect(result.current.isValid).toBe(false);
    });
  });

  describe('isValid', () => {
    it('should be true when no errors exist', () => {
      const { result } = renderHook(() =>
        useFormValidation({ validationRules: mockValidationRules })
      );

      expect(result.current.isValid).toBe(true);
    });

    it('should be false when any error exists', () => {
      const { result } = renderHook(() =>
        useFormValidation({ validationRules: mockValidationRules })
      );

      act(() => {
        result.current.setFieldError('email', 'Error');
      });

      expect(result.current.isValid).toBe(false);
    });

    it('should be true when all errors are empty strings', () => {
      const { result } = renderHook(() =>
        useFormValidation({ validationRules: mockValidationRules })
      );

      act(() => {
        result.current.setFieldError('email', '');
        result.current.setFieldError('password', '');
      });

      expect(result.current.isValid).toBe(true);
    });

    it('should update when errors change', () => {
      const { result } = renderHook(() =>
        useFormValidation({ validationRules: mockValidationRules })
      );

      expect(result.current.isValid).toBe(true);

      act(() => {
        result.current.setFieldError('email', 'Error');
      });
      expect(result.current.isValid).toBe(false);

      act(() => {
        result.current.clearErrors('email');
      });
      expect(result.current.isValid).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty validation rules', () => {
      const { result } = renderHook(() =>
        useFormValidation({ validationRules: {} })
      );

      act(() => {
        const isValid = result.current.validateField('anyfield', 'value');
        expect(isValid).toBe(true);
      });

      expect(result.current.errors).toEqual({});
    });

    it('should handle rule that returns undefined (no error)', () => {
      const rulesWithUndefined = {
        field: (value: unknown) => {
          return value ? undefined : 'Error';
        },
      };

      const { result } = renderHook(() =>
        useFormValidation({ validationRules: rulesWithUndefined })
      );

      act(() => {
        const isValid = result.current.validateField('field', 'valid');
        expect(isValid).toBe(true);
      });

      expect(result.current.errors.field).toBe('');
    });

    it('should handle null and undefined values', () => {
      const { result } = renderHook(() =>
        useFormValidation({ validationRules: mockValidationRules })
      );

      act(() => {
        result.current.validateField('email', null);
        result.current.validateField('password', undefined);
      });

      expect(result.current.errors.email).toBe('Email is required');
      expect(result.current.errors.password).toBe('Password is required');
    });
  });
});

describe('useFieldValidation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validateAndShow', () => {
    it('should call ValidationService.validateAndShow', () => {
      (ValidationService.validateAndShow as jest.Mock).mockReturnValue(true);

      const { result } = renderHook(() => useFieldValidation());

      const rules = { required: true, minLength: 5 };
      const isValid = result.current.validateAndShow('test', rules);

      expect(ValidationService.validateAndShow).toHaveBeenCalledWith('test', rules);
      expect(isValid).toBe(true);
    });

    it('should return false for invalid field', () => {
      (ValidationService.validateAndShow as jest.Mock).mockReturnValue(false);

      const { result } = renderHook(() => useFieldValidation());

      const isValid = result.current.validateAndShow('', { required: true });

      expect(isValid).toBe(false);
    });

    it('should handle multiple validations', () => {
      (ValidationService.validateAndShow as jest.Mock)
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(false);

      const { result } = renderHook(() => useFieldValidation());

      const result1 = result.current.validateAndShow('valid', { required: true });
      const result2 = result.current.validateAndShow('', { required: true });

      expect(result1).toBe(true);
      expect(result2).toBe(false);
      expect(ValidationService.validateAndShow).toHaveBeenCalledTimes(2);
    });
  });

  describe('validateFormAndShow', () => {
    it('should call ValidationService.validateFormAndShow', () => {
      const mockResult = { isValid: true, errors: {} };
      (ValidationService.validateFormAndShow as jest.Mock).mockReturnValue(mockResult);

      const { result } = renderHook(() => useFieldValidation());

      const data = { email: 'test@example.com' };
      const rules = { email: (v: unknown) => v ? '' : 'Required' };
      const validationResult = result.current.validateFormAndShow(data, rules);

      expect(ValidationService.validateFormAndShow).toHaveBeenCalledWith(data, rules);
      expect(validationResult).toEqual(mockResult);
    });

    it('should return validation result with errors', () => {
      const mockResult = {
        isValid: false,
        errors: { email: 'Invalid email' },
      };
      (ValidationService.validateFormAndShow as jest.Mock).mockReturnValue(mockResult);

      const { result } = renderHook(() => useFieldValidation());

      const validationResult = result.current.validateFormAndShow(
        { email: 'invalid' },
        { email: (v: unknown) => '' }
      );

      expect(validationResult.isValid).toBe(false);
      expect(validationResult.errors).toEqual({ email: 'Invalid email' });
    });

    it('should handle empty data', () => {
      const mockResult = { isValid: true, errors: {} };
      (ValidationService.validateFormAndShow as jest.Mock).mockReturnValue(mockResult);

      const { result } = renderHook(() => useFieldValidation());

      const validationResult = result.current.validateFormAndShow({}, {});

      expect(validationResult.isValid).toBe(true);
    });
  });

  describe('Callback Stability', () => {
    it('should maintain stable callback references', () => {
      const { result, rerender } = renderHook(() => useFieldValidation());

      const validateAndShow1 = result.current.validateAndShow;
      const validateFormAndShow1 = result.current.validateFormAndShow;

      rerender();

      expect(result.current.validateAndShow).toBe(validateAndShow1);
      expect(result.current.validateFormAndShow).toBe(validateFormAndShow1);
    });
  });
});
