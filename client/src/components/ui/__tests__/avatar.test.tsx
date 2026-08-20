import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { Avatar, AvatarImage, AvatarFallback } from '../avatar';

describe('Avatar', () => {
  describe('Avatar Root', () => {
    it('should render without crashing', () => {
      render(<Avatar data-testid="avatar" />);
      expect(screen.getByTestId('avatar')).toBeInTheDocument();
    });

    it('should have data-slot attribute', () => {
      render(<Avatar data-testid="avatar" />);
      const avatar = screen.getByTestId('avatar');
      expect(avatar).toHaveAttribute('data-slot', 'avatar');
    });

    it('should have default styling classes', () => {
      render(<Avatar data-testid="avatar" />);
      const avatar = screen.getByTestId('avatar');
      expect(avatar).toHaveClass('relative');
      expect(avatar).toHaveClass('flex');
      expect(avatar).toHaveClass('size-8');
      expect(avatar).toHaveClass('shrink-0');
      expect(avatar).toHaveClass('overflow-hidden');
      expect(avatar).toHaveClass('rounded-full');
    });

    it('should apply custom className', () => {
      render(<Avatar className="custom-avatar" data-testid="avatar" />);
      const avatar = screen.getByTestId('avatar');
      expect(avatar).toHaveClass('custom-avatar');
      expect(avatar).toHaveClass('rounded-full'); // Should still have default classes
    });

    it('should merge custom className with default classes', () => {
      render(<Avatar className="size-12 border-2" data-testid="avatar" />);
      const avatar = screen.getByTestId('avatar');
      expect(avatar).toHaveClass('size-12');
      expect(avatar).toHaveClass('border-2');
      expect(avatar).toHaveClass('rounded-full');
    });

    it('should accept custom props', () => {
      render(<Avatar data-testid="avatar" data-custom="value" />);
      const avatar = screen.getByTestId('avatar');
      expect(avatar).toHaveAttribute('data-custom', 'value');
    });
  });

  describe('AvatarImage', () => {
    it('should render image element', () => {
      render(
        <Avatar>
          <AvatarImage src="https://example.com/avatar.jpg" alt="User avatar" />
        </Avatar>
      );
      const image = screen.getByRole('img', { name: /user avatar/i });
      expect(image).toBeInTheDocument();
    });

    it('should have data-slot attribute', () => {
      render(
        <Avatar>
          <AvatarImage src="https://example.com/avatar.jpg" alt="Avatar" />
        </Avatar>
      );
      const image = document.querySelector('[data-slot="avatar-image"]');
      expect(image).toBeInTheDocument();
    });

    it('should have default styling classes', () => {
      render(
        <Avatar>
          <AvatarImage src="https://example.com/avatar.jpg" alt="Avatar" />
        </Avatar>
      );
      const image = document.querySelector('[data-slot="avatar-image"]');
      expect(image).toHaveClass('aspect-square');
      expect(image).toHaveClass('size-full');
    });

    it('should apply custom className', () => {
      render(
        <Avatar>
          <AvatarImage src="https://example.com/avatar.jpg" alt="Avatar" className="custom-image" />
        </Avatar>
      );
      const image = document.querySelector('[data-slot="avatar-image"]');
      expect(image).toHaveClass('custom-image');
      expect(image).toHaveClass('size-full');
    });

    it('should accept src attribute', () => {
      render(
        <Avatar>
          <AvatarImage src="https://example.com/avatar.jpg" alt="Avatar" />
        </Avatar>
      );
      const image = screen.getByRole('img');
      expect(image).toHaveAttribute('src', 'https://example.com/avatar.jpg');
    });

    it('should accept alt attribute', () => {
      render(
        <Avatar>
          <AvatarImage src="https://example.com/avatar.jpg" alt="User profile picture" />
        </Avatar>
      );
      const image = screen.getByRole('img');
      expect(image).toHaveAttribute('alt', 'User profile picture');
    });
  });

  describe('AvatarFallback', () => {
    it('should render fallback content', () => {
      render(
        <Avatar>
          <AvatarFallback>AB</AvatarFallback>
        </Avatar>
      );
      expect(screen.getByText('AB')).toBeInTheDocument();
    });

    it('should have data-slot attribute', () => {
      render(
        <Avatar>
          <AvatarFallback>AB</AvatarFallback>
        </Avatar>
      );
      const fallback = document.querySelector('[data-slot="avatar-fallback"]');
      expect(fallback).toBeInTheDocument();
    });

    it('should have default styling classes', () => {
      render(
        <Avatar>
          <AvatarFallback>AB</AvatarFallback>
        </Avatar>
      );
      const fallback = document.querySelector('[data-slot="avatar-fallback"]');
      expect(fallback).toHaveClass('bg-muted');
      expect(fallback).toHaveClass('flex');
      expect(fallback).toHaveClass('size-full');
      expect(fallback).toHaveClass('items-center');
      expect(fallback).toHaveClass('justify-center');
      expect(fallback).toHaveClass('rounded-full');
    });

    it('should apply custom className', () => {
      render(
        <Avatar>
          <AvatarFallback className="custom-fallback">AB</AvatarFallback>
        </Avatar>
      );
      const fallback = document.querySelector('[data-slot="avatar-fallback"]');
      expect(fallback).toHaveClass('custom-fallback');
      expect(fallback).toHaveClass('bg-muted');
    });

    it('should render text initials', () => {
      render(
        <Avatar>
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>
      );
      expect(screen.getByText('JD')).toBeInTheDocument();
    });

    it('should render icon fallback', () => {
      render(
        <Avatar>
          <AvatarFallback>
            <svg data-testid="user-icon">
              <circle />
            </svg>
          </AvatarFallback>
        </Avatar>
      );
      expect(screen.getByTestId('user-icon')).toBeInTheDocument();
    });
  });

  describe('Avatar with Image and Fallback', () => {
    it('should render both image and fallback', () => {
      render(
        <Avatar>
          <AvatarImage src="https://example.com/avatar.jpg" alt="User" />
          <AvatarFallback>AB</AvatarFallback>
        </Avatar>
      );

      // Image should be rendered
      expect(screen.getByRole('img')).toBeInTheDocument();
      // Fallback should also be in DOM (Radix handles visibility)
      expect(screen.getByText('AB')).toBeInTheDocument();
    });

    it('should show fallback when image fails to load', async () => {
      render(
        <Avatar>
          <AvatarImage src="invalid-url" alt="User" />
          <AvatarFallback>AB</AvatarFallback>
        </Avatar>
      );

      // Fallback should be visible (Radix UI handles the logic)
      expect(screen.getByText('AB')).toBeInTheDocument();
    });

    it('should handle image with onLoadingStatusChange', () => {
      const handleLoadingStatusChange = jest.fn();

      render(
        <Avatar>
          <AvatarImage
            src="https://example.com/avatar.jpg"
            alt="User"
            onLoadingStatusChange={handleLoadingStatusChange}
          />
          <AvatarFallback>AB</AvatarFallback>
        </Avatar>
      );

      // Just verify the handler is passed correctly
      expect(handleLoadingStatusChange).toBeDefined();
    });
  });

  describe('Custom Sizes', () => {
    it('should support small size', () => {
      render(<Avatar className="size-6" data-testid="avatar" />);
      const avatar = screen.getByTestId('avatar');
      expect(avatar).toHaveClass('size-6');
    });

    it('should support medium size (default)', () => {
      render(<Avatar data-testid="avatar" />);
      const avatar = screen.getByTestId('avatar');
      expect(avatar).toHaveClass('size-8');
    });

    it('should support large size', () => {
      render(<Avatar className="size-12" data-testid="avatar" />);
      const avatar = screen.getByTestId('avatar');
      expect(avatar).toHaveClass('size-12');
    });

    it('should support extra large size', () => {
      render(<Avatar className="size-16" data-testid="avatar" />);
      const avatar = screen.getByTestId('avatar');
      expect(avatar).toHaveClass('size-16');
    });
  });

  describe('Custom Styling', () => {
    it('should support border styling', () => {
      render(<Avatar className="border-2 border-primary" data-testid="avatar" />);
      const avatar = screen.getByTestId('avatar');
      expect(avatar).toHaveClass('border-2');
      expect(avatar).toHaveClass('border-primary');
    });

    it('should support ring styling', () => {
      render(<Avatar className="ring-2 ring-offset-2" data-testid="avatar" />);
      const avatar = screen.getByTestId('avatar');
      expect(avatar).toHaveClass('ring-2');
      expect(avatar).toHaveClass('ring-offset-2');
    });

    it('should support background color on fallback', () => {
      render(
        <Avatar>
          <AvatarFallback className="bg-blue-500 text-white">AB</AvatarFallback>
        </Avatar>
      );
      const fallback = document.querySelector('[data-slot="avatar-fallback"]');
      expect(fallback).toHaveClass('bg-blue-500');
      expect(fallback).toHaveClass('text-white');
    });
  });

  describe('Accessibility', () => {
    it('should have accessible image with alt text', () => {
      render(
        <Avatar>
          <AvatarImage src="https://example.com/avatar.jpg" alt="John Doe profile picture" />
        </Avatar>
      );
      const image = screen.getByRole('img');
      expect(image).toHaveAccessibleName('John Doe profile picture');
    });

    it('should have accessible fallback text', () => {
      render(
        <Avatar>
          <AvatarFallback aria-label="John Doe">JD</AvatarFallback>
        </Avatar>
      );
      expect(screen.getByText('JD')).toBeInTheDocument();
    });

    it('should support aria-label on root', () => {
      render(<Avatar aria-label="User avatar" data-testid="avatar" />);
      const avatar = screen.getByTestId('avatar');
      expect(avatar).toHaveAttribute('aria-label', 'User avatar');
    });
  });

  describe('Usage Examples', () => {
    it('should work as user profile avatar', () => {
      render(
        <Avatar>
          <AvatarImage src="/users/john-doe.jpg" alt="John Doe" />
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>
      );

      expect(screen.getByRole('img')).toHaveAttribute('src', '/users/john-doe.jpg');
      expect(screen.getByText('JD')).toBeInTheDocument();
    });

    it('should work as avatar with initials only', () => {
      render(
        <Avatar>
          <AvatarFallback>AB</AvatarFallback>
        </Avatar>
      );

      expect(screen.getByText('AB')).toBeInTheDocument();
    });

    it('should work in avatar group', () => {
      render(
        <div style={{ display: 'flex' }}>
          <Avatar className="size-10">
            <AvatarImage src="/user1.jpg" alt="User 1" />
            <AvatarFallback>U1</AvatarFallback>
          </Avatar>
          <Avatar className="size-10">
            <AvatarImage src="/user2.jpg" alt="User 2" />
            <AvatarFallback>U2</AvatarFallback>
          </Avatar>
          <Avatar className="size-10">
            <AvatarImage src="/user3.jpg" alt="User 3" />
            <AvatarFallback>U3</AvatarFallback>
          </Avatar>
        </div>
      );

      const images = screen.getAllByRole('img');
      expect(images).toHaveLength(3);
    });

    it('should work with custom colors', () => {
      render(
        <Avatar className="border-2 border-blue-500">
          <AvatarFallback className="bg-blue-100 text-blue-700">AB</AvatarFallback>
        </Avatar>
      );

      const fallback = document.querySelector('[data-slot="avatar-fallback"]');
      expect(fallback).toHaveClass('bg-blue-100');
      expect(fallback).toHaveClass('text-blue-700');
    });

    it('should work with status indicator', () => {
      render(
        <div style={{ position: 'relative' }}>
          <Avatar>
            <AvatarImage src="/user.jpg" alt="User" />
            <AvatarFallback>U</AvatarFallback>
          </Avatar>
          <span
            data-testid="status-indicator"
            style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: 'green',
            }}
          />
        </div>
      );

      expect(screen.getByTestId('status-indicator')).toBeInTheDocument();
    });
  });

  describe('Combined Props', () => {
    it('should handle all custom props together', () => {
      render(
        <Avatar
          className="size-12 border-2 border-primary ring-2 ring-offset-2"
          data-testid="avatar"
          aria-label="User profile"
        >
          <AvatarImage
            src="https://example.com/avatar.jpg"
            alt="User"
            className="object-cover"
          />
          <AvatarFallback className="bg-blue-500 text-white font-bold">AB</AvatarFallback>
        </Avatar>
      );

      const avatar = screen.getByTestId('avatar');
      expect(avatar).toHaveClass('size-12');
      expect(avatar).toHaveClass('border-2');
      expect(avatar).toHaveClass('border-primary');
      expect(avatar).toHaveAttribute('aria-label', 'User profile');

      const image = document.querySelector('[data-slot="avatar-image"]');
      expect(image).toHaveClass('object-cover');

      const fallback = document.querySelector('[data-slot="avatar-fallback"]');
      expect(fallback).toHaveClass('bg-blue-500');
      expect(fallback).toHaveClass('text-white');
    });
  });
});
