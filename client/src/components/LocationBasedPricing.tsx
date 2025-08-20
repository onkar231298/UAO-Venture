import { useState } from 'react';
import { formatPrice, getProductPrice, formatPriceWithTerms, CURRENCIES } from '@/lib/currencyUtils';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useCurrency } from '@/contexts/CurrencyContext';

interface LocationBasedPricingProps {
  product: any;
  className?: string;
  showCurrencySelector?: boolean;
  isAdminView?: boolean; // Only admins can see all currencies
}

export function LocationBasedPricing({ 
  product, 
  className = "",
  showCurrencySelector = false,
  isAdminView = false
}: LocationBasedPricingProps) {
  const { currency: userCurrency, isLoading } = useCurrency();
  const [manualOverride, setManualOverride] = useState<string | null>(null);

  // Use manual override if set, otherwise use detected currency
  const displayCurrency = manualOverride || userCurrency;
  const price = getProductPrice(product, displayCurrency);
  const currencyInfo = CURRENCIES[displayCurrency];

  if (isLoading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-6 bg-gray-200 rounded w-24"></div>
      </div>
    );
  }

  if (!price) {
    return (
      <div className={className}>
        <Badge variant="outline" className="text-gray-500">
          Price on Request
        </Badge>
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Currency Selector (only for admin view) */}
      {showCurrencySelector && isAdminView && (
        <div className="flex items-center gap-2">
          <Label className="text-xs text-gray-500">Currency:</Label>
          <Select
            value={displayCurrency}
            onValueChange={(value) => setManualOverride(value)}
          >
            <SelectTrigger className="w-24 h-6 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(CURRENCIES).map(([code, info]) => (
                <SelectItem key={code} value={code} className="text-xs">
                  {info.symbol} {code}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Price Display */}
      <div className="flex flex-col gap-1">
        <div className="text-xl font-bold text-green-600">
          {formatPrice(price, displayCurrency)}
        </div>
        
        {/* Price Terms */}
        {product.priceType && product.priceLocation && (
          <div className="text-sm text-gray-600">
            <Badge variant="secondary" className="text-xs">
              {product.priceType} {product.priceLocation}
            </Badge>
          </div>
        )}

        {/* Per Unit Information */}
        <div className="text-xs text-gray-500">
          per {product.priceUnit || 'kg'}
        </div>

        {/* Location Detection Info */}
        {!manualOverride && !isAdminView && (
          <div className="text-xs text-gray-400">
            Showing regional pricing for: {currencyInfo?.name}
          </div>
        )}
        {!manualOverride && isAdminView && (
          <div className="text-xs text-gray-400">
            Auto-detected: {currencyInfo?.name}
          </div>
        )}
      </div>

      {/* Available Currency Prices (admin view only) */}
      {isAdminView && (
        <div className="flex flex-wrap gap-1">
          {Object.entries(CURRENCIES).map(([code, info]) => {
            const currencyPrice = getProductPrice(product, code);
            if (!currencyPrice || code === displayCurrency) return null;
            
            return (
              <button
                key={code}
                onClick={() => setManualOverride(code)}
                className="text-xs text-gray-500 hover:text-gray-700 underline"
              >
                {info.symbol}{currencyPrice.toFixed(2)}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Simplified version for product cards
export function CompactPricing({ product, className = "" }: { product: any; className?: string }) {
  const { currency: userCurrency, isLoading } = useCurrency();

  if (isLoading) {
    return <div className={`h-5 bg-gray-200 rounded w-16 animate-pulse ${className}`}></div>;
  }

  const price = getProductPrice(product, userCurrency);
  
  if (!price) {
    return <span className={`text-gray-500 text-sm ${className}`}>Price on Request</span>;
  }

  return (
    <div className={`${className}`}>
      <span className="font-semibold text-green-600">
        {formatPrice(price, userCurrency)}
      </span>
      {product.priceType && (
        <span className="text-xs text-gray-500 ml-1">
          {product.priceType}
        </span>
      )}
    </div>
  );
}