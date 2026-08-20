import React from 'react';
import { render, screen } from '@testing-library/react';
import {
  Card,
  CardGlass,
  CardGlassSoft,
  CardGlassStrong,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
  CardContent,
  CardFooter,
} from '../card';

describe('Card Components', () => {
  describe('Card (Base)', () => {
    it('should render children', () => {
      render(<Card>Card content</Card>);
      expect(screen.getByText('Card content')).toBeInTheDocument();
    });

    it('should have data-slot attribute', () => {
      const { container } = render(<Card>Content</Card>);
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveAttribute('data-slot', 'card');
    });

    it('should have base card classes', () => {
      const { container } = render(<Card>Content</Card>);
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('bg-card');
      expect(card).toHaveClass('text-card-foreground');
      expect(card).toHaveClass('flex');
      expect(card).toHaveClass('flex-col');
      expect(card).toHaveClass('rounded-xl');
      expect(card).toHaveClass('border');
      expect(card).toHaveClass('shadow-sm');
    });

    it('should accept custom className', () => {
      const { container } = render(<Card className="custom-class">Content</Card>);
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('custom-class');
      expect(card).toHaveClass('bg-card'); // Still has base classes
    });

    it('should accept data attributes', () => {
      render(<Card data-testid="test-card">Content</Card>);
      expect(screen.getByTestId('test-card')).toBeInTheDocument();
    });

    it('should spread additional props', () => {
      render(<Card id="my-card" role="region" aria-label="Card section">Content</Card>);
      const card = screen.getByLabelText('Card section');
      expect(card).toHaveAttribute('id', 'my-card');
      expect(card).toHaveAttribute('role', 'region');
    });
  });

  describe('CardGlass Variant', () => {
    it('should render children', () => {
      render(<CardGlass>Glass card content</CardGlass>);
      expect(screen.getByText('Glass card content')).toBeInTheDocument();
    });

    it('should have data-slot attribute', () => {
      const { container } = render(<CardGlass>Content</CardGlass>);
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveAttribute('data-slot', 'card');
    });

    it('should have glass variant classes', () => {
      const { container } = render(<CardGlass>Content</CardGlass>);
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('glass');
      expect(card).toHaveClass('border-border/50');
      expect(card).toHaveClass('text-card-foreground');
    });

    it('should have hover effect classes', () => {
      const { container } = render(<CardGlass>Content</CardGlass>);
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('hover:glass-strong');
      expect(card).toHaveClass('hover:scale-[1.02]');
      expect(card).toHaveClass('hover:-translate-y-1');
      expect(card).toHaveClass('hover:shadow-xl');
      expect(card).toHaveClass('transition-all');
      expect(card).toHaveClass('hover-lift');
    });

    it('should accept custom className', () => {
      const { container } = render(<CardGlass className="custom-glass">Content</CardGlass>);
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('custom-glass');
      expect(card).toHaveClass('glass');
    });
  });

  describe('CardGlassSoft Variant', () => {
    it('should render children', () => {
      render(<CardGlassSoft>Soft glass content</CardGlassSoft>);
      expect(screen.getByText('Soft glass content')).toBeInTheDocument();
    });

    it('should have data-slot attribute', () => {
      const { container } = render(<CardGlassSoft>Content</CardGlassSoft>);
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveAttribute('data-slot', 'card');
    });

    it('should have glass-soft variant classes', () => {
      const { container } = render(<CardGlassSoft>Content</CardGlassSoft>);
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('glass-soft');
      expect(card).toHaveClass('border-border/30');
      expect(card).toHaveClass('shadow-md');
    });

    it('should have hover effect classes', () => {
      const { container } = render(<CardGlassSoft>Content</CardGlassSoft>);
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('hover:glass');
      expect(card).toHaveClass('hover:scale-[1.01]');
      expect(card).toHaveClass('hover:-translate-y-0.5');
      expect(card).toHaveClass('hover:shadow-lg');
    });

    it('should accept custom className', () => {
      const { container } = render(<CardGlassSoft className="custom-soft">Content</CardGlassSoft>);
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('custom-soft');
      expect(card).toHaveClass('glass-soft');
    });
  });

  describe('CardGlassStrong Variant', () => {
    it('should render children', () => {
      render(<CardGlassStrong>Strong glass content</CardGlassStrong>);
      expect(screen.getByText('Strong glass content')).toBeInTheDocument();
    });

    it('should have data-slot attribute', () => {
      const { container } = render(<CardGlassStrong>Content</CardGlassStrong>);
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveAttribute('data-slot', 'card');
    });

    it('should have glass-strong variant classes', () => {
      const { container } = render(<CardGlassStrong>Content</CardGlassStrong>);
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('glass-strong');
      expect(card).toHaveClass('border-border/60');
      expect(card).toHaveClass('shadow-xl');
    });

    it('should have hover effect classes', () => {
      const { container } = render(<CardGlassStrong>Content</CardGlassStrong>);
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('hover:opacity-95');
      expect(card).toHaveClass('hover:scale-[1.03]');
      expect(card).toHaveClass('hover:-translate-y-2');
      expect(card).toHaveClass('hover:shadow-2xl');
    });

    it('should accept custom className', () => {
      const { container } = render(<CardGlassStrong className="custom-strong">Content</CardGlassStrong>);
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('custom-strong');
      expect(card).toHaveClass('glass-strong');
    });
  });

  describe('CardHeader', () => {
    it('should render children', () => {
      render(<CardHeader>Header content</CardHeader>);
      expect(screen.getByText('Header content')).toBeInTheDocument();
    });

    it('should have data-slot attribute', () => {
      const { container } = render(<CardHeader>Header</CardHeader>);
      const header = container.firstChild as HTMLElement;
      expect(header).toHaveAttribute('data-slot', 'card-header');
    });

    it('should have header classes', () => {
      const { container } = render(<CardHeader>Header</CardHeader>);
      const header = container.firstChild as HTMLElement;
      expect(header).toHaveClass('@container/card-header');
      expect(header).toHaveClass('grid');
      expect(header).toHaveClass('auto-rows-min');
      expect(header).toHaveClass('items-start');
      expect(header).toHaveClass('px-6');
    });

    it('should accept custom className', () => {
      const { container } = render(<CardHeader className="custom-header">Header</CardHeader>);
      const header = container.firstChild as HTMLElement;
      expect(header).toHaveClass('custom-header');
      expect(header).toHaveClass('grid');
    });
  });

  describe('CardTitle', () => {
    it('should render children', () => {
      render(<CardTitle>Title text</CardTitle>);
      expect(screen.getByText('Title text')).toBeInTheDocument();
    });

    it('should have data-slot attribute', () => {
      const { container } = render(<CardTitle>Title</CardTitle>);
      const title = container.firstChild as HTMLElement;
      expect(title).toHaveAttribute('data-slot', 'card-title');
    });

    it('should have title classes', () => {
      const { container } = render(<CardTitle>Title</CardTitle>);
      const title = container.firstChild as HTMLElement;
      expect(title).toHaveClass('leading-none');
      expect(title).toHaveClass('font-semibold');
    });

    it('should accept custom className', () => {
      const { container } = render(<CardTitle className="text-lg">Title</CardTitle>);
      const title = container.firstChild as HTMLElement;
      expect(title).toHaveClass('text-lg');
      expect(title).toHaveClass('font-semibold');
    });
  });

  describe('CardDescription', () => {
    it('should render children', () => {
      render(<CardDescription>Description text</CardDescription>);
      expect(screen.getByText('Description text')).toBeInTheDocument();
    });

    it('should have data-slot attribute', () => {
      const { container } = render(<CardDescription>Description</CardDescription>);
      const description = container.firstChild as HTMLElement;
      expect(description).toHaveAttribute('data-slot', 'card-description');
    });

    it('should have description classes', () => {
      const { container } = render(<CardDescription>Description</CardDescription>);
      const description = container.firstChild as HTMLElement;
      expect(description).toHaveClass('text-muted-foreground');
      expect(description).toHaveClass('text-sm');
    });

    it('should accept custom className', () => {
      const { container } = render(<CardDescription className="text-xs">Description</CardDescription>);
      const description = container.firstChild as HTMLElement;
      expect(description).toHaveClass('text-xs');
      expect(description).toHaveClass('text-muted-foreground');
    });
  });

  describe('CardAction', () => {
    it('should render children', () => {
      render(<CardAction>Action button</CardAction>);
      expect(screen.getByText('Action button')).toBeInTheDocument();
    });

    it('should have data-slot attribute', () => {
      const { container } = render(<CardAction>Action</CardAction>);
      const action = container.firstChild as HTMLElement;
      expect(action).toHaveAttribute('data-slot', 'card-action');
    });

    it('should have action classes', () => {
      const { container } = render(<CardAction>Action</CardAction>);
      const action = container.firstChild as HTMLElement;
      expect(action).toHaveClass('col-start-2');
      expect(action).toHaveClass('row-span-2');
      expect(action).toHaveClass('row-start-1');
      expect(action).toHaveClass('self-start');
      expect(action).toHaveClass('justify-self-end');
    });

    it('should accept custom className', () => {
      const { container } = render(<CardAction className="custom-action">Action</CardAction>);
      const action = container.firstChild as HTMLElement;
      expect(action).toHaveClass('custom-action');
      expect(action).toHaveClass('col-start-2');
    });
  });

  describe('CardContent', () => {
    it('should render children', () => {
      render(<CardContent>Content text</CardContent>);
      expect(screen.getByText('Content text')).toBeInTheDocument();
    });

    it('should have data-slot attribute', () => {
      const { container } = render(<CardContent>Content</CardContent>);
      const content = container.firstChild as HTMLElement;
      expect(content).toHaveAttribute('data-slot', 'card-content');
    });

    it('should have content classes', () => {
      const { container } = render(<CardContent>Content</CardContent>);
      const content = container.firstChild as HTMLElement;
      expect(content).toHaveClass('px-6');
    });

    it('should accept custom className', () => {
      const { container } = render(<CardContent className="py-4">Content</CardContent>);
      const content = container.firstChild as HTMLElement;
      expect(content).toHaveClass('py-4');
      expect(content).toHaveClass('px-6');
    });
  });

  describe('CardFooter', () => {
    it('should render children', () => {
      render(<CardFooter>Footer content</CardFooter>);
      expect(screen.getByText('Footer content')).toBeInTheDocument();
    });

    it('should have data-slot attribute', () => {
      const { container } = render(<CardFooter>Footer</CardFooter>);
      const footer = container.firstChild as HTMLElement;
      expect(footer).toHaveAttribute('data-slot', 'card-footer');
    });

    it('should have footer classes', () => {
      const { container } = render(<CardFooter>Footer</CardFooter>);
      const footer = container.firstChild as HTMLElement;
      expect(footer).toHaveClass('flex');
      expect(footer).toHaveClass('items-center');
      expect(footer).toHaveClass('px-6');
    });

    it('should accept custom className', () => {
      const { container } = render(<CardFooter className="justify-end">Footer</CardFooter>);
      const footer = container.firstChild as HTMLElement;
      expect(footer).toHaveClass('justify-end');
      expect(footer).toHaveClass('flex');
    });
  });

  describe('Component Composition', () => {
    it('should render full card with all components', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Test Title</CardTitle>
            <CardDescription>Test Description</CardDescription>
            <CardAction>Action</CardAction>
          </CardHeader>
          <CardContent>Test Content</CardContent>
          <CardFooter>Test Footer</CardFooter>
        </Card>
      );

      expect(screen.getByText('Test Title')).toBeInTheDocument();
      expect(screen.getByText('Test Description')).toBeInTheDocument();
      expect(screen.getByText('Action')).toBeInTheDocument();
      expect(screen.getByText('Test Content')).toBeInTheDocument();
      expect(screen.getByText('Test Footer')).toBeInTheDocument();
    });

    it('should render glass card with header and content', () => {
      render(
        <CardGlass>
          <CardHeader>
            <CardTitle>Glass Title</CardTitle>
          </CardHeader>
          <CardContent>Glass Content</CardContent>
        </CardGlass>
      );

      expect(screen.getByText('Glass Title')).toBeInTheDocument();
      expect(screen.getByText('Glass Content')).toBeInTheDocument();

      const card = screen.getByText('Glass Title').closest('[data-slot="card"]');
      expect(card).toHaveClass('glass');
    });

    it('should render card with title and description', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Main Title</CardTitle>
            <CardDescription>Supporting description text</CardDescription>
          </CardHeader>
        </Card>
      );

      const title = screen.getByText('Main Title').closest('[data-slot="card-title"]');
      const description = screen.getByText('Supporting description text').closest('[data-slot="card-description"]');

      expect(title).toHaveAttribute('data-slot', 'card-title');
      expect(description).toHaveAttribute('data-slot', 'card-description');
    });

    it('should render card with action button', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Card with Action</CardTitle>
            <CardAction>
              <button>Click Me</button>
            </CardAction>
          </CardHeader>
        </Card>
      );

      expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
      const action = screen.getByText('Click Me').closest('[data-slot="card-action"]');
      expect(action).toBeInTheDocument();
    });
  });

  describe('All Variants Comparison', () => {
    it('should render all card variants with distinct classes', () => {
      const { container } = render(
        <div>
          <Card>Base Card</Card>
          <CardGlass>Glass Card</CardGlass>
          <CardGlassSoft>Soft Glass Card</CardGlassSoft>
          <CardGlassStrong>Strong Glass Card</CardGlassStrong>
        </div>
      );

      const baseCard = screen.getByText('Base Card').closest('[data-slot="card"]');
      const glassCard = screen.getByText('Glass Card').closest('[data-slot="card"]');
      const softCard = screen.getByText('Soft Glass Card').closest('[data-slot="card"]');
      const strongCard = screen.getByText('Strong Glass Card').closest('[data-slot="card"]');

      // Base card
      expect(baseCard).toHaveClass('bg-card');
      expect(baseCard).not.toHaveClass('glass');

      // Glass variants
      expect(glassCard).toHaveClass('glass');
      expect(softCard).toHaveClass('glass-soft');
      expect(strongCard).toHaveClass('glass-strong');

      // All have data-slot
      expect(baseCard).toHaveAttribute('data-slot', 'card');
      expect(glassCard).toHaveAttribute('data-slot', 'card');
      expect(softCard).toHaveAttribute('data-slot', 'card');
      expect(strongCard).toHaveAttribute('data-slot', 'card');
    });
  });

  describe('Props Spreading', () => {
    it('should spread props to all card variants', () => {
      const onClick = jest.fn();

      render(
        <div>
          <Card onClick={onClick} data-testid="base-card">Base</Card>
          <CardGlass onClick={onClick} data-testid="glass-card">Glass</CardGlass>
          <CardGlassSoft onClick={onClick} data-testid="soft-card">Soft</CardGlassSoft>
          <CardGlassStrong onClick={onClick} data-testid="strong-card">Strong</CardGlassStrong>
        </div>
      );

      expect(screen.getByTestId('base-card')).toBeInTheDocument();
      expect(screen.getByTestId('glass-card')).toBeInTheDocument();
      expect(screen.getByTestId('soft-card')).toBeInTheDocument();
      expect(screen.getByTestId('strong-card')).toBeInTheDocument();
    });

    it('should spread props to all sub-components', () => {
      render(
        <div>
          <CardHeader data-testid="header">Header</CardHeader>
          <CardTitle data-testid="title">Title</CardTitle>
          <CardDescription data-testid="description">Description</CardDescription>
          <CardAction data-testid="action">Action</CardAction>
          <CardContent data-testid="content">Content</CardContent>
          <CardFooter data-testid="footer">Footer</CardFooter>
        </div>
      );

      expect(screen.getByTestId('header')).toBeInTheDocument();
      expect(screen.getByTestId('title')).toBeInTheDocument();
      expect(screen.getByTestId('description')).toBeInTheDocument();
      expect(screen.getByTestId('action')).toBeInTheDocument();
      expect(screen.getByTestId('content')).toBeInTheDocument();
      expect(screen.getByTestId('footer')).toBeInTheDocument();
    });
  });
});
