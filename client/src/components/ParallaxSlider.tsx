import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SlideData {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  backgroundImage: string;
  overlayImage?: string;
  cloudImage?: string;
  category: string;
  cta: {
    text: string;
    link: string;
  };
  theme: 'light' | 'dark';
}

const slidesData: SlideData[] = [
  {
    id: 1,
    title: "Premium Organic Spices",
    subtitle: "From Nature to Your Kitchen",
    description: "Discover our collection of ethically sourced, organic spices that bring authentic flavors to your culinary creations. Hand-picked from sustainable farms across the globe.",
    backgroundImage: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&h=1000",
    cloudImage: "https://images.unsplash.com/photo-1557804506-669a67965ba0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
    overlayImage: "https://images.unsplash.com/photo-1585297099574-9e40573b7f8a?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=600",
    category: "Essential Oils",
    cta: { text: "Explore Spices", link: "/products?category=spices" },
    theme: 'light'
  },
  {
    id: 2,
    title: "State-of-the-Art Processing",
    subtitle: "Advanced Manufacturing Excellence",
    description: "Our modern facilities utilize cutting-edge technology to ensure the highest quality standards in organic ingredient processing, maintaining purity and potency.",
    backgroundImage: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&h=1000",
    overlayImage: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=600",
    category: "Extracts & Powders",
    cta: { text: "View Manufacturing", link: "/about/manufacturing" },
    theme: 'dark'
  },
  {
    id: 3,
    title: "Laboratory Excellence",
    subtitle: "Scientific Precision & Quality Control",
    description: "Our certified laboratories ensure every batch meets international standards through rigorous testing and quality assurance protocols.",
    backgroundImage: "https://images.unsplash.com/photo-1582719471384-894fbb16e074?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&h=1000",
    overlayImage: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=600",
    cloudImage: "https://images.unsplash.com/photo-1628595351029-c2bf17511435?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
    category: "Herbs & Botanicals",
    cta: { text: "Quality Standards", link: "/quality" },
    theme: 'light'
  },
  {
    id: 4,
    title: "Botanical Extracts",
    subtitle: "Nature's Finest Concentrates",
    description: "Premium botanical extracts processed with precision to preserve bioactive compounds and deliver maximum therapeutic potential for your formulations.",
    backgroundImage: "https://images.unsplash.com/photo-1576086213369-97a306d36557?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&h=1000",
    cloudImage: "https://images.unsplash.com/photo-1574263867128-3d3b8de77ebc?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
    overlayImage: "https://images.unsplash.com/photo-1615485500704-8e990f9900f7?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=600",
    category: "Essential Oils",
    cta: { text: "Browse Extracts", link: "/products?category=extracts" },
    theme: 'dark'
  }
];

