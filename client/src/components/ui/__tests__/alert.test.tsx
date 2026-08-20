import React from 'react';
import { render, screen } from '@testing-library/react';
import { Alert, AlertTitle, AlertDescription } from '../alert';

describe('Alert', () => {
  describe('Alert Root', () => {
    it('should render without crashing', () => {
      render(<Alert>Alert content</Alert>);
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('should have data-slot attribute', () => {
      render(<Alert data-testid="alert">Content</Alert>);
      const alert = screen.getByTestId('alert');
      expect(alert).toHaveAttribute('data-slot', 'alert');
    });

    it('should have alert role', () => {
      render(<Alert>Content</Alert>);
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('should have default styling classes', () => {
      render(<Alert data-testid="alert">Content</Alert>);
      const alert = screen.getByTestId('alert');
      expect(alert).toHaveClass('relative');
      expect(alert).toHaveClass('w-full');
      expect(alert).toHaveClass('rounded-lg');
      expect(alert).toHaveClass('border');
      expect(alert).toHaveClass('px-4');
      expect(alert).toHaveClass('py-3');
      expect(alert).toHaveClass('text-sm');
      expect(alert).toHaveClass('grid');
    });

    it('should apply custom className', () => {
      render(<Alert className="custom-alert" data-testid="alert">Content</Alert>);
      const alert = screen.getByTestId('alert');
      expect(alert).toHaveClass('custom-alert');
      expect(alert).toHaveClass('relative');
    });

    it('should merge custom className with default classes', () => {
      render(<Alert className="my-4 mx-2" data-testid="alert">Content</Alert>);
      const alert = screen.getByTestId('alert');
      expect(alert).toHaveClass('my-4');
      expect(alert).toHaveClass('mx-2');
      expect(alert).toHaveClass('relative');
    });

    it('should render children', () => {
      render(<Alert>Alert message</Alert>);
      expect(screen.getByText('Alert message')).toBeInTheDocument();
    });

    it('should accept custom props', () => {
      render(<Alert data-testid="alert" data-custom="value">Content</Alert>);
      const alert = screen.getByTestId('alert');
      expect(alert).toHaveAttribute('data-custom', 'value');
    });
  });

  describe('Alert Variants', () => {
    it('should apply default variant styling', () => {
      render(<Alert data-testid="alert">Content</Alert>);
      const alert = screen.getByTestId('alert');
      expect(alert).toHaveClass('bg-card/80');
      expect(alert).toHaveClass('text-card-foreground');
    });

    it('should apply default variant explicitly', () => {
      render(<Alert variant="default" data-testid="alert">Content</Alert>);
      const alert = screen.getByTestId('alert');
      expect(alert).toHaveClass('bg-card/80');
      expect(alert).toHaveClass('text-card-foreground');
    });

    it('should apply destructive variant styling', () => {
      render(<Alert variant="destructive" data-testid="alert">Content</Alert>);
      const alert = screen.getByTestId('alert');
      expect(alert).toHaveClass('text-destructive');
    });

    it('should allow variant switching', () => {
      const { rerender } = render(<Alert variant="default" data-testid="alert">Content</Alert>);
      let alert = screen.getByTestId('alert');
      expect(alert).toHaveClass('bg-card/80');

      rerender(<Alert variant="destructive" data-testid="alert">Content</Alert>);
      alert = screen.getByTestId('alert');
      expect(alert).toHaveClass('text-destructive');
    });
  });

  describe('AlertTitle', () => {
    it('should render without crashing', () => {
      render(
        <Alert>
          <AlertTitle>Title</AlertTitle>
        </Alert>
      );
      expect(screen.getByText('Title')).toBeInTheDocument();
    });

    it('should have data-slot attribute', () => {
      render(
        <Alert>
          <AlertTitle data-testid="alert-title">Title</AlertTitle>
        </Alert>
      );
      const title = screen.getByTestId('alert-title');
      expect(title).toHaveAttribute('data-slot', 'alert-title');
    });

    it('should have default styling classes', () => {
      render(
        <Alert>
          <AlertTitle data-testid="alert-title">Title</AlertTitle>
        </Alert>
      );
      const title = screen.getByTestId('alert-title');
      expect(title).toHaveClass('col-start-2');
      expect(title).toHaveClass('line-clamp-1');
      expect(title).toHaveClass('min-h-4');
      expect(title).toHaveClass('font-medium');
      expect(title).toHaveClass('tracking-tight');
    });

    it('should apply custom className', () => {
      render(
        <Alert>
          <AlertTitle className="custom-title" data-testid="alert-title">Title</AlertTitle>
        </Alert>
      );
      const title = screen.getByTestId('alert-title');
      expect(title).toHaveClass('custom-title');
      expect(title).toHaveClass('font-medium');
    });

    it('should render children', () => {
      render(
        <Alert>
          <AlertTitle>Custom Title</AlertTitle>
        </Alert>
      );
      expect(screen.getByText('Custom Title')).toBeInTheDocument();
    });

    it('should accept custom props', () => {
      render(
        <Alert>
          <AlertTitle data-testid="alert-title" data-custom="value">Title</AlertTitle>
        </Alert>
      );
      const title = screen.getByTestId('alert-title');
      expect(title).toHaveAttribute('data-custom', 'value');
    });
  });

  describe('AlertDescription', () => {
    it('should render without crashing', () => {
      render(
        <Alert>
          <AlertDescription>Description</AlertDescription>
        </Alert>
      );
      expect(screen.getByText('Description')).toBeInTheDocument();
    });

    it('should have data-slot attribute', () => {
      render(
        <Alert>
          <AlertDescription data-testid="alert-description">Description</AlertDescription>
        </Alert>
      );
      const description = screen.getByTestId('alert-description');
      expect(description).toHaveAttribute('data-slot', 'alert-description');
    });

    it('should have default styling classes', () => {
      render(
        <Alert>
          <AlertDescription data-testid="alert-description">Description</AlertDescription>
        </Alert>
      );
      const description = screen.getByTestId('alert-description');
      expect(description).toHaveClass('col-start-2');
      expect(description).toHaveClass('grid');
      expect(description).toHaveClass('justify-items-start');
      expect(description).toHaveClass('gap-1');
      expect(description).toHaveClass('text-sm');
    });

    it('should apply custom className', () => {
      render(
        <Alert>
          <AlertDescription className="custom-description" data-testid="alert-description">
            Description
          </AlertDescription>
        </Alert>
      );
      const description = screen.getByTestId('alert-description');
      expect(description).toHaveClass('custom-description');
      expect(description).toHaveClass('text-sm');
    });

    it('should render children', () => {
      render(
        <Alert>
          <AlertDescription>Custom description text</AlertDescription>
        </Alert>
      );
      expect(screen.getByText('Custom description text')).toBeInTheDocument();
    });

    it('should accept custom props', () => {
      render(
        <Alert>
          <AlertDescription data-testid="alert-description" data-custom="value">
            Description
          </AlertDescription>
        </Alert>
      );
      const description = screen.getByTestId('alert-description');
      expect(description).toHaveAttribute('data-custom', 'value');
    });
  });

  describe('Usage Examples', () => {
    it('should work as a simple alert', () => {
      render(
        <Alert>
          <AlertTitle>Heads up!</AlertTitle>
          <AlertDescription>
            You can add components to your app using the CLI.
          </AlertDescription>
        </Alert>
      );

      expect(screen.getByText('Heads up!')).toBeInTheDocument();
      expect(screen.getByText(/You can add components/i)).toBeInTheDocument();
    });

    it('should work as a success alert', () => {
      render(
        <Alert>
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>Your changes have been saved.</AlertDescription>
        </Alert>
      );

      expect(screen.getByText('Success')).toBeInTheDocument();
      expect(screen.getByText('Your changes have been saved.')).toBeInTheDocument();
    });

    it('should work as a destructive alert', () => {
      render(
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Your session has expired. Please log in again.
          </AlertDescription>
        </Alert>
      );

      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.getByText(/Your session has expired/i)).toBeInTheDocument();
    });

    it('should work with an icon', () => {
      render(
        <Alert>
          <svg data-testid="alert-icon" />
          <AlertTitle>Note</AlertTitle>
          <AlertDescription>This is an informational message.</AlertDescription>
        </Alert>
      );

      expect(screen.getByTestId('alert-icon')).toBeInTheDocument();
      expect(screen.getByText('Note')).toBeInTheDocument();
      expect(screen.getByText('This is an informational message.')).toBeInTheDocument();
    });

    it('should work with only title', () => {
      render(
        <Alert>
          <AlertTitle>Title only alert</AlertTitle>
        </Alert>
      );

      expect(screen.getByText('Title only alert')).toBeInTheDocument();
    });

    it('should work with only description', () => {
      render(
        <Alert>
          <AlertDescription>Description only alert</AlertDescription>
        </Alert>
      );

      expect(screen.getByText('Description only alert')).toBeInTheDocument();
    });

    it('should work with complex content in description', () => {
      render(
        <Alert>
          <AlertTitle>Multiple Items</AlertTitle>
          <AlertDescription>
            <p>First paragraph</p>
            <p>Second paragraph</p>
          </AlertDescription>
        </Alert>
      );

      expect(screen.getByText('Multiple Items')).toBeInTheDocument();
      expect(screen.getByText('First paragraph')).toBeInTheDocument();
      expect(screen.getByText('Second paragraph')).toBeInTheDocument();
    });
  });

  describe('Combined Props', () => {
    it('should handle all custom props together', () => {
      render(
        <Alert
          variant="destructive"
          className="my-4"
          data-testid="alert"
          data-custom="value"
        >
          <AlertTitle className="text-lg" data-testid="title">
            Error Title
          </AlertTitle>
          <AlertDescription className="text-base" data-testid="description">
            Error description
          </AlertDescription>
        </Alert>
      );

      const alert = screen.getByTestId('alert');
      expect(alert).toHaveClass('my-4');
      expect(alert).toHaveClass('text-destructive');
      expect(alert).toHaveAttribute('data-custom', 'value');

      const title = screen.getByTestId('title');
      expect(title).toHaveClass('text-lg');

      const description = screen.getByTestId('description');
      expect(description).toHaveClass('text-base');
    });
  });

  describe('Accessibility', () => {
    it('should have alert role', () => {
      render(<Alert>Content</Alert>);
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('should support aria-label', () => {
      render(<Alert aria-label="Important notification" data-testid="alert">Content</Alert>);
      const alert = screen.getByTestId('alert');
      expect(alert).toHaveAttribute('aria-label', 'Important notification');
    });

    it('should support aria-labelledby', () => {
      render(
        <div>
          <div id="alert-label">Alert Label</div>
          <Alert aria-labelledby="alert-label" data-testid="alert">Content</Alert>
        </div>
      );
      const alert = screen.getByTestId('alert');
      expect(alert).toHaveAttribute('aria-labelledby', 'alert-label');
    });

    it('should support aria-describedby', () => {
      render(
        <div>
          <Alert aria-describedby="alert-desc" data-testid="alert">Content</Alert>
          <div id="alert-desc">Additional context</div>
        </div>
      );
      const alert = screen.getByTestId('alert');
      expect(alert).toHaveAttribute('aria-describedby', 'alert-desc');
    });

    it('should be keyboard accessible', () => {
      render(<Alert data-testid="alert">Content</Alert>);
      const alert = screen.getByTestId('alert');
      expect(alert).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty alert', () => {
      render(<Alert data-testid="alert" />);
      expect(screen.getByTestId('alert')).toBeInTheDocument();
    });

    it('should handle very long title', () => {
      const longTitle = 'A'.repeat(200);
      render(
        <Alert>
          <AlertTitle>{longTitle}</AlertTitle>
        </Alert>
      );
      expect(screen.getByText(longTitle)).toBeInTheDocument();
    });

    it('should handle very long description', () => {
      const longDescription = 'B'.repeat(1000);
      render(
        <Alert>
          <AlertDescription>{longDescription}</AlertDescription>
        </Alert>
      );
      expect(screen.getByText(longDescription)).toBeInTheDocument();
    });

    it('should handle multiple titles', () => {
      render(
        <Alert>
          <AlertTitle>Title 1</AlertTitle>
          <AlertTitle>Title 2</AlertTitle>
        </Alert>
      );
      expect(screen.getByText('Title 1')).toBeInTheDocument();
      expect(screen.getByText('Title 2')).toBeInTheDocument();
    });

    it('should handle multiple descriptions', () => {
      render(
        <Alert>
          <AlertDescription>Description 1</AlertDescription>
          <AlertDescription>Description 2</AlertDescription>
        </Alert>
      );
      expect(screen.getByText('Description 1')).toBeInTheDocument();
      expect(screen.getByText('Description 2')).toBeInTheDocument();
    });
  });
});
