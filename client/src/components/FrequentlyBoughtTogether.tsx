import { useCallback, useEffect, useState } from 'react';
import { EmblaOptionsType } from 'embla-carousel';
import useEmblaCarousel from 'embla-carousel-react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import OptimizedImage from './OptimizedImage';
import { Package2, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Product } from '@shared/schema';

interface FrequentlyBoughtTogetherProps {
  productId: number;
  currentProduct: Product;
  className?: string;
}

const OPTIONS: EmblaOptionsType = {
  loop: false,
  align: 'start',
  skipSnaps: false,
  dragFree: false,
  containScroll: 'trimSnaps',
  slidesToScroll: 1,
};

export default function FrequentlyBoughtTogether({ 
  productId, 
  currentProduct, 
  className = "" 
}: FrequentlyBoughtTogetherProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel(OPTIONS);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  // Fetch frequently bought together products
  const { data: relatedProducts = [], isLoading } = useQuery<Product[]>({
    queryKey: ['/api/products/frequently-bought', productId],
    queryFn: async () => {
      // For now, get similar products from same category
      const params = new URLSearchParams({
        limit: '4', // Increased from 3 to 4
        ...(currentProduct.categoryId && { categoryId: currentProduct.categoryId.toString() }),
        exclude: productId.toString()
      });
      
      const response = await fetch(`/api/products?${params}`);
      if (!response.ok) throw new Error('Failed to fetch related products');
      const data = await response.json();
      return data.products || [];
    },
    enabled: !!productId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('reInit', onSelect);
    emblaApi.on('select', onSelect);
  }, [emblaApi, onSelect]);

  // Format price for display
  const formatPrice = (price: number | null | undefined, currency: string = 'USD') => {
    if (!price) return 'Quote on Request';
    
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
    
    return formatter.format(price);
  };

  if (isLoading) {
    return (
      <section className={`py-8 bg-gray-50 ${className}`}>
        <div className="container mx-auto px-4">
          <div className="mb-6">
            <div className="h-6 bg-gray-200 rounded w-64 mb-2 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-96 animate-pulse"></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-4 shadow-sm border animate-pulse">
                <div className="aspect-square bg-gray-200 rounded-lg mb-3"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3 mb-3"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!relatedProducts.length) return null;

  return (
    <section className={`py-8 bg-gray-50 ${className}`}>
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Package2 className="w-6 h-6 text-blue-600" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Frequently Bought Together</h2>
            </div>
            <p className="text-gray-600">
              Customers who bought this item also purchased these products
            </p>
          </div>
          
          {/* Navigation Arrows - Hidden on mobile, visible on desktop */}
          {relatedProducts.length > 4 && (
            <div className="hidden lg:flex gap-2">
              <Button
                variant="outline"
                size="icon"
                className={`${!canScrollPrev ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={scrollPrev}
                disabled={!canScrollPrev}
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className={`${!canScrollNext ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={scrollNext}
                disabled={!canScrollNext}
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          )}
        </div>

        {/* Desktop Grid / Mobile Carousel */}
        <div className="relative">
          {/* Mobile Carousel */}
          <div 
            className="block lg:hidden overflow-hidden cursor-grab active:cursor-grabbing" 
            ref={emblaRef}
            style={{ touchAction: 'pan-x' }}
          >
            <div className="flex">
              {relatedProducts.map((product) => {
                const productImage = product.mainImageMedium || product.mainImageThumbnail || product.mainImage || 
                  (product.galleryImages && Array.isArray(product.galleryImages) && product.galleryImages.length > 0 ? product.galleryImages[0] : null);
                const displayPrice = Number(product.priceUSD || product.basePrice || 0);

                return (
                  <div 
                    key={product.id}
                    className="flex-[0_0_85%] min-w-0 sm:flex-[0_0_50%] px-2"
                  >
                    <Card className="group hover:shadow-lg transition-all duration-300 h-full">
                      <Link href={`/product/${product.slug}`}>
                        <div className="cursor-pointer overflow-hidden rounded-t-lg">
                          {productImage ? (
                            <OptimizedImage
                              src={productImage}
                              alt={product.name}
                              className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-300"
                              lazy={true}
                            />
                          ) : (
                            <div className="w-full aspect-square bg-gray-100 flex items-center justify-center">
                              <span className="text-gray-400 text-sm">No Image</span>
                            </div>
                          )}
                        </div>
                      </Link>

                      <CardContent className="p-4">
                        <Link href={`/product/${product.slug}`}>
                          <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 hover:text-green-600 transition-colors cursor-pointer text-sm">
                            {product.name}
                          </h3>
                        </Link>

                        {/* Key Info */}
                        <div className="flex flex-wrap gap-1 mb-3">
                          {product.productType && (
                            <Badge variant="outline" className="text-xs border-green-200 text-green-700">
                              {product.productType === 'organic' ? 'Organic' : product.productType}
                            </Badge>
                          )}
                          {product.form && (
                            <Badge variant="outline" className="text-xs">
                              {product.form}
                            </Badge>
                          )}
                        </div>

                        {/* Price */}
                        <div className="text-lg font-bold text-green-600">
                          {formatPrice(displayPrice)}
                          {displayPrice > 0 && (
                            <span className="text-xs font-normal text-gray-500 ml-1">
                              /{product.stockUnit || 'kg'}
                            </span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Desktop Grid */}
          <div className="hidden lg:grid grid-cols-4 gap-6">
            {relatedProducts.map((product) => {
              const productImage = product.mainImageMedium || product.mainImageThumbnail || product.mainImage || 
                (product.galleryImages && Array.isArray(product.galleryImages) && product.galleryImages.length > 0 ? product.galleryImages[0] : null);
              const displayPrice = Number(product.priceUSD || product.basePrice || 0);

              return (
                <Card key={product.id} className="group hover:shadow-lg transition-all duration-300 h-full">
                  <Link href={`/product/${product.slug}`}>
                    <div className="cursor-pointer overflow-hidden rounded-t-lg">
                      {productImage ? (
                        <OptimizedImage
                          src={productImage}
                          alt={product.name}
                          className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-300"
                          lazy={true}
                        />
                      ) : (
                        <div className="w-full aspect-square bg-gray-100 flex items-center justify-center">
                          <span className="text-gray-400 text-sm">No Image</span>
                        </div>
                      )}
                    </div>
                  </Link>

                  <CardContent className="p-4">
                    <Link href={`/product/${product.slug}`}>
                      <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 hover:text-green-600 transition-colors cursor-pointer">
                        {product.name}
                      </h3>
                    </Link>

                    {/* Key Info */}
                    <div className="flex flex-wrap gap-1 mb-3">
                      {product.productType && (
                        <Badge variant="outline" className="text-xs border-green-200 text-green-700">
                          {product.productType === 'organic' ? 'Organic' : product.productType}
                        </Badge>
                      )}
                      {product.form && (
                        <Badge variant="outline" className="text-xs">
                          {product.form}
                        </Badge>
                      )}
                    </div>

                    {/* Price */}
                    <div className="text-lg font-bold text-green-600">
                      {formatPrice(displayPrice)}
                      {displayPrice > 0 && (
                        <span className="text-xs font-normal text-gray-500 ml-1">
                          /{product.stockUnit || 'kg'}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Mobile swipe hint */}
        <div className="block lg:hidden text-center mt-4">
          <p className="text-sm text-gray-500">← Swipe to see more products →</p>
        </div>
      </div>
    </section>
  );
}