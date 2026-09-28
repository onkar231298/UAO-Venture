import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from "lucide-react";
import ProductCard from "@/components/ProductCard";

interface Product {
  id: number;
  name: string;
  slug: string;
  description?: string;
  priceUSD: string;
  mainImage?: string;
  mainImageMedium?: string;
  mainImageThumbnail?: string;
  imageUrl?: string;
  galleryImages?: string[];
  origin?: string;
  productId: string;
  productType?: string;
  moq?: number;
}

export default function FeaturedCarouselSection() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  console.log('🎠 FeaturedCarouselSection rendering...');

  useEffect(() => {
    console.log('🔄 Fetching featured products...');
    
    fetch('/api/products/featured?limit=8')
      .then(response => {
        console.log('📡 Featured products response:', response.status);
        return response.json();
      })
      .then(data => {
        console.log('✅ Featured products loaded:', data.length);
        setProducts(data);
        setLoading(false);
      })
      .catch(error => {
        console.error('❌ Error fetching featured products:', error);
        setLoading(false);
      });
  }, []);

  // Scroll navigation functions
  const scrollNext = () => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const cardWidth = container.children[0]?.getBoundingClientRect().width || 300;
      const gap = 16; // 1rem gap in pixels
      
      // On mobile: scroll 1 card, on desktop: scroll 4 cards
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
      const cardWidth = container.children[0]?.getBoundingClientRect().width || 300;
      const gap = 16; // 1rem gap in pixels
      
      // On mobile: scroll 1 card, on desktop: scroll 4 cards
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
  }, [products]);

  const handleProductClick = (slug: string) => {
    console.log('🔗 Navigating to product:', slug);
    window.location.href = `/products/${slug}`;
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') {
        scrollPrev();
      } else if (event.key === 'ArrowRight') {
        scrollNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (loading) {
    return (
      <section className="py-8 sm:py-12 lg:py-16 bg-gradient-to-br from-green-50 to-emerald-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">Featured Products</h2>
            <p className="text-sm sm:text-base lg:text-lg text-gray-600">Loading our premium selection...</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 max-w-6xl mx-auto">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white rounded-lg h-80 sm:h-96 animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-8 sm:py-12 lg:py-16 bg-gradient-to-br from-green-50 to-emerald-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">Featured Products</h2>
          <p className="text-sm sm:text-base lg:text-lg text-gray-600 max-w-2xl mx-auto px-4 sm:px-0">
            Discover our premium selection of organic ingredients, carefully sourced and quality-tested for your business needs.
          </p>
        </div>
        
        <div className="relative max-w-7xl mx-auto">
          {/* Navigation Arrows - Hidden on mobile */}
          {canScrollLeft && (
            <button 
              className="hidden md:flex absolute left-2 lg:left-4 top-1/2 transform -translate-y-1/2 bg-white border-2 border-green-600 rounded-full w-12 h-12 lg:w-14 lg:h-14 items-center justify-center shadow-lg hover:bg-green-50 transition-all duration-200 z-10"
              onClick={scrollPrev}
              aria-label="Previous products"
            >
              <ChevronLeft className="w-5 h-5 lg:w-6 lg:h-6 text-green-600" />
            </button>
          )}
          
          {canScrollRight && (
            <button 
              className="hidden md:flex absolute right-2 lg:right-4 top-1/2 transform -translate-y-1/2 bg-white border-2 border-green-600 rounded-full w-12 h-12 lg:w-14 lg:h-14 items-center justify-center shadow-lg hover:bg-green-50 transition-all duration-200 z-10"
              onClick={scrollNext}
              aria-label="Next products"
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
              {products.map((product) => {
                // Transform product to match ProductCard interface - add required fields
                const transformedProduct = {
                  ...product,
                  form: product.form || null,
                  specificationSheet: null,
                  botanicalName: product.botanicalName || null,
                  plantPart: null,
                  extractRatio: null,
                  certifications: [],
                  documents: [],
                  isActive: true,
                  visibility: 'public' as const,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                  createdBy: null,
                  updatedBy: null,
                  primaryType: product.productType ? {
                    id: 1,
                    name: product.productType === 'organic' ? 'Organic' :
                          product.productType === 'natural' ? 'Natural' :
                          product.productType === 'conventional' ? 'Conventional' :
                          product.productType === 'synthetic' ? 'Synthetic' :
                          product.productType === 'nature_identical' ? 'Nature Identical' :
                          product.productType === 'other' ? 'Other' : 'Organic',
                    slug: product.productType,
                    isActive: true,
                    createdAt: null,
                    updatedAt: null,
                    icon: null,
                    color: null,
                    displayOrder: null,
                    description: null
                  } : null,
                  tags: []
                } as any;

                return (
                  <div 
                    key={product.id}
                    className="flex-none w-[280px] sm:w-[300px] lg:w-[280px]"
                    style={{ scrollSnapAlign: 'start' }}
                  >
                    <ProductCard product={transformedProduct} />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        
        <div className="text-center mt-8 sm:mt-12">
          <button 
            className="border-2 border-green-600 text-green-600 bg-transparent hover:bg-green-50 px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium transition-colors text-sm sm:text-base"
            onClick={() => window.location.href = '/products'}
          >
            View All Products →
          </button>
        </div>
      </div>
    </section>
  );
}