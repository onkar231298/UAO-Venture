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
}

export default function OptimizedImage({
  src,
  alt,
  className = '',
  placeholder,
  onLoad,
  onError,
  priority = false,
  lazy = true
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(!lazy || priority);
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver>();

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
        rootMargin: '50px' // Start loading 50px before the image comes into view
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

  // Default placeholder
  const defaultPlaceholder = (
    <div className={`flex items-center justify-center bg-gray-100 text-gray-400 ${className}`}>
      <div className="text-center">
        <div className="text-2xl mb-2">📷</div>
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
    <div className="relative">
      {isLoading && (placeholder || defaultPlaceholder)}
      
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        onLoad={handleImageLoad}
        onError={handleImageError}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        style={{ display: hasError ? 'none' : 'block' }}
      />
      
      {hasError && (placeholder || defaultPlaceholder)}
    </div>
  );
}