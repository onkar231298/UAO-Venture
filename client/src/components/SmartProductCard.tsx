import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import InquiryForm from "./InquiryForm";
import OptimizedImage from "./OptimizedImage";
import { Shield, Leaf, Award, Star, Heart, MessageSquare } from "lucide-react";
import type { Product } from "@shared/schema";

interface SmartProductCardProps {
  product: Product;
  priority?: boolean; // For above-the-fold products (first 4-6)
  index?: number; // Product position for progressive loading
}

export default function SmartProductCard({ 
  product, 
  priority = false, 
  index = 0 
}: SmartProductCardProps) {
  // Get the first image from mainImage field or images array
  const mainImage = (product as any).mainImage;
  const productImages = product.images as string[] | null;
  const productImage = mainImage || (productImages && productImages.length > 0 ? productImages[0] : null);
  const hasImage = !!productImage;

  // Smart loading strategy:
  // - Priority for first 4 products (above-the-fold)
  // - Lazy loading for products beyond position 4
  const shouldPrioritize = priority || index < 4;

  return (
    <Card className="group hover:shadow-lg transition-all duration-200">
      <Link href={`/product/${product.slug}`}>
        <div className="cursor-pointer">
          <div className="relative overflow-hidden rounded-t-xl bg-gray-100">
            {hasImage ? (
              <OptimizedImage
                src={productImage}
                alt={product.name}
                className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-200"
                priority={shouldPrioritize}
                lazy={!shouldPrioritize}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                placeholder={
                  <div className={`w-full aspect-square flex items-center justify-center ${
                    shouldPrioritize 
                      ? 'bg-gradient-to-br from-green-50 to-emerald-100 text-green-400' 
                      : 'bg-gradient-to-br from-gray-50 to-gray-100 text-gray-400'
                  } animate-pulse`}>
                    <div className="text-center">
                      <div className={`text-2xl sm:text-3xl mb-2 ${shouldPrioritize ? 'animate-bounce' : ''}`}>
                        {shouldPrioritize ? '🌿' : '📷'}
                      </div>
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
            
            {/* Premium badge for high-quality products */}
            {product.isOrganic && (
              <Badge className="absolute top-2 left-2 bg-green-600 text-white text-xs">
                <Leaf className="w-3 h-3 mr-1" />
                Organic
              </Badge>
            )}
            
            {/* Quality certifications */}
            {product.certifications && Array.isArray(product.certifications) && product.certifications.length > 0 && (
              <Badge className="absolute top-2 right-2 bg-blue-600 text-white text-xs">
                <Shield className="w-3 h-3 mr-1" />
                Certified
              </Badge>
            )}
          </div>
          
          <CardContent className="p-3 sm:p-4">
            <div className="space-y-2 sm:space-y-3">
              <div>
                <h3 className="font-semibold text-gray-900 text-sm sm:text-base line-clamp-2 group-hover:text-green-600 transition-colors">
                  {product.name}
                </h3>
                {product.botanicalName && (
                  <p className="text-xs text-gray-500 italic mt-1">
                    {product.botanicalName}
                  </p>
                )}
              </div>
              
              <div className="flex flex-wrap gap-1">
                {product.form && (
                  <Badge variant="secondary" className="text-xs">
                    {product.form}
                  </Badge>
                )}
                {product.origin && (
                  <Badge variant="outline" className="text-xs">
                    {product.origin}
                  </Badge>
                )}
              </div>
              
              <div className="flex justify-between items-center pt-2">
                <div className="flex items-center space-x-1 text-yellow-500">
                  <Star className="w-3 h-3 sm:w-4 sm:h-4 fill-current" />
                  <Star className="w-3 h-3 sm:w-4 sm:h-4 fill-current" />
                  <Star className="w-3 h-3 sm:w-4 sm:h-4 fill-current" />
                  <Star className="w-3 h-3 sm:w-4 sm:h-4 fill-current" />
                  <Star className="w-3 h-3 sm:w-4 sm:h-4 fill-current" />
                  <span className="text-xs text-gray-600 ml-1">5.0</span>
                </div>
                
                <div className="flex space-x-1">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="text-xs px-2 py-1 h-7"
                        onClick={(e) => e.preventDefault()}
                      >
                        <MessageSquare className="w-3 h-3 mr-1" />
                        Inquire
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Product Inquiry - {product.name}</DialogTitle>
                      </DialogHeader>
                      <InquiryForm />
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </div>
          </CardContent>
        </div>
      </Link>
    </Card>
  );
}