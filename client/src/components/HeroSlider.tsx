import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Shield, Users, Truck, Award, Globe, Leaf } from "lucide-react";

interface SlideData {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  backgroundImage: string;
  foregroundImage: string;

  imageAlt: string;
}

const slides: SlideData[] = [
  {
    id: 1,
    title: "PREMIUM TURMERIC",
    subtitle: "95% Curcumin Excellence",
    description: "Laboratory-tested organic turmeric powder sourced from certified farms in India. Pharmaceutical grade quality for your premium products.",
    backgroundImage: "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080",
    foregroundImage: "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",

    imageAlt: "Premium organic turmeric powder with quality testing"
  },
  {
    id: 2,
    title: "ASHWAGANDHA ROOT",
    subtitle: "Adaptogenic Power",
    description: "Standardized ashwagandha extract with optimal withanolides content. Perfect for stress-relief and wellness supplement formulations.",
    backgroundImage: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080",
    foregroundImage: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",

    imageAlt: "Organic ashwagandha roots and powder processing"
  },
  {
    id: 3,
    title: "QUALITY STANDARDS",
    subtitle: "Global Certifications",
    description: "State-of-the-art facilities maintaining international quality standards. From USDA to ISO certifications, ensuring excellence.",
    backgroundImage: "https://images.unsplash.com/photo-1582750433449-648ed127bb54?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080",
    foregroundImage: "https://images.unsplash.com/photo-1582750433449-648ed127bb54?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",

    imageAlt: "Modern organic processing facility with quality control"
  },
  {
    id: 4,
    title: "GLOBAL SUPPLY",
    subtitle: "Worldwide Partnerships",
    description: "Trusted by 500+ businesses globally. Reliable supply chain ensuring consistent quality and timely delivery worldwide.",
    backgroundImage: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080",
    foregroundImage: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",

    imageAlt: "Global shipping and international business partnerships"
  }
];

