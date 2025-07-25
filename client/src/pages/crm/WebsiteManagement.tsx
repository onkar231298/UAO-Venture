import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import RoleBasedRoute from "@/components/RoleBasedRoute";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { 
  Settings, 
  Package, 
  FileText, 
  Image,
  Search,
  Plus,
  Edit,
  Eye,
  Upload,
  Globe,
  BarChart3,
  TrendingUp,
  Users,
  Zap,
  CheckCircle,
  AlertCircle,
  Camera,
  Layout,
  Code
} from "lucide-react";
import type { Product, Category } from "@shared/schema";

export default function WebsiteManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("products");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  // Queries
  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ["/api/products", { limit: 100 }],
  });

  const { data: categories } = useQuery({
    queryKey: ["/api/categories"],
  });

  // Mutations
  const updateProductMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Product> }) => {
      return await apiRequest("PUT", `/api/admin/products/${id}`, data);
    },
    onSuccess: () => {
      toast({ title: "Product updated successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => window.location.href = "/api/login", 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update product",
        variant: "destructive",
      });
    },
  });

  const createProductMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/admin/products", data);
    },
    onSuccess: () => {
      toast({ title: "Product created successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => window.location.href = "/api/login", 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to create product",
        variant: "destructive",
      });
    },
  });

  const filteredProducts = productsData?.products?.filter((product: Product) => {
    const matchesSearch = !searchQuery || 
      product.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.productId?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = !categoryFilter || product.categoryId?.toString() === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  const handleToggleVisibility = (productId: number, isActive: boolean) => {
    updateProductMutation.mutate({
      id: productId,
      data: { isActive: !isActive }
    });
  };

  const handleToggleOrderable = (productId: number, isOrderable: boolean) => {
    updateProductMutation.mutate({
      id: productId,
      data: { isOrderable: !isOrderable }
    });
  };

  return (
    <RoleBasedRoute allowedRoles={['super_admin', 'admin', 'website_manager', 'seo_manager']}>
      <div className="min-h-screen bg-background">
        <Header />
        
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Website Management</h1>
            <p className="text-gray-600">Manage products, content, SEO, and website configuration</p>
          </div>

          {/* Website Stats Cards */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Active Products</p>
                    <p className="text-2xl font-bold text-green-600">
                      {filteredProducts?.filter((p: Product) => p.isActive).length || 0}
                    </p>
                    <p className="text-xs text-green-600">Live on website</p>
                  </div>
                  <Package className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Categories</p>
                    <p className="text-2xl font-bold text-blue-600">{categories?.length || 0}</p>
                    <p className="text-xs text-blue-600">Product categories</p>
                  </div>
                  <Layout className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">SEO Score</p>
                    <p className="text-2xl font-bold text-purple-600">92%</p>
                    <p className="text-xs text-purple-600">Search optimized</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Page Views</p>
                    <p className="text-2xl font-bold text-orange-600">24.5K</p>
                    <p className="text-xs text-orange-600">This month</p>
                  </div>
                  <BarChart3 className="w-8 h-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="products">Products</TabsTrigger>
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="seo">SEO</TabsTrigger>
              <TabsTrigger value="media">Media</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            {/* Products Management Tab */}
            <TabsContent value="products" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Product Management</span>
                    <div className="flex space-x-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm">
                            <Plus className="w-4 h-4 mr-2" />
                            Add Product
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl">
                          <DialogHeader>
                            <DialogTitle>Add New Product</DialogTitle>
                          </DialogHeader>
                          <ProductForm 
                            categories={categories || []}
                            onSubmit={(data) => createProductMutation.mutate(data)}
                            isLoading={createProductMutation.isPending}
                          />
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Filters */}
                  <div className="flex flex-wrap gap-4 mb-6">
                    <div className="relative flex-1 min-w-64">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        placeholder="Search products..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="All Categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All Categories</SelectItem>
                        {categories?.map((category: Category) => (
                          <SelectItem key={category.id} value={category.id.toString()}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Products Table */}
                  {productsLoading ? (
                    <div className="space-y-4">
                      {Array.from({ length: 10 }).map((_, i) => (
                        <div key={i} className="animate-pulse bg-gray-100 h-16 rounded"></div>
                      ))}
                    </div>
                  ) : filteredProducts?.length ? (
                    <div className="overflow-x-auto">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Product</th>
                            <th>SKU</th>
                            <th>Category</th>
                            <th>Status</th>
                            <th>Visible</th>
                            <th>Orderable</th>
                            <th>SEO</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredProducts.map((product: Product) => {
                            const category = categories?.find((c: Category) => c.id === product.categoryId);
                            const hasImage = product.images && (product.images as string[]).length > 0;
                            const hasSEO = product.seoTitle && product.seoDescription;
                            
                            return (
                              <tr key={product.id}>
                                <td>
                                  <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                      {hasImage ? (
                                        <img 
                                          src={(product.images as string[])[0]} 
                                          alt={product.name}
                                          className="w-full h-full object-cover rounded-lg"
                                        />
                                      ) : (
                                        <Package className="w-5 h-5 text-gray-400" />
                                      )}
                                    </div>
                                    <div>
                                      <p className="font-medium">{product.name}</p>
                                      {product.isOrganic && (
                                        <Badge variant="outline" className="text-xs mt-1">
                                          <span className="text-green-600">Organic</span>
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                </td>
                                <td className="font-mono text-sm">{product.productId}</td>
                                <td>{category?.name || '-'}</td>
                                <td>
                                  <Badge variant={product.isActive ? "default" : "outline"}>
                                    {product.isActive ? "Active" : "Draft"}
                                  </Badge>
                                </td>
                                <td>
                                  <Switch
                                    checked={product.isActive || false}
                                    onCheckedChange={() => handleToggleVisibility(product.id, product.isActive || false)}
                                    disabled={updateProductMutation.isPending}
                                  />
                                </td>
                                <td>
                                  <Switch
                                    checked={product.isOrderable || false}
                                    onCheckedChange={() => handleToggleOrderable(product.id, product.isOrderable || false)}
                                    disabled={updateProductMutation.isPending}
                                  />
                                </td>
                                <td>
                                  <div className="flex items-center space-x-1">
                                    {hasSEO ? (
                                      <CheckCircle className="w-4 h-4 text-green-500" />
                                    ) : (
                                      <AlertCircle className="w-4 h-4 text-orange-500" />
                                    )}
                                  </div>
                                </td>
                                <td>
                                  <div className="flex space-x-2">
                                    <Button variant="outline" size="sm">
                                      <Eye className="w-4 h-4" />
                                    </Button>
                                    <Button variant="outline" size="sm">
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No products found</h3>
                      <p className="text-gray-600">Start by adding your first product</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Content Management Tab */}
            <TabsContent value="content" className="mt-6">
              <div className="grid lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Homepage Content</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="p-4 border rounded-lg">
                        <h4 className="font-medium mb-2">Hero Section</h4>
                        <p className="text-sm text-gray-600 mb-3">Main banner and promotional content</p>
                        <Button variant="outline" size="sm">
                          <Edit className="w-4 h-4 mr-2" />
                          Edit Hero
                        </Button>
                      </div>
                      
                      <div className="p-4 border rounded-lg">
                        <h4 className="font-medium mb-2">Featured Products</h4>
                        <p className="text-sm text-gray-600 mb-3">Products displayed on homepage</p>
                        <Button variant="outline" size="sm">
                          <Settings className="w-4 h-4 mr-2" />
                          Configure
                        </Button>
                      </div>
                      
                      <div className="p-4 border rounded-lg">
                        <h4 className="font-medium mb-2">Testimonials</h4>
                        <p className="text-sm text-gray-600 mb-3">Customer reviews and feedback</p>
                        <Button variant="outline" size="sm">
                          <Users className="w-4 h-4 mr-2" />
                          Manage
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Pages & Policies</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="p-4 border rounded-lg">
                        <h4 className="font-medium mb-2">About Us</h4>
                        <p className="text-sm text-gray-600 mb-3">Company information and story</p>
                        <Button variant="outline" size="sm">
                          <FileText className="w-4 h-4 mr-2" />
                          Edit Page
                        </Button>
                      </div>
                      
                      <div className="p-4 border rounded-lg">
                        <h4 className="font-medium mb-2">Privacy Policy</h4>
                        <p className="text-sm text-gray-600 mb-3">Data protection and privacy terms</p>
                        <Button variant="outline" size="sm">
                          <FileText className="w-4 h-4 mr-2" />
                          Edit Policy
                        </Button>
                      </div>
                      
                      <div className="p-4 border rounded-lg">
                        <h4 className="font-medium mb-2">Terms of Service</h4>
                        <p className="text-sm text-gray-600 mb-3">Service terms and conditions</p>
                        <Button variant="outline" size="sm">
                          <FileText className="w-4 h-4 mr-2" />
                          Edit Terms
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* SEO Management Tab */}
            <TabsContent value="seo" className="mt-6">
              <div className="grid lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>SEO Configuration</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <Label>Site Title</Label>
                        <Input defaultValue="BFI Organic - Premium B2B Organic Ingredients" />
                      </div>
                      
                      <div>
                        <Label>Meta Description</Label>
                        <Textarea 
                          defaultValue="Leading supplier of certified organic ingredients for the nutrition, food, and cosmetic industries. Premium quality, bulk quantities, global shipping."
                          rows={3}
                        />
                      </div>
                      
                      <div>
                        <Label>Keywords</Label>
                        <Textarea 
                          defaultValue="organic ingredients, bulk organic, herbal powders, organic extracts, B2B ingredients, certified organic"
                          rows={2}
                        />
                      </div>
                      
                      <Button>
                        <Zap className="w-4 h-4 mr-2" />
                        Update SEO Settings
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Structured Data</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="p-4 bg-green-50 rounded-lg">
                        <div className="flex items-center space-x-2 mb-2">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          <h4 className="font-medium text-green-900">Schema Markup</h4>
                        </div>
                        <p className="text-sm text-green-800">
                          Structured data is properly configured for products and organization
                        </p>
                      </div>
                      
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <div className="flex items-center space-x-2 mb-2">
                          <Globe className="w-5 h-5 text-blue-600" />
                          <h4 className="font-medium text-blue-900">Sitemap</h4>
                        </div>
                        <p className="text-sm text-blue-800 mb-2">
                          XML sitemap is automatically generated and updated
                        </p>
                        <Button variant="outline" size="sm">
                          <Code className="w-4 h-4 mr-2" />
                          View Sitemap
                        </Button>
                      </div>
                      
                      <div className="p-4 bg-purple-50 rounded-lg">
                        <div className="flex items-center space-x-2 mb-2">
                          <BarChart3 className="w-5 h-5 text-purple-600" />
                          <h4 className="font-medium text-purple-900">SEO Score</h4>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="flex-1 bg-purple-200 rounded-full h-2">
                            <div className="bg-purple-600 h-2 rounded-full" style={{ width: '92%' }}></div>
                          </div>
                          <span className="text-sm font-medium text-purple-900">92%</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Media Management Tab */}
            <TabsContent value="media" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Media Library</span>
                    <Button size="sm">
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Media
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Image className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Media Management</h3>
                    <p className="text-gray-600 mb-4">Upload and manage product images, banners, and other media files</p>
                    
                    <div className="grid md:grid-cols-3 gap-4 text-left mt-6">
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <Camera className="w-8 h-8 text-blue-600 mb-2" />
                        <h4 className="font-medium text-blue-900 mb-1">Product Images</h4>
                        <p className="text-sm text-blue-800">High-resolution product photos</p>
                      </div>
                      
                      <div className="p-4 bg-green-50 rounded-lg">
                        <Layout className="w-8 h-8 text-green-600 mb-2" />
                        <h4 className="font-medium text-green-900 mb-1">Banners</h4>
                        <p className="text-sm text-green-800">Homepage and promotional banners</p>
                      </div>
                      
                      <div className="p-4 bg-purple-50 rounded-lg">
                        <FileText className="w-8 h-8 text-purple-600 mb-2" />
                        <h4 className="font-medium text-purple-900 mb-1">Documents</h4>
                        <p className="text-sm text-purple-800">COAs, certificates, specifications</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="mt-6">
              <div className="grid lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Website Settings</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Maintenance Mode</Label>
                          <p className="text-sm text-gray-600">Temporarily disable public access</p>
                        </div>
                        <Switch />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Registration Enabled</Label>
                          <p className="text-sm text-gray-600">Allow new customer registrations</p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Product Reviews</Label>
                          <p className="text-sm text-gray-600">Enable customer product reviews</p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Newsletter Signup</Label>
                          <p className="text-sm text-gray-600">Show newsletter subscription form</p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Contact Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <Label>Business Phone</Label>
                        <Input defaultValue="+91-98765-43210" />
                      </div>
                      
                      <div>
                        <Label>Support Email</Label>
                        <Input defaultValue="info@bfiorganic.com" />
                      </div>
                      
                      <div>
                        <Label>Business Address</Label>
                        <Textarea 
                          defaultValue="123 Organic Industry Hub, Mumbai, Maharashtra 400001, India"
                          rows={3}
                        />
                      </div>
                      
                      <div>
                        <Label>Business Hours</Label>
                        <Input defaultValue="Monday - Friday: 9:00 AM - 6:00 PM IST" />
                      </div>
                      
                      <Button>
                        <Settings className="w-4 h-4 mr-2" />
                        Update Contact Info
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="mt-6">
              <div className="grid lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Website Analytics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-blue-50 rounded-lg">
                          <p className="text-sm text-blue-600">Page Views</p>
                          <p className="text-2xl font-bold text-blue-900">24.5K</p>
                          <p className="text-xs text-blue-600">+15% vs last month</p>
                        </div>
                        <div className="p-4 bg-green-50 rounded-lg">
                          <p className="text-sm text-green-600">Unique Visitors</p>
                          <p className="text-2xl font-bold text-green-900">8.2K</p>
                          <p className="text-xs text-green-600">+8% vs last month</p>
                        </div>
                        <div className="p-4 bg-purple-50 rounded-lg">
                          <p className="text-sm text-purple-600">Bounce Rate</p>
                          <p className="text-2xl font-bold text-purple-900">32%</p>
                          <p className="text-xs text-purple-600">-5% vs last month</p>
                        </div>
                        <div className="p-4 bg-orange-50 rounded-lg">
                          <p className="text-sm text-orange-600">Avg. Session</p>
                          <p className="text-2xl font-bold text-orange-900">4:32</p>
                          <p className="text-xs text-orange-600">+12% vs last month</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Popular Products</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm font-medium">Organic Turmeric Powder</span>
                        <span className="text-sm text-gray-600">1,234 views</span>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm font-medium">Organic Ashwagandha Powder</span>
                        <span className="text-sm text-gray-600">987 views</span>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm font-medium">Organic Moringa Powder</span>
                        <span className="text-sm text-gray-600">756 views</span>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm font-medium">Organic Spirulina Powder</span>
                        <span className="text-sm text-gray-600">623 views</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </RoleBasedRoute>
  );
}

// Product Form Component
function ProductForm({ 
  categories, 
  onSubmit, 
  isLoading,
  product
}: { 
  categories: Category[]; 
  onSubmit: (data: any) => void; 
  isLoading: boolean;
  product?: Product;
}) {
  const [formData, setFormData] = useState({
    name: product?.name || "",
    productId: product?.productId || "",
    description: product?.description || "",
    botanicalName: product?.botanicalName || "",
    plantPart: product?.plantPart || "",
    origin: product?.origin || "",
    categoryId: product?.categoryId?.toString() || "",
    form: product?.form || "",
    isOrganic: product?.isOrganic || false,
    isActive: product?.isActive ?? true,
    isOrderable: product?.isOrderable ?? true,
    moq: product?.moq?.toString() || "",
    rate: product?.rate?.toString() || "",
    packingSize: product?.packingSize || "",
    unit: product?.unit || "kg",
    seoTitle: product?.seoTitle || "",
    seoDescription: product?.seoDescription || "",
    seoKeywords: product?.seoKeywords || "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const slug = formData.name.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
    
    onSubmit({
      ...formData,
      slug,
      categoryId: formData.categoryId ? parseInt(formData.categoryId) : null,
      moq: formData.moq ? parseInt(formData.moq) : null,
      rate: formData.rate ? parseFloat(formData.rate) : null,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-h-[80vh] overflow-y-auto">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Product Name *</Label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            required
          />
        </div>
        <div>
          <Label>Product ID/SKU *</Label>
          <Input
            value={formData.productId}
            onChange={(e) => setFormData(prev => ({ ...prev, productId: e.target.value }))}
            required
          />
        </div>
      </div>
      
      <div>
        <Label>Description</Label>
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          rows={3}
        />
      </div>
      
      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label>Botanical Name</Label>
          <Input
            value={formData.botanicalName}
            onChange={(e) => setFormData(prev => ({ ...prev, botanicalName: e.target.value }))}
          />
        </div>
        <div>
          <Label>Plant Part</Label>
          <Input
            value={formData.plantPart}
            onChange={(e) => setFormData(prev => ({ ...prev, plantPart: e.target.value }))}
          />
        </div>
        <div>
          <Label>Origin</Label>
          <Input
            value={formData.origin}
            onChange={(e) => setFormData(prev => ({ ...prev, origin: e.target.value }))}
          />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Category</Label>
          <Select value={formData.categoryId} onValueChange={(value) => setFormData(prev => ({ ...prev, categoryId: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category: Category) => (
                <SelectItem key={category.id} value={category.id.toString()}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Form</Label>
          <Select value={formData.form} onValueChange={(value) => setFormData(prev => ({ ...prev, form: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Select form" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="powder">Powder</SelectItem>
              <SelectItem value="extract">Extract</SelectItem>
              <SelectItem value="oil">Oil</SelectItem>
              <SelectItem value="whole">Whole</SelectItem>
              <SelectItem value="capsule">Capsule</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>MOQ</Label>
          <Input
            type="number"
            value={formData.moq}
            onChange={(e) => setFormData(prev => ({ ...prev, moq: e.target.value }))}
          />
        </div>
        <div>
          <Label>Rate (Price Per Unit) *</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">$</span>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={formData.rate}
              onChange={(e) => setFormData(prev => ({ ...prev, rate: e.target.value }))}
              placeholder="0.25"
              className="pl-6"
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">Base price per unit</p>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Packing Size (One Unit) *</Label>
          <Input
            value={formData.packingSize}
            onChange={(e) => setFormData(prev => ({ ...prev, packingSize: e.target.value }))}
            placeholder="e.g., 25kg bag, 1kg pouch"
          />
          <p className="text-xs text-gray-500 mt-1">Standard package size</p>
        </div>
        <div>
          <Label>Unit</Label>
          <Select value={formData.unit} onValueChange={(value) => setFormData(prev => ({ ...prev, unit: value }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="kg">Kilograms</SelectItem>
              <SelectItem value="lbs">Pounds</SelectItem>
              <SelectItem value="tons">Metric Tons</SelectItem>
              <SelectItem value="grams">Grams</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <Switch
            checked={formData.isOrganic}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isOrganic: checked }))}
          />
          <Label>Organic</Label>
        </div>
      </div>
      
      <div className="space-y-4">
        <h3 className="font-medium">SEO Information</h3>
        <div>
          <Label>SEO Title</Label>
          <Input
            value={formData.seoTitle}
            onChange={(e) => setFormData(prev => ({ ...prev, seoTitle: e.target.value }))}
            placeholder="Product name - Category | BFI Organic"
          />
        </div>
        <div>
          <Label>SEO Description</Label>
          <Textarea
            value={formData.seoDescription}
            onChange={(e) => setFormData(prev => ({ ...prev, seoDescription: e.target.value }))}
            rows={2}
            placeholder="Brief description for search engines (150-160 characters)"
          />
        </div>
        <div>
          <Label>Keywords</Label>
          <Input
            value={formData.seoKeywords}
            onChange={(e) => setFormData(prev => ({ ...prev, seoKeywords: e.target.value }))}
            placeholder="organic, powder, herbal, extract (comma separated)"
          />
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <Switch
            checked={formData.isActive}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
          />
          <Label>Active (Visible on website)</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            checked={formData.isOrderable}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isOrderable: checked }))}
          />
          <Label>Orderable</Label>
        </div>
      </div>
      
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Saving..." : product ? "Update Product" : "Create Product"}
      </Button>
    </form>
  );
}
