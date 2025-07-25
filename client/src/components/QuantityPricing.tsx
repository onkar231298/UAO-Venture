import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Calculator, Package, TrendingDown } from 'lucide-react';
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

  // Parse bulk pricing from product data
  const bulkPricing = (product.bulkPricing as PricingTier[]) || [];
  const baseRate = parseFloat(product.rate as string || '0');
  
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
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Calculator className="w-5 h-5" />
          Quantity Pricing
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Pricing Table */}
        <div className="overflow-hidden rounded-lg border">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Quantity</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Price per {product.priceUnit}</th>
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
                      {tier.quantity.toLocaleString()} {product.stockUnit}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      ${pricing.pricePerUnit.toFixed(4)}/{product.priceUnit}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {pricing.discount > 0 ? (
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
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

        {/* Custom Quantity Input */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-sm text-gray-900 mb-2">Custom Quantity</h4>
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder={`Min. ${product.moq || 25} ${product.stockUnit}`}
              value={customQuantity}
              onChange={(e) => handleCustomQuantityChange(e.target.value)}
              min={product.moq as number || 25}
              className="flex-1"
            />
            <Button 
              variant="outline" 
              onClick={() => handleCustomQuantityChange(customQuantity)}
              disabled={!customQuantity || parseInt(customQuantity) < (product.moq as number || 25)}
            >
              Calculate
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Minimum order quantity: {product.moq || 25} {product.stockUnit}
          </p>
        </div>

        {/* Selected Quantity Summary */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-900">Selected Quantity:</span>
            <span className="text-lg font-bold text-green-700">
              {selectedQuantity.toLocaleString()} {product.stockUnit}
            </span>
          </div>
          
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Price per {product.priceUnit}:</span>
            <span className="font-medium text-gray-900">
              ${currentPricing.pricePerUnit.toFixed(4)}
            </span>
          </div>
          
          {currentPricing.discount > 0 && (
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Discount:</span>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                -{currentPricing.discount.toFixed(1)}%
              </Badge>
            </div>
          )}
          
          <div className="border-t border-green-200 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-lg font-medium text-gray-900">Total Price:</span>
              <span className="text-2xl font-bold text-green-700">
                ${currentPricing.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* High Volume Bid Option */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Package className="w-4 h-4 text-blue-600" />
            <span className="font-medium text-blue-900">Need Higher Volume?</span>
          </div>
          <p className="text-sm text-blue-700 mb-3">
            For quantities above 10,000 {product.stockUnit}, request a custom quote for better pricing.
          </p>
          <Button variant="outline" size="sm" className="border-blue-300 text-blue-700 hover:bg-blue-100">
            Request High Volume Quote
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}