import React from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Package, Heart, MessageSquarePlus, ChevronLeft, ChevronRight, Leaf } from "lucide-react";
import Header from "@/components/Header";

interface Product {
  id: number;
  name: string;
  slug: string;
  productId: string;
  description: string | null;
  botanicalName: string | null;
  origin: string | null;
  form: string | null;
  mainImage: string | null;
  galleryImages: string[] | null;
  moq: string | null;
  productType: string | null;
}

export default function ProductDetailSimple() {
  const { slug } = useParams();
  const [currentImageIndex, setCurrentImageIndex] = React.useState(0);

  const { data: product, isLoading } = useQuery<Product>({
    queryKey: [`/api/products/slug/${slug}`],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="p-4 space-y-4">
          <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
          <div className="aspect-square bg-gray-200 rounded animate-pulse"></div>
          <div className="space-y-2">
            <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="p-4 text-center py-12">
          <Package className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Product Not Found</h1>
          <p className="text-gray-600">The product you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  const allImages = [
    ...(product.mainImage ? [product.mainImage] : []),
    ...(product.galleryImages || []),
  ].filter(Boolean);

  const currentImage = allImages[currentImageIndex];

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
  };

  const previousImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Mobile Header */}
      <div className="lg:hidden bg-white border-b px-4 py-3 sticky top-0 z-20">
        <h1 className="text-lg font-semibold text-gray-900 line-clamp-2">{product.name}</h1>
        {product.botanicalName && (
          <p className="text-sm text-gray-500 italic">{product.botanicalName}</p>
        )}
      </div>

      <div className="pb-20 lg:pb-0">
        {/* Product Image Section */}
        <div className="bg-white">
          <div className="relative">
            {currentImage ? (
              <div className="relative">
                <img
                  src={currentImage}
                  alt={`${product.name}`}
                  className="w-full aspect-square object-cover"
                />
                
                {allImages.length > 1 && (
                  <>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white shadow-lg h-10 w-10 p-0"
                      onClick={previousImage}
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white shadow-lg h-10 w-10 p-0"
                      onClick={nextImage}
                    >
                      <ChevronRight className="w-5 h-5" />
                    </Button>
                    <div className="absolute bottom-3 right-3 bg-black/70 text-white text-xs px-3 py-1 rounded-full">
                      {currentImageIndex + 1} / {allImages.length}
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="w-full aspect-square flex items-center justify-center bg-gradient-to-br from-orange-50 to-orange-100">
                <div className="text-center p-6">
                  <div className="w-20 h-20 mx-auto mb-4 bg-orange-200 rounded-full flex items-center justify-center">
                    <Package className="w-10 h-10 text-orange-600" />
                  </div>
                  <div className="text-lg font-semibold text-orange-800 mb-2">{product.name}</div>
                  <div className="text-sm text-orange-600">Premium Quality Product</div>
                </div>
              </div>
            )}
            
            {product.productType && (
              <Badge className="absolute top-3 left-3 bg-green-600 text-white">
                <Leaf className="w-3 h-3 mr-1" />
                {product.productType === 'organic' ? 'Organic' : 'Premium'}
              </Badge>
            )}
          </div>
          
          {/* Image Thumbnails */}
          {allImages.length > 1 && (
            <div className="flex gap-2 p-4 overflow-x-auto">
              {allImages.map((image, index) => (
                <button
                  key={index}
                  className={`flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${
                    index === currentImageIndex 
                      ? 'border-orange-500 ring-2 ring-orange-200' 
                      : 'border-gray-200'
                  }`}
                  onClick={() => setCurrentImageIndex(index)}
                >
                  <img
                    src={image}
                    alt={`Thumbnail ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Details */}
        <div className="bg-white mt-2 p-4 space-y-4">
          {/* Desktop Title - Hidden on mobile */}
          <div className="hidden lg:block">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{product.name}</h1>
            {product.botanicalName && (
              <p className="text-gray-600 italic">{product.botanicalName}</p>
            )}
          </div>
          
          {/* Basic Info */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-500">Product ID:</span>
              <span className="text-sm text-gray-900">{product.productId}</span>
            </div>
            
            {product.origin && (
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-500">Origin:</span>
                <span className="text-sm text-gray-900">{product.origin}</span>
              </div>
            )}
            
            {product.form && (
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-500">Form:</span>
                <span className="text-sm text-gray-900">{product.form}</span>
              </div>
            )}
            
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-500">MOQ:</span>
              <span className="text-sm font-semibold text-orange-600">
                {product.moq || 'Contact for details'}
              </span>
            </div>
          </div>

          {/* Description */}
          {product.description && (
            <div>
              <h3 className="text-base font-semibold text-gray-900 mb-2">Description</h3>
              <p className="text-sm text-gray-700 leading-relaxed">{product.description}</p>
            </div>
          )}
        </div>

        {/* Contact Section */}
        <div className="bg-white mt-2 p-4">
          <h3 className="text-base font-semibold text-gray-900 mb-3">Need More Information?</h3>
          <p className="text-sm text-gray-600 mb-4">
            Contact our team for detailed specifications, pricing, and custom requirements.
          </p>
        </div>
      </div>

      {/* Fixed Bottom CTA - Mobile Only */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t p-4 z-30">
        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" className="h-12">
            <Heart className="w-4 h-4 mr-2" />
            Save Product
          </Button>
          <Button className="h-12 bg-orange-600 hover:bg-orange-700">
            <MessageSquarePlus className="w-4 h-4 mr-2" />
            Get Quote
          </Button>
        </div>
      </div>
    </div>
  );
}