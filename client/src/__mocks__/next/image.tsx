import React from 'react';

interface ImageProps {
  src: string | { src: string };
  alt: string;
  width?: number | string;
  height?: number | string;
  className?: string;
  style?: React.CSSProperties;
  priority?: boolean;
  placeholder?: string;
  blurDataURL?: string;
  quality?: number;
  fill?: boolean;
  sizes?: string;
  loader?: any;
  onLoad?: () => void;
  onError?: () => void;
  loading?: 'lazy' | 'eager';
}

// Mock Next.js Image component to prevent prop validation errors
const Image: React.FC<ImageProps> = ({ 
  src, 
  alt, 
  width, 
  height, 
  className,
  // Filter out Next.js specific props that don't exist on img elements
  priority: _priority,
  placeholder: _placeholder,
  blurDataURL: _blurDataURL,
  quality: _quality,
  fill: _fill,
  sizes: _sizes,
  loader: _loader,
  onLoad: _onLoad,
  onError: _onError,
  loading: _loading,
  style,
  ...props 
}) => {
  return (
    <img 
      src={typeof src === 'string' ? src : src?.src || '/placeholder.jpg'} 
      alt={alt || ''} 
      width={width}
      height={height}
      className={className}
      style={style}
      {...props} 
    />
  );
};

export default Image;