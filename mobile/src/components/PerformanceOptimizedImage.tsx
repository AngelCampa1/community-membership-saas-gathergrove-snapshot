import React, { useState, useEffect, useRef, memo } from 'react';
import { Image, ImageStyle, StyleProp, View, Platform, ImageProps } from 'react-native';
import { LIGHT_THEME } from '../constants/colors';

// Type for web-specific Image component with additional HTML attributes
type WebImageProps = ImageProps & {
  alt?: string;
  loading?: 'eager' | 'lazy';
  decoding?: 'async' | 'sync' | 'auto';
  srcSet?: string;
  sizes?: string;
  fetchpriority?: 'high' | 'low' | 'auto';
  'aria-hidden'?: boolean;
};

interface PerformanceOptimizedImageProps {
  source: { uri: string } | number;
  style?: StyleProp<ImageStyle>;
  alt?: string;
  placeholder?: string;
  lazy?: boolean;
  webp?: boolean;
  avif?: boolean;
  quality?: number;
  onLoad?: () => void;
  onError?: () => void;
  testID?: string;
  accessibilityLabel?: string;
  priority?: 'high' | 'low' | 'auto';
}

/**
 * Performance-optimized image component for perfect Lighthouse scores
 * Features:
 * - Lazy loading with Intersection Observer
 * - WebP/AVIF format support for web
 * - Responsive images with srcset
 * - Progressive loading with placeholders
 * - Perfect accessibility support
 */
const PerformanceOptimizedImage: React.FC<PerformanceOptimizedImageProps> = memo(({
  source,
  style,
  alt = '',
  placeholder,
  lazy = true,
  webp = true,
  avif = true,
  quality = 80,
  onLoad,
  onError,
  testID,
  accessibilityLabel,
  priority = 'auto',
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(!lazy);
  const [hasError, setHasError] = useState(false);
  const imageRef = useRef<Image>(null);
  const webObserverRef = useRef<HTMLElement | null>(null);

  // Intersection Observer for lazy loading on web
  useEffect(() => {
    if (!lazy || Platform.OS !== 'web' || isInView) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '50px',
        threshold: 0.1,
      }
    );

    if (webObserverRef.current) {
      observer.observe(webObserverRef.current);
    }

    return () => observer.disconnect();
  }, [lazy, isInView]);

  // Generate optimized image URLs for web
  const getOptimizedSource = () => {
    if (typeof source === 'number') {
      return source; // Local images
    }

    if (Platform.OS !== 'web') {
      return source;
    }

    const baseUrl = source.uri;
    const separator = baseUrl.includes('?') ? '&' : '?';
    
    // Add optimization parameters
    let optimizedUrl = `${baseUrl}${separator}q=${quality}&fm=webp`;
    
    if (avif) {
      optimizedUrl += '&fm=avif';
    }
    
    return { uri: optimizedUrl };
  };

  // Generate srcSet for responsive images on web
  const getSrcSet = () => {
    if (typeof source === 'number' || Platform.OS !== 'web') {
      return undefined;
    }

    const baseUrl = source.uri;
    const separator = baseUrl.includes('?') ? '&' : '?';
    
    const sizes = [
      { width: 640, descriptor: '640w' },
      { width: 768, descriptor: '768w' },
      { width: 1024, descriptor: '1024w' },
      { width: 1280, descriptor: '1280w' },
      { width: 1920, descriptor: '1920w' },
    ];

    return sizes
      .map(({ width, descriptor }) => {
        const format = avif ? 'avif' : webp ? 'webp' : 'jpg';
        return `${baseUrl}${separator}w=${width}&q=${quality}&fm=${format} ${descriptor}`;
      })
      .join(', ');
  };

  const handleLoad = () => {
    setIsLoaded(true);
    setHasError(false);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    setIsLoaded(false);
    onError?.();
  };

  // Don't render anything if lazy loading and not in view
  if (lazy && !isInView) {
    return (
      <View
        ref={(ref) => {
          if (Platform.OS === 'web' && ref) {
            webObserverRef.current = ref as unknown as HTMLElement;
          }
        }}
        style={[style, { backgroundColor: LIGHT_THEME.background.secondary }]}
        testID={`${testID}-placeholder`}
        accessible={true}
        accessibilityLabel={accessibilityLabel || alt || 'Loading image'}
        accessibilityRole="image"
      />
    );
  }

  // Web-specific optimizations
  if (Platform.OS === 'web') {
    const WebImage = Image as React.ComponentType<WebImageProps>;
    const srcSet = getSrcSet();

    return (
      <View
        ref={(ref) => {
          if (ref) {
            webObserverRef.current = ref as unknown as HTMLElement;
          }
        }}
        style={style}
      >
        {/* Placeholder while loading */}
        {!isLoaded && !hasError && placeholder && (
          <WebImage
            source={{ uri: placeholder }}
            style={[
              style,
              {
                position: 'absolute' as const,
                opacity: 0.7,
              },
            ]}
            accessibilityLabel=""
            aria-hidden={true}
          />
        )}
        
        {/* Main optimized image */}
        <WebImage
          source={getOptimizedSource()}
          style={[
            style,
            {
              opacity: isLoaded ? 1 : 0,
            },
          ]}
          onLoad={handleLoad}
          onError={handleError}
          testID={testID}
          accessibilityLabel={accessibilityLabel || alt}
          alt={alt}
          loading={priority === 'high' ? 'eager' : 'lazy'}
          decoding="async"
          srcSet={srcSet}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          fetchpriority={priority}
        />
        
        {/* Error state */}
        {hasError && (
          <View
            style={[
              style,
              {
                backgroundColor: LIGHT_THEME.status.errorBackground,
                justifyContent: 'center',
                alignItems: 'center',
              },
            ]}
            accessible={true}
            accessibilityLabel="Failed to load image"
            accessibilityRole="image"
          />
        )}
      </View>
    );
  }

  // React Native mobile implementation
  return (
    <Image
      ref={imageRef}
      source={getOptimizedSource()}
      style={style}
      onLoad={handleLoad}
      onError={handleError}
      testID={testID}
      accessibilityLabel={accessibilityLabel || alt}
      accessible={true}
      accessibilityRole="image"
    />
  );
});

PerformanceOptimizedImage.displayName = 'PerformanceOptimizedImage';

export default PerformanceOptimizedImage;