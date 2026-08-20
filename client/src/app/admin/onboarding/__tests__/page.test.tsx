import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import OnboardingPage from '../page';
import { toast } from 'sonner';

// Mock next/navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock the SetupWizard component
jest.mock('@/components/features/setup/setup-wizard', () => ({
  SetupWizard: ({ isOpen, onComplete, onDismiss, clubId, clubName }: any) => (
    isOpen ? (
      <div data-testid="setup-wizard">
        <div>Club ID: {clubId}</div>
        <div>Club Name: {clubName}</div>
        <button onClick={onComplete}>Complete Setup</button>
        <button onClick={onDismiss}>Skip Setup</button>
      </div>
    ) : null
  ),
}));

// Mock ErrorHandler
jest.mock('@/lib/errorHandler', () => ({
  ErrorHandler: {
    handleAuthError: jest.fn((error) => error),
    showErrorToast: jest.fn(),
  },
}));

// Mock logger
jest.mock('@/lib/logger', () => ({
  logger: {
    error: jest.fn(),
  },
}));

// Mock sonner toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock the auth hook
const mockCompleteOnboarding = jest.fn();
const mockUseAuth = jest.fn();
jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

describe('OnboardingPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPush.mockClear();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('Loading State', () => {
    it('renders loading spinner when user is not loaded', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        completeOnboarding: mockCompleteOnboarding,
      });

      render(<OnboardingPage />);

      // Check for the spinner by its class name
      const spinners = document.querySelectorAll('.animate-spin');
      expect(spinners.length).toBeGreaterThan(0);
    });
  });

  describe('Setup Wizard Rendering', () => {
    it('renders SetupWizard when user is loaded', () => {
      mockUseAuth.mockReturnValue({
        user: {
          id: 1,
          email: 'admin@example.com',
          clubId: 123,
          clubName: 'Test Club',
          role: 'Admin',
        },
        completeOnboarding: mockCompleteOnboarding,
      });

      render(<OnboardingPage />);

      expect(screen.getByTestId('setup-wizard')).toBeInTheDocument();
      expect(screen.getByText('Club ID: 123')).toBeInTheDocument();
      expect(screen.getByText('Club Name: Test Club')).toBeInTheDocument();
    });

    it('passes correct props to SetupWizard', () => {
      mockUseAuth.mockReturnValue({
        user: {
          id: 2,
          email: 'member@example.com',
          clubId: 456,
          clubName: 'Another Club',
          role: 'Member',
        },
        completeOnboarding: mockCompleteOnboarding,
      });

      render(<OnboardingPage />);

      const wizard = screen.getByTestId('setup-wizard');
      expect(wizard).toBeInTheDocument();
      expect(screen.getByText('Club ID: 456')).toBeInTheDocument();
      expect(screen.getByText('Club Name: Another Club')).toBeInTheDocument();
    });
  });

  describe('Wizard Completion', () => {
    it('completes onboarding and redirects admin to admin dashboard', async () => {
      const user = userEvent.setup({ delay: null });
      mockCompleteOnboarding.mockResolvedValue(undefined);
      mockUseAuth.mockReturnValue({
        user: {
          id: 1,
          email: 'admin@example.com',
          clubId: 123,
          clubName: 'Test Club',
          role: 'Admin',
        },
        completeOnboarding: mockCompleteOnboarding,
      });

      render(<OnboardingPage />);

      const completeButton = screen.getByRole('button', { name: /Complete Setup/i });
      await user.click(completeButton);

      // Should show completing state
      await waitFor(() => {
        expect(screen.getByText(/Completing setup.../i)).toBeInTheDocument();
      });

      expect(mockCompleteOnboarding).toHaveBeenCalledTimes(1);

      // Fast-forward past the 500ms delay
      jest.advanceTimersByTime(500);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/admin/dashboard');
      });
    });

    it('completes onboarding and redirects member to member dashboard', async () => {
      const user = userEvent.setup({ delay: null });
      mockCompleteOnboarding.mockResolvedValue(undefined);
      mockUseAuth.mockReturnValue({
        user: {
          id: 2,
          email: 'member@example.com',
          clubId: 456,
          clubName: 'Test Club',
          role: 'Member',
        },
        completeOnboarding: mockCompleteOnboarding,
      });

      render(<OnboardingPage />);

      const completeButton = screen.getByRole('button', { name: /Complete Setup/i });
      await user.click(completeButton);

      await waitFor(() => {
        expect(screen.getByText(/Completing setup.../i)).toBeInTheDocument();
      });

      expect(mockCompleteOnboarding).toHaveBeenCalledTimes(1);

      // Fast-forward past the 500ms delay
      jest.advanceTimersByTime(500);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/app/dashboard');
      });
    });

    it('handles completion errors gracefully', async () => {
      const user = userEvent.setup({ delay: null });
      const mockError = new Error('Onboarding completion failed');
      mockCompleteOnboarding.mockRejectedValue(mockError);

      mockUseAuth.mockReturnValue({
        user: {
          id: 1,
          email: 'admin@example.com',
          clubId: 123,
          clubName: 'Test Club',
          role: 'Admin',
        },
        completeOnboarding: mockCompleteOnboarding,
      });

      render(<OnboardingPage />);

      const completeButton = screen.getByRole('button', { name: /Complete Setup/i });
      await user.click(completeButton);

      await waitFor(() => {
        expect(mockCompleteOnboarding).toHaveBeenCalledTimes(1);
      });

      // Should not redirect on error
      expect(mockPush).not.toHaveBeenCalled();

      // Wizard should still be visible (kept open on error)
      await waitFor(() => {
        expect(screen.getByTestId('setup-wizard')).toBeInTheDocument();
      });
    });
  });

  describe('Wizard Dismissal', () => {
    it('completes onboarding when wizard is dismissed by admin', async () => {
      const user = userEvent.setup({ delay: null });
      mockCompleteOnboarding.mockResolvedValue(undefined);
      mockUseAuth.mockReturnValue({
        user: {
          id: 1,
          email: 'admin@example.com',
          clubId: 123,
          clubName: 'Test Club',
          role: 'Admin',
        },
        completeOnboarding: mockCompleteOnboarding,
      });

      render(<OnboardingPage />);

      const skipButton = screen.getByRole('button', { name: /Skip Setup/i });
      await user.click(skipButton);

      await waitFor(() => {
        expect(screen.getByText(/Completing setup.../i)).toBeInTheDocument();
      });

      expect(mockCompleteOnboarding).toHaveBeenCalledTimes(1);

      // Fast-forward past the 500ms delay
      jest.advanceTimersByTime(500);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/admin/dashboard');
      });
    });

    it('completes onboarding when wizard is dismissed by member', async () => {
      const user = userEvent.setup({ delay: null });
      mockCompleteOnboarding.mockResolvedValue(undefined);
      mockUseAuth.mockReturnValue({
        user: {
          id: 2,
          email: 'member@example.com',
          clubId: 456,
          clubName: 'Test Club',
          role: 'Member',
        },
        completeOnboarding: mockCompleteOnboarding,
      });

      render(<OnboardingPage />);

      const skipButton = screen.getByRole('button', { name: /Skip Setup/i });
      await user.click(skipButton);

      await waitFor(() => {
        expect(screen.getByText(/Completing setup.../i)).toBeInTheDocument();
      });

      expect(mockCompleteOnboarding).toHaveBeenCalledTimes(1);

      // Fast-forward past the 500ms delay
      jest.advanceTimersByTime(500);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/app/dashboard');
      });
    });

    it('handles dismissal errors gracefully', async () => {
      const user = userEvent.setup({ delay: null });
      const mockError = new Error('Onboarding dismissal failed');
      mockCompleteOnboarding.mockRejectedValue(mockError);

      mockUseAuth.mockReturnValue({
        user: {
          id: 1,
          email: 'admin@example.com',
          clubId: 123,
          clubName: 'Test Club',
          role: 'Admin',
        },
        completeOnboarding: mockCompleteOnboarding,
      });

      render(<OnboardingPage />);

      const skipButton = screen.getByRole('button', { name: /Skip Setup/i });
      await user.click(skipButton);

      await waitFor(() => {
        expect(mockCompleteOnboarding).toHaveBeenCalledTimes(1);
      });

      // Should not redirect on error
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe('Completing State', () => {
    it('shows completing message during onboarding completion', async () => {
      const user = userEvent.setup({ delay: null });
      // Make completeOnboarding never resolve to keep completing state
      mockCompleteOnboarding.mockImplementation(() => new Promise(() => {}));

      mockUseAuth.mockReturnValue({
        user: {
          id: 1,
          email: 'admin@example.com',
          clubId: 123,
          clubName: 'Test Club',
          role: 'Admin',
        },
        completeOnboarding: mockCompleteOnboarding,
      });

      render(<OnboardingPage />);

      const completeButton = screen.getByRole('button', { name: /Complete Setup/i });
      await user.click(completeButton);

      await waitFor(() => {
        expect(screen.getByText(/Completing setup.../i)).toBeInTheDocument();
      });

      // Wizard should not be visible during completing state
      expect(screen.queryByTestId('setup-wizard')).not.toBeInTheDocument();
    });
  });

  describe('User Role Redirection', () => {
    it('redirects admin to admin dashboard after completion', async () => {
      const user = userEvent.setup({ delay: null });
      mockCompleteOnboarding.mockResolvedValue(undefined);
      mockPush.mockClear();

      mockUseAuth.mockReturnValue({
        user: {
          id: 1,
          email: 'admin@example.com',
          clubId: 123,
          clubName: 'Test Club',
          role: 'Admin',
        },
        completeOnboarding: mockCompleteOnboarding,
      });

      render(<OnboardingPage />);

      const completeButton = screen.getByRole('button', { name: /Complete Setup/i });
      await user.click(completeButton);

      await waitFor(() => {
        expect(mockCompleteOnboarding).toHaveBeenCalledTimes(1);
      });

      // Fast-forward past the 500ms delay
      jest.advanceTimersByTime(500);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/admin/dashboard');
      });
    });

    it('redirects member to member dashboard after completion', async () => {
      const user = userEvent.setup({ delay: null });
      mockCompleteOnboarding.mockResolvedValue(undefined);
      mockPush.mockClear();

      mockUseAuth.mockReturnValue({
        user: {
          id: 2,
          email: 'member@example.com',
          clubId: 456,
          clubName: 'Test Club',
          role: 'Member',
        },
        completeOnboarding: mockCompleteOnboarding,
      });

      render(<OnboardingPage />);

      const completeButton = screen.getByRole('button', { name: /Complete Setup/i });
      await user.click(completeButton);

      await waitFor(() => {
        expect(mockCompleteOnboarding).toHaveBeenCalledTimes(1);
      });

      // Fast-forward past the 500ms delay
      jest.advanceTimersByTime(500);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/app/dashboard');
      });
    });
  });
});
