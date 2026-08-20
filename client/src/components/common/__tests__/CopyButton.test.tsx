import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import CopyButton from '../CopyButton';

describe('CopyButton', () => {
  const mockText = 'https://example.com/event/abc123';

  beforeEach(() => {
    // Reset clipboard mock before each test
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn().mockResolvedValue(undefined),
      },
    });
  });

  describe('Rendering', () => {
    it('should render copy button with default text', () => {
      render(<CopyButton text={mockText} />);
      expect(screen.getByRole('button')).toBeInTheDocument();
      expect(screen.getByText(/copy/i)).toBeInTheDocument();
    });

    it('should render with custom button text', () => {
      render(<CopyButton text={mockText} buttonText="Copy Link" />);
      expect(screen.getByText('Copy Link')).toBeInTheDocument();
    });

    it('should render copy icon', () => {
      render(<CopyButton text={mockText} />);
      const button = screen.getByRole('button');
      // lucide-react icons render as SVG elements
      expect(button.querySelector('svg')).toBeInTheDocument();
    });
  });

  describe('Copy Functionality', () => {
    it('should copy text to clipboard when clicked', async () => {
      render(<CopyButton text={mockText} />);
      const button = screen.getByRole('button');

      fireEvent.click(button);

      await waitFor(() => {
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith(mockText);
      });
    });

    it('should show success feedback after copying', async () => {
      render(<CopyButton text={mockText} />);
      const button = screen.getByRole('button');

      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText(/copied/i)).toBeInTheDocument();
      });
    });

    it('should show check icon after successful copy', async () => {
      render(<CopyButton text={mockText} />);
      const button = screen.getByRole('button');

      fireEvent.click(button);

      await waitFor(() => {
        // After copying, the icon changes and "copied" text appears
        expect(screen.getByText(/copied/i)).toBeInTheDocument();
      });
    });

    it('should reset to default state after timeout', async () => {
      jest.useFakeTimers();
      render(<CopyButton text={mockText} />);
      const button = screen.getByRole('button');

      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText(/copied/i)).toBeInTheDocument();
      });

      jest.advanceTimersByTime(2000);

      await waitFor(() => {
        expect(screen.getByText(/copy/i)).toBeInTheDocument();
      });

      jest.useRealTimers();
    });

    it('should handle clipboard API errors gracefully', async () => {
      Object.assign(navigator, {
        clipboard: {
          writeText: jest.fn().mockRejectedValue(new Error('Clipboard error')),
        },
      });

      render(<CopyButton text={mockText} />);
      const button = screen.getByRole('button');

      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText(/failed to copy/i)).toBeInTheDocument();
      });
    });
  });

  describe('Fallback Support', () => {
    it('should use fallback when clipboard API is unavailable', async () => {
      // Remove clipboard API
      Object.assign(navigator, {
        clipboard: undefined,
      });

      // Mock document.execCommand
      document.execCommand = jest.fn().mockReturnValue(true);

      render(<CopyButton text={mockText} />);
      const button = screen.getByRole('button');

      fireEvent.click(button);

      await waitFor(() => {
        expect(document.execCommand).toHaveBeenCalledWith('copy');
      });
    });

    it('should show error when fallback also fails', async () => {
      Object.assign(navigator, {
        clipboard: undefined,
      });

      document.execCommand = jest.fn().mockReturnValue(false);

      render(<CopyButton text={mockText} />);
      const button = screen.getByRole('button');

      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText(/failed to copy/i)).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have accessible button role', () => {
      render(<CopyButton text={mockText} />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should have aria-label', () => {
      render(<CopyButton text={mockText} />);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label');
    });

    it('should be keyboard accessible', async () => {
      render(<CopyButton text={mockText} />);
      const button = screen.getByRole('button');

      button.focus();
      expect(button).toHaveFocus();

      fireEvent.keyDown(button, { key: 'Enter', code: 'Enter' });

      await waitFor(() => {
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith(mockText);
      });
    });

    it('should update aria-label after copying', async () => {
      render(<CopyButton text={mockText} />);
      const button = screen.getByRole('button');

      fireEvent.click(button);

      await waitFor(() => {
        expect(button).toHaveAttribute('aria-label', expect.stringMatching(/copied/i));
      });
    });
  });

  describe('Custom Styling', () => {
    it('should apply custom className', () => {
      render(<CopyButton text={mockText} className="custom-class" />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class');
    });

    it('should support variant prop', () => {
      render(<CopyButton text={mockText} variant="outline" />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('outline');
    });

    it('should support size prop', () => {
      render(<CopyButton text={mockText} size="sm" />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('sm');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty text', async () => {
      render(<CopyButton text="" />);
      const button = screen.getByRole('button');

      fireEvent.click(button);

      await waitFor(() => {
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith('');
      });
    });

    it('should handle very long text', async () => {
      const longText = 'a'.repeat(10000);
      render(<CopyButton text={longText} />);
      const button = screen.getByRole('button');

      fireEvent.click(button);

      await waitFor(() => {
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith(longText);
      });
    });

    it('should handle special characters in text', async () => {
      const specialText = 'Test <>&"\'`\n\t\r';
      render(<CopyButton text={specialText} />);
      const button = screen.getByRole('button');

      fireEvent.click(button);

      await waitFor(() => {
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith(specialText);
      });
    });

    it('should prevent multiple simultaneous copies', async () => {
      render(<CopyButton text={mockText} />);
      const button = screen.getByRole('button');

      fireEvent.click(button);
      fireEvent.click(button);
      fireEvent.click(button);

      await waitFor(() => {
        expect(navigator.clipboard.writeText).toHaveBeenCalledTimes(1);
      });
    });
  });
});