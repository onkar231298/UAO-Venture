import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageWebPProps {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
  fallbackSrc?: string;
  onLoad?: () => void;
  onError?: () => void;
  sizes?: string;
  quality?: number;
}

/**
 * Enhanced OptimizedImage component with WebP dual-bucket support
 * 
 * Features:
 * - Automatic WebP serving from dedicated WebP bucket
 * - Fallback to original image if WebP fails
 * - Smart lazy loading with intersection observer
 * - Progressive loading with placeholder effects
 * - Error handling and retry logic
 * - Performance optimization for hero images
 */
export function OptimizedImageWebP({
  src,
  alt,
  className,
  priority = false,
  fallbackSrc,
  onLoad,
  onError,
  sizes,
  quality = 85
}: OptimizedImageWebPProps) {
  const [imageSrc, setImageSrc] = useState<string>('');
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [webpSupported, setWebpSupported] = useState<boolean | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [isInView, setIsInView] = useState(priority);

  // Check WebP support
  useEffect(() => {
    const checkWebPSupport = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      const webpData = canvas.toDataURL('image/webp');
      setWebpSupported(webpData.indexOf('image/webp') === 5);
    };

    checkWebPSupport();
  }, []);

  // Get WebP URL for S3 images and local assets
  const getWebPUrl = (originalUrl: string): string => {
    try {
      // Check if it's an S3 URL from any of our buckets
      if (originalUrl.includes('bfi-original-images.s3') || originalUrl.includes('brightfameimages.s3')) {
        // Extract the filename (last part of the path)
        const urlParts = originalUrl.split('/');
        const filename = urlParts[urlParts.length - 1];
        const webpFilename = filename.replace(/\.[^/.]+$/, '.webp');
        
        // Return WebP bucket URL
        return `https://webpimagesbfo.s3.eu-north-1.amazonaws.com/${webpFilename}`;
      }
      
      // Handle local assets - check if WebP version exists
      if (originalUrl.includes('/attached_assets/') || originalUrl.startsWith('/@fs/')) {
        // For local development assets, try WebP version first
        const webpUrl = originalUrl.replace(/\.(jpg|jpeg|png)$/i, '.webp');
        return webpUrl;
      }
      
      // For external URLs like Unsplash
      if (originalUrl.includes('unsplash.com')) {
        return originalUrl.includes('?') 
          ? `${originalUrl}&fm=webp&q=${quality}`
          : `${originalUrl}?fm=webp&q=${quality}`;
      }
      
      return originalUrl;
    } catch {
      return originalUrl;
    }
  };

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority || !imgRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px'
      }
    );

    observer.observe(imgRef.current);
    return () => observer.disconnect();
  }, [priority]);

  // Set image source when in view and WebP support is determined
  useEffect(() => {
    if (!isInView || webpSupported === null) return;

    const webpUrl = webpSupported ? getWebPUrl(src) : src;
    console.log(`Loading image - WebP supported: ${webpSupported}, Original: ${src}, WebP URL: ${webpUrl}`);
    setImageSrc(webpUrl);
  }, [isInView, webpSupported, src, quality]);

  // Handle image load
  const handleLoad = () => {
    setIsLoaded(true);
    setIsError(false);
    onLoad?.();
  };

  // Handle image error with fallback logic
  const handleError = () => {
    if (webpSupported && imageSrc !== src) {
      // Try original image if WebP failed
      console.log(`WebP failed for ${imageSrc}, falling back to original: ${src}`);
      setImageSrc(src);
      return;
    }
    
    if (fallbackSrc && imageSrc !== fallbackSrc) {
      // Try fallback image
      setImageSrc(fallbackSrc);
      return;
    }
    
    // All attempts failed
    setIsError(true);
    onError?.();
  };

  // Show placeholder while loading
  if (!isInView && !priority) {
    return (
      <div 
        ref={imgRef}
        className={cn(
          "bg-gradient-to-br from-gray-100 to-gray-200 animate-pulse",
          "flex items-center justify-center text-gray-400",
          className
        )}
        aria-label={`Loading ${alt}`}
      >
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
        </svg>
      </div>
    );
  }

  // Show error state
  if (isError) {
    return (
      <div 
        className={cn(
          "bg-gray-200 flex items-center justify-center text-gray-500",
          className
        )}
        aria-label={`Failed to load ${alt}`}
      >
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      </div>
    );
  }

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {/* Loading placeholder */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 animate-pulse flex items-center justify-center">
          <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
          </svg>
        </div>
      )}
      
      {/* Actual image */}
      {imageSrc && (
        <img
          ref={imgRef}
          src={imageSrc}
          alt={alt}
          className={cn(
            "w-full h-full object-cover transition-opacity duration-300",
            isLoaded ? "opacity-100" : "opacity-0",
            className
          )}
          onLoad={handleLoad}
          onError={handleError}
          loading={priority ? "eager" : "lazy"}
          sizes={sizes}
          decoding={priority ? "sync" : "async"}
        />
      )}
      
      {/* WebP indicator for development */}
      {process.env.NODE_ENV === 'development' && isLoaded && webpSupported && imageSrc.includes('.webp') && (
        <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
          WebP
        </div>
      )}
    </div>
  );
}