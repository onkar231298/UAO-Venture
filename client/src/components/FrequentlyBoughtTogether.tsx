import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import OptimizedImage from "./OptimizedImage";
import { Package, ChevronRight } from "lucide-react";
import { Link } from "wouter";
import type { Product } from "@shared/schema";

interface FrequentlyBoughtTogetherProps {
  currentProduct: Product;
  maxItems?: number;
}

export default function FrequentlyBoughtTogether({ currentProduct, maxItems = 3 }: FrequentlyBoughtTogetherProps) {
  // Fetch frequently bought together products
  const { data: productsData, isLoading } = useQuery<{ products: Product[]; total: number }>({
    queryKey: ["/api/products", "frequently-bought", currentProduct.id],
    queryFn: async () => {
      const params = new URLSearchParams();
      
      // Use category and similar characteristics to find complementary products
      if (currentProduct.categoryName) {
        // Look for products in related categories
        const relatedCategories = getRelatedCategories(currentProduct.categoryName);
        params.append('category', relatedCategories.join(','));
      }
      
      // Different product types that complement each other
      if (currentProduct.productType === 'organic') {
        params.append('productType', 'organic,natural');
      }
      
      params.append('limit', (maxItems * 2).toString());
      params.append('sortBy', 'popular');
      
      const response = await fetch(`/api/products?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch complementary products');
      const data = await response.json();
      
      // Filter out current product and get complementary products
      const complementaryProducts = data.products
        .filter((p: Product) => p.id !== currentProduct.id)
        .filter((p: Product) => isComplementaryProduct(currentProduct, p))
        .slice(0, maxItems);
      
      return {
        products: complementaryProducts,
        total: complementaryProducts.length
      };
    },
  });

  const complementaryProducts = productsData?.products || [];

  if (isLoading) {
    return (
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-green-500" />
            Frequently Bought Together
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 overflow-x-auto">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex-none w-48 animate-pulse">
                <div className="aspect-square bg-gray-200 rounded-lg mb-2"></div>
                <div className="h-3 bg-gray-200 rounded mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (complementaryProducts.length === 0) {
    return null;
  }

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5 text-green-500" />
          Frequently Bought Together
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Mobile: Horizontal scroll */}
        <div className="block sm:hidden">
          <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory">
            {complementaryProducts.map((product) => (
              <div key={product.id} className="flex-none w-48 snap-start">
                <Link href={`/product/${product.slug}`}>
                  <div className="border rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer touch-manipulation active:scale-95 transition-transform duration-150">
                    <div className="aspect-square mb-3 bg-gray-100 rounded-lg overflow-hidden">
                      {product.mainImageMedium || product.mainImageThumbnail || product.mainImage ? (
                        <OptimizedImage
                          src={product.mainImageMedium || product.mainImageThumbnail || product.mainImage || ''}
                          alt={product.name}
                          className="w-full h-full object-cover"
                          lazy={true}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <div className="text-center">
                            <div className="text-xl mb-1">📦</div>
                            <div className="text-xs">No Image</div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <h4 className="font-medium text-sm line-clamp-2 mb-1">{product.name}</h4>
                    <p className="text-xs text-gray-500 mb-2">SKU: {product.productId}</p>
                    
                    {product.productType && (
                      <Badge variant="outline" className="text-xs">
                        {product.productType}
                      </Badge>
                    )}
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Desktop: Grid */}
        <div className="hidden sm:grid sm:grid-cols-3 gap-4">
          {complementaryProducts.map((product) => (
            <Link key={product.id} href={`/product/${product.slug}`}>
              <div className="border rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer">
                <div className="aspect-square mb-3 bg-gray-100 rounded-lg overflow-hidden">
                  {product.mainImageMedium || product.mainImageThumbnail || product.mainImage ? (
                    <OptimizedImage
                      src={product.mainImageMedium || product.mainImageThumbnail || product.mainImage || ''}
                      alt={product.name}
                      className="w-full h-full object-cover"
                      lazy={true}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <div className="text-center">
                        <div className="text-2xl mb-2">📦</div>
                        <div className="text-xs">No Image</div>
                      </div>
                    </div>
                  )}
                </div>
                
                <h4 className="font-medium text-sm line-clamp-2 mb-1">{product.name}</h4>
                <p className="text-xs text-gray-500 mb-2">SKU: {product.productId}</p>
                
                {product.productType && (
                  <Badge variant="outline" className="text-xs">
                    {product.productType}
                  </Badge>
                )}
              </div>
            </Link>
          ))}
        </div>

        {/* Show more link */}
        {complementaryProducts.length >= maxItems && currentProduct.categoryName && (
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

// Helper functions
function getRelatedCategories(categoryName: string): string[] {
  const categoryMap: Record<string, string[]> = {
    'Herbal Powders': ['Spices', 'Adaptogenic Herbs', 'Ayurvedic Herbs'],
    'Spices': ['Herbal Powders', 'Essential Oils', 'Seasoning Blends'],
    'Essential Oils': ['Aromatherapy', 'Natural Extracts', 'Fragrance Oils'],
    'Adaptogenic Herbs': ['Herbal Powders', 'Wellness Products', 'Functional Ingredients'],
    'Ayurvedic Herbs': ['Herbal Powders', 'Traditional Medicine', 'Wellness Products'],
  };
  
  return categoryMap[categoryName] || [categoryName];
}

function isComplementaryProduct(currentProduct: Product, otherProduct: Product): boolean {
  // Logic to determine if products complement each other
  
  // Same category products are complementary
  if (currentProduct.categoryName === otherProduct.categoryName) {
    return true;
  }
  
  // Products with complementary health benefits
  if (currentProduct.healthSupport && otherProduct.healthSupport) {
    const currentBenefits = Array.isArray(currentProduct.healthSupport) 
      ? currentProduct.healthSupport 
      : [currentProduct.healthSupport];
    const otherBenefits = Array.isArray(otherProduct.healthSupport) 
      ? otherProduct.healthSupport 
      : [otherProduct.healthSupport];
    
    // Check for complementary health benefits
    const complementaryPairs = [
      ['Immune Support', 'Antioxidant'],
      ['Digestive Health', 'Anti-inflammatory'],
      ['Energy Boost', 'Stress Relief'],
      ['Heart Health', 'Circulation Support'],
    ];
    
    for (const [benefit1, benefit2] of complementaryPairs) {
      if ((currentBenefits.includes(benefit1) && otherBenefits.includes(benefit2)) ||
          (currentBenefits.includes(benefit2) && otherBenefits.includes(benefit1))) {
        return true;
      }
    }
  }
  
  // Different forms of similar products (powder + extract, etc.)
  if (currentProduct.form !== otherProduct.form && 
      currentProduct.botanicalName === otherProduct.botanicalName) {
    return true;
  }
  
  return false;
}