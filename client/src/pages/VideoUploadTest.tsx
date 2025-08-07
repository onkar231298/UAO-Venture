import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Upload, Video, CheckCircle, AlertCircle } from 'lucide-react';

export default function VideoUploadTest() {
  const [uploading, setUploading] = useState(false);
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState<string>('');
  const { toast } = useToast();

  const handleVideoUpload = async (file: File) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('video/')) {
      toast({
        title: "Invalid File Type",
        description: "Please select a video file (MP4, WebM, etc.)",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Video file must be less than 50MB",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('slideVideo', file);
      formData.append('slideId', 'test-slide');

      const response = await fetch('/api/admin/hero-slides/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      
      if (result.success && result.files.slideVideo) {
        setUploadedVideoUrl(result.files.slideVideo);
        toast({
          title: "Upload Successful",
          description: "Video uploaded to AWS S3 successfully",
        });
      } else {
        throw new Error('Upload response invalid');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload video to AWS S3. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Video Upload Test</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upload Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload Video for Hero Slider
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="video-upload">Select Video File</Label>
                  <Input
                    id="video-upload"
                    type="file"
                    accept="video/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleVideoUpload(file);
                      }
                    }}
                    disabled={uploading}
                    className="mt-1"
                  />
                </div>

                {uploading && (
                  <div className="flex items-center gap-2 text-blue-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                    <span>Uploading to AWS S3...</span>
                  </div>
                )}

                {uploadedVideoUrl && (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span>Video uploaded successfully!</span>
                  </div>
                )}

                <div className="text-sm text-gray-600">
                  <p>Supported formats: MP4, WebM, MOV</p>
                  <p>Maximum file size: 50MB</p>
                  <p>Recommended: 1920x1080, H.264 codec</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Preview Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="h-5 w-5" />
                Video Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              {uploadedVideoUrl ? (
                <div className="space-y-4">
                  <video
                    src={uploadedVideoUrl}
                    controls
                    className="w-full h-64 bg-black rounded-lg"
                    preload="metadata"
                  >
                    Your browser does not support the video tag.
                  </video>
                  
                  <div className="text-sm text-gray-600">
                    <p><strong>URL:</strong> {uploadedVideoUrl}</p>
                  </div>

                  <Button
                    onClick={() => {
                      navigator.clipboard.writeText(uploadedVideoUrl);
                      toast({
                        title: "Copied to Clipboard",
                        description: "Video URL copied to clipboard",
                      });
                    }}
                    className="w-full"
                  >
                    Copy Video URL
                  </Button>
                </div>
              ) : (
                <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <Video className="h-12 w-12 mx-auto mb-2" />
                    <p>Upload a video to see preview</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Hero Slider Test Section */}
        {uploadedVideoUrl && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Hero Slider Test</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative h-96 overflow-hidden rounded-lg">
                <video
                  src={uploadedVideoUrl}
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="w-full h-full object-cover"
                >
                  Your browser does not support the video tag.
                </video>
                
                {/* Overlay */}
                <div className="absolute inset-0 bg-black/40" />
                
                {/* Content */}
                <div className="absolute inset-0 flex items-center justify-center text-white text-center">
                  <div>
                    <h2 className="text-4xl font-bold mb-4">Premium Organic Ingredients</h2>
                    <p className="text-xl mb-6">Experience the quality difference</p>
                    <Button className="bg-green-600 hover:bg-green-700">
                      Explore Products
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}