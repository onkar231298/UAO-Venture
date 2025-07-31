import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import RoleBasedRoute from "@/components/RoleBasedRoute";
import CategoryManagement from "@/components/CategoryManagement";
import BulkProductUpload from "@/components/BulkProductUpload";
import ComprehensiveProductForm from "@/components/ComprehensiveProductForm";

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
  
  // State for filters and search
  const [activeTab, setActiveTab] = useState("products");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [visibilityFilter, setVisibilityFilter] = useState("all");
  
  // Multiple selection state
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);

  // Debug log
  console.log("WebsiteManagement component rendering", { searchQuery, activeTab });

  // Fetch categories
  const { data: categories } = useQuery({
    queryKey: ["/api/categories"],
  });

  // Fetch products with enhanced parameters
  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ["/api/admin/products", { 
      search: searchQuery, 
      category: categoryFilter !== "all" ? categoryFilter : undefined,
      status: statusFilter !== "all" ? statusFilter : undefined,
      sort: sortBy,
      dateFilter: dateFilter !== "all" ? dateFilter : undefined,
      visibility: visibilityFilter !== "all" ? visibilityFilter : undefined
    }],
  });

  // Fetch dashboard stats for accurate totals
  const { data: dashboardStats } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  // Update product mutation
  const updateProductMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await apiRequest(`/api/admin/products/${id}`, { 
        method: "PUT", 
        body: JSON.stringify(data) 
      });
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Product updated successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
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
      const response = await apiRequest("/api/admin/products", { 
        method: "POST", 
        body: JSON.stringify(data) 
      });
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Product created successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
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

  // Handle individual product selection
  const handleProductSelect = (productId: number) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  // Handle select all functionality
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(filteredProducts.map(p => p.id));
    }
    setSelectAll(!selectAll);
  };

  // Bulk update products
  const bulkUpdateProducts = async (updates: any) => {
    try {
      // Process all updates in parallel for better performance
      const updatePromises = selectedProducts.map(productId => 
        updateProductMutation.mutateAsync({
          id: productId,
          data: updates
        })
      );
      
      await Promise.all(updatePromises);
      
      // Force cache refresh after all updates complete
      await queryClient.invalidateQueries({ queryKey: ["/api/admin/products"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      
      toast({ 
        title: `Successfully ${updates.isActive ? 'activated' : 'deactivated'} ${selectedProducts.length} products` 
      });
      
      setSelectedProducts([]);
      setSelectAll(false);
    } catch (error) {
      console.error('Bulk update failed:', error);
      toast({
        title: "Error",
        description: "Some products failed to update",
        variant: "destructive",
      });
    }
  };

  return (
    <RoleBasedRoute allowedRoles={['super_admin', 'admin', 'website_manager', 'seo_manager']}>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          {/* Admin Breadcrumb */}
          <div className="mb-4">
            <nav className="text-sm text-gray-500">
              <span>Admin Dashboard</span> → <span className="text-gray-900 font-medium">Website Management</span>
            </nav>
          </div>
          
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
                      {dashboardStats?.activeProducts || 0}
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
                    <p className="text-2xl font-bold text-blue-600">{dashboardStats?.totalProducts || 0}</p>
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
                          <ComprehensiveProductForm 
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
                  {/* SIMPLE SEARCH AND FILTER */}
                  <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
                    <h3 className="text-lg font-semibold mb-4">🔍 Search & Filter Products</h3>
                    
                    {/* Search Bar */}
                    <div className="mb-4">
                      <Input
                        placeholder="Search products by name, SKU, description..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full"
                      />
                    </div>
                    
                    {/* Filter Row */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      {/* Category Filter */}
                      <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                        <SelectTrigger>
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

                      {/* Status Filter */}
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="All Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>

                      {/* Sort By */}
                      <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger>
                          <SelectValue placeholder="Sort By" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="newest">Latest First</SelectItem>
                          <SelectItem value="oldest">Oldest First</SelectItem>
                          <SelectItem value="name-az">Name A-Z</SelectItem>
                          <SelectItem value="name-za">Name Z-A</SelectItem>
                        </SelectContent>
                      </Select>

                      {/* Clear Filters */}
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setSearchQuery("");
                          setCategoryFilter("all");
                          setSortBy("newest");
                          setStatusFilter("all");
                        }}
                      >
                        Clear Filters
                      </Button>
                    </div>
                  </div>
                  
                  {/* Results Count */}
                  <div className="mb-4 text-sm text-gray-600">
                    Showing {filteredProducts?.length || 0} of {products?.length || 0} products
                  </div>

                  {/* Product Count and Selection */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <input 
                        type="checkbox" 
                        id="select-all"
                        checked={selectAll}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <Label htmlFor="select-all" className="font-medium">
                        Select All Products ({filteredProducts?.length || 0})
                      </Label>
                      
                      {/* Bulk Actions */}
                      {selectedProducts.length > 0 && (
                        <div className="flex space-x-2 ml-4">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => bulkUpdateProducts({ isActive: true })}
                          >
                            Activate Selected ({selectedProducts.length})
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => bulkUpdateProducts({ isActive: false })}
                          >
                            Deactivate Selected ({selectedProducts.length})
                          </Button>
                        </div>
                      )}
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
                            <th className="border border-gray-200 p-3 text-left">
                              <input 
                                type="checkbox" 
                                checked={selectAll}
                                onChange={handleSelectAll}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                            </th>
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
                                  <input 
                                    type="checkbox" 
                                    checked={selectedProducts.includes(product.id)}
                                    onChange={() => handleProductSelect(product.id)}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                  />
                                </td>
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
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => window.open(`/product/${product.slug}`, '_blank')}
                                      title="View Product"
                                    >
                                      <Eye className="w-4 h-4" />
                                    </Button>
                                    <Dialog>
                                      <DialogTrigger asChild>
                                        <Button 
                                          variant="outline" 
                                          size="sm"
                                          title="Edit Product"
                                          onClick={() => setEditingProduct(product)}
                                        >
                                          <Edit className="w-4 h-4" />
                                        </Button>
                                      </DialogTrigger>
                                      <DialogContent className="max-w-4xl">
                                        <DialogHeader>
                                          <DialogTitle>Edit Product: {product.name}</DialogTitle>
                                        </DialogHeader>
                                        <ComprehensiveProductForm 
                                          categories={categories || []}
                                          product={product}
                                          onSubmit={(data) => {
                                            updateProductMutation.mutate({ 
                                              id: product.id, 
                                              data
                                            });
                                          }}
                                          isLoading={updateProductMutation.isPending}
                                        />
                                      </DialogContent>
                                    </Dialog>
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