import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Leaf, TrendingUp, ArrowRight } from "lucide-react";
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

interface PopularProductsProps {
  currentProductId: number;
  limit?: number;
}

export default function PopularProducts({ currentProductId, limit = 6 }: PopularProductsProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [, navigate] = useLocation();

  useEffect(() => {
    // Fetch popular products (excluding current product)
    // In a real app, this would be based on views/sales/ratings
    fetch(`/api/products?limit=${limit + 2}&exclude=${currentProductId}`)
      .then(response => response.json())
      .then(data => {
        // Extract products from paginated response or direct array
        const productList = data.products || data;
        // Simulate popularity by taking first few products (in real app would be ordered by popularity)
        setProducts(productList.slice(0, limit));
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching popular products:', error);
        setLoading(false);
      });
  }, [currentProductId, limit]);

  const handleProductClick = (slug: string) => {
    navigate(`/product/${slug}`);
  };

  const handleViewAll = () => {
    navigate('/products');
  };

  if (loading) {
    return (
      <Card className="mt-6">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-orange-600" />
              Popular Products
            </h3>
          </div>
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex gap-3 p-3 border border-gray-200 rounded-lg">
                <div className="w-16 h-16 bg-gray-200 rounded-lg animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
                  <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2" />
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-1/4" />
                </div>
              </div>
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
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-orange-600" />
            Popular Products
          </h3>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleViewAll}
            className="text-green-600 hover:text-green-700 hover:bg-green-50"
          >
            View All
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>

        <div className="space-y-3">
          {products.map((product, index) => {
            const productImage = product.mainImageThumbnail || product.mainImageMedium || product.imageUrl || product.mainImage || (product.galleryImages && product.galleryImages.length > 0 ? product.galleryImages[0] : null);
            const hasImage = !!productImage;

            return (
              <div 
                key={product.id}
                className="flex gap-3 p-3 border border-gray-200 rounded-lg hover:shadow-md hover:border-gray-300 transition-all duration-200 cursor-pointer group"
                onClick={() => handleProductClick(product.slug)}
              >
                {/* Popularity Rank */}
                <div className="flex-shrink-0 w-6 h-6 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-xs font-semibold">
                  {index + 1}
                </div>

                {/* Product Image */}
                <div className="flex-shrink-0 w-16 h-16 relative overflow-hidden rounded-lg bg-gray-100">
                  {hasImage ? (
                    <OptimizedImage
                      src={productImage}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      lazy={true}
                      placeholder={
                        <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                          <div className="text-xs">📷</div>
                        </div>
                      }
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                      <div className="text-xs">📷</div>
                    </div>
                  )}
                  
                  {product.productType && (
                    <Badge className="absolute -top-1 -right-1 bg-green-600 text-xs h-4 px-1">
                      <Leaf className="w-2 h-2" />
                    </Badge>
                  )}
                </div>

                {/* Product Info */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 text-sm line-clamp-2 group-hover:text-green-600 transition-colors">
                    {product.name}
                  </h4>
                  
                  {product.origin && (
                    <p className="text-xs text-gray-500 mt-1">
                      Origin: {product.origin}
                    </p>
                  )}

                  <div className="flex items-center justify-between mt-2">
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

                {/* Arrow Icon */}
                <div className="flex-shrink-0 flex items-center">
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-green-600 transition-colors" />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}