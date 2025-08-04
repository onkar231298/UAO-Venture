import { useState, useRef, useEffect } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholder?: React.ReactNode;
  onLoad?: () => void;
  onError?: () => void;
  priority?: boolean; // For above-the-fold images
  lazy?: boolean; // Enable lazy loading
  sizes?: string; // Responsive image sizes
  quality?: number; // Image quality (for future CDN integration)
}

export default function OptimizedImage({
  src,
  alt,
  className = '',
  placeholder,
  onLoad,
  onError,
  priority = false,
  lazy = true,
  sizes,
  quality = 85
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(!lazy || priority);
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver>();

  // Convert to WebP if supported and optimize URL
  const getOptimizedSrc = (originalSrc: string) => {
    // Check if browser supports WebP
    const supportsWebP = (() => {
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      return canvas.toDataURL('image/webp').indexOf('image/webp') === 5;
    })();

    // For external URLs (Unsplash, etc.), add WebP format parameter
    if (originalSrc.includes('unsplash.com')) {
      const url = new URL(originalSrc);
      if (supportsWebP) {
        url.searchParams.set('fm', 'webp');
        url.searchParams.set('q', quality.toString());
      }
      return url.toString();
    }

    // For internal images, return as-is (we'll add WebP conversion later)
    return originalSrc;
  };

  // Set up intersection observer for lazy loading
  useEffect(() => {
    if (!lazy || priority || isInView) return;

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observerRef.current?.disconnect();
        }
      },
      {
        rootMargin: '100px' // Start loading 100px before the image comes into view for smoother experience
      }
    );

    if (imgRef.current) {
      observerRef.current.observe(imgRef.current);
    }

    return () => {
      observerRef.current?.disconnect();
    };
  }, [lazy, priority, isInView]);

  const handleImageLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  const handleImageError = () => {
    setIsLoading(false);
    setHasError(true);
    onError?.();
  };

  // Enhanced placeholder with blur effect
  const defaultPlaceholder = (
    <div className={`flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 text-gray-400 ${className} animate-pulse`}>
      <div className="text-center">
        <div className="text-2xl mb-2 animate-bounce">📷</div>
        <div className="text-sm font-medium">
          {isLoading ? 'Loading...' : 'No Preview Available'}
        </div>
      </div>
    </div>
  );

  if (!isInView) {
    return (
      <div ref={imgRef} className={className}>
        {placeholder || defaultPlaceholder}
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden">
      {isLoading && (placeholder || defaultPlaceholder)}
      
      <img
        ref={imgRef}
        src={getOptimizedSrc(src)}
        alt={alt}
        className={`${className} ${
          isLoading 
            ? 'opacity-0 scale-105 blur-sm' 
            : 'opacity-100 scale-100 blur-0'
        } transition-all duration-500 ease-out`}
        onLoad={handleImageLoad}
        onError={handleImageError}
        loading={priority ? 'eager' : 'lazy'}
        decoding={priority ? 'sync' : 'async'}
        sizes={sizes}
        style={{ 
          display: hasError ? 'none' : 'block',
          contentVisibility: lazy && !priority ? 'auto' : 'visible'
        }}
      />
      
      {hasError && (
        <div className={`flex items-center justify-center bg-gradient-to-br from-red-50 to-gray-100 text-red-400 ${className}`}>
          <div className="text-center">
            <div className="text-2xl mb-2">⚠️</div>
            <div className="text-sm font-medium">Failed to load image</div>
          </div>
        </div>
      )}
    </div>
  );
}