import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { 
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ShoppingCart, Eye, Heart } from 'lucide-react';

interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  priceUSD: number;
  mainImage?: string;
  origin?: string;
  form?: string;
  moq?: number;
  productId: string;
}

const FeaturedProducts: React.FC = () => {
  const { data: featuredProducts, isLoading, error } = useQuery({
    queryKey: ['/api/products/featured'],
    queryFn: async (): Promise<Product[]> => {
      const response = await fetch('/api/products/featured?limit=8');
      if (!response.ok) {
        throw new Error('Failed to fetch featured products');
      }
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <section className="py-16 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Featured Products
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Loading our premium selection of organic ingredients...
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow-md animate-pulse">
                <div className="aspect-square bg-gray-200 dark:bg-gray-700 rounded-t-lg"></div>
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error || !featuredProducts || featuredProducts.length === 0) {
    return null; // Don't render if no featured products
  }

  return (
    <section className="py-16 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Featured Products
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Discover our premium selection of organic ingredients, carefully sourced and 
            quality-tested for your business needs.
          </p>
        </div>

        <div className="relative">
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full max-w-7xl mx-auto"
          >
            <CarouselContent className="-ml-2 md:-ml-4">
              {featuredProducts.map((product) => (
                <CarouselItem key={product.id} className="pl-2 md:pl-4 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4">
                  <Card className="h-full group hover:shadow-xl transition-all duration-300 border-0 bg-white dark:bg-gray-800 overflow-hidden">
                    <div className="relative aspect-square overflow-hidden">
                      {product.mainImage ? (
                        <img
                          src={product.mainImage}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900 dark:to-emerald-900 flex items-center justify-center">
                          <div className="text-4xl font-bold text-green-600 dark:text-green-400">
                            {product.name.charAt(0)}
                          </div>
                        </div>
                      )}
                      
                      {/* Overlay with quick actions */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300">
                        <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <Button size="sm" variant="secondary" className="h-8 w-8 p-0 rounded-full">
                            <Heart className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="secondary" className="h-8 w-8 p-0 rounded-full">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    <CardContent className="p-4 flex-1 flex flex-col">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                          {product.name}
                        </h3>
                        
                        <div className="flex items-center gap-2 mb-2 text-sm text-gray-500 dark:text-gray-400">
                          <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-1 rounded-full text-xs font-medium">
                            {product.productId}
                          </span>
                          {product.origin && (
                            <span className="text-xs">• {product.origin}</span>
                          )}
                        </div>

                        {product.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">
                            {product.description}
                          </p>
                        )}

                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <span className="text-lg font-bold text-green-600 dark:text-green-400">
                              ${product.priceUSD}
                            </span>
                            <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">
                              /kg
                            </span>
                          </div>
                          {product.moq && (
                            <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded">
                              MOQ: {product.moq}kg
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2 mt-auto">
                        <Link href={`/product/${product.slug}`} className="flex-1">
                          <Button className="w-full bg-green-600 hover:bg-green-700 text-white" size="sm">
                            View Details
                          </Button>
                        </Link>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="px-3 border-green-600 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
                        >
                          <ShoppingCart className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
            
            <CarouselPrevious className="hidden md:flex -left-4 bg-white dark:bg-gray-800 border-green-200 dark:border-green-700 hover:bg-green-50 dark:hover:bg-green-900/20" />
            <CarouselNext className="hidden md:flex -right-4 bg-white dark:bg-gray-800 border-green-200 dark:border-green-700 hover:bg-green-50 dark:hover:bg-green-900/20" />
          </Carousel>
        </div>

        <div className="text-center mt-8">
          <Link href="/products">
            <Button 
              variant="outline" 
              className="border-green-600 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
            >
              View All Products
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FeaturedProducts;