import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  OptimizedImage,
  OptimizedAvatar,
  OptimizedHeroImage,
  OptimizedGalleryImage,
  OptimizedBackgroundImage
} from '../optimized-image';

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, onLoad, onError, className, fill, priority, ...props }: any) => {
    return (
      <img
        src={src}
        alt={alt}
        className={className}
        onLoad={onLoad}
        onError={onError}
        data-next-image="true"
        {...(fill !== undefined && { fill: String(fill) })}
        {...(priority !== undefined && { priority: String(priority) })}
        {...props}
      />
    );
  },
}));

describe('OptimizedImage', () => {
  describe('Basic Rendering', () => {
    it('should render image with src and alt', () => {
      render(<OptimizedImage src="/test.jpg" alt="Test image" />);

      const img = screen.getByAltText('Test image');
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute('src', '/test.jpg');
    });

    it('should render with testid', () => {
      render(<OptimizedImage src="/test.jpg" alt="Test" />);

      expect(screen.getByTestId('optimized-image')).toBeInTheDocument();
    });

    it('should render with custom testid', () => {
      render(<OptimizedImage src="/test.jpg" alt="Test" data-testid="custom-image" />);

      expect(screen.getByTestId('custom-image')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(
        <OptimizedImage src="/test.jpg" alt="Test" className="custom-class" />
      );

      const wrapper = container.querySelector('.custom-class');
      expect(wrapper).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should show loading skeleton initially', () => {
      const { container } = render(<OptimizedImage src="/test.jpg" alt="Test" />);

      const skeleton = container.querySelector('.animate-pulse.bg-muted');
      expect(skeleton).toBeInTheDocument();
    });

    it('should hide loading skeleton after image loads', async () => {
      const { container } = render(<OptimizedImage src="/test.jpg" alt="Test" />);

      const img = screen.getByAltText('Test');
      fireEvent.load(img);

      await waitFor(() => {
        const skeleton = container.querySelector('.animate-pulse.bg-muted');
        expect(skeleton).not.toBeInTheDocument();
      });
    });

    it('should call onLoad callback', () => {
      const onLoad = jest.fn();
      render(<OptimizedImage src="/test.jpg" alt="Test" onLoad={onLoad} />);

      const img = screen.getByAltText('Test');
      fireEvent.load(img);

      expect(onLoad).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error Handling', () => {
    it('should show error state on image error', async () => {
      render(<OptimizedImage src="/test.jpg" alt="Test" />);

      const img = screen.getByAltText('Test');
      fireEvent.error(img);

      await waitFor(() => {
        expect(screen.getByText('Image unavailable')).toBeInTheDocument();
      });
    });

    it('should use fallback image on error', async () => {
      render(
        <OptimizedImage
          src="/test.jpg"
          alt="Test"
          fallback="/fallback.jpg"
        />
      );

      const img = screen.getByAltText('Test');
      fireEvent.error(img);

      await waitFor(() => {
        expect(img).toHaveAttribute('src', '/fallback.jpg');
      });
    });

    it('should call onError callback', () => {
      const onError = jest.fn();
      render(<OptimizedImage src="/test.jpg" alt="Test" onError={onError} />);

      const img = screen.getByAltText('Test');
      fireEvent.error(img);

      expect(onError).toHaveBeenCalledTimes(1);
    });

    it('should show error icon in error state', async () => {
      const { container } = render(<OptimizedImage src="/test.jpg" alt="Test" />);

      const img = screen.getByAltText('Test');
      fireEvent.error(img);

      await waitFor(() => {
        const errorIcon = container.querySelector('svg');
        expect(errorIcon).toBeInTheDocument();
      });
    });
  });

  describe('Image Props', () => {
    it('should pass width and height props', () => {
      render(<OptimizedImage src="/test.jpg" alt="Test" width={500} height={300} />);

      const img = screen.getByAltText('Test');
      expect(img).toHaveAttribute('width', '500');
      expect(img).toHaveAttribute('height', '300');
    });

    it('should handle fill prop', () => {
      render(<OptimizedImage src="/test.jpg" alt="Test" fill />);

      const img = screen.getByAltText('Test');
      expect(img).toHaveAttribute('fill', 'true');
    });

    it('should pass priority prop', () => {
      render(<OptimizedImage src="/test.jpg" alt="Test" priority />);

      const img = screen.getByAltText('Test');
      expect(img).toHaveAttribute('priority', 'true');
    });

    it('should pass loading prop', () => {
      render(<OptimizedImage src="/test.jpg" alt="Test" loading="eager" />);

      const img = screen.getByAltText('Test');
      expect(img).toHaveAttribute('loading', 'eager');
    });

    it('should pass quality prop', () => {
      render(<OptimizedImage src="/test.jpg" alt="Test" quality={90} />);

      const img = screen.getByAltText('Test');
      expect(img).toHaveAttribute('quality', '90');
    });

    it('should pass sizes prop', () => {
      render(<OptimizedImage src="/test.jpg" alt="Test" sizes="100vw" />);

      const img = screen.getByAltText('Test');
      expect(img).toHaveAttribute('sizes', '100vw');
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing src gracefully', () => {
      render(<OptimizedImage src="" alt="Test" />);

      const img = screen.getByAltText('Test');
      expect(img).toBeInTheDocument();
    });

    it('should handle special characters in alt text', () => {
      render(<OptimizedImage src="/test.jpg" alt='Test <image> & "quotes"' />);

      expect(screen.getByAltText('Test <image> & "quotes"')).toBeInTheDocument();
    });

    it('should handle rapid load/error events', () => {
      const onLoad = jest.fn();
      const onError = jest.fn();

      render(<OptimizedImage src="/test.jpg" alt="Test" onLoad={onLoad} onError={onError} />);

      const img = screen.getByAltText('Test');
      fireEvent.load(img);
      fireEvent.error(img);
      fireEvent.load(img);

      expect(onLoad).toHaveBeenCalledTimes(2);
      expect(onError).toHaveBeenCalledTimes(1);
    });
  });
});

describe('OptimizedAvatar', () => {
  describe('Rendering', () => {
    it('should render avatar with image', () => {
      render(<OptimizedAvatar src="/avatar.jpg" alt="User" />);

      expect(screen.getByTestId('avatar-image')).toBeInTheDocument();
    });

    it('should render fallback when no src provided', () => {
      render(<OptimizedAvatar alt="John Doe" />);

      expect(screen.getByTestId('avatar-fallback')).toBeInTheDocument();
    });

    it('should show initials in fallback', () => {
      render(<OptimizedAvatar alt="John Doe" />);

      expect(screen.getByText('JD')).toBeInTheDocument();
    });

    it('should use fallbackText for initials', () => {
      render(<OptimizedAvatar alt="User" fallbackText="Alice Smith" />);

      expect(screen.getByText('AS')).toBeInTheDocument();
    });

    it('should limit initials to 2 characters', () => {
      render(<OptimizedAvatar alt="John Michael David Smith" />);

      const fallback = screen.getByTestId('avatar-fallback');
      expect(fallback.textContent).toHaveLength(2);
    });
  });

  describe('Size Prop', () => {
    it('should apply default size', () => {
      const { container } = render(<OptimizedAvatar alt="User" />);

      const fallback = screen.getByTestId('avatar-fallback');
      expect(fallback).toHaveStyle({ width: '40px', height: '40px' });
    });

    it('should apply custom size', () => {
      const { container } = render(<OptimizedAvatar alt="User" size={64} />);

      const fallback = screen.getByTestId('avatar-fallback');
      expect(fallback).toHaveStyle({ width: '64px', height: '64px' });
    });
  });

  describe('Error Handling', () => {
    it('should show fallback on image error', async () => {
      render(<OptimizedAvatar src="/avatar.jpg" alt="John Doe" />);

      const img = screen.getByAltText('John Doe');
      fireEvent.error(img);

      await waitFor(() => {
        expect(screen.getByTestId('avatar-fallback')).toBeInTheDocument();
      });
    });
  });
});

describe('OptimizedHeroImage', () => {
  it('should render hero image', () => {
    render(<OptimizedHeroImage src="/hero.jpg" alt="Hero" />);

    expect(screen.getByTestId('hero-image')).toBeInTheDocument();
  });

  it('should use priority loading by default', () => {
    render(<OptimizedHeroImage src="/hero.jpg" alt="Hero" />);

    const img = screen.getByAltText('Hero');
    expect(img).toHaveAttribute('priority', 'true');
  });

  it('should apply object-cover class', () => {
    const { container } = render(<OptimizedHeroImage src="/hero.jpg" alt="Hero" />);

    const wrapper = container.querySelector('.object-cover');
    expect(wrapper).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = render(
      <OptimizedHeroImage src="/hero.jpg" alt="Hero" className="custom-hero" />
    );

    const wrapper = container.querySelector('.custom-hero');
    expect(wrapper).toBeInTheDocument();
  });
});

describe('OptimizedGalleryImage', () => {
  it('should render gallery image', () => {
    render(<OptimizedGalleryImage src="/gallery.jpg" alt="Gallery" />);

    expect(screen.getByTestId('gallery-image')).toBeInTheDocument();
  });

  it('should apply aspect-square by default', () => {
    const { container } = render(<OptimizedGalleryImage src="/gallery.jpg" alt="Gallery" />);

    const wrapper = screen.getByTestId('gallery-image');
    expect(wrapper).toHaveClass('aspect-square');
  });

  it('should apply custom aspect ratio', () => {
    const { container } = render(
      <OptimizedGalleryImage src="/gallery.jpg" alt="Gallery" aspectRatio="aspect-video" />
    );

    const wrapper = screen.getByTestId('gallery-image');
    expect(wrapper).toHaveClass('aspect-video');
  });

  it('should handle click events', async () => {
    const user = userEvent.setup();
    const onClick = jest.fn();

    render(<OptimizedGalleryImage src="/gallery.jpg" alt="Gallery" onClick={onClick} />);

    const wrapper = screen.getByTestId('gallery-image');
    await user.click(wrapper);

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('should have cursor-pointer class', () => {
    render(<OptimizedGalleryImage src="/gallery.jpg" alt="Gallery" />);

    const wrapper = screen.getByTestId('gallery-image');
    expect(wrapper).toHaveClass('cursor-pointer');
  });
});

describe('OptimizedBackgroundImage', () => {
  it('should render background image', () => {
    render(<OptimizedBackgroundImage src="/bg.jpg" alt="Background" />);

    expect(screen.getByTestId('background-image')).toBeInTheDocument();
  });

  it('should render children', () => {
    render(
      <OptimizedBackgroundImage src="/bg.jpg" alt="Background">
        <div>Child content</div>
      </OptimizedBackgroundImage>
    );

    expect(screen.getByText('Child content')).toBeInTheDocument();
  });

  it('should render without overlay by default', () => {
    const { container } = render(<OptimizedBackgroundImage src="/bg.jpg" alt="Background" />);

    const overlay = container.querySelector('.bg-black');
    expect(overlay).not.toBeInTheDocument();
  });

  it('should render with overlay', () => {
    const { container } = render(
      <OptimizedBackgroundImage src="/bg.jpg" alt="Background" overlay />
    );

    const overlay = container.querySelector('.bg-black');
    expect(overlay).toBeInTheDocument();
  });

  it('should apply custom overlay opacity', () => {
    const { container } = render(
      <OptimizedBackgroundImage src="/bg.jpg" alt="Background" overlay overlayOpacity={0.7} />
    );

    const overlay = container.querySelector('.bg-black');
    expect(overlay).toHaveStyle({ opacity: 0.7 });
  });

  it('should position children with z-index', () => {
    const { container } = render(
      <OptimizedBackgroundImage src="/bg.jpg" alt="Background">
        <div>Content</div>
      </OptimizedBackgroundImage>
    );

    const childWrapper = container.querySelector('.relative.z-10');
    expect(childWrapper).toBeInTheDocument();
  });
});

describe('Integration', () => {
  it('should work with all variant components together', () => {
    const { container } = render(
      <div>
        <OptimizedImage src="/test.jpg" alt="Test" />
        <OptimizedAvatar src="/avatar.jpg" alt="User" />
        <OptimizedHeroImage src="/hero.jpg" alt="Hero" />
        <OptimizedGalleryImage src="/gallery.jpg" alt="Gallery" />
        <OptimizedBackgroundImage src="/bg.jpg" alt="Background" />
      </div>
    );

    // Check for multiple optimized-image testids (each component uses it internally)
    const optimizedImages = screen.getAllByTestId('optimized-image');
    expect(optimizedImages.length).toBeGreaterThan(0);

    expect(screen.getByTestId('avatar-image')).toBeInTheDocument();
    expect(screen.getByTestId('hero-image')).toBeInTheDocument();
    expect(screen.getByTestId('gallery-image')).toBeInTheDocument();
    expect(screen.getByTestId('background-image')).toBeInTheDocument();
  });
});
