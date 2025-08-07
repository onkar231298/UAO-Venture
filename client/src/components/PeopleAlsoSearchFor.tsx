import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, TrendingUp, ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "wouter";
import ProductCard from "@/components/ProductCard";
import type { Product } from "@shared/schema";

interface PeopleAlsoSearchForProps {
  currentProduct: Product;
}

export default function PeopleAlsoSearchFor({ currentProduct }: PeopleAlsoSearchForProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  
  // Get products with similar keywords or from related categories
  const { data: searchedProducts } = useQuery<{ products: Product[]; total: number }>({
    queryKey: ["/api/products", { 
      limit: 10,
      excludeId: currentProduct.id,
      // This could be enhanced with actual search analytics
      sortBy: "popular" 
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

  if (!searchedProducts?.products?.length) return null;

  const products = searchedProducts.products;
  const maxIndex = Math.max(0, products.length - itemsPerView);

  // Auto slide functionality - right to left
  useEffect(() => {
    if (isHovering || products.length <= itemsPerView) return;

    const interval = setInterval(() => {
      setCurrentIndex(prev => prev >= maxIndex ? 0 : prev + 1);
    }, 4500);

    return () => clearInterval(interval);
  }, [isHovering, maxIndex, products.length, itemsPerView]);

  const slideNext = () => {
    setCurrentIndex(prev => Math.min(prev + 1, maxIndex));
  };

  const slidePrev = () => {
    setCurrentIndex(prev => Math.max(prev - 1, 0));
  };

  // Generate search terms based on current product
  const getSearchTerms = () => {
    const terms = [];
    
    // Add category-based terms
    if (currentProduct.categoryName) {
      terms.push(currentProduct.categoryName);
    }
    
    // Add form-based terms  
    if (currentProduct.form) {
      terms.push(`${currentProduct.form} products`);
    }
    
    // Add health support terms
    if (currentProduct.healthSupport) {
      terms.push(currentProduct.healthSupport);
    }
    
    // Add origin-based terms
    if (currentProduct.origin) {
      terms.push(`${currentProduct.origin} herbs`);
    }
    
    // Generic related terms
    terms.push("organic herbs", "natural extracts", "herbal supplements");
    
    return terms.slice(0, 8); // Limit to 8 terms
  };

  const searchTerms = getSearchTerms();

  return (
    <div className="space-y-6">
      {/* People Also Search For - Products with Slider */}
      <Card 
        className="mt-6"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Search className="w-5 h-5 text-blue-600" />
                People Also Search For
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Discover related products our customers frequently explore
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
                    index === currentIndex ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Popular Search Terms */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-orange-600" />
            Popular Search Terms
          </CardTitle>
          <p className="text-sm text-gray-600">
            Trending keywords related to this product
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {searchTerms.map((term, index) => (
              <Link key={index} href={`/products?search=${encodeURIComponent(term)}`}>
                <Badge 
                  variant="secondary" 
                  className="cursor-pointer hover:bg-green-100 hover:text-green-800 transition-colors"
                >
                  <Search className="w-3 h-3 mr-1" />
                  {term}
                </Badge>
              </Link>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-3">
            Click on any term to search for related products
          </p>
        </CardContent>
      </Card>
    </div>
  );
}