import React from 'react';

// Mock dependencies BEFORE any other imports
jest.mock('@/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/services/chatSettingsService', () => ({
  chatSettingsService: {
    getSettings: jest.fn(),
    updateSettings: jest.fn(),
    getChatSettings: jest.fn(),
    updateChatSettings: jest.fn(),
  },
}));

// Mock ErrorHandler
jest.mock('@/lib/errorHandler', () => ({
  ErrorHandler: {
    handleApiError: jest.fn((error, options) => ({
      message: error?.message || 'API Error',
      status: 500,
      type: 'SERVER_ERROR'
    })),
    showErrorToast: jest.fn(),
  },
}));

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => {
  const IconComponent = React.forwardRef<HTMLSpanElement, any>(function IconComponent({ size = 16, className, ...props }, ref) {
    return React.createElement('span', {
      ref,
      className: `lucide-icon ${className || ''}`,
      'data-testid': 'lucide-icon',
      style: { width: size, height: size },
      ...props
    });
  });
  
  return {
    Settings: IconComponent,
    Save: IconComponent,
    MessageCircle: IconComponent,
  };
});

// Mock RadixUI components inline to bypass Jest module mapping issues
jest.mock('@radix-ui/react-slot', () => ({
  Slot: ({ children, asChild, ...props }: any) => {
    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children, { ...props, ...(children.props || {})});
    }
    return <div {...props}>{children}</div>;
  },
  Slottable: ({ children }: any) => <>{children}</>,
}));

jest.mock('@radix-ui/react-separator', () => ({
  Root: React.forwardRef(function SeparatorRoot({ orientation = 'horizontal', decorative = true, ...props }: any, ref) {
    return <div ref={ref} role={decorative ? "none" : "separator"} aria-orientation={orientation} {...props} />;
  })
}));

jest.mock('@/components/ui/card', () => ({
  Card: ({ children, className, ...props }: any) => (
    <div className={`card ${className || ''}`} data-testid="card" {...props}>{children}</div>
  ),
  CardHeader: ({ children, className, ...props }: any) => (
    <div className={`card-header ${className || ''}`} data-testid="card-header" {...props}>{children}</div>
  ),
  CardTitle: ({ children, className, ...props }: any) => (
    <h3 className={`card-title ${className || ''}`} data-testid="card-title" {...props}>{children}</h3>
  ),
  CardDescription: ({ children, className, ...props }: any) => (
    <p className={`card-description ${className || ''}`} data-testid="card-description" {...props}>{children}</p>
  ),
  CardContent: ({ children, className, ...props }: any) => (
    <div className={`card-content ${className || ''}`} data-testid="card-content" {...props}>{children}</div>
  ),
  CardFooter: ({ children, className, ...props }: any) => (
    <div className={`card-footer ${className || ''}`} data-testid="card-footer" {...props}>{children}</div>
  ),
}));

jest.mock('@/components/ui/button', () => ({
  Button: React.forwardRef<HTMLButtonElement, any>(function Button({ children, className, variant, size, asChild, ...props }, ref) {
    if (asChild && children) {
      return <>{children}</>;
    }
    return (
      <button
        ref={ref}
        className={`button ${variant || ''} ${size || ''} ${className || ''}`}
        data-testid="button"
        {...props}
      >
        {children}
      </button>
    );
  })
}));

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children, variant, className, ...props }: any) => (
    <span 
      className={`badge ${variant || ''} ${className || ''}`}
      data-testid="badge"
      {...props}
    >
      {children}
    </span>
  ),
}));

jest.mock('@radix-ui/react-dialog', () => ({
  Dialog: ({ children, open }: any) => open ? <div data-testid="dialog-root">{children}</div> : null,
  DialogContent: ({ children, className, ...props }: any) => {
    const { onOpenChange, ...restProps } = props;
    return <div className={`dialog-content ${className || ''}`} data-testid="dialog-content" {...restProps}>{children}</div>;
  },
  DialogHeader: ({ children, className, ...props }: any) => (
    <div className={`dialog-header ${className || ''}`} data-testid="dialog-header" {...props}>{children}</div>
  ),
  DialogTitle: ({ children, className, ...props }: any) => (
    <h2 className={`dialog-title ${className || ''}`} data-testid="dialog-title" {...props}>{children}</h2>
  ),
  DialogDescription: ({ children, className, ...props }: any) => (
    <p className={`dialog-description ${className || ''}`} data-testid="dialog-description" {...props}>{children}</p>
  ),
  DialogFooter: ({ children, className, ...props }: any) => (
    <div className={`dialog-footer ${className || ''}`} data-testid="dialog-footer" {...props}>{children}</div>
  ),
}));

