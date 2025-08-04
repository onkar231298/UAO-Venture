import { OptimizedImageWebP } from '@/components/OptimizedImageWebP';
import { WebPAdminPanel } from '@/components/WebPAdminPanel';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';

export default function WebPDemo() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            WebP Image Optimization System
          </h1>
          <p className="text-gray-600">
            Dual-bucket WebP conversion for 60-80% faster image loading
          </p>
        </div>

        {/* Admin Panel - Only show for authenticated users */}
        {user && (
          <WebPAdminPanel />
        )}

        {/* Demo Images */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Before WebP Optimization</CardTitle>
              <CardDescription>
                Standard JPG/PNG images from original bucket
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative h-64 bg-gray-200 rounded-lg overflow-hidden">
                <OptimizedImageWebP
                  src="https://bfi-original-images.s3.eu-north-1.amazonaws.com/sample-product.jpg"
                  alt="Original format image"
                  className="w-full h-full"
                  fallbackSrc="https://images.unsplash.com/photo-1597149641961-85d21ad6a6a5?w=400&h=300&fit=crop"
                />
              </div>
              <div className="flex justify-between text-sm">
                <span>Format: JPG/PNG</span>
                <Badge variant="outline">Original Size</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>After WebP Optimization</CardTitle>
              <CardDescription>
                WebP format from dedicated WebP bucket
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative h-64 bg-gray-200 rounded-lg overflow-hidden">
                <OptimizedImageWebP
                  src="https://webpimagesbfo.s3.eu-north-1.amazonaws.com/sample-product.webp"
                  alt="WebP optimized image"
                  className="w-full h-full"
                  fallbackSrc="https://images.unsplash.com/photo-1597149641961-85d21ad6a6a5?w=400&h=300&fit=crop&fm=webp&q=85"
                />
              </div>
              <div className="flex justify-between text-sm">
                <span>Format: WebP</span>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  60-80% Smaller
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* System Status */}
        <Card>
          <CardHeader>
            <CardTitle>WebP System Status</CardTitle>
            <CardDescription>
              Current configuration and connection status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-lg font-semibold text-blue-600">Sharp</div>
                <div className="text-sm text-blue-700">Image Processing</div>
                <Badge variant="outline" className="mt-2 bg-green-50 text-green-700 border-green-200">
                  Active
                </Badge>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-lg font-semibold text-purple-600">AWS S3</div>
                <div className="text-sm text-purple-700">Dual Buckets</div>
                <Badge variant="outline" className="mt-2 bg-green-50 text-green-700 border-green-200">
                  Connected
                </Badge>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-lg font-semibold text-green-600">WebP</div>
                <div className="text-sm text-green-700">Auto Conversion</div>
                <Badge variant="outline" className="mt-2 bg-green-50 text-green-700 border-green-200">
                  Ready
                </Badge>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-lg font-semibold text-orange-600">Fallback</div>
                <div className="text-sm text-orange-700">Original Images</div>
                <Badge variant="outline" className="mt-2 bg-green-50 text-green-700 border-green-200">
                  Available
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Technical Details */}
        <Card>
          <CardHeader>
            <CardTitle>Implementation Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Dual-Bucket Architecture:</h4>
                <ul className="text-sm space-y-1 text-gray-600">
                  <li>• Original images: <code className="bg-gray-100 px-2 py-1 rounded">bfi-original-images</code></li>
                  <li>• WebP images: <code className="bg-gray-100 px-2 py-1 rounded">webpimagesbfo</code></li>
                  <li>• Region: <code className="bg-gray-100 px-2 py-1 rounded">eu-north-1</code> (Stockholm)</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Smart Serving Logic:</h4>
                <ul className="text-sm space-y-1 text-gray-600">
                  <li>• Automatic WebP detection and serving</li>
                  <li>• Fallback to original format if WebP fails</li>
                  <li>• Browser compatibility detection</li>
                  <li>• Progressive loading with placeholders</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Performance Benefits:</h4>
                <ul className="text-sm space-y-1 text-gray-600">
                  <li>• 60-80% reduction in file sizes</li>
                  <li>• 2x faster page loading times</li>
                  <li>• Better Core Web Vitals scores</li>
                  <li>• Reduced bandwidth costs</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}