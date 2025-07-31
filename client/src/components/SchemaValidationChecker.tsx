import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
// import { Progress } from "@/components/ui/progress"; // Not needed for this component
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Eye, 
  RefreshCw, 
  Download,
  Search,
  Filter,
  ExternalLink
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Product } from "@shared/schema";

interface ValidationResult {
  productId: string;
  productName: string;
  slug: string;
  status: 'valid' | 'warning' | 'error';
  score: number;
  issues: ValidationIssue[];
  requiredFields: FieldValidation[];
  recommendedFields: FieldValidation[];
  seoFields: FieldValidation[];
}

interface ValidationIssue {
  type: 'error' | 'warning' | 'info';
  field: string;
  message: string;
  suggestion?: string;
}

interface FieldValidation {
  field: string;
  present: boolean;
  value?: any;
  required: boolean;
  issue?: string;
}

interface ValidationSummary {
  totalProducts: number;
  validProducts: number;
  warningProducts: number;
  errorProducts: number;
  averageScore: number;
  commonIssues: { issue: string; count: number }[];
}

export default function SchemaValidationChecker() {
  const { toast } = useToast();
  const [selectedProduct, setSelectedProduct] = useState<ValidationResult | null>(null);
  const [validationFilter, setValidationFilter] = useState<'all' | 'valid' | 'warning' | 'error'>('all');

  // Fetch validation results
  const { data: validationResults, isLoading, refetch } = useQuery<ValidationResult[]>({
    queryKey: ["/api/admin/schema-validation"],
  });

  // Fetch validation summary
  const { data: validationSummary } = useQuery<ValidationSummary>({
    queryKey: ["/api/admin/schema-validation/summary"],
  });

  // Run validation mutation
  const runValidationMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/admin/schema-validation/run");
      return await response.json();
    },
    onSuccess: () => {
      toast({ title: "Schema validation completed successfully!" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/schema-validation"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/schema-validation/summary"] });
    },
    onError: (error: any) => {
      toast({
        title: "Validation failed",
        description: error.message || "Failed to run schema validation",
        variant: "destructive",
      });
    },
  });

  // Export validation results
  const exportResults = async () => {
    try {
      const response = await apiRequest("GET", "/api/admin/schema-validation/export");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `schema-validation-report-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast({ title: "Validation report exported successfully!" });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Failed to export validation report",
        variant: "destructive",
      });
    }
  };

  const filteredResults = validationResults?.filter(result => {
    if (validationFilter === 'all') return true;
    return result.status === validationFilter;
  }) || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'valid': return 'bg-green-100 text-green-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';  
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'valid': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'error': return <XCircle className="w-4 h-4 text-red-600" />;
      default: return null;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Schema Validation Checker</h2>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-gray-200 rounded-lg"></div>
          <div className="h-64 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Schema Validation Checker</h2>
          <p className="text-gray-600">Automated validation of product structured data for SEO optimization</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => runValidationMutation.mutate()}
            disabled={runValidationMutation.isPending}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${runValidationMutation.isPending ? 'animate-spin' : ''}`} />
            Run Validation
          </Button>
          <Button variant="outline" onClick={exportResults} className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {validationSummary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Products</p>
                  <p className="text-2xl font-bold">{validationSummary.totalProducts}</p>
                </div>
                <Search className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Valid Schema</p>
                  <p className="text-2xl font-bold text-green-600">{validationSummary.validProducts}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Warnings</p>
                  <p className="text-2xl font-bold text-yellow-600">{validationSummary.warningProducts}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Errors</p>
                  <p className="text-2xl font-bold text-red-600">{validationSummary.errorProducts}</p>
                </div>
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Avg Score</p>
                  <p className="text-2xl font-bold">{validationSummary.averageScore}%</p>
                </div>
                <div className="w-8 h-8 flex items-center justify-center">
                  <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-xs font-bold text-blue-600">
                      {Math.round(validationSummary.averageScore / 20)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Product Schema Validation Results</CardTitle>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={validationFilter}
                onChange={(e) => setValidationFilter(e.target.value as any)}
                className="border rounded px-3 py-1 text-sm"
              >
                <option value="all">All Products</option>
                <option value="valid">Valid Only</option>
                <option value="warning">Warnings Only</option>
                <option value="error">Errors Only</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredResults.length === 0 ? (
            <div className="text-center py-8">
              <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No validation results found. Run validation to see results.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredResults.map((result) => (
                <div key={result.productId} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(result.status)}
                      <div>
                        <h3 className="font-semibold">{result.productName}</h3>
                        <p className="text-sm text-gray-600">SKU: {result.productId}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={getStatusColor(result.status)}>
                        {result.status.toUpperCase()}
                      </Badge>
                      <div className="text-right">
                        <p className="text-sm font-semibold">{result.score}%</p>
                        <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-600" 
                            style={{ width: `${result.score}%` }}
                          />
                        </div>
                      </div>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedProduct(result)}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Details
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                              {getStatusIcon(result.status)}
                              Schema Validation Details - {result.productName}
                            </DialogTitle>
                          </DialogHeader>
                          
                          <div className="space-y-6">
                            {/* Quick Actions */}
                            <div className="flex gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => window.open(`/products/${result.slug}`, '_blank')}
                              >
                                <ExternalLink className="w-4 h-4 mr-2" />
                                View Product
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => window.open(`https://search.google.com/test/rich-results?url=${encodeURIComponent(window.location.origin + '/products/' + result.slug)}`, '_blank')}
                              >
                                <ExternalLink className="w-4 h-4 mr-2" />
                                Test in Google
                              </Button>
                            </div>

                            {/* Issues */}
                            {result.issues.length > 0 && (
                              <div>
                                <h4 className="font-semibold mb-3">Issues Found</h4>
                                <div className="space-y-2">
                                  {result.issues.map((issue, index) => (
                                    <Alert key={index} className={
                                      issue.type === 'error' ? 'border-red-200 bg-red-50' :
                                      issue.type === 'warning' ? 'border-yellow-200 bg-yellow-50' :
                                      'border-blue-200 bg-blue-50'
                                    }>
                                      <AlertDescription>
                                        <div className="flex items-start gap-2">
                                          {issue.type === 'error' && <XCircle className="w-4 h-4 text-red-600 mt-0.5" />}
                                          {issue.type === 'warning' && <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />}
                                          {issue.type === 'info' && <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5" />}
                                          <div>
                                            <p className="font-medium">{issue.field}: {issue.message}</p>
                                            {issue.suggestion && (
                                              <p className="text-sm text-gray-600 mt-1">💡 {issue.suggestion}</p>
                                            )}
                                          </div>
                                        </div>
                                      </AlertDescription>
                                    </Alert>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Field Validation Tabs */}
                            <Tabs defaultValue="required" className="w-full">
                              <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="required">Required Fields</TabsTrigger>
                                <TabsTrigger value="recommended">Recommended Fields</TabsTrigger>
                                <TabsTrigger value="seo">SEO Fields</TabsTrigger>
                              </TabsList>
                              
                              <TabsContent value="required" className="space-y-3">
                                {result.requiredFields.map((field, index) => (
                                  <div key={index} className="flex items-center justify-between p-3 border rounded">
                                    <div className="flex items-center gap-2">
                                      {field.present ? 
                                        <CheckCircle className="w-4 h-4 text-green-600" /> :
                                        <XCircle className="w-4 h-4 text-red-600" />
                                      }
                                      <span className="font-medium">{field.field}</span>
                                    </div>
                                    <div className="text-right">
                                      {field.present ? (
                                        <span className="text-sm text-green-600">Present</span>
                                      ) : (
                                        <span className="text-sm text-red-600">Missing</span>
                                      )}
                                      {field.issue && (
                                        <p className="text-xs text-gray-600">{field.issue}</p>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </TabsContent>
                              
                              <TabsContent value="recommended" className="space-y-3">
                                {result.recommendedFields.map((field, index) => (
                                  <div key={index} className="flex items-center justify-between p-3 border rounded">
                                    <div className="flex items-center gap-2">
                                      {field.present ? 
                                        <CheckCircle className="w-4 h-4 text-green-600" /> :
                                        <AlertTriangle className="w-4 h-4 text-yellow-600" />
                                      }
                                      <span className="font-medium">{field.field}</span>
                                    </div>
                                    <div className="text-right">
                                      {field.present ? (
                                        <span className="text-sm text-green-600">Present</span>
                                      ) : (
                                        <span className="text-sm text-yellow-600">Recommended</span>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </TabsContent>
                              
                              <TabsContent value="seo" className="space-y-3">
                                {result.seoFields.map((field, index) => (
                                  <div key={index} className="flex items-center justify-between p-3 border rounded">
                                    <div className="flex items-center gap-2">
                                      {field.present ? 
                                        <CheckCircle className="w-4 h-4 text-green-600" /> :
                                        <AlertTriangle className="w-4 h-4 text-yellow-600" />
                                      }
                                      <span className="font-medium">{field.field}</span>
                                    </div>
                                    <div className="text-right">
                                      {field.present ? (
                                        <span className="text-sm text-green-600">Optimized</span>
                                      ) : (
                                        <span className="text-sm text-yellow-600">Needs SEO</span>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </TabsContent>
                            </Tabs>
                          </div>
                        </DialogContent>
                      </Dialog>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => window.open(`/products/${result.slug}`, '_blank')}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Quick Issues Preview */}
                  {result.issues.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {result.issues.slice(0, 3).map((issue, index) => (
                        <Badge key={index} variant="outline" className={
                          issue.type === 'error' ? 'border-red-300 text-red-700' :
                          issue.type === 'warning' ? 'border-yellow-300 text-yellow-700' :
                          'border-blue-300 text-blue-700'
                        }>
                          {issue.field}: {issue.message}
                        </Badge>
                      ))}
                      {result.issues.length > 3 && (
                        <Badge variant="outline" className="text-gray-600">
                          +{result.issues.length - 3} more
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Common Issues Summary */}
      {validationSummary?.commonIssues && validationSummary.commonIssues.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Most Common Issues</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {validationSummary.commonIssues.map((issue, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded">
                  <span className="font-medium">{issue.issue}</span>
                  <Badge variant="outline">{issue.count} products</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}