import { useEffect } from 'react';

interface ImagePreloaderProps {
  imageUrls: string[];
  priority?: boolean;
}

export default function ImagePreloader({ imageUrls, priority = false }: ImagePreloaderProps) {
  useEffect(() => {
    if (!imageUrls || imageUrls.length === 0) return;

    // Preload images
    imageUrls.forEach((url, index) => {
      if (url) {
        const img = new Image();
        img.src = url;
        
        // For priority images, add them to the document head as well
        if (priority && index < 3) { // Only preload first 3 images
          const linkElement = document.createElement('link');
          linkElement.rel = 'preload';
          linkElement.as = 'image';
          linkElement.href = url;
          document.head.appendChild(linkElement);
        }
      }
    });
  }, [imageUrls, priority]);

  return null; // This component doesn't render anything
}