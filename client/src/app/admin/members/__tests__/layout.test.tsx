import React from 'react';
import { render, screen } from '@testing-library/react';
import { usePathname, useRouter } from 'next/navigation';
import MembersLayout from '../layout';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
  useRouter: jest.fn(),
}));

// Mock Radix UI Tabs at the module level (before any imports)
jest.mock('@radix-ui/react-tabs', () => ({
  Root: ({ children, value, onValueChange, ...props }: any) => {
    return React.createElement('div', {
      'data-testid': 'tabs-root',
      'data-value': value,
      ...props
    }, children);
  },
  List: ({ children, className, ...props }: any) => {
    return React.createElement('div', {
      className: `tabs-list ${className || ''}`,
      'data-testid': 'tabs-list',
      ...props
    }, children);
  },
  Trigger: ({ children, value, className, onClick, ...props }: any) => {
    return React.createElement('button', {
      type: 'button',
      className: `tabs-trigger ${className || ''}`,
      'data-testid': 'tabs-trigger',
      'data-value': value,
      onClick,
      ...props
    }, children);
  },
  Content: ({ children, value, className, ...props }: any) => {
    return React.createElement('div', {
      className: `tabs-content ${className || ''}`,
      'data-testid': 'tabs-content',
      'data-value': value,
      ...props
    }, children);
  },
}));

// Mock the Tabs UI components to use the RadixUI primitives
jest.mock('@/components/ui/tabs', () => {
  const RadixTabs = jest.requireActual('@radix-ui/react-tabs');
  return {
    Tabs: RadixTabs.Root,
    TabsList: RadixTabs.List,
    TabsTrigger: RadixTabs.Trigger,
    TabsContent: RadixTabs.Content,
  };
});

// Mock Lucide React icons used in the layout
jest.mock('lucide-react', () => ({
  Users: () => React.createElement('span', { 'data-testid': 'users-icon' }, '👥'),
  FolderOpen: () => React.createElement('span', { 'data-testid': 'folder-open-icon' }, '📁'),
  FileText: () => React.createElement('span', { 'data-testid': 'file-text-icon' }, '📄'),
  Settings: () => React.createElement('span', { 'data-testid': 'settings-icon' }, '⚙'),
  UserPlus: () => React.createElement('span', { 'data-testid': 'user-plus-icon' }, '➕'),
  PieChart: () => React.createElement('span', { 'data-testid': 'pie-chart-icon' }, '📊'),
  Tag: () => React.createElement('span', { 'data-testid': 'tag-icon' }, '🏷'),
}));

const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>;
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;

describe('MembersLayout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUsePathname.mockReturnValue('/admin/members');
    mockUseRouter.mockReturnValue({
      push: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
    } as any);
  });

  it('should render members layout', () => {
    render(<MembersLayout><div>Test Content</div></MembersLayout>);
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('should handle navigation', () => {
    const mockPush = jest.fn();
    mockUseRouter.mockReturnValue({ 
      push: mockPush,
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
    } as any);
    
    render(<MembersLayout><div>Test Content</div></MembersLayout>);
    // Layout should render without navigation errors
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('should handle different pathnames', () => {
    mockUsePathname.mockReturnValue('/admin/members/analytics');
    
    render(<MembersLayout><div>Analytics Content</div></MembersLayout>);
    expect(screen.getByText('Analytics Content')).toBeInTheDocument();
  });

  it('should handle router operations', () => {
    const mockRouter = {
      push: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
    };
    mockUseRouter.mockReturnValue(mockRouter as any);
    
    render(<MembersLayout><div>Router Test</div></MembersLayout>);
    expect(screen.getByText('Router Test')).toBeInTheDocument();
  });

  it('should render with multiple children', () => {
    render(
      <MembersLayout>
        <div>Child 1</div>
        <div>Child 2</div>
      </MembersLayout>
    );
    
    expect(screen.getByText('Child 1')).toBeInTheDocument();
    expect(screen.getByText('Child 2')).toBeInTheDocument();
  });

  it('should handle layout structure', () => {
    render(<MembersLayout><div data-testid="layout-content">Layout Content</div></MembersLayout>);
    
    expect(screen.getByTestId('layout-content')).toBeInTheDocument();
    expect(screen.getByText('Layout Content')).toBeInTheDocument();
  });
});
