'use client';

import Image from 'next/image';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/logger';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  priority?: boolean;
  className?: string;
  quality?: number;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  sizes?: string;
  fill?: boolean;
  loading?: 'lazy' | 'eager';
}

export default function OptimizedImage({
  src,
  alt,
  width,
  height,
  priority = false,
  className,
  quality = 85,
  placeholder = 'blur',
  blurDataURL,
  sizes,
  fill = false,
  loading = 'lazy',
  ...props
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Generate a simple blur placeholder if none provided
  const defaultBlurDataURL = 
    blurDataURL || 
    `data:image/svg+xml;base64,${Buffer.from(
      `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#f3f4f6"/>
      </svg>`
    ).toString('base64')}`;

  // Responsive sizes for common breakpoints
  const responsiveSizes = sizes || 
    `(max-width: 640px) 100vw, 
     (max-width: 1024px) 50vw, 
     33vw`;

  if (hasError) {
    return (
      <div 
        className={cn(
          "flex items-center justify-center bg-muted text-muted-foreground text-sm",
          className
        )}
        style={{ width, height }}
      >
        Failed to load image
      </div>
    );
  }

  return (
    <div className={cn("relative overflow-hidden", className)}>
      <Image
        src={src}
        alt={alt}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        fill={fill}
        priority={priority}
        quality={quality}
        placeholder={placeholder}
        blurDataURL={placeholder === 'blur' ? defaultBlurDataURL : undefined}
        sizes={responsiveSizes}
        loading={priority ? 'eager' : loading}
        className={cn(
          "transition-opacity duration-300",
          isLoading ? "opacity-0" : "opacity-100",
          fill && "object-cover"
        )}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setHasError(true);
        }}
        {...props}
      />
      
      {/* Loading skeleton */}
      {isLoading && (
        <div 
          className="absolute inset-0 bg-muted animate-pulse"
          style={{ width: fill ? '100%' : width, height: fill ? '100%' : height }}
        />
      )}
    </div>
  );
}

// Hook for progressive image loading
export function useProgressiveImage(src: string, placeholder?: string) {
  const [currentSrc, setCurrentSrc] = useState(placeholder || '');
  const [isLoading, setIsLoading] = useState(true);

  const loadImage = (imageSrc: string) => {
    return new Promise<string>((resolve, reject) => {
      const img = new window.Image();
      img.onload = () => resolve(imageSrc);
      img.onerror = () => reject(new Error(`Failed to load image: ${imageSrc}`));
      img.src = imageSrc;
    });
  };

  const loadProgressiveImage = async () => {
    try {
      const imageURL = await loadImage(src);
      setCurrentSrc(imageURL);
      setIsLoading(false);
    } catch (error) {
      logger.warn('ui', 'Progressive image loading failed', { error, src });
      setIsLoading(false);
    }
  };

  return {
    src: currentSrc,
    isLoading,
    loadImage: loadProgressiveImage,
  };
}