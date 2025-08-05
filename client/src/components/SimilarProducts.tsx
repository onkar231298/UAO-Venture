import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import ProductCard from "./ProductCard";
import OptimizedImage from "./OptimizedImage";
import { ChevronRight, Sparkles } from "lucide-react";
import { Link } from "wouter";
import type { Product } from "@shared/schema";

interface SimilarProductsProps {
  currentProduct: Product;
  maxItems?: number;
}

export default function SimilarProducts({ currentProduct, maxItems = 4 }: SimilarProductsProps) {
  // Fetch similar products based on category, tags, and product type
  const { data: productsData, isLoading } = useQuery<{ products: Product[]; total: number }>({
    queryKey: ["/api/products", "similar", currentProduct.id],
    queryFn: async () => {
      const params = new URLSearchParams();
      
      // Add category filter if product has category
      if (currentProduct.categoryName) {
        params.append('category', currentProduct.categoryName);
      }
      
      // Add product type filter
      if (currentProduct.productType) {
        params.append('productType', currentProduct.productType);
      }
      
      // Limit results and exclude current product
      params.append('limit', (maxItems * 2).toString()); // Get more to filter out current
      params.append('sortBy', 'popular');
      
      const response = await fetch(`/api/products?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch similar products');
      const data = await response.json();
      
      // Filter out current product and limit results
      const filteredProducts = data.products
        .filter((p: Product) => p.id !== currentProduct.id)
        .slice(0, maxItems);
      
      return {
        products: filteredProducts,
        total: filteredProducts.length
      };
    },
  });

  const similarProducts = productsData?.products || [];

  if (isLoading) {
    return (
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-500" />
            Similar Products
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-square bg-gray-200 rounded-lg mb-3"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (similarProducts.length === 0) {
    return null;
  }

  return (
    <Card className="mb-8">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-500" />
            Similar Products
          </CardTitle>
          {currentProduct.categoryName && (
            <Link href={`/products?category=${encodeURIComponent(currentProduct.categoryName)}`}>
              <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
                View All <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Mobile: Horizontal scroll */}
        <div className="block sm:hidden">
          <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory">
            {similarProducts.map((product) => (
              <div key={product.id} className="flex-none w-64 snap-start">
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        </div>

        {/* Desktop: Grid */}
        <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {similarProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {/* Show more link */}
        {similarProducts.length >= maxItems && currentProduct.categoryName && (
          <div className="mt-6 pt-4 border-t text-center">
            <Link href={`/products?category=${encodeURIComponent(currentProduct.categoryName)}`}>
              <Button variant="outline" className="text-sm">
                Explore More {currentProduct.categoryName} Products
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}