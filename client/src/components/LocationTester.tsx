import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Globe, MapPin, DollarSign, RefreshCw } from 'lucide-react';
import { detectUserCurrency } from '@/lib/currencyUtils';

interface CurrencyDetectionResult {
  currency: string;
  countryCode?: string;
  source: string;
  ip?: string;
}

export default function LocationTester() {
  const [detectionResult, setDetectionResult] = useState<CurrencyDetectionResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testCurrencyDetection = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Test server-side detection first
      const serverResponse = await fetch('/api/detect-currency');
      const serverData = await serverResponse.json();
      
      // Test client-side detection
      const clientCurrency = await detectUserCurrency();
      
      setDetectionResult({
        ...serverData,
        clientDetectedCurrency: clientCurrency
      } as any);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Detection failed');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    testCurrencyDetection();
  }, []);

  const getCurrencyIcon = (currency: string) => {
    const icons = {
      USD: '$',
      EUR: '€',
      INR: '₹',
      GBP: '£'
    };
    return icons[currency as keyof typeof icons] || '$';
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="w-5 h-5" />
          IP-Based Currency Detection Test
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={testCurrencyDetection} 
          disabled={isLoading}
          className="w-full"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          {isLoading ? 'Detecting...' : 'Test Currency Detection'}
        </Button>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
            <strong>Error:</strong> {error}
          </div>
        )}

        {detectionResult && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-4 h-4 text-green-600" />
                  <strong className="text-green-800">Detected Currency</strong>
                </div>
                <div className="text-2xl font-bold text-green-700 flex items-center gap-2">
                  {getCurrencyIcon(detectionResult.currency)}
                  {detectionResult.currency}
                </div>
              </div>

              {detectionResult.countryCode && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-4 h-4 text-blue-600" />
                    <strong className="text-blue-800">Country</strong>
                  </div>
                  <div className="text-2xl font-bold text-blue-700">
                    {detectionResult.countryCode}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <strong className="text-gray-800 mb-2 block">Detection Details:</strong>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Source:</span>
                  <Badge variant="outline">{detectionResult.source}</Badge>
                </div>
                
                {detectionResult.ip && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">IP Address:</span>
                    <code className="text-xs bg-gray-200 px-2 py-1 rounded">
                      {detectionResult.ip}
                    </code>
                  </div>
                )}

                {(detectionResult as any).clientDetectedCurrency && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Client Detection:</span>
                    <Badge variant="secondary">
                      {(detectionResult as any).clientDetectedCurrency}
                    </Badge>
                  </div>
                )}
              </div>
            </div>

            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="text-sm text-yellow-800">
                <strong>How it works:</strong> The system detects your location via IP address 
                and automatically shows prices in your regional currency without requiring 
                location permissions.
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}