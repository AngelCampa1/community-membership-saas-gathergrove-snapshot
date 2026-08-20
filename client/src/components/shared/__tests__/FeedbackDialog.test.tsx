import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { FeedbackDialog } from '../FeedbackDialog';
import apiClient from '@/services/apiClient';
import { useAuth } from '@/hooks/useAuth';

jest.mock('@/services/apiClient', () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
  },
}));

jest.mock('@/hooks/useAuth');

jest.mock('@/hooks/useToast', () => ({
  useToast: () => ({
    success: jest.fn(),
    error: jest.fn(),
  }),
}));

jest.mock('@/components/marketing/TurnstileWidget', () => ({
  TurnstileWidget: ({ onTokenChange }: { onTokenChange: (token: string) => void }) => (
    <button type="button" onClick={() => onTokenChange('feedback-token')}>
      verify turnstile
    </button>
  ),
}));

describe('FeedbackDialog', () => {
  const onOpenChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (apiClient.post as jest.Mock).mockResolvedValue({ data: { success: true } });
    (useAuth as jest.Mock).mockReturnValue({ user: null });
  });

  it('submits anonymous feedback with Turnstile token and honeypot field', async () => {
    render(<FeedbackDialog open onOpenChange={onOpenChange} />);

    fireEvent.click(screen.getByRole('button', { name: 'verify turnstile' }));
    fireEvent.click(screen.getByRole('button', { name: 'Rate 5 out of 5 stars' }));
    fireEvent.change(screen.getByLabelText(/subject/i), {
      target: { value: 'General Feedback' },
    });
    fireEvent.change(screen.getByLabelText(/your feedback/i), {
      target: { value: 'This is a useful public feedback submission.' },
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'guest@example.com' },
    });

    fireEvent.submit(screen.getByRole('button', { name: /send feedback/i }).closest('form')!);

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith(
        '/feedback',
        expect.objectContaining({
          rating: 5,
          subject: 'General Feedback',
          message: 'This is a useful public feedback submission.',
          email: 'guest@example.com',
          companyWebsite: '',
          turnstileToken: 'feedback-token',
        }),
      );
    });
  });
});
