import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Shield, Users, Truck, Star, Award, Globe } from "lucide-react";

interface SlideData {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  imageAlt: string;
  features: Array<{
    icon: any;
    text: string;
  }>;
  ctaText: string;
  ctaSecondary: string;
}

const slides: SlideData[] = [
  {
    id: 1,
    title: "PREMIUM ORGANIC TURMERIC",
    subtitle: "Laboratory Tested • 95% Curcumin Content",
    description: "Sourced directly from certified organic farms in India. Our premium turmeric powder undergoes rigorous quality testing to ensure highest curcumin content for pharmaceutical and nutraceutical applications.",
    image: "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=800",
    imageAlt: "Premium organic turmeric powder with quality testing equipment",
    features: [
      { icon: Award, text: "USDA Organic" },
      { icon: Shield, text: "95% Curcumin" },
      { icon: Users, text: "Pharma Grade" }
    ],
    ctaText: "View Turmeric Products",
    ctaSecondary: "Request COA"
  },
  {
    id: 2,
    title: "ASHWAGANDHA ROOT EXTRACT",
    subtitle: "Adaptogenic Excellence • Standardized Withanolides",
    description: "Premium ashwagandha from Rajasthan's finest organic farms. Standardized to contain optimal withanolides levels, perfect for stress-relief supplements and wellness products.",
    image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=800",
    imageAlt: "Organic ashwagandha roots and powder with traditional processing",
    features: [
      { icon: Shield, text: "5% Withanolides" },
      { icon: Award, text: "India Organic" },
      { icon: Globe, text: "Export Quality" }
    ],
    ctaText: "Explore Ashwagandha",
    ctaSecondary: "Download Specs"
  },
  {
    id: 3,
    title: "GLOBAL QUALITY STANDARDS",
    subtitle: "International Certifications • Trusted Worldwide",
    description: "Our state-of-the-art facilities maintain the highest international standards. From USDA Organic to ISO certifications, we ensure every batch meets global quality requirements.",
    image: "https://images.unsplash.com/photo-1582750433449-648ed127bb54?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=800",
    imageAlt: "Modern organic processing facility with quality control laboratory",
    features: [
      { icon: Award, text: "ISO 9001:2015" },
      { icon: Shield, text: "HACCP Certified" },
      { icon: Star, text: "GMP Compliant" }
    ],
    ctaText: "View Certifications",
    ctaSecondary: "Facility Tour"
  },
  {
    id: 4,
    title: "TRUSTED BY 500+ BUSINESSES",
    subtitle: "Global Supply Chain • Reliable Partnership",
    description: "From small startups to Fortune 500 companies, businesses worldwide trust Bright Fame Organic for consistent quality, reliable supply, and exceptional service in organic ingredients.",
    image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=800",
    imageAlt: "Global shipping containers and international business partnerships",
    features: [
      { icon: Truck, text: "Fast Delivery" },
      { icon: Users, text: "24/7 Support" },
      { icon: Globe, text: "Worldwide Supply" }
    ],
    ctaText: "Partner With Us",
    ctaSecondary: "Success Stories"
  }
];

export default function HeroSlider() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

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
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const nextSlide = () => {
    setCurrentSlide(prev => (prev + 1) % slides.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const prevSlide = () => {
    setCurrentSlide(prev => (prev - 1 + slides.length) % slides.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const slide = slides[currentSlide];

  return (
    <section className="relative bg-gradient-to-r from-green-50 to-white py-16 lg:py-24 overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center min-h-[600px]">
          {/* Content Side */}
          <div className="space-y-6 z-10">
            <div className="space-y-4">
              <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 leading-tight">
                {slide.title.split(' ').map((word, i) => (
                  <span key={i} className={word === 'ORGANIC' || word === 'TURMERIC' || word === 'ASHWAGANDHA' || word === 'QUALITY' || word === 'TRUSTED' ? 'text-green-600' : ''}>
                    {word}{' '}
                  </span>
                ))}
              </h1>
              <div className="bg-green-600 text-white px-6 py-3 rounded-full inline-block text-lg font-medium">
                {slide.subtitle}
              </div>
            </div>
            
            <p className="text-gray-600 text-lg max-w-lg leading-relaxed">
              {slide.description}
            </p>
            
            <div className="flex flex-wrap gap-4">
              <Button size="lg" className="bg-green-600 hover:bg-green-700">
                {slide.ctaText}
              </Button>
              <Button variant="outline" size="lg">
                {slide.ctaSecondary}
              </Button>
            </div>
            
            <div className="flex items-center space-x-6 text-sm text-gray-600">
              {slide.features.map((feature, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <feature.icon className="w-4 h-4 text-green-500" />
                  <span className="font-medium">{feature.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Image Side */}
          <div className="relative">
            <div className="relative overflow-hidden rounded-2xl shadow-2xl">
              <img
                src={slide.image}
                alt={slide.imageAlt}
                className="w-full h-[500px] object-cover transition-transform duration-700 hover:scale-105"
              />
              
              {/* Image Overlays */}
              <div className="absolute -bottom-4 -left-4 bg-white p-4 rounded-xl shadow-lg">
                <div className="flex items-center space-x-2">
                  <Truck className="text-green-600 text-2xl" />
                  <div>
                    <div className="font-semibold text-gray-900">Fast Delivery</div>
                    <div className="text-sm text-gray-500">24-48 Hours</div>
                  </div>
                </div>
              </div>
              
              <div className="absolute -top-4 -right-4 bg-green-600 text-white p-4 rounded-xl shadow-lg">
                <div className="text-center">
                  <div className="text-2xl font-bold">500+</div>
                  <div className="text-sm">Products</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Controls */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 p-3 rounded-full shadow-lg transition-all duration-200 z-20"
        aria-label="Previous slide"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>
      
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 p-3 rounded-full shadow-lg transition-all duration-200 z-20"
        aria-label="Next slide"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Slide Indicators */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex space-x-2 z-20">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-3 h-3 rounded-full transition-all duration-200 ${
              index === currentSlide 
                ? 'bg-green-600 w-8' 
                : 'bg-white/60 hover:bg-white/80'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 w-full h-1 bg-green-100">
        <div 
          className="h-full bg-green-600 transition-all duration-100 ease-linear"
          style={{ 
            width: `${((currentSlide + 1) / slides.length) * 100}%` 
          }}
        />
      </div>
    </section>
  );
}