import React from 'react';
import { render, screen } from '@testing-library/react';
import { FeatureComparisonMatrix } from '../FeatureComparisonMatrix';

// Import universal RadixUI mocking setup

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
    return (
      <div ref={ref} role={decorative ? "none" : "separator"} aria-orientation={orientation} {...props} />
    );
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
  Button: React.forwardRef<HTMLButtonElement, any>(({ children, className, variant, size, asChild, ...props }, ref) => {
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

jest.mock('@/components/ui/dialog', () => ({
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

jest.mock('@/components/ui/select', () => ({
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

jest.mock('@/components/ui/checkbox', () => ({
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

jest.mock('@/components/ui/progress', () => ({
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

// Note: Spinner component mock removed - component doesn't exist

jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => <div {...props}>{children}</div>,
    tr: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => <tr {...props}>{children}</tr>,
    section: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => <section {...props}>{children}</section>,
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => children,
}));

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  disconnect: jest.fn(),
  unobserve: jest.fn(),
}));

describe('FeatureComparisonMatrix', () => {
  it('renders the main heading and description', () => {
    render(<FeatureComparisonMatrix />);
    
    expect(screen.getByText('Stop Juggling Multiple Tools')).toBeInTheDocument();
    expect(screen.getByText(/See how GatherGrove replaces your scattered toolkit/)).toBeInTheDocument();
  });

  it('renders current setup and GatherGrove comparison sections', () => {
    render(<FeatureComparisonMatrix />);
    
    expect(screen.getByText('Your Current Setup')).toBeInTheDocument();
    expect(screen.getByText('With GatherGrove')).toBeInTheDocument();
    expect(screen.getByText('All-in-One Platform')).toBeInTheDocument();
  });

  it('renders the feature matrix table', () => {
    render(<FeatureComparisonMatrix />);
    
    expect(screen.getByText('Feature-by-Feature Comparison')).toBeInTheDocument();
    expect(screen.getByText('Feature')).toBeInTheDocument();
    expect(screen.getByText('Current Tools')).toBeInTheDocument();
    expect(screen.getByText('GatherGrove')).toBeInTheDocument();
    expect(screen.getByText('Benefit')).toBeInTheDocument();
  });

  it('displays feature categories in the matrix', () => {
    render(<FeatureComparisonMatrix />);
    
    expect(screen.getByText('Member Database')).toBeInTheDocument();
    expect(screen.getByText('Payment Processing')).toBeInTheDocument();
    expect(screen.getByText('Communication')).toBeInTheDocument();
    expect(screen.getByText('Event Management')).toBeInTheDocument();
    expect(screen.getByText('Mobile Access')).toBeInTheDocument();
  });

  it('shows current vs GatherGrove comparison for features', () => {
    render(<FeatureComparisonMatrix />);
    
    expect(screen.getByText('Spreadsheets (manual)')).toBeInTheDocument();
    expect(screen.getByText('Professional CRM')).toBeInTheDocument();
    expect(screen.getByText('Manual tracking')).toBeInTheDocument();
    expect(screen.getByText('Automated collection')).toBeInTheDocument();
  });

  it('displays cost savings information', () => {
    render(<FeatureComparisonMatrix />);
    
    expect(screen.getByText('10+ hours/month')).toBeInTheDocument();
    expect(screen.getByText('70% better collection')).toBeInTheDocument();
    expect(screen.getByText('$40-80/month')).toBeInTheDocument();
  });
});