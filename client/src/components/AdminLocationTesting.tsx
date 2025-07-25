import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { LocationBasedPricing } from '@/components/LocationBasedPricing';
import { CURRENCIES } from '@/lib/currencyUtils';

interface AdminLocationTestingProps {
  product: any;
}

export function AdminLocationTesting({ product }: AdminLocationTestingProps) {
  const [simulatedLocation, setSimulatedLocation] = useState<string>('US');
  
  const locationToCurrency = {
    'US': 'USD',
    'IN': 'INR', 
    'DE': 'EUR',
    'GB': 'GBP'
  };

  const locationNames = {
    'US': 'United States',
    'IN': 'India',
    'DE': 'Germany (EU)',
    'GB': 'United Kingdom'
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          🌍 Location-Based Pricing Simulator
        </CardTitle>
        <p className="text-sm text-gray-600">
          Test how visitors from different countries see pricing
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Location Selector */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Simulate visitor from:</label>
          <Select value={simulatedLocation} onValueChange={setSimulatedLocation}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(locationNames).map(([code, name]) => (
                <SelectItem key={code} value={code}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Simulated Customer View */}
        <div className="border-2 border-blue-200 rounded-lg p-4 bg-blue-50">
          <div className="flex items-center gap-2 mb-3">
            <Badge variant="secondary">Customer View from {locationNames[simulatedLocation as keyof typeof locationNames]}</Badge>
          </div>
          
          <div className="bg-white p-3 rounded border">
            <h3 className="font-medium mb-2">{product.name}</h3>
            
            {/* Force display specific currency based on simulated location */}
            <div className="space-y-2">
              <div className="text-2xl font-bold text-green-600">
                {(() => {
                  const currency = locationToCurrency[simulatedLocation as keyof typeof locationToCurrency];
                  const priceField = `price${currency}`;
                  const price = product[priceField];
                  const currencyInfo = CURRENCIES[currency];
                  
                  if (price && !isNaN(parseFloat(price))) {
                    return `${currencyInfo.symbol}${parseFloat(price).toFixed(2)}`;
                  }
                  return 'Price not available';
                })()}
              </div>
              
              {product.priceType && product.priceLocation && (
                <div className="text-sm text-gray-600">
                  <Badge variant="secondary" className="text-xs">
                    {product.priceType} {product.priceLocation}
                  </Badge>
                </div>
              )}
              
              <div className="text-xs text-gray-400">
                Regional pricing for: {CURRENCIES[locationToCurrency[simulatedLocation as keyof typeof locationToCurrency]].name}
              </div>
            </div>
          </div>
          
          <p className="text-xs text-gray-600 mt-2">
            ℹ️ Visitors from {locationNames[simulatedLocation as keyof typeof locationNames]} can only see {CURRENCIES[locationToCurrency[simulatedLocation as keyof typeof locationToCurrency]].name} pricing
          </p>
        </div>

        {/* All Available Prices (Admin Only) */}
        <div className="border-2 border-yellow-200 rounded-lg p-4 bg-yellow-50">
          <div className="flex items-center gap-2 mb-3">
            <Badge variant="secondary">Admin View (All Currencies)</Badge>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(CURRENCIES).map(([code, info]) => {
              const priceField = `price${code}`;
              const price = product[priceField];
              
              return (
                <div key={code} className="bg-white p-3 rounded border">
                  <div className="text-sm font-medium text-gray-700">{info.name}</div>
                  <div className="text-lg font-bold text-green-600">
                    {price && !isNaN(parseFloat(price)) 
                      ? `${info.symbol}${parseFloat(price).toFixed(2)}`
                      : 'Not set'
                    }
                  </div>
                </div>
              );
            })}
          </div>
          
          <p className="text-xs text-gray-600 mt-2">
            ℹ️ Only admins can see all currency prices for management purposes
          </p>
        </div>
      </CardContent>
    </Card>
  );
}