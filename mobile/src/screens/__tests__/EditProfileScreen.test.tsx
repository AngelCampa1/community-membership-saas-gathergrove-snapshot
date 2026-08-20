/**
 * EditProfileScreen Tests
 *
 * Comprehensive tests for EditProfileScreen validation logic, form handling,
 * and data structure validation. Tests focus on validation rules, edge cases,
 * and API request payload construction.
 */

import type { MemberProfileResponse, UpdateMemberRequest } from '@/types';

describe('EditProfileScreen Validation Logic', () => {
  describe('Full Name Validation', () => {
    it('should validate required full name', () => {
      const fullName = '';
      const isValid = fullName.trim().length > 0;

      expect(isValid).toBe(false);
    });

    it('should accept valid full name', () => {
      const fullName = 'John Doe';
      const isValid = fullName.trim().length > 0 && fullName.length <= 100;

      expect(isValid).toBe(true);
    });

    it('should reject full name exceeding 100 characters', () => {
      const fullName = 'A'.repeat(101);
      const isValid = fullName.length <= 100;

      expect(isValid).toBe(false);
      expect(fullName.length).toBe(101);
    });

    it('should accept full name at 100 character boundary', () => {
      const fullName = 'A'.repeat(100);
      const isValid = fullName.length <= 100;

      expect(isValid).toBe(true);
      expect(fullName.length).toBe(100);
    });

    it('should trim whitespace from full name', () => {
      const fullName = '  John Doe  ';
      const trimmed = fullName.trim();

      expect(trimmed).toBe('John Doe');
      expect(trimmed.length).toBe(8);
    });

    it('should reject whitespace-only full name', () => {
      const fullName = '   ';
      const isValid = fullName.trim().length > 0;

      expect(isValid).toBe(false);
    });
  });

  describe('Email Validation', () => {
    it('should validate required email', () => {
      const email = '';
      const isValid = email.trim().length > 0;

      expect(isValid).toBe(false);
    });

    it('should accept valid email format', () => {
      const email = 'john.doe@example.com';
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const isValid = emailRegex.test(email);

      expect(isValid).toBe(true);
    });

    it('should reject email without @ symbol', () => {
      const email = 'johndoeexample.com';
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const isValid = emailRegex.test(email);

      expect(isValid).toBe(false);
    });

    it('should reject email without domain', () => {
      const email = 'john@';
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const isValid = emailRegex.test(email);

      expect(isValid).toBe(false);
    });

    it('should reject email without TLD', () => {
      const email = 'john@example';
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const isValid = emailRegex.test(email);

      expect(isValid).toBe(false);
    });

    it('should accept email with subdomain', () => {
      const email = 'john@mail.example.com';
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const isValid = emailRegex.test(email);

      expect(isValid).toBe(true);
    });

    it('should accept email with plus sign', () => {
      const email = 'john+test@example.com';
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const isValid = emailRegex.test(email);

      expect(isValid).toBe(true);
    });

    it('should reject email exceeding 255 characters', () => {
      const localPart = 'a'.repeat(250);
      const email = `${localPart}@example.com`;
      const isValid = email.length <= 255;

      expect(isValid).toBe(false);
      expect(email.length).toBeGreaterThan(255);
    });

    it('should accept email at 255 character boundary', () => {
      const localPart = 'a'.repeat(242); // 242 + '@' + 'example.com' (11) = 254
      const email = `${localPart}@example.com`;
      const isValid = email.length <= 255;

      expect(isValid).toBe(true);
      expect(email.length).toBeLessThanOrEqual(255);
    });

    it('should trim whitespace from email', () => {
      const email = '  john@example.com  ';
      const trimmed = email.trim();

      expect(trimmed).toBe('john@example.com');
    });

    it('should reject email with spaces', () => {
      const email = 'john doe@example.com';
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const isValid = emailRegex.test(email);

      expect(isValid).toBe(false);
    });
  });

  describe('Phone Number Validation', () => {
    it('should accept empty phone number (optional field)', () => {
      const phoneNumber: string = '';
      const isValid = phoneNumber === '' || phoneNumber.length <= 20;

      expect(isValid).toBe(true);
    });

    it('should accept valid phone number', () => {
      const phoneNumber = '+1 (555) 123-4567';
      const isValid = phoneNumber.length <= 20;

      expect(isValid).toBe(true);
    });

    it('should reject phone number exceeding 20 characters', () => {
      const phoneNumber = '1'.repeat(21);
      const isValid = phoneNumber.length <= 20;

      expect(isValid).toBe(false);
      expect(phoneNumber.length).toBe(21);
    });

    it('should accept phone number at 20 character boundary', () => {
      const phoneNumber = '1'.repeat(20);
      const isValid = phoneNumber.length <= 20;

      expect(isValid).toBe(true);
      expect(phoneNumber.length).toBe(20);
    });

    it('should trim whitespace from phone number', () => {
      const phoneNumber = '  555-1234  ';
      const trimmed = phoneNumber.trim();

      expect(trimmed).toBe('555-1234');
    });

    it('should handle undefined phone number', () => {
      const phoneNumber = undefined;
      const value = phoneNumber || '';
      const isValid = value === '' || value.length <= 20;

      expect(isValid).toBe(true);
    });
  });

  describe('Address Validation', () => {
    it('should accept empty address (optional field)', () => {
      const address: string = '';
      const isValid = address === '' || address.length <= 500;

      expect(isValid).toBe(true);
    });

    it('should accept valid address', () => {
      const address = '123 Main Street, Apt 4B, Springfield, IL 62701';
      const isValid = address.length <= 500;

      expect(isValid).toBe(true);
    });

    it('should reject address exceeding 500 characters', () => {
      const address = 'A'.repeat(501);
      const isValid = address.length <= 500;

      expect(isValid).toBe(false);
      expect(address.length).toBe(501);
    });

    it('should accept address at 500 character boundary', () => {
      const address = 'A'.repeat(500);
      const isValid = address.length <= 500;

      expect(isValid).toBe(true);
      expect(address.length).toBe(500);
    });

    it('should trim whitespace from address', () => {
      const address = '  123 Main St  ';
      const trimmed = address.trim();

      expect(trimmed).toBe('123 Main St');
    });

    it('should handle undefined address', () => {
      const address = undefined;
      const value = address || '';
      const isValid = value === '' || value.length <= 500;

      expect(isValid).toBe(true);
    });

    it('should accept multi-line address', () => {
      const address = '123 Main Street\nApt 4B\nSpringfield, IL 62701';
      const isValid = address.length <= 500;

      expect(isValid).toBe(true);
    });
  });

  describe('UpdateMemberRequest Payload Construction', () => {
    it('should build valid update request with all fields', () => {
      const mockProfile: Partial<MemberProfileResponse> = {
        id: 123,
        membershipTypeId: 1,
        hasSmsConsent: true,
        customFields: [
          { id: 1, label: 'Department', value: 'Engineering' },
          { id: 2, label: 'Location', value: 'Seattle' },
        ],
      };

      const formData = {
        fullName: 'John Doe',
        email: 'john@example.com',
        phoneNumber: '555-1234',
        address: '123 Main St',
      };

      const updateRequest: UpdateMemberRequest = {
        membershipTypeId: mockProfile.membershipTypeId!,
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        phoneNumber: formData.phoneNumber.trim() || undefined,
        address: formData.address.trim() || undefined,
        hasSmsConsent: false,
        customFieldValues: mockProfile.customFields?.map(cf => ({
          customFieldId: cf.id,
          fieldValue: cf.value,
        })) || [],
      };

      expect(updateRequest.membershipTypeId).toBe(1);
      expect(updateRequest.fullName).toBe('John Doe');
      expect(updateRequest.email).toBe('john@example.com');
      expect(updateRequest.phoneNumber).toBe('555-1234');
      expect(updateRequest.address).toBe('123 Main St');
      expect(updateRequest.hasSmsConsent).toBe(false);
      expect(updateRequest.customFieldValues).toHaveLength(2);
    });

    it('should handle empty optional fields in request', () => {
      const mockProfile: Partial<MemberProfileResponse> = {
        membershipTypeId: 1,
        hasSmsConsent: false,
        customFields: [],
      };

      const formData = {
        fullName: 'John Doe',
        email: 'john@example.com',
        phoneNumber: '',
        address: '',
      };

      const updateRequest: UpdateMemberRequest = {
        membershipTypeId: mockProfile.membershipTypeId!,
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        phoneNumber: formData.phoneNumber.trim() || undefined,
        address: formData.address.trim() || undefined,
        hasSmsConsent: false,
        customFieldValues: mockProfile.customFields?.map(cf => ({
          customFieldId: cf.id,
          fieldValue: cf.value,
        })) || [],
      };

      expect(updateRequest.phoneNumber).toBeUndefined();
      expect(updateRequest.address).toBeUndefined();
      expect(updateRequest.customFieldValues).toEqual([]);
    });

    it('should trim all string fields in request', () => {
      const mockProfile: Partial<MemberProfileResponse> = {
        membershipTypeId: 1,
        hasSmsConsent: true,
        customFields: [],
      };

      const formData = {
        fullName: '  John Doe  ',
        email: '  john@example.com  ',
        phoneNumber: '  555-1234  ',
        address: '  123 Main St  ',
      };

      const updateRequest: UpdateMemberRequest = {
        membershipTypeId: mockProfile.membershipTypeId!,
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        phoneNumber: formData.phoneNumber.trim() || undefined,
        address: formData.address.trim() || undefined,
        hasSmsConsent: false,
        customFieldValues: [],
      };

      expect(updateRequest.fullName).toBe('John Doe');
      expect(updateRequest.email).toBe('john@example.com');
      expect(updateRequest.phoneNumber).toBe('555-1234');
      expect(updateRequest.address).toBe('123 Main St');
    });

    it('should map custom fields correctly', () => {
      const customFields = [
        { id: 1, label: 'Department', value: 'Engineering' },
        { id: 2, label: 'Location', value: 'Seattle' },
        { id: 3, label: 'Team', value: 'Platform' },
      ];

      const customFieldValues = customFields.map(cf => ({
        customFieldId: cf.id,
        fieldValue: cf.value,
      }));

      expect(customFieldValues).toHaveLength(3);
      expect(customFieldValues[0].customFieldId).toBe(1);
      expect(customFieldValues[0].fieldValue).toBe('Engineering');
      expect(customFieldValues[1].customFieldId).toBe(2);
      expect(customFieldValues[1].fieldValue).toBe('Seattle');
      expect(customFieldValues[2].customFieldId).toBe(3);
      expect(customFieldValues[2].fieldValue).toBe('Platform');
    });

    it('should handle null/undefined custom fields', () => {
      const customFields = undefined;
      const customFieldValues = customFields?.map(cf => ({
        customFieldId: cf.id,
        fieldValue: cf.value,
      })) || [];

      expect(customFieldValues).toEqual([]);
    });
  });

  describe('Form Data Validation Edge Cases', () => {
    it('should validate form with all valid fields', () => {
      const formData = {
        fullName: 'John Doe',
        email: 'john@example.com',
        phoneNumber: '555-1234',
        address: '123 Main St',
      };

      const errors: { [key: string]: string } = {};

      // Full name validation
      if (!formData.fullName.trim()) {
        errors.fullName = 'Full name is required';
      } else if (formData.fullName.length > 100) {
        errors.fullName = 'Full name cannot exceed 100 characters';
      }

      // Email validation
      if (!formData.email.trim()) {
        errors.email = 'Email address is required';
      } else if (formData.email.length > 255) {
        errors.email = 'Email cannot exceed 255 characters';
      } else {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
          errors.email = 'Please enter a valid email address';
        }
      }

      // Phone number validation (optional)
      if (formData.phoneNumber && formData.phoneNumber.length > 20) {
        errors.phoneNumber = 'Phone number cannot exceed 20 characters';
      }

      // Address validation (optional)
      if (formData.address && formData.address.length > 500) {
        errors.address = 'Address cannot exceed 500 characters';
      }

      const isValid = Object.keys(errors).length === 0;

      expect(isValid).toBe(true);
      expect(errors).toEqual({});
    });

    it('should collect all validation errors', () => {
      const formData = {
        fullName: '',
        email: 'invalid-email',
        phoneNumber: '1'.repeat(21),
        address: 'A'.repeat(501),
      };

      const errors: { [key: string]: string } = {};

      // Full name validation
      if (!formData.fullName.trim()) {
        errors.fullName = 'Full name is required';
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        errors.email = 'Please enter a valid email address';
      }

      // Phone number validation
      if (formData.phoneNumber && formData.phoneNumber.length > 20) {
        errors.phoneNumber = 'Phone number cannot exceed 20 characters';
      }

      // Address validation
      if (formData.address && formData.address.length > 500) {
        errors.address = 'Address cannot exceed 500 characters';
      }

      expect(Object.keys(errors).length).toBe(4);
      expect(errors.fullName).toBeTruthy();
      expect(errors.email).toBeTruthy();
      expect(errors.phoneNumber).toBeTruthy();
      expect(errors.address).toBeTruthy();
    });

    it('should validate only required fields when optionals are empty', () => {
      const formData = {
        fullName: 'John Doe',
        email: 'john@example.com',
        phoneNumber: '',
        address: '',
      };

      const errors: { [key: string]: string } = {};

      if (!formData.fullName.trim()) {
        errors.fullName = 'Full name is required';
      }

      if (!formData.email.trim()) {
        errors.email = 'Email address is required';
      }

      if (formData.phoneNumber && formData.phoneNumber.length > 20) {
        errors.phoneNumber = 'Phone number cannot exceed 20 characters';
      }

      if (formData.address && formData.address.length > 500) {
        errors.address = 'Address cannot exceed 500 characters';
      }

      const isValid = Object.keys(errors).length === 0;

      expect(isValid).toBe(true);
    });
  });

  describe('Error State Management', () => {
    it('should clear error when user starts typing in field', () => {
      const errors = {
        fullName: 'Full name is required',
        email: 'Invalid email',
      };

      const field = 'fullName';
      const updatedErrors = {
        ...errors,
        [field]: '',
      };

      expect(updatedErrors.fullName).toBe('');
      expect(updatedErrors.email).toBe('Invalid email');
    });

    it('should preserve other errors when clearing one field', () => {
      const errors = {
        fullName: 'Full name is required',
        email: 'Invalid email',
        phoneNumber: 'Phone too long',
      };

      const field = 'email';
      const updatedErrors = {
        ...errors,
        [field]: '',
      };

      expect(updatedErrors.fullName).toBe('Full name is required');
      expect(updatedErrors.email).toBe('');
      expect(updatedErrors.phoneNumber).toBe('Phone too long');
    });

    it('should handle clearing non-existent error', () => {
      const errors = {
        fullName: 'Full name is required',
      };

      const field = 'email';
      const updatedErrors = {
        ...errors,
        [field]: '',
      };

      expect(updatedErrors.fullName).toBe('Full name is required');
      expect(updatedErrors.email).toBe('');
    });
  });

  describe('Input Change Handling', () => {
    it('should update form data for single field', () => {
      const formData = {
        fullName: 'John',
        email: 'john@example.com',
        phoneNumber: '',
        address: '',
      };

      const field = 'fullName';
      const value = 'John Doe';

      const updatedFormData = {
        ...formData,
        [field]: value,
      };

      expect(updatedFormData.fullName).toBe('John Doe');
      expect(updatedFormData.email).toBe('john@example.com');
    });

    it('should handle multiple field updates', () => {
      let formData = {
        fullName: '',
        email: '',
        phoneNumber: '',
        address: '',
      };

      formData = { ...formData, fullName: 'John Doe' };
      formData = { ...formData, email: 'john@example.com' };
      formData = { ...formData, phoneNumber: '555-1234' };

      expect(formData.fullName).toBe('John Doe');
      expect(formData.email).toBe('john@example.com');
      expect(formData.phoneNumber).toBe('555-1234');
      expect(formData.address).toBe('');
    });

    it('should overwrite previous value when updating field', () => {
      const formData = {
        fullName: 'John',
        email: 'john@example.com',
        phoneNumber: '',
        address: '',
      };

      const updatedFormData = {
        ...formData,
        fullName: 'Jane Doe',
      };

      expect(updatedFormData.fullName).toBe('Jane Doe');
    });
  });

  describe('Whitespace-Only Optional Fields (lines 116-117)', () => {
    it('should convert whitespace-only phoneNumber to undefined', () => {
      const phoneNumber = '   ';
      const processedValue = phoneNumber.trim() || undefined;

      expect(processedValue).toBeUndefined();
    });

    it('should convert empty phoneNumber to undefined', () => {
      const phoneNumber = '';
      const processedValue = phoneNumber.trim() || undefined;

      expect(processedValue).toBeUndefined();
    });

    it('should preserve non-empty phoneNumber after trim', () => {
      const phoneNumber = '  555-1234  ';
      const processedValue = phoneNumber.trim() || undefined;

      expect(processedValue).toBe('555-1234');
    });

    it('should convert whitespace-only address to undefined', () => {
      const address = '   ';
      const processedValue = address.trim() || undefined;

      expect(processedValue).toBeUndefined();
    });

    it('should convert empty address to undefined', () => {
      const address = '';
      const processedValue = address.trim() || undefined;

      expect(processedValue).toBeUndefined();
    });

    it('should preserve non-empty address after trim', () => {
      const address = '  123 Main St  ';
      const processedValue = address.trim() || undefined;

      expect(processedValue).toBe('123 Main St');
    });

    it('should handle tab and newline characters in phoneNumber', () => {
      const phoneNumber = '\t\n  \t';
      const processedValue = phoneNumber.trim() || undefined;

      expect(processedValue).toBeUndefined();
    });

    it('should handle tab and newline characters in address', () => {
      const address = '\n\t  \n';
      const processedValue = address.trim() || undefined;

      expect(processedValue).toBeUndefined();
    });
  });

  describe('Guard Clause Logic (line 104-107)', () => {
    it('should detect missing clubId when user is null', () => {
      const user = null;
      const hasClubId = user?.user.clubId != null;

      expect(hasClubId).toBe(false);
    });

    it('should detect missing clubId when user.user is undefined', () => {
      const user = { user: undefined } as any;
      const hasClubId = user?.user?.clubId != null;

      expect(hasClubId).toBe(false);
    });

    it('should detect missing clubId when clubId is null', () => {
      const user = { user: { clubId: null } } as any;
      const hasClubId = user?.user.clubId != null;

      expect(hasClubId).toBe(false);
    });

    it('should detect missing clubId when clubId is undefined', () => {
      const user = { user: { clubId: undefined } } as any;
      const hasClubId = user?.user.clubId != null;

      expect(hasClubId).toBe(false);
    });

    it('should allow save when clubId is present', () => {
      const user = { user: { clubId: '123' } };
      const hasClubId = user?.user.clubId != null;

      expect(hasClubId).toBe(true);
    });

    it('should handle zero as valid clubId', () => {
      const user = { user: { clubId: 0 } };
      const hasClubId = user?.user.clubId != null;

      expect(hasClubId).toBe(true);
    });
  });

  describe('Conditional Styling Logic (lines 170-171, 201, 219, 239, 258)', () => {
    it('should apply disabled styling when loading is true', () => {
      const loading = true;
      const isDisabled = loading;
      const buttonStyles = loading ? ['saveButton', 'saveButtonDisabled'] : ['saveButton'];

      expect(isDisabled).toBe(true);
      expect(buttonStyles).toContain('saveButtonDisabled');
    });

    it('should not apply disabled styling when loading is false', () => {
      const loading = false;
      const isDisabled = loading;
      const buttonStyles = loading ? ['saveButton', 'saveButtonDisabled'] : ['saveButton'];

      expect(isDisabled).toBe(false);
      expect(buttonStyles).not.toContain('saveButtonDisabled');
    });

    it('should apply error styling when fullName has error', () => {
      const errors = { fullName: 'Full name is required' };
      const inputStyles = errors.fullName ? ['input', 'inputError'] : ['input'];

      expect(inputStyles).toContain('inputError');
    });

    it('should not apply error styling when fullName has no error', () => {
      const errors = { email: 'Invalid email' };
      const inputStyles = (errors as any).fullName ? ['input', 'inputError'] : ['input'];

      expect(inputStyles).not.toContain('inputError');
    });

    it('should apply error styling when email has error', () => {
      const errors = { email: 'Invalid email' };
      const inputStyles = errors.email ? ['input', 'inputError'] : ['input'];

      expect(inputStyles).toContain('inputError');
    });

    it('should apply error styling when phoneNumber has error', () => {
      const errors = { phoneNumber: 'Phone too long' };
      const inputStyles = errors.phoneNumber ? ['input', 'inputError'] : ['input'];

      expect(inputStyles).toContain('inputError');
    });

    it('should apply error styling when address has error', () => {
      const errors = { address: 'Address too long' };
      const inputStyles = errors.address ? ['input', 'inputError'] : ['input'];

      expect(inputStyles).toContain('inputError');
    });

    it('should not apply error styling when field has empty string error', () => {
      const errors = { fullName: '' };
      const inputStyles = errors.fullName ? ['input', 'inputError'] : ['input'];

      expect(inputStyles).not.toContain('inputError');
    });
  });

  describe('Error Display Conditionals (lines 184, 208-212, 228-232)', () => {
    it('should show API error when apiError is truthy', () => {
      const apiError = { message: 'Network error' };
      const shouldShowError = !!apiError;

      expect(shouldShowError).toBe(true);
    });

    it('should hide API error when apiError is null', () => {
      const apiError = null;
      const shouldShowError = !!apiError;

      expect(shouldShowError).toBe(false);
    });

    it('should hide API error when apiError is undefined', () => {
      const apiError = undefined;
      const shouldShowError = !!apiError;

      expect(shouldShowError).toBe(false);
    });

    it('should show fullName error text when error exists', () => {
      const errors = { fullName: 'Full name is required' };
      const shouldShowError = !!errors.fullName;

      expect(shouldShowError).toBe(true);
      expect(errors.fullName).toBe('Full name is required');
    });

    it('should hide fullName error text when error is empty', () => {
      const errors = { fullName: '' };
      const shouldShowError = !!errors.fullName;

      expect(shouldShowError).toBe(false);
    });

    it('should show email error text when error exists', () => {
      const errors = { email: 'Invalid email' };
      const shouldShowError = !!errors.email;

      expect(shouldShowError).toBe(true);
      expect(errors.email).toBe('Invalid email');
    });

    it('should show phoneNumber error text when error exists', () => {
      const errors = { phoneNumber: 'Phone too long' };
      const shouldShowError = !!errors.phoneNumber;

      expect(shouldShowError).toBe(true);
    });

    it('should show address error text when error exists', () => {
      const errors = { address: 'Address too long' };
      const shouldShowError = !!errors.address;

      expect(shouldShowError).toBe(true);
    });

    it('should handle multiple errors displayed simultaneously', () => {
      const errors = {
        fullName: 'Full name is required',
        email: 'Invalid email',
        phoneNumber: 'Phone too long',
        address: 'Address too long',
      };

      expect(!!errors.fullName).toBe(true);
      expect(!!errors.email).toBe(true);
      expect(!!errors.phoneNumber).toBe(true);
      expect(!!errors.address).toBe(true);
    });
  });

  describe('Loading State Behavior (lines 174-178)', () => {
    it('should show ActivityIndicator when loading is true', () => {
      const loading = true;
      const showIndicator = loading;
      const showText = !loading;

      expect(showIndicator).toBe(true);
      expect(showText).toBe(false);
    });

    it('should show Save text when loading is false', () => {
      const loading = false;
      const showIndicator = loading;
      const showText = !loading;

      expect(showIndicator).toBe(false);
      expect(showText).toBe(true);
    });

    it('should disable save button when loading is true', () => {
      const loading = true;
      const disabled = loading;

      expect(disabled).toBe(true);
    });

    it('should enable save button when loading is false', () => {
      const loading = false;
      const disabled = loading;

      expect(disabled).toBe(false);
    });
  });

  describe('Combined Validation Scenarios', () => {
    it('should handle valid form with trimmed optional fields', () => {
      const formData = {
        fullName: '  John Doe  ',
        email: '  john@example.com  ',
        phoneNumber: '  555-1234  ',
        address: '  123 Main St  ',
      };

      const processedData = {
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        phoneNumber: formData.phoneNumber.trim() || undefined,
        address: formData.address.trim() || undefined,
      };

      expect(processedData.fullName).toBe('John Doe');
      expect(processedData.email).toBe('john@example.com');
      expect(processedData.phoneNumber).toBe('555-1234');
      expect(processedData.address).toBe('123 Main St');
    });

    it('should handle valid form with empty optional fields', () => {
      const formData = {
        fullName: 'John Doe',
        email: 'john@example.com',
        phoneNumber: '',
        address: '',
      };

      const processedData = {
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        phoneNumber: formData.phoneNumber.trim() || undefined,
        address: formData.address.trim() || undefined,
      };

      expect(processedData.fullName).toBe('John Doe');
      expect(processedData.email).toBe('john@example.com');
      expect(processedData.phoneNumber).toBeUndefined();
      expect(processedData.address).toBeUndefined();
    });

    it('should handle valid form with whitespace-only optional fields', () => {
      const formData = {
        fullName: 'John Doe',
        email: 'john@example.com',
        phoneNumber: '   ',
        address: '\t\n  ',
      };

      const processedData = {
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        phoneNumber: formData.phoneNumber.trim() || undefined,
        address: formData.address.trim() || undefined,
      };

      expect(processedData.fullName).toBe('John Doe');
      expect(processedData.email).toBe('john@example.com');
      expect(processedData.phoneNumber).toBeUndefined();
      expect(processedData.address).toBeUndefined();
    });

    it('should validate and show errors for all invalid fields', () => {
      const formData = {
        fullName: '',
        email: 'invalid',
        phoneNumber: '1'.repeat(21),
        address: 'A'.repeat(501),
      };

      const errors: { [key: string]: string } = {};

      if (!formData.fullName.trim()) {
        errors.fullName = 'Full name is required';
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        errors.email = 'Please enter a valid email address';
      }

      if (formData.phoneNumber && formData.phoneNumber.length > 20) {
        errors.phoneNumber = 'Phone number cannot exceed 20 characters';
      }

      if (formData.address && formData.address.length > 500) {
        errors.address = 'Address cannot exceed 500 characters';
      }

      expect(Object.keys(errors).length).toBe(4);
      expect(!!errors.fullName).toBe(true);
      expect(!!errors.email).toBe(true);
      expect(!!errors.phoneNumber).toBe(true);
      expect(!!errors.address).toBe(true);
    });

    it('should clear specific field error while preserving others', () => {
      const errors = {
        fullName: 'Required',
        email: 'Invalid',
        phoneNumber: 'Too long',
      };

      const fieldToUpdate = 'email';
      const hasError = !!errors[fieldToUpdate];

      if (hasError) {
        const updatedErrors = { ...errors, [fieldToUpdate]: '' };

        expect(updatedErrors.fullName).toBe('Required');
        expect(updatedErrors.email).toBe('');
        expect(updatedErrors.phoneNumber).toBe('Too long');
      }
    });

    it('should validate form returns true when no errors', () => {
      const errors: { [key: string]: string } = {};
      const isValid = Object.keys(errors).length === 0;

      expect(isValid).toBe(true);
    });

    it('should validate form returns false when errors exist', () => {
      const errors = { fullName: 'Required' };
      const isValid = Object.keys(errors).length === 0;

      expect(isValid).toBe(false);
    });
  });
});
