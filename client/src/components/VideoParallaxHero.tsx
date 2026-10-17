import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';
import type { HeroSlider } from '@shared/schema';

export default function VideoParallaxHero() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch hero slides from backend
  const { data: heroSlides = [], isLoading } = useQuery<HeroSlider[]>({
    queryKey: ["/api/hero-slides"],
  });

  // Get the first active slide (your video)
  const activeSlide = heroSlides.find(slide => slide.status === 'active') || heroSlides[0];

  if (isLoading) {
    return (
      <div className="relative h-screen overflow-hidden bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!activeSlide) {
    return (
      <div className="relative h-screen overflow-hidden bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">No hero content available</div>
      </div>
    );
  }

  return (
    <div className="relative h-screen overflow-hidden">
      {/* Video Background */}
      {activeSlide.mediaType === 'video' && activeSlide.videoUrl ? (
        <video
          className="absolute inset-0 w-full h-full object-cover"
          style={{
            transform: `scale(1.1) translateY(${scrollY * 0.3}px)`,
          }}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
        >
          <source src={activeSlide.videoUrl} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      ) : activeSlide.imageUrl ? (
        <div 
          className="absolute inset-0 w-full h-full bg-cover bg-center"
          style={{
            backgroundImage: `url(${activeSlide.imageUrl})`,
            transform: `scale(1.1) translateY(${scrollY * 0.3}px)`,
          }}
        />
      ) : null}
      
      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-900/80 via-emerald-800/70 to-teal-700/60" />
      
      {/* Content Container */}
      <div className="relative z-10 flex items-center justify-center h-full">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto text-center">
            <div className="mb-8 sm:mb-12">
              {/* Main Title */}
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-4 sm:mb-6 leading-tight">
                <span className="block">{activeSlide.title}</span>
                <span className="block text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-medium mt-2 sm:mt-4 text-green-400">
                  Atlas Ingredients
                </span>
              </h1>
              
              {/* Subtitle */}
              <p className="text-lg sm:text-xl md:text-2xl text-white/90 mb-8 sm:mb-12 max-w-4xl mx-auto leading-relaxed">
                {activeSlide.subtitle}
              </p>
              
              {/* CTA Button */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
                <Link to={activeSlide.buttonUrl || '/products'}>
                  <Button 
                    size="lg" 
                    className="bg-green-600 hover:bg-green-700 text-white font-semibold px-8 py-4 text-lg rounded-full transition-all duration-300 transform hover:scale-105 hover:shadow-2xl group"
                  >
                    {activeSlide.buttonText || 'Explore Products'}
                    <ChevronRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10">
        <div className="flex flex-col items-center text-white/70">
          <span className="text-sm mb-2">Scroll to explore</span>
          <div className="w-px h-8 bg-white/30">
            <div 
              className="w-px bg-white/70 transition-all duration-1000"
              style={{
                height: `${Math.min(scrollY / 10, 32)}px`,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}