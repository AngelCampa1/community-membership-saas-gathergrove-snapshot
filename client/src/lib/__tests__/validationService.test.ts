/**
 * Tests for validationService.ts - Client-side form validation
 * Following boundary mocking pattern: mock only toast (external UI library)
 */

import { toast } from 'sonner';
import { ValidationService, rules, validateField, validateFields } from '../validationService';

// Mock toast
jest.mock('sonner', () => ({
  toast: {
    error: jest.fn(),
  },
}));

const mockToast = toast as jest.Mocked<typeof toast>;

describe('ValidationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Validation Rules', () => {
    describe('required()', () => {
      it('returns error for null value', () => {
        const validator = rules.required('Field');
        expect(validator(null)).toBe('Field is required');
      });

      it('returns error for undefined value', () => {
        const validator = rules.required('Field');
        expect(validator(undefined)).toBe('Field is required');
      });

      it('returns error for empty string', () => {
        const validator = rules.required('Field');
        expect(validator('')).toBe('Field is required');
      });

      it('returns error for whitespace-only string', () => {
        const validator = rules.required('Field');
        expect(validator('   ')).toBe('Field is required');
      });

      it('returns null for valid value', () => {
        const validator = rules.required('Field');
        expect(validator('value')).toBeNull();
      });

      it('returns error for zero (number) - treated as falsy', () => {
        const validator = rules.required('Field');
        // Note: 0 is treated as falsy by the required rule
        expect(validator(0)).toBe('Field is required');
      });

      it('returns null for non-zero number', () => {
        const validator = rules.required('Field');
        expect(validator(1)).toBeNull();
      });
    });

    describe('email()', () => {
      const emailValidator = rules.email();

      it('returns null for empty value', () => {
        expect(emailValidator('')).toBeNull();
      });

      it('returns error for invalid email format', () => {
        expect(emailValidator('invalid')).toBe('Please enter a valid email address');
        expect(emailValidator('invalid@')).toBe('Please enter a valid email address');
        expect(emailValidator('invalid@domain')).toBe('Please enter a valid email address');
        expect(emailValidator('@domain.com')).toBe('Please enter a valid email address');
      });

      it('returns null for valid email addresses', () => {
        expect(emailValidator('user@example.com')).toBeNull();
        expect(emailValidator('user.name@example.com')).toBeNull();
        expect(emailValidator('user+tag@example.co.uk')).toBeNull();
      });
    });

    describe('password()', () => {
      const passwordValidator = rules.password();

      it('returns null for empty value', () => {
        expect(passwordValidator('')).toBeNull();
      });

      it('returns error for password < 8 characters', () => {
        const result = passwordValidator('Short1!');
        expect(result).toContain('at least 8 characters');
      });

      it('returns error for missing lowercase letter', () => {
        const result = passwordValidator('PASSWORD1!');
        expect(result).toContain('one lowercase letter');
      });

      it('returns error for missing uppercase letter', () => {
        const result = passwordValidator('password1!');
        expect(result).toContain('one uppercase letter');
      });

      it('returns error for missing number', () => {
        const result = passwordValidator('Password!');
        expect(result).toContain('one number');
      });

      it('returns error for missing special character', () => {
        const result = passwordValidator('Password1');
        expect(result).toContain('one special character');
      });

      it('returns error for multiple missing requirements', () => {
        const result = passwordValidator('pass');
        expect(result).toContain('at least 8 characters');
        expect(result).toContain('one uppercase letter');
        expect(result).toContain('one number');
        expect(result).toContain('one special character');
      });

      it('returns null for valid password', () => {
        expect(passwordValidator('Password1!')).toBeNull();
        expect(passwordValidator('MyP@ssw0rd')).toBeNull();
        expect(passwordValidator('Str0ng$Pass')).toBeNull();
      });
    });

    describe('confirmPassword()', () => {
      it('returns null for empty value', () => {
        const validator = rules.confirmPassword('Password1!');
        expect(validator('')).toBeNull();
      });

      it('returns error when passwords do not match', () => {
        const validator = rules.confirmPassword('Password1!');
        expect(validator('Different1!')).toBe('Passwords do not match');
      });

      it('returns null when passwords match', () => {
        const validator = rules.confirmPassword('Password1!');
        expect(validator('Password1!')).toBeNull();
      });
    });

    describe('minLength()', () => {
      it('returns null for empty value', () => {
        const validator = rules.minLength(5);
        expect(validator('')).toBeNull();
      });

      it('returns error when value is too short', () => {
        const validator = rules.minLength(5);
        expect(validator('abc')).toBe('Must be at least 5 characters long');
      });

      it('returns null when value meets minimum length', () => {
        const validator = rules.minLength(5);
        expect(validator('abcde')).toBeNull();
        expect(validator('abcdef')).toBeNull();
      });
    });

    describe('maxLength()', () => {
      it('returns null for empty value', () => {
        const validator = rules.maxLength(5);
        expect(validator('')).toBeNull();
      });

      it('returns error when value is too long', () => {
        const validator = rules.maxLength(5);
        expect(validator('abcdefgh')).toBe('Must be no more than 5 characters long');
      });

      it('returns null when value is within maximum length', () => {
        const validator = rules.maxLength(5);
        expect(validator('abc')).toBeNull();
        expect(validator('abcde')).toBeNull();
      });
    });

    describe('phone()', () => {
      const phoneValidator = rules.phone();

      it('returns null for empty value', () => {
        expect(phoneValidator('')).toBeNull();
      });

      it('returns error for invalid phone numbers', () => {
        expect(phoneValidator('abc')).toBe('Please enter a valid phone number');
        expect(phoneValidator('0123')).toBe('Please enter a valid phone number'); // Can't start with 0
      });

      it('returns null for valid phone numbers', () => {
        expect(phoneValidator('1234567890')).toBeNull();
        expect(phoneValidator('+12345678901')).toBeNull();
        expect(phoneValidator('123-456-7890')).toBeNull();
        expect(phoneValidator('(123) 456-7890')).toBeNull();
      });
    });

    describe('url()', () => {
      const urlValidator = rules.url();

      it('returns null for empty value', () => {
        expect(urlValidator('')).toBeNull();
      });

      it('returns error for invalid URLs', () => {
        expect(urlValidator('invalid')).toBe('Please enter a valid URL');
        expect(urlValidator('http://')).toBe('Please enter a valid URL');
      });

      it('returns null for valid URLs', () => {
        expect(urlValidator('https://example.com')).toBeNull();
        expect(urlValidator('http://example.com/path')).toBeNull();
        expect(urlValidator('https://example.com/path?query=value')).toBeNull();
      });
    });

    describe('number()', () => {
      const numberValidator = rules.number();

      it('returns null for empty string', () => {
        expect(numberValidator('')).toBeNull();
      });

      it('returns null for null', () => {
        expect(numberValidator(null)).toBeNull();
      });

      it('returns null for undefined', () => {
        expect(numberValidator(undefined)).toBeNull();
      });

      it('returns error for non-numeric values', () => {
        expect(numberValidator('abc')).toBe('Please enter a valid number');
        expect(numberValidator('12abc')).toBe('Please enter a valid number');
      });

      it('returns null for valid numbers', () => {
        expect(numberValidator('123')).toBeNull();
        expect(numberValidator('123.45')).toBeNull();
        expect(numberValidator('-123')).toBeNull();
        expect(numberValidator(123)).toBeNull();
      });
    });

    describe('min()', () => {
      it('returns null for empty value', () => {
        const validator = rules.min(10);
        expect(validator('')).toBeNull();
        expect(validator(null)).toBeNull();
        expect(validator(undefined)).toBeNull();
      });

      it('returns error when value is below minimum', () => {
        const validator = rules.min(10);
        expect(validator(5)).toBe('Value must be at least 10');
        expect(validator('5')).toBe('Value must be at least 10');
      });

      it('returns error for non-numeric values', () => {
        const validator = rules.min(10);
        expect(validator('abc')).toBe('Value must be at least 10');
      });

      it('returns null when value meets or exceeds minimum', () => {
        const validator = rules.min(10);
        expect(validator(10)).toBeNull();
        expect(validator('10')).toBeNull();
        expect(validator(15)).toBeNull();
      });
    });

    describe('max()', () => {
      it('returns null for empty value', () => {
        const validator = rules.max(10);
        expect(validator('')).toBeNull();
        expect(validator(null)).toBeNull();
        expect(validator(undefined)).toBeNull();
      });

      it('returns error when value exceeds maximum', () => {
        const validator = rules.max(10);
        expect(validator(15)).toBe('Value must be no more than 10');
        expect(validator('15')).toBe('Value must be no more than 10');
      });

      it('returns error for non-numeric values', () => {
        const validator = rules.max(10);
        expect(validator('abc')).toBe('Value must be no more than 10');
      });

      it('returns null when value is within maximum', () => {
        const validator = rules.max(10);
        expect(validator(5)).toBeNull();
        expect(validator('5')).toBeNull();
        expect(validator(10)).toBeNull();
      });
    });

    describe('membershipTypeName()', () => {
      const validator = rules.membershipTypeName();

      it('returns null for empty value', () => {
        expect(validator('')).toBeNull();
      });

      it('returns error for name too short', () => {
        expect(validator('A')).toBe('Membership type name must be at least 2 characters');
      });

      it('returns error for name too long', () => {
        const longName = 'A'.repeat(51);
        expect(validator(longName)).toBe('Membership type name must be no more than 50 characters');
      });

      it('returns null for valid name', () => {
        expect(validator('Gold')).toBeNull();
        expect(validator('Premium Membership')).toBeNull();
      });
    });

    describe('eventTitle()', () => {
      const validator = rules.eventTitle();

      it('returns null for empty value', () => {
        expect(validator('')).toBeNull();
      });

      it('returns error for title too short', () => {
        expect(validator('Ab')).toBe('Event title must be at least 3 characters');
      });

      it('returns error for title too long', () => {
        const longTitle = 'A'.repeat(101);
        expect(validator(longTitle)).toBe('Event title must be no more than 100 characters');
      });

      it('returns null for valid title', () => {
        expect(validator('Annual Meeting')).toBeNull();
        expect(validator('Community Gathering 2024')).toBeNull();
      });
    });

    describe('clubName()', () => {
      const validator = rules.clubName();

      it('returns null for empty value', () => {
        expect(validator('')).toBeNull();
      });

      it('returns error for name too short', () => {
        expect(validator('A')).toBe('Club name must be at least 2 characters');
      });

      it('returns error for name too long', () => {
        const longName = 'A'.repeat(101);
        expect(validator(longName)).toBe('Club name must be no more than 100 characters');
      });

      it('returns null for valid name', () => {
        expect(validator('Book Club')).toBeNull();
        expect(validator('Tech Community')).toBeNull();
      });
    });
  });

  describe('Validation Methods', () => {
    describe('validateField()', () => {
      it('returns null when all rules pass', () => {
        const fieldRules = [rules.required('Email'), rules.email()];
        expect(validateField('user@example.com', fieldRules)).toBeNull();
      });

      it('returns first error when validation fails', () => {
        const fieldRules = [rules.required('Email'), rules.email()];
        expect(validateField('', fieldRules)).toBe('Email is required');
      });

      it('returns email error when required passes but email fails', () => {
        const fieldRules = [rules.required('Email'), rules.email()];
        expect(validateField('invalid', fieldRules)).toBe('Please enter a valid email address');
      });

      it('handles multiple failing rules and returns first error', () => {
        const fieldRules = [
          rules.required('Password'),
          rules.minLength(8),
          rules.password()
        ];
        expect(validateField('', fieldRules)).toBe('Password is required');
      });
    });

    describe('validateFields()', () => {
      it('returns valid result when all fields pass validation', () => {
        const data = {
          email: 'user@example.com',
          password: 'Password1!',
        };
        const validationRules = {
          email: rules.email(),
          password: rules.password(),
        };

        const result = validateFields(data, validationRules);

        expect(result.isValid).toBe(true);
        expect(result.errors).toEqual({});
        expect(result.firstError).toBeUndefined();
      });

      it('returns invalid result with errors when validation fails', () => {
        const data = {
          email: 'invalid',
          password: 'weak',
        };
        const validationRules = {
          email: rules.email(),
          password: rules.password(),
        };

        const result = validateFields(data, validationRules);

        expect(result.isValid).toBe(false);
        expect(result.errors).toHaveProperty('email');
        expect(result.errors).toHaveProperty('password');
        expect(result.firstError).toBeTruthy();
      });

      it('sets firstError to the first encountered error', () => {
        const data = {
          email: 'invalid',
          name: '',
        };
        const validationRules = {
          email: rules.email(),
          name: rules.required('Name'),
        };

        const result = validateFields(data, validationRules);

        expect(result.firstError).toBe('Please enter a valid email address');
      });

      it('handles missing fields in data', () => {
        const data = {};
        const validationRules = {
          email: rules.email(),
        };

        const result = validateFields(data, validationRules);

        expect(result.isValid).toBe(true); // email rule returns null for empty
      });
    });

    describe('showValidationError()', () => {
      it('shows toast error with correct message and options', () => {
        ValidationService.showValidationError('Test error');

        expect(mockToast.error).toHaveBeenCalledWith('Test error', {
          className: 'validation-error',
          duration: 4000,
        });
      });
    });

    describe('validateAndShow()', () => {
      it('returns true and does not show toast when validation passes', () => {
        const fieldRules = [rules.email()];
        const result = ValidationService.validateAndShow('user@example.com', fieldRules);

        expect(result).toBe(true);
        expect(mockToast.error).not.toHaveBeenCalled();
      });

      it('returns false and shows toast when validation fails', () => {
        const fieldRules = [rules.email()];
        const result = ValidationService.validateAndShow('invalid', fieldRules);

        expect(result).toBe(false);
        expect(mockToast.error).toHaveBeenCalledWith('Please enter a valid email address', {
          className: 'validation-error',
          duration: 4000,
        });
      });
    });

    describe('validateFormAndShow()', () => {
      it('returns valid result and does not show toast when validation passes', () => {
        const data = {
          email: 'user@example.com',
          password: 'Password1!',
        };
        const validationRules = {
          email: rules.email(),
          password: rules.password(),
        };

        const result = ValidationService.validateFormAndShow(data, validationRules);

        expect(result.isValid).toBe(true);
        expect(mockToast.error).not.toHaveBeenCalled();
      });

      it('returns invalid result and shows first error when validation fails', () => {
        const data = {
          email: 'invalid',
          password: 'weak',
        };
        const validationRules = {
          email: rules.email(),
          password: rules.password(),
        };

        const result = ValidationService.validateFormAndShow(data, validationRules);

        expect(result.isValid).toBe(false);
        expect(result.errors).toHaveProperty('email');
        expect(result.errors).toHaveProperty('password');
        expect(mockToast.error).toHaveBeenCalledWith(
          result.firstError,
          {
            className: 'validation-error',
            duration: 4000,
          }
        );
      });
    });
  });

  describe('Validation Schemas', () => {
    describe('login schema', () => {
      it('validates correct login data', () => {
        const data = {
          email: 'user@example.com',
          password: 'anypassword',
        };

        const result = validateFields(data, ValidationService.schemas.login);
        expect(result.isValid).toBe(true);
      });

      it('fails for invalid email', () => {
        const data = {
          email: 'invalid',
          password: 'anypassword',
        };

        const result = validateFields(data, ValidationService.schemas.login);
        expect(result.isValid).toBe(false);
        expect(result.errors.email).toBeTruthy();
      });

      it('fails for missing password', () => {
        const data = {
          email: 'user@example.com',
          password: '',
        };

        const result = validateFields(data, ValidationService.schemas.login);
        expect(result.isValid).toBe(false);
        expect(result.errors.password).toBe('Password is required');
      });
    });

    describe('register schema', () => {
      it('validates correct registration data', () => {
        const data = {
          fullName: 'John Doe',
          email: 'john@example.com',
          password: 'Password1!',
          clubName: 'My Club',
        };

        const result = validateFields(data, ValidationService.schemas.register);
        expect(result.isValid).toBe(true);
      });

      it('fails for weak password', () => {
        const data = {
          fullName: 'John Doe',
          email: 'john@example.com',
          password: 'weak',
          clubName: 'My Club',
        };

        const result = validateFields(data, ValidationService.schemas.register);
        expect(result.isValid).toBe(false);
        expect(result.errors.password).toBeTruthy();
      });
    });

    describe('forgotPassword schema', () => {
      it('validates correct email', () => {
        const data = { email: 'user@example.com' };
        const result = validateFields(data, ValidationService.schemas.forgotPassword);
        expect(result.isValid).toBe(true);
      });
    });

    describe('resetPassword schema', () => {
      it('validates matching passwords', () => {
        const password = 'NewPassword1!';
        const data = {
          newPassword: password,
          confirmPassword: password,
        };

        const result = validateFields(data, ValidationService.schemas.resetPassword(password));
        expect(result.isValid).toBe(true);
      });

      it('fails for non-matching passwords', () => {
        const password = 'NewPassword1!';
        const data = {
          newPassword: password,
          confirmPassword: 'Different1!',
        };

        const result = validateFields(data, ValidationService.schemas.resetPassword(password));
        expect(result.isValid).toBe(false);
        expect(result.errors.confirmPassword).toBe('Passwords do not match');
      });
    });

    describe('member schema', () => {
      it('validates correct member data', () => {
        const data = {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          phone: '1234567890',
        };

        const result = validateFields(data, ValidationService.schemas.member);
        expect(result.isValid).toBe(true);
      });

      it('fails for invalid phone (starting with 0)', () => {
        const data = {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          phone: '0123',
        };

        const result = validateFields(data, ValidationService.schemas.member);
        expect(result.isValid).toBe(false);
        expect(result.errors.phone).toBeTruthy();
      });
    });

    describe('payment schema', () => {
      it('validates correct payment data', () => {
        const data = {
          amount: 50.00,
          description: 'Membership fee',
        };

        const result = validateFields(data, ValidationService.schemas.payment);
        expect(result.isValid).toBe(true);
      });

      it('fails for amount below minimum', () => {
        const data = {
          amount: 0,
          description: 'Membership fee',
        };

        const result = validateFields(data, ValidationService.schemas.payment);
        expect(result.isValid).toBe(false);
        expect(result.errors.amount).toBeTruthy();
      });
    });

    describe('event schema', () => {
      it('validates correct event data', () => {
        const data = {
          title: 'Annual Meeting',
          description: 'Our annual gathering',
          startDateTime: '2024-01-01T10:00:00',
          endDateTime: '2024-01-01T12:00:00',
        };

        const result = validateFields(data, ValidationService.schemas.event);
        expect(result.isValid).toBe(true);
      });

      it('fails for short title', () => {
        const data = {
          title: 'Ab',
          description: 'Description',
          startDateTime: '2024-01-01T10:00:00',
          endDateTime: '2024-01-01T12:00:00',
        };

        const result = validateFields(data, ValidationService.schemas.event);
        expect(result.isValid).toBe(false);
        expect(result.errors.title).toBeTruthy();
      });
    });
  });

  describe('Exported convenience functions', () => {
    it('exports all validation functions', () => {
      expect(typeof rules).toBe('object');
      expect(typeof validateField).toBe('function');
      expect(typeof validateFields).toBe('function');
    });
  });
});
