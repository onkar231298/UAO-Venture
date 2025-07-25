import { useQuery } from "@tanstack/react-query";
import { LocationBasedPricing, CompactPricing } from "@/components/LocationBasedPricing";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Header from "@/components/Header";

export default function TestMultiCurrency() {
  const { data: products, isLoading } = useQuery({
    queryKey: ["/api/products"],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const productList = products?.products || [];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Multi-Currency Pricing Test</h1>
          <p className="text-gray-600">
            This page demonstrates the location-based multi-currency pricing system. 
            Prices are automatically detected based on your location, with manual override options.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {productList.map((product: any) => (
            <Card key={product.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg">{product.name}</CardTitle>
                <p className="text-sm text-gray-600 line-clamp-2">
                  {product.description}
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Main Product Image */}
                {product.heroImage && (
                  <div className="aspect-video w-full rounded-lg overflow-hidden bg-gray-100">
                    <img 
                      src={product.heroImage} 
                      alt={product.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}

                {/* Multi-Currency Pricing Display */}
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-2 text-sm text-gray-700">Location-Based Pricing:</h4>
                  <LocationBasedPricing 
                    product={product} 
                    showCurrencySelector={true}
                    className="mb-4"
                  />
                </div>

                {/* Compact Pricing Display */}
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-2 text-sm text-gray-700">Compact Display:</h4>
                  <CompactPricing product={product} />
                </div>

                {/* Product Details */}
                <div className="text-xs text-gray-500 space-y-1">
                  {product.packingSize && (
                    <div>Packing: {product.packingSize}</div>
                  )}
                  {product.moq && (
                    <div>MOQ: {product.moq} {product.unit || 'kg'}</div>
                  )}
                  {product.leadTime && (
                    <div>Lead Time: {product.leadTime}</div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {productList.length === 0 && (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Products Found</h3>
            <p className="text-gray-600">
              Add some products with multi-currency pricing to test the system.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}