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
  Code,
  Tags,
  Trash2,
  Save,
  X,
  Monitor
} from "lucide-react";
import type { Product, Category, ProductTag } from "@shared/schema";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";



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

  // Fetch tags
  const { data: tags, isLoading: tagsLoading } = useQuery({
    queryKey: ["/api/admin/tags"],
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

  // Delete product mutation
  const deleteProductMutation = useMutation({
    mutationFn: async (productId: number) => {
      const response = await apiRequest(`/api/admin/products/${productId}`, { 
        method: "DELETE"
      });
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Product deleted successfully" });
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
        description: "Failed to delete product",
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
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="products">Products</TabsTrigger>
              <TabsTrigger value="categories">Categories</TabsTrigger>
              <TabsTrigger value="tags">Tags</TabsTrigger>
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
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => {
                                        if (window.confirm(`Are you sure you want to delete "${product.name}"? This action cannot be undone.`)) {
                                          deleteProductMutation.mutate(product.id);
                                        }
                                      }}
                                      disabled={deleteProductMutation.isPending}
                                      title="Delete Product"
                                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    >
                                      <Trash2 className="w-4 h-4" />
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

            {/* Tags Management Tab */}
            <TabsContent value="tags" className="mt-6">
              <TagsManagement 
                tags={tags || []}
                loading={tagsLoading}
              />
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

// TagsManagement Component
function TagsManagement({ tags, loading }: any) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTag, setEditingTag] = useState(null);

  const createTagMutation = useMutation({
    mutationFn: async (tagData: any) => {
      return apiRequest("/api/admin/tags", {
        method: "POST",
        body: JSON.stringify(tagData),
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Tag created successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/tags"] });
      setShowCreateForm(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create tag",
        variant: "destructive",
      });
    },
  });

  const updateTagMutation = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      return apiRequest(`/api/admin/tags/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Tag updated successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/tags"] });
      setEditingTag(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update tag",
        variant: "destructive",
      });
    },
  });

  const deleteTagMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/admin/tags/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Tag deleted successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/tags"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete tag",
        variant: "destructive",
      });
    },
  });

  const migrateTagsMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("/api/admin/tags/migrate", {
        method: "POST",
        body: JSON.stringify({}),
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Certification tags synchronized successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/tags"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to synchronize tags",
        variant: "destructive",
      });
    },
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Tags className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading tags...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tags Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Tags Management</h2>
          <p className="text-gray-600">Create and manage product tags for filtering and SEO</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline"
            onClick={() => migrateTagsMutation.mutate()}
            disabled={migrateTagsMutation.isPending}
            className="flex items-center gap-2"
          >
            <Package className="h-4 w-4" />
            {migrateTagsMutation.isPending ? "Syncing..." : "Sync Product Tags"}
          </Button>
          <Button 
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Tag
          </Button>
        </div>
      </div>

      {/* Quick Add Predefined Tags */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Quick Add Common Tags</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {['USDA NOP', 'NPOP', 'EU Organic', 'FDA Approved', 'GMP Certified', 'ISO Certified', 'Kosher', 'Halal', 'Non-GMO', 'Gluten Free'].map((tagName) => (
              <Button
                key={tagName}
                variant="outline"
                size="sm"
                onClick={() => createTagMutation.mutate({ 
                  name: tagName, 
                  color: '#22C55E',
                  description: `Certification tag: ${tagName}`,
                  isActive: true
                })}
                disabled={createTagMutation.isPending || tags?.some((tag: any) => tag.name === tagName)}
              >
                {tags?.some((tag: any) => tag.name === tagName) ? (
                  <CheckCircle className="h-3 w-3 mr-1" />
                ) : (
                  <Plus className="h-3 w-3 mr-1" />
                )}
                {tagName}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tags List */}
      <div className="grid gap-4">
        {tags && tags.length > 0 ? (
          tags.map((tag: any) => (
            <Card key={tag.id}>
              <CardContent className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-4 h-4 rounded-full border"
                    style={{ backgroundColor: tag.color || '#22C55E' }}
                  />
                  <div>
                    <h4 className="font-medium text-gray-900">{tag.name}</h4>
                    {tag.description && (
                      <p className="text-sm text-gray-500">{tag.description}</p>
                    )}
                  </div>
                  <Badge variant={tag.isActive ? "secondary" : "outline"}>
                    {tag.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingTag(tag)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteTagMutation.mutate(tag.id)}
                    disabled={deleteTagMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Tags className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Tags</h3>
              <p className="text-gray-500 mb-4">Start by adding your first product tag</p>
              <Button onClick={() => setShowCreateForm(true)}>
                Add Tag
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create/Edit Tag Form */}
      {(showCreateForm || editingTag) && (
        <TagForm
          tag={editingTag}
          onSubmit={(data) => {
            if (editingTag) {
              updateTagMutation.mutate({ id: editingTag.id, ...data });
            } else {
              createTagMutation.mutate(data);
            }
          }}
          onCancel={() => {
            setShowCreateForm(false);
            setEditingTag(null);
          }}
          isLoading={createTagMutation.isPending || updateTagMutation.isPending}
        />
      )}
    </div>
  );
}

// Tag Form Component
const tagFormSchema = z.object({
  name: z.string().min(1, "Tag name is required"),
  slug: z.string().optional(),
  color: z.string().default("#22C55E"),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});

function TagForm({ tag, onSubmit, onCancel, isLoading }: any) {
  const form = useForm({
    resolver: zodResolver(tagFormSchema),
    defaultValues: {
      name: tag?.name || "",
      slug: tag?.slug || "",
      color: tag?.color || "#22C55E",
      description: tag?.description || "",
      isActive: tag?.isActive ?? true,
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{tag ? "Edit Tag" : "Create Tag"}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tag Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., EU Organic" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Color</FormLabel>
                    <FormControl>
                      <Input type="color" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Brief description of this tag..."
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Active Status</FormLabel>
                    <FormDescription>
                      Active tags will be available for product assignment
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Saving..." : tag ? "Update Tag" : "Create Tag"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}