import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Package, 
  Upload, 
  FileText, 
  Tags, 
  Image as ImageIcon, 
  Globe, 
  Eye, 
  EyeOff,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Monitor,
  Layers
} from "lucide-react";
import type { Product, Category, ProductTag, HeroSlider } from "@shared/schema";

export default function WebsiteManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("products");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Check permissions
  useEffect(() => {
    const userRole = (user as any)?.role;
    if (!userRole || !['admin', 'super_admin', 'website_manager'].includes(userRole)) {
      toast({
        title: "Access Denied",
        description: "Website management access required.",
        variant: "destructive",
      });
      return;
    }
  }, [user, toast]);

  // Fetch products
  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ["/api/admin/products"],
  });

  // Fetch categories
  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ["/api/categories"],
  });

  // Fetch tags
  const { data: tags, isLoading: tagsLoading } = useQuery({
    queryKey: ["/api/admin/tags"],
  });

  // Fetch hero sliders
  const { data: sliders, isLoading: slidersLoading } = useQuery({
    queryKey: ["/api/admin/sliders"],
  });

  const userRole = (user as any)?.role;
  if (!userRole || !['admin', 'super_admin', 'website_manager'].includes(userRole)) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Globe className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Access Restricted</h3>
          <p className="text-gray-500">Website management access required.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Website Management</h1>
          <p className="text-gray-600">Manage products, categories, sliders, and website content</p>
        </div>
        <Badge variant="secondary" className="bg-green-100 text-green-800">
          Backend Administration
        </Badge>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="products" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Products
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center gap-2">
            <Layers className="h-4 w-4" />
            Categories
          </TabsTrigger>
          <TabsTrigger value="tags" className="flex items-center gap-2">
            <Tags className="h-4 w-4" />
            Tags
          </TabsTrigger>
          <TabsTrigger value="sliders" className="flex items-center gap-2">
            <Monitor className="h-4 w-4" />
            Hero Sliders
          </TabsTrigger>
          <TabsTrigger value="seo" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            SEO
          </TabsTrigger>
        </TabsList>

        {/* Products Tab */}
        <TabsContent value="products" className="space-y-6">
          <ProductsManagement 
            products={productsData?.products || []}
            categories={categories || []}
            tags={tags || []}
            loading={productsLoading}
            selectedProduct={selectedProduct}
            setSelectedProduct={setSelectedProduct}
            isEditing={isEditing}
            setIsEditing={setIsEditing}
          />
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-6">
          <CategoriesManagement 
            categories={categories || []}
            loading={categoriesLoading}
          />
        </TabsContent>

        {/* Tags Tab */}
        <TabsContent value="tags" className="space-y-6">
          <TagsManagement 
            tags={tags || []}
            loading={tagsLoading}
          />
        </TabsContent>

        {/* Hero Sliders Tab */}
        <TabsContent value="sliders" className="space-y-6">
          <SlidersManagement 
            sliders={sliders || []}
            loading={slidersLoading}
          />
        </TabsContent>

        {/* SEO Tab */}
        <TabsContent value="seo" className="space-y-6">
          <SEOManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Products Management Component
function ProductsManagement({ 
  products, 
  categories, 
  tags, 
  loading, 
  selectedProduct, 
  setSelectedProduct, 
  isEditing, 
  setIsEditing 
}: any) {
  const { toast } = useToast();
  const [showCreateForm, setShowCreateForm] = useState(false);

  const createProductMutation = useMutation({
    mutationFn: async (productData: any) => {
      return apiRequest("/api/admin/products", {
        method: "POST",
        body: JSON.stringify(productData),
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Product created successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/products"] });
      setShowCreateForm(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create product",
        variant: "destructive",
      });
    },
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Package className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Products Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Product Management</h2>
          <p className="text-gray-600">Upload and manage product information</p>
        </div>
        <Button 
          onClick={() => setShowCreateForm(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Product
        </Button>
      </div>

      {/* Products List */}
      <div className="grid gap-4">
        {products.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Package className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Products</h3>
              <p className="text-gray-500 mb-4">Start by adding your first product</p>
              <Button onClick={() => setShowCreateForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>
            </CardContent>
          </Card>
        ) : (
          products.map((product: Product) => (
            <Card key={product.id} className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                    {product.mainImage ? (
                      <img 
                        src={product.mainImage} 
                        alt={product.name}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <ImageIcon className="h-8 w-8 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">{product.name}</h3>
                      <Badge variant="outline">{product.productId}</Badge>
                      <Badge 
                        variant={product.status === 'active' ? 'default' : 'secondary'}
                        className={product.status === 'active' ? 'bg-green-100 text-green-800' : ''}
                      >
                        {product.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">{product.description}</p>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-xs text-gray-500">
                        Stock: {product.currentStock} {product.stockUnit}
                      </span>
                      <span className="text-xs text-gray-500">
                        MOQ: {product.moq} {product.stockUnit}
                      </span>
                      {product.isVisible ? (
                        <Badge variant="outline" className="text-green-600 border-green-200">
                          <Eye className="h-3 w-3 mr-1" />
                          Visible
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-gray-500 border-gray-200">
                          <EyeOff className="h-3 w-3 mr-1" />
                          Hidden
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setSelectedProduct(product);
                      setIsEditing(true);
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Create/Edit Product Form */}
      {(showCreateForm || isEditing) && (
        <ProductForm
          product={selectedProduct}
          categories={categories}
          tags={tags}
          onClose={() => {
            setShowCreateForm(false);
            setIsEditing(false);
            setSelectedProduct(null);
          }}
          onSubmit={(data) => {
            if (isEditing) {
              // Update product logic
            } else {
              createProductMutation.mutate(data);
            }
          }}
        />
      )}
    </div>
  );
}

// Product Form Component
function ProductForm({ product, categories, tags, onClose, onSubmit }: any) {
  const [formData, setFormData] = useState({
    name: product?.name || "",
    slug: product?.slug || "",
    description: product?.description || "",
    specificationSheet: product?.specificationSheet || "",
    botanicalName: product?.botanicalName || "",
    plantPart: product?.plantPart || "",
    origin: product?.origin || "",
    hsCode: product?.hsCode || "",
    categoryId: product?.categoryId || "",
    productType: product?.productType || "organic",
    productGrade: product?.productGrade || "",
    form: product?.form || "",
    certifications: product?.certifications || [],
    currentStock: product?.currentStock || "",
    moq: product?.moq || "",
    leadTime: product?.leadTime || "",
    sampleAvailable: product?.sampleAvailable ?? true,
    stopSell: product?.stopSell ?? false,
    basePrice: product?.basePrice || "",
    currency: product?.currency || "USD",
    mainImage: product?.mainImage || "",
    galleryImages: product?.galleryImages || [],
    seoTitle: product?.seoTitle || "",
    seoDescription: product?.seoDescription || "",
    canonicalUrl: product?.canonicalUrl || "",
    status: product?.status || "draft",
    isVisible: product?.isVisible ?? true,
    internalNotes: product?.internalNotes || "",
  });

  // Auto-generate slug from name
  useEffect(() => {
    if (formData.name && !product) {
      const slug = formData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setFormData(prev => ({ ...prev, slug }));
    }
  }, [formData.name, product]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              {product ? "Edit Product" : "Add New Product"}
            </h2>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Product Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="slug">URL Slug *</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                    required
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="botanicalName">Botanical Name</Label>
                  <Input
                    id="botanicalName"
                    value={formData.botanicalName}
                    onChange={(e) => setFormData(prev => ({ ...prev, botanicalName: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="plantPart">Plant Part</Label>
                  <Input
                    id="plantPart"
                    value={formData.plantPart}
                    onChange={(e) => setFormData(prev => ({ ...prev, plantPart: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="origin">Country of Origin</Label>
                  <Input
                    id="origin"
                    value={formData.origin}
                    onChange={(e) => setFormData(prev => ({ ...prev, origin: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="hsCode">HS Code</Label>
                  <Input
                    id="hsCode"
                    value={formData.hsCode}
                    onChange={(e) => setFormData(prev => ({ ...prev, hsCode: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="categoryId">Category</Label>
                  <Select
                    value={formData.categoryId?.toString()}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, categoryId: parseInt(value) }))}
                  >
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
              </div>
            </CardContent>
          </Card>

          {/* Stock & Pricing */}
          <Card>
            <CardHeader>
              <CardTitle>Stock & Pricing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="currentStock">Current Stock</Label>
                  <Input
                    id="currentStock"
                    type="number"
                    step="0.01"
                    value={formData.currentStock}
                    onChange={(e) => setFormData(prev => ({ ...prev, currentStock: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="moq">MOQ (Minimum Order)</Label>
                  <Input
                    id="moq"
                    type="number"
                    step="0.01"
                    value={formData.moq}
                    onChange={(e) => setFormData(prev => ({ ...prev, moq: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="leadTime">Lead Time</Label>
                  <Input
                    id="leadTime"
                    value={formData.leadTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, leadTime: e.target.value }))}
                    placeholder="e.g., 5-7 days"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="sampleAvailable"
                    checked={formData.sampleAvailable}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, sampleAvailable: checked }))}
                  />
                  <Label htmlFor="sampleAvailable">Sample Available</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="stopSell"
                    checked={formData.stopSell}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, stopSell: checked }))}
                  />
                  <Label htmlFor="stopSell">Stop Sell</Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SEO & Visibility */}
          <Card>
            <CardHeader>
              <CardTitle>SEO & Visibility</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="seoTitle">SEO Title</Label>
                <Input
                  id="seoTitle"
                  value={formData.seoTitle}
                  onChange={(e) => setFormData(prev => ({ ...prev, seoTitle: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="seoDescription">SEO Description</Label>
                <Textarea
                  id="seoDescription"
                  value={formData.seoDescription}
                  onChange={(e) => setFormData(prev => ({ ...prev, seoDescription: e.target.value }))}
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2 mt-6">
                  <Switch
                    id="isVisible"
                    checked={formData.isVisible}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isVisible: checked }))}
                  />
                  <Label htmlFor="isVisible">Visible on Website</Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Internal Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Internal Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.internalNotes}
                onChange={(e) => setFormData(prev => ({ ...prev, internalNotes: e.target.value }))}
                placeholder="Internal notes (not visible to customers)"
                rows={3}
              />
            </CardContent>
          </Card>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              {product ? "Update Product" : "Create Product"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Placeholder components for other tabs
function CategoriesManagement({ categories, loading }: any) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Categories Management</CardTitle>
        <CardDescription>Manage product categories and hierarchies</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600">Categories management interface will be implemented here.</p>
      </CardContent>
    </Card>
  );
}

function TagsManagement({ tags, loading }: any) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Tags Management</CardTitle>
        <CardDescription>Create and manage product tags for filtering</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600">Tags management interface will be implemented here.</p>
      </CardContent>
    </Card>
  );
}

function SlidersManagement({ sliders, loading }: any) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Hero Sliders Management</CardTitle>
        <CardDescription>Manage homepage hero slider banners</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600">Hero sliders management interface will be implemented here.</p>
      </CardContent>
    </Card>
  );
}

function SEOManagement() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>SEO Management</CardTitle>
        <CardDescription>Global SEO settings and structured data</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600">SEO management interface will be implemented here.</p>
      </CardContent>
    </Card>
  );
}