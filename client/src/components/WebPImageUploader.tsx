import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Upload, X, Check, AlertCircle, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

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

interface WebPImageUploaderProps {
  onUploadComplete?: (result: WebPUploadResult) => void;
  maxFiles?: number;
  productId?: string;
  className?: string;
  disabled?: boolean;
}

interface FileWithPreview extends File {
  preview?: string;
  id: string;
}

export default function WebPImageUploader({
  onUploadComplete,
  maxFiles = 5,
  productId = `temp-${Date.now()}`,
  className,
  disabled = false
}: WebPImageUploaderProps) {
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<WebPUploadResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    
    if (selectedFiles.length === 0) return;
    
    // Validate file types
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/bmp', 'image/tiff'];
    const validFiles = selectedFiles.filter(file => validTypes.includes(file.type));
    
    if (validFiles.length !== selectedFiles.length) {
      alert('Some files were skipped. Only JPEG, PNG, GIF, BMP, and TIFF files are supported.');
    }
    
    // Limit number of files
    const filesToAdd = validFiles.slice(0, maxFiles - files.length);
    
    const filesWithPreview: FileWithPreview[] = filesToAdd.map((file, index) => {
      const fileWithId = file as FileWithPreview;
      fileWithId.id = `${Date.now()}-${index}`;
      fileWithId.preview = URL.createObjectURL(file);
      return fileWithId;
    });
    
    setFiles(prev => [...prev, ...filesWithPreview]);
    
    // Clear the input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (fileId: string) => {
    setFiles(prev => {
      const updated = prev.filter(f => f.id !== fileId);
      // Clean up preview URLs
      const removedFile = prev.find(f => f.id === fileId);
      if (removedFile?.preview) {
        URL.revokeObjectURL(removedFile.preview);
      }
      return updated;
    });
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    
    setUploading(true);
    setUploadProgress(0);
    setUploadResult(null);
    
    try {
      const formData = new FormData();
      
      files.forEach(file => {
        formData.append('images', file);
      });
      
      formData.append('productId', productId);
      
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);
      
      const response = await fetch('/api/products/upload-webp', {
        method: 'POST',
        body: formData,
      });
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      const result: WebPUploadResult = await response.json();
      
      if (response.ok) {
        setUploadResult(result);
        onUploadComplete?.(result);
        
        // Clear files after successful upload
        files.forEach(file => {
          if (file.preview) {
            URL.revokeObjectURL(file.preview);
          }
        });
        setFiles([]);
      } else {
        throw new Error(result.message || 'Upload failed');
      }
      
    } catch (error) {
      console.error('Upload failed:', error);
      setUploadResult({
        success: false,
        message: error instanceof Error ? error.message : 'Upload failed',
        results: [],
        provider: 'error'
      });
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5" />
            WebP Image Uploader
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
              "hover:border-blue-400 hover:bg-blue-50",
              disabled && "opacity-50 cursor-not-allowed",
              files.length >= maxFiles && "border-gray-300"
            )}
            onClick={() => !disabled && files.length < maxFiles && fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/jpeg,image/jpg,image/png,image/gif,image/bmp,image/tiff"
              onChange={handleFileSelect}
              className="hidden"
              disabled={disabled || files.length >= maxFiles}
            />
            
            <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold mb-2">
              {files.length >= maxFiles ? 'Maximum files reached' : 'Upload Product Images'}
            </h3>
            <p className="text-gray-600 mb-4">
              Drop images here or click to browse
            </p>
            <p className="text-sm text-gray-500">
              Supported: JPEG, PNG, GIF, BMP, TIFF • Max {maxFiles} files • Auto WebP conversion
            </p>
            
            {files.length < maxFiles && (
              <Button 
                variant="outline" 
                className="mt-4"
                disabled={disabled}
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
              >
                Select Files
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* File Preview */}
      {files.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Selected Files ({files.length}/{maxFiles})</span>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  files.forEach(file => {
                    if (file.preview) URL.revokeObjectURL(file.preview);
                  });
                  setFiles([]);
                }}
                disabled={uploading}
              >
                Clear All
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {files.map((file) => (
                <div key={file.id} className="relative border rounded-lg p-3">
                  <div className="aspect-square bg-gray-100 rounded-lg mb-2 overflow-hidden">
                    {file.preview && (
                      <img 
                        src={file.preview} 
                        alt={file.name}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-sm font-medium truncate" title={file.name}>
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(file.size)}
                    </p>
                    <Badge variant="secondary" className="text-xs">
                      {file.type.split('/')[1].toUpperCase()}
                    </Badge>
                  </div>
                  
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-1 right-1 w-6 h-6 p-0"
                    onClick={() => removeFile(file.id)}
                    disabled={uploading}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
            
            <div className="flex justify-between items-center mt-4">
              <div className="text-sm text-gray-600">
                Product ID: <code className="bg-gray-100 px-2 py-1 rounded">{productId}</code>
              </div>
              
              <Button
                onClick={handleUpload}
                disabled={uploading || files.length === 0}
                className="flex items-center gap-2"
              >
                {uploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Convert to WebP
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upload Progress */}
      {uploading && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Converting to WebP...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="w-full" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upload Results */}
      {uploadResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {uploadResult.success ? (
                <Check className="w-5 h-5 text-green-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600" />
              )}
              Upload Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={cn(
              "p-4 rounded-lg mb-4",
              uploadResult.success ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"
            )}>
              <p className={cn(
                "font-medium",
                uploadResult.success ? "text-green-800" : "text-red-800"
              )}>
                {uploadResult.message}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Provider: {uploadResult.provider}
              </p>
            </div>

            {uploadResult.success && uploadResult.results.length > 0 && (
              <div className="space-y-4">
                {uploadResult.results.map((result, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-2">{result.originalName}</h4>
                    
                    <div className="grid md:grid-cols-3 gap-4">
                      {result.sizes.map((size, sizeIndex) => (
                        <div key={sizeIndex} className="border rounded-lg p-3">
                          <h5 className="font-medium capitalize mb-2">{size.size}</h5>
                          <img 
                            src={result.urls[size.size]} 
                            alt={`${size.size} version`}
                            className="w-full h-24 object-cover rounded mb-2"
                          />
                          <div className="text-xs text-gray-600 space-y-1">
                            <p>Size: {size.width}×{size.height}</p>
                            <p>File: {formatFileSize(size.fileSize)}</p>
                            <a 
                              href={result.urls[size.size]} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline block"
                            >
                              View Full Size
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}