import { useQuery } from "@tanstack/react-query";
import { LocationBasedPricing, CompactPricing } from "@/components/LocationBasedPricing";
import { AdminLocationTesting } from "@/components/AdminLocationTesting";
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
          <div className="space-y-2 text-gray-600">
            <p>This page demonstrates the location-based multi-currency pricing system.</p>
            <div className="bg-blue-100 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-2">Customer Experience:</h3>
              <ul className="text-sm space-y-1">
                <li>• Users from India see only INR prices (₹)</li>
                <li>• Users from US see only USD prices ($)</li>
                <li>• Users from Europe see only EUR prices (€)</li>
                <li>• Users from UK see only GBP prices (£)</li>
                <li>• No currency switching allowed for regular visitors</li>
              </ul>
            </div>
            <div className="bg-yellow-100 p-4 rounded-lg">
              <h3 className="font-semibold text-yellow-800 mb-2">Admin Experience:</h3>
              <ul className="text-sm space-y-1">
                <li>• Can see all currency prices</li>
                <li>• Can switch between currencies manually</li>
                <li>• Used for product management and testing</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Demo with First Product */}
        {productList.length > 0 && (
          <div className="mb-8">
            <AdminLocationTesting product={productList[0]} />
          </div>
        )}

        <div className="grid md:grid-cols-1 lg:grid-cols-2 gap-6">
          {productList.slice(0, 2).map((product: any) => (
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

                {/* Location-Restricted Pricing (Customer View) */}
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-2 text-sm text-gray-700">Customer View (Location-Restricted):</h4>
                  <LocationBasedPricing 
                    product={product} 
                    showCurrencySelector={false}
                    isAdminView={false}
                    className="mb-4 bg-blue-50 p-3 rounded"
                  />
                  <p className="text-xs text-gray-500 mb-2">
                    Only shows price in your regional currency based on location
                  </p>
                </div>

                {/* Admin View with All Currencies */}
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-2 text-sm text-gray-700">Admin View (All Currencies):</h4>
                  <LocationBasedPricing 
                    product={product} 
                    showCurrencySelector={true}
                    isAdminView={true}
                    className="mb-4 bg-yellow-50 p-3 rounded"
                  />
                  <p className="text-xs text-gray-500 mb-2">
                    Admins can see and switch between all available currencies
                  </p>
                </div>

                {/* Product Details */}
                <div className="text-xs text-gray-500 space-y-1 border-t pt-4">
                  {product.packingSize && (
                    <div>Packing: {product.packingSize}</div>
                  )}
                  {product.moq && (
                    <div>MOQ: {product.moq} {product.unit || 'kg'}</div>
                  )}
                  {product.leadTime && (
                    <div>Lead Time: {product.leadTime}</div>
                  )}
                  {product.priceType && product.priceLocation && (
                    <div>Terms: {product.priceType} {product.priceLocation}</div>
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