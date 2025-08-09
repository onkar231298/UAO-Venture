import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Calculator, Package, TrendingDown } from 'lucide-react';
import { detectUserCurrency, formatPrice, getProductPrice } from '@/lib/currencyUtils';
import { generateDynamicPricingTiers } from '@/utils/pricingUtils';
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
  const minOrderQty = parseFloat(product.moq as string || '25');
  const [selectedQuantity, setSelectedQuantity] = useState<number>(minOrderQty);
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
  
  // MOQ already defined above
  
  // Default pricing tiers - dynamically generated based on MOQ
  const defaultTiers = generateDynamicPricingTiers(minOrderQty, baseRate);
  
  // Use custom bulk pricing if available, otherwise use dynamic tiers
  const pricingTiers: PricingTier[] = bulkPricing.length > 0 
    ? bulkPricing.filter(tier => tier.quantity >= minOrderQty)
    : defaultTiers;

  const calculatePrice = (quantity: number): { totalPrice: number; discount: number; pricePerUnit: number } => {
    // Find the appropriate pricing tier based on quantity
    let applicableTier = pricingTiers[0];
    for (const tier of pricingTiers) {
      if (quantity >= tier.quantity) {
        applicableTier = tier;
      }
    }

    const discount = applicableTier.discount;
    // Calculate per-unit price by applying discount to base rate
    const pricePerUnit = baseRate * (1 - discount / 100);
    const totalPrice = pricePerUnit * quantity;

    return {
      totalPrice,
      discount,
      pricePerUnit
    };
  };

  const handleQuantitySelect = (quantity: number) => {
    setSelectedQuantity(quantity);
    setCustomQuantity('');
    const pricing = calculatePrice(quantity);
    onQuantityChange?.(quantity, pricing.totalPrice, pricing.discount);
  };

  const handleCustomQuantityChange = (value: string) => {
    setCustomQuantity(value);
    const quantity = parseInt(value) || 0;
    
    if (quantity > 0 && quantity >= minOrderQty) {
      setSelectedQuantity(quantity);
      const pricing = calculatePrice(quantity);
      onQuantityChange?.(quantity, pricing.totalPrice, pricing.discount);
    }
  };

  const handleCustomQuantityCalculate = () => {
    const quantity = parseInt(customQuantity) || 0;
    if (quantity >= minOrderQty) {
      setSelectedQuantity(quantity);
      const pricing = calculatePrice(quantity);
      onQuantityChange?.(quantity, pricing.totalPrice, pricing.discount);
    }
  };

  const currentPricing = calculatePrice(selectedQuantity);

  return (
    <Card className="w-full max-w-full overflow-hidden" style={{ width: 'calc(100% + 1rem)' }}>
      <CardHeader className="pb-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-t-lg">
        <CardTitle className="flex items-center gap-2 text-lg font-bold text-gray-800">
          <Calculator className="w-5 h-5 text-green-600" />
          Quantity Pricing
        </CardTitle>
        {!isLoading && (
          <div className="text-sm text-gray-700">
            <p className="font-medium">Current pricing in {userCurrency} • Prices shown in your regional currency</p>
            <p className="text-xs text-blue-700 mt-1 font-medium">
              MOQ: {minOrderQty.toLocaleString()} {product.stockUnit || 'kg'} • Volume discounts available
            </p>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-3 p-3">
        {/* Loading State */}
        {isLoading ? (
          <div className="text-center py-4">
            <div className="animate-pulse">Loading pricing...</div>
          </div>
        ) : (
          <>
            {/* Mobile-First Pricing Cards for small screens */}
            <div className="block md:hidden space-y-2">
              {pricingTiers.slice(0, 3).map((tier, index) => {
                const pricing = calculatePrice(tier.quantity);
                const isSelected = selectedQuantity === tier.quantity;
                
                return (
                  <div key={index} className={`p-3 rounded-lg border-2 ${isSelected ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-white'}`}>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-semibold text-base text-gray-900 flex items-center gap-2">
                          {tier.quantity.toLocaleString()} {product.stockUnit || 'kg'}
                          {index === 0 && (
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs px-1.5 py-0">
                              MOQ
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-gray-600">
                          {formatPrice(pricing.pricePerUnit, userCurrency)}/{product.priceUnit || 'kg'}
                        </div>
                      </div>
                      <div className="text-right">
                        {pricing.discount > 0 ? (
                          <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs mb-2 px-1 py-0">
                            <TrendingDown className="w-2 h-2 mr-1" />
                            {pricing.discount.toFixed(1)}%
                          </Badge>
                        ) : (
                          <div className="text-xs text-gray-400 mb-2">0.00%</div>
                        )}
                        <Button
                          variant={isSelected ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleQuantitySelect(tier.quantity)}
                          className={`w-16 h-7 text-xs ${isSelected ? "bg-green-600 hover:bg-green-700" : ""}`}
                        >
                          {isSelected ? "✓" : "Select"}
                        </Button>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      Total: {formatPrice(pricing.totalPrice, userCurrency)}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table for larger screens */}
            <div className="hidden md:block">
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full min-w-0">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-900">Quantity</th>
                      <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-900">Price per {product.priceUnit || 'kg'}</th>
                      <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-900">Save</th>
                      <th className="px-2 py-1.5 text-center text-xs font-medium text-gray-900">Select</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {pricingTiers.slice(0, 4).map((tier, index) => {
                      const pricing = calculatePrice(tier.quantity);
                      const isSelected = selectedQuantity === tier.quantity;
                      
                      return (
                        <tr key={index} className={`${isSelected ? 'bg-green-50 border-green-200' : 'hover:bg-gray-50'}`}>
                          <td className="px-2 py-1.5 text-xs font-medium text-gray-900">
                            <div className="flex items-center gap-2">
                              {tier.quantity.toLocaleString()} {product.stockUnit || 'kg'}
                              {index === 0 && (
                                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs px-1.5 py-0">
                                  MOQ
                                </Badge>
                              )}
                            </div>
                          </td>
                          <td className="px-2 py-1.5 text-xs text-gray-900">
                            {formatPrice(pricing.pricePerUnit, userCurrency)}/{product.priceUnit || 'kg'}
                          </td>
                          <td className="px-2 py-1.5 text-xs">
                            {pricing.discount > 0 ? (
                              <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs px-1 py-0">
                                <TrendingDown className="w-2 h-2 mr-1" />
                                {pricing.discount.toFixed(1)}%
                              </Badge>
                            ) : (
                              <span className="text-gray-400">0.00%</span>
                            )}
                          </td>
                          <td className="px-2 py-1.5 text-center">
                            <Button
                              variant={isSelected ? "default" : "outline"}
                              size="sm"
                              onClick={() => handleQuantitySelect(tier.quantity)}
                              className={`text-xs px-2 py-1 h-6 ${isSelected ? "bg-green-600 hover:bg-green-700" : ""}`}
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
            <div className="bg-gray-50 p-2 rounded-lg">
              <h4 className="font-medium text-xs text-gray-900 mb-1.5">Custom Quantity</h4>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder={`Min. ${product.moq || 25}`}
                  value={customQuantity}
                  onChange={(e) => handleCustomQuantityChange(e.target.value)}
                  min={minOrderQty}
                  className="flex-1 text-xs h-7"
                />
                <Button 
                  variant="outline" 
                  onClick={handleCustomQuantityCalculate}
                  disabled={!customQuantity || parseInt(customQuantity) < minOrderQty}
                  className="text-xs px-2 h-7"
                >
                  Calculate
                </Button>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                <p>MOQ: {minOrderQty.toLocaleString()} {product.stockUnit || 'kg'}</p>
                {customQuantity && parseInt(customQuantity) < minOrderQty && (
                  <p className="text-red-500 mt-1">
                    Minimum order quantity is {minOrderQty.toLocaleString()} {product.stockUnit || 'kg'}
                  </p>
                )}
              </div>
            </div>

            {/* Summary */}
            <div className="bg-blue-50 p-2.5 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-sm text-blue-900">Selected Quantity</h4>
                <Package className="w-4 h-4 text-blue-600" />
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Quantity:</span>
                  <span className="font-medium">{selectedQuantity.toLocaleString()} {product.stockUnit || 'kg'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Price per {product.priceUnit || 'kg'}:</span>
                  <span className="font-medium">{formatPrice(currentPricing.pricePerUnit, userCurrency)}</span>
                </div>
                <div className="flex justify-between items-center pt-1.5 border-t border-blue-200">
                  <span className="text-gray-600 font-medium">Total Price:</span>
                  <span className="font-bold text-base text-blue-600">{formatPrice(currentPricing.totalPrice, userCurrency)}</span>
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