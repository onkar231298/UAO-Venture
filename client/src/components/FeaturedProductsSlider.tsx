import { useCallback, useEffect, useState } from 'react';
import { EmblaOptionsType } from 'embla-carousel';
import useEmblaCarousel from 'embla-carousel-react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ProductSlideCard from '@/components/ProductSlideCard';
import { useQuery } from '@tanstack/react-query';
import type { Product } from '@shared/schema';

interface FeaturedProductsSliderProps {
  title?: string;
  className?: string;
}

const OPTIONS: EmblaOptionsType = {
  loop: true,
  align: 'start',
  skipSnaps: false,
  dragFree: false,
  containScroll: 'trimSnaps',
  slidesToScroll: 1,
};

export default function FeaturedProductsSlider({ 
  title = "Featured Products",
  className = ""
}: FeaturedProductsSliderProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel(OPTIONS);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Fetch featured products - fallback to regular products if no featured ones
  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ['/api/products/featured'],
    queryFn: async () => {
      // Try to get featured products first
      let response = await fetch('/api/products?limit=12&featured=true');
      if (!response.ok) throw new Error('Failed to fetch featured products');
      let data = await response.json();
      
      // If no featured products, get regular products
      if (!data.products || data.products.length === 0) {
        response = await fetch('/api/products?limit=12');
        if (!response.ok) throw new Error('Failed to fetch products');
        data = await response.json();
      }
      
      return data.products || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('reInit', onSelect);
    emblaApi.on('select', onSelect);
  }, [emblaApi, onSelect]);

  // Auto-scroll functionality - only on desktop to avoid interfering with mobile touch
  useEffect(() => {
    if (!emblaApi || products.length <= 1) return;

    // Only auto-scroll on desktop (screen width >= 1024px)
    const isDesktop = window.innerWidth >= 1024;
    if (!isDesktop) return;

    const interval = setInterval(() => {
      if (emblaApi.canScrollNext()) {
        emblaApi.scrollNext();
      } else {
        emblaApi.scrollTo(0);
      }
    }, 5000); // Increased to 5 seconds for better UX

    return () => clearInterval(interval);
  }, [emblaApi, products.length]);

  if (isLoading) {
    return (
      <section className={`py-16 bg-gray-50 ${className}`}>
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="h-8 bg-gray-200 rounded w-64 mx-auto mb-4 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-96 mx-auto animate-pulse"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-6 animate-pulse">
                <div className="aspect-square bg-gray-200 rounded-lg mb-4"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!products.length) return null;

  return (
    <section className={`py-16 bg-gray-50 ${className}`}>
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4">{title}</h2>
          <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-2xl mx-auto px-4">
            Discover our most popular organic ingredients trusted by businesses worldwide
          </p>
          {/* Mobile swipe hint */}
          <p className="text-sm text-gray-500 mt-2 lg:hidden">
            ← Swipe to explore more products →
          </p>
        </div>

        {/* Carousel */}
        <div className="relative">
          <div 
            className="overflow-hidden cursor-grab active:cursor-grabbing" 
            ref={emblaRef}
            style={{ touchAction: 'pan-x' }}
          >
            <div className="flex">
              {products.map((product) => (
                <div 
                  key={product.id}
                  className="flex-[0_0_100%] min-w-0 sm:flex-[0_0_50%] md:flex-[0_0_33.333%] lg:flex-[0_0_25%] px-2 sm:px-3"
                >
                  <ProductSlideCard product={product} />
                </div>
              ))}
            </div>
          </div>

          {/* Navigation Arrows - Hidden on mobile, visible on desktop */}
          {products.length > 1 && (
            <>
              <Button
                variant="outline"
                size="icon"
                className={`absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 bg-white shadow-lg hover:shadow-xl transition-all duration-200 hidden lg:flex ${
                  !canScrollPrev ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                onClick={scrollPrev}
                disabled={!canScrollPrev}
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className={`absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 bg-white shadow-lg hover:shadow-xl transition-all duration-200 hidden lg:flex ${
                  !canScrollNext ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                onClick={scrollNext}
                disabled={!canScrollNext}
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </>
          )}
        </div>

        {/* Dots Indicator - Mobile and Desktop */}
        {products.length > 1 && (
          <div className="flex justify-center mt-8 gap-2">
            {/* Mobile: Show dots for each slide */}
            <div className="flex gap-2 lg:hidden">
              {products.map((_, index) => (
                <button
                  key={index}
                  className={`w-2 h-2 rounded-full transition-all duration-200 ${
                    selectedIndex === index
                      ? 'bg-green-600 w-6'
                      : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                  onClick={() => emblaApi?.scrollTo(index)}
                />
              ))}
            </div>
            
            {/* Desktop: Show dots for groups of 4 */}
            <div className="hidden lg:flex gap-2">
              {Array.from({ length: Math.ceil(products.length / 4) }).map((_, index) => (
                <button
                  key={index}
                  className={`w-2 h-2 rounded-full transition-all duration-200 ${
                    Math.floor(selectedIndex / 4) === index
                      ? 'bg-green-600 w-6'
                      : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                  onClick={() => emblaApi?.scrollTo(index * 4)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}