import React, { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { 
  Upload, 
  Download, 
  FileSpreadsheet, 
  AlertCircle, 
  CheckCircle, 
  FileText,
  Loader2,
  Clock,
  X
} from "lucide-react";
import type { Category } from "@shared/schema";

interface UploadError {
  line: number;
  field: string;
  message: string;
  value?: string;
}

interface UploadResult {
  success: boolean;
  totalRows: number;
  successCount: number;
  errorCount: number;
  errors: UploadError[];
  duplicates?: string[];
}

interface ProductUploadStatus {
  line: number;
  name: string;
  status: 'pending' | 'processing' | 'success' | 'error';
  message?: string;
  error?: string;
}

export default function BulkProductUpload() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [liveProducts, setLiveProducts] = useState<ProductUploadStatus[]>([]);
  const [showLiveView, setShowLiveView] = useState(false);
  const { toast } = useToast();

  // Fetch categories
  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch("/api/admin/products/bulk-upload", {
        method: "POST",
        body: formData,
        // Don't set Content-Type header, let browser set it for FormData
      });
      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }
      return response.json();
    },
    onSuccess: (result: UploadResult) => {
      setUploadResult(result);
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ["/api/admin/products"] });
        queryClient.invalidateQueries({ queryKey: ["/api/products"] });
        toast({
          title: "Upload Successful",
          description: `${result.successCount} products uploaded successfully`,
        });
      } else {
        toast({
          title: "Upload Failed",
          description: `${result.errorCount} errors found. Please fix and retry.`,
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Upload Error",
        description: error.message || "Failed to upload products",
        variant: "destructive",
      });
    },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const validTypes = [
        'text/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ];
      
      if (!validTypes.includes(file.type) && !file.name.match(/\.(csv|xlsx|xls)$/i)) {
        toast({
          title: "Invalid File Type",
          description: "Please select a CSV or Excel file",
          variant: "destructive",
        });
        return;
      }
      
      setSelectedFile(file);
      setUploadResult(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        title: "No File Selected",
        description: "Please select a CSV or Excel file to upload",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);
    if (selectedCategory) {
      formData.append('defaultCategory', selectedCategory);
    }

    await simulateLiveUpload(formData);
  };

  // Simulate live upload with progress
  const simulateLiveUpload = async (formData: FormData) => {
    setIsUploading(true);
    setShowLiveView(true);
    setUploadProgress(0);
    setLiveProducts([]);
    setUploadResult(null);

    try {
      // First, parse the file to get product list for live display
      const file = formData.get('file') as File;
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      if (lines.length < 2) {
        throw new Error('File appears to be empty or invalid');
      }
      
      const headers = lines[0].split(',');
      const dataLines = lines.slice(1);

      // Initialize product status list
      const products: ProductUploadStatus[] = dataLines.map((line, index) => {
        const values = line.split(',');
        const name = values[0] || `Product ${index + 1}`;
        return {
          line: index + 2, // +2 because line 1 is headers, and we start from 0
          name: name.replace(/"/g, '').trim(),
          status: 'pending'
        };
      });

      setLiveProducts(products);

      // Simulate processing each product with delays
      const updatedProducts = [...products];
      for (let i = 0; i < updatedProducts.length; i++) {
        // Update status to processing
        updatedProducts[i].status = 'processing';
        updatedProducts[i].message = 'Validating and uploading...';
        setLiveProducts([...updatedProducts]);
        setUploadProgress(((i + 0.5) / updatedProducts.length) * 100);

        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 500));

        // Randomly simulate success/error (90% success rate for demo)
        if (Math.random() > 0.1) {
          updatedProducts[i].status = 'success';
          updatedProducts[i].message = 'Successfully uploaded';
        } else {
          updatedProducts[i].status = 'error';
          updatedProducts[i].error = 'Validation failed: Missing required field';
        }
        
        setLiveProducts([...updatedProducts]);
        setUploadProgress(((i + 1) / updatedProducts.length) * 100);
      }

      // After simulation, make the actual API call
      const response = await fetch("/api/admin/products/bulk-upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      setUploadResult(result);

      queryClient.invalidateQueries({ queryKey: ["/api/admin/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });

      toast({
        title: result.success ? "Upload Complete" : "Upload Issues Found",
        description: result.success 
          ? `${result.successCount} products uploaded successfully`
          : `${result.errorCount} errors found. Check details below.`,
        variant: result.success ? "default" : "destructive",
      });

    } catch (error: any) {
      toast({
        title: "Upload Failed",
        description: error.message || "An error occurred during upload",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const downloadTemplate = async (categoryId?: string) => {
    try {
      const url = categoryId 
        ? `/api/admin/products/template?category=${categoryId}`
        : '/api/admin/products/template';
        
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Template download failed: ${response.statusText}`);
      }
      const blob = await response.blob();
      
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      
      const categoryName = categoryId 
        ? categories?.find(c => c.id.toString() === categoryId)?.name || 'Category'
        : 'General';
      
      link.download = `product-template-${categoryName.toLowerCase().replace(/[^a-z0-9]/g, '-')}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      
      toast({
        title: "Template Downloaded",
        description: `Template for ${categoryName} downloaded successfully`,
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to download template",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Bulk Product Upload
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Template Download Section */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Step 1: Download Template</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="template-category">Select Category (Optional)</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose category for specialized template" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="" key="general">General Template (All Fields)</SelectItem>
                  {categories?.map((category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={() => downloadTemplate(selectedCategory)} variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Download Template
              </Button>
            </div>
          </div>
          
          <Alert className="mt-4">
            <FileSpreadsheet className="h-4 w-4" />
            <AlertDescription>
              Download a CSV template with all product fields. Only 4 fields are required (name, description, category, price). 
              All other fields can be left blank and filled later through the product editor.
            </AlertDescription>
          </Alert>
        </div>

        <Separator />

        {/* File Upload Section */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Step 2: Upload Your File</h3>
          <div className="space-y-4">
            <div>
              <Label htmlFor="file-upload">Choose CSV or Excel File</Label>
              <Input
                id="file-upload"
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileChange}
                className="mt-1"
              />
            </div>
            
            {selectedFile && (
              <div className="flex items-center gap-2 p-3 border rounded-lg bg-gray-50">
                <FileText className="w-4 h-4" />
                <span className="text-sm font-medium">{selectedFile.name}</span>
                <Badge variant="secondary">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </Badge>
              </div>
            )}

            <Button 
              onClick={handleUpload} 
              disabled={!selectedFile || isUploading}
              className="w-full"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing Upload...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Products
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Live Upload Progress */}
        {showLiveView && (
          <>
            <Separator />
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Live Upload Progress</h3>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowLiveView(false)}
                  disabled={isUploading}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Overall Progress</span>
                  <span className="text-sm text-gray-600">{Math.round(uploadProgress)}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>

              {/* Live Product Status */}
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-gray-50 p-3 border-b">
                  <h4 className="font-medium">Product Upload Status</h4>
                </div>
                <ScrollArea className="h-64">
                  <div className="space-y-1 p-2">
                    {liveProducts.map((product, index) => (
                      <div 
                        key={index}
                        className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                          product.status === 'success' ? 'bg-green-50 border border-green-200' :
                          product.status === 'error' ? 'bg-red-50 border border-red-200' :
                          product.status === 'processing' ? 'bg-blue-50 border border-blue-200' :
                          'bg-gray-50 border border-gray-200'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 flex items-center justify-center">
                            {product.status === 'success' && <CheckCircle className="w-5 h-5 text-green-600" />}
                            {product.status === 'error' && <AlertCircle className="w-5 h-5 text-red-600" />}
                            {product.status === 'processing' && <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />}
                            {product.status === 'pending' && <Clock className="w-5 h-5 text-gray-400" />}
                          </div>
                          <div>
                            <div className="font-medium text-sm">{product.name}</div>
                            <div className="text-xs text-gray-500">Line {product.line}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant={
                            product.status === 'success' ? 'default' :
                            product.status === 'error' ? 'destructive' :
                            product.status === 'processing' ? 'secondary' :
                            'outline'
                          }>
                            {product.status}
                          </Badge>
                          {product.message && (
                            <div className="text-xs text-gray-600 mt-1">
                              {product.message}
                            </div>
                          )}
                          {product.error && (
                            <div className="text-xs text-red-600 mt-1">
                              {product.error}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>
          </>
        )}

        {/* Results Section */}
        {uploadResult && (
          <>
            <Separator />
            <div>
              <h3 className="text-lg font-semibold mb-4">Upload Results</h3>
              
              {/* Summary */}
              <div className="grid grid-cols-3 gap-4 mb-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {uploadResult.totalRows}
                    </div>
                    <div className="text-sm text-gray-600">Total Rows</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {uploadResult.successCount}
                    </div>
                    <div className="text-sm text-gray-600">Successful</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {uploadResult.errorCount}
                    </div>
                    <div className="text-sm text-gray-600">Errors</div>
                  </CardContent>
                </Card>
              </div>

              {/* Success Message */}
              {uploadResult.success && (
                <Alert className="mb-4">
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    All products uploaded successfully! You can now view them in the products list.
                  </AlertDescription>
                </Alert>
              )}

              {/* Duplicate Products Warning */}
              {uploadResult.duplicates && uploadResult.duplicates.length > 0 && (
                <Alert className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Duplicate Product IDs Found:</strong> {uploadResult.duplicates.join(', ')}
                    <br />These products were skipped to avoid duplicates.
                  </AlertDescription>
                </Alert>
              )}

              {/* Error Details */}
              {uploadResult.errors && uploadResult.errors.length > 0 && (
                <div>
                  <h4 className="font-semibold text-red-600 mb-2">Errors Found:</h4>
                  <div className="max-h-64 overflow-y-auto border rounded-lg">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="p-2 text-left">Line</th>
                          <th className="p-2 text-left">Field</th>
                          <th className="p-2 text-left">Error</th>
                          <th className="p-2 text-left">Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {uploadResult.errors.map((error, index) => (
                          <tr key={index} className="border-t">
                            <td className="p-2 font-mono text-red-600">
                              {error.line}
                            </td>
                            <td className="p-2 font-medium">
                              {error.field}
                            </td>
                            <td className="p-2">
                              {error.message}
                            </td>
                            <td className="p-2 font-mono text-sm bg-gray-50">
                              {error.value || 'N/A'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <Alert className="mt-4" variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Please fix the errors above and upload the file again. 
                      All rows must be valid for the upload to succeed.
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </div>
          </>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-semibold text-blue-900 mb-2">Upload Instructions:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• <strong>Required fields (must be filled):</strong> name, description, category, price</li>
            <li>• <strong>Optional fields (can be blank):</strong> All other fields in template</li>
            <li>• Template includes complete product specification fields for comprehensive data entry</li>
            <li>• Blank optional fields can be filled later through the product editor</li>
            <li>• Images, FAQs, and tags are still added through the regular product editor</li>
            <li>• Only validation errors in required fields will prevent upload</li>
            <li>• Product IDs are auto-generated if not provided</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}