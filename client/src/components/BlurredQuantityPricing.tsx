import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Calculator, Package, TrendingDown } from 'lucide-react';
import { detectUserCurrency, formatPrice, getProductPrice } from '@/lib/currencyUtils';
import type { Product } from '@shared/schema';

interface BlurredQuantityPricingProps {
  product: Product;
}

interface PricingTier {
  quantity: number;
  price: number;
  discount: number;
}

export default function BlurredQuantityPricing({ product }: BlurredQuantityPricingProps) {
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
  
  // Default pricing tiers - quantity thresholds with discount percentages
  const defaultTiers = [
    { quantity: Math.max(minOrderQty, minOrderQty), price: baseRate, discount: 0 },
    { quantity: Math.max(100, minOrderQty), price: baseRate, discount: 5 },
    { quantity: Math.max(500, minOrderQty), price: baseRate, discount: 8 },
    { quantity: Math.max(1000, minOrderQty), price: baseRate, discount: 12 },  
    { quantity: Math.max(5000, minOrderQty), price: baseRate, discount: 15 },
  ].filter(tier => tier.quantity >= minOrderQty);
  
  // Filter tiers to only include quantities >= MOQ
  const pricingTiers: PricingTier[] = bulkPricing.length > 0 
    ? bulkPricing.filter(tier => tier.quantity >= minOrderQty)
    : defaultTiers.filter(tier => tier.quantity >= minOrderQty);

  const calculatePrice = (quantity: number): { totalPrice: number; discount: number; pricePerUnit: number } => {
    // Find the appropriate pricing tier based on quantity
    let applicableTier = pricingTiers[0];
    for (const tier of pricingTiers) {
      if (quantity >= tier.quantity) {
        applicableTier = tier;
      }
    }

    const discount = applicableTier.discount;
    const pricePerUnit = baseRate * (1 - discount / 100);
    const totalPrice = quantity * pricePerUnit;

    return { totalPrice, discount, pricePerUnit };
  };

  const { totalPrice, discount, pricePerUnit } = calculatePrice(selectedQuantity);

  const stockUnit = product.stockUnit || 'kg';

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            Volume Pricing Calculator
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="w-5 h-5" />
          Volume Pricing Calculator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quantity Input */}  
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Order Quantity ({stockUnit})
          </label>
          <div className="flex gap-2">
            <Input
              type="number"
              value={customQuantity || selectedQuantity}
              onChange={(e) => {
                const value = e.target.value;
                setCustomQuantity(value);
                const numValue = parseFloat(value) || minOrderQty;
                if (numValue >= minOrderQty) {
                  setSelectedQuantity(numValue);
                }
              }}
              placeholder={`Min: ${minOrderQty} ${stockUnit}`}
              min={minOrderQty}
              className="flex-1"
            />
            <Button
              variant="outline"
              onClick={() => {
                const value = parseFloat(customQuantity) || minOrderQty;
                if (value >= minOrderQty) {
                  setSelectedQuantity(value);
                }
                setCustomQuantity('');
              }}
            >
              Calculate
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Minimum order: {minOrderQty} {stockUnit}
          </p>
        </div>

        {/* Quick Select Buttons */}
        <div className="grid grid-cols-3 gap-2">
          {pricingTiers.map((tier) => (
            <Button
              key={tier.quantity}
              variant={selectedQuantity === tier.quantity ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setSelectedQuantity(tier.quantity);
                setCustomQuantity('');
              }}
              className="text-xs"
            >
              <span className="blur-sm">{tier.quantity}</span> {stockUnit}
            </Button>
          ))}
        </div>

        {/* Pricing Table */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="grid grid-cols-3 gap-4 text-xs font-medium text-gray-600 mb-3">
            <div>Quantity</div>
            <div>Price/{stockUnit}</div>
            <div>Discount</div>
          </div>
          <div className="space-y-2">
            {pricingTiers.map((tier) => {
              const tierPricePerUnit = baseRate * (1 - tier.discount / 100);
              const isSelected = selectedQuantity >= tier.quantity;
              return (
                <div 
                  key={tier.quantity}
                  className={`grid grid-cols-3 gap-4 text-sm py-2 px-2 rounded ${
                    isSelected ? 'bg-green-100' : 'bg-white'
                  }`}
                >
                  <div className="font-medium">
                    <span className="blur-sm">{tier.quantity.toLocaleString()}</span>+ {stockUnit}
                  </div>
                  <div className="font-bold text-green-700">
                    <span className="blur-sm">{formatPrice(tierPricePerUnit, userCurrency)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {tier.discount > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        <span className="blur-sm">{tier.discount}</span>% OFF
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Price Summary */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Selected Quantity:</span>
              <span className="font-medium">
                <span className="blur-sm">{selectedQuantity.toLocaleString()}</span> {stockUnit}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Price per {stockUnit}:</span>
              <span className="font-bold text-green-700">
                <span className="blur-sm">{formatPrice(pricePerUnit, userCurrency)}</span>
              </span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Volume Discount:</span>
                <Badge variant="secondary">
                  <span className="blur-sm">{discount}</span>% OFF
                </Badge>
              </div>
            )}
            <div className="border-t border-green-300 pt-2">
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-900">Total Amount:</span>
                <span className="text-xl font-bold text-green-700">
                  <span className="blur-sm">{formatPrice(totalPrice, userCurrency)}</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          <Button className="w-full" size="lg" disabled>
            <Package className="w-4 h-4 mr-2" />
            Add to Cart - <span className="blur-sm">{formatPrice(totalPrice, userCurrency)}</span>
          </Button>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" disabled>
              Get Quote
            </Button>
            <Button variant="outline" size="sm" disabled>
              <TrendingDown className="w-4 h-4 mr-2" />
              Bulk Inquiry
            </Button>
          </div>
        </div>

        {/* Additional Information */}
        <div className="text-xs text-gray-500 space-y-1">
          <p>• Prices are in {userCurrency} and include packaging</p>
          <p>• Volume discounts automatically applied</p>
          <p>• Final prices may vary based on specifications</p>
        </div>
      </CardContent>
    </Card>
  );
}