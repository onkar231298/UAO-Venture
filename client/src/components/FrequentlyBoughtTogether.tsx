import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "wouter";
import ProductCard from "@/components/ProductCard";
import type { Product } from "@shared/schema";

interface FrequentlyBoughtTogetherProps {
  currentProduct: Product;
}

export default function FrequentlyBoughtTogether({ currentProduct }: FrequentlyBoughtTogetherProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  
  // Get related products from the same category or similar products
  const { data: relatedProducts } = useQuery<{ products: Product[]; total: number }>({
    queryKey: ["/api/products", { 
      categoryId: currentProduct.categoryId, 
      limit: 8,
      excludeId: currentProduct.id 
    }],
  });

  // Responsive items per view
  const getItemsPerView = () => {
    if (typeof window === 'undefined') return 3;
    if (window.innerWidth < 640) return 1; // mobile
    if (window.innerWidth < 768) return 2; // tablet
    return 3; // desktop
  };

  const [itemsPerView, setItemsPerView] = useState(getItemsPerView);

  useEffect(() => {
    const handleResize = () => setItemsPerView(getItemsPerView());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!relatedProducts?.products?.length) return null;

  const products = relatedProducts.products;
  const maxIndex = Math.max(0, products.length - itemsPerView);

  // Auto slide functionality - right to left
  useEffect(() => {
    if (isHovering || products.length <= itemsPerView) return;

    const interval = setInterval(() => {
      setCurrentIndex(prev => prev >= maxIndex ? 0 : prev + 1);
    }, 4000);

    return () => clearInterval(interval);
  }, [isHovering, maxIndex, products.length, itemsPerView]);

  const slideNext = () => {
    setCurrentIndex(prev => Math.min(prev + 1, maxIndex));
  };

  const slidePrev = () => {
    setCurrentIndex(prev => Math.max(prev - 1, 0));
  };

  return (
    <Card 
      className="mt-6"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-green-600" />
              Frequently Bought Together
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              Customers who bought this item also purchased these products
            </p>
          </div>
          {/* Navigation buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={slidePrev}
              disabled={currentIndex === 0}
              className="p-2"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={slideNext}
              disabled={currentIndex >= maxIndex}
              className="p-2"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Slider container */}
        <div className="overflow-hidden">
          <div 
            className="flex transition-transform duration-500 ease-in-out gap-4"
            style={{ 
              transform: `translateX(-${currentIndex * (100 / itemsPerView)}%)`,
              width: `${(products.length / itemsPerView) * 100}%`
            }}
          >
            {products.map((product) => (
              <div 
                key={product.id} 
                className="flex-shrink-0"
                style={{ width: `${100 / products.length}%` }}
              >
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        </div>
        
        {/* Dots indicator */}
        {maxIndex > 0 && (
          <div className="flex justify-center mt-4 gap-2">
            {Array.from({ length: maxIndex + 1 }).map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentIndex ? 'bg-green-600' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}