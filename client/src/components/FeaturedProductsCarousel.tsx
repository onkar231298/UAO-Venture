import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { ChevronLeft, ChevronRight, ShoppingCart } from 'lucide-react';

interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  priceUSD: string;
  mainImage?: string;
  origin?: string;
  form?: string;
  moq?: number;
  productId: string;
}

const FeaturedProductsCarousel: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [itemsPerView, setItemsPerView] = useState(4);

  console.log('🎯 FeaturedProductsCarousel component is loading...');

  const { data: featuredProducts, isLoading, error } = useQuery({
    queryKey: ['/api/products/featured'],
    queryFn: async (): Promise<Product[]> => {
      console.log('🔄 Fetching featured products from API...');
      const response = await fetch('/api/products/featured?limit=8');
      if (!response.ok) {
        throw new Error('Failed to fetch featured products');
      }
      const data = await response.json();
      console.log('✅ Featured products loaded:', data.length, 'items');
      return data;
    },
  });

  // Responsive items per view
  useEffect(() => {
    const updateItemsPerView = () => {
      if (window.innerWidth >= 1024) setItemsPerView(4);
      else if (window.innerWidth >= 768) setItemsPerView(3);
      else if (window.innerWidth >= 640) setItemsPerView(2);
      else setItemsPerView(1);
    };

    updateItemsPerView();
    window.addEventListener('resize', updateItemsPerView);
    return () => window.removeEventListener('resize', updateItemsPerView);
  }, []);

  const nextSlide = () => {
    if (featuredProducts && currentIndex < featuredProducts.length - itemsPerView) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const prevSlide = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const canScrollNext = featuredProducts && currentIndex < featuredProducts.length - itemsPerView;
  const canScrollPrev = currentIndex > 0;

  if (isLoading) {
    return (
      <section className="py-16 bg-gradient-to-br from-green-50 to-emerald-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Featured Products
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Loading our premium selection...
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="bg-white rounded-lg shadow-md animate-pulse">
                <div className="aspect-square bg-gray-200 rounded-t-lg"></div>
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error || !featuredProducts || featuredProducts.length === 0) {
    console.log('❌ Featured products error or empty:', { error, count: featuredProducts?.length });
    return (
      <section className="py-16 bg-gradient-to-br from-green-50 to-emerald-50">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Featured Products
            </h2>
            <p className="text-lg text-gray-600">
              No featured products available at the moment.
            </p>
          </div>
        </div>
      </section>
    );
  }

  console.log('🎨 Rendering carousel with', featuredProducts.length, 'products');

  return (
    <section className="py-16 bg-gradient-to-br from-green-50 to-emerald-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Featured Products
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Discover our premium selection of organic ingredients, carefully sourced and 
            quality-tested for your business needs.
          </p>
        </div>

        <div className="relative max-w-7xl mx-auto">
          {/* Navigation Buttons */}
          {canScrollPrev && (
            <button
              onClick={prevSlide}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white border border-green-200 hover:bg-green-50 text-green-600 shadow-lg rounded-full w-12 h-12 flex items-center justify-center"
              style={{ left: '-24px' }}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}
          
          {canScrollNext && (
            <button
              onClick={nextSlide}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white border border-green-200 hover:bg-green-50 text-green-600 shadow-lg rounded-full w-12 h-12 flex items-center justify-center"
              style={{ right: '-24px' }}
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          )}

          {/* Carousel Container */}
          <div className="overflow-hidden">
            <div 
              className="flex transition-transform duration-300 ease-in-out"
              style={{
                transform: `translateX(-${currentIndex * (100 / itemsPerView)}%)`,
                width: `${(featuredProducts.length / itemsPerView) * 100}%`
              }}
            >
              {featuredProducts.map((product) => (
                <div 
                  key={product.id} 
                  className="flex-shrink-0 px-3"
                  style={{ width: `${100 / featuredProducts.length}%` }}
                >
                  <div className="bg-white rounded-lg shadow-md overflow-hidden h-full group hover:shadow-xl transition-all duration-300">
                    <div className="relative aspect-square overflow-hidden">
                      {product.mainImage ? (
                        <img
                          src={product.mainImage}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center">
                          <div className="text-4xl font-bold text-green-600">
                            {product.name.charAt(0)}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="p-4 flex flex-col h-64">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-green-600 transition-colors">
                          {product.name}
                        </h3>
                        
                        <div className="flex items-center gap-2 mb-2 text-sm text-gray-500">
                          <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">
                            {product.productId}
                          </span>
                          {product.origin && (
                            <span className="text-xs">• {product.origin}</span>
                          )}
                        </div>

                        {product.description && (
                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                            {product.description}
                          </p>
                        )}

                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <span className="text-lg font-bold text-green-600">
                              ${product.priceUSD}
                            </span>
                            <span className="text-sm text-gray-500 ml-1">
                              /kg
                            </span>
                          </div>
                          {product.moq && (
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                              MOQ: {product.moq}kg
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2 mt-auto">
                        <Link href={`/products/${product.slug}`} className="flex-1">
                          <button className="w-full bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded text-sm transition-colors">
                            🛒 Get Quote
                          </button>
                        </Link>
                        <button className="px-3 py-2 border border-green-600 text-green-600 hover:bg-green-50 rounded transition-colors">
                          📦 Sample
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="text-center mt-8">
          <Link href="/products">
            <button className="border border-green-600 text-green-600 hover:bg-green-50 px-6 py-2 rounded transition-colors">
              View All Products
            </button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FeaturedProductsCarousel;