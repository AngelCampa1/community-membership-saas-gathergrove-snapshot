import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  EmptyState,
  EmptyMembers,
  EmptyEvents,
  EmptyMessages,
  EmptySearch,
  EmptyPayments,
  EmptyGeneric
} from '../empty-state';
import { FileX, Users } from 'lucide-react';

describe('EmptyState', () => {
  describe('EmptyState Component', () => {
    describe('Rendering', () => {
      it('should render without crashing', () => {
        render(<EmptyState title="Test Empty State" />);
        expect(screen.getByText('Test Empty State')).toBeInTheDocument();
      });

      it('should render title', () => {
        render(<EmptyState title="Empty Title" />);
        expect(screen.getByText('Empty Title')).toBeInTheDocument();
      });

      it('should render description when provided', () => {
        render(<EmptyState title="Title" description="Description text" />);
        expect(screen.getByText('Description text')).toBeInTheDocument();
      });

      it('should not render description when not provided', () => {
        const { container } = render(<EmptyState title="Title" />);
        expect(container.querySelectorAll('p').length).toBe(0);
      });

      it('should render default icon when no icon provided', () => {
        const { container } = render(<EmptyState title="Title" />);
        const icon = container.querySelector('svg');
        expect(icon).toBeInTheDocument();
      });

      it('should render custom icon when provided', () => {
        const { container } = render(<EmptyState title="Title" icon={Users} />);
        const icon = container.querySelector('svg');
        expect(icon).toBeInTheDocument();
      });

      it('should render children when provided', () => {
        render(
          <EmptyState title="Title">
            <div>Custom content</div>
          </EmptyState>
        );
        expect(screen.getByText('Custom content')).toBeInTheDocument();
      });

      it('should apply custom className', () => {
        const { container } = render(<EmptyState title="Title" className="custom-class" />);
        const card = container.querySelector('.custom-class');
        expect(card).toBeInTheDocument();
      });
    });

    describe('Sizes', () => {
      it('should render medium size by default', () => {
        const { container } = render(<EmptyState title="Title" />);
        const card = container.querySelector('.py-12');
        expect(card).toBeInTheDocument();
      });

      it('should render small size', () => {
        const { container } = render(<EmptyState title="Title" size="sm" />);
        const card = container.querySelector('.py-8');
        expect(card).toBeInTheDocument();
      });

      it('should render large size', () => {
        const { container } = render(<EmptyState title="Title" size="lg" />);
        const card = container.querySelector('.py-16');
        expect(card).toBeInTheDocument();
      });

      it('should apply size-specific title class for small', () => {
        const { container } = render(<EmptyState title="Title" size="sm" />);
        const title = container.querySelector('.text-lg');
        expect(title).toBeInTheDocument();
      });

      it('should apply size-specific title class for medium', () => {
        const { container } = render(<EmptyState title="Title" size="md" />);
        const title = container.querySelector('.text-xl');
        expect(title).toBeInTheDocument();
      });

      it('should apply size-specific title class for large', () => {
        const { container } = render(<EmptyState title="Title" size="lg" />);
        const title = container.querySelector('.text-2xl');
        expect(title).toBeInTheDocument();
      });
    });

    describe('Action Button', () => {
      it('should render action button when provided', () => {
        const action = {
          text: 'Click Me',
          onClick: jest.fn(),
        };
        render(<EmptyState title="Title" action={action} />);
        expect(screen.getByText('Click Me')).toBeInTheDocument();
      });

      it('should not render action button when not provided', () => {
        render(<EmptyState title="Title" />);
        const button = screen.queryByRole('button');
        expect(button).not.toBeInTheDocument();
      });

      it('should call onClick when action button clicked', async () => {
        const user = userEvent.setup();
        const handleClick = jest.fn();
        const action = {
          text: 'Action',
          onClick: handleClick,
        };

        render(<EmptyState title="Title" action={action} />);
        await user.click(screen.getByText('Action'));

        expect(handleClick).toHaveBeenCalledTimes(1);
      });

      it('should render with default variant', () => {
        const action = {
          text: 'Action',
          onClick: jest.fn(),
        };
        render(<EmptyState title="Title" action={action} />);
        expect(screen.getByText('Action')).toBeInTheDocument();
      });

      it('should render with outline variant', () => {
        const action = {
          text: 'Action',
          onClick: jest.fn(),
          variant: 'outline' as const,
        };
        render(<EmptyState title="Title" action={action} />);
        expect(screen.getByText('Action')).toBeInTheDocument();
      });

      it('should render Plus icon in action button', () => {
        const action = {
          text: 'Action',
          onClick: jest.fn(),
        };
        const { container } = render(<EmptyState title="Title" action={action} />);
        const button = screen.getByText('Action').closest('button');
        const icon = button?.querySelector('svg');
        expect(icon).toBeInTheDocument();
      });
    });

    describe('Icon Container', () => {
      it('should render icon with gradient background', () => {
        const { container } = render(<EmptyState title="Title" />);
        const gradient = container.querySelector('.bg-gradient-to-r');
        expect(gradient).toBeInTheDocument();
      });

      it('should have animated pulse on gradient', () => {
        const { container } = render(<EmptyState title="Title" />);
        const pulse = container.querySelector('.animate-pulse');
        expect(pulse).toBeInTheDocument();
      });

      it('should have glass-soft effect on icon container', () => {
        const { container } = render(<EmptyState title="Title" />);
        const glassContainer = container.querySelector('.glass-soft');
        expect(glassContainer).toBeInTheDocument();
      });
    });

    describe('Layout', () => {
      it('should use flex column layout', () => {
        const { container } = render(<EmptyState title="Title" />);
        const layout = container.querySelector('.flex.flex-col');
        expect(layout).toBeInTheDocument();
      });

      it('should center items', () => {
        const { container } = render(<EmptyState title="Title" />);
        const layout = container.querySelector('.items-center');
        expect(layout).toBeInTheDocument();
      });

      it('should have proper spacing', () => {
        const { container } = render(<EmptyState title="Title" />);
        const layout = container.querySelector('.space-y-4');
        expect(layout).toBeInTheDocument();
      });
    });
  });

  describe('EmptyMembers Component', () => {
    it('should render without crashing', () => {
      render(<EmptyMembers />);
      expect(screen.getByText('No members yet')).toBeInTheDocument();
    });

    it('should render description', () => {
      render(<EmptyMembers />);
      expect(screen.getByText(/Get started by adding your first club member/i)).toBeInTheDocument();
    });

    it('should show action button when onAddMember provided', () => {
      render(<EmptyMembers onAddMember={jest.fn()} />);
      expect(screen.getByText('Add First Member')).toBeInTheDocument();
    });

    it('should not show action button when onAddMember not provided', () => {
      render(<EmptyMembers />);
      expect(screen.queryByText('Add First Member')).not.toBeInTheDocument();
    });

    it('should call onAddMember when button clicked', async () => {
      const user = userEvent.setup();
      const handleAddMember = jest.fn();

      render(<EmptyMembers onAddMember={handleAddMember} />);
      await user.click(screen.getByText('Add First Member'));

      expect(handleAddMember).toHaveBeenCalledTimes(1);
    });

    it('should render Users icon', () => {
      const { container } = render(<EmptyMembers />);
      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('EmptyEvents Component', () => {
    it('should render without crashing', () => {
      render(<EmptyEvents />);
      expect(screen.getByText('No events scheduled')).toBeInTheDocument();
    });

    it('should render description', () => {
      render(<EmptyEvents />);
      expect(screen.getByText(/Create your first event/i)).toBeInTheDocument();
    });

    it('should show action button when onCreateEvent provided', () => {
      render(<EmptyEvents onCreateEvent={jest.fn()} />);
      expect(screen.getByText('Create Event')).toBeInTheDocument();
    });

    it('should not show action button when onCreateEvent not provided', () => {
      render(<EmptyEvents />);
      expect(screen.queryByText('Create Event')).not.toBeInTheDocument();
    });

    it('should call onCreateEvent when button clicked', async () => {
      const user = userEvent.setup();
      const handleCreateEvent = jest.fn();

      render(<EmptyEvents onCreateEvent={handleCreateEvent} />);
      await user.click(screen.getByText('Create Event'));

      expect(handleCreateEvent).toHaveBeenCalledTimes(1);
    });

    it('should render Calendar icon', () => {
      const { container } = render(<EmptyEvents />);
      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('EmptyMessages Component', () => {
    it('should render without crashing', () => {
      render(<EmptyMessages />);
      expect(screen.getByText('No messages yet')).toBeInTheDocument();
    });

    it('should render description', () => {
      render(<EmptyMessages />);
      expect(screen.getByText(/Start a conversation/i)).toBeInTheDocument();
    });

    it('should show action button when onStartChat provided', () => {
      render(<EmptyMessages onStartChat={jest.fn()} />);
      expect(screen.getByText('Start Chatting')).toBeInTheDocument();
    });

    it('should not show action button when onStartChat not provided', () => {
      render(<EmptyMessages />);
      expect(screen.queryByText('Start Chatting')).not.toBeInTheDocument();
    });

    it('should call onStartChat when button clicked', async () => {
      const user = userEvent.setup();
      const handleStartChat = jest.fn();

      render(<EmptyMessages onStartChat={handleStartChat} />);
      await user.click(screen.getByText('Start Chatting'));

      expect(handleStartChat).toHaveBeenCalledTimes(1);
    });

    it('should render with small size', () => {
      const { container } = render(<EmptyMessages />);
      const card = container.querySelector('.py-8');
      expect(card).toBeInTheDocument();
    });

    it('should render MessageSquare icon', () => {
      const { container } = render(<EmptyMessages />);
      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('EmptySearch Component', () => {
    it('should render without crashing', () => {
      render(<EmptySearch />);
      expect(screen.getByText('No results found')).toBeInTheDocument();
    });

    it('should render default description without query', () => {
      render(<EmptySearch />);
      expect(screen.getByText(/Try a different search term/i)).toBeInTheDocument();
    });

    it('should render description with query', () => {
      render(<EmptySearch query="test search" />);
      expect(screen.getByText(/No results found for "test search"/i)).toBeInTheDocument();
    });

    it('should render with small size', () => {
      const { container } = render(<EmptySearch />);
      const card = container.querySelector('.py-8');
      expect(card).toBeInTheDocument();
    });

    it('should not show action button', () => {
      render(<EmptySearch query="test" />);
      const button = screen.queryByRole('button');
      expect(button).not.toBeInTheDocument();
    });

    it('should render Search icon', () => {
      const { container } = render(<EmptySearch />);
      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('EmptyPayments Component', () => {
    it('should render without crashing', () => {
      render(<EmptyPayments />);
      expect(screen.getByText('No payments recorded')).toBeInTheDocument();
    });

    it('should render description', () => {
      render(<EmptyPayments />);
      expect(screen.getByText(/Keep track of member dues/i)).toBeInTheDocument();
    });

    it('should show action button when onRecordPayment provided', () => {
      render(<EmptyPayments onRecordPayment={jest.fn()} />);
      expect(screen.getByText('Record Payment')).toBeInTheDocument();
    });

    it('should not show action button when onRecordPayment not provided', () => {
      render(<EmptyPayments />);
      expect(screen.queryByText('Record Payment')).not.toBeInTheDocument();
    });

    it('should call onRecordPayment when button clicked', async () => {
      const user = userEvent.setup();
      const handleRecordPayment = jest.fn();

      render(<EmptyPayments onRecordPayment={handleRecordPayment} />);
      await user.click(screen.getByText('Record Payment'));

      expect(handleRecordPayment).toHaveBeenCalledTimes(1);
    });

    it('should render CreditCard icon', () => {
      const { container } = render(<EmptyPayments />);
      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('EmptyGeneric Component', () => {
    it('should render without crashing', () => {
      render(<EmptyGeneric title="Generic Empty" />);
      expect(screen.getByText('Generic Empty')).toBeInTheDocument();
    });

    it('should render with custom title and description', () => {
      render(<EmptyGeneric title="Custom Title" description="Custom description" />);
      expect(screen.getByText('Custom Title')).toBeInTheDocument();
      expect(screen.getByText('Custom description')).toBeInTheDocument();
    });

    it('should render default icon when no icon specified', () => {
      const { container } = render(<EmptyGeneric title="Title" />);
      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('should render members icon when specified', () => {
      const { container } = render(<EmptyGeneric title="Title" icon="members" />);
      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('should render events icon when specified', () => {
      const { container } = render(<EmptyGeneric title="Title" icon="events" />);
      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('should render messages icon when specified', () => {
      const { container } = render(<EmptyGeneric title="Title" icon="messages" />);
      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('should render search icon when specified', () => {
      const { container } = render(<EmptyGeneric title="Title" icon="search" />);
      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('should render children when provided', () => {
      render(
        <EmptyGeneric title="Title">
          <button>Custom Action</button>
        </EmptyGeneric>
      );
      expect(screen.getByText('Custom Action')).toBeInTheDocument();
    });

    it('should have dashed border styling', () => {
      const { container } = render(<EmptyGeneric title="Title" />);
      const card = container.querySelector('.border-dashed');
      expect(card).toBeInTheDocument();
    });

    it('should render with all available icon types', () => {
      const icons: Array<'members' | 'events' | 'messages' | 'payments' | 'search' | 'generic' | 'database' | 'inbox' | 'settings'> = [
        'members', 'events', 'messages', 'payments', 'search',
        'generic', 'database', 'inbox', 'settings'
      ];

      icons.forEach(iconType => {
        const { container } = render(<EmptyGeneric title="Title" icon={iconType} />);
        const icon = container.querySelector('svg');
        expect(icon).toBeInTheDocument();
      });
    });
  });

  describe('Integration', () => {
    it('should handle different specialized components', () => {
      const { rerender } = render(<EmptyMembers />);
      expect(screen.getByText('No members yet')).toBeInTheDocument();

      rerender(<EmptyEvents />);
      expect(screen.getByText('No events scheduled')).toBeInTheDocument();

      rerender(<EmptyMessages />);
      expect(screen.getByText('No messages yet')).toBeInTheDocument();
    });

    it('should handle action callbacks across components', async () => {
      const user = userEvent.setup();
      const handleAction1 = jest.fn();
      const handleAction2 = jest.fn();

      const { rerender } = render(<EmptyMembers onAddMember={handleAction1} />);
      await user.click(screen.getByText('Add First Member'));
      expect(handleAction1).toHaveBeenCalled();

      rerender(<EmptyEvents onCreateEvent={handleAction2} />);
      await user.click(screen.getByText('Create Event'));
      expect(handleAction2).toHaveBeenCalled();
    });

    it('should handle EmptyGeneric with different icons', () => {
      const { rerender } = render(<EmptyGeneric title="Test" icon="members" />);
      expect(screen.getByText('Test')).toBeInTheDocument();

      rerender(<EmptyGeneric title="Test 2" icon="events" />);
      expect(screen.getByText('Test 2')).toBeInTheDocument();

      rerender(<EmptyGeneric title="Test 3" icon="search" />);
      expect(screen.getByText('Test 3')).toBeInTheDocument();
    });

    it('should handle size changes', () => {
      const { container, rerender } = render(<EmptyState title="Title" size="sm" />);
      expect(container.querySelector('.py-8')).toBeInTheDocument();

      rerender(<EmptyState title="Title" size="md" />);
      expect(container.querySelector('.py-12')).toBeInTheDocument();

      rerender(<EmptyState title="Title" size="lg" />);
      expect(container.querySelector('.py-16')).toBeInTheDocument();
    });
  });
});
