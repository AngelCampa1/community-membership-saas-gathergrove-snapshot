# Frontend Architecture Guide - Perfect Patterns Implementation

## Overview

This guide documents the perfect frontend architecture patterns implemented in GatherGrove, providing comprehensive standards for scalable, maintainable, and type-safe React development.

## Architecture Principles

### 1. **Consistency First**
- All components follow the same patterns
- Standardized prop interfaces
- Consistent error handling
- Uniform styling approaches

### 2. **Type Safety**
- Complete TypeScript coverage
- Branded types for domain safety
- Discriminated unions for state management
- Comprehensive type guards

### 3. **Performance Optimized**
- Memoization patterns
- Lazy loading
- Efficient re-rendering
- Bundle optimization

### 4. **Error Resilient**
- Comprehensive error boundaries
- Graceful degradation
- User-friendly error messages
- Automatic recovery mechanisms

## Core Patterns

### Service Layer Architecture

#### Enhanced Base Service
```typescript
import { EnhancedBaseService, SERVICE_CONFIGS } from '@/lib/service-factory';

class MyService extends EnhancedBaseService {
  constructor() {
    super({
      ...SERVICE_CONFIGS.DEFAULT,
      baseUrl: '/my-endpoint',
    });
  }

  @cached(5 * 60 * 1000) // Cache for 5 minutes
  @retry(3, 1000) // Retry 3 times with 1s delay
  async getData(): Promise<MyData> {
    const response = await this.get<MyData>('/data');
    return response.data;
  }
}
```

#### Service Registration
```typescript
import { ServiceFactory } from '@/lib/service-factory';

const myService = ServiceFactory.create(
  MyService,
  SERVICE_CONFIGS.DEFAULT,
  'myService'
);

// Later access
const service = ServiceFactory.get<MyService>('myService');
```

### Context Patterns

#### Strict Context Creation
```typescript
import { createStrictContext } from '@/lib/context-factory';

interface MyContextType {
  data: MyData;
  loading: boolean;
  refresh: () => Promise<void>;
}

const [MyContext, useMyContext] = createStrictContext<MyContextType>('My');

function MyProvider({ children }: { children: ReactNode }) {
  // Implementation
  return (
    <MyContext.Provider value={contextValue}>
      {children}
    </MyContext.Provider>
  );
}
```

#### Async Context with Auto-fetching
```typescript
import { createAsyncContext } from '@/lib/context-factory';

const [DataContext, useDataContext, DataProvider] = createAsyncContext(
  'Data',
  () => fetchData()
);

// Usage
function App() {
  return (
    <DataProvider autoFetch={true}>
      <MyComponent />
    </DataProvider>
  );
}
```

### Error Boundary Patterns

#### Component-Level Error Boundary
```typescript
import { createComponentErrorBoundary } from '@/lib/error-boundary-factory';

const ComponentErrorBoundary = createComponentErrorBoundary({
  fallback: CustomErrorFallback,
  maxRetries: 3,
  onError: (error, errorInfo) => {
    console.error('Component error:', error);
  },
});

function MyComponent() {
  return (
    <ComponentErrorBoundary>
      <RiskyComponent />
    </ComponentErrorBoundary>
  );
}
```

#### Page-Level Error Boundary
```typescript
import { createPageErrorBoundary } from '@/lib/error-boundary-factory';

const PageErrorBoundary = createPageErrorBoundary({
  fallback: FullPageErrorFallback,
});

function App() {
  return (
    <PageErrorBoundary>
      <Router />
    </PageErrorBoundary>
  );
}
```

### Async State Management

#### Enhanced Async Operations
```typescript
import { useAsyncOperation } from '@/lib/async-state-manager';

function MyComponent() {
  const { data, loading, error, execute, reset } = useAsyncOperation(
    async (params: SearchParams) => {
      return await searchService.search(params);
    },
    {
      retries: 3,
      retryDelay: 1000,
      debounceMs: 300,
    }
  );

  return (
    <AsyncState loading={loading} error={error} data={data}>
      {data && <SearchResults results={data} />}
    </AsyncState>
  );
}
```

#### Query with Caching
```typescript
import { useQuery } from '@/lib/async-state-manager';

function UserProfile({ userId }: { userId: string }) {
  const { data, isLoading, error, refetch } = useQuery(
    () => userService.getUser(userId),
    {
      queryKey: ['user', userId],
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: true,
    }
  );

  return (
    <DataLoader loading={isLoading} error={error} data={data}>
      {data && <UserCard user={data} />}
    </DataLoader>
  );
}
```

### Component Composition Patterns

#### Compound Components
```typescript
import { createCompoundComponent } from '@/lib/component-factory';

const Dialog = createCompoundComponent({
  Root: DialogRoot,
  Trigger: DialogTrigger,
  Content: DialogContent,
  Header: DialogHeader,
  Footer: DialogFooter,
});

// Usage
function MyDialog() {
  return (
    <Dialog.Root>
      <Dialog.Trigger>Open Dialog</Dialog.Trigger>
      <Dialog.Content>
        <Dialog.Header>Title</Dialog.Header>
        <p>Content</p>
        <Dialog.Footer>
          <Button>Close</Button>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog.Root>
  );
}
```

#### Higher-Order Components
```typescript
import { withLoadingState, withErrorHandling } from '@/lib/component-factory';

const EnhancedComponent = withLoadingState(
  withErrorHandling(MyComponent)
);
```

#### Form Fields with Consistent Styling
```typescript
import { createFormField } from '@/lib/component-factory';

const FormInput = createFormField(Input, 'input-base-styles');

function LoginForm() {
  return (
    <form>
      <FormInput
        label="Email"
        type="email"
        required
        error={errors.email}
        helperText="Enter your email address"
      />
    </form>
  );
}
```

### Type Safety Patterns

#### Branded Types
```typescript
import { Email, UserId, isEmail } from '@/lib/type-safety-patterns';

function sendEmail(to: Email, userId: UserId) {
  // Type-safe email handling
}

// Type guard usage
function validateEmail(input: string): Email | null {
  return isEmail(input) ? input : null;
}
```

#### Discriminated Unions
```typescript
import { AsyncState } from '@/lib/type-safety-patterns';

function handleAsyncState<T>(state: AsyncState<T>) {
  switch (state.status) {
    case 'idle':
      return <div>Ready to load</div>;
    case 'loading':
      return <Spinner />;
    case 'success':
      return <div>{state.data}</div>; // TypeScript knows data exists
    case 'error':
      return <ErrorMessage error={state.error} />; // TypeScript knows error exists
    default:
      return exhaustiveSwitch(state); // Compile-time completeness check
  }
}
```

#### Type Guards and Assertions
```typescript
import { isArray, assertIsString } from '@/lib/type-safety-patterns';

function processData(data: unknown) {
  if (isArray<string>(data)) {
    // TypeScript knows data is string[]
    return data.map(item => item.toUpperCase());
  }
  
  assertIsString(data); // Throws if not string
  // TypeScript knows data is string after assertion
  return data.trim();
}
```

## File Organization Standards

### Directory Structure
```
src/
├── lib/                    # Architectural patterns and utilities
│   ├── architectural-patterns.ts
│   ├── service-factory.ts
│   ├── context-factory.ts
│   ├── error-boundary-factory.ts
│   ├── async-state-manager.ts
│   ├── component-factory.ts
│   ├── type-safety-patterns.ts
│   └── index.ts
├── components/             # Reusable UI components
│   ├── ui/                # Base UI components
│   ├── features/          # Feature-specific components
│   └── shared/            # Shared business components
├── services/              # API and business logic services
├── hooks/                 # Custom React hooks
├── contexts/              # React contexts
├── types/                 # TypeScript type definitions
└── utils/                 # Pure utility functions
```

### Component File Structure
```typescript
// MyComponent.tsx
import React from 'react';
import { BaseComponentProps } from '@/lib/architectural-patterns';

interface MyComponentProps extends BaseComponentProps {
  title: string;
  onAction: () => void;
}

export function MyComponent({ title, onAction, className, ...props }: MyComponentProps) {
  return (
    <div className={cn('base-styles', className)} {...props}>
      <h2>{title}</h2>
      <button onClick={onAction}>Action</button>
    </div>
  );
}

export default MyComponent;
```

### Service File Structure
```typescript
// myService.ts
import { EnhancedBaseService, SERVICE_CONFIGS } from '@/lib/service-factory';
import { MyData, CreateRequest, UpdateRequest } from './types';

export class MyService extends EnhancedBaseService {
  constructor() {
    super({
      ...SERVICE_CONFIGS.DEFAULT,
      baseUrl: '/my-endpoint',
    });
  }

  async getAll(): Promise<MyData[]> {
    const response = await this.get<MyData[]>('/');
    return response.data;
  }

  async create(data: CreateRequest): Promise<MyData> {
    const response = await this.post<MyData>('/', data);
    return response.data;
  }

  async update(id: string, data: UpdateRequest): Promise<MyData> {
    const response = await this.put<MyData>(`/${id}`, data);
    return response.data;
  }

  async delete(id: string): Promise<void> {
    await this.delete(`/${id}`);
  }
}

export const myService = new MyService();
export default myService;
```

## Performance Guidelines

### 1. **Component Optimization**
- Use `memo` for expensive components
- Implement proper dependency arrays
- Avoid inline object/function creation
- Use callback memoization

### 2. **Bundle Optimization**
- Lazy load route components
- Code split by features
- Tree shake unused imports
- Optimize third-party libraries

### 3. **State Management**
- Minimize re-renders
- Use context selectively
- Implement proper caching
- Debounce expensive operations

### 4. **Network Optimization**
- Cache API responses
- Implement request deduplication
- Use background refetching
- Optimize payload sizes

## Testing Patterns

### Component Testing
```typescript
import { render, screen } from '@testing-library/react';
import { MyComponent } from './MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(
      <MyComponent 
        title="Test Title" 
        onAction={() => {}} 
        data-testid="my-component"
      />
    );
    
    expect(screen.getByTestId('my-component')).toBeInTheDocument();
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });
});
```

### Service Testing
```typescript
import { myService } from './myService';

// Mock the base service
jest.mock('@/lib/service-factory');

describe('MyService', () => {
  it('fetches data correctly', async () => {
    const mockData = [{ id: '1', name: 'Test' }];
    
    jest.spyOn(myService, 'get').mockResolvedValue({
      data: mockData,
      success: true,
    });
    
    const result = await myService.getAll();
    
    expect(result).toEqual(mockData);
  });
});
```

## Migration Guide

### From Legacy Patterns

1. **Service Migration**
   ```typescript
   // Old
   class OldService {
     async getData() {
       try {
         const response = await apiClient.get('/data');
         return response.data;
       } catch (error) {
         throw error;
       }
     }
   }
   
   // New
   class NewService extends EnhancedBaseService {
     @cached(5 * 60 * 1000)
     async getData() {
       const response = await this.get<Data>('/data');
       return response.data;
     }
   }
   ```

2. **Context Migration**
   ```typescript
   // Old
   const MyContext = createContext(undefined);
   
   export function useMyContext() {
     const context = useContext(MyContext);
     if (!context) throw new Error('...');
     return context;
   }
   
   // New
   const [MyContext, useMyContext] = createStrictContext<MyContextType>('My');
   ```

3. **Error Boundary Migration**
   ```typescript
   // Old
   class MyErrorBoundary extends Component {
     // Manual implementation
   }
   
   // New
   const MyErrorBoundary = createComponentErrorBoundary({
     fallback: MyErrorFallback,
   });
   ```

## Best Practices Summary

1. **Always use the architectural patterns** - Don't reinvent patterns
2. **Type everything** - Leverage TypeScript to its fullest
3. **Handle errors gracefully** - Use error boundaries everywhere
4. **Optimize performance** - Use caching, memoization, and lazy loading
5. **Test comprehensively** - Test components, hooks, and services
6. **Document patterns** - Keep this guide updated with new patterns
7. **Review regularly** - Ensure patterns are being followed consistently

## Troubleshooting Common Issues

### Type Errors
- Ensure proper import paths for pattern types
- Use type assertions sparingly
- Leverage type guards for runtime safety

### Performance Issues
- Check for unnecessary re-renders
- Verify caching is working correctly
- Profile components with React DevTools

### Error Handling
- Ensure error boundaries are properly placed
- Check error fallback components
- Verify error reporting is working

This guide serves as the foundation for all frontend development in GatherGrove. Following these patterns ensures consistency, maintainability, and scalability across the entire application.