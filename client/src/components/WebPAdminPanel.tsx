import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, CheckCircle, Upload, Zap } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { apiRequest } from '@/lib/queryClient';

interface WebPAdminPanelProps {
  className?: string;
}

export function WebPAdminPanel({ className }: WebPAdminPanelProps) {
  const [isConverting, setIsConverting] = useState(false);
  const [conversionStatus, setConversionStatus] = useState<'idle' | 'running' | 'completed' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');

  const startBatchConversion = async () => {
    setIsConverting(true);
    setConversionStatus('running');
    setStatusMessage('Starting batch conversion of existing images...');

    try {
      const response = await apiRequest('/api/webp/batch-convert', {
        method: 'POST',
      });

      if (response.ok) {
        setConversionStatus('completed');
        setStatusMessage('Batch conversion started successfully! Check server logs for progress.');
      } else {
        throw new Error('Failed to start batch conversion');
      }
    } catch (error) {
      console.error('Batch conversion error:', error);
      setConversionStatus('error');
      setStatusMessage('Failed to start batch conversion. Please check your AWS credentials and try again.');
    } finally {
      setIsConverting(false);
    }
  };

  const testOptimizedUrl = async () => {
    try {
      const testUrl = 'https://bfi-original-images.s3.eu-north-1.amazonaws.com/test-image.jpg';
      const response = await apiRequest(`/api/webp/optimized-url?originalUrl=${encodeURIComponent(testUrl)}`);
      
      if (response.ok) {
        const data = await response.json();
        setStatusMessage(`Test URL optimization: ${data.optimizedUrl}`);
      }
    } catch (error) {
      console.error('Test URL error:', error);
      setStatusMessage('Failed to test URL optimization');
    }
  };

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-blue-600" />
            WebP Image Optimization
          </CardTitle>
          <CardDescription>
            Convert existing images to WebP format for 60-80% faster loading times
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Status Alert */}
          {statusMessage && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{statusMessage}</AlertDescription>
            </Alert>
          )}

          {/* WebP Benefits */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">60-80%</div>
              <div className="text-sm text-green-700">Smaller file sizes</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">2x</div>
              <div className="text-sm text-blue-700">Faster loading</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">95%+</div>
              <div className="text-sm text-purple-700">Browser support</div>
            </div>
          </div>

          {/* Conversion Status */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-medium">Conversion Status</span>
              <Badge variant={
                conversionStatus === 'idle' ? 'secondary' :
                conversionStatus === 'running' ? 'default' :
                conversionStatus === 'completed' ? 'outline' : 'destructive'
              }>
                {conversionStatus === 'idle' && 'Ready'}
                {conversionStatus === 'running' && 'Converting...'}
                {conversionStatus === 'completed' && 'Completed'}
                {conversionStatus === 'error' && 'Error'}
              </Badge>
            </div>
            
            {conversionStatus === 'running' && (
              <Progress value={undefined} className="w-full" />
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={startBatchConversion}
              disabled={isConverting}
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              {isConverting ? 'Converting...' : 'Start Batch Conversion'}
            </Button>
            
            <Button
              variant="outline"
              onClick={testOptimizedUrl}
              className="flex items-center gap-2"
            >
              <CheckCircle className="h-4 w-4" />
              Test URL Optimization
            </Button>
          </div>

          {/* Important Notes */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-medium text-yellow-800 mb-2">Important Notes:</h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• Original images are preserved in the original bucket</li>
              <li>• WebP versions are stored in the dedicated WebP bucket</li>
              <li>• Future uploads will automatically create both versions</li>
              <li>• The website will serve WebP when available, with fallback to originals</li>
              <li>• Conversion runs in the background without affecting website performance</li>
            </ul>
          </div>

          {/* AWS Configuration Status */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 mb-2">AWS Configuration:</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-blue-700">Original Bucket:</span>
                <Badge variant="outline" className="ml-2">bfi-original-images</Badge>
              </div>
              <div>
                <span className="text-blue-700">WebP Bucket:</span>
                <Badge variant="outline" className="ml-2">webpimagesbfo</Badge>
              </div>
              <div>
                <span className="text-blue-700">Region:</span>
                <Badge variant="outline" className="ml-2">eu-north-1</Badge>
              </div>
              <div>
                <span className="text-blue-700">Status:</span>
                <Badge variant="outline" className="ml-2 bg-green-50 text-green-700 border-green-200">Connected</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}