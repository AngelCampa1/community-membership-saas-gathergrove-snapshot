/**
 * Optimized Image Component
 * 
 * High-performance image component with lazy loading,
 * format optimization, and responsive sizing.
 */

import React, { useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  loading?: 'lazy' | 'eager';
  quality?: number;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  sizes?: string;
  fill?: boolean;
  style?: React.CSSProperties;
  onLoad?: () => void;
  onError?: () => void;
  fallback?: string;
  'data-testid'?: string;
}

/**
 * Generate blur data URL for placeholder
 */
const generateBlurDataURL = (width: number = 10, height: number = 10): string => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  
  // Create a subtle gradient
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, 'hsl(var(--muted))');
  gradient.addColorStop(1, 'hsl(var(--muted) / 0.8)');
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  
  return canvas.toDataURL();
};

/**
 * Optimized Image Component
 */
export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
  loading = 'lazy',
  quality = 85,
  placeholder = 'blur',
  blurDataURL,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  fill = false,
  style,
  onLoad,
  onError,
  fallback = '/images/placeholder.jpg',
  'data-testid': testId = 'optimized-image'
}) => {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const imgRef = useRef<HTMLImageElement>(null);

  const handleLoad = useCallback(() => {
    setIsLoading(false);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(() => {
    setImageError(true);
    setIsLoading(false);
    onError?.();
  }, [onError]);

  // Use fallback image if there's an error
  const imageSrc = imageError ? fallback : src;
  
  // Generate blur data URL if not provided
  const blurData = blurDataURL || (placeholder === 'blur' ? generateBlurDataURL() : undefined);

  return (
    <div 
      className={cn('relative overflow-hidden', className)}
      data-testid={testId}
      style={style}
    >
      {/* Loading skeleton */}
      {isLoading && (
        <div className="absolute inset-0 animate-pulse bg-muted" />
      )}
      
      {/* Main image */}
      <Image
        ref={imgRef}
        src={imageSrc}
        alt={alt}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        fill={fill}
        priority={priority}
        loading={loading}
        quality={quality}
        placeholder={placeholder}
        blurDataURL={blurData}
        sizes={sizes}
        className={cn(
          'transition-opacity duration-300',
          isLoading ? 'opacity-0' : 'opacity-100'
        )}
        onLoad={handleLoad}
        onError={handleError}
        unoptimized={false} // Enable Next.js optimization
      />
      
      {/* Error state */}
      {imageError && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
          <div className="text-center text-muted-foreground">
            <svg
              className="mx-auto h-8 w-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="mt-1 text-xs">Image unavailable</p>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Avatar Image Component with optimizations
 */
export const OptimizedAvatar: React.FC<{
  src?: string;
  alt: string;
  size?: number;
  className?: string;
  fallbackText?: string;
}> = ({
  src,
  alt,
  size = 40,
  className,
  fallbackText
}) => {
  const [imageError, setImageError] = useState(!src);
  
  // Generate initials from fallback text
  const initials = fallbackText
    ? fallbackText.split(' ').map(word => word[0]).join('').slice(0, 2).toUpperCase()
    : alt.split(' ').map(word => word[0]).join('').slice(0, 2).toUpperCase();

  if (imageError || !src) {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-full bg-muted text-muted-foreground font-medium',
          className
        )}
        style={{ width: size, height: size, fontSize: size * 0.4 }}
        data-testid="avatar-fallback"
      >
        {initials}
      </div>
    );
  }

  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={cn('rounded-full', className)}
      priority={false}
      quality={90}
      onError={() => setImageError(true)}
      data-testid="avatar-image"
    />
  );
};

/**
 * Hero Image Component with responsive optimization
 */
export const OptimizedHeroImage: React.FC<{
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
}> = ({
  src,
  alt,
  className,
  priority = true
}) => {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      fill
      priority={priority}
      quality={95}
      sizes="100vw"
      className={cn('object-cover', className)}
      placeholder="blur"
      data-testid="hero-image"
    />
  );
};

/**
 * Gallery Image Component with lazy loading
 */
export const OptimizedGalleryImage: React.FC<{
  src: string;
  alt: string;
  aspectRatio?: string;
  className?: string;
  onClick?: () => void;
}> = ({
  src,
  alt,
  aspectRatio = 'aspect-square',
  className,
  onClick
}) => {
  return (
    <div
      className={cn(
        'relative cursor-pointer overflow-hidden rounded-lg',
        aspectRatio,
        className
      )}
      onClick={onClick}
      data-testid="gallery-image"
    >
      <OptimizedImage
        src={src}
        alt={alt}
        fill
        priority={false}
        quality={80}
        sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
        className="object-cover transition-transform duration-300 hover:scale-105"
        placeholder="blur"
      />
    </div>
  );
};

/**
 * Background Image Component
 */
export const OptimizedBackgroundImage: React.FC<{
  src: string;
  alt: string;
  children?: React.ReactNode;
  className?: string;
  overlay?: boolean;
  overlayOpacity?: number;
}> = ({
  src,
  alt,
  children,
  className,
  overlay = false,
  overlayOpacity = 0.5
}) => {
  return (
    <div className={cn('relative', className)} data-testid="background-image">
      <OptimizedImage
        src={src}
        alt={alt}
        fill
        priority={false}
        quality={80}
        sizes="100vw"
        className="object-cover"
        placeholder="blur"
      />
      
      {overlay && (
        <div 
          className="absolute inset-0 bg-black"
          style={{ opacity: overlayOpacity }}
        />
      )}
      
      {children && (
        <div className="relative z-10">
          {children}
        </div>
      )}
    </div>
  );
};

export default OptimizedImage;