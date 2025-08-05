import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Upload, X, Image as ImageIcon, Check } from "lucide-react";

interface WebPImageUploaderProps {
  onUploadComplete: (result: WebPUploadResult) => void;
  maxFiles?: number;
  productId?: string;
  accept?: string;
  className?: string;
}

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

export function WebPImageUploader({ 
  onUploadComplete, 
  maxFiles = 10, 
  productId,
  accept = "image/jpeg,image/png,image/gif,image/bmp,image/tiff,image/webp",
  className = ""
}: WebPImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    if (files.length > maxFiles) {
      toast({
        title: "Too many files",
        description: `Please select no more than ${maxFiles} files`,
        variant: "destructive"
      });
      return;
    }

    // Validate file types
    const validTypes = accept.split(',').map(type => type.trim());
    const invalidFiles = files.filter(file => 
      !validTypes.some(type => file.type === type || file.name.toLowerCase().endsWith(type.replace('image/', '.')))
    );

    if (invalidFiles.length > 0) {
      toast({
        title: "Invalid file type",
        description: `Supported formats: JPEG, PNG, GIF, BMP, TIFF, WebP`,
        variant: "destructive"
      });
      return;
    }

    // Check file sizes (10MB limit)
    const oversizedFiles = files.filter(file => file.size > 10 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      toast({
        title: "File too large",
        description: `Maximum file size is 10MB`,
        variant: "destructive"
      });
      return;
    }

    setSelectedFiles(files);
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      toast({
        title: "No files selected",
        description: "Please select images to upload",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      // Create FormData
      const formData = new FormData();
      
      selectedFiles.forEach(file => {
        formData.append('images', file);
      });
      
      if (productId) {
        formData.append('productId', productId);
      }

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      // Upload with WebP processing
      const response = await fetch('/api/products/upload-webp', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setProgress(100);

      const result = await response.json();

      if (response.ok && result.success) {
        toast({
          title: "Upload successful",
          description: `${result.message}. Images converted to WebP format.`,
        });
        
        onUploadComplete(result);
        setSelectedFiles([]);
        
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        throw new Error(result.message || 'Upload failed');
      }

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: "destructive"
      });
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleClearAll = () => {
    setSelectedFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* File Input */}
      <div className="flex items-center gap-2">
        <Input
          ref={fileInputRef}
          type="file"
          multiple
          accept={accept}
          onChange={handleFileSelect}
          disabled={uploading}
          className="flex-1"
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          <Upload className="w-4 h-4 mr-2" />
          Browse
        </Button>
      </div>

      {/* Selected Files Preview */}
      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <h4 className="text-sm font-medium">
              Selected Files ({selectedFiles.length}/{maxFiles})
            </h4>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClearAll}
              disabled={uploading}
            >
              Clear All
            </Button>
          </div>
          
          <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto">
            {selectedFiles.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm truncate">{file.name}</span>
                  <span className="text-xs text-muted-foreground">
                    ({(file.size / 1024 / 1024).toFixed(1)}MB)
                  </span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveFile(index)}
                  disabled={uploading}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Progress */}
      {uploading && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Processing images to WebP format...</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="w-full" />
        </div>
      )}

      {/* Upload Button */}
      <div className="flex gap-2">
        <Button
          onClick={handleUpload}
          disabled={uploading || selectedFiles.length === 0}
          className="flex-1"
        >
          {uploading ? (
            <>
              <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-b-transparent" />
              Converting to WebP...
            </>
          ) : (
            <>
              <Check className="w-4 h-4 mr-2" />
              Upload & Convert to WebP
            </>
          )}
        </Button>
      </div>

      {/* Info Text */}
      <p className="text-xs text-muted-foreground">
        • Supported formats: JPEG, PNG, GIF, BMP, TIFF, WebP
        • Maximum file size: 10MB per image
        • Images will be automatically converted to WebP format in 3 sizes (300px, 800px, 1200px)
        • Original images are not stored (WebP-only for optimal performance)
      </p>
    </div>
  );
}

export default WebPImageUploader;