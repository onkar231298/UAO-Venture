import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Leaf, ChevronLeft, ChevronRight } from "lucide-react";
import OptimizedImage from "@/components/OptimizedImage";

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

interface ScrollableProductSectionProps {
  title: string;
  products: Product[];
  loading?: boolean;
}

export default function ScrollableProductSection({ title, products, loading = false }: ScrollableProductSectionProps) {
  const [, navigate] = useLocation();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

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
    navigate(`/product/${slug}`);
  };

  // Don't render if no products
  if (!loading && products.length === 0) {
    return null;
  }

  if (loading) {
    return (
      <section className="py-8 sm:py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-6 sm:mb-8">{title}</h2>
          <div className="flex gap-4 sm:gap-6 overflow-hidden">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex-none w-[280px] sm:w-[300px] lg:w-[280px] bg-white rounded-lg h-80 sm:h-96 animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-8 sm:py-12 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-6 sm:mb-8">{title}</h2>
        
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
                // Get product image using same logic as ProductCard
                const productImage = product.mainImageMedium || product.mainImageThumbnail || product.imageUrl || product.mainImage || (product.galleryImages && product.galleryImages.length > 0 ? product.galleryImages[0] : null);
                const hasImage = !!productImage;

                return (
                  <Card 
                    key={product.id}
                    className="group hover:shadow-lg transition-all duration-200 cursor-pointer flex-none w-[280px] sm:w-[300px] lg:w-[280px]"
                    onClick={() => handleProductClick(product.slug)}
                    style={{ scrollSnapAlign: 'start' }}
                  >
                    <div className="relative overflow-hidden rounded-t-xl bg-gray-100">
                      {hasImage ? (
                        <OptimizedImage
                          src={productImage}
                          alt={product.name}
                          className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-200"
                          lazy={true}
                          placeholder={
                            <div className="w-full aspect-square flex items-center justify-center bg-gray-100 text-gray-400 animate-pulse">
                              <div className="text-center">
                                <div className="text-2xl sm:text-3xl mb-2">📷</div>
                                <div className="text-xs sm:text-sm font-medium">Loading...</div>
                              </div>
                            </div>
                          }
                        />
                      ) : (
                        <div className="w-full aspect-square flex items-center justify-center bg-gray-100 text-gray-400">
                          <div className="text-center">
                            <div className="text-2xl sm:text-3xl mb-2">📷</div>
                            <div className="text-xs sm:text-sm font-medium">No Preview Available</div>
                          </div>
                        </div>
                      )}
                      
                      {/* Product Type Badge */}
                      {product.productType && (
                        <Badge className="absolute top-1 sm:top-2 left-1 sm:left-2 bg-green-600 text-xs">
                          <Leaf className="w-2 h-2 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" />
                          <span className="hidden sm:inline">
                            {product.productType === 'organic' ? 'Organic' :
                             product.productType === 'natural' ? 'Natural' :
                             product.productType === 'conventional' ? 'Conventional' :
                             product.productType === 'synthetic' ? 'Synthetic' :
                             product.productType === 'nature_identical' ? 'Nature Identical' :
                             product.productType === 'other' ? 'Other' : 
                             'Organic'}
                          </span>
                          <span className="sm:hidden">
                            {product.productType === 'organic' ? 'O' :
                             product.productType === 'natural' ? 'N' :
                             product.productType === 'conventional' ? 'C' :
                             product.productType === 'synthetic' ? 'S' :
                             product.productType === 'nature_identical' ? 'NI' :
                             product.productType === 'other' ? 'O' : 
                             'O'}
                          </span>
                        </Badge>
                      )}
                    </div>

                    <CardContent className="p-3 sm:p-4">
                      <div className="space-y-2">
                        <h3 className="font-semibold text-gray-900 text-sm sm:text-base line-clamp-2">
                          {product.name}
                        </h3>

                        {product.origin && (
                          <p className="text-xs sm:text-sm text-gray-600">
                            Origin: {product.origin}
                          </p>
                        )}

                        {/* Price and MOQ */}
                        <div className="flex justify-between items-center pt-2">
                          <div>
                            <span className="text-base sm:text-lg font-bold text-green-600">
                              ${product.priceUSD}
                            </span>
                            <span className="text-xs sm:text-sm text-gray-500">/kg</span>
                          </div>
                          {product.moq && (
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                              MOQ: {product.moq}kg
                            </span>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}