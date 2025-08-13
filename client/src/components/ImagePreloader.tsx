import { useEffect } from 'react';

interface ImagePreloaderProps {
  images: string[];
  priority?: boolean;
}

export default function ImagePreloader({ images, priority = false }: ImagePreloaderProps) {
  useEffect(() => {
    if (!images.length) return;

    // Preload critical images immediately
    const preloadImages = async () => {
      const promises = images.map((src) => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          
          // Set loading attribute for performance
          if ('loading' in img) {
            img.loading = priority ? 'eager' : 'lazy';
          }
          
          // Set decoding for better performance
          if ('decoding' in img) {
            img.decoding = 'async';
          }
          
          img.onload = () => resolve(img);
          img.onerror = reject;
          
          // Add optimization parameters for external URLs
          if (src.startsWith('http')) {
            const url = new URL(src);
            url.searchParams.set('f', 'webp');
            url.searchParams.set('q', '85');
            url.searchParams.set('w', '1920');
            img.src = url.toString();
          } else {
            img.src = src;
          }
        });
      });

      try {
        await Promise.allSettled(promises);
        console.log(`✅ Preloaded ${images.length} images`);
      } catch (error) {
        console.warn('Some images failed to preload:', error);
      }
    };

    if (priority) {
      // Preload immediately for critical images
      preloadImages();
    } else {
      // Defer preloading for non-critical images
      const timer = setTimeout(preloadImages, 100);
      return () => clearTimeout(timer);
    }
  }, [images, priority]);

  return null; // This component doesn't render anything
}