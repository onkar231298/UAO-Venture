import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Leaf } from "lucide-react";
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

export default function FeaturedCarouselSection() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [, navigate] = useLocation();

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

  const getProductsPerSlide = () => {
    if (typeof window !== 'undefined') {
      if (window.innerWidth < 768) return 1; // Mobile: 1 product
      if (window.innerWidth < 1024) return 2; // Tablet: 2 products  
      return 4; // Desktop: 4 products
    }
    return 4; // Default to desktop
  };

  const [productsPerSlide, setProductsPerSlide] = useState(getProductsPerSlide);

  useEffect(() => {
    const handleResize = () => {
      setProductsPerSlide(getProductsPerSlide());
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const nextSlide = () => {
    if (currentIndex < products.length - productsPerSlide) {
      const newIndex = currentIndex + 1;
      console.log('➡️ Next slide to index:', newIndex);
      setCurrentIndex(newIndex);
    }
  };

  const prevSlide = () => {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      console.log('⬅️ Previous slide to index:', newIndex);
      setCurrentIndex(newIndex);
    }
  };

  const handleProductClick = (slug: string) => {
    console.log('🔗 Navigating to product:', slug);
    navigate(`/product/${slug}`);
  };

  const visibleProducts = products.slice(currentIndex, currentIndex + productsPerSlide);
  const canGoNext = currentIndex < products.length - productsPerSlide;
  const canGoPrev = currentIndex > 0;

  if (loading) {
    return (
      <section className="py-8 sm:py-12 lg:py-16" style={{background: "linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)"}}>
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
    <section className="py-8 sm:py-12 lg:py-16" style={{background: "linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)"}}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">Featured Products</h2>
          <p className="text-sm sm:text-base lg:text-lg text-gray-600 max-w-2xl mx-auto px-4 sm:px-0">
            Discover our premium selection of organic ingredients, carefully sourced and quality-tested for your business needs.
          </p>
        </div>
        
        <div className="relative max-w-6xl mx-auto">
          {/* Navigation Arrows - Hidden on mobile */}
          {canGoPrev && (
            <button 
              className="hidden md:flex absolute left-2 lg:left-4 top-1/2 transform -translate-y-1/2 bg-white border-2 border-green-600 rounded-full w-10 h-10 lg:w-12 lg:h-12 items-center justify-center shadow-lg hover:bg-green-50 transition-colors z-10"
              onClick={prevSlide}
            >
              ←
            </button>
          )}
          
          {canGoNext && (
            <button 
              className="hidden md:flex absolute right-2 lg:right-4 top-1/2 transform -translate-y-1/2 bg-white border-2 border-green-600 rounded-full w-10 h-10 lg:w-12 lg:h-12 items-center justify-center shadow-lg hover:bg-green-50 transition-colors z-10"
              onClick={nextSlide}
            >
              →
            </button>
          )}
          
          {/* Carousel Container */}
          <div className="overflow-hidden rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {visibleProducts.map((product) => {
                // Get product image using same logic as ProductCard
                const productImage = product.mainImageMedium || product.mainImageThumbnail || product.imageUrl || product.mainImage || (product.galleryImages && product.galleryImages.length > 0 ? product.galleryImages[0] : null);
                const hasImage = !!productImage;

                return (
                  <Card 
                    key={product.id}
                    className="group hover:shadow-lg transition-all duration-200 cursor-pointer"
                    onClick={() => handleProductClick(product.slug)}
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
        
        <div className="text-center mt-8 sm:mt-12">
          <button 
            className="border-2 border-green-600 text-green-600 bg-transparent hover:bg-green-50 px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium transition-colors text-sm sm:text-base"
            onClick={() => navigate('/products')}
          >
            View All Products →
          </button>
        </div>
      </div>
    </section>
  );
}