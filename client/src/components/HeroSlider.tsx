import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Shield, Users, Truck } from "lucide-react";

interface ImageData {
  id: number;
  image: string;
  imageAlt: string;
}

const images: ImageData[] = [
  {
    id: 1,
    image: "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=800",
    imageAlt: "Premium organic turmeric powder with quality testing equipment"
  },
  {
    id: 2,
    image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=800",
    imageAlt: "Organic ashwagandha roots and powder with traditional processing"
  },
  {
    id: 3,
    image: "https://images.unsplash.com/photo-1582750433449-648ed127bb54?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=800",
    imageAlt: "Modern organic processing facility with quality control laboratory"
  },
  {
    id: 4,
    image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=800",
    imageAlt: "Global shipping containers and international business partnerships"
  }
];

export default function HeroSlider() {
  const [currentImage, setCurrentImage] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Auto-advance images
  useEffect(() => {
    if (!isAutoPlaying) return;
    
    const interval = setInterval(() => {
      setCurrentImage(prev => (prev + 1) % images.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const goToImage = (index: number) => {
    setCurrentImage(index);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const nextImage = () => {
    setCurrentImage(prev => (prev + 1) % images.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const prevImage = () => {
    setCurrentImage(prev => (prev - 1 + images.length) % images.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const currentImageData = images[currentImage];

  return (
    <section className="relative bg-gradient-to-r from-green-50 to-white py-8 lg:py-12 overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center min-h-[600px]">
          {/* Static Content Side */}
          <div className="space-y-6 z-10">
            <div className="space-y-4">
              <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 leading-tight">
                THINK ORGANIC<br />
                THINK <span className="text-green-600">BRIGHT FAME</span>
              </h1>
              <div className="bg-green-600 text-white px-6 py-3 rounded-full inline-block text-lg font-medium">
                Premium B2B Organic Ingredients
              </div>
            </div>
            
            <p className="text-gray-600 text-lg max-w-lg leading-relaxed">
              Your trusted partner for certified organic ingredients. From sourcing to delivery, 
              we ensure the highest quality standards for your business needs.
            </p>
            
            <div className="flex flex-wrap gap-4">
              <Button size="lg" className="bg-green-600 hover:bg-green-700">
                Explore Products
              </Button>
              <Button variant="outline" size="lg">
                Request Catalog
              </Button>
            </div>
            
            <div className="flex items-center space-x-6 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <Shield className="w-4 h-4 text-green-500" />
                <span className="font-medium">USDA Organic</span>
              </div>
              <div className="flex items-center space-x-2">
                <Shield className="w-4 h-4 text-green-500" />
                <span className="font-medium">ISO Certified</span>
              </div>
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-green-500" />
                <span className="font-medium">24/7 Support</span>
              </div>
            </div>
          </div>

          {/* Image Slider Side */}
          <div className="relative">
            {/* Trapezoid with Curved Extension */}
            <div className="relative w-full h-[500px]">
              {/* Extended image container covering both trapezoid and curved extension */}
              <div 
                className="absolute inset-0 -right-6 overflow-hidden shadow-2xl"
                style={{
                  clipPath: 'polygon(15% 0%, 95% 5%, 90% 95%, 0% 100%)'
                }}
              >
                <img
                  src={currentImageData.image}
                  alt={currentImageData.imageAlt}
                  className="w-full h-full object-cover transition-all duration-1000 ease-in-out"
                  style={{
                    width: '110%',
                    height: '100%',
                    objectPosition: 'center center',
                    transform: 'translateX(-5%)'
                  }}
                />
              </div>
              
              {/* Image Overlays */}
              <div className="absolute -bottom-4 -left-4 bg-white p-4 rounded-xl shadow-lg z-10">
                <div className="flex items-center space-x-2">
                  <Truck className="text-green-600 text-2xl" />
                  <div>
                    <div className="font-semibold text-gray-900">Fast Delivery</div>
                    <div className="text-sm text-gray-500">24-48 Hours</div>
                  </div>
                </div>
              </div>
              
              <div className="absolute -top-4 -right-4 bg-green-600 text-white p-4 rounded-xl shadow-lg z-10">
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
        onClick={prevImage}
        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 p-3 rounded-full shadow-lg transition-all duration-200 z-20"
        aria-label="Previous image"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>
      
      <button
        onClick={nextImage}
        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 p-3 rounded-full shadow-lg transition-all duration-200 z-20"
        aria-label="Next image"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Image Indicators */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex space-x-2 z-20">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => goToImage(index)}
            className={`w-3 h-3 rounded-full transition-all duration-200 ${
              index === currentImage 
                ? 'bg-green-600 w-8' 
                : 'bg-white/60 hover:bg-white/80'
            }`}
            aria-label={`Go to image ${index + 1}`}
          />
        ))}
      </div>

      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 w-full h-1 bg-green-100">
        <div 
          className="h-full bg-green-600 transition-all duration-100 ease-linear"
          style={{ 
            width: `${((currentImage + 1) / images.length) * 100}%` 
          }}
        />
      </div>
    </section>
  );
}