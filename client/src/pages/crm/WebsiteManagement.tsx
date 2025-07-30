import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import RoleBasedRoute from "@/components/RoleBasedRoute";
import CategoryManagement from "@/components/CategoryManagement";
import BulkProductUpload from "@/components/BulkProductUpload";
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

// Simple Product Form Component
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
    healthSupport: product?.healthSupport || "",
    categoryId: product?.categoryId?.toString() || "",
    form: product?.form || "",
    isOrganic: product?.isOrganic || false,
    isActive: product?.isActive ?? true,
    isOrderable: product?.isOrderable ?? true,
    moq: product?.moq?.toString() || "",
    rate: product?.rate?.toString() || "",
    packingSize: product?.packingSize || "",
    priceUSD: product?.priceUSD?.toString() || "",
    priceINR: product?.priceINR?.toString() || "",
    priceEUR: product?.priceEUR?.toString() || "",
    priceGBP: product?.priceGBP?.toString() || "",
    priceType: product?.priceType || "EXW",
    priceLocation: product?.priceLocation || "Warehouse India",
    seoTitle: product?.seoTitle || "",
    seoDescription: product?.seoDescription || "",
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
      priceUSD: formData.priceUSD ? parseFloat(formData.priceUSD) : null,
      priceINR: formData.priceINR ? parseFloat(formData.priceINR) : null,
      priceEUR: formData.priceEUR ? parseFloat(formData.priceEUR) : null,
      priceGBP: formData.priceGBP ? parseFloat(formData.priceGBP) : null,
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
          <Label>Product ID</Label>
          <Input
            value={formData.productId}
            onChange={(e) => setFormData(prev => ({ ...prev, productId: e.target.value }))}
            placeholder="Auto-generated if left empty"
          />
        </div>
      </div>

      <div>
        <Label>Description *</Label>
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          rows={3}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Category *</Label>
          <Select value={formData.categoryId} onValueChange={(value) => setFormData(prev => ({ ...prev, categoryId: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map(category => (
                <SelectItem key={category.id} value={category.id.toString()}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Origin</Label>
          <Input
            value={formData.origin}
            onChange={(e) => setFormData(prev => ({ ...prev, origin: e.target.value }))}
            placeholder="e.g., India"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Price (USD)</Label>
          <Input
            type="number"
            step="0.01"
            value={formData.priceUSD}
            onChange={(e) => setFormData(prev => ({ ...prev, priceUSD: e.target.value }))}
            placeholder="0.00"
          />
        </div>
        <div>
          <Label>MOQ</Label>
          <Input
            type="number"
            value={formData.moq}
            onChange={(e) => setFormData(prev => ({ ...prev, moq: e.target.value }))}
            placeholder="Minimum order quantity"
          />
        </div>
      </div>

      <div className="flex items-center space-x-6">
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

export default function WebsiteManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State for filters and search
  const [activeTab, setActiveTab] = useState("products");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [visibilityFilter, setVisibilityFilter] = useState("all");

  // Fetch categories
  const { data: categories } = useQuery({
    queryKey: ["/api/categories"],
  });

  // Fetch products
  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ["/api/admin/products"],
  });

  // Update product mutation
  const updateProductMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return await apiRequest(`/api/admin/products/${id}`, { method: "PUT", body: data });
    },
    onSuccess: () => {
      toast({ title: "Product updated successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/products"] });
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
      return await apiRequest("/api/admin/products", { method: "POST", body: data });
    },
    onSuccess: () => {
      toast({ title: "Product created successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/products"] });
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

  // Extract products from API response safely
  const products = Array.isArray(productsData?.products) ? productsData.products as Product[] : [];
  const filteredProducts = products;

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
                    <p className="text-sm text-gray-600">Total Products</p>
                    <p className="text-2xl font-bold text-blue-600">{products?.length || 0}</p>
                    <p className="text-xs text-blue-600">In database</p>
                  </div>
                  <FileText className="w-8 h-8 text-blue-600" />
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
          </div>

          {/* Main Content Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="products">Products</TabsTrigger>
              <TabsTrigger value="categories">Categories</TabsTrigger>
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="seo">SEO</TabsTrigger>
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
                          <Button size="sm" variant="outline">
                            <Upload className="w-4 h-4 mr-2" />
                            Bulk Upload
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Bulk Product Upload</DialogTitle>
                          </DialogHeader>
                          <BulkProductUpload />
                        </DialogContent>
                      </Dialog>
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
                  {/* TESTING - This should show if CardContent renders */}
                  <div className="bg-green-500 text-white text-center p-4 mb-4" style={{position: 'relative', zIndex: 9999}}>
                    ✅ FILTER SECTION WORKING - FRESH VERSION
                  </div>
                  
                  {/* Search, Filter, and Sort Controls */}
                  <div className="space-y-4 mb-6 bg-blue-50 border-2 border-blue-500 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-blue-900 mb-3">🔍 Filter & Search Products</h3>
                    
                    {/* Primary Search Bar */}
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search products by name, SKU, description..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    
                    {/* Filter Controls */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                      <div>
                        <Label className="text-xs text-gray-600 mb-1 block">Category</Label>
                        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="All Categories" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Categories</SelectItem>
                            {categories?.map((category: Category) => (
                              <SelectItem key={category.id} value={category.id.toString()}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-xs text-gray-600 mb-1 block">Product Status</Label>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="All Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-xs text-gray-600 mb-1 block">Date Added</Label>
                        <Select value={dateFilter} onValueChange={setDateFilter}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="All Time" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Time</SelectItem>
                            <SelectItem value="today">Today</SelectItem>
                            <SelectItem value="week">This Week</SelectItem>
                            <SelectItem value="month">This Month</SelectItem>
                            <SelectItem value="3months">Last 3 Months</SelectItem>
                            <SelectItem value="6months">Last 6 Months</SelectItem>
                            <SelectItem value="year">This Year</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-xs text-gray-600 mb-1 block">Visibility</Label>
                        <Select value={visibilityFilter} onValueChange={setVisibilityFilter}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="All Products" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Products</SelectItem>
                            <SelectItem value="visible">Visible</SelectItem>
                            <SelectItem value="hidden">Hidden</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-xs text-gray-600 mb-1 block">Sort By</Label>
                        <Select value={sortBy} onValueChange={setSortBy}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Latest First" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="newest">Latest First</SelectItem>
                            <SelectItem value="oldest">Oldest First</SelectItem>
                            <SelectItem value="name-az">Name A-Z</SelectItem>
                            <SelectItem value="name-za">Name Z-A</SelectItem>
                            <SelectItem value="price-high">Price High-Low</SelectItem>
                            <SelectItem value="price-low">Price Low-High</SelectItem>
                            <SelectItem value="sku-az">SKU A-Z</SelectItem>
                            <SelectItem value="sku-za">SKU Z-A</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setSearchQuery("");
                            setCategoryFilter("all");
                            setSortBy("newest");
                            setStatusFilter("all");
                            setDateFilter("all");
                            setVisibilityFilter("all");
                          }}
                          className="w-full mt-4"
                        >
                          Clear All Filters
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Product Count and Selection */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <input 
                        type="checkbox" 
                        id="select-all"
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <Label htmlFor="select-all" className="font-medium">
                        Select All Products ({filteredProducts?.length || 0})
                      </Label>
                    </div>
                    <div className="text-sm text-gray-600">
                      Showing {filteredProducts?.length || 0} of {products?.length || 0} products
                    </div>
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
                      <table className="w-full border-collapse border border-gray-200">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="border border-gray-200 p-3 text-left">Product</th>
                            <th className="border border-gray-200 p-3 text-left">SKU</th>
                            <th className="border border-gray-200 p-3 text-left">Category</th>
                            <th className="border border-gray-200 p-3 text-left">Status</th>
                            <th className="border border-gray-200 p-3 text-left">Visible</th>
                            <th className="border border-gray-200 p-3 text-left">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredProducts.map((product: Product) => {
                            const category = categories?.find((c: Category) => c.id === product.categoryId);
                            
                            return (
                              <tr key={product.id} className="hover:bg-gray-50">
                                <td className="border border-gray-200 p-3">
                                  <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                      <Package className="w-5 h-5 text-gray-400" />
                                    </div>
                                    <div>
                                      <p className="font-medium">{product.name}</p>
                                      <p className="text-sm text-gray-600">{product.productId}</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="border border-gray-200 p-3">
                                  <Badge variant="outline">{product.productId}</Badge>
                                </td>
                                <td className="border border-gray-200 p-3">
                                  {category?.name || "Uncategorized"}
                                </td>
                                <td className="border border-gray-200 p-3">
                                  <Badge variant={product.isActive ? "default" : "secondary"}>
                                    {product.isActive ? "Active" : "Inactive"}
                                  </Badge>
                                </td>
                                <td className="border border-gray-200 p-3">
                                  <Switch
                                    checked={product.isActive || false}
                                    onCheckedChange={() => handleToggleVisibility(product.id, product.isActive || false)}
                                    disabled={updateProductMutation.isPending}
                                  />
                                </td>
                                <td className="border border-gray-200 p-3">
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

            {/* Categories Management Tab */}
            <TabsContent value="categories" className="mt-6">
              <CategoryManagement />
            </TabsContent>

            {/* Content Management Tab */}
            <TabsContent value="content" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Content Management</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>Content management features coming soon...</p>
                </CardContent>
              </Card>
            </TabsContent>

            {/* SEO Management Tab */}
            <TabsContent value="seo" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>SEO Management</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>SEO management features coming soon...</p>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Analytics</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>Analytics features coming soon...</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </RoleBasedRoute>
  );
}