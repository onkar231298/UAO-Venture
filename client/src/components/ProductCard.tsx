import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import InquiryForm from "./InquiryForm";
import { Shield, Leaf, Award, Star, Heart, MessageSquare } from "lucide-react";
import type { Product } from "@shared/schema";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  // Get the first image from the product images array, or null if no images
  const productImages = product.images as string[] | null;
  const hasImage = productImages && productImages.length > 0;
  const productImage = hasImage ? productImages[0] : null;

  return (
    <Card className="group hover:shadow-lg transition-all duration-200">
      <Link href={`/product/${product.slug}`}>
        <div className="cursor-pointer">
          <div className="relative overflow-hidden rounded-t-xl bg-gray-100">
            {hasImage ? (
              <img
                src={productImage}
                alt={product.name}
                className="w-full h-36 sm:h-40 md:h-48 object-cover group-hover:scale-105 transition-transform duration-200"
                onError={(e) => {
                  // If image fails to load, show placeholder
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling!.classList.remove('hidden');
                }}
              />
            ) : null}
            <div className={`${hasImage ? 'hidden' : 'flex'} w-full h-36 sm:h-40 md:h-48 items-center justify-center bg-gray-100 text-gray-400`}>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl mb-2">📷</div>
                <div className="text-xs sm:text-sm font-medium">No Preview Available</div>
              </div>
            </div>
            {product.isOrganic && (
              <Badge className="absolute top-1 sm:top-2 left-1 sm:left-2 bg-green-600 text-xs">
                <Leaf className="w-2 h-2 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" />
                <span className="hidden sm:inline">Organic</span>
                <span className="sm:hidden">Org</span>
              </Badge>
            )}
            <div className="absolute top-1 sm:top-2 right-1 sm:right-2">
              <Button size="sm" variant="secondary" className="h-6 w-6 sm:h-8 sm:w-8 p-0">
                <Heart className="w-3 h-3 sm:w-4 sm:h-4" />
              </Button>
            </div>
          </div>
          
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center space-x-1 sm:space-x-2 mb-2">
              <span className="text-xs text-gray-500">In Stock</span>
              <div className="flex space-x-1">
                {product.certifications && (product.certifications as string[]).slice(0, 3).map((cert, index) => {
                  if (cert.includes('USDA')) return <Shield key={index} className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" />;
                  if (cert.includes('Organic')) return <Leaf key={index} className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" />;
                  if (cert.includes('ISO')) return <Award key={index} className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500" />;
                  if (cert.includes('Kosher')) return <Star key={index} className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500" />;
                  return null;
                })}
              </div>
            </div>
            
            <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2 text-sm sm:text-base">{product.name}</h3>
            <p className="text-xs sm:text-sm text-gray-600 mb-2">SKU: {product.productId}</p>
            
            {product.botanicalName && (
              <p className="text-xs text-gray-500 mb-2 sm:mb-3 italic line-clamp-1">{product.botanicalName}</p>
            )}
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
