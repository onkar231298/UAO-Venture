import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import InquiryForm from "./InquiryForm";
import OptimizedImage from "./OptimizedImage";
import { Shield, Leaf, Award, Star, Heart, MessageSquare, ShoppingCart } from "lucide-react";
import type { Product } from "@shared/schema";

interface ProductSlideCardProps {
  product: Product;
}

export default function ProductSlideCard({ product }: ProductSlideCardProps) {
  // Get the product image - prioritize WebP fields over legacy fields
  const productImage = product.mainImageMedium || product.mainImageThumbnail || product.mainImage || (product.galleryImages && Array.isArray(product.galleryImages) && product.galleryImages.length > 0 ? product.galleryImages[0] : null);
  const hasImage = !!productImage;

  // Format price for display
  const formatPrice = (price: number | null | undefined, currency: string = 'USD') => {
    if (!price) return 'Quote on Request';
    
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
    
    return formatter.format(price);
  };

  const displayPrice = product.priceUSD || product.basePrice;

  return (
    <Card className="group hover:shadow-xl transition-all duration-300 border-0 shadow-md bg-white overflow-hidden h-full">
      <Link href={`/product/${product.slug}`}>
        <div className="cursor-pointer">
          <div className="relative overflow-hidden bg-gray-100">
            {hasImage ? (
              <OptimizedImage
                src={productImage}
                alt={product.name}
                className="w-full aspect-square object-cover group-hover:scale-110 transition-transform duration-500"
                lazy={true}
                placeholder={
                  <div className="w-full aspect-square flex items-center justify-center bg-gray-100 text-gray-400 animate-pulse">
                    <div className="text-center">
                      <div className="text-2xl mb-2">📷</div>
                      <div className="text-sm font-medium">Loading...</div>
                    </div>
                  </div>
                }
              />
            ) : (
              <div className="w-full aspect-square flex items-center justify-center bg-gray-100 text-gray-400">
                <div className="text-center">
                  <div className="text-2xl mb-2">📷</div>
                  <div className="text-sm font-medium">No Preview</div>
                </div>
              </div>
            )}
            
            {/* Product Type Badge */}
            {product.productType && (
              <Badge className="absolute top-2 left-2 bg-green-600 text-white text-xs font-semibold">
                <Leaf className="w-3 h-3 mr-1" />
                {product.productType === 'organic' ? 'Organic' :
                 product.productType === 'natural' ? 'Natural' :
                 product.productType === 'conventional' ? 'Conventional' :
                 product.productType === 'synthetic' ? 'Synthetic' :
                 product.productType === 'nature_identical' ? 'Nature ID' :
                 'Organic'}
              </Badge>
            )}

            {/* Sample Available Badge */}
            {product.sampleAvailable && (
              <Badge className="absolute top-2 right-2 bg-blue-600 text-white text-xs">
                Sample Available
              </Badge>
            )}

            {/* Wishlist Button */}
            <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <Button size="sm" variant="secondary" className="h-8 w-8 p-0 bg-white/90 hover:bg-white">
                <Heart className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </Link>

      <CardContent className="p-4 flex flex-col h-full">
        <div className="flex-1">
          <Link href={`/product/${product.slug}`}>
            <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 hover:text-green-600 transition-colors cursor-pointer">
              {product.name}
            </h3>
          </Link>
          
          {product.botanicalName && (
            <p className="text-sm text-gray-500 italic mb-2">{product.botanicalName}</p>
          )}

          {/* Key Features */}
          <div className="flex flex-wrap gap-1 mb-3">
            {product.isOrganic && (
              <Badge variant="outline" className="text-xs border-green-200 text-green-700">
                <Shield className="w-2 h-2 mr-1" />
                Certified
              </Badge>
            )}
            {product.form && (
              <Badge variant="outline" className="text-xs">
                {product.form}
              </Badge>
            )}
            {product.origin && (
              <Badge variant="outline" className="text-xs text-gray-600">
                {product.origin}
              </Badge>
            )}
          </div>

          {/* Price */}
          <div className="mb-4">
            <div className="text-lg font-bold text-green-600">
              {formatPrice(displayPrice)}
              {displayPrice && (
                <span className="text-sm font-normal text-gray-500 ml-1">
                  /{product.stockUnit || 'kg'}
                </span>
              )}
            </div>
            {product.moq && (
              <p className="text-xs text-gray-500">MOQ: {product.moq} {product.stockUnit || 'kg'}</p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2 border-t border-gray-100">
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm" className="flex-1 bg-green-600 hover:bg-green-700">
                <MessageSquare className="w-4 h-4 mr-2" />
                Inquire
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Product Inquiry - {product.name}</DialogTitle>
              </DialogHeader>
              <InquiryForm product={product} />
            </DialogContent>
          </Dialog>
          
          <Link href={`/product/${product.slug}`}>
            <Button size="sm" variant="outline" className="px-3">
              <ShoppingCart className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}