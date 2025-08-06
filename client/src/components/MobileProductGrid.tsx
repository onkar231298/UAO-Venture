
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import InquiryForm from "./InquiryForm";
import OptimizedImage from "./OptimizedImage";
import { Link } from "wouter";
import { Heart, MessageSquare, Leaf, Shield, Award, Star } from "lucide-react";
import type { Product } from "@shared/schema";

interface MobileProductGridProps {
  products: Product[];
  isLoading?: boolean;
}

export default function MobileProductGrid({ products, isLoading }: MobileProductGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <div className="aspect-square bg-gray-200 rounded-t-lg"></div>
            <CardContent className="p-3">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-3/4 mb-3"></div>
              <div className="h-8 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4">
      {products.map((product) => (
        <MobileProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

interface MobileProductCardProps {
  product: Product;
}

function MobileProductCard({ product }: MobileProductCardProps) {
  const productImage = product.mainImageMedium || product.mainImageThumbnail || product.mainImage || 
    (product.galleryImages && Array.isArray(product.galleryImages) && product.galleryImages.length > 0 ? product.galleryImages[0] : null);
  const hasImage = !!productImage;

  return (
    <Card className="group hover:shadow-lg transition-all duration-200 touch-manipulation">
      <Link href={`/product/${product.slug}`}>
        <div className="cursor-pointer active:scale-95 transition-transform duration-150">
          <div className="relative overflow-hidden rounded-t-lg bg-gray-100">
            {hasImage ? (
              <OptimizedImage
                src={productImage}
                alt={product.name}
                className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-200"
                lazy={true}
                placeholder={
                  <div className="w-full aspect-square flex items-center justify-center bg-gray-100 text-gray-400 animate-pulse">
                    <div className="text-center">
                      <div className="text-3xl mb-2">📷</div>
                      <div className="text-sm font-medium">Loading...</div>
                    </div>
                  </div>
                }
              />
            ) : (
              <div className="w-full aspect-square flex items-center justify-center bg-gray-100 text-gray-400">
                <div className="text-center">
                  <div className="text-3xl mb-2">📷</div>
                  <div className="text-sm font-medium">No Preview</div>
                </div>
              </div>
            )}
            
            {/* Product Type Badge */}
            {product.productType && (
              <Badge className="absolute top-2 left-2 bg-green-600 text-xs">
                <Leaf className="w-3 h-3 mr-1" />
                {product.productType === 'organic' ? 'Organic' :
                 product.productType === 'natural' ? 'Natural' :
                 product.productType === 'conventional' ? 'Conv' :
                 'Organic'}
              </Badge>
            )}
            
            {/* Wishlist Button */}
            <div className="absolute top-2 right-2">
              <Button 
                size="sm" 
                variant="secondary" 
                className="h-8 w-8 p-0 touch-manipulation active:scale-90 transition-transform bg-white/80 hover:bg-white"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  // Handle wishlist
                }}
              >
                <Heart className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          <CardContent className="p-3">
            {/* Certifications */}
            <div className="flex items-center space-x-1 mb-2">
              <span className="text-xs text-gray-500">In Stock</span>
              <div className="flex space-x-1">
                {Array.isArray(product.certifications) && product.certifications.slice(0, 2).map((cert, index) => {
                  const certStr = String(cert);
                  if (certStr.includes('USDA')) return <Shield key={index} className="w-3 h-3 text-green-500" />;
                  if (certStr.includes('Organic')) return <Leaf key={index} className="w-3 h-3 text-green-500" />;
                  if (certStr.includes('ISO')) return <Award key={index} className="w-3 h-3 text-blue-500" />;
                  if (certStr.includes('Kosher')) return <Star key={index} className="w-3 h-3 text-yellow-500" />;
                  return null;
                })}
              </div>
            </div>
            
            {/* Product Name */}
            <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2 text-sm leading-tight">
              {product.name}
            </h3>
            
            {/* SKU */}
            <p className="text-xs text-gray-600 mb-2">SKU: {product.productId}</p>
            
            {/* Botanical Name */}
            {product.botanicalName && (
              <p className="text-xs text-gray-500 mb-2 italic line-clamp-1">
                {product.botanicalName}
              </p>
            )}
            
            {/* Tags */}
            {Array.isArray(product.tags) && product.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {product.tags.slice(0, 2).map((tag, index) => (
                  <Badge key={index} variant="outline" className="text-xs px-1 py-0 bg-blue-50 text-blue-700 border-blue-200">
                    {typeof tag === 'string' ? tag : (tag as any)?.name || String(tag)}
                  </Badge>
                ))}
                {product.tags.length > 2 && (
                  <Badge variant="outline" className="text-xs px-1 py-0 bg-gray-50 text-gray-600">
                    +{product.tags.length - 2}
                  </Badge>
                )}
              </div>
            )}
          </CardContent>
        </div>
      </Link>
      
      {/* Action Buttons */}
      <CardContent className="px-3 pb-3 pt-0">
        <div className="flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button className="flex-1 bg-green-600 hover:bg-green-700 active:bg-green-800 text-sm py-2.5 mobile-friendly-button touch-manipulation active:scale-95 transition-all duration-150">
                <MessageSquare className="w-4 h-4 mr-2" />
                Get Quote
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Request Quote for {product.name}</DialogTitle>
              </DialogHeader>
              <InquiryForm product={product} />
            </DialogContent>
          </Dialog>
          
          <Button 
            variant="outline" 
            size="sm" 
            className="px-4 mobile-friendly-button touch-manipulation active:scale-95 transition-all duration-150"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              // Handle sample request
            }}
          >
            Sample
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}