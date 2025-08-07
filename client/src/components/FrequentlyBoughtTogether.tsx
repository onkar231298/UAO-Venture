import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import InquiryForm from './InquiryForm';
import OptimizedImage from './OptimizedImage';
import { Plus, ShoppingCart, MessageSquare, Package2 } from 'lucide-react';
import type { Product } from '@shared/schema';

interface FrequentlyBoughtTogetherProps {
  productId: number;
  currentProduct: Product;
  className?: string;
}

export default function FrequentlyBoughtTogether({ 
  productId, 
  currentProduct, 
  className = "" 
}: FrequentlyBoughtTogetherProps) {
  // Fetch frequently bought together products
  const { data: relatedProducts = [], isLoading } = useQuery<Product[]>({
    queryKey: ['/api/products/frequently-bought', productId],
    queryFn: async () => {
      // For now, get similar products from same category
      const params = new URLSearchParams({
        limit: '3',
        ...(currentProduct.categoryId && { categoryId: currentProduct.categoryId.toString() }),
        exclude: productId.toString()
      });
      
      const response = await fetch(`/api/products?${params}`);
      if (!response.ok) throw new Error('Failed to fetch related products');
      const data = await response.json();
      return data.products || [];
    },
    enabled: !!productId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

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

  // Calculate total price
  const calculateTotal = () => {
    const currentPrice = Number(currentProduct.priceUSD || currentProduct.basePrice || 0);
    const relatedPrices = relatedProducts.reduce((sum, product) => {
      const price = Number(product.priceUSD || product.basePrice || 0);
      return sum + price;
    }, 0);
    return currentPrice + relatedPrices;
  };

  if (isLoading) {
    return (
      <section className={`py-8 bg-white ${className}`}>
        <div className="container mx-auto px-4">
          <div className="mb-6">
            <div className="h-6 bg-gray-200 rounded w-64 mb-2 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-96 animate-pulse"></div>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div className="w-48 h-32 bg-gray-200 rounded animate-pulse"></div>
            <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
            <div className="w-48 h-32 bg-gray-200 rounded animate-pulse"></div>
            <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
            <div className="w-48 h-32 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      </section>
    );
  }

  if (!relatedProducts.length) return null;

  const allProducts = [currentProduct, ...relatedProducts];
  const totalPrice = calculateTotal();

  return (
    <section className={`py-8 bg-gray-50 ${className}`}>
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Package2 className="w-6 h-6 text-blue-600" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Frequently Bought Together</h2>
          </div>
          <p className="text-gray-600">
            Customers who bought this item also purchased these products
          </p>
        </div>

        {/* Products Display */}
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex flex-wrap items-center justify-center gap-4 mb-6">
            {allProducts.map((product, index) => {
              const productImage = product.mainImageMedium || product.mainImageThumbnail || product.mainImage || 
                (product.galleryImages && Array.isArray(product.galleryImages) && product.galleryImages.length > 0 ? product.galleryImages[0] : null);
              const displayPrice = Number(product.priceUSD || product.basePrice || 0);
              const isCurrentProduct = product.id === currentProduct.id;

              return (
                <div key={product.id} className="flex items-center">
                  {/* Product Card */}
                  <Card className={`w-48 ${isCurrentProduct ? 'ring-2 ring-green-500' : 'hover:shadow-md'} transition-all duration-200`}>
                    <CardContent className="p-4">
                      <Link href={`/product/${product.slug}`}>
                        <div className="cursor-pointer">
                          {productImage ? (
                            <OptimizedImage
                              src={productImage}
                              alt={product.name}
                              className="w-full h-24 object-cover rounded-lg mb-3"
                              lazy={true}
                            />
                          ) : (
                            <div className="w-full h-24 bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
                              <span className="text-gray-400 text-xs">No Image</span>
                            </div>
                          )}
                          
                          <h3 className="font-semibold text-sm text-gray-900 line-clamp-2 mb-2 hover:text-green-600 transition-colors">
                            {product.name}
                          </h3>
                        </div>
                      </Link>
                      
                      <div className="text-lg font-bold text-green-600 mb-2">
                        {formatPrice(displayPrice)}
                      </div>
                      
                      {isCurrentProduct && (
                        <Badge className="bg-green-100 text-green-800 text-xs">
                          Current Product
                        </Badge>
                      )}
                    </CardContent>
                  </Card>

                  {/* Plus Icon */}
                  {index < allProducts.length - 1 && (
                    <div className="mx-2 flex-shrink-0">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                        <Plus className="w-4 h-4 text-gray-600" />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Total Price and Actions */}
          <div className="border-t pt-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="text-center sm:text-left">
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  Total: {formatPrice(totalPrice)}
                </div>
                <p className="text-sm text-gray-600">
                  Save when buying together
                </p>
              </div>
              
              <div className="flex gap-3">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="lg" className="bg-green-600 hover:bg-green-700">
                      <MessageSquare className="w-5 h-5 mr-2" />
                      Inquire for Bundle
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Bundle Inquiry - {allProducts.length} Products</DialogTitle>
                    </DialogHeader>
                    <InquiryForm 
                      product={currentProduct} 
                    />
                  </DialogContent>
                </Dialog>
                
                <Link href="/products">
                  <Button variant="outline" size="lg">
                    <ShoppingCart className="w-5 h-5 mr-2" />
                    Browse More
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}