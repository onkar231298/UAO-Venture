import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

interface FrequentlyBoughtTogetherProps {
  currentProductId: number;
  categoryId?: number;
}

export default function FrequentlyBoughtTogether({ currentProductId, categoryId }: FrequentlyBoughtTogetherProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [, navigate] = useLocation();

  useEffect(() => {
    // Fetch related products from the same category, excluding current product
    const fetchUrl = categoryId 
      ? `/api/products?category=${categoryId}&limit=12&exclude=${currentProductId}`
      : `/api/products?limit=12&exclude=${currentProductId}`;
    
    fetch(fetchUrl)
      .then(response => response.json())
      .then(data => {
        // Extract products from paginated response or direct array
        const productList = data.products || data;
        setProducts(productList.slice(0, 8)); // Limit to 8 products
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching related products:', error);
        setLoading(false);
      });
  }, [currentProductId, categoryId]);

  const getProductsPerSlide = () => {
    if (typeof window !== 'undefined') {
      if (window.innerWidth < 768) return 1; // Mobile: 1 product
      if (window.innerWidth < 1024) return 2; // Tablet: 2 products  
      return 3; // Desktop: 3 products for better fit
    }
    return 3; // Default to desktop
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
      setCurrentIndex(currentIndex + 1);
    }
  };

  const prevSlide = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleProductClick = (slug: string) => {
    navigate(`/product/${slug}`);
  };

  const visibleProducts = products.slice(currentIndex, currentIndex + productsPerSlide);
  const canGoNext = currentIndex < products.length - productsPerSlide;
  const canGoPrev = currentIndex > 0;

  if (loading) {
    return (
      <Card className="mt-6">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Frequently Bought Together</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-gray-100 rounded-lg h-64 animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (products.length === 0) {
    return null; // Don't render if no products
  }

  return (
    <Card className="mt-6">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Frequently Bought Together</h3>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={prevSlide}
              disabled={!canGoPrev}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={nextSlide}
              disabled={!canGoNext}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Mobile Carousel */}
        <div className="md:hidden overflow-x-auto scrollbar-hide">
          <div className="flex gap-4 pb-2" style={{ width: `${products.length * 240}px` }}>
            {products.map((product) => {
              const productImage = product.mainImageMedium || product.mainImageThumbnail || product.imageUrl || product.mainImage || (product.galleryImages && product.galleryImages.length > 0 ? product.galleryImages[0] : null);
              const hasImage = !!productImage;

              return (
                <Card 
                  key={product.id}
                  className="group hover:shadow-lg transition-all duration-200 cursor-pointer flex-shrink-0 w-56"
                  onClick={() => handleProductClick(product.slug)}
                >
                  <div className="relative overflow-hidden rounded-t-xl bg-gray-100">
                    {hasImage ? (
                      <OptimizedImage
                        src={productImage}
                        alt={product.name}
                        className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-200"
                        lazy={true}
                        placeholder={
                          <div className="w-full h-40 flex items-center justify-center bg-gray-100 text-gray-400 animate-pulse">
                            <div className="text-center">
                              <div className="text-2xl mb-1">📷</div>
                              <div className="text-xs font-medium">Loading...</div>
                            </div>
                          </div>
                        }
                      />
                    ) : (
                      <div className="w-full h-40 flex items-center justify-center bg-gray-100 text-gray-400">
                        <div className="text-center">
                          <div className="text-2xl mb-1">📷</div>
                          <div className="text-xs font-medium">No Preview</div>
                        </div>
                      </div>
                    )}
                    
                    {product.productType && (
                      <Badge className="absolute top-2 left-2 bg-green-600 text-xs">
                        <Leaf className="w-3 h-3 mr-1" />
                        <span className="hidden sm:inline">
                          {product.productType === 'organic' ? 'Organic' :
                           product.productType === 'natural' ? 'Natural' :
                           product.productType === 'conventional' ? 'Conventional' :
                           'Organic'}
                        </span>
                        <span className="sm:hidden">O</span>
                      </Badge>
                    )}
                  </div>

                  <CardContent className="p-3">
                    <div className="space-y-2">
                      <h4 className="font-medium text-gray-900 text-sm line-clamp-2">
                        {product.name}
                      </h4>

                      {product.origin && (
                        <p className="text-xs text-gray-600">
                          Origin: {product.origin}
                        </p>
                      )}

                      <div className="flex justify-between items-center pt-1">
                        <div>
                          <span className="text-sm font-bold text-green-600">
                            ${product.priceUSD}
                          </span>
                          <span className="text-xs text-gray-500">/kg</span>
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

        {/* Desktop/Tablet Carousel */}
        <div className="hidden md:block overflow-hidden rounded-lg">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {visibleProducts.map((product) => {
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
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-200"
                        lazy={true}
                        placeholder={
                          <div className="w-full h-48 flex items-center justify-center bg-gray-100 text-gray-400 animate-pulse">
                            <div className="text-center">
                              <div className="text-2xl mb-1">📷</div>
                              <div className="text-xs font-medium">Loading...</div>
                            </div>
                          </div>
                        }
                      />
                    ) : (
                      <div className="w-full h-48 flex items-center justify-center bg-gray-100 text-gray-400">
                        <div className="text-center">
                          <div className="text-2xl mb-1">📷</div>
                          <div className="text-xs font-medium">No Preview Available</div>
                        </div>
                      </div>
                    )}
                    
                    {product.productType && (
                      <Badge className="absolute top-2 left-2 bg-green-600 text-xs">
                        <Leaf className="w-3 h-3 mr-1" />
                        <span>
                          {product.productType === 'organic' ? 'Organic' :
                           product.productType === 'natural' ? 'Natural' :
                           product.productType === 'conventional' ? 'Conventional' :
                           'Organic'}
                        </span>
                      </Badge>
                    )}
                  </div>

                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <h4 className="font-semibold text-gray-900 text-sm line-clamp-2">
                        {product.name}
                      </h4>

                      {product.origin && (
                        <p className="text-xs text-gray-600">
                          Origin: {product.origin}
                        </p>
                      )}

                      <div className="flex justify-between items-center pt-2">
                        <div>
                          <span className="text-base font-bold text-green-600">
                            ${product.priceUSD}
                          </span>
                          <span className="text-xs text-gray-500">/kg</span>
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
      </CardContent>
    </Card>
  );
}