/**
 * EXAMPLES: How to use the new ValidationService and useFormValidation hook
 * 
 * This file demonstrates different patterns for client-side validation
 * that can be used throughout the GatherGrove application.
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ValidationService } from '@/lib/validationService';
import { useFormValidation, useFieldValidation } from '@/hooks/useFormValidation';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

// Example 1: Simple validation with useFieldValidation hook
export function SimpleValidationExample() {
  const [email, setEmail] = useState('');
  const { validateAndShow } = useFieldValidation();

  const handleEmailBlur = () => {
    // Validate single field and show error toast if invalid
    validateAndShow(email, [
      ValidationService.rules.required('Email'),
      ValidationService.rules.email()
    ]);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Example 1: Simple Field Validation</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={handleEmailBlur}
            placeholder="user@example.com"
          />
          <p className="text-sm text-muted-foreground">
            Validation occurs on blur with toast error messages
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// Example 2: Form validation with error display
export function FormValidationExample() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  });

  // Define validation rules for the form
  const validationRules = {
    firstName: ValidationService.rules.required('First name'),
    lastName: ValidationService.rules.required('Last name'),
    email: ValidationService.rules.email(),
    phone: ValidationService.rules.phone()
  };

  const { errors, validateForm, clearErrors } = useFormValidation({
    validationRules
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      clearErrors(field);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationResult = validateForm(formData);
    
    if (validationResult.isValid) {
      toast.success('Form is valid! Ready to submit.');
      logger.debug('ui', 'Form validation example submission', { formData });
    } else {
      // Show first error as toast
      if (validationResult.firstError) {
        ValidationService.showValidationError(validationResult.firstError);
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Example 2: Form Validation with Error Display</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                className={errors.firstName ? 'border-destructive' : ''}
              />
              {errors.firstName && (
                <p className="text-sm text-destructive">{errors.firstName}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                className={errors.lastName ? 'border-destructive' : ''}
              />
              {errors.lastName && (
                <p className="text-sm text-destructive">{errors.lastName}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className={errors.email ? 'border-destructive' : ''}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              className={errors.phone ? 'border-destructive' : ''}
            />
            {errors.phone && (
              <p className="text-sm text-destructive">{errors.phone}</p>
            )}
          </div>

          <Button type="submit">Submit Form</Button>
        </form>
      </CardContent>
    </Card>
  );
}

// Example 3: Using predefined schemas
export function SchemaValidationExample() {
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });

  const { validateFormAndShow } = useFieldValidation();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    // Use predefined login schema
    const validationResult = validateFormAndShow(loginData, ValidationService.schemas.login);
    
    if (validationResult.isValid) {
      toast.success('Login validation passed!');
      logger.debug('ui', 'Login validation example passed', { email: loginData.email });
    }
    // Error is automatically shown by validateFormAndShow
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Example 3: Using Predefined Schemas</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="loginEmail">Email</Label>
            <Input
              id="loginEmail"
              type="email"
              value={loginData.email}
              onChange={(e) => setLoginData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="user@example.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="loginPassword">Password</Label>
            <Input
              id="loginPassword"
              type="password"
              value={loginData.password}
              onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
              placeholder="Enter password"
            />
          </div>

          <Button type="submit">Login</Button>
        </form>
        
        <div className="mt-4 text-sm text-muted-foreground">
          <p>Available predefined schemas:</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>ValidationService.schemas.login</li>
            <li>ValidationService.schemas.register</li>
            <li>ValidationService.schemas.forgotPassword</li>
            <li>ValidationService.schemas.membershipType</li>
            <li>ValidationService.schemas.event</li>
            <li>ValidationService.schemas.member</li>
            <li>ValidationService.schemas.payment</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

// Example 4: Custom validation rules
export function CustomValidationExample() {
  const [clubData, setClubData] = useState({
    clubName: '',
    memberLimit: '',
    website: ''
  });

  // Custom validation rules
  const customValidationRules = {
    clubName: ValidationService.rules.clubName(),
    memberLimit: (value: unknown) => {
      const strValue = String(value || '');
      const num = parseInt(strValue);
      if (!strValue) return 'Member limit is required';
      if (isNaN(num)) return 'Member limit must be a number';
      if (num < 1) return 'Member limit must be at least 1';
      if (num > 1000) return 'Member limit cannot exceed 1000';
      return null;
    },
    website: (value: unknown) => {
      const strValue = String(value || '');
      if (!strValue) return null; // Optional field
      try {
        const url = new URL(strValue);
        if (!['http:', 'https:'].includes(url.protocol)) {
          return 'Website must be a valid HTTP or HTTPS URL';
        }
        return null;
      } catch {
        return 'Please enter a valid website URL';
      }
    }
  };

  const { errors, validateForm } = useFormValidation({
    validationRules: customValidationRules
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationResult = validateForm(clubData);
    
    if (validationResult.isValid) {
      toast.success('Club data is valid!');
      logger.debug('ui', 'Club validation example passed', { clubName: clubData.clubName, memberLimit: clubData.memberLimit });
    } else if (validationResult.firstError) {
      ValidationService.showValidationError(validationResult.firstError);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Example 4: Custom Validation Rules</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="clubName">Club Name</Label>
            <Input
              id="clubName"
              value={clubData.clubName}
              onChange={(e) => setClubData(prev => ({ ...prev, clubName: e.target.value }))}
              className={errors.clubName ? 'border-destructive' : ''}
            />
            {errors.clubName && (
              <p className="text-sm text-destructive">{errors.clubName}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="memberLimit">Member Limit</Label>
            <Input
              id="memberLimit"
              type="number"
              value={clubData.memberLimit}
              onChange={(e) => setClubData(prev => ({ ...prev, memberLimit: e.target.value }))}
              className={errors.memberLimit ? 'border-destructive' : ''}
            />
            {errors.memberLimit && (
              <p className="text-sm text-destructive">{errors.memberLimit}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="website">Website (Optional)</Label>
            <Input
              id="website"
              type="url"
              value={clubData.website}
              onChange={(e) => setClubData(prev => ({ ...prev, website: e.target.value }))}
              className={errors.website ? 'border-destructive' : ''}
              placeholder="https://your-club.com"
            />
            {errors.website && (
              <p className="text-sm text-destructive">{errors.website}</p>
            )}
          </div>

          <Button type="submit">Save Club Settings</Button>
        </form>
      </CardContent>
    </Card>
  );
}

// Main component showcasing all examples
export function ValidationExamples() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Validation System Examples</h1>
        <p className="text-muted-foreground">
          Demonstrations of the new ValidationService and useFormValidation hook
        </p>
      </div>
      
      <SimpleValidationExample />
      <FormValidationExample />
      <SchemaValidationExample />
      <CustomValidationExample />
    </div>
  );
}