export default function HeroSlider() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [scrollY, setScrollY] = useState(0);
  const sliderRef = useRef<HTMLDivElement>(null);

  // Handle scroll for parallax effect
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Auto-advance slides
  useEffect(() => {
    if (!isAutoPlaying) return;
    
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % slides.length);
    }, 6000);

    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 12000);
  };

  const nextSlide = () => {
    setCurrentSlide(prev => (prev + 1) % slides.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 12000);
  };

  const prevSlide = () => {
    setCurrentSlide(prev => (prev - 1 + slides.length) % slides.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 12000);
  };

  const currentSlideData = slides[currentSlide];

  return (
    <section 
      ref={sliderRef}
      className="relative min-h-screen overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-green-900"
    >
      {/* Background Layer - Slowest parallax */}
      <div 
        className="absolute inset-0 w-full h-full"
        style={{
          transform: `translateY(${scrollY * 0.1}px)`,
          transition: 'transform 0.1s ease-out'
        }}
      >
        <div 
          className="w-full h-full bg-cover bg-center transition-all duration-2000 ease-in-out"
          style={{
            backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.6)), url(${currentSlideData.backgroundImage})`,
            filter: 'blur(1px)'
          }}
        />
      </div>



      {/* Main Content Layer - Reduced parallax */}
      <div 
        className="relative z-10 min-h-screen flex items-center"
        style={{
          transform: `translateY(${scrollY * 0.1}px)`,
          transition: 'transform 0.1s ease-out'
        }}
      >
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Content Side */}
            <div className="space-y-8 text-white">
              <div className="space-y-4">
                <div className="overflow-hidden">
                  <h1 
                    key={`title-${currentSlide}`}
                    className="text-5xl lg:text-7xl font-bold leading-tight animate-slide-up"
                  >
                    <span className="text-white">THINK </span>
                    <span className="text-green-400">ORGANIC</span><br />
                    <span className="text-green-400">{currentSlideData.title}</span>
                  </h1>
                </div>
                <div 
                  key={`subtitle-${currentSlide}`}
                  className="bg-gradient-to-r from-green-500 to-green-400 text-white px-6 py-3 rounded-full inline-block text-lg font-medium animate-fade-in-right"
                  style={{ animationDelay: '0.3s' }}
                >
                  {currentSlideData.subtitle}
                </div>
              </div>
              
              <p 
                key={`desc-${currentSlide}`}
                className="text-gray-200 text-xl max-w-lg leading-relaxed animate-fade-in-up"
                style={{ animationDelay: '0.6s' }}
              >
                {currentSlideData.description}
              </p>
              
              <div 
                className="flex flex-wrap gap-4 animate-fade-in-up"
                style={{ animationDelay: '0.9s' }}
              >
                <Button size="lg" className="bg-green-600 hover:bg-green-700 text-white">
                  Explore Products
                </Button>
                <Button variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-gray-900">
                  Request Catalog
                </Button>
              </div>
              
              <div 
                className="flex items-center space-x-6 text-sm text-gray-300 animate-fade-in-up"
                style={{ animationDelay: '1.2s' }}
              >
                <div className="flex items-center space-x-2">
                  <Shield className="w-4 h-4 text-green-400" />
                  <span className="font-medium">USDA Organic</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Globe className="w-4 h-4 text-green-400" />
                  <span className="font-medium">Global Supply</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-green-400" />
                  <span className="font-medium">24/7 Support</span>
                </div>
              </div>
            </div>

            {/* Foreground Image Layer */}
            <div className="relative">
              <div className="relative w-full h-[600px]">
                <div 
                  key={`image-${currentSlide}`}
                  className="absolute inset-0 -right-6 overflow-hidden shadow-2xl animate-zoom-in"
                  style={{
                    clipPath: 'polygon(15% 0%, 95% 5%, 90% 95%, 0% 100%)',
                    animationDelay: '0.5s'
                  }}
                >
                  <img
                    src={currentSlideData.foregroundImage}
                    alt={currentSlideData.imageAlt}
                    className="w-full h-full object-cover"
                    style={{
                      width: '110%',
                      height: '100%',
                      objectPosition: 'center center',
                      transform: 'translateX(-5%)'
                    }}
                  />
                </div>
                
                {/* Floating overlays */}
                <div className="absolute -bottom-6 -left-6 bg-white/95 backdrop-blur-sm p-4 rounded-xl shadow-xl z-10 animate-float">
                  <div className="flex items-center space-x-3">
                    <Truck className="text-green-600 text-2xl" />
                    <div>
                      <div className="font-semibold text-gray-900">Fast Delivery</div>
                      <div className="text-sm text-gray-500">24-48 Hours</div>
                    </div>
                  </div>
                </div>
                
                <div className="absolute -top-6 -right-6 bg-gradient-to-br from-green-600 to-green-700 text-white p-6 rounded-xl shadow-xl z-10 animate-float" style={{ animationDelay: '0.5s' }}>
                  <div className="text-center">
                    <div className="text-3xl font-bold">500+</div>
                    <div className="text-sm opacity-90">Products</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Controls */}
      <button
        onClick={prevSlide}
        className="absolute left-6 top-1/2 -translate-y-1/2 bg-white/20 backdrop-blur-md hover:bg-white/30 text-white p-4 rounded-full shadow-lg transition-all duration-300 z-30 border border-white/30"
        aria-label="Previous slide"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>
      
      <button
        onClick={nextSlide}
        className="absolute right-6 top-1/2 -translate-y-1/2 bg-white/20 backdrop-blur-md hover:bg-white/30 text-white p-4 rounded-full shadow-lg transition-all duration-300 z-30 border border-white/30"
        aria-label="Next slide"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Slide Indicators */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex space-x-3 z-30">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`h-2 rounded-full transition-all duration-300 ${
              index === currentSlide 
                ? 'bg-green-400 w-12' 
                : 'bg-white/40 hover:bg-white/60 w-2'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 w-full h-1 bg-white/20">
        <div 
          className="h-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-300 ease-out"
          style={{ 
            width: `${((currentSlide + 1) / slides.length) * 100}%` 
          }}
        />
      </div>
    </section>
  );
}