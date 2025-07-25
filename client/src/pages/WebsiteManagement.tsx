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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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
  Layers,
  Building2,
  AlertCircle
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
      const response = await apiRequest("POST", "/api/admin/products", productData);
      return await response.json();
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

  const updateProductMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await apiRequest("PUT", `/api/admin/products/${id}`, data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Product updated successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/products"] });
      setIsEditing(false);
      setSelectedProduct(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update product",
        variant: "destructive",
      });
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (productId: number) => {
      const response = await apiRequest("DELETE", `/api/admin/products/${productId}`);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Product deleted successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/products"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete product",
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
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      if (confirm(`Are you sure you want to delete "${product.name}"? This action cannot be undone.`)) {
                        deleteProductMutation.mutate(product.id);
                      }
                    }}
                    disabled={deleteProductMutation.isPending}
                  >
                    {deleteProductMutation.isPending ? (
                      <div className="animate-spin h-4 w-4 border-2 border-gray-400 border-t-transparent rounded-full" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
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
            if (isEditing && selectedProduct) {
              updateProductMutation.mutate({ id: selectedProduct.id, data });
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
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  
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
    packingSize: product?.packingSize || "",
    moq: product?.moq || "",
    leadTime: product?.leadTime || "",
    sampleAvailable: product?.sampleAvailable ?? true,
    stopSell: product?.stopSell ?? false,
    basePrice: product?.basePrice || "",
    rate: product?.rate || "",
    priceUSD: product?.priceUSD || "",
    priceINR: product?.priceINR || "",
    priceEUR: product?.priceEUR || "",
    priceGBP: product?.priceGBP || "",
    priceType: product?.priceType || "EXW",
    priceLocation: product?.priceLocation || "Warehouse India",
    currency: product?.currency || "USD",
    mainImage: product?.mainImage || "",
    galleryImages: product?.galleryImages || [],
    // Document fields - Complete set matching product page
    coaDocument: product?.coaDocument || "",
    certDocument: product?.certDocument || "",
    specDocument: product?.specDocument || "",
    msdsDocument: product?.msdsDocument || "",
    nonGmoDocument: product?.nonGmoDocument || "",
    businessLicense: product?.businessLicense || "",
    registrationCert: product?.registrationCert || "",
    kosherCert: product?.kosherCert || "",
    organicNopCert: product?.organicNopCert || "",
    additionalDocs: product?.additionalDocs || [],
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

  // Handle AWS S3 image upload
  const handleImageUpload = async (file: File, fieldName: string) => {
    setUploading(true);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append(fieldName, file);
      if (formData.name) {
        formDataUpload.append('productId', formData.name.replace(/[^a-zA-Z0-9]/g, ''));
      }

      const response = await fetch('/api/admin/products/upload', {
        method: 'POST',
        body: formDataUpload,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      
      if (result.success && result.files[fieldName]) {
        setFormData(prev => ({
          ...prev,
          [fieldName]: result.files[fieldName]
        }));
        
        const fileType = fieldName.includes('Document') || fieldName.includes('Docs') ? 'Document' : 'Image';
        toast({
          title: "Upload Successful",
          description: `${fileType} uploaded to AWS S3 successfully`,
        });
      }
    } catch (error) {
      console.error('Upload error:', error);
      const fileType = fieldName.includes('Document') || fieldName.includes('Docs') ? 'document' : 'image';
      toast({
        title: "Upload Failed",
        description: `Failed to upload ${fileType} to AWS S3. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clean and convert form data to proper types
    const cleanedData = {
      ...formData,
      // Convert integer fields, omit if empty string
      categoryId: formData.categoryId && formData.categoryId !== "" ? parseInt(formData.categoryId as string) : undefined,
      currentStock: formData.currentStock && formData.currentStock !== "" ? parseFloat(formData.currentStock as string) : undefined,
      moq: formData.moq && formData.moq !== "" ? parseFloat(formData.moq as string) : undefined,
      rate: formData.rate && formData.rate !== "" ? parseFloat(formData.rate as string) : undefined,
      basePrice: formData.basePrice && formData.basePrice !== "" ? parseFloat(formData.basePrice as string) : undefined,
      priceUSD: formData.priceUSD && formData.priceUSD !== "" ? parseFloat(formData.priceUSD as string) : undefined,
      priceINR: formData.priceINR && formData.priceINR !== "" ? parseFloat(formData.priceINR as string) : undefined,
      priceEUR: formData.priceEUR && formData.priceEUR !== "" ? parseFloat(formData.priceEUR as string) : undefined,
      priceGBP: formData.priceGBP && formData.priceGBP !== "" ? parseFloat(formData.priceGBP as string) : undefined,
      
      // Clean up empty strings for optional text fields
      botanicalName: formData.botanicalName || undefined,
      plantPart: formData.plantPart || undefined,
      origin: formData.origin || undefined,
      hsCode: formData.hsCode || undefined,
      productGrade: formData.productGrade || undefined,
      form: formData.form || undefined,
      meshSize: formData.meshSize || undefined,
      curcuminContent: formData.curcuminContent || undefined,
      moisture: formData.moisture || undefined,
      totalAsh: formData.totalAsh || undefined,
      bulkDensity: formData.bulkDensity || undefined,
      shelfLife: formData.shelfLife || undefined,
      leadTime: formData.leadTime || undefined,
      
      // Ensure arrays are properly formatted
      certifications: Array.isArray(formData.certifications) ? formData.certifications : [],
      galleryImages: Array.isArray(formData.galleryImages) ? formData.galleryImages.filter(img => img.trim() !== '') : [],
    };
    
    // Remove undefined values to avoid sending empty data
    Object.keys(cleanedData).forEach(key => {
      if (cleanedData[key] === undefined || cleanedData[key] === '') {
        delete cleanedData[key];
      }
    });
    
    onSubmit(cleanedData);
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

              {/* Specification Sheet Section */}
              <div>
                <Label htmlFor="specificationSheet">Detailed Specifications</Label>
                <Textarea
                  id="specificationSheet"
                  value={formData.specificationSheet}
                  onChange={(e) => setFormData(prev => ({ ...prev, specificationSheet: e.target.value }))}
                  rows={6}
                  placeholder="Enter detailed product specifications in HTML format or plain text..."
                  className="font-mono text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  You can use HTML formatting for better presentation
                </p>
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
                    placeholder="e.g., India, USA, Bulgaria"
                  />
                </div>
                <div>
                  <Label htmlFor="hsCode">HS Code</Label>
                  <Input
                    id="hsCode"
                    value={formData.hsCode}
                    onChange={(e) => setFormData(prev => ({ ...prev, hsCode: e.target.value }))}
                    placeholder="e.g., 1302.19.90"
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

              {/* Product Type, Grade, and Form */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="productType">Product Type</Label>
                  <Select
                    value={formData.productType}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, productType: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="organic">Organic</SelectItem>
                      <SelectItem value="conventional">Conventional</SelectItem>
                      <SelectItem value="wildcrafted">Wildcrafted</SelectItem>
                      <SelectItem value="kosher">Kosher</SelectItem>
                      <SelectItem value="halal">Halal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="productGrade">Product Grade</Label>
                  <Select
                    value={formData.productGrade}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, productGrade: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select grade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="food">Food Grade</SelectItem>
                      <SelectItem value="pharmaceutical">Pharmaceutical Grade</SelectItem>
                      <SelectItem value="cosmetic">Cosmetic Grade</SelectItem>
                      <SelectItem value="industrial">Industrial Grade</SelectItem>
                      <SelectItem value="premium">Premium Grade</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="form">Product Form</Label>
                  <Select
                    value={formData.form}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, form: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select form" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="powder">Powder</SelectItem>
                      <SelectItem value="liquid">Liquid</SelectItem>
                      <SelectItem value="oil">Oil</SelectItem>
                      <SelectItem value="extract">Extract</SelectItem>
                      <SelectItem value="whole">Whole/Dried</SelectItem>
                      <SelectItem value="capsules">Capsules</SelectItem>
                      <SelectItem value="tablets">Tablets</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tags & Certifications */}
          <Card>
            <CardHeader>
              <CardTitle>Tags & Certifications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Quick Add Certification Tags */}
              <div>
                <Label className="text-sm font-medium">Quick Add Certifications</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {['USDA NOP', 'NPOP', 'EU Organic', 'FDA Approved', 'GMP Certified', 'ISO Certified', 'Kosher', 'Halal', 'Non-GMO'].map((certName) => (
                    <Button
                      key={certName}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (!formData.certifications.includes(certName)) {
                          setFormData(prev => ({
                            ...prev,
                            certifications: [...prev.certifications, certName]
                          }));
                        }
                      }}
                      className="text-xs"
                      disabled={formData.certifications.includes(certName)}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      {certName}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Selected Certifications */}
              {formData.certifications.length > 0 && (
                <div>
                  <Label className="text-sm font-medium">Selected Certifications</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.certifications.map((cert, index) => (
                      <Badge key={index} variant="default" className="flex items-center gap-1">
                        {cert}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 hover:bg-transparent"
                          onClick={() => {
                            setFormData(prev => ({
                              ...prev,
                              certifications: prev.certifications.filter((_, i) => i !== index)
                            }));
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Available Tags Selection */}
              {tags.length > 0 && (
                <div>
                  <Label className="text-sm font-medium">Available Tags</Label>
                  <div className="flex flex-wrap gap-2 mt-2 max-h-24 overflow-y-auto">
                    {tags.map((tag: any) => (
                      <Button
                        key={tag.id}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (!formData.certifications.includes(tag.name)) {
                            setFormData(prev => ({
                              ...prev,
                              certifications: [...prev.certifications, tag.name]
                            }));
                          }
                        }}
                        className="text-xs"
                        disabled={formData.certifications.includes(tag.name)}
                      >
                        <Tags className="h-3 w-3 mr-1" />
                        {tag.name}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Documents & Media */}
          <Card>
            <CardHeader>
              <CardTitle>Documents & Media</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Main Product Image */}
              <div>
                <Label htmlFor="mainImage">Main Product Image</Label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      id="mainImageUrl"
                      value={formData.mainImage}
                      onChange={(e) => setFormData(prev => ({ ...prev, mainImage: e.target.value }))}
                      placeholder="Enter image URL or upload below"
                      className="flex-1"
                    />
                  </div>
                  
                  {/* File Upload for Main Image */}
                  <div className="flex gap-2 items-center">
                    <Input
                      id="mainImageFile"
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          await handleImageUpload(file, 'mainImage');
                        }
                      }}
                      className="flex-1"
                      disabled={uploading}
                    />
                    <Button type="button" variant="outline" size="sm" disabled={uploading}>
                      <Upload className="h-4 w-4 mr-1" />
                      {uploading ? 'Uploading...' : 'S3 Ready'}
                    </Button>
                  </div>
                  
                  {formData.mainImage && (
                    <div className="mt-2 flex items-center gap-2">
                      <img 
                        src={formData.mainImage} 
                        alt="Product preview" 
                        className="w-20 h-20 object-cover rounded border"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setFormData(prev => ({ ...prev, mainImage: '' }))}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Gallery Images - Enhanced Multi-Upload */}
              <div>
                <Label>Gallery Images</Label>
                <div className="space-y-4">
                  {/* Bulk Upload Section */}
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                    <div className="text-center">
                      <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600 mb-2">Upload Multiple Images</p>
                      <Input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={async (e) => {
                          const files = Array.from(e.target.files || []);
                          if (files.length > 0) {
                            setUploading(true);
                            try {
                              for (const file of files) {
                                const formDataUpload = new FormData();
                                formDataUpload.append('galleryImage', file);
                                if (formData.name) {
                                  formDataUpload.append('productId', formData.name.replace(/[^a-zA-Z0-9]/g, ''));
                                }

                                const response = await fetch('/api/admin/products/upload', {
                                  method: 'POST',
                                  body: formDataUpload,
                                });

                                if (response.ok) {
                                  const result = await response.json();
                                  if (result.success && result.files.galleryImage) {
                                    setFormData(prev => ({
                                      ...prev,
                                      galleryImages: [...prev.galleryImages, result.files.galleryImage]
                                    }));
                                  }
                                }
                              }
                              toast({
                                title: "Upload Successful",
                                description: `${files.length} images uploaded successfully`,
                              });
                            } catch (error) {
                              toast({
                                title: "Upload Failed",
                                description: "Failed to upload some images",
                                variant: "destructive",
                              });
                            } finally {
                              setUploading(false);
                            }
                          }
                        }}
                        className="w-full"
                        disabled={uploading}
                      />
                      <p className="text-xs text-gray-400 mt-1">Hold Ctrl/Cmd to select multiple images at once</p>
                    </div>
                  </div>

                  {/* Individual Image Management */}
                  <div className="space-y-2">
                    {formData.galleryImages.map((imageUrl: string, index: number) => (
                      <div key={index} className="flex gap-2 items-center p-2 border rounded">
                        {imageUrl && (
                          <img 
                            src={imageUrl} 
                            alt={`Gallery ${index + 1}`} 
                            className="w-12 h-12 object-cover rounded border"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        )}
                        <Input
                          value={imageUrl}
                          onChange={(e) => {
                            const newImages = [...formData.galleryImages];
                            newImages[index] = e.target.value;
                            setFormData(prev => ({ ...prev, galleryImages: newImages }));
                          }}
                          placeholder="https://example.com/gallery-image.jpg or upload above"
                          className="flex-1"
                        />
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setUploading(true);
                              try {
                                const formDataUpload = new FormData();
                                formDataUpload.append('galleryImage', file);
                                if (formData.name) {
                                  formDataUpload.append('productId', formData.name.replace(/[^a-zA-Z0-9]/g, ''));
                                }

                                const response = await fetch('/api/admin/products/upload', {
                                  method: 'POST',
                                  body: formDataUpload,
                                });

                                if (response.ok) {
                                  const result = await response.json();
                                  if (result.success && result.files.galleryImage) {
                                    const newImages = [...formData.galleryImages];
                                    newImages[index] = result.files.galleryImage;
                                    setFormData(prev => ({ ...prev, galleryImages: newImages }));
                                  }
                                }
                              } catch (error) {
                                toast({
                                  title: "Upload Failed",
                                  description: "Failed to upload image",
                                  variant: "destructive",
                                });
                              } finally {
                                setUploading(false);
                              }
                            }
                          }}
                          className="w-24"
                          disabled={uploading}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const newImages = formData.galleryImages.filter((_: string, i: number) => i !== index);
                            setFormData(prev => ({ ...prev, galleryImages: newImages }));
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          galleryImages: [...prev.galleryImages, '']
                        }));
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Gallery Image Slot
                    </Button>
                  </div>
                </div>
              </div>

              {/* Document Upload Section */}
              <div className="border-t pt-4">
                <Label className="text-sm font-medium mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Product Documents
                </Label>
                <p className="text-xs text-gray-500 mb-4">Upload certificates, COAs, specifications, and other documents (PDF, DOC, DOCX)</p>
                
                {/* Company Specific Documents */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-800 mb-3 flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    Company Specific Documents
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Business License */}
                    <div className="space-y-2">
                      <Label htmlFor="businessLicense" className="text-xs font-medium">Business License</Label>
                      <div className="flex gap-2">
                        <Input
                          value={formData.businessLicense}
                          onChange={(e) => setFormData(prev => ({ ...prev, businessLicense: e.target.value }))}
                          placeholder="Document URL or upload below"
                          className="flex-1 text-xs"
                        />
                      </div>
                      <Input
                        id="businessLicense"
                        type="file"
                        accept=".pdf,.doc,.docx"
                        className="text-xs"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            await handleImageUpload(file, 'businessLicense');
                          }
                        }}
                        disabled={uploading}
                      />
                      {formData.businessLicense && (
                        <div className="flex items-center gap-2 p-2 bg-green-50 rounded text-xs">
                          <FileText className="w-3 h-3 text-green-600" />
                          <span className="text-green-700 truncate">Business License uploaded</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setFormData(prev => ({ ...prev, businessLicense: '' }))}
                            className="h-6 w-6 p-0"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Certificate of Registration */}
                    <div className="space-y-2">
                      <Label htmlFor="registrationCert" className="text-xs font-medium">Certificate of Registration</Label>
                      <div className="flex gap-2">
                        <Input
                          value={formData.registrationCert}
                          onChange={(e) => setFormData(prev => ({ ...prev, registrationCert: e.target.value }))}
                          placeholder="Document URL or upload below"
                          className="flex-1 text-xs"
                        />
                      </div>
                      <Input
                        id="registrationCert"
                        type="file"
                        accept=".pdf,.doc,.docx"
                        className="text-xs"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            await handleImageUpload(file, 'registrationCert');
                          }
                        }}
                        disabled={uploading}
                      />
                      {formData.registrationCert && (
                        <div className="flex items-center gap-2 p-2 bg-green-50 rounded text-xs">
                          <FileText className="w-3 h-3 text-green-600" />
                          <span className="text-green-700 truncate">Registration Certificate uploaded</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setFormData(prev => ({ ...prev, registrationCert: '' }))}
                            className="h-6 w-6 p-0"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* KOSHER Certificate */}
                    <div className="space-y-2">
                      <Label htmlFor="kosherCert" className="text-xs font-medium">KOSHER-OK Certificate</Label>
                      <div className="flex gap-2">
                        <Input
                          value={formData.kosherCert}
                          onChange={(e) => setFormData(prev => ({ ...prev, kosherCert: e.target.value }))}
                          placeholder="Document URL or upload below"
                          className="flex-1 text-xs"
                        />
                      </div>
                      <Input
                        id="kosherCert"
                        type="file"
                        accept=".pdf,.doc,.docx"
                        className="text-xs"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            await handleImageUpload(file, 'kosherCert');
                          }
                        }}
                        disabled={uploading}
                      />
                      {formData.kosherCert && (
                        <div className="flex items-center gap-2 p-2 bg-green-50 rounded text-xs">
                          <FileText className="w-3 h-3 text-green-600" />
                          <span className="text-green-700 truncate">KOSHER Certificate uploaded</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setFormData(prev => ({ ...prev, kosherCert: '' }))}
                            className="h-6 w-6 p-0"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Organic NOP (USDA) */}
                    <div className="space-y-2">
                      <Label htmlFor="organicNopCert" className="text-xs font-medium">Organic-NOP(USDA) Certificate</Label>
                      <div className="flex gap-2">
                        <Input
                          value={formData.organicNopCert}
                          onChange={(e) => setFormData(prev => ({ ...prev, organicNopCert: e.target.value }))}
                          placeholder="Document URL or upload below"
                          className="flex-1 text-xs"
                        />
                      </div>
                      <Input
                        id="organicNopCert"
                        type="file"
                        accept=".pdf,.doc,.docx"
                        className="text-xs"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            await handleImageUpload(file, 'organicNopCert');
                          }
                        }}
                        disabled={uploading}
                      />
                      {formData.organicNopCert && (
                        <div className="flex items-center gap-2 p-2 bg-green-50 rounded text-xs">
                          <FileText className="w-3 h-3 text-green-600" />
                          <span className="text-green-700 truncate">Organic-NOP Certificate uploaded</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setFormData(prev => ({ ...prev, organicNopCert: '' }))}
                            className="h-6 w-6 p-0"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Product Specific Documents */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-800 mb-3 flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    Product Specific Documents
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* COA Document */}
                  <div className="space-y-2">
                    <Label htmlFor="coaDocument" className="text-xs font-medium">Certificate of Analysis (COA)</Label>
                    <div className="flex gap-2">
                      <Input
                        value={formData.coaDocument}
                        onChange={(e) => setFormData(prev => ({ ...prev, coaDocument: e.target.value }))}
                        placeholder="Document URL or upload below"
                        className="flex-1 text-xs"
                      />
                    </div>
                    <Input
                      id="coaDocument"
                      type="file"
                      accept=".pdf,.doc,.docx"
                      className="text-xs"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          await handleImageUpload(file, 'coaDocument');
                        }
                      }}
                      disabled={uploading}
                    />
                    {formData.coaDocument && (
                      <div className="flex items-center gap-2 p-2 bg-green-50 rounded text-xs">
                        <FileText className="w-3 h-3 text-green-600" />
                        <span className="text-green-700 truncate">COA uploaded successfully</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setFormData(prev => ({ ...prev, coaDocument: '' }))}
                          className="h-6 w-6 p-0"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  {/* Certificate Document - Only show if product is organic */}
                  {formData.isOrganic && (
                  <div className="space-y-2">
                    <Label htmlFor="certDocument" className="text-xs font-medium">Organic Certificate</Label>
                    <div className="flex gap-2">
                      <Input
                        value={formData.certDocument}
                        onChange={(e) => setFormData(prev => ({ ...prev, certDocument: e.target.value }))}
                        placeholder="Document URL or upload below"
                        className="flex-1 text-xs"
                      />
                    </div>
                    <Input
                      id="certDocument"
                      type="file"
                      accept=".pdf,.doc,.docx"
                      className="text-xs"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          await handleImageUpload(file, 'certDocument');
                        }
                      }}
                      disabled={uploading}
                    />
                    {formData.certDocument && (
                      <div className="flex items-center gap-2 p-2 bg-green-50 rounded text-xs">
                        <FileText className="w-3 h-3 text-green-600" />
                        <span className="text-green-700 truncate">Certificate uploaded successfully</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setFormData(prev => ({ ...prev, certDocument: '' }))}
                          className="h-6 w-6 p-0"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                  )}
                  
                  {/* Specification Document */}
                  <div className="space-y-2">
                    <Label htmlFor="specDocument" className="text-xs font-medium">Technical Specification Sheet</Label>
                    <div className="flex gap-2">
                      <Input
                        value={formData.specDocument}
                        onChange={(e) => setFormData(prev => ({ ...prev, specDocument: e.target.value }))}
                        placeholder="Document URL or upload below"
                        className="flex-1 text-xs"
                      />
                    </div>
                    <Input
                      id="specDocument"
                      type="file"
                      accept=".pdf,.doc,.docx"
                      className="text-xs"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          await handleImageUpload(file, 'specDocument');
                        }
                      }}
                      disabled={uploading}
                    />
                    {formData.specDocument && (
                      <div className="flex items-center gap-2 p-2 bg-green-50 rounded text-xs">
                        <FileText className="w-3 h-3 text-green-600" />
                        <span className="text-green-700 truncate">Specification uploaded successfully</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setFormData(prev => ({ ...prev, specDocument: '' }))}
                          className="h-6 w-6 p-0"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  {/* MSDS Document */}
                  <div className="space-y-2">
                    <Label htmlFor="msdsDocument" className="text-xs font-medium">MSDS / Safety Data Sheet</Label>
                    <div className="flex gap-2">
                      <Input
                        value={formData.msdsDocument}
                        onChange={(e) => setFormData(prev => ({ ...prev, msdsDocument: e.target.value }))}
                        placeholder="Document URL or upload below"
                        className="flex-1 text-xs"
                      />
                    </div>
                    <Input
                      id="msdsDocument"
                      type="file"
                      accept=".pdf,.doc,.docx"
                      className="text-xs"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          await handleImageUpload(file, 'msdsDocument');
                        }
                      }}
                      disabled={uploading}
                    />
                    {formData.msdsDocument && (
                      <div className="flex items-center gap-2 p-2 bg-green-50 rounded text-xs">
                        <FileText className="w-3 h-3 text-green-600" />
                        <span className="text-green-700 truncate">MSDS uploaded successfully</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setFormData(prev => ({ ...prev, msdsDocument: '' }))}
                          className="h-6 w-6 p-0"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Non-GMO Statement */}
                  <div className="space-y-2">
                    <Label htmlFor="nonGmoDocument" className="text-xs font-medium">Non GMO Statement</Label>
                    <div className="flex gap-2">
                      <Input
                        value={formData.nonGmoDocument}
                        onChange={(e) => setFormData(prev => ({ ...prev, nonGmoDocument: e.target.value }))}
                        placeholder="Document URL or upload below"
                        className="flex-1 text-xs"
                      />
                    </div>
                    <Input
                      id="nonGmoDocument"
                      type="file"
                      accept=".pdf,.doc,.docx"
                      className="text-xs"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          await handleImageUpload(file, 'nonGmoDocument');
                        }
                      }}
                      disabled={uploading}
                    />
                    {formData.nonGmoDocument && (
                      <div className="flex items-center gap-2 p-2 bg-green-50 rounded text-xs">
                        <FileText className="w-3 h-3 text-green-600" />
                        <span className="text-green-700 truncate">Non-GMO Statement uploaded</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setFormData(prev => ({ ...prev, nonGmoDocument: '' }))}
                          className="h-6 w-6 p-0"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Additional Documents */}
                <div className="mt-4 pt-3 border-t">
                  <Label className="text-xs font-medium mb-2 block">Additional Documents</Label>
                  <div className="space-y-3">
                    {/* Additional Doc Upload Area */}
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                      <div className="text-center">
                        <Upload className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                        <p className="text-xs text-gray-600 mb-2">Upload Additional Documents</p>
                        <Input
                          type="file"
                          multiple
                          accept=".pdf,.doc,.docx,.jpg,.png"
                          className="text-xs"
                          onChange={async (e) => {
                            const files = Array.from(e.target.files || []);
                            if (files.length > 0) {
                              setUploading(true);
                              try {
                                const uploadedDocs = [];
                                for (const file of files) {
                                  const formDataUpload = new FormData();
                                  formDataUpload.append('additionalDocs', file);
                                  if (formData.name) {
                                    formDataUpload.append('productId', formData.name.replace(/[^a-zA-Z0-9]/g, ''));
                                  }

                                  const response = await fetch('/api/admin/products/upload', {
                                    method: 'POST',
                                    body: formDataUpload,
                                  });

                                  if (response.ok) {
                                    const result = await response.json();
                                    if (result.success && result.files.additionalDocs) {
                                      uploadedDocs.push(result.files.additionalDocs);
                                    }
                                  }
                                }
                                
                                if (uploadedDocs.length > 0) {
                                  setFormData(prev => ({
                                    ...prev,
                                    additionalDocs: [...prev.additionalDocs, ...uploadedDocs]
                                  }));
                                  
                                  toast({
                                    title: "Upload Successful",
                                    description: `${uploadedDocs.length} additional documents uploaded successfully`,
                                  });
                                }
                              } catch (error) {
                                toast({
                                  title: "Upload Failed",
                                  description: "Failed to upload some documents",
                                  variant: "destructive",
                                });
                              } finally {
                                setUploading(false);
                              }
                            }
                          }}
                          disabled={uploading}
                        />
                        <p className="text-xs text-gray-400 mt-1">PDF, DOC, DOCX, JPG, PNG - Hold Ctrl/Cmd for multiple files</p>
                      </div>
                    </div>
                    
                    {/* Display uploaded additional documents */}
                    {formData.additionalDocs.length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-xs font-medium">Uploaded Additional Documents:</Label>
                        {formData.additionalDocs.map((docUrl: string, index: number) => (
                          <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded text-xs">
                            <FileText className="w-3 h-3 text-gray-600" />
                            <span className="flex-1 truncate text-gray-700">Document {index + 1}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const newDocs = formData.additionalDocs.filter((_: string, i: number) => i !== index);
                                setFormData(prev => ({ ...prev, additionalDocs: newDocs }));
                              }}
                              className="h-6 w-6 p-0"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
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
              <div className="grid grid-cols-4 gap-4">
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
                  <Label htmlFor="packingSize">Packing Size (One Unit) *</Label>
                  <Input
                    id="packingSize"
                    value={formData.packingSize}
                    onChange={(e) => setFormData(prev => ({ ...prev, packingSize: e.target.value }))}
                    placeholder="e.g., 25kg bag, 1kg pouch"
                  />
                  <p className="text-xs text-gray-500 mt-1">Standard package size</p>
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

              {/* Multi-Currency Pricing Section */}
              <div className="space-y-4">
                <Label className="text-base font-semibold">Multi-Currency Pricing *</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="priceUSD">USD Price (per unit)</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">$</span>
                      <Input
                        id="priceUSD"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.priceUSD}
                        onChange={(e) => setFormData(prev => ({ ...prev, priceUSD: e.target.value }))}
                        placeholder="25.00"
                        className="pl-6"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="priceINR">INR Price (per unit)</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">₹</span>
                      <Input
                        id="priceINR"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.priceINR}
                        onChange={(e) => setFormData(prev => ({ ...prev, priceINR: e.target.value }))}
                        placeholder="2000.00"
                        className="pl-6"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="priceEUR">EUR Price (per unit)</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">€</span>
                      <Input
                        id="priceEUR"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.priceEUR}
                        onChange={(e) => setFormData(prev => ({ ...prev, priceEUR: e.target.value }))}
                        placeholder="22.00"
                        className="pl-6"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="priceGBP">GBP Price (per unit)</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">£</span>
                      <Input
                        id="priceGBP"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.priceGBP}
                        onChange={(e) => setFormData(prev => ({ ...prev, priceGBP: e.target.value }))}
                        placeholder="20.00"
                        className="pl-6"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Price Terms & Location */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="priceType">Price Terms (Incoterms) *</Label>
                  <Select value={formData.priceType} onValueChange={(value) => setFormData(prev => ({ ...prev, priceType: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EXW">EXW - Ex Works</SelectItem>
                      <SelectItem value="FOB">FOB - Free on Board</SelectItem>
                      <SelectItem value="CIF">CIF - Cost, Insurance & Freight</SelectItem>
                      <SelectItem value="CFR">CFR - Cost and Freight</SelectItem>
                      <SelectItem value="DDP">DDP - Delivered Duty Paid</SelectItem>
                      <SelectItem value="DDU">DDU - Delivered Duty Unpaid</SelectItem>
                      <SelectItem value="DAP">DAP - Delivered at Place</SelectItem>
                      <SelectItem value="CPT">CPT - Carriage Paid To</SelectItem>
                      <SelectItem value="CIP">CIP - Carriage & Insurance Paid</SelectItem>
                      <SelectItem value="Delivered">Delivered</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">International trade terms</p>
                </div>
                <div>
                  <Label htmlFor="priceLocation">Price Location/Port *</Label>
                  <Input
                    id="priceLocation"
                    value={formData.priceLocation}
                    onChange={(e) => setFormData(prev => ({ ...prev, priceLocation: e.target.value }))}
                    placeholder="e.g., Warehouse India, Mumbai Port, New York"
                  />
                  <p className="text-xs text-gray-500 mt-1">Specify location for price terms</p>
                </div>
              </div>

              {/* Legacy Pricing (for backward compatibility) */}
              <div className="border-t pt-4">
                <Label className="text-sm text-gray-600">Legacy Pricing (Optional)</Label>
                <div className="grid grid-cols-3 gap-4 mt-2">
                  <div>
                    <Label htmlFor="rate">Rate (Price Per Unit)</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">$</span>
                      <Input
                        id="rate"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.rate}
                        onChange={(e) => setFormData(prev => ({ ...prev, rate: e.target.value }))}
                        placeholder="0.25"
                        className="pl-6"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="basePrice">Base Price</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">$</span>
                      <Input
                        id="basePrice"
                        type="number"
                        step="0.01"
                        value={formData.basePrice}
                        onChange={(e) => setFormData(prev => ({ ...prev, basePrice: e.target.value }))}
                        placeholder="25.00"
                        className="pl-6"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="currency">Default Currency</Label>
                    <Select value={formData.currency} onValueChange={(value) => setFormData(prev => ({ ...prev, currency: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="INR">INR</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="GBP">GBP</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
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
            <Button type="submit" className="flex items-center gap-2" disabled={uploading}>
              {uploading ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  Uploading...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  {product ? "Update Product" : "Create Product"}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Placeholder components for other tabs
function CategoriesManagement({ categories, loading }: any) {
  const { toast } = useToast();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  const createCategoryMutation = useMutation({
    mutationFn: async (categoryData: any) => {
      return apiRequest("/api/admin/categories", {
        method: "POST",
        body: JSON.stringify(categoryData),
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Category created successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      setShowCreateForm(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create category",
        variant: "destructive",
      });
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      return apiRequest(`/api/admin/categories/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Category updated successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      setEditingCategory(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update category",
        variant: "destructive",
      });
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/admin/categories/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Category deleted successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete category",
        variant: "destructive",
      });
    },
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Package className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading categories...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Categories Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Categories Management</h2>
          <p className="text-gray-600">Manage product categories and hierarchies</p>
        </div>
        <Button 
          onClick={() => setShowCreateForm(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Category
        </Button>
      </div>

      {/* Categories List */}
      <div className="grid gap-4">
        {categories.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Package className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Categories</h3>
              <p className="text-gray-500 mb-4">Start by adding your first category</p>
              <Button onClick={() => setShowCreateForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Category
              </Button>
            </CardContent>
          </Card>
        ) : (
          categories.map((category: any) => (
            <Card key={category.id} className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900">{category.name}</h3>
                    <Badge variant="outline">{category.slug}</Badge>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{category.description}</p>
                  {category.parentId && (
                    <p className="text-xs text-gray-500 mt-1">
                      Parent Category ID: {category.parentId}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setEditingCategory(category)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => deleteCategoryMutation.mutate(category.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Create/Edit Category Form */}
      {(showCreateForm || editingCategory) && (
        <CategoryForm
          category={editingCategory}
          categories={categories}
          onSubmit={(data) => {
            if (editingCategory) {
              updateCategoryMutation.mutate({ ...data, id: editingCategory.id });
            } else {
              createCategoryMutation.mutate(data);
            }
          }}
          onCancel={() => {
            setShowCreateForm(false);
            setEditingCategory(null);
          }}
          isLoading={createCategoryMutation.isPending || updateCategoryMutation.isPending}
        />
      )}
    </div>
  );
}

function CategoryForm({ category, categories, onSubmit, onCancel, isLoading }: any) {
  const form = useForm({
    resolver: zodResolver(
      z.object({
        name: z.string().min(1, "Name is required"),
        description: z.string().optional(),
        parentId: z.number().optional(),
        isActive: z.boolean().default(true),
      })
    ),
    defaultValues: {
      name: category?.name || "",
      description: category?.description || "",
      parentId: category?.parentId || undefined,
      isActive: category?.isActive ?? true,
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{category ? "Edit Category" : "Add New Category"}</CardTitle>
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
                    <FormLabel>Category Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Essential Oils" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="parentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Parent Category (Optional)</FormLabel>
                    <Select
                      value={field.value?.toString()}
                      onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select parent category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">No Parent</SelectItem>
                        {categories
                          .filter((cat: any) => cat.id !== category?.id)
                          .map((cat: any) => (
                            <SelectItem key={cat.id} value={cat.id.toString()}>
                              {cat.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
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
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Brief description of this category..."
                      rows={3}
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
                      Active categories will be visible in product listings
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
                {isLoading ? "Saving..." : category ? "Update Category" : "Create Category"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

function TagsManagement({ tags, loading }: any) {
  const { toast } = useToast();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTag, setEditingTag] = useState(null);

  const createTagMutation = useMutation({
    mutationFn: async (tagData: any) => {
      const response = await apiRequest("POST", "/api/admin/tags", tagData);
      return await response.json();
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
      const response = await apiRequest("PUT", `/api/admin/tags/${id}`, data);
      return await response.json();
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
      const response = await apiRequest("DELETE", `/api/admin/tags/${id}`);
      return await response.json();
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Package className="h-8 w-8 animate-spin mx-auto mb-4" />
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
        <Button 
          onClick={() => setShowCreateForm(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Tag
        </Button>
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
                onClick={() => createTagMutation.mutate({ name: tagName, type: 'certification' })}
                className="text-xs"
              >
                <Plus className="h-3 w-3 mr-1" />
                {tagName}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tags List */}
      <div className="grid gap-4">
        {tags.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Package className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Tags</h3>
              <p className="text-gray-500 mb-4">Start by adding your first tag</p>
              <Button onClick={() => setShowCreateForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Tag
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tags.map((tag: any) => (
              <Card key={tag.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-medium">
                        {tag.name}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {tag.type || 'general'}
                      </Badge>
                    </div>
                    {tag.description && (
                      <p className="text-xs text-gray-600 mt-1">{tag.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setEditingTag(tag)}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => deleteTagMutation.mutate(tag.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Tag Form */}
      {(showCreateForm || editingTag) && (
        <TagForm
          tag={editingTag}
          onSubmit={(data) => {
            if (editingTag) {
              updateTagMutation.mutate({ ...data, id: editingTag.id });
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

function TagForm({ tag, onSubmit, onCancel, isLoading }: any) {
  const form = useForm({
    resolver: zodResolver(
      z.object({
        name: z.string().min(1, "Name is required"),
        description: z.string().optional(),
        type: z.string().default("general"),
        color: z.string().optional(),
      })
    ),
    defaultValues: {
      name: tag?.name || "",
      description: tag?.description || "",
      type: tag?.type || "general",
      color: tag?.color || "#3B82F6",
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{tag ? "Edit Tag" : "Add New Tag"}</CardTitle>
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
                      <Input placeholder="e.g., USDA NOP" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tag Type</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select tag type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="general">General</SelectItem>
                        <SelectItem value="certification">Certification</SelectItem>
                        <SelectItem value="category">Category</SelectItem>
                        <SelectItem value="feature">Feature</SelectItem>
                        <SelectItem value="origin">Origin</SelectItem>
                      </SelectContent>
                    </Select>
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

function SlidersManagement({ sliders, loading }: any) {
  const { toast } = useToast();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingSlider, setEditingSlider] = useState(null);

  const createSliderMutation = useMutation({
    mutationFn: async (sliderData: any) => {
      return apiRequest("/api/admin/sliders", {
        method: "POST",
        body: JSON.stringify(sliderData),
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Hero slider created successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sliders"] });
      setShowCreateForm(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create slider",
        variant: "destructive",
      });
    },
  });

  const updateSliderMutation = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      return apiRequest(`/api/admin/sliders/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Hero slider updated successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sliders"] });
      setEditingSlider(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update slider",
        variant: "destructive",
      });
    },
  });

  const deleteSliderMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/admin/sliders/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Hero slider deleted successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sliders"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete slider",
        variant: "destructive",
      });
    },
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Monitor className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading sliders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero Sliders Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Hero Sliders Management</h2>
          <p className="text-gray-600">Manage homepage hero slider banners and promotions</p>
        </div>
        <Button 
          onClick={() => setShowCreateForm(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Slider
        </Button>
      </div>

      {/* Sliders List */}
      <div className="grid gap-4">
        {sliders.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Monitor className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Hero Sliders</h3>
              <p className="text-gray-500 mb-4">Start by adding your first hero slider</p>
              <Button onClick={() => setShowCreateForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Slider
              </Button>
            </CardContent>
          </Card>
        ) : (
          sliders.map((slider: any) => (
            <Card key={slider.id} className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-24 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                    {slider.imageUrl ? (
                      <img 
                        src={slider.imageUrl} 
                        alt={slider.title}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <ImageIcon className="h-8 w-8 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">{slider.title}</h3>
                      <Badge 
                        variant={slider.isActive ? 'default' : 'secondary'}
                        className={slider.isActive ? 'bg-green-100 text-green-800' : ''}
                      >
                        {slider.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">{slider.subtitle}</p>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-xs text-gray-500">
                        Order: {slider.displayOrder}
                      </span>
                      {slider.buttonText && (
                        <span className="text-xs text-gray-500">
                          Button: {slider.buttonText}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setEditingSlider(slider)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => deleteSliderMutation.mutate(slider.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Create/Edit Slider Form */}
      {(showCreateForm || editingSlider) && (
        <SliderForm
          slider={editingSlider}
          onSubmit={(data) => {
            if (editingSlider) {
              updateSliderMutation.mutate({ ...data, id: editingSlider.id });
            } else {
              createSliderMutation.mutate(data);
            }
          }}
          onCancel={() => {
            setShowCreateForm(false);
            setEditingSlider(null);
          }}
          isLoading={createSliderMutation.isPending || updateSliderMutation.isPending}
        />
      )}
    </div>
  );
}

function SliderForm({ slider, onSubmit, onCancel, isLoading }: any) {
  const form = useForm({
    resolver: zodResolver(
      z.object({
        title: z.string().min(1, "Title is required"),
        subtitle: z.string().optional(),
        imageUrl: z.string().url("Please enter a valid image URL"),
        buttonText: z.string().optional(),
        buttonUrl: z.string().optional(),
        displayOrder: z.number().min(1, "Display order must be at least 1"),
        isActive: z.boolean().default(true),
      })
    ),
    defaultValues: {
      title: slider?.title || "",
      subtitle: slider?.subtitle || "",
      imageUrl: slider?.imageUrl || "",
      buttonText: slider?.buttonText || "",
      buttonUrl: slider?.buttonUrl || "",
      displayOrder: slider?.displayOrder || 1,
      isActive: slider?.isActive ?? true,
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{slider ? "Edit Hero Slider" : "Add New Hero Slider"}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Main headline..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="displayOrder"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Display Order</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="1" 
                        {...field} 
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="subtitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subtitle (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Supporting text..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Image URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://example.com/image.jpg" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="buttonText"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Button Text (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Shop Now" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="buttonUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Button URL (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="/products" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Active Status</FormLabel>
                    <FormDescription>
                      Active sliders will be displayed on the homepage
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
                {isLoading ? "Saving..." : slider ? "Update Slider" : "Create Slider"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

function SEOManagement() {
  const { toast } = useToast();
  const [seoSettings, setSeoSettings] = useState({
    siteTitle: "BFI Organic - Premium Organic Ingredients",
    siteDescription: "Leading supplier of certified organic ingredients and natural products for global markets",
    siteKeywords: "organic ingredients, natural products, USDA certified, bulk organic",
    ogImage: "",
    twitterHandle: "@bfiorganic",
    googleAnalyticsId: "",
    googleTagManagerId: "",
    facebookPixelId: "",
    structuredDataEnabled: true,
  });

  const saveSEOSettings = useMutation({
    mutationFn: async (seoData: any) => {
      return apiRequest("/api/admin/seo-settings", {
        method: "POST",
        body: JSON.stringify(seoData),
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "SEO settings saved successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save SEO settings",
        variant: "destructive",
      });
    },
  });

  const form = useForm({
    resolver: zodResolver(
      z.object({
        siteTitle: z.string().min(1, "Site title is required"),
        siteDescription: z.string().min(1, "Site description is required"),
        siteKeywords: z.string().optional(),
        ogImage: z.string().optional(),
        twitterHandle: z.string().optional(),
        googleAnalyticsId: z.string().optional(),
        googleTagManagerId: z.string().optional(),
        facebookPixelId: z.string().optional(),
        structuredDataEnabled: z.boolean().default(true),
      })
    ),
    defaultValues: seoSettings,
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">SEO Management</h2>
        <p className="text-gray-600">Configure global SEO settings and structured data</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic SEO Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Basic SEO Settings</CardTitle>
            <CardDescription>Configure your site's basic meta information</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit((data) => saveSEOSettings.mutate(data))} className="space-y-4">
                <FormField
                  control={form.control}
                  name="siteTitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Site Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Your site title..." {...field} />
                      </FormControl>
                      <FormDescription>
                        This appears in browser tabs and search results
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="siteDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Site Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Brief description of your site..." 
                          rows={3}
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        This appears in search results (150-160 characters recommended)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="siteKeywords"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Keywords</FormLabel>
                      <FormControl>
                        <Input placeholder="keyword1, keyword2, keyword3" {...field} />
                      </FormControl>
                      <FormDescription>
                        Comma-separated keywords (optional, limited SEO impact)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" disabled={saveSEOSettings.isPending}>
                  {saveSEOSettings.isPending ? "Saving..." : "Save Basic Settings"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Social Media & Analytics */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Social Media & Analytics</CardTitle>
            <CardDescription>Configure social sharing and tracking</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="ogImage">Open Graph Image URL</Label>
              <Input 
                id="ogImage"
                placeholder="https://example.com/og-image.jpg"
                value={seoSettings.ogImage}
                onChange={(e) => setSeoSettings({...seoSettings, ogImage: e.target.value})}
              />
              <p className="text-xs text-gray-500 mt-1">
                Image for social media sharing (1200x630px recommended)
              </p>
            </div>

            <div>
              <Label htmlFor="twitter">Twitter Handle</Label>
              <Input 
                id="twitter"
                placeholder="@yourbrand"
                value={seoSettings.twitterHandle}
                onChange={(e) => setSeoSettings({...seoSettings, twitterHandle: e.target.value})}
              />
            </div>

            <div>
              <Label htmlFor="ga">Google Analytics ID</Label>
              <Input 
                id="ga"
                placeholder="GA4-XXXXXXXXXX"
                value={seoSettings.googleAnalyticsId}
                onChange={(e) => setSeoSettings({...seoSettings, googleAnalyticsId: e.target.value})}
              />
            </div>

            <div>
              <Label htmlFor="gtm">Google Tag Manager ID</Label>
              <Input 
                id="gtm"
                placeholder="GTM-XXXXXXX"
                value={seoSettings.googleTagManagerId}
                onChange={(e) => setSeoSettings({...seoSettings, googleTagManagerId: e.target.value})}
              />
            </div>

            <div>
              <Label htmlFor="fbpixel">Facebook Pixel ID</Label>
              <Input 
                id="fbpixel"
                placeholder="123456789012345"
                value={seoSettings.facebookPixelId}
                onChange={(e) => setSeoSettings({...seoSettings, facebookPixelId: e.target.value})}
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label className="text-base">Structured Data</Label>
                <p className="text-sm text-gray-500">
                  Enable JSON-LD structured data for products
                </p>
              </div>
              <Switch
                checked={seoSettings.structuredDataEnabled}
                onCheckedChange={(checked) => setSeoSettings({...seoSettings, structuredDataEnabled: checked})}
              />
            </div>

            <Button 
              onClick={() => saveSEOSettings.mutate(seoSettings)}
              disabled={saveSEOSettings.isPending}
              className="w-full"
            >
              {saveSEOSettings.isPending ? "Saving..." : "Save All Settings"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* SEO Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">SEO Best Practices</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Title Tags</h4>
              <ul className="text-gray-600 space-y-1">
                <li>• Keep under 60 characters</li>
                <li>• Include primary keywords</li>
                <li>• Make each page title unique</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Meta Descriptions</h4>
              <ul className="text-gray-600 space-y-1">
                <li>• Keep between 150-160 characters</li>
                <li>• Include call-to-action</li>
                <li>• Describe page content accurately</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Images</h4>
              <ul className="text-gray-600 space-y-1">
                <li>• Use descriptive alt text</li>
                <li>• Optimize file sizes</li>
                <li>• Use relevant file names</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Content</h4>
              <ul className="text-gray-600 space-y-1">
                <li>• Create valuable, original content</li>
                <li>• Use header tags (H1, H2, H3)</li>
                <li>• Include internal links</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}