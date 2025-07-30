import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { ChevronRight, Leaf, Award, Microscope, Beaker } from 'lucide-react';
import type { HeroSlider } from '@shared/schema';

export default function ParallaxHero() {
  const [scrollY, setScrollY] = useState(0);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch hero slides from backend
  const { data: heroSlides = [] } = useQuery<HeroSlider[]>({
    queryKey: ["/api/hero-slides"],
  });

  // Default slides if no backend data is available
  const defaultSlides = [
    {
      id: 1,
      title: "Premium Herbal Powders & Extracts",
      subtitle: "Certified organic Ashwagandha, Turmeric, Moringa, and 500+ botanical ingredients sourced from trusted farms across India.",
      accent: "for Nutraceuticals & Food Industries",
      theme: "herbs",
      backgroundImage: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080",
      overlayColor: "from-green-900/80 via-emerald-800/70 to-teal-700/60",
      primaryColor: "#22c55e",
      buttonText: "Explore Herbs",
      buttonLink: "/products?category=Herbal Powders",
      order: 1
    },
    {
      id: 2,
      title: "Essential Oils & Oleoresins", 
      subtitle: "Steam distilled essential oils, CO2 extracts, and concentrated oleoresins - from Peppermint to Black Pepper.",
      accent: "Pure & Potent Aromatics",
      theme: "oils",
      backgroundImage: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080",
      overlayColor: "from-amber-900/80 via-orange-800/70 to-yellow-700/60",
      primaryColor: "#f59e0b",
      buttonText: "View Essential Oils",
      buttonLink: "/products?category=Essential Oils",
      order: 2
    },
    {
      id: 3,
      title: "R&D Lab & Custom Formulations",
      subtitle: "State-of-the-art testing facilities, custom blending services, and regulatory compliance support for your product development.",
      accent: "Scientific Excellence & Innovation", 
      theme: "lab",
      backgroundImage: "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080",
      overlayColor: "from-blue-900/80 via-indigo-800/70 to-purple-700/60",
      primaryColor: "#3b82f6",
      buttonText: "Explore All Products",
      buttonLink: "/products",
      order: 3
    }
  ];

  // Map database slides to component format
  const processedHeroSlides = heroSlides.map(slide => ({
    id: slide.id,
    title: slide.title,
    subtitle: slide.subtitle,
    accent: `Bright Fame Organics`,
    theme: slide.title.includes('Essential') ? 'oils' : slide.title.includes('R&D') ? 'lab' : 'herbs',
    backgroundImage: slide.imageUrl || slide.image_url,
    overlayColor: slide.title.includes('Essential') ? 'from-amber-900/80 via-orange-800/70 to-yellow-700/60' : 
                  slide.title.includes('R&D') ? 'from-blue-900/80 via-indigo-800/70 to-purple-700/60' : 
                  'from-green-900/80 via-emerald-800/70 to-teal-700/60',
    primaryColor: slide.title.includes('Essential') ? '#f59e0b' : slide.title.includes('R&D') ? '#3b82f6' : '#22c55e',
    buttonText: slide.buttonText || slide.button_text,
    buttonLink: slide.buttonUrl || slide.button_url,
    order: slide.sortOrder || slide.sort_order || 1
  }));

  const slides = processedHeroSlides.length > 0 ? processedHeroSlides : defaultSlides;
  const currentSlideData = slides && slides.length > 0 ? slides[currentSlide] : null;

  useEffect(() => {
    if (slides && slides.length > 0) {
      const interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % slides.length);
      }, 3500); // Faster transition: 3.5 seconds instead of 5 seconds
      return () => clearInterval(interval);
    }
  }, [slides]);

  if (!currentSlideData) {
    return (
      <div className="relative h-screen overflow-hidden bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen overflow-hidden hero-full-width">
      {/* Dynamic Background Image */}
      <div 
        className="absolute inset-0 w-full h-full bg-cover bg-center transition-all duration-800 ease-in-out"
        style={{
          backgroundImage: `url(${currentSlideData.backgroundImage})`,
          transform: `scale(1.1) translateY(${scrollY * 0.3}px)`,
          width: '100%',
          height: '100%',
          left: 0,
          right: 0,
          top: 0,
          bottom: 0
        }}
      />
      
      {/* Dynamic Gradient Overlay */}
      <div className={`absolute inset-0 bg-gradient-to-br ${currentSlideData.overlayColor} transition-all duration-800`} />
      
      {/* Animated SVG Overlay */}
      <div className="absolute inset-0 w-full h-full">
        <svg 
          viewBox="0 0 1920 1080" 
          className="w-full h-full object-cover opacity-80"
          style={{
            transform: `translateY(${scrollY * 0.2}px)`,
          }}
        >
          {/* Sky Layer with Gradient */}
          <defs>
            <linearGradient id="skyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#87CEEB" stopOpacity="0.3" />
              <stop offset="50%" stopColor="#98FB98" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#F0FFF0" stopOpacity="0.1" />
            </linearGradient>
            
            <linearGradient id="labGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1e3a8a" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#064e3b" stopOpacity="0.05" />
            </linearGradient>

            <radialGradient id="glowGradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.1" />
            </radialGradient>

            {/* Molecular pattern */}
            <pattern id="moleculePattern" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
              <circle cx="20" cy="20" r="3" fill="#10b981" opacity="0.2">
                <animate attributeName="opacity" values="0.2;0.4;0.2" dur="3s" repeatCount="indefinite"/>
              </circle>
              <circle cx="80" cy="60" r="2" fill="#059669" opacity="0.3">
                <animate attributeName="opacity" values="0.3;0.5;0.3" dur="4s" repeatCount="indefinite"/>
              </circle>
              <line x1="20" y1="20" x2="80" y2="60" stroke="#065f46" strokeWidth="1" opacity="0.1"/>
            </pattern>
          </defs>

          {/* Sky Background */}
          <rect width="1920" height="1080" fill="url(#skyGradient)" />


        </svg>
      </div>
      
      {/* Content Container */}
      <div className="relative z-10 flex items-center justify-center h-full">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto text-center">
            <div className="mb-8 sm:mb-12">
              {/* Main Title */}
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-4 sm:mb-6 leading-tight">
                <span className="block transition-all duration-800">{currentSlideData.title}</span>
                {currentSlideData.accent && (
                  <span 
                    className="block text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-medium mt-2 sm:mt-4 transition-all duration-800"
                    style={{ color: currentSlideData.primaryColor }}
                  >
                    {currentSlideData.accent}
                  </span>
                )}
              </h1>
              
              {/* Subtitle */}
              <p className="text-lg sm:text-xl md:text-2xl text-white/90 mb-8 sm:mb-12 max-w-4xl mx-auto leading-relaxed transition-all duration-800">
                {currentSlideData.subtitle}
              </p>
              
              {/* Key Features */}
              <div className="flex flex-wrap justify-center gap-4 sm:gap-6 mb-8 sm:mb-12">
                <div className="flex items-center bg-white/10 backdrop-blur-sm rounded-full px-4 sm:px-6 py-2 sm:py-3">
                  <Leaf className="h-5 w-5 sm:h-6 sm:w-6 text-green-400 mr-2 sm:mr-3" />
                  <span className="text-white font-medium text-sm sm:text-base">Certified Organic</span>
                </div>
                <div className="flex items-center bg-white/10 backdrop-blur-sm rounded-full px-4 sm:px-6 py-2 sm:py-3">
                  <Award className="h-5 w-5 sm:h-6 sm:w-6 text-blue-400 mr-2 sm:mr-3" />
                  <span className="text-white font-medium text-sm sm:text-base">ISO Certified</span>
                </div>
                <div className="flex items-center bg-white/10 backdrop-blur-sm rounded-full px-4 sm:px-6 py-2 sm:py-3">
                  <Microscope className="h-5 w-5 sm:h-6 sm:w-6 text-purple-400 mr-2 sm:mr-3" />
                  <span className="text-white font-medium text-sm sm:text-base">Lab Tested</span>
                </div>
                <div className="flex items-center bg-white/10 backdrop-blur-sm rounded-full px-4 sm:px-6 py-2 sm:py-3">
                  <Beaker className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-400 mr-2 sm:mr-3" />
                  <span className="text-white font-medium text-sm sm:text-base">R&D Support</span>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 mb-8">
                {currentSlideData.buttonLink && currentSlideData.buttonText && (
                  currentSlideData.buttonLink.startsWith('#') ? (
                    <a href={currentSlideData.buttonLink}>
                      <Button 
                        size="lg" 
                        className="bg-white text-gray-900 hover:bg-gray-100 font-semibold px-8 py-3 text-lg transition-all duration-300 transform hover:scale-105"
                        style={{
                          boxShadow: `0 10px 30px ${currentSlideData.primaryColor}40`,
                        }}
                      >
                        {currentSlideData.buttonText}
                        <ChevronRight className="ml-2 h-5 w-5" />
                      </Button>
                    </a>
                  ) : (
                    <Link href={currentSlideData.buttonLink}>
                      <Button 
                        size="lg" 
                        className="bg-white text-gray-900 hover:bg-gray-100 font-semibold px-8 py-3 text-lg transition-all duration-300 transform hover:scale-105"
                        style={{
                          boxShadow: `0 10px 30px ${currentSlideData.primaryColor}40`,
                        }}
                      >
                        {currentSlideData.buttonText}
                        <ChevronRight className="ml-2 h-5 w-5" />
                      </Button>
                    </Link>
                  )
                )}
                
                <Link href="/products">
                  <Button 
                    variant="outline" 
                    size="lg" 
                    className="border-white bg-white/10 text-white hover:bg-white hover:text-gray-900 backdrop-blur-sm font-semibold px-8 py-3 text-lg transition-all duration-300 shadow-lg"
                  >
                    Explore All Products
                  </Button>
                </Link>
              </div>


            </div>
          </div>
        </div>
      </div>

      {/* Slide Indicators */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-2 z-20">
        {slides.map((_, index) => (
          <button
            key={index}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              index === currentSlide 
                ? 'bg-white scale-125' 
                : 'bg-white/50 hover:bg-white/70'
            }`}
            onClick={() => setCurrentSlide(index)}
          />
        ))}
      </div>

      {/* Bottom Dissolving Effect */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white via-white/60 to-transparent z-10 pointer-events-none"></div>
    </div>
  );
}