import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import warehouseImage from "@assets/unnamed (1)_1754134468984.webp";

interface HeroSlide {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  backgroundImage: string;
  textColor: string;
  isActive: boolean;
}

export default function SimpleHeroSlider() {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Debug the warehouse image import on first load only
  useEffect(() => {
    console.log("Warehouse image loaded successfully:", warehouseImage);
  }, []);

  // Fetch slides from backend
  const { data: slides = [] } = useQuery<HeroSlide[]>({
    queryKey: ["/api/hero-slides"],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Default slide with new warehouse image
  const defaultSlides: HeroSlide[] = [
    {
      id: 1,
      title: "Premium Organic Ingredients",
      subtitle: "Global Quality Standards",
      description: "State-of-the-art warehouse facilities ensuring freshness and quality for organic ingredients worldwide.",
      backgroundImage: warehouseImage,
      textColor: "white",
      isActive: true
    }
  ];

  // If we have slides from database, use them, otherwise use default with warehouse image
  const activeSlides = slides.length > 0 ? slides.filter(slide => slide.isActive) : defaultSlides;

  // Auto-advance slides if multiple slides exist
  useEffect(() => {
    if (activeSlides.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % activeSlides.length);
    }, 6000);

    return () => clearInterval(interval);
  }, [activeSlides.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % activeSlides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + activeSlides.length) % activeSlides.length);
  };

  if (activeSlides.length === 0) return null;

  const slide = activeSlides[currentSlide];

  return (
    <div className="relative h-screen overflow-hidden md:h-screen sm:h-[70vh] xs:h-[60vh]">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat md:bg-fixed bg-scroll"
        style={{ 
          backgroundImage: `url('${slide.backgroundImage}')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        {/* Gradient Overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-transparent"></div>
        
        {/* Bottom Fade Effect */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white via-white/80 to-transparent"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 h-full flex items-center py-8 sm:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl">
            {/* Animated Text Coming from Left and Right */}
            <div className="space-y-4 sm:space-y-6">
              {/* Title - Animate from Left */}
              <h1 
                className={`text-2xl sm:text-3xl md:text-5xl lg:text-7xl font-bold
                          ${slide.textColor === 'white' ? 'text-white' : 'text-gray-900'} 
                          transform transition-all duration-1000 ease-out
                          animate-[slideInLeft_1s_ease-out_0.2s_both] leading-tight`}
              >
                {slide.title}
              </h1>

              {/* Subtitle - Animate from Right */}
              <h2 
                className={`text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold
                          ${slide.textColor === 'white' ? 'text-blue-200' : 'text-blue-600'} 
                          transform transition-all duration-1000 ease-out
                          animate-[slideInRight_1s_ease-out_0.4s_both]`}
              >
                {slide.subtitle}
              </h2>

              {/* Description - Animate from Left with delay */}
              <p 
                className={`text-sm sm:text-base md:text-lg lg:text-xl
                          ${slide.textColor === 'white' ? 'text-gray-200' : 'text-gray-700'} 
                          max-w-3xl leading-relaxed
                          transform transition-all duration-1000 ease-out
                          animate-[slideInLeft_1s_ease-out_0.6s_both]`}
              >
                {slide.description}
              </p>

              {/* CTA Button - Fade in with delay */}
              <div className="animate-[fadeIn_1s_ease-out_0.8s_both]">
                <Button 
                  size="lg"
                  className="bg-orange-600 hover:bg-orange-700 text-white px-6 sm:px-8 py-3 
                           text-sm sm:text-base md:text-lg font-semibold
                           transform transition-all duration-300 hover:scale-105 shadow-lg"
                >
                  Explore Products
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Controls - Only show if multiple slides */}
      {activeSlides.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-3 sm:left-6 top-1/2 transform -translate-y-1/2 z-20
                     bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full p-2 sm:p-3
                     transition-all duration-300 hover:scale-110"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
          </button>

          <button
            onClick={nextSlide}
            className="absolute right-3 sm:right-6 top-1/2 transform -translate-y-1/2 z-20
                     bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full p-2 sm:p-3
                     transition-all duration-300 hover:scale-110"
            aria-label="Next slide"
          >
            <ChevronRight className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
          </button>

          {/* Slide Indicators */}
          <div className="absolute bottom-4 sm:bottom-8 left-1/2 transform -translate-x-1/2 z-20">
            <div className="flex space-x-2 sm:space-x-3">
              {activeSlides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-all duration-300 ${
                    index === currentSlide
                      ? 'bg-orange-500 scale-125'
                      : 'bg-white/50 hover:bg-white/70'
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}