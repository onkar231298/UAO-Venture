import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, ChevronRight, ChevronLeft } from "lucide-react";
import OptimizedImage from "@/components/OptimizedImage";

interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string | null;
  isActive: boolean;
}

export default function CategoriesSection() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [, navigate] = useLocation();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/categories')
      .then(response => response.json())
      .then(data => {
        // Filter only active categories
        const activeCategories = data.filter((cat: Category) => cat.isActive);
        setCategories(activeCategories);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching categories:', error);
        setLoading(false);
      });
  }, []);

  const handleCategoryClick = (slug: string) => {
    navigate(`/products?category=${slug}`);
  };

  // Scroll navigation functions
  const scrollNext = () => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const cardWidth = container.children[0]?.getBoundingClientRect().width || 280;
      const gap = 16; // 1rem gap in pixels
      
      // On mobile: scroll 1 card, on desktop: scroll 3 cards
      const isMobile = window.innerWidth < 768;
      const scrollAmount = isMobile ? (cardWidth + gap) : (cardWidth + gap) * 3;
      
      container.scrollBy({
        left: scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const scrollPrev = () => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const cardWidth = container.children[0]?.getBoundingClientRect().width || 280;
      const gap = 16; // 1rem gap in pixels
      
      // On mobile: scroll 1 card, on desktop: scroll 3 cards
      const isMobile = window.innerWidth < 768;
      const scrollAmount = isMobile ? (cardWidth + gap) : (cardWidth + gap) * 3;
      
      container.scrollBy({
        left: -scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  // Check if scroll buttons should be visible
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScrollButtons = () => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      setCanScrollLeft(container.scrollLeft > 0);
      setCanScrollRight(
        container.scrollLeft < container.scrollWidth - container.clientWidth - 1
      );
    }
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScrollButtons);
      // Initial check
      setTimeout(checkScrollButtons, 100);
      
      return () => container.removeEventListener('scroll', checkScrollButtons);
    }
  }, [categories]);

  if (loading) {
    return (
      <div className="py-8">
        <div className="flex gap-4 sm:gap-6 overflow-x-auto scrollbar-hide">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bg-white rounded-lg h-48 w-[240px] sm:w-[280px] flex-none animate-pulse shadow-sm" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="relative max-w-7xl mx-auto">
        {/* Navigation Arrows - Hidden on mobile */}
        {canScrollLeft && (
          <button 
            className="hidden md:flex absolute left-2 lg:left-4 top-1/2 transform -translate-y-1/2 bg-white border-2 border-green-600 rounded-full w-12 h-12 lg:w-14 lg:h-14 items-center justify-center shadow-lg hover:bg-green-50 transition-all duration-200 z-10"
            onClick={scrollPrev}
            aria-label="Previous categories"
          >
            <ChevronLeft className="w-5 h-5 lg:w-6 lg:h-6 text-green-600" />
          </button>
        )}
        
        {canScrollRight && (
          <button 
            className="hidden md:flex absolute right-2 lg:right-4 top-1/2 transform -translate-y-1/2 bg-white border-2 border-green-600 rounded-full w-12 h-12 lg:w-14 lg:h-14 items-center justify-center shadow-lg hover:bg-green-50 transition-all duration-200 z-10"
            onClick={scrollNext}
            aria-label="Next categories"
          >
            <ChevronRight className="w-5 h-5 lg:w-6 lg:h-6 text-green-600" />
          </button>
        )}
        
        {/* Scrollable Container */}
        <div 
          ref={scrollContainerRef}
          className="overflow-x-auto scrollbar-hide scroll-smooth"
          style={{ 
            WebkitOverflowScrolling: 'touch',
            scrollSnapType: 'x mandatory'
          }}
        >
          <div className="flex gap-4 sm:gap-6 pb-2" style={{ width: 'max-content' }}>
            {categories.map((category) => (
              <Card 
                key={category.id}
                className="group hover:shadow-lg transition-all duration-200 cursor-pointer flex-none w-[240px] sm:w-[280px]"
                onClick={() => handleCategoryClick(category.slug)}
                style={{ scrollSnapAlign: 'start' }}
              >
                <div className="relative overflow-hidden rounded-t-xl bg-gradient-to-br from-green-50 to-emerald-50">
                  {category.imageUrl ? (
                    <OptimizedImage
                      src={category.imageUrl}
                      alt={category.name}
                      className="w-full aspect-square object-cover group-hover:scale-110 transition-transform duration-300"
                      lazy={true}
                      placeholder={
                        <div className="w-full aspect-square flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50 text-green-400 animate-pulse">
                          <div className="text-center">
                            <Package className="w-8 h-8 mx-auto mb-2" />
                            <div className="text-xs font-medium">Loading...</div>
                          </div>
                        </div>
                      }
                    />
                  ) : (
                    <div className="w-full aspect-square flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50 text-green-500">
                      <div className="text-center">
                        <Package className="w-8 h-8 sm:w-10 sm:h-10 mx-auto mb-2" />
                        <div className="text-xs sm:text-sm font-medium text-green-600">Category</div>
                      </div>
                    </div>
                  )}
                  
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
                    <ChevronRight className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                  </div>
                </div>

                <CardContent className="p-3 sm:p-4">
                  <div className="space-y-2">
                    <h3 className="font-semibold text-gray-900 text-sm sm:text-base line-clamp-2 group-hover:text-green-600 transition-colors">
                      {category.name}
                    </h3>

                    {category.description && (
                      <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">
                        {category.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-2">
                      <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                        Active
                      </Badge>
                      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-green-500 transition-colors" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
      
      {categories.length > 0 && (
        <div className="text-center mt-8 sm:mt-12">
          <button 
            className="border-2 border-green-600 text-green-600 bg-transparent hover:bg-green-50 px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium transition-colors text-sm sm:text-base"
            onClick={() => navigate('/products')}
          >
            Browse All Products →
          </button>
        </div>
      )}
    </div>
  );
}