jest.mock('@radix-ui/react-select', () => ({
  Select: ({ children, value, onValueChange }: any) => <div data-testid="select">{children}</div>,
  SelectTrigger: ({ children, className, ...props }: any) => (
    <button className={`select-trigger ${className || ''}`} data-testid="select-trigger" {...props}>
      {children}
    </button>
  ),
  SelectValue: ({ placeholder }: any) => <span data-testid="select-value">{placeholder}</span>,
  SelectContent: ({ children }: any) => <div data-testid="select-content">{children}</div>,
  SelectItem: ({ children, value, ...props }: any) => (
    <div data-testid="select-item" data-value={value} {...props}>{children}</div>
  ),
}));

jest.mock('@radix-ui/react-checkbox', () => ({
  Checkbox: React.forwardRef<HTMLInputElement, any>(function Checkbox({ className, checked, onCheckedChange, ...props }, ref) {
    return (
      <input
        ref={ref}
        type="checkbox"
        className={`checkbox ${className || ''}`}
        checked={Boolean(checked)}
        onChange={(e) => onCheckedChange?.(e.target.checked)}
        data-testid="checkbox"
        {...props}
      />
    );
  })
}));

jest.mock('@/components/ui/input', () => ({
  Input: React.forwardRef<HTMLInputElement, any>(function Input({ className, ...props }, ref) {
    return (
      <input
        ref={ref}
        className={`input ${className || ''}`}
        data-testid="input"
        {...props}
      />
    );
  })
}));

jest.mock('@/components/ui/label', () => ({
  Label: ({ children, className, ...props }: any) => (
    <label className={`label ${className || ''}`} data-testid="label" {...props}>
      {children}
    </label>
  ),
}));

jest.mock('@/components/ui/switch', () => ({
  Switch: React.forwardRef<HTMLButtonElement, any>(function Switch({ checked = false, onCheckedChange, disabled = false, className, ...props }, ref) {
    const handleClick = () => {
      if (!disabled && onCheckedChange) {
        onCheckedChange(!checked);
      }
    };

    return (
      <button
        ref={ref}
        role="switch"
        aria-checked={checked}
        data-testid="switch"
        data-state={checked ? 'checked' : 'unchecked'}
        disabled={disabled}
        className={`switch ${className || ''}`}
        onClick={handleClick}
        {...props}
      >
        <span 
          data-testid="switch-thumb"
          style={{
            display: 'inline-block',
            width: '14px',
            height: '14px',
            backgroundColor: checked ? '#3b82f6' : '#e2e8f0',
            borderRadius: '50%',
            transition: 'all 0.2s ease',
            transform: checked ? 'translateX(100%)' : 'translateX(0)',
          }}
        />
      </button>
    );
  })
}));

jest.mock('@radix-ui/react-progress', () => ({
  Progress: ({ value, className, ...props }: any) => (
    <div 
      className={`progress ${className || ''}`}
      data-testid="progress"
      data-value={value}
      {...props}
    >
      <div style={{ width: `${value || 0}%` }} />
    </div>
  ),
}));

jest.mock('@/components/ui/alert', () => ({
  Alert: ({ children, variant, className, ...props }: any) => (
    <div className={`alert ${variant || ''} ${className || ''}`} data-testid="alert" {...props}>{children}</div>
  ),
  AlertDescription: ({ children, className, ...props }: any) => (
    <div className={`alert-description ${className || ''}`} data-testid="alert-description" {...props}>{children}</div>
  ),
  AlertTitle: ({ children, className, ...props }: any) => (
    <h4 className={`alert-title ${className || ''}`} data-testid="alert-title" {...props}>{children}</h4>
  ),
}));

// Import test utilities and components AFTER mocks
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useAuth } from '@/hooks/useAuth';
import { chatSettingsService } from '@/services/chatSettingsService';
import { toast } from 'sonner';
import { ErrorHandler } from '@/lib/errorHandler';
import ChatSettingsPage from '../page';

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockChatSettingsService = chatSettingsService as jest.Mocked<typeof chatSettingsService>;
const mockToast = toast as jest.Mocked<typeof toast>;
const mockErrorHandler = ErrorHandler as jest.Mocked<typeof ErrorHandler>;

const mockGrowUser = {
  userId: 1,
  fullName: 'John Admin',
  email: 'john@growclub.com',
  clubId: 1,
  clubName: 'Grow Club',
  clubTier: 'Grow',
  tier: 'Grow',
  role: 'Admin',
  isOnboardingCompleted: true,
};

describe('ChatSettingsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Loading State', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: mockGrowUser,
        loading: false,
      error: null,
      clearError: jest.fn(),
      retryLastOperation: jest.fn(),
        login: jest.fn(),
        logout: jest.fn(),
        register: jest.fn(),
        refreshSession: jest.fn(),
        completeOnboarding: jest.fn(),
      });

      mockChatSettingsService.getChatSettings.mockImplementation(
        () => new Promise(() => {}) // Never resolves to keep loading state
      );
    });

    it('should display loading state', () => {
      render(<ChatSettingsPage />);
      
      expect(screen.getByText('Loading...')).toBeInTheDocument();
      expect(screen.getByText('Community Chat Settings')).toBeInTheDocument();
    });
  });

  describe('Chat Settings Display', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: mockGrowUser,
        loading: false,
      error: null,
      clearError: jest.fn(),
      retryLastOperation: jest.fn(),
        login: jest.fn(),
        logout: jest.fn(),
        register: jest.fn(),
        refreshSession: jest.fn(),
        completeOnboarding: jest.fn(),
      });
    });

    it('should display chat settings with default values', async () => {
      mockChatSettingsService.getChatSettings.mockResolvedValue({
        isChatEnabled: false,
      });

      render(<ChatSettingsPage />);

      await waitFor(() => {
        expect(screen.getByText('Club Group Chat Configuration')).toBeInTheDocument();
      });

      expect(screen.getByText('Enable Club Group Chat')).toBeInTheDocument();
      expect(screen.getByTestId('switch-chat-enabled')).toBeInTheDocument();
      expect(screen.getByTestId('button-save-chat-settings')).toBeInTheDocument();
      
      // Check if toggle is off (default)
      const toggle = screen.getByTestId('switch-chat-enabled');
      expect(toggle).not.toBeChecked();
    });

    it('should display chat enabled state', async () => {
      mockChatSettingsService.getChatSettings.mockResolvedValue({
        isChatEnabled: true,
      });

      render(<ChatSettingsPage />);

      await waitFor(() => {
        expect(screen.getByTestId('switch-chat-enabled')).toBeChecked();
      });

      expect(screen.getByText((content) => content.includes('Chat is currently enabled for your club members'))).toBeInTheDocument();
    });

    it('should display chat disabled state', async () => {
      mockChatSettingsService.getChatSettings.mockResolvedValue({
        isChatEnabled: false,
      });

      render(<ChatSettingsPage />);

      await waitFor(() => {
        expect(screen.getByTestId('switch-chat-enabled')).not.toBeChecked();
      });

      expect(screen.getByText((content) => content.includes('Chat is currently disabled - members cannot access group chat'))).toBeInTheDocument();
    });
  });

  describe('Toggle Functionality', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: mockGrowUser,
        loading: false,
      error: null,
      clearError: jest.fn(),
      retryLastOperation: jest.fn(),
        login: jest.fn(),
        logout: jest.fn(),
        register: jest.fn(),
        refreshSession: jest.fn(),
        completeOnboarding: jest.fn(),
      });

      mockChatSettingsService.getChatSettings.mockResolvedValue({
        isChatEnabled: false,
      });
    });

    it('should toggle chat enabled state', async () => {
      render(<ChatSettingsPage />);

      await waitFor(() => {
        expect(screen.getByTestId('switch-chat-enabled')).not.toBeChecked();
      });

      const toggle = screen.getByTestId('switch-chat-enabled');
      fireEvent.click(toggle);

      expect(toggle).toBeChecked();
    });

    it('should save chat settings when enabled', async () => {
      mockChatSettingsService.updateChatSettings.mockResolvedValue({
        isChatEnabled: true,
      });

      render(<ChatSettingsPage />);

      await waitFor(() => {
        expect(screen.getByTestId('switch-chat-enabled')).not.toBeChecked();
      });

      // Enable chat
      const toggle = screen.getByTestId('switch-chat-enabled');
      fireEvent.click(toggle);

      // Save changes
      const saveButton = screen.getByTestId('button-save-chat-settings');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockChatSettingsService.updateChatSettings).toHaveBeenCalledWith(1, {
          isChatEnabled: true,
        });
      });

      expect(mockToast.success).toHaveBeenCalledWith('Chat settings updated');
    });

    it('should save chat settings when disabled', async () => {
      mockChatSettingsService.getChatSettings.mockResolvedValue({
        isChatEnabled: true,
      });

      mockChatSettingsService.updateChatSettings.mockResolvedValue({
        isChatEnabled: false,
      });

      render(<ChatSettingsPage />);

      await waitFor(() => {
        expect(screen.getByTestId('switch-chat-enabled')).toBeChecked();
      });

      // Disable chat
      const toggle = screen.getByTestId('switch-chat-enabled');
      fireEvent.click(toggle);

      // Save changes
      const saveButton = screen.getByTestId('button-save-chat-settings');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockChatSettingsService.updateChatSettings).toHaveBeenCalledWith(1, {
          isChatEnabled: false,
        });
      });

      expect(mockToast.success).toHaveBeenCalledWith('Chat settings updated');
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: mockGrowUser,
        loading: false,
      error: null,
      clearError: jest.fn(),
      retryLastOperation: jest.fn(),
        login: jest.fn(),
        logout: jest.fn(),
        register: jest.fn(),
        refreshSession: jest.fn(),
        completeOnboarding: jest.fn(),
      });
    });

    it('should handle get settings error', async () => {
      mockChatSettingsService.getChatSettings.mockRejectedValue(new Error('API Error'));

      render(<ChatSettingsPage />);

      await waitFor(() => {
        expect(mockErrorHandler.showErrorToast).toHaveBeenCalled();
      });
    });

    it('should handle save settings error', async () => {
      mockChatSettingsService.getChatSettings.mockResolvedValue({
        isChatEnabled: false,
      });

      mockChatSettingsService.updateChatSettings.mockRejectedValue(new Error('Save failed'));

      render(<ChatSettingsPage />);

      await waitFor(() => {
        expect(screen.getByTestId('switch-chat-enabled')).not.toBeChecked();
      });

      // Enable chat
      const toggle = screen.getByTestId('switch-chat-enabled');
      fireEvent.click(toggle);

      // Save changes
      const saveButton = screen.getByTestId('button-save-chat-settings');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockErrorHandler.showErrorToast).toHaveBeenCalled();
      });
    });

    it('should handle API error with custom message', async () => {
      mockChatSettingsService.getChatSettings.mockResolvedValue({
        isChatEnabled: false,
      });

      const apiError = {
        response: {
          data: {
            message: 'Custom API error message'
          }
        }
      };

      mockChatSettingsService.updateChatSettings.mockRejectedValue(apiError);

      render(<ChatSettingsPage />);

      await waitFor(() => {
        expect(screen.getByTestId('switch-chat-enabled')).not.toBeChecked();
      });

      // Enable chat
      const toggle = screen.getByTestId('switch-chat-enabled');
      fireEvent.click(toggle);

      // Save changes
      const saveButton = screen.getByTestId('button-save-chat-settings');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockErrorHandler.showErrorToast).toHaveBeenCalled();
      });
    });
  });

  describe('Save Button State', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: mockGrowUser,
        loading: false,
      error: null,
      clearError: jest.fn(),
      retryLastOperation: jest.fn(),
        login: jest.fn(),
        logout: jest.fn(),
        register: jest.fn(),
        refreshSession: jest.fn(),
        completeOnboarding: jest.fn(),
      });

      mockChatSettingsService.getChatSettings.mockResolvedValue({
        isChatEnabled: false,
      });
    });

    it('should show saving state during save operation', async () => {
      let resolveUpdate: (value: { isChatEnabled: boolean }) => void;
      const updatePromise = new Promise<{ isChatEnabled: boolean }>((resolve) => {
        resolveUpdate = resolve;
      });

      mockChatSettingsService.updateChatSettings.mockReturnValue(updatePromise);

      render(<ChatSettingsPage />);

      await waitFor(() => {
        expect(screen.getByTestId('switch-chat-enabled')).not.toBeChecked();
      });

      // Enable chat
      const toggle = screen.getByTestId('switch-chat-enabled');
      fireEvent.click(toggle);

      // Save changes
      const saveButton = screen.getByTestId('button-save-chat-settings');
      fireEvent.click(saveButton);

      // Should show saving state
      expect(screen.getByText('Saving...')).toBeInTheDocument();
      expect(saveButton).toBeDisabled();

      // Resolve the promise
      resolveUpdate!({ isChatEnabled: true });

      await waitFor(() => {
        expect(screen.getByText('Save Chat Settings')).toBeInTheDocument();
        expect(saveButton).not.toBeDisabled();
      });
    });
  });
});