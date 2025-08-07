import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import ProductCard from "@/components/ProductCard";
import type { Product } from "@shared/schema";

interface ProductSliderProps {
  products: Product[];
  title: string;
  autoSlide?: boolean;
  slideDirection?: "left" | "right";
  className?: string;
}

export default function ProductSlider({ 
  products, 
  title, 
  autoSlide = true, 
  slideDirection = "right",
  className = "" 
}: ProductSliderProps) {
  // Start from the end for right-to-left effect
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovering, setIsHovering] = useState(false);

  // Responsive items per view
  const getItemsPerView = () => {
    if (typeof window === 'undefined') return 4;
    if (window.innerWidth < 640) return 1; // mobile
    if (window.innerWidth < 768) return 2; // tablet
    if (window.innerWidth < 1024) return 3; // small desktop
    return 4; // large desktop
  };

  const [itemsPerView, setItemsPerView] = useState(getItemsPerView);

  useEffect(() => {
    const handleResize = () => setItemsPerView(getItemsPerView());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const maxIndex = Math.max(0, products.length - itemsPerView);

  // Auto slide functionality - right to left animation
  useEffect(() => {
    if (!autoSlide || isHovering || products.length <= itemsPerView) return;

    const interval = setInterval(() => {
      setCurrentIndex(prev => {
        // Always slide from right to left
        return prev >= maxIndex ? 0 : prev + 1;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [autoSlide, isHovering, maxIndex, products.length, itemsPerView]);

  const slideNext = () => {
    setCurrentIndex(prev => Math.min(prev + 1, maxIndex));
  };

  const slidePrev = () => {
    setCurrentIndex(prev => Math.max(prev - 1, 0));
  };

  if (!products.length) return null;

  return (
    <div 
      className={`relative ${className}`}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">{title}</h2>
        
        {/* Navigation buttons */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={slidePrev}
            disabled={currentIndex === 0}
            className="p-2"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={slideNext}
            disabled={currentIndex >= maxIndex}
            className="p-2"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Slider container */}
      <div className="overflow-hidden">
        <div 
          className="flex transition-transform duration-500 ease-in-out gap-4 sm:gap-6"
          style={{ 
            transform: `translateX(-${currentIndex * (100 / itemsPerView)}%)`,
            width: `${(products.length / itemsPerView) * 100}%`
          }}
        >
          {products.map((product, index) => (
            <div 
              key={product.id} 
              className="flex-shrink-0"
              style={{ width: `${100 / products.length}%` }}
            >
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </div>

      {/* Dots indicator */}
      <div className="flex justify-center mt-6 gap-2">
        {Array.from({ length: maxIndex + 1 }).map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-2 h-2 rounded-full transition-colors ${
              index === currentIndex ? 'bg-green-600' : 'bg-gray-300'
            }`}
          />
        ))}
      </div>
    </div>
  );
}