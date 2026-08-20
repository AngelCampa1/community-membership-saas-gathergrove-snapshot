import React from 'react';
import { render, screen } from '@testing-library/react';
import { AuthProvider, useAuthContext } from '../AuthContext';
import { useAuth } from '@/hooks/useAuth';

// Mock useAuth hook
jest.mock('@/hooks/useAuth');

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('AuthContext', () => {
  const mockAuthValue = {
    user: { id: 1, email: 'test@example.com', name: 'Test User' },
    isAuthenticated: true,
    isLoading: false,
    login: jest.fn(),
    logout: jest.fn(),
    register: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue(mockAuthValue as any);
  });

  describe('AuthProvider', () => {
    it('should render children', () => {
      render(
        <AuthProvider>
          <div>Test Child</div>
        </AuthProvider>
      );

      expect(screen.getByText('Test Child')).toBeInTheDocument();
    });

    it('should call useAuth hook', () => {
      render(
        <AuthProvider>
          <div>Test</div>
        </AuthProvider>
      );

      expect(mockUseAuth).toHaveBeenCalledTimes(1);
    });

    it('should provide auth context to children', () => {
      const TestComponent = () => {
        const auth = useAuthContext();
        return <div>User: {auth.user?.name}</div>;
      };

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      expect(screen.getByText('User: Test User')).toBeInTheDocument();
    });

    it('should update context when auth state changes', () => {
      const TestComponent = () => {
        const auth = useAuthContext();
        return (
          <div>
            <div>Authenticated: {String(auth.isAuthenticated)}</div>
            <div>Loading: {String(auth.isLoading)}</div>
          </div>
        );
      };

      const { rerender } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      expect(screen.getByText('Authenticated: true')).toBeInTheDocument();
      expect(screen.getByText('Loading: false')).toBeInTheDocument();

      // Update mock to return different state
      mockUseAuth.mockReturnValue({
        ...mockAuthValue,
        isAuthenticated: false,
        isLoading: true,
      } as any);

      rerender(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      expect(screen.getByText('Authenticated: false')).toBeInTheDocument();
      expect(screen.getByText('Loading: true')).toBeInTheDocument();
    });
  });

  describe('useAuthContext', () => {
    it('should return auth context when used within provider', () => {
      const TestComponent = () => {
        const auth = useAuthContext();
        return (
          <div>
            <div data-testid="email">{auth.user?.email}</div>
            <div data-testid="authenticated">{String(auth.isAuthenticated)}</div>
          </div>
        );
      };

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      expect(screen.getByTestId('email')).toHaveTextContent('test@example.com');
      expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
    });

    it('should throw error when used outside provider', () => {
      const TestComponent = () => {
        useAuthContext();
        return <div>Test</div>;
      };

      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => render(<TestComponent />)).toThrow(
        'useAuthContext must be used within an AuthProvider'
      );

      consoleSpy.mockRestore();
    });

    it('should provide access to login function', () => {
      const TestComponent = () => {
        const auth = useAuthContext();
        return (
          <button onClick={() => auth.login({ email: 'test', password: 'test' })}>
            Login
          </button>
        );
      };

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      const loginButton = screen.getByRole('button', { name: /login/i });
      loginButton.click();

      expect(mockAuthValue.login).toHaveBeenCalledWith({
        email: 'test',
        password: 'test',
      });
    });

    it('should provide access to logout function', () => {
      const TestComponent = () => {
        const auth = useAuthContext();
        return <button onClick={() => auth.logout()}>Logout</button>;
      };

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      const logoutButton = screen.getByRole('button', { name: /logout/i });
      logoutButton.click();

      expect(mockAuthValue.logout).toHaveBeenCalledTimes(1);
    });

    it('should provide access to register function', () => {
      const TestComponent = () => {
        const auth = useAuthContext();
        return (
          <button
            onClick={() =>
              auth.register({ email: 'new@test.com', password: 'pass', name: 'New User' })
            }
          >
            Register
          </button>
        );
      };

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      const registerButton = screen.getByRole('button', { name: /register/i });
      registerButton.click();

      expect(mockAuthValue.register).toHaveBeenCalledWith({
        email: 'new@test.com',
        password: 'pass',
        name: 'New User',
      });
    });
  });

  describe('Context Value', () => {
    it('should handle null user', () => {
      mockUseAuth.mockReturnValue({
        ...mockAuthValue,
        user: null,
        isAuthenticated: false,
      } as any);

      const TestComponent = () => {
        const auth = useAuthContext();
        return <div>User: {auth.user ? auth.user.name : 'null'}</div>;
      };

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      expect(screen.getByText('User: null')).toBeInTheDocument();
    });

    it('should handle loading state', () => {
      mockUseAuth.mockReturnValue({
        ...mockAuthValue,
        isLoading: true,
        user: null,
        isAuthenticated: false,
      } as any);

      const TestComponent = () => {
        const auth = useAuthContext();
        return <div>{auth.isLoading ? 'Loading...' : 'Ready'}</div>;
      };

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should provide all auth methods', () => {
      const TestComponent = () => {
        const auth = useAuthContext();
        return (
          <div>
            <div>Has login: {String(typeof auth.login === 'function')}</div>
            <div>Has logout: {String(typeof auth.logout === 'function')}</div>
            <div>Has register: {String(typeof auth.register === 'function')}</div>
          </div>
        );
      };

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      expect(screen.getByText('Has login: true')).toBeInTheDocument();
      expect(screen.getByText('Has logout: true')).toBeInTheDocument();
      expect(screen.getByText('Has register: true')).toBeInTheDocument();
    });
  });

  describe('Multiple Consumers', () => {
    it('should provide same context to multiple consumers', () => {
      const Consumer1 = () => {
        const auth = useAuthContext();
        return <div>Consumer1: {auth.user?.email}</div>;
      };

      const Consumer2 = () => {
        const auth = useAuthContext();
        return <div>Consumer2: {auth.user?.name}</div>;
      };

      render(
        <AuthProvider>
          <Consumer1 />
          <Consumer2 />
        </AuthProvider>
      );

      expect(screen.getByText('Consumer1: test@example.com')).toBeInTheDocument();
      expect(screen.getByText('Consumer2: Test User')).toBeInTheDocument();
    });

    it('should allow nested providers', () => {
      const InnerComponent = () => {
        const auth = useAuthContext();
        return <div>Inner: {auth.user?.name}</div>;
      };

      render(
        <AuthProvider>
          <AuthProvider>
            <InnerComponent />
          </AuthProvider>
        </AuthProvider>
      );

      expect(screen.getByText('Inner: Test User')).toBeInTheDocument();
      expect(mockUseAuth).toHaveBeenCalledTimes(2); // Called by both providers
    });
  });
});
