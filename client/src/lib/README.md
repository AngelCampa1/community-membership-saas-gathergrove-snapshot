# Error Handling System Documentation

## Overview

GatherGrove now has a comprehensive, centralized error handling system that provides consistent, user-friendly error messages across the entire web application. This system includes standardized error types, centralized error processing, reusable UI components, and improved developer experience.

## Key Features

- **Centralized Error Processing**: All API errors are processed through a single interceptor
- **Standardized Error Types**: Consistent error categorization and typing
- **User-Friendly Messages**: Context-aware, actionable error messages
- **Reusable UI Components**: Pre-built error display components
- **Developer Tools**: Enhanced debugging and logging in development
- **Toast Notifications**: Non-blocking error feedback using Sonner
- **React Error Boundaries**: Catch and handle component errors gracefully

## Architecture

### 1. Error Types (`/types/errors.ts`)

```typescript
// Basic error interfaces
interface ApiError {
  message: string;
  status: number;
  code?: string;
  details?: Record<string, unknown>;
}

// Error categories
enum ErrorTypes {
  NETWORK_ERROR = 'NETWORK_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  // ... more types
}

// Enhanced error class
class ApiErrorClass extends Error {
  status: number;
  type: ErrorTypes;
  code?: string;
  details?: Record<string, unknown>;
}
```

### 2. Centralized Error Handler (`/lib/errorHandler.ts`)

```typescript
class ErrorHandler {
  // Parse and standardize any error type
  static handleApiError(error: unknown, context?: string): ApiErrorClass

  // Show toast notifications with user-friendly messages
  static showErrorToast(error: unknown, customMessage?: string): void
  static showSuccessToast(message: string, action?: ActionConfig): void

  // Handle form validation errors
  static handleValidationErrors(error: unknown): FormErrors
}
```

### 3. API Client with Interceptors (`/services/apiClient.ts`)

- **Request Interceptor**: Logs outgoing requests in development
- **Response Interceptor**: Automatically processes all errors and creates standardized `ApiErrorClass` instances
- **Timeout Configuration**: 30-second timeout for all requests
- **Network Error Detection**: Identifies connection issues vs server errors

### 4. UI Components

#### Error Boundary (`/components/ui/error-boundary.tsx`)
```tsx
<ErrorBoundary onError={handleError}>
  <YourComponent />
</ErrorBoundary>
```

#### Form Errors (`/components/ui/form-error.tsx`)
```tsx
<FormError message={errorMessage} variant="inline" />
<FieldError name="email" errors={formErrors} />
```

#### Loading with Error States (`/components/ui/loading-error.tsx`)
```tsx
<LoadingError
  isLoading={loading}
  error={error}
  onRetry={retry}
  errorTitle="Failed to load data"
>
  <YourContent />
</LoadingError>
```

## Usage Guide

### 1. Service Layer Error Handling

**Before (Inconsistent):**
```typescript
async login(credentials: LoginRequest): Promise<LoginResponse> {
  const response = await apiClient.post('/auth/login', credentials);
  return response.data;
}
```

**After (Improved):**
```typescript
import { handleApiError, ApiErrorClass, ErrorTypes } from '@/lib/errorHandler';

async login(credentials: LoginRequest): Promise<LoginResponse> {
  try {
    const response = await apiClient.post('/auth/login', credentials);
    return response.data;
  } catch (error) {
    const apiError = handleApiError(error, 'login');
    
    // Provide specific error messages for this context
    if (apiError.status === 401) {
      throw new ApiErrorClass(
        'The email or password you entered is incorrect. Please try again.',
        401,
        ErrorTypes.AUTHENTICATION_ERROR
      );
    }
    
    throw apiError;
  }
}
```

### 2. Component Error Handling

**Before (Basic toast):**
```typescript
try {
  await someApiCall();
  toast.success("Success!");
} catch (error) {
  toast.error("Something went wrong");
}
```

**After (Enhanced):**
```typescript
import { showErrorToast, showSuccessToast } from '@/lib/errorHandler';

try {
  await someApiCall();
  showSuccessToast("Operation completed successfully!");
} catch (error) {
  showErrorToast(error); // Automatically shows user-friendly message
}
```

### 3. Form Validation

**Before (Manual error handling):**
```typescript
const [errors, setErrors] = useState<Record<string, string>>({});

// Manual error processing...
```

**After (Standardized):**
```typescript
import { handleValidationErrors } from '@/lib/errorHandler';
import { FieldError } from '@/components/ui/form-error';

const [errors, setErrors] = useState<FormErrors>({});

try {
  await submitForm(data);
} catch (error) {
  const validationErrors = handleValidationErrors(error);
  setErrors(validationErrors);
}

// In JSX:
<FieldError name="email" errors={errors} />
```

### 4. Loading States with Error Handling

**Before (Manual state management):**
```typescript
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);
const [data, setData] = useState(null);

// Complex loading/error logic...
```

**After (Simplified):**
```typescript
import { DataLoadingError } from '@/components/ui/loading-error';

<DataLoadingError
  isLoading={loading}
  error={error}
  onRetry={refetch}
  isEmpty={!data?.length}
  emptyMessage="No items found"
>
  <YourDataDisplay data={data} />
</DataLoadingError>
```

## Error Message Categories

### Network Errors
- **Connection Failed**: "Unable to connect to the server. Please check your internet connection."
- **Timeout**: "The request is taking longer than expected. Please try again."
- **Offline**: "You appear to be offline. Please check your internet connection and try again."

### Authentication Errors
- **Invalid Credentials**: "The email or password you entered is incorrect. Please try again."
- **Session Expired**: "Your session has expired. Please log in again."
- **Access Denied**: "You don't have permission to perform this action."

### Validation Errors
- **Required Fields**: "This field is required."
- **Invalid Email**: "Please enter a valid email address."
- **Password Requirements**: "Password must be at least 8 characters long."

### Payment Errors
- **Card Declined**: "Your card was declined. Please try a different payment method."
- **Invalid Card**: "The card information you entered is invalid. Please check and try again."
- **Payment Failed**: "Payment processing failed. Please try again or use a different payment method."

### Server Errors
- **Generic**: "Something went wrong on our end. Please try again in a moment."
- **Maintenance**: "The system is currently undergoing maintenance. Please try again later."

## Best Practices

### 1. Always Use Centralized Error Handling
```typescript
// ✅ Good
import { showErrorToast } from '@/lib/errorHandler';
showErrorToast(error);

// ❌ Avoid
toast.error("Generic error message");
```

### 2. Provide Context-Specific Messages
```typescript
// ✅ Good
const apiError = handleApiError(error, 'user-registration');
if (apiError.status === 409) {
  throw new ApiErrorClass(
    'An account with this email already exists. Please use a different email.',
    409,
    ErrorTypes.VALIDATION_ERROR
  );
}

// ❌ Generic
throw new Error("Error occurred");
```

### 3. Use Loading Error Components
```typescript
// ✅ Good - Handles all states
<LoadingError isLoading={loading} error={error} onRetry={retry}>
  <Content />
</LoadingError>

// ❌ Manual - Error-prone
{loading && <Spinner />}
{error && <ErrorMessage />}
{!loading && !error && <Content />}
```

### 4. Wrap Components in Error Boundaries
```typescript
// ✅ Good - In layout or page components
<ErrorBoundary>
  <ComplexComponent />
</ErrorBoundary>

// For custom error handling
<ErrorBoundary onError={(error, errorInfo) => logToService(error)}>
  <CriticalComponent />
</ErrorBoundary>
```

## Migration Guide

### Step 1: Update Service Methods
1. Import error handling utilities
2. Wrap API calls in try-catch blocks
3. Use `handleApiError` for consistent processing
4. Throw `ApiErrorClass` with specific messages

### Step 2: Update Components
1. Replace `toast.error()` with `showErrorToast()`
2. Replace `toast.success()` with `showSuccessToast()`
3. Use form error components for validation
4. Add loading error wrappers where appropriate

### Step 3: Add Error Boundaries
1. Wrap route components in error boundaries
2. Add custom error handlers for critical sections
3. Test error scenarios thoroughly

## Testing

### Error Handler Tests
```typescript
describe('ErrorHandler', () => {
  it('should show user-friendly message for API errors', () => {
    const error = new ApiErrorClass('Server Error', 500, ErrorTypes.SERVER_ERROR);
    showErrorToast(error);
    expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('Something went wrong'));
  });
});
```

### Component Error Tests
```typescript
describe('MyComponent', () => {
  it('should handle API errors gracefully', async () => {
    const mockError = new ApiErrorClass('Network Error', 0, ErrorTypes.NETWORK_ERROR);
    mockApiCall.mockRejectedValue(mockError);
    
    render(<MyComponent />);
    await waitFor(() => {
      expect(screen.getByText(/unable to connect/i)).toBeInTheDocument();
    });
  });
});
```

## Monitoring and Logging

### Development
- All errors are logged to console with context
- Error boundaries show detailed error information
- API requests/responses are logged

### Production
- Error boundaries log to external service (Sentry, LogRocket, etc.)
- User-friendly messages shown to users
- Detailed errors logged for debugging

## Customization

### Adding New Error Types
```typescript
// In /types/errors.ts
export enum ErrorTypes {
  // ... existing types
  CUSTOM_ERROR = 'CUSTOM_ERROR'
}

// In ERROR_MESSAGES
CUSTOM: {
  SPECIFIC_CASE: 'User-friendly message for this case'
}
```

### Custom Error Components
```typescript
import { ErrorBoundary } from '@/components/ui/error-boundary';

<ErrorBoundary 
  fallback={<CustomErrorUI />}
  onError={customErrorHandler}
>
  <YourComponent />
</ErrorBoundary>
```

This error handling system provides a robust foundation for delivering excellent user experience while maintaining developer productivity and debugging capabilities. 