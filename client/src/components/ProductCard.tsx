import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import InquiryForm from "./InquiryForm";
import OptimizedImage from "./OptimizedImage";
import { Shield, Leaf, Award, Star, Heart, MessageSquare } from "lucide-react";
import type { Product, ProductType } from "@shared/schema";
import { PrimaryProductType } from "./ProductTypeDisplay";

interface ProductCardProps {
  product: Product & { 
    primaryType?: ProductType | null;
    tags?: Array<{id: number; name: string; slug: string; color?: string; description?: string;}>;
  };
}

export default function ProductCard({ product }: ProductCardProps) {
  // Get the product image - prioritize WebP fields over legacy fields
  const galleryImages = product.galleryImages as string[] | null;
  const productImage = product.mainImageMedium || product.mainImageThumbnail || product.mainImage || (galleryImages && galleryImages.length > 0 ? galleryImages[0] : null);
  const hasImage = !!productImage;

  return (
    <Card className="group hover:shadow-lg transition-all duration-200">
      <Link href={`/products/${product.slug}`}>
        <div className="cursor-pointer">
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
            {product.primaryType && (
              <div className="absolute top-1 sm:top-2 left-1 sm:left-2">
                <PrimaryProductType 
                  types={[{...product.primaryType, isPrimary: true}]} 
                  size="sm"
                  className="shadow-sm"
                />
              </div>
            )}
            <div className="absolute top-1 sm:top-2 right-1 sm:right-2">
              <Button size="sm" variant="secondary" className="h-6 w-6 sm:h-8 sm:w-8 p-0">
                <Heart className="w-3 h-3 sm:w-4 sm:h-4" />
              </Button>
            </div>
          </div>
          
          <CardContent className="p-3 sm:p-4">
            <div className="space-y-2">
              <h3 className="font-semibold text-gray-900 text-sm sm:text-base line-clamp-2">
                {product.name}
              </h3>

              <p className="text-xs sm:text-sm text-gray-600">
                SKU: {product.productId}
              </p>

              {product.botanicalName && (
                <p className="text-xs text-gray-500 italic line-clamp-1">
                  {product.botanicalName}
                </p>
              )}

              {product.origin && (
                <p className="text-xs sm:text-sm text-gray-600">
                  Origin: {product.origin}
                </p>
              )}

              {/* Price and MOQ */}
              <div className="flex justify-between items-center pt-2">
                <div>
                  <div className="text-lg font-bold text-green-600">
                    ${product.priceUSD || 'Contact'}
                  </div>
                  <div className="text-xs text-gray-500">
                    per {product.priceUnit || 'kg'}
                  </div>
                </div>
                {product.moq && (
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded whitespace-nowrap">
                    MOQ: {product.moq} kg
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </div>
      </Link>
      
      <CardContent className="px-3 sm:px-4 pb-3 sm:pb-4 pt-0">
        <div className="flex space-x-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button className="flex-1 bg-green-600 hover:bg-green-700 text-xs sm:text-sm py-2">
                <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                <span className="hidden sm:inline">Get Quote</span>
                <span className="sm:hidden">Quote</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Request Quote for {product.name}</DialogTitle>
              </DialogHeader>
              <InquiryForm product={product} />
            </DialogContent>
          </Dialog>
          
          <Button variant="outline" size="sm" className="text-sm">
            Sample
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
