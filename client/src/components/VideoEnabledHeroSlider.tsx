import { useState, useEffect } from 'react';
import { ChevronRight, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HeroSlide {
  id: number;
  title: string;
  subtitle?: string;
  mediaType: 'image' | 'video';
  imageUrl?: string;
  videoUrl?: string;
  buttonText?: string;
  buttonUrl?: string;
  isExternal?: boolean;
  sortOrder: number;
}

interface VideoEnabledHeroSliderProps {
  slides: HeroSlide[];
}

export default function VideoEnabledHeroSlider({ slides }: VideoEnabledHeroSliderProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [videoPaused, setVideoPaused] = useState(false);

  // Sort slides by order
  const sortedSlides = [...slides].sort((a, b) => a.sortOrder - b.sortOrder);
  const currentSlideData = sortedSlides[currentSlide];

  // Auto-advance carousel (pause for videos)
  useEffect(() => {
    if (sortedSlides.length <= 1) return;
    
    // Don't auto-advance if current slide is a video and it's playing
    if (currentSlideData?.mediaType === 'video' && !videoPaused) {
      return;
    }
    
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % sortedSlides.length);
    }, 5000); // 5 seconds for images, manual control for videos

    return () => clearInterval(interval);
  }, [sortedSlides.length, currentSlideData?.mediaType, videoPaused]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const handleVideoEnd = () => {
    // Auto-advance to next slide when video ends
    setCurrentSlide((prev) => (prev + 1) % sortedSlides.length);
  };

  const handleVideoPlay = () => {
    setVideoPaused(false);
  };

  const handleVideoPause = () => {
    setVideoPaused(true);
  };

  if (!sortedSlides.length) {
    return (
      <div className="relative h-[600px] bg-gradient-to-br from-green-900 via-emerald-800 to-teal-700 flex items-center justify-center">
        <div className="text-center text-white">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            Premium Organic Ingredients
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-green-100">
            Sourced globally, delivered with excellence
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-[600px] overflow-hidden">
      {/* Background Media */}
      <div className="absolute inset-0">
        {currentSlideData.mediaType === 'video' && currentSlideData.videoUrl ? (
          <video
            key={currentSlideData.id}
            className="w-full h-full object-cover"
            autoPlay
            muted
            loop
            playsInline
            onPlay={handleVideoPlay}
            onPause={handleVideoPause}
            onEnded={handleVideoEnd}
          >
            <source src={currentSlideData.videoUrl} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        ) : currentSlideData.imageUrl ? (
          <img
            src={currentSlideData.imageUrl}
            alt={currentSlideData.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-green-900 via-emerald-800 to-teal-700" />
        )}
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/40" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex items-center justify-center h-full">
        <div className="max-w-6xl mx-auto px-6 text-center text-white">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            {currentSlideData.title}
          </h1>
          
          {currentSlideData.subtitle && (
            <p className="text-xl md:text-2xl mb-8 text-gray-100 max-w-3xl mx-auto">
              {currentSlideData.subtitle}
            </p>
          )}

          {currentSlideData.buttonText && currentSlideData.buttonUrl && (
            <Button
              size="lg"
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-lg font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
              onClick={() => {
                if (currentSlideData.isExternal) {
                  window.open(currentSlideData.buttonUrl, '_blank', 'noopener,noreferrer');
                } else {
                  window.location.href = currentSlideData.buttonUrl!;
                }
              }}
            >
              {currentSlideData.buttonText}
              <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
          )}

          {/* Video indicator */}
          {currentSlideData.mediaType === 'video' && (
            <div className="absolute bottom-6 right-6 flex items-center space-x-2 text-white/80 text-sm">
              <Play className="h-4 w-4" />
              <span>Video</span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Dots */}
      {sortedSlides.length > 1 && (
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-2">
          {sortedSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentSlide
                  ? 'bg-white scale-125'
                  : 'bg-white/50 hover:bg-white/75'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Slide Counter */}
      {sortedSlides.length > 1 && (
        <div className="absolute top-6 right-6 text-white/80 text-sm font-medium">
          {currentSlide + 1} / {sortedSlides.length}
        </div>
      )}
    </div>
  );
}