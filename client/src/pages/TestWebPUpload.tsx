import React from 'react';
import { Button } from "@/components/ui/button";
import WebPImageUploader from "@/components/WebPImageUploader";

interface WebPUploadResult {
  success: boolean;
  message: string;
  results: Array<{
    originalName: string;
    productId: string;
    urls: {
      thumbnail: string;
      medium: string;
      large: string;
    };
    sizes: Array<{
      size: 'thumbnail' | 'medium' | 'large';
      width: number;
      height: number;
      fileSize: number;
    }>;
    error?: string;
  }>;
  provider: string;
}

export default function TestWebPUpload() {
  const [uploadResults, setUploadResults] = React.useState<WebPUploadResult | null>(null);

  const handleUploadComplete = (result: WebPUploadResult) => {
    console.log('WebP Upload Complete:', result);
    setUploadResults(result);
  };

  return (
    <div className="container mx-auto p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">WebP Image Upload Testing</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Upload Product Images</h2>
          <p className="text-muted-foreground mb-6">
            Test the WebP conversion system. Images will be automatically converted to WebP format with 3 sizes.
          </p>
          
          <WebPImageUploader
            onUploadComplete={handleUploadComplete}
            maxFiles={5}
            productId="test-webp-upload-page"
            className="border rounded-lg p-4"
          />
        </div>

        {uploadResults && (
          <div className="bg-green-50 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 text-green-800">Upload Results</h2>
            
            <div className="mb-4">
              <p className="text-green-700">
                <strong>Status:</strong> {uploadResults.success ? 'Success' : 'Failed'}
              </p>
              <p className="text-green-700">
                <strong>Message:</strong> {uploadResults.message}
              </p>
              <p className="text-green-700">
                <strong>Provider:</strong> {uploadResults.provider}
              </p>
            </div>

            <div className="space-y-6">
              {uploadResults.results.map((result, index) => (
                <div key={index} className="border border-green-200 rounded-lg p-4">
                  <h3 className="font-semibold text-green-800 mb-2">
                    {result.originalName}
                  </h3>
                  
                  {result.error ? (
                    <p className="text-red-600">Error: {result.error}</p>
                  ) : (
                    <>
                      <p className="text-sm text-green-600 mb-3">
                        Product ID: {result.productId}
                      </p>
                      
                      <div className="grid md:grid-cols-3 gap-4">
                        {result.sizes.map((size, sizeIndex) => (
                          <div key={sizeIndex} className="border rounded-lg p-3">
                            <h4 className="font-medium capitalize mb-2">{size.size}</h4>
                            <img 
                              src={result.urls[size.size]} 
                              alt={`${size.size} version`}
                              className="w-full h-32 object-cover rounded mb-2"
                            />
                            <div className="text-xs text-gray-600">
                              <p>Size: {size.width}x{size.height}</p>
                              <p>File: {(size.fileSize / 1024).toFixed(1)}KB</p>
                            </div>
                            <a 
                              href={result.urls[size.size]} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:underline block mt-1"
                            >
                              View Full Size
                            </a>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-blue-800">System Information</h2>
          <ul className="text-blue-700 space-y-2">
            <li>✅ WebP-only conversion (no original backups)</li>
            <li>✅ 3 optimized sizes: 300px, 800px, 1200px</li>
            <li>✅ AWS S3 storage for product images</li>
            <li>✅ Automatic compression and optimization</li>
            <li>✅ Supports JPEG, PNG, GIF, BMP, TIFF input formats</li>
            <li>✅ Database integration with new WebP columns</li>
          </ul>
        </div>
      </div>
    </div>
  );
}