export default function ParallaxSlider() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const progressRef = useRef<NodeJS.Timeout | null>(null);
  const sliderRef = useRef<HTMLDivElement>(null);

  const slideInterval = 6000; // 6 seconds per slide
  const progressInterval = 50; // Update progress every 50ms

  useEffect(() => {
    if (isPlaying) {
      startAutoPlay();
    } else {
      stopAutoPlay();
    }

    return () => {
      stopAutoPlay();
    };
  }, [isPlaying, currentSlide]);

  const startAutoPlay = () => {
    stopAutoPlay();
    setProgress(0);

    progressRef.current = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          nextSlide();
          return 0;
        }
        return prev + (100 / (slideInterval / progressInterval));
      });
    }, progressInterval);
  };

  const stopAutoPlay = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (progressRef.current) {
      clearInterval(progressRef.current);
      progressRef.current = null;
    }
  };

  const nextSlide = () => {
    setCurrentSlide(prev => (prev + 1) % slidesData.length);
    setProgress(0);
  };

  const prevSlide = () => {
    setCurrentSlide(prev => (prev - 1 + slidesData.length) % slidesData.length);
    setProgress(0);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    setProgress(0);
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const currentSlideData = slidesData[currentSlide];

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Background Images with Parallax Effect */}
      <div className="absolute inset-0">
        {slidesData.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-all duration-1000 ease-out ${
              index === currentSlide ? 'opacity-100 scale-100' : 'opacity-0 scale-110'
            }`}
            style={{
              transform: `translateX(${(index - currentSlide) * 5}px) translateZ(0)`,
            }}
          >
            <div
              className="absolute inset-0 bg-cover bg-center bg-no-repeat"
              style={{
                backgroundImage: `url(${slide.backgroundImage})`,
                transform: `translateX(${(index - currentSlide) * -20}px) scale(1.1)`,
              }}
            />
            <div className="absolute inset-0 bg-black/30" />
          </div>
        ))}
      </div>

      {/* Cloud/Overlay Images with 3D Parallax */}
      {currentSlideData.cloudImage && (
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute top-1/4 right-1/4 w-96 h-48 opacity-60 transition-all duration-1000 ease-out"
            style={{
              transform: `translateX(${progress * 2}px) translateY(${Math.sin(progress / 10) * 10}px) rotateX(15deg)`,
              backgroundImage: `url(${currentSlideData.cloudImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: 'blur(1px)',
            }}
          />
        </div>
      )}

      {/* Floating Product/Equipment Images */}
      {currentSlideData.overlayImage && (
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute bottom-1/4 right-1/6 w-80 h-80 transition-all duration-1000 ease-out"
            style={{
              transform: `translateY(${Math.sin(progress / 20) * 15}px) rotateY(${progress / 10}deg) perspective(1000px)`,
              backgroundImage: `url(${currentSlideData.overlayImage})`,
              backgroundSize: 'contain',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'center',
              filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.3))',
            }}
          />
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 h-full flex items-center">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <div
              className={`transition-all duration-1000 ease-out transform ${
                currentSlideData.theme === 'light' ? 'text-white' : 'text-white'
              }`}
              style={{
                transform: `translateX(${progress * 0.5}px) translateY(${Math.sin(progress / 30) * 5}px)`,
              }}
            >
              {/* Category Badge */}
              <div className="mb-4">
                <span className="inline-block px-4 py-2 bg-green-600/90 text-white text-sm font-medium rounded-full backdrop-blur-sm">
                  {currentSlideData.category}
                </span>
              </div>

              {/* Subtitle */}
              <h3 className="text-lg sm:text-xl font-medium mb-2 opacity-90">
                {currentSlideData.subtitle}
              </h3>

              {/* Main Title */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                {currentSlideData.title}
              </h1>

              {/* Description */}
              <p className="text-lg sm:text-xl mb-8 opacity-90 leading-relaxed">
                {currentSlideData.description}
              </p>

              {/* CTA Button */}
              <Button
                size="lg"
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-lg font-medium transition-all duration-300 transform hover:scale-105"
                onClick={() => window.location.href = currentSlideData.cta.link}
              >
                {currentSlideData.cta.text}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20">
        <div className="flex items-center space-x-4 bg-black/20 backdrop-blur-md rounded-full px-6 py-3">
          {/* Previous Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={prevSlide}
            className="text-white hover:bg-white/20 p-2 rounded-full"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>

          {/* Slide Indicators */}
          <div className="flex space-x-2">
            {slidesData.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === currentSlide ? 'bg-white scale-125' : 'bg-white/50 hover:bg-white/70'
                }`}
              />
            ))}
          </div>

          {/* Play/Pause Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={togglePlayPause}
            className="text-white hover:bg-white/20 p-2 rounded-full"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </Button>

          {/* Next Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={nextSlide}
            className="text-white hover:bg-white/20 p-2 rounded-full"
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 w-full h-1 bg-white/20 z-20">
        <div
          className="h-full bg-green-500 transition-all duration-100 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Slide Counter */}
      <div className="absolute top-8 right-8 z-20 text-white/80 text-sm font-medium">
        {currentSlide + 1} / {slidesData.length}
      </div>
    </div>
  );
}