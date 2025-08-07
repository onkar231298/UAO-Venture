import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, ShoppingCart } from "lucide-react";
import { Link } from "wouter";
import type { Product } from "@shared/schema";

interface FrequentlyBoughtTogetherProps {
  currentProduct: Product;
}

export default function FrequentlyBoughtTogether({ currentProduct }: FrequentlyBoughtTogetherProps) {
  // Get related products from the same category or similar products
  const { data: relatedProducts } = useQuery<{ products: Product[]; total: number }>({
    queryKey: ["/api/products", { 
      categoryId: currentProduct.categoryId, 
      limit: 3,
      excludeId: currentProduct.id 
    }],
  });

  if (!relatedProducts?.products?.length) return null;

  const selectedProducts = relatedProducts.products.slice(0, 3);

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <ShoppingCart className="w-5 h-5 text-green-600" />
          Frequently Bought Together
        </CardTitle>
        <p className="text-sm text-gray-600">
          Customers who bought this item also purchased these products
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Current product */}
          <div className="flex items-center gap-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="w-16 h-16 bg-white rounded-lg overflow-hidden flex-shrink-0">
              {currentProduct.mainImageMedium ? (
                <img 
                  src={currentProduct.mainImageMedium} 
                  alt={currentProduct.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                  <span className="text-gray-400 text-xs">No Image</span>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-gray-900 truncate">{currentProduct.name}</h4>
              <p className="text-sm text-gray-600">Current Product</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="text-xs">
                  {currentProduct.categoryName}
                </Badge>
              </div>
            </div>
          </div>

          {/* Plus icon */}
          <div className="flex justify-center">
            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
              <Plus className="w-4 h-4 text-gray-600" />
            </div>
          </div>

          {/* Related products */}
          <div className="space-y-3">
            {selectedProducts.map((product) => (
              <div key={product.id} className="flex items-center gap-4 p-3 border border-gray-200 rounded-lg hover:border-green-300 transition-colors">
                <div className="w-16 h-16 bg-gray-50 rounded-lg overflow-hidden flex-shrink-0">
                  {product.mainImageMedium ? (
                    <img 
                      src={product.mainImageMedium} 
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                      <span className="text-gray-400 text-xs">No Image</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <Link href={`/product/${product.slug}`}>
                    <h4 className="font-medium text-gray-900 hover:text-green-600 truncate cursor-pointer">
                      {product.name}
                    </h4>
                  </Link>
                  <p className="text-sm text-gray-600 truncate">{product.description}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {product.categoryName}
                    </Badge>
                    {product.moq && (
                      <span className="text-xs text-gray-500">MOQ: {product.moq} {product.stockUnit}</span>
                    )}
                  </div>
                </div>
                <Link href={`/product/${product.slug}`}>
                  <Button variant="outline" size="sm" className="text-xs">
                    View
                  </Button>
                </Link>
              </div>
            ))}
          </div>

          {/* Total info */}
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-900">
                Bundle of {selectedProducts.length + 1} products
              </span>
              <Button size="sm" className="bg-green-600 hover:bg-green-700">
                <ShoppingCart className="w-4 h-4 mr-2" />
                Request Quote for All
              </Button>
            </div>
            <p className="text-xs text-gray-600 mt-1">
              Get better pricing on bulk orders of related products
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}