import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShoppingCart, Eye, Package, Leaf } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { Product } from "@shared/schema";

interface ProductGroupCardProps {
  products: Product[];
  groupId: string;
}

export default function ProductGroupCard({ products, groupId }: ProductGroupCardProps) {
  const [selectedVariant, setSelectedVariant] = useState(0);
  
  if (!products.length) return null;

  // Group products by similar characteristics (same form, grade, etc.)
  const productVariants = products.filter(p => p.form === primaryProduct.form && p.productGrade === primaryProduct.productGrade);
  
  // Get the primary product (first product) for main display
  const primaryProduct = products[selectedVariant] || products[0];
  
  const { data: currency = 'USD' } = useQuery<string>({
    queryKey: ['/api/detect-currency'],
    staleTime: 5 * 60 * 1000,
  });

  // Format price based on currency
  const formatPrice = (price: number) => {
    if (currency === 'INR') {
      return `₹${price.toLocaleString('en-IN')}`;
    }
    return `$${price.toFixed(2)}`;
  };

  const handleVariantChange = (index: number) => {
    setSelectedVariant(index);
  };

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 h-full border border-gray-200">
      <CardContent className="p-4">
        {/* Product Image */}
        <div className="relative mb-4 overflow-hidden rounded-lg bg-gray-100 aspect-square">
          {primaryProduct.imageUrl ? (
            <img
              src={primaryProduct.imageUrl}
              alt={primaryProduct.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-200">
              <Package className="w-16 h-16 text-gray-400" />
            </div>
          )}
          
          {/* Variant Count Badge */}
          <div className="absolute top-2 right-2">
            <Badge variant="secondary" className="text-xs">
              {products.length} Variants
            </Badge>
          </div>
        </div>

        {/* Product Info */}
        <div className="space-y-3">
          {/* Product Name */}
          <h3 className="font-semibold text-lg text-gray-900 line-clamp-2 group-hover:text-green-600 transition-colors">
            {primaryProduct.name}
          </h3>

          {/* Variant Selector - For different package sizes, grades, etc. */}
          {products.length > 1 && (
            <div className="flex flex-wrap gap-1">
              {products.map((product, index) => (
                <Button
                  key={product.id}
                  size="sm"
                  variant={selectedVariant === index ? 'default' : 'outline'}
                  onClick={() => handleVariantChange(index)}
                  className="text-xs h-8 flex-1 min-w-0"
                >
                  {product.packingSize || product.productGrade || `Variant ${index + 1}`}
                </Button>
              ))}
            </div>
          )}

          {/* Product Details */}
          <div className="space-y-2">
            {/* Product Type & Grade */}
            <div className="flex flex-wrap gap-1">
              <Badge 
                variant={primaryProduct.isOrganic ? "default" : "secondary"}
                className={`text-xs ${primaryProduct.isOrganic ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}
              >
                {primaryProduct.isOrganic ? 'Organic' : 'Conventional'}
              </Badge>
              {primaryProduct.productGrade && (
                <Badge variant="outline" className="text-xs">
                  {primaryProduct.productGrade}
                </Badge>
              )}
            </div>

            {/* Botanical Name */}
            {primaryProduct.botanicalName && (
              <p className="text-sm text-gray-600 italic">
                {primaryProduct.botanicalName}
              </p>
            )}

            {/* Form & Origin */}
            <div className="text-xs text-gray-500 space-y-1">
              {primaryProduct.form && (
                <div>Form: <span className="font-medium">{primaryProduct.form}</span></div>
              )}
              {primaryProduct.origin && (
                <div>Origin: <span className="font-medium">{primaryProduct.origin}</span></div>
              )}
            </div>

            {/* Price */}
            {primaryProduct.basePrice && (
              <div className="text-lg font-bold text-green-600">
                {formatPrice(Number(primaryProduct.basePrice))}
                {primaryProduct.stockUnit && (
                  <span className="text-sm text-gray-500 font-normal">/{primaryProduct.stockUnit}</span>
                )}
              </div>
            )}

            {/* MOQ */}
            {primaryProduct.moq && (
              <div className="text-xs text-gray-600">
                MOQ: {primaryProduct.moq} {primaryProduct.stockUnit}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button 
              size="sm" 
              className="flex-1 text-xs bg-green-600 hover:bg-green-700"
              onClick={() => window.location.href = `/ingredients/${primaryProduct.slug}`}
            >
              <Eye className="w-3 h-3 mr-1" />
              View Details
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              className="flex-1 text-xs"
              onClick={() => {
                // Add to cart or inquiry logic here
                console.log('Add to inquiry:', primaryProduct.productId);
              }}
            >
              <ShoppingCart className="w-3 h-3 mr-1" />
              Inquiry
            </Button>
          </div>

          {/* Availability Status */}
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${
                Number(primaryProduct.currentStock) > 0 ? 'bg-green-500' : 'bg-red-500'
              }`}></div>
              {Number(primaryProduct.currentStock) > 0 ? 'In Stock' : 'Out of Stock'}
            </div>
            {primaryProduct.leadTime && (
              <div>Lead Time: {primaryProduct.leadTime}</div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}