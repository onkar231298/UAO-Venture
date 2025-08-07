import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import { TrendingUp, Star, Flame, ChevronRight } from 'lucide-react';
import OptimizedImage from './OptimizedImage';
import type { Product } from '@shared/schema';

interface PopularProductsProps {
  title?: string;
  categoryId?: number;
  limit?: number;
  className?: string;
}

export default function PopularProducts({ 
  title = "Popular Products",
  categoryId,
  limit = 8,
  className = ""
}: PopularProductsProps) {
  // Fetch popular products
  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ['/api/products/popular', categoryId, limit],
    queryFn: async () => {
      const params = new URLSearchParams({
        limit: limit.toString(),
        sortBy: 'popular',
        ...(categoryId && { categoryId: categoryId.toString() })
      });
      
      const response = await fetch(`/api/products?${params}`);
      if (!response.ok) throw new Error('Failed to fetch popular products');
      const data = await response.json();
      return data.products || [];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

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
      <section className={`py-12 ${className}`}>
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <div className="h-8 bg-gray-200 rounded w-64 mb-2 animate-pulse"></div>
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

  if (!products.length) return null;

  return (
    <section className={`py-12 bg-white ${className}`}>
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Flame className="w-6 h-6 text-orange-600" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900">{title}</h2>
            </div>
            <p className="text-gray-600">
              Trending organic ingredients chosen by industry professionals
            </p>
          </div>
          
          <Link href="/products">
            <Button variant="outline" className="hidden sm:flex items-center gap-2">
              View All Products
              <ChevronRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product, index) => {
            const productImage = product.mainImageMedium || product.mainImageThumbnail || product.mainImage || (product.galleryImages && Array.isArray(product.galleryImages) && product.galleryImages.length > 0 ? product.galleryImages[0] : null);
            const displayPrice = product.priceUSD || product.basePrice;

            return (
              <Card key={product.id} className="group hover:shadow-lg transition-all duration-300 border-0 shadow-sm">
                <div className="relative">
                  {/* Popularity Ranking Badge */}
                  {index < 3 && (
                    <div className="absolute top-2 left-2 z-10">
                      <Badge className={`text-white font-bold ${
                        index === 0 ? 'bg-yellow-500' :
                        index === 1 ? 'bg-gray-400' :
                        'bg-orange-500'
                      }`}>
                        <Star className="w-3 h-3 mr-1" />
                        #{index + 1}
                      </Badge>
                    </div>
                  )}

                  <Link href={`/product/${product.slug}`}>
                    <div className="cursor-pointer overflow-hidden rounded-t-lg">
                      {productImage ? (
                        <OptimizedImage
                          src={productImage}
                          alt={product.name}
                          className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-300"
                          lazy={true}
                          placeholder={
                            <div className="w-full aspect-square flex items-center justify-center bg-gray-100 text-gray-400 animate-pulse">
                              <div className="text-center">
                                <div className="text-xl mb-1">📷</div>
                                <div className="text-xs">Loading...</div>
                              </div>
                            </div>
                          }
                        />
                      ) : (
                        <div className="w-full aspect-square flex items-center justify-center bg-gray-100 text-gray-400">
                          <div className="text-center">
                            <div className="text-xl mb-1">📷</div>
                            <div className="text-xs">No Image</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </Link>
                </div>

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
                  <div className="mb-3">
                    <div className="text-lg font-bold text-green-600">
                      {formatPrice(displayPrice)}
                      {displayPrice && (
                        <span className="text-xs font-normal text-gray-500 ml-1">
                          /{product.stockUnit || 'kg'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Trending Indicator */}
                  <div className="flex items-center gap-1 text-orange-600 text-xs font-medium">
                    <TrendingUp className="w-3 h-3" />
                    Trending
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Mobile View All Button */}
        <div className="flex justify-center mt-8 sm:hidden">
          <Link href="/products">
            <Button className="w-full max-w-xs">
              View All Products
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}