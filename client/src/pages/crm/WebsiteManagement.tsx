import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import RoleBasedRoute from "@/components/RoleBasedRoute";
import CategoryManagement from "@/components/CategoryManagement";
import BulkProductUpload from "@/components/BulkProductUpload";
import ComprehensiveProductForm from "@/components/ComprehensiveProductForm";
import SeoManagement from "@/pages/crm/SeoManagement";
import HeroSliderManagement from "@/components/HeroSliderManagement";
import GlobalSeoSettings from "@/components/GlobalSeoSettings";
import KeywordPerformanceDashboard from "@/components/KeywordPerformanceDashboard";

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
  Monitor,
  Building2,
  MessageSquare,
  Download,
  Loader2
} from "lucide-react";
import type { Product, Category, ProductTag } from "@shared/schema";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";



// isActive is the operational truth (it drives the public site). A product counts as
// Draft only when it is not live AND still marked draft; otherwise not-live = Inactive.
// Keep in sync with the server-side filter mapping in storage.getAdminProducts.
function getEffectiveProductStatus(p: { isActive?: boolean | null; status?: string | null }): "Active" | "Inactive" | "Draft" {
  return p.isActive ? "Active" : p.status === "draft" ? "Draft" : "Inactive";
}

const PRODUCTS_PER_PAGE = 50;

// Compact page list for the pagination bar: 1 ... around-current ... last
function getPageNumbers(current: number, total: number): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | "...")[] = [1];
  if (current > 3) pages.push("...");
  for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) pages.push(i);
  if (current < total - 2) pages.push("...");
  pages.push(total);
  return pages;
}

export default function WebsiteManagement() {
  const { user } = useAuth();
  const userRole = (user as any)?.role as string | undefined;
  // Product deletion stays limited to admins/website managers; quality roles can
  // list/create/edit but the server rejects their deletes, so hide the button too.
  const canDeleteProducts = !!userRole && (userRole.includes('admin') || userRole === 'website_manager');
  const canManageSeo = !!userRole && ["admin", "super_admin", "seo_manager", "website_manager"].includes(userRole);
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
  const [editingProduct, setEditingProduct] = useState<any>(null);

  const [isDownloading, setIsDownloading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const downloadAllProducts = async () => {
    setIsDownloading(true);
    try {
      const response = await fetch('/api/admin/products?limit=10000', { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch products');
      const data: any = await response.json();
      const products: any[] = data.products || data || [];

      const csvHeaders = [
        'SKU', 'Name', 'Slug', 'Description', 'Status', 'Visible', 'Is Organic', 'Is Featured',
        'Botanical Name', 'Plant Part', 'Form', 'Origin', 'HS Code', 'Mesh Size',
        'MOQ', 'Stock Unit', 'Current Stock', 'Packing Size', 'Lead Time',
        'Base Price (USD)', 'Price INR', 'Price EUR', 'Price GBP', 'Currency', 'Price Type', 'Price Location',
        'Moisture', 'Bulk Density', 'Shelf Life', 'Storage Conditions',
        'SEO Title', 'SEO Description', 'Certifications', 'Main Image', 'Created At',
      ];

      const escapeCSV = (val: any) => {
        if (val === null || val === undefined) return '';
        const str = Array.isArray(val) ? val.join('; ') : String(val);
        const escaped = str.replace(/"/g, '""');
        return escaped.includes(',') || escaped.includes('"') || escaped.includes('\n') ? `"${escaped}"` : escaped;
      };

      const rows = products.map((p: any) => [
        p.productId, p.name, p.slug, p.description, getEffectiveProductStatus(p),
        p.isVisible ? 'Yes' : 'No', p.isOrganic ? 'Yes' : 'No', p.isFeatured ? 'Yes' : 'No',
        p.botanicalName, p.plantPart, p.form, p.origin, p.hsCode, p.meshSize,
        p.moq, p.stockUnit, p.currentStock, p.packingSize, p.leadTime,
        p.priceUSD || p.basePrice, p.priceINR, p.priceEUR, p.priceGBP,
        p.currency, p.priceType, p.priceLocation,
        p.moisture, p.bulkDensity, p.shelfLife, p.storageConditions,
        p.seoTitle, p.seoDescription,
        Array.isArray(p.certifications) ? p.certifications.join('; ') : (p.certifications || ''),
        p.mainImage,
        p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '',
      ].map(escapeCSV).join(','));

      const csv = [csvHeaders.join(','), ...rows].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bright-fame-products-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({ title: "Download complete", description: `${products.length} products exported to CSV.` });
    } catch {
      toast({ title: "Download failed", description: "Could not export products. Please try again.", variant: "destructive" });
    } finally {
      setIsDownloading(false);
    }
  };

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
      sortBy: sortBy,
      dateFilter: dateFilter !== "all" ? dateFilter : undefined,
      visibility: visibilityFilter !== "all" ? visibilityFilter : undefined,
      limit: PRODUCTS_PER_PAGE,
      offset: (currentPage - 1) * PRODUCTS_PER_PAGE
    }],
  });

  // Fetch dashboard stats for accurate totals
  const { data: dashboardStats } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });
  const { data: seoAudit } = useQuery<{ summary: { byStatus: Record<string, number>; bySeverity: Record<string, number> } }>({
    queryKey: ["/api/admin/seo/growth-opportunities"],
    enabled: canManageSeo,
  });
  const activeSeoActions = (seoAudit?.summary.byStatus.open || 0) + (seoAudit?.summary.byStatus.in_progress || 0);

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

  // Server-side pagination numbers
  const totalProducts = productsData?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalProducts / PRODUCTS_PER_PAGE));
  const showingStart = totalProducts === 0 ? 0 : (currentPage - 1) * PRODUCTS_PER_PAGE + 1;
  const showingEnd = (currentPage - 1) * PRODUCTS_PER_PAGE + products.length;
  const allOnPageSelected = filteredProducts.length > 0 && filteredProducts.every(p => selectedProducts.includes(p.id));

  const goToPage = (page: number) => {
    setCurrentPage(Math.min(Math.max(1, page), totalPages));
  };

  // One effect owns the page number. A search/filter/sort change ALWAYS resets to
  // page 1 and skips the shrink check that cycle (a cached result for the new filter
  // could otherwise snap to its last page first). Only afterwards, if deletions
  // shrink the list below the current page, snap back to the last page.
  const filterKey = JSON.stringify([searchQuery, categoryFilter, statusFilter, dateFilter, visibilityFilter, sortBy]);
  const prevFilterKeyRef = useRef(filterKey);
  useEffect(() => {
    if (prevFilterKeyRef.current !== filterKey) {
      prevFilterKeyRef.current = filterKey;
      setCurrentPage(1);
      return;
    }
    if (!productsLoading && totalProducts > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [filterKey, productsLoading, totalProducts, currentPage, totalPages]);

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
    const pageIds = filteredProducts.map(p => p.id);
    if (allOnPageSelected) {
      // Uncheck: drop only this page's products from the selection
      setSelectedProducts(prev => prev.filter(id => !pageIds.includes(id)));
    } else {
      // Check: add this page's products to whatever is already selected
      setSelectedProducts(prev => Array.from(new Set([...prev, ...pageIds])));
    }
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
    <RoleBasedRoute allowedRoles={['super_admin', 'admin', 'website_manager', 'seo_manager', 'quality_manager', 'quality_executive']}>
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
                    <p className="text-xs text-gray-500">
                      Live on website · {Math.max((dashboardStats?.totalProducts || 0) - (dashboardStats?.activeProducts || 0) - (dashboardStats?.draftProducts || 0), 0)} inactive · {dashboardStats?.draftProducts || 0} draft
                    </p>
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
                    <p className="text-sm text-gray-600">SEO Actions</p>
                    <p className="text-2xl font-bold text-purple-600">{canManageSeo ? activeSeoActions : "—"}</p>
                    <p className="text-xs text-purple-600">{canManageSeo ? `${seoAudit?.summary.bySeverity.critical || 0} critical findings` : "SEO manager access required"}</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="overflow-x-auto -mx-4 sm:mx-0 snap-x snap-mandatory" style={{ WebkitOverflowScrolling: 'touch' }}>
              <TabsList className="inline-flex min-w-min gap-2 w-full sm:w-auto px-4 sm:px-0">
                <TabsTrigger value="products" className="snap-start min-w-[100px]">Products</TabsTrigger>
                <TabsTrigger value="categories" className="snap-start min-w-[100px]">Categories</TabsTrigger>
                <TabsTrigger value="hero-slider" className="snap-start min-w-[100px]">Hero Slider</TabsTrigger>
                <TabsTrigger value="tags" className="snap-start min-w-[100px]">Tags</TabsTrigger>
                <TabsTrigger value="schema" className="snap-start min-w-[120px]">Schema Validator</TabsTrigger>
                {canManageSeo ? <>
                  <TabsTrigger value="seo" className="snap-start min-w-[100px]">SEO</TabsTrigger>
                  <TabsTrigger value="global-seo" className="snap-start min-w-[100px]">Global SEO</TabsTrigger>
                  <TabsTrigger value="analytics" className="snap-start min-w-[100px]">Analytics</TabsTrigger>
                </> : null}
              </TabsList>
            </div>

            {/* Products Management Tab */}
            <TabsContent value="products" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Product Management</span>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={downloadAllProducts}
                        disabled={isDownloading}
                      >
                        {isDownloading ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Download className="w-4 h-4 mr-2" />
                        )}
                        {isDownloading ? 'Downloading…' : 'Download All Products'}
                      </Button>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline">
                            <Upload className="w-4 h-4 mr-2" />
                            Bulk Upload
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="w-[95vw] max-w-6xl max-h-[90vh] overflow-y-auto">
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
                        <DialogContent className="w-[95vw] max-w-4xl">
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
                          <SelectItem value="draft">Draft</SelectItem>
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
                    {totalProducts === 0 ? "No products" : "Showing " + showingStart + "-" + showingEnd + " of " + totalProducts + " products"}
                  </div>

                  {/* Product Count and Selection */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <input 
                        type="checkbox" 
                        id="select-all"
                        checked={allOnPageSelected}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <Label htmlFor="select-all" className="font-medium">
                        Select All on Page ({filteredProducts?.length || 0})
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
                      Page {currentPage} of {totalPages}
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
                                checked={allOnPageSelected}
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
                                  <Badge variant={product.isActive ? "default" : product.status === "draft" ? "outline" : "secondary"}>
                                    {getEffectiveProductStatus(product)}
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
                                      onClick={() => window.open(`/products/${product.slug}`, '_blank')}
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
                                      <DialogContent className="w-[95vw] max-w-4xl">
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
                                    {canDeleteProducts && (
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
                                        data-testid={`button-delete-product-${product.id}`}
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    )}
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
                  {!productsLoading && filteredProducts.length > 0 && totalPages > 1 && (
                    <div className="flex items-center justify-center gap-1 mt-4 flex-wrap" data-testid="pagination-products">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => goToPage(currentPage - 1)}
                        disabled={currentPage <= 1}
                        data-testid="button-prev-page"
                      >
                        Previous
                      </Button>
                      {getPageNumbers(currentPage, totalPages).map((p, i) =>
                        p === "..." ? (
                          <span key={"ellipsis-" + i} className="px-2 text-gray-500">...</span>
                        ) : (
                          <Button
                            key={p}
                            variant={p === currentPage ? "default" : "outline"}
                            size="sm"
                            className="min-w-[36px]"
                            onClick={() => goToPage(p as number)}
                            data-testid={"button-page-" + p}
                          >
                            {p}
                          </Button>
                        )
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => goToPage(currentPage + 1)}
                        disabled={currentPage >= totalPages}
                        data-testid="button-next-page"
                      >
                        Next
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Categories Management Tab */}
            <TabsContent value="categories" className="mt-6">
              <CategoryManagement />
            </TabsContent>

            {/* Hero Slider Management Tab */}
            <TabsContent value="hero-slider" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Layout className="w-5 h-5" />
                      Hero Slider Management
                    </span>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm">
                          <Plus className="w-4 h-4 mr-2" />
                          Add Slide
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Add New Hero Slide</DialogTitle>
                        </DialogHeader>
                        <div className="p-4 text-center text-gray-600">
                          Hero slide form will be available here
                        </div>
                      </DialogContent>
                    </Dialog>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <HeroSliderManagement />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tags Management Tab */}
            <TabsContent value="tags" className="mt-6">
              <TagsManagement 
                tags={tags || []}
                loading={tagsLoading}
              />
            </TabsContent>



            {/* Schema Validator Tab */}
            <TabsContent value="schema" className="mt-6">
              <SchemaValidatorInterface />
            </TabsContent>

            {canManageSeo ? <>
              <TabsContent value="seo" className="mt-6">
                <SeoManagement />
              </TabsContent>
              <TabsContent value="global-seo" className="mt-6">
                <GlobalSeoSettings />
              </TabsContent>
              <TabsContent value="analytics" className="mt-6">
                <KeywordPerformanceDashboard />
              </TabsContent>
            </> : null}
          </Tabs>
        </div>
      </div>
    </RoleBasedRoute>
  );
}

// Schema Validator Component
function SchemaValidatorInterface() {
  const { toast } = useToast();
  const [currentUrl, setCurrentUrl] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [scanResults, setScanResults] = useState<any>(null);
  const [validationErrors, setValidationErrors] = useState<any[]>([]);
  const [scanProgress, setScanProgress] = useState(0);

  // Get all product URLs for batch testing
  const { data: products } = useQuery({
    queryKey: ["/api/products", { limit: 1000 }],
    queryFn: async () => {
      const response = await fetch("/api/products?limit=1000");
      if (!response.ok) throw new Error("Failed to fetch products");
      return response.json();
    },
  });

  const baseUrl = window.location.origin;
  // Generate URLs for the API endpoint pattern
  const productUrls = products?.products?.map((product: any) => 
    `${baseUrl}/api/product-page/${product.slug}`
  ) || [];

  const validateJsonLdStructure = (html: string) => {
    const errors = [];
    const warnings = [];
    const info = [];
    
    try {
      // Extract JSON-LD scripts
      const jsonLdRegex = /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi;
      const matches = Array.from(html.matchAll(jsonLdRegex));
      
      if (matches.length === 0) {
        errors.push('No JSON-LD structured data found');
        return { valid: false, errors, warnings, info, schemas: [] };
      }
      
      const schemas = [];
      let hasProductSchema = false;
      let hasBreadcrumbs = false;
      
      for (const match of matches) {
        try {
          const jsonContent = match[1].trim();
          const schema = JSON.parse(jsonContent);
          schemas.push(schema);
          
          // Validate Product schema
          if (schema['@type'] === 'Product') {
            hasProductSchema = true;
            info.push('Product schema found');
            
            // Required fields validation
            const requiredFields = ['name', 'description'];
            const recommendedFields = ['sku', 'brand', 'offers'];
            
            requiredFields.forEach(field => {
              if (!schema[field]) {
                errors.push(`Missing required field: ${field}`);
              }
            });
            
            recommendedFields.forEach(field => {
              if (!schema[field]) {
                warnings.push(`Missing recommended field: ${field}`);
              }
            });
            
            // Validate offers structure
            if (schema.offers) {
              if (Array.isArray(schema.offers)) {
                schema.offers.forEach((offer, index) => {
                  if (!offer['@type'] || offer['@type'] !== 'Offer') {
                    errors.push(`Offer ${index + 1}: Missing or invalid @type`);
                  }
                  if (!offer.availability) {
                    warnings.push(`Offer ${index + 1}: Missing availability`);
                  }
                });
              } else if (schema.offers['@type'] !== 'Offer') {
                errors.push('Offer: Missing or invalid @type');
              }
            }
            
            // Validate brand structure
            if (schema.brand && typeof schema.brand === 'object') {
              if (!schema.brand['@type'] || !schema.brand.name) {
                warnings.push('Brand: Missing @type or name');
              }
            }
          }
          
          // Validate BreadcrumbList schema
          if (schema['@type'] === 'BreadcrumbList') {
            hasBreadcrumbs = true;
            info.push('Breadcrumb schema found');
            
            if (!schema.itemListElement || !Array.isArray(schema.itemListElement)) {
              errors.push('BreadcrumbList: Missing or invalid itemListElement');
            } else {
              schema.itemListElement.forEach((item, index) => {
                if (!item['@type'] || item['@type'] !== 'ListItem') {
                  errors.push(`Breadcrumb item ${index + 1}: Missing or invalid @type`);
                }
                if (!item.position || !item.name) {
                  errors.push(`Breadcrumb item ${index + 1}: Missing position or name`);
                }
              });
            }
          }
          
        } catch (parseError) {
          errors.push(`Invalid JSON-LD syntax: ${parseError.message}`);
        }
      }
      
      if (!hasProductSchema) {
        errors.push('No Product schema found');
      }
      
      if (!hasBreadcrumbs) {
        warnings.push('No BreadcrumbList schema found');
      }
      
      return {
        valid: errors.length === 0,
        errors,
        warnings,
        info,
        schemas,
        hasProductSchema,
        hasBreadcrumbs
      };
      
    } catch (error) {
      return {
        valid: false,
        errors: ['Schema validation failed: ' + error.message],
        warnings: [],
        info: [],
        schemas: []
      };
    }
  };

  const runSchemaValidation = async (url: string) => {
    try {
      const response = await fetch(url);
      const html = await response.text();
      
      const validation = validateJsonLdStructure(html);
      
      return {
        url,
        ...validation,
        productName: extractProductName(url),
        responseStatus: response.status
      };
    } catch (error) {
      return {
        url,
        valid: false,
        errors: ['URL not accessible: ' + (error as Error).message],
        warnings: [],
        info: [],
        schemas: [],
        productName: extractProductName(url),
        responseStatus: 0
      };
    }
  };
  
  const extractProductName = (url: string) => {
    const slug = url.split('/').pop() || '';
    return slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const runBatchValidation = async () => {
    setIsScanning(true);
    setScanProgress(0);
    setScanResults(null);
    setValidationErrors([]);
    
    const results = [];
    const errors = [];
    
    for (let i = 0; i < productUrls.length; i++) {
      const url = productUrls[i];
      
      try {
        const result = await runSchemaValidation(url);
        results.push(result);
        
        if (!result.valid) {
          errors.push({
            url: result.url,
            errors: result.errors || [result.error]
          });
        }
        
        setScanProgress(Math.round(((i + 1) / productUrls.length) * 100));
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error) {
        errors.push({
          url,
          errors: ['Validation failed: ' + (error as Error).message]
        });
      }
    }
    
    setScanResults({
      total: productUrls.length,
      valid: results.filter(r => r.valid).length,
      invalid: errors.length,
      results
    });
    setValidationErrors(errors);
    setIsScanning(false);
    
    toast({
      title: "Schema Validation Complete",
      description: `Scanned ${productUrls.length} pages. ${results.filter(r => r.valid).length} valid, ${errors.length} with issues.`,
    });
  };

  const runAdvancedValidation = async () => {
    setIsScanning(true);
    setScanProgress(0);
    setScanResults(null);
    setValidationErrors([]);
    
    const results = [];
    
    for (let i = 0; i < productUrls.length; i++) {
      const url = productUrls[i];
      
      try {
        const result = await runSchemaValidation(url);
        results.push(result);
        
        setScanProgress(Math.round(((i + 1) / productUrls.length) * 100));
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        results.push({
          url,
          valid: false,
          errors: ['Validation failed: ' + (error as Error).message],
          warnings: [],
          info: [],
          schemas: [],
          productName: extractProductName(url),
          responseStatus: 0
        });
      }
    }
    
    const validResults = results.filter(r => r.valid);
    const invalidResults = results.filter(r => !r.valid);
    
    setScanResults({
      total: productUrls.length,
      valid: validResults.length,
      invalid: invalidResults.length,
      results,
      validResults,
      invalidResults
    });
    
    setValidationErrors(invalidResults.map(r => ({
      url: r.url,
      productName: r.productName,
      errors: r.errors,
      warnings: r.warnings,
      responseStatus: r.responseStatus
    })));
    
    setIsScanning(false);
    
    toast({
      title: "Advanced Validation Complete",
      description: `Analyzed ${productUrls.length} pages. ${validResults.length} valid, ${invalidResults.length} with issues.`,
    });
  };

  const openAllInGoogleTest = () => {
    if (productUrls.length === 0) {
      toast({
        title: "No Products Found",
        description: "No products available for testing.",
        variant: "destructive",
      });
      return;
    }

    // Ask for confirmation before opening many tabs
    const confirmed = window.confirm(
      `This will open ${productUrls.length} tabs in Google Rich Results Test. Continue?`
    );
    
    if (!confirmed) return;

    // Open first 10 products to avoid browser limitations
    const testUrls = productUrls.slice(0, 10);
    
    testUrls.forEach((url, index) => {
      setTimeout(() => {
        const googleTestUrl = `https://search.google.com/test/rich-results?url=${encodeURIComponent(url)}`;
        window.open(googleTestUrl, '_blank');
      }, index * 500); // 500ms delay between each tab to avoid blocking
    });

    toast({
      title: "Opening Google Rich Results Tests",
      description: `Opening ${testUrls.length} product pages in Google's validator.`,
    });
  };

  const openAllInSchemaOrg = () => {
    if (productUrls.length === 0) {
      toast({
        title: "No Products Found",
        description: "No products available for testing.",
        variant: "destructive",
      });
      return;
    }

    // Ask for confirmation before opening many tabs
    const confirmed = window.confirm(
      `This will open ${productUrls.length} tabs in Schema.org validator. Continue?`
    );
    
    if (!confirmed) return;

    // Open first 10 products to avoid browser limitations
    const testUrls = productUrls.slice(0, 10);
    
    testUrls.forEach((url, index) => {
      setTimeout(() => {
        const schemaTestUrl = `https://validator.schema.org/#url=${encodeURIComponent(url)}`;
        window.open(schemaTestUrl, '_blank');
      }, index * 500); // 500ms delay between each tab
    });

    toast({
      title: "Opening Schema.org Validators",
      description: `Opening ${testUrls.length} product pages in Schema.org validator.`,
    });
  };

  const downloadAdvancedReport = () => {
    if (!scanResults) return;
    
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalPages: scanResults.total,
        validPages: scanResults.valid,
        invalidPages: scanResults.invalid,
        successRate: Math.round((scanResults.valid / scanResults.total) * 100)
      },
      validationDetails: scanResults.results?.map(result => ({
        productName: result.productName,
        url: result.url,
        valid: result.valid,
        responseStatus: result.responseStatus,
        errors: result.errors || [],
        warnings: result.warnings || [],
        info: result.info || [],
        schemasFound: result.schemas?.length || 0,
        hasProductSchema: result.hasProductSchema,
        hasBreadcrumbs: result.hasBreadcrumbs
      })) || []
    };
    
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `schema-validation-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Report Downloaded",
      description: "Advanced schema validation report has been downloaded successfully.",
    });
  };

  const downloadReport = () => {
    if (!scanResults) return;
    
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalPages: scanResults.total,
        validPages: scanResults.valid,
        invalidPages: scanResults.invalid,
        successRate: `${Math.round((scanResults.valid / scanResults.total) * 100)}%`
      },
      validationErrors,
      allResults: scanResults.results
    };
    
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `schema-validation-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Report Downloaded",
      description: "Schema validation report has been downloaded successfully.",
    });
  };

  return (
    <div className="space-y-6">
      {/* Schema Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Schema Implementation Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <ul className="text-sm text-green-700 space-y-1">
              <li>• Product schema with name, description, SKU, and pricing</li>
              <li>• Brand information for Atlas Ingredients</li>
              <li>• Availability and stock status</li>
              <li>• Breadcrumb navigation</li>
              <li>• Additional properties (botanical name, origin, form)</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Single URL Validator */}
      <Card>
        <CardHeader>
          <CardTitle>Test Single URL</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter product URL to validate..."
              value={currentUrl}
              onChange={(e) => setCurrentUrl(e.target.value)}
            />
            <Button 
              onClick={() => window.open(`https://search.google.com/test/rich-results?url=${encodeURIComponent(currentUrl)}`, '_blank')}
              disabled={!currentUrl}
            >
              <Globe className="w-4 h-4 mr-2" />
              Test with Google
            </Button>
            <Button 
              variant="outline"
              onClick={() => window.open(`https://validator.schema.org/#url=${encodeURIComponent(currentUrl)}`, '_blank')}
              disabled={!currentUrl}
            >
              <Code className="w-4 h-4 mr-2" />
              Schema.org Test
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Advanced Schema Validation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Advanced Schema Validation</span>
            <Badge variant="secondary">{productUrls.length} Products</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600">
            Comprehensive JSON-LD validation with detailed error reporting and schema analysis.
          </p>
          
          <div className="flex gap-2">
            <Button 
              onClick={runAdvancedValidation}
              disabled={isScanning || productUrls.length === 0}
              className="flex-1"
            >
              {isScanning ? (
                <>
                  <AlertCircle className="w-4 h-4 mr-2 animate-spin" />
                  Validating... {scanProgress}%
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Start Advanced Validation
                </>
              )}
            </Button>
            
            <Button 
              variant="outline"
              onClick={openAllInGoogleTest}
              disabled={productUrls.length === 0}
            >
              <Globe className="w-4 h-4 mr-2" />
              Test in Google Rich Results
            </Button>
            
            {scanResults && (
              <Button 
                variant="outline"
                onClick={downloadAdvancedReport}
              >
                <FileText className="w-4 h-4 mr-2" />
                Export Results
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Batch Validation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Bulk Schema Validation</span>
            <Badge variant="secondary">{productUrls.length} Products</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600">
            Scan all product pages to validate their structured data implementation.
          </p>
          
          <div className="flex gap-2">
            <Button 
              onClick={runBatchValidation}
              disabled={isScanning || productUrls.length === 0}
              className="flex-1"
            >
              {isScanning ? (
                <>
                  <AlertCircle className="w-4 h-4 mr-2 animate-spin" />
                  Scanning... {scanProgress}%
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Start Schema Validation Scan
                </>
              )}
            </Button>
            
            {scanResults && (
              <Button 
                variant="outline"
                onClick={downloadReport}
              >
                <FileText className="w-4 h-4 mr-2" />
                Download Report
              </Button>
            )}
          </div>

          {/* Progress Bar */}
          {isScanning && (
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${scanProgress}%` }}
              ></div>
            </div>
          )}

          {/* Scan Results Summary */}
          {scanResults && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="text-2xl font-bold text-green-600">{scanResults.valid}</div>
                <div className="text-sm text-green-700">Valid Pages</div>
              </div>
              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <div className="text-2xl font-bold text-red-600">{scanResults.invalid}</div>
                <div className="text-sm text-red-700">Pages with Issues</div>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="text-2xl font-bold text-blue-600">
                  {Math.round((scanResults.valid / scanResults.total) * 100)}%
                </div>
                <div className="text-sm text-blue-700">Success Rate</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Validation Errors ({validationErrors.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {validationErrors.map((error, index) => (
                <div key={index} className="border-l-4 border-red-500 pl-4 py-2 bg-red-50">
                  <div className="font-medium text-red-900 text-sm">{error.url}</div>
                  <ul className="text-red-700 text-xs mt-1">
                    {error.errors.map((err: string, i: number) => (
                      <li key={i}>• {err}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* External Testing Tools */}
      <Card>
        <CardHeader>
          <CardTitle>External Validation Tools</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Button 
              variant="outline" 
              className="justify-start"
              onClick={() => window.open('https://search.google.com/test/rich-results', '_blank')}
            >
              <Globe className="w-4 h-4 mr-2" />
              Google Rich Results Test
            </Button>
            <Button 
              variant="outline" 
              className="justify-start"
              onClick={() => window.open('https://validator.schema.org/', '_blank')}
            >
              <Code className="w-4 h-4 mr-2" />
              Schema.org Validator
            </Button>
            <Button 
              variant="outline" 
              className="justify-start"
              onClick={() => window.open('https://www.google.com/webmasters/markup-helper/', '_blank')}
            >
              <Settings className="w-4 h-4 mr-2" />
              Google Markup Helper
            </Button>
            <Button 
              variant="outline" 
              className="justify-start"
              onClick={() => window.open('https://developers.google.com/search/docs/advanced/structured-data', '_blank')}
            >
              <FileText className="w-4 h-4 mr-2" />
              Schema Documentation
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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