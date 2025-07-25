import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Calculator, Package, TrendingDown } from 'lucide-react';
import { detectUserCurrency, formatPrice, getProductPrice } from '@/lib/currencyUtils';
import type { Product } from '@shared/schema';

interface QuantityPricingProps {
  product: Product;
  onQuantityChange?: (quantity: number, totalPrice: number, discount: number) => void;
}

interface PricingTier {
  quantity: number;
  price: number;
  discount: number;
}

export default function QuantityPricing({ product, onQuantityChange }: QuantityPricingProps) {
  const [selectedQuantity, setSelectedQuantity] = useState<number>(product.moq as number || 25);
  const [customQuantity, setCustomQuantity] = useState<string>('');
  const [userCurrency, setUserCurrency] = useState<string>('USD');
  const [isLoading, setIsLoading] = useState(true);

  // Detect user currency on component mount
  useEffect(() => {
    const detectCurrency = async () => {
      try {
        const detectedCurrency = await detectUserCurrency();
        setUserCurrency(detectedCurrency);
      } catch (error) {
        console.warn('Currency detection failed, defaulting to USD:', error);
        setUserCurrency('USD');
      } finally {
        setIsLoading(false);
      }
    };
    detectCurrency();
  }, []);

  // Parse bulk pricing from product data
  const bulkPricing = (product.bulkPricing as PricingTier[]) || [];
  // Get base rate in user's currency
  const baseRate = getProductPrice(product, userCurrency) || parseFloat(product.rate as string || '0');
  
  // Default pricing tiers if none exist
  const pricingTiers: PricingTier[] = bulkPricing.length > 0 ? bulkPricing : [
    { quantity: 25, price: baseRate * 25, discount: 0 },
    { quantity: 100, price: baseRate * 100 * 0.95, discount: 5 },
    { quantity: 500, price: baseRate * 500 * 0.92, discount: 8 },
    { quantity: 1000, price: baseRate * 1000 * 0.88, discount: 12 },
    { quantity: 5000, price: baseRate * 5000 * 0.85, discount: 15 },
  ];

  const calculatePrice = (quantity: number): { price: number; discount: number; pricePerUnit: number } => {
    // Find the appropriate pricing tier
    let applicableTier = pricingTiers[0];
    for (const tier of pricingTiers) {
      if (quantity >= tier.quantity) {
        applicableTier = tier;
      }
    }

    const discount = applicableTier.discount;
    const pricePerUnit = baseRate * (1 - discount / 100);
    const totalPrice = pricePerUnit * quantity;

    return {
      price: totalPrice,
      discount,
      pricePerUnit
    };
  };

  const handleQuantitySelect = (quantity: number) => {
    setSelectedQuantity(quantity);
    setCustomQuantity('');
    const pricing = calculatePrice(quantity);
    onQuantityChange?.(quantity, pricing.price, pricing.discount);
  };

  const handleCustomQuantityChange = (value: string) => {
    setCustomQuantity(value);
    const quantity = parseInt(value) || 0;
    if (quantity > 0) {
      setSelectedQuantity(quantity);
      const pricing = calculatePrice(quantity);
      onQuantityChange?.(quantity, pricing.price, pricing.discount);
    }
  };

  const currentPricing = calculatePrice(selectedQuantity);

  return (
    <Card className="w-full max-w-full overflow-hidden">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Calculator className="w-5 h-5" />
          Quantity Pricing
        </CardTitle>
        {!isLoading && (
          <p className="text-sm text-gray-600">
            Current pricing in {userCurrency} • Prices shown in your regional currency
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-4 p-4">
        {/* Loading State */}
        {isLoading ? (
          <div className="text-center py-4">
            <div className="animate-pulse">Loading pricing...</div>
          </div>
        ) : (
          <>
            {/* Mobile-First Pricing Cards for small screens */}
            <div className="block md:hidden space-y-3">
              {pricingTiers.map((tier, index) => {
                const pricing = calculatePrice(tier.quantity);
                const isSelected = selectedQuantity === tier.quantity;
                
                return (
                  <div key={index} className={`p-4 rounded-lg border-2 ${isSelected ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-white'}`}>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-semibold text-lg text-gray-900">
                          {tier.quantity.toLocaleString()} {product.stockUnit || 'kg'}
                        </div>
                        <div className="text-sm text-gray-600">
                          {formatPrice(pricing.pricePerUnit, userCurrency)}/{product.priceUnit || 'kg'}
                        </div>
                      </div>
                      <div className="text-right">
                        {pricing.discount > 0 ? (
                          <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs mb-2">
                            <TrendingDown className="w-3 h-3 mr-1" />
                            {pricing.discount.toFixed(1)}% off
                          </Badge>
                        ) : (
                          <div className="text-xs text-gray-400 mb-2">No discount</div>
                        )}
                        <Button
                          variant={isSelected ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleQuantitySelect(tier.quantity)}
                          className={`w-20 ${isSelected ? "bg-green-600 hover:bg-green-700" : ""}`}
                        >
                          {isSelected ? "Selected" : "Select"}
                        </Button>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      Total: {formatPrice(pricing.price, userCurrency)}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table for larger screens */}
            <div className="hidden md:block">
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Quantity</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Price per {product.priceUnit || 'kg'}</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Save</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-900">Select</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {pricingTiers.map((tier, index) => {
                      const pricing = calculatePrice(tier.quantity);
                      const isSelected = selectedQuantity === tier.quantity;
                      
                      return (
                        <tr key={index} className={`${isSelected ? 'bg-green-50 border-green-200' : 'hover:bg-gray-50'}`}>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            {tier.quantity.toLocaleString()} {product.stockUnit || 'kg'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {formatPrice(pricing.pricePerUnit, userCurrency)}/{product.priceUnit || 'kg'}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {pricing.discount > 0 ? (
                              <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                                <TrendingDown className="w-3 h-3 mr-1" />
                                {pricing.discount.toFixed(1)}%
                              </Badge>
                            ) : (
                              <span className="text-gray-400">0.00%</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Button
                              variant={isSelected ? "default" : "outline"}
                              size="sm"
                              onClick={() => handleQuantitySelect(tier.quantity)}
                              className={isSelected ? "bg-green-600 hover:bg-green-700" : ""}
                            >
                              {isSelected ? "Selected" : "Select"}
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {!isLoading && (
          <>
            {/* Custom Quantity Input */}
            <div className="bg-gray-50 p-3 md:p-4 rounded-lg">
              <h4 className="font-medium text-sm text-gray-900 mb-2">Custom Quantity</h4>
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  type="number"
                  placeholder={`Min. ${product.moq || 25} ${product.stockUnit || 'kg'}`}
                  value={customQuantity}
                  onChange={(e) => handleCustomQuantityChange(e.target.value)}
                  min={product.moq as number || 25}
                  className="flex-1 text-sm"
                />
                <Button 
                  variant="outline" 
                  onClick={() => handleCustomQuantityChange(customQuantity)}
                  disabled={!customQuantity || parseInt(customQuantity) < (product.moq as number || 25)}
                  className="text-sm px-4 whitespace-nowrap"
                >
                  Calculate
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Minimum order quantity: {product.moq || 25} {product.stockUnit || 'kg'}
              </p>
            </div>

            {/* Summary */}
            <div className="bg-blue-50 p-3 md:p-4 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-blue-900">Selected Quantity</h4>
                <Package className="w-4 h-4 text-blue-600" />
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Quantity:</span>
                  <span className="font-medium">{selectedQuantity.toLocaleString()} {product.stockUnit || 'kg'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Price per {product.priceUnit || 'kg'}:</span>
                  <span className="font-medium">{formatPrice(currentPricing.pricePerUnit, userCurrency)}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-blue-200">
                  <span className="text-gray-600 font-medium">Total Price:</span>
                  <span className="font-bold text-lg text-blue-600">{formatPrice(currentPricing.price, userCurrency)}</span>
                </div>
                {currentPricing.discount > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">You Save:</span>
                    <span className="font-medium text-green-600">{currentPricing.discount.toFixed(1)}%</span>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}