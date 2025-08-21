import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Package, 
  ChevronRight, 
  ChevronLeft,
  Leaf,
  FlaskConical,
  Droplets,
  Flower2,
  TreePine,
  Zap,
  Heart,
  Sparkles,
  Brain,
  Shield,
  Sun,
  Coffee
} from "lucide-react";

interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string | null;
  isActive: boolean;
}

// Function to get relevant icon for each category
const getCategoryIcon = (categoryName: string) => {
  const name = categoryName.toLowerCase();
  
  if (name.includes('adaptogenic') || name.includes('adaptogen')) return Brain;
  if (name.includes('amino') || name.includes('acid')) return FlaskConical;
  if (name.includes('bioactive') || name.includes('nutrient')) return Zap;
  if (name.includes('culinary') || name.includes('spices')) return Coffee;
  if (name.includes('essential') || name.includes('oil')) return Droplets;
  if (name.includes('herbal') || name.includes('powder')) return Leaf;
  if (name.includes('botanical') || name.includes('extract')) return TreePine;
  if (name.includes('ayurvedic') || name.includes('traditional')) return Flower2;
  if (name.includes('wellness') || name.includes('health')) return Heart;
  if (name.includes('antioxidant') || name.includes('anti')) return Shield;
  if (name.includes('vitamin') || name.includes('supplement')) return Sun;
  if (name.includes('organic') || name.includes('natural')) return Sparkles;
  
  // Default icon
  return Package;
};

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
    navigate(`/ingredients/${slug}`);
  };

  // Scroll navigation functions
  const scrollNext = () => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const cardWidth = container.children[0]?.getBoundingClientRect().width || 280;
      const gap = 16; // 1rem gap in pixels
      
      // On mobile: scroll 1 card, on desktop: scroll 4 cards (slower, more controlled)
      const isMobile = window.innerWidth < 768;
      const scrollAmount = isMobile ? (cardWidth + gap) : (cardWidth + gap) * 4;
      
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
      
      // On mobile: scroll 1 card, on desktop: scroll 4 cards (slower, more controlled)
      const isMobile = window.innerWidth < 768;
      const scrollAmount = isMobile ? (cardWidth + gap) : (cardWidth + gap) * 4;
      
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
                  {(() => {
                    const IconComponent = getCategoryIcon(category.name);
                    return (
                      <div className="w-full aspect-square flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50 text-green-500 group-hover:scale-110 transition-transform duration-300">
                        <div className="text-center">
                          <IconComponent className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-2 text-green-600" />
                          <div className="text-xs sm:text-sm font-medium text-green-600">{category.name}</div>
                        </div>
                      </div>
                    );
                  })()}
                  
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