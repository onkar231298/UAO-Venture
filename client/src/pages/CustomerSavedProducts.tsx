import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { Heart, Package, Eye, Trash2, ShoppingCart } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useCustomerAuth } from "@/hooks/useCustomerAuth";
import { useLocation } from "wouter";
import { useState } from "react";

export default function CustomerSavedProducts() {
  const { customer, isCustomerAuthenticated } = useCustomerAuth();
  const [, setLocation] = useLocation();
  const [savedProducts, setSavedProducts] = useState<any[]>([]);

  // For now, show empty state since wishlist functionality isn't implemented yet
  const isLoading = false;

  if (!isCustomerAuthenticated || !customer) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-8">
          <Card className="max-w-md mx-auto">
            <CardHeader className="text-center">
              <CardTitle>Customer Access Required</CardTitle>
              <CardDescription>Please log in to view your saved products</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button onClick={() => setLocation('/login')} className="min-h-[44px]" data-testid="button-go-to-login">
                Go to Login
              </Button>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4 sm:mb-6">
            <Heart className="w-6 h-6 text-red-600" />
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Saved Products</h1>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4">
                    <div className="h-32 bg-gray-200 rounded mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : savedProducts.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Heart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No saved products yet</h3>
                <p className="text-sm sm:text-base text-gray-600 mb-4">
                  Save products to your wishlist for quick access later.
                </p>
                <Button onClick={() => setLocation('/products')} className="min-h-[44px]" data-testid="button-browse-products">
                  Browse Products
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {savedProducts.map((product: any) => (
                <Card key={product.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4 sm:p-6">
                    <div className="relative mb-4">
                      <div className="w-full h-32 sm:h-40 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Package className="w-8 h-8 text-gray-400" />
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute top-2 right-2 min-h-[44px] min-w-[44px] p-0 bg-white shadow-md hover:bg-red-50"
                        data-testid={`button-remove-product-${product.id}`}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                    
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                      {product.name}
                    </h3>
                    
                    <div className="flex items-center justify-between mb-3">
                      <Badge variant="secondary">{product.category}</Badge>
                      <span className="text-sm text-gray-600">{product.moq}</span>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row items-center gap-2">
                      <Button 
                        size="sm" 
                        className="flex-1 w-full min-h-[44px]"
                        onClick={() => setLocation(`/products/${product.slug}`)}
                        data-testid={`button-view-product-${product.id}`}
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        View
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1 w-full min-h-[44px]" data-testid={`button-inquire-product-${product.id}`}>
                        <ShoppingCart className="w-3 h-3 mr-1" />
                        Inquire
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}