import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
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
  Building2,
  AlertCircle,
  MessageSquare
} from "lucide-react";
import type { Product, Category, ProductType } from "@shared/schema";

interface ComprehensiveProductFormProps {
  product?: Product;
  categories: Category[];
  onSubmit: (data: any) => void;
  isLoading: boolean;
  onClose?: () => void;
}

export default function ComprehensiveProductForm({ 
  product, 
  categories, 
  onSubmit, 
  isLoading,
  onClose 
}: ComprehensiveProductFormProps) {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    name: product?.name || "",
    productId: product?.productId || "",
    slug: product?.slug || "",
    description: product?.description || "",
    specificationSheet: product?.specificationSheet || "",
    botanicalName: product?.botanicalName || "",
    plantPart: product?.plantPart || "",
    origin: product?.origin || "",
    healthSupport: product?.healthSupport || "",
    hsCode: product?.hsCode || "",
    categoryId: product?.categoryId?.toString() || "",
    productType: product?.productType || "organic",
    productGrade: product?.productGrade || "",
    form: product?.form || "",
    certifications: product?.certifications || [],
    isOrganic: product?.isOrganic || false,
    currentStock: product?.currentStock?.toString() || "",
    stockUnit: product?.stockUnit || "kg",
    packingSize: product?.packingSize || "",
    moq: product?.moq?.toString() || "",
    leadTime: product?.leadTime || "",
    sampleAvailable: product?.sampleAvailable ?? true,
    stopSell: product?.stopSell ?? false,
    basePrice: product?.basePrice?.toString() || "",
    rate: product?.rate?.toString() || "",
    priceUSD: product?.priceUSD?.toString() || "",
    tags: product?.tags || [],
    priceINR: product?.priceINR?.toString() || "",
    priceEUR: product?.priceEUR?.toString() || "",
    priceGBP: product?.priceGBP?.toString() || "",
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
    faqs: product?.faqs || [],
    
    seoTitle: product?.seoTitle || "",
    seoDescription: product?.seoDescription || "",
    canonicalUrl: product?.canonicalUrl || "",
    status: product?.status || "draft",
    isVisible: product?.isVisible ?? true,
    isActive: product?.isActive ?? true,
    isOrderable: product?.isOrderable ?? true,
    internalNotes: product?.internalNotes || "",
  });

  const [selectedTags, setSelectedTags] = useState<string[]>(product?.tags || []);
  const [availableTags, setAvailableTags] = useState<any[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<{id: number, isPrimary: boolean}[]>([]);
  const [primaryCategoryId, setPrimaryCategoryId] = useState<number | null>(null);
  
  // Product Types state
  const [selectedProductTypes, setSelectedProductTypes] = useState<{id: number, isPrimary: boolean}[]>([]);
  const [primaryProductTypeId, setPrimaryProductTypeId] = useState<number | null>(null);
  const [availableProductTypes, setAvailableProductTypes] = useState<ProductType[]>([]);
  
  // Health Support state
  const [selectedHealthSupports, setSelectedHealthSupports] = useState<{id: number, isPrimary: boolean}[]>([]);
  const [primaryHealthSupportId, setPrimaryHealthSupportId] = useState<number | null>(null);
  const [availableHealthSupports, setAvailableHealthSupports] = useState<any[]>([]);

  // Fetch available tags and product types
  useEffect(() => {
    const fetchTags = async () => {
      try {
        console.log('Fetching tags from API...');
        const response = await fetch('/api/admin/tags');
        if (response.ok) {
          const tags = await response.json();
          console.log('Tags fetched:', tags);
          setAvailableTags(tags);
        } else {
          console.error('Failed to fetch tags, status:', response.status);
        }
      } catch (error) {
        console.error('Failed to fetch tags:', error);
      }
    };

    const fetchProductTypes = async () => {
      try {
        console.log('Fetching product types from API...');
        const response = await fetch('/api/product-types');
        if (response.ok) {
          const productTypes = await response.json();
          console.log('Product types fetched:', productTypes);
          setAvailableProductTypes(productTypes);
        } else {
          console.error('Failed to fetch product types, status:', response.status);
        }
      } catch (error) {
        console.error('Failed to fetch product types:', error);
      }
    };

    const fetchHealthSupports = async () => {
      try {
        console.log('Fetching health supports from API...');
        const response = await fetch('/api/health-supports');
        if (response.ok) {
          const healthSupports = await response.json();
          console.log('Health supports fetched:', healthSupports);
          setAvailableHealthSupports(healthSupports);
        } else {
          console.error('Failed to fetch health supports, status:', response.status);
        }
      } catch (error) {
        console.error('Failed to fetch health supports:', error);
      }
    };

    fetchTags();
    fetchProductTypes();
    fetchHealthSupports();
  }, []);

  // Load existing categories for editing
  useEffect(() => {
    if (product && product.id) {
      const loadProductCategories = async () => {
        try {
          const response = await fetch(`/api/products/${product.id}/categories`);
          if (response.ok) {
            const productWithCategories = await response.json();
            if (productWithCategories.categories) {
              setSelectedCategories(productWithCategories.categories.map((cat: any) => ({
                id: cat.id,
                isPrimary: cat.isPrimary
              })));
              const primary = productWithCategories.categories.find((cat: any) => cat.isPrimary);
              if (primary) {
                setPrimaryCategoryId(primary.id);
              }
            }
          }
        } catch (error) {
          console.error('Failed to load product categories:', error);
        }
      };
      loadProductCategories();
    } else if (product?.categoryId) {
      // For legacy products with single categoryId, set as primary
      setSelectedCategories([{ id: parseInt(product.categoryId.toString()), isPrimary: true }]);
      setPrimaryCategoryId(parseInt(product.categoryId.toString()));
    }
  }, [product]);

  // Load existing product types for editing
  useEffect(() => {
    if (product && product.id) {
      const loadProductTypes = async () => {
        try {
          const response = await fetch(`/api/products/${product.id}/types`);
          if (response.ok) {
            const productTypes = await response.json();
            if (productTypes && productTypes.length > 0) {
              setSelectedProductTypes(productTypes.map((type: any) => ({
                id: type.id,
                isPrimary: type.isPrimary
              })));
              const primary = productTypes.find((type: any) => type.isPrimary);
              if (primary) {
                setPrimaryProductTypeId(primary.id);
              }
            }
          }
        } catch (error) {
          console.error('Failed to load product types:', error);
        }
      };
      loadProductTypes();
    }
  }, [product]);

  // Load existing health supports for editing
  useEffect(() => {
    if (product && product.id) {
      const loadProductHealthSupports = async () => {
        try {
          const response = await fetch(`/api/products/${product.id}/health-supports`);
          if (response.ok) {
            const healthSupports = await response.json();
            if (healthSupports && healthSupports.length > 0) {
              setSelectedHealthSupports(healthSupports.map((hs: any) => ({
                id: hs.id,
                isPrimary: hs.isPrimary
              })));
              const primary = healthSupports.find((hs: any) => hs.isPrimary);
              if (primary) {
                setPrimaryHealthSupportId(primary.id);
              }
            }
          }
        } catch (error) {
          console.error('Failed to load product health supports:', error);
        }
      };
      loadProductHealthSupports();
    }
  }, [product]);

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
        if (fieldName === 'secondImage') {
          // Handle second image upload
          const newGalleryImages = Array.isArray(formData.galleryImages) ? [...formData.galleryImages] : [];
          newGalleryImages[0] = Array.isArray(result.files[fieldName]) ? result.files[fieldName][0] : result.files[fieldName];
          setFormData(prev => ({ ...prev, galleryImages: newGalleryImages }));
        } else if (fieldName === 'thirdImage') {
          // Handle third image upload
          const newGalleryImages = Array.isArray(formData.galleryImages) ? [...formData.galleryImages] : [''];
          if (newGalleryImages.length < 2) newGalleryImages.push('');
          newGalleryImages[1] = Array.isArray(result.files[fieldName]) ? result.files[fieldName][0] : result.files[fieldName];
          setFormData(prev => ({ ...prev, galleryImages: newGalleryImages }));
        } else {
          // Handle main image and other single uploads
          setFormData(prev => ({
            ...prev,
            [fieldName]: result.files[fieldName]
          }));
        }
        
        const fileType = fieldName.includes('Document') || fieldName.includes('Docs') ? 'document' : 'image';
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
    
    // Only validate categories and product types for active products
    if (formData.isActive) {
      // Validate categories
      if (selectedCategories.length === 0) {
        toast({
          title: "Error",
          description: "Please select at least one category",
          variant: "destructive",
        });
        return;
      }
      
      if (!primaryCategoryId) {
        toast({
          title: "Error", 
          description: "Please select a primary category",
          variant: "destructive",
        });
        return;
      }

      // Validate product types
      if (selectedProductTypes.length === 0) {
        toast({
          title: "Error",
          description: "Please select at least one product type",
          variant: "destructive",
        });
        return;
      }
      
      if (!primaryProductTypeId) {
        toast({
          title: "Error", 
          description: "Please select a primary product type",
          variant: "destructive",
        });
        return;
      }
    }
    
    // Clean and convert form data to proper types
    const cleanedData = {
      ...formData,
      // Convert integer fields, omit if empty string
      categoryId: primaryCategoryId, // Keep for backward compatibility
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
      healthSupport: formData.healthSupport || undefined,
      hsCode: formData.hsCode || undefined,
      productGrade: formData.productGrade || undefined,
      form: formData.form || undefined,
      leadTime: formData.leadTime || undefined,
      
      // Ensure arrays are properly formatted and filter out empty strings
      certifications: Array.isArray(formData.certifications) ? formData.certifications : [],
      galleryImages: Array.isArray(formData.galleryImages) ? formData.galleryImages.filter(img => img && img.trim() !== '') : [],
      faqs: Array.isArray(formData.faqs) ? (formData.faqs as any[]).filter(faq => faq.question.trim() !== '' && faq.answer.trim() !== '') : [],
      tags: selectedTags, // Include the selected tags
      
      // Include multiple categories information
      selectedCategories: selectedCategories.map(cat => ({
        categoryId: cat.id,
        isPrimary: cat.id === primaryCategoryId
      })),
      primaryCategoryId,
      
      // Include selected product types
      selectedProductTypes: selectedProductTypes.map(type => ({
        typeId: type.id,
        isPrimary: type.id === primaryProductTypeId
      })),
      primaryProductTypeId,
      
      // Include selected health supports
      selectedHealthSupports: selectedHealthSupports.map(hs => ({
        healthSupportId: hs.id,
        isPrimary: hs.id === primaryHealthSupportId
      })),
      primaryHealthSupportId,
    };
    
    // Remove undefined values to avoid sending empty data
    Object.keys(cleanedData).forEach(key => {
      if ((cleanedData as any)[key] === undefined || (cleanedData as any)[key] === '') {
        delete (cleanedData as any)[key];
      }
    });
    
    onSubmit(cleanedData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6 max-h-[85vh] overflow-y-auto p-2 sm:p-0">
      {/* Basic Information */}
      <Card className="shadow-sm border-gray-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg sm:text-xl text-gray-800">Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium text-gray-700">Product Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
                className="h-10 text-base"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="productId" className="text-sm font-medium text-gray-700">Product ID</Label>
              <Input
                id="productId"
                value={formData.productId}
                onChange={(e) => setFormData(prev => ({ ...prev, productId: e.target.value }))}
                placeholder="Auto-generated if left empty"
                className="h-10 text-base"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="slug" className="text-sm font-medium text-gray-700">URL Slug *</Label>
            <Input
              id="slug"
              value={formData.slug}
              onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
              required
              className="h-10 text-base"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium text-gray-700">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="text-base resize-none"
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
        </CardContent>
      </Card>

      {/* Product Images */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Product Images
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Main Product Image */}
          <div>
            <Label htmlFor="mainImage">Main Product Image</Label>
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  value={formData.mainImage}
                  onChange={(e) => setFormData(prev => ({ ...prev, mainImage: e.target.value }))}
                  placeholder="Image URL or upload below"
                  className="flex-1"
                />
                <Button type="button" variant="outline" size="sm" disabled={uploading}>
                  <Upload className="h-4 w-4 mr-1" />
                  {uploading ? 'Uploading...' : 'S3 Ready'}
                </Button>
              </div>
              <Input
                id="mainImage"
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    await handleImageUpload(file, 'mainImage');
                  }
                }}
                disabled={uploading}
              />
              
              {formData.mainImage && (
                <div className="mt-2 flex items-center gap-2">
                  <img 
                    src={formData.mainImage} 
                    alt="Main product image" 
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

          {/* Gallery Images - Individual Upload */}
          <div>
            <Label>Gallery Images</Label>
            <div className="space-y-4">
              
              {/* Second Image */}
              <div>
                <Label htmlFor="secondImage">Second Image</Label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      value={Array.isArray(formData.galleryImages) && formData.galleryImages[0] ? formData.galleryImages[0] : ''}
                      onChange={(e) => {
                        const newGalleryImages = Array.isArray(formData.galleryImages) ? [...formData.galleryImages] : [];
                        newGalleryImages[0] = e.target.value;
                        setFormData(prev => ({ ...prev, galleryImages: newGalleryImages }));
                      }}
                      placeholder="Image URL or upload below"
                      className="flex-1"
                    />
                    <Button type="button" variant="outline" size="sm" disabled={uploading}>
                      <Upload className="h-4 w-4 mr-1" />
                      {uploading ? 'Uploading...' : 'S3 Ready'}
                    </Button>
                  </div>
                  <Input
                    id="secondImage"
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        await handleImageUpload(file, 'secondImage');
                      }
                    }}
                    disabled={uploading}
                  />
                  
                  {Array.isArray(formData.galleryImages) && formData.galleryImages[0] && (
                    <div className="mt-2 flex items-center gap-2">
                      <img 
                        src={formData.galleryImages[0]} 
                        alt="Second image" 
                        className="w-20 h-20 object-cover rounded border"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const newGalleryImages = Array.isArray(formData.galleryImages) ? [...formData.galleryImages] : [];
                          newGalleryImages[0] = '';
                          setFormData(prev => ({ ...prev, galleryImages: newGalleryImages }));
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Third Image */}
              <div>
                <Label htmlFor="thirdImage">Third Image</Label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      value={Array.isArray(formData.galleryImages) && formData.galleryImages[1] ? formData.galleryImages[1] : ''}
                      onChange={(e) => {
                        const newGalleryImages = Array.isArray(formData.galleryImages) ? [...formData.galleryImages] : [''];
                        newGalleryImages[1] = e.target.value;
                        setFormData(prev => ({ ...prev, galleryImages: newGalleryImages }));
                      }}
                      placeholder="Image URL or upload below"
                      className="flex-1"
                    />
                    <Button type="button" variant="outline" size="sm" disabled={uploading}>
                      <Upload className="h-4 w-4 mr-1" />
                      {uploading ? 'Uploading...' : 'S3 Ready'}
                    </Button>
                  </div>
                  <Input
                    id="thirdImage"
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        await handleImageUpload(file, 'thirdImage');
                      }
                    }}
                    disabled={uploading}
                  />
                  
                  {Array.isArray(formData.galleryImages) && formData.galleryImages[1] && (
                    <div className="mt-2 flex items-center gap-2">
                      <img 
                        src={formData.galleryImages[1]} 
                        alt="Third image" 
                        className="w-20 h-20 object-cover rounded border"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const newGalleryImages = Array.isArray(formData.galleryImages) ? [...formData.galleryImages] : [''];
                          if (newGalleryImages.length < 2) newGalleryImages.push('');
                          newGalleryImages[1] = '';
                          setFormData(prev => ({ ...prev, galleryImages: newGalleryImages }));
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Product Classification */}
      <Card className="shadow-sm border-gray-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg sm:text-xl text-gray-800">Product Classification</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-2">
              <Label htmlFor="botanicalName" className="text-sm font-medium text-gray-700">Botanical Name</Label>
              <Input
                id="botanicalName"
                value={formData.botanicalName}
                onChange={(e) => setFormData(prev => ({ ...prev, botanicalName: e.target.value }))}
                className="h-10 text-base"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="plantPart" className="text-sm font-medium text-gray-700">Plant Part</Label>
              <Input
                id="plantPart"
                value={formData.plantPart}
                onChange={(e) => setFormData(prev => ({ ...prev, plantPart: e.target.value }))}
                className="h-10 text-base"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="origin" className="text-sm font-medium text-gray-700">Origin</Label>
            <Select value={formData.origin} onValueChange={(value) => setFormData(prev => ({ ...prev, origin: value }))}>
              <SelectTrigger className="h-10 text-base">
                <SelectValue placeholder="Select origin country" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="India">India</SelectItem>
                <SelectItem value="China">China</SelectItem>
                <SelectItem value="United States">United States</SelectItem>
                <SelectItem value="Germany">Germany</SelectItem>
                <SelectItem value="Brazil">Brazil</SelectItem>
                <SelectItem value="Mexico">Mexico</SelectItem>
                <SelectItem value="Turkey">Turkey</SelectItem>
                <SelectItem value="Egypt">Egypt</SelectItem>
                <SelectItem value="Madagascar">Madagascar</SelectItem>
                <SelectItem value="Sri Lanka">Sri Lanka</SelectItem>
                <SelectItem value="Indonesia">Indonesia</SelectItem>
                <SelectItem value="Peru">Peru</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="categories" className="text-sm font-medium text-gray-700">Categories *</Label>
            <div className="border rounded-md p-3 max-h-48 overflow-y-auto bg-gray-50">
              <div className="text-sm text-gray-600 mb-3">Select one or more categories. Check the "Primary" box for the main category.</div>
              {categories.map(category => {
                const isSelected = selectedCategories.some(sc => sc.id === category.id);
                const isPrimary = primaryCategoryId === category.id;
                
                return (
                  <div key={category.id} className="flex items-center justify-between py-3 sm:py-2 border-b last:border-b-0">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id={`category-${category.id}`}
                        checked={isSelected}
                        onChange={(e) => {
                          if (e.target.checked) {
                            const newCategories = [...selectedCategories, { id: category.id, isPrimary: false }];
                            setSelectedCategories(newCategories);
                            if (newCategories.length === 1) {
                              setPrimaryCategoryId(category.id);
                            }
                          } else {
                            setSelectedCategories(prev => prev.filter(sc => sc.id !== category.id));
                            if (isPrimary) {
                              setPrimaryCategoryId(null);
                            }
                          }
                        }}
                        className="rounded border-gray-300 w-4 h-4"
                      />
                      <label htmlFor={`category-${category.id}`} className="text-sm font-medium text-gray-700 cursor-pointer">
                        {category.name}
                      </label>
                    </div>
                    {isSelected && (
                      <div className="flex items-center space-x-2 ml-2">
                        <input
                          type="radio"
                          name="primaryCategory"
                          checked={isPrimary}
                          onChange={() => setPrimaryCategoryId(category.id)}
                          className="text-green-600 w-3 h-3"
                        />
                        <label className="text-xs text-gray-500 whitespace-nowrap">Primary</label>
                      </div>
                    )}
                  </div>
                );
              })}
              {selectedCategories.length === 0 && (
                <div className="text-sm text-red-500 mt-2">Please select at least one category</div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Form and Grade Section */}
      <Card className="shadow-sm border-gray-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg sm:text-xl text-gray-800">Form & Grade</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-2">
              <Label htmlFor="form" className="text-sm font-medium text-gray-700">Form</Label>
              <Select value={formData.form} onValueChange={(value) => setFormData(prev => ({ ...prev, form: value }))}>
                <SelectTrigger className="h-10 text-base">
                  <SelectValue placeholder="Select form" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Powder">Powder</SelectItem>
                  <SelectItem value="Extract">Extract</SelectItem>
                  <SelectItem value="Oil">Oil</SelectItem>
                  <SelectItem value="Whole">Whole</SelectItem>
                  <SelectItem value="Capsule">Capsule</SelectItem>
                  <SelectItem value="Tablet">Tablet</SelectItem>
                  <SelectItem value="Liquid">Liquid</SelectItem>
                  <SelectItem value="Dried">Dried</SelectItem>
                  <SelectItem value="Fresh">Fresh</SelectItem>
                  <SelectItem value="Granules">Granules</SelectItem>
                  <SelectItem value="Flakes">Flakes</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="productGrade" className="text-sm font-medium text-gray-700">Product Grade</Label>
              <Select value={formData.productGrade} onValueChange={(value) => setFormData(prev => ({ ...prev, productGrade: value }))}>
                <SelectTrigger className="h-10 text-base">
                  <SelectValue placeholder="Select product grade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Food Grade">Food Grade</SelectItem>
                  <SelectItem value="Pharma Grade">Pharma Grade</SelectItem>
                  <SelectItem value="Cosmetic Grade">Cosmetic Grade</SelectItem>
                  <SelectItem value="Industrial Grade">Industrial Grade</SelectItem>
                  <SelectItem value="Feed Grade">Feed Grade</SelectItem>
                  <SelectItem value="Nutraceutical Grade">Nutraceutical Grade</SelectItem>
                  <SelectItem value="Export Grade">Export Grade</SelectItem>
                  <SelectItem value="Premium Grade">Premium Grade</SelectItem>
                  <SelectItem value="Standard Grade">Standard Grade</SelectItem>
                  <SelectItem value="Research Grade">Research Grade</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-2">
              <Label htmlFor="hsCode" className="text-sm font-medium text-gray-700">HS Code</Label>
              <Input
                id="hsCode"
                value={formData.hsCode}
                onChange={(e) => setFormData(prev => ({ ...prev, hsCode: e.target.value }))}
                className="h-10 text-base"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Multiple Product Type Selection */}
      <Card className="shadow-sm border-gray-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg sm:text-xl text-gray-800">Product Types *</CardTitle>
          <p className="text-sm text-gray-600">Select one or more product types. One type must be marked as primary and will appear on product cards.</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            
            {/* Selected Product Types Display */}
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2 min-h-[40px] p-2 border rounded-md bg-gray-50">
                {selectedProductTypes.length > 0 ? (
                  selectedProductTypes.map((typeSelection) => {
                    const type = availableProductTypes.find(t => t.id === typeSelection.id);
                    if (!type) return null;
                    return (
                      <Badge 
                        key={type.id} 
                        variant="secondary" 
                        className={`flex items-center gap-1 ${
                          typeSelection.isPrimary 
                            ? 'bg-green-100 text-green-800 border-green-200 ring-2 ring-green-300' 
                            : 'bg-blue-100 text-blue-800 border-blue-200'
                        }`}
                        style={{ backgroundColor: typeSelection.isPrimary ? type.color + '20' : type.color + '10' }}
                      >
                        {typeSelection.isPrimary && <span className="text-xs">★</span>}
                        {type.name}
                        <X 
                          className="h-3 w-3 cursor-pointer hover:text-red-600" 
                          onClick={() => {
                            const newTypes = selectedProductTypes.filter(t => t.id !== type.id);
                            setSelectedProductTypes(newTypes);
                            if (typeSelection.isPrimary && newTypes.length > 0) {
                              // Auto-assign new primary if we removed the primary type
                              const newPrimary = newTypes[0];
                              newPrimary.isPrimary = true;
                              setPrimaryProductTypeId(newPrimary.id);
                              setSelectedProductTypes([...newTypes]);
                            } else if (typeSelection.isPrimary) {
                              setPrimaryProductTypeId(null);
                            }
                          }}
                        />
                      </Badge>
                    );
                  })
                ) : (
                  <span className="text-gray-500 text-sm">No product types selected</span>
                )}
              </div>
              
              {/* Product Type Selection Checkboxes */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Available Product Types:</Label>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded-md p-3 bg-white">
                  {availableProductTypes.length > 0 ? (
                    availableProductTypes.map(type => {
                      const isSelected = selectedProductTypes.some(t => t.id === type.id);
                      const isPrimary = selectedProductTypes.find(t => t.id === type.id)?.isPrimary || false;
                      
                      return (
                        <div key={type.id} className="space-y-1">
                          <div className="flex items-center space-x-2 p-1 hover:bg-gray-50 rounded">
                            <input
                              type="checkbox"
                              id={`producttype-${type.id}`}
                              checked={isSelected}
                              onChange={(e) => {
                                const isChecked = e.target.checked;
                                
                                if (isChecked) {
                                  // Add product type
                                  const newSelection = { id: type.id, isPrimary: selectedProductTypes.length === 0 };
                                  const newTypes = [...selectedProductTypes, newSelection];
                                  setSelectedProductTypes(newTypes);
                                  
                                  if (newSelection.isPrimary) {
                                    setPrimaryProductTypeId(type.id);
                                  }
                                } else {
                                  // Remove product type
                                  const newTypes = selectedProductTypes.filter(t => t.id !== type.id);
                                  setSelectedProductTypes(newTypes);
                                  
                                  if (isPrimary && newTypes.length > 0) {
                                    // Auto-assign new primary
                                    const newPrimary = newTypes[0];
                                    newPrimary.isPrimary = true;
                                    setPrimaryProductTypeId(newPrimary.id);
                                    setSelectedProductTypes([...newTypes]);
                                  } else if (isPrimary) {
                                    setPrimaryProductTypeId(null);
                                  }
                                }
                              }}
                              className="w-4 h-4 text-green-600"
                            />
                            <Label htmlFor={`producttype-${type.id}`} className="text-sm cursor-pointer flex-1">
                              <span style={{ color: type.color }}>{type.name}</span>
                              {isPrimary && <span className="ml-1 text-xs text-green-600">★ Primary</span>}
                            </Label>
                          </div>
                          
                          {/* Primary Type Selection Radio */}
                          {isSelected && (
                            <div className="ml-6 flex items-center space-x-2">
                              <input
                                type="radio"
                                name="primaryProductType"
                                id={`primary-${type.id}`}
                                checked={isPrimary}
                                onChange={() => {
                                  // Update primary type
                                  const newTypes = selectedProductTypes.map(t => ({
                                    ...t,
                                    isPrimary: t.id === type.id
                                  }));
                                  setSelectedProductTypes(newTypes);
                                  setPrimaryProductTypeId(type.id);
                                }}
                                className="w-3 h-3 text-green-600"
                              />
                              <Label htmlFor={`primary-${type.id}`} className="text-xs text-gray-600 cursor-pointer">
                                Set as primary (appears on product cards)
                              </Label>
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <span className="text-gray-500 text-sm col-span-2">Loading product types...</span>
                  )}
                </div>
              </div>
              
              {selectedProductTypes.length > 0 && !primaryProductTypeId && (
                <div className="text-orange-600 text-sm bg-orange-50 p-2 rounded border border-orange-200">
                  ⚠️ Please select a primary product type that will appear on product cards.
                </div>
              )}
            </div>
          </div>

          {/* Multiple Health Support Selection */}
          <div className="border-t pt-4 mt-4">
            <Label className="text-base font-semibold">Health Support Benefits</Label>
            <p className="text-sm text-gray-600 mb-3">Select health benefits this product supports. All benefits are equal in value - no premium options.</p>
            
            {/* Selected Health Supports Display */}
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2 min-h-[40px] p-2 border rounded-md bg-gray-50">
                {selectedHealthSupports.length > 0 ? (
                  selectedHealthSupports.map((hsSelection) => {
                    const healthSupport = availableHealthSupports.find(hs => hs.id === hsSelection.id);
                    if (!healthSupport) return null;
                    return (
                      <Badge 
                        key={healthSupport.id} 
                        variant="secondary" 
                        className={`flex items-center gap-1 ${
                          hsSelection.isPrimary 
                            ? 'bg-green-100 text-green-800 border-green-200 ring-2 ring-green-300' 
                            : 'bg-purple-100 text-purple-800 border-purple-200'
                        }`}
                      >
                        {hsSelection.isPrimary && <span className="text-xs">❤️</span>}
                        {healthSupport.name}
                        <X 
                          className="h-3 w-3 cursor-pointer hover:text-red-600" 
                          onClick={() => {
                            const newHealthSupports = selectedHealthSupports.filter(hs => hs.id !== healthSupport.id);
                            setSelectedHealthSupports(newHealthSupports);
                            if (hsSelection.isPrimary && newHealthSupports.length > 0) {
                              // Auto-assign new primary if we removed the primary health support
                              const newPrimary = newHealthSupports[0];
                              newPrimary.isPrimary = true;
                              setPrimaryHealthSupportId(newPrimary.id);
                              setSelectedHealthSupports([...newHealthSupports]);
                            } else if (hsSelection.isPrimary) {
                              setPrimaryHealthSupportId(null);
                            }
                          }}
                        />
                      </Badge>
                    );
                  })
                ) : (
                  <span className="text-gray-500 text-sm">No health support benefits selected</span>
                )}
              </div>
              
              {/* Health Support Selection Checkboxes */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Available Health Support Benefits:</Label>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded-md p-3 bg-white">
                  {availableHealthSupports.length > 0 ? (
                    availableHealthSupports.map(healthSupport => {
                      const isSelected = selectedHealthSupports.some(hs => hs.id === healthSupport.id);
                      const isPrimary = selectedHealthSupports.find(hs => hs.id === healthSupport.id)?.isPrimary || false;
                      
                      return (
                        <div key={healthSupport.id} className="space-y-1">
                          <div className="flex items-center space-x-2 p-1 hover:bg-gray-50 rounded">
                            <input
                              type="checkbox"
                              id={`healthsupport-${healthSupport.id}`}
                              checked={isSelected}
                              onChange={(e) => {
                                const isChecked = e.target.checked;
                                
                                if (isChecked) {
                                  // Add health support
                                  const newSelection = { id: healthSupport.id, isPrimary: selectedHealthSupports.length === 0 };
                                  const newHealthSupports = [...selectedHealthSupports, newSelection];
                                  setSelectedHealthSupports(newHealthSupports);
                                  
                                  if (newSelection.isPrimary) {
                                    setPrimaryHealthSupportId(healthSupport.id);
                                  }
                                } else {
                                  // Remove health support
                                  const newHealthSupports = selectedHealthSupports.filter(hs => hs.id !== healthSupport.id);
                                  setSelectedHealthSupports(newHealthSupports);
                                  
                                  if (isPrimary && newHealthSupports.length > 0) {
                                    // Auto-assign new primary
                                    const newPrimary = newHealthSupports[0];
                                    newPrimary.isPrimary = true;
                                    setPrimaryHealthSupportId(newPrimary.id);
                                    setSelectedHealthSupports([...newHealthSupports]);
                                  } else if (isPrimary) {
                                    setPrimaryHealthSupportId(null);
                                  }
                                }
                              }}
                              className="w-4 h-4 text-purple-600"
                            />
                            <Label htmlFor={`healthsupport-${healthSupport.id}`} className="text-sm cursor-pointer flex-1">
                              <span className="text-purple-700">{healthSupport.name}</span>
                              {isPrimary && <span className="ml-1 text-xs text-purple-600">❤️ Primary</span>}
                            </Label>
                          </div>
                          
                          {/* Primary Health Support Selection Radio */}
                          {isSelected && (
                            <div className="ml-6 flex items-center space-x-2">
                              <input
                                type="radio"
                                name="primaryHealthSupport"
                                id={`primary-hs-${healthSupport.id}`}
                                checked={isPrimary}
                                onChange={() => {
                                  // Update primary health support
                                  const newHealthSupports = selectedHealthSupports.map(hs => ({
                                    ...hs,
                                    isPrimary: hs.id === healthSupport.id
                                  }));
                                  setSelectedHealthSupports(newHealthSupports);
                                  setPrimaryHealthSupportId(healthSupport.id);
                                }}
                                className="w-3 h-3 text-purple-600"
                              />
                              <Label htmlFor={`primary-hs-${healthSupport.id}`} className="text-xs text-gray-600 cursor-pointer">
                                Set as primary (appears on product cards)
                              </Label>
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <span className="text-gray-500 text-sm col-span-2">Loading health support benefits...</span>
                  )}
                </div>
              </div>
              
              {selectedHealthSupports.length > 0 && !primaryHealthSupportId && (
                <div className="text-orange-600 text-sm bg-orange-50 p-2 rounded border border-orange-200">
                  ⚠️ Please select a primary health support benefit that will appear on product cards.
                </div>
              )}
            </div>
          </div>

          {/* Product Tags */}
          <div className="border-t pt-4 mt-4">
            <Label className="text-base font-semibold">Product Tags / Certifications</Label>
            <p className="text-sm text-gray-600 mb-3">Add certification tags to help customers identify product qualities</p>
            <div className="space-y-3">
              {/* Selected Tags Display */}
              <div className="flex flex-wrap gap-2 min-h-[40px] p-2 border rounded-md bg-gray-50">
                {selectedTags.length > 0 ? (
                  selectedTags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1 bg-green-100 text-green-800 border-green-200">
                      {tag}
                      <X 
                        className="h-3 w-3 cursor-pointer hover:text-red-600" 
                        onClick={() => {
                          const newTags = selectedTags.filter((_, i) => i !== index);
                          setSelectedTags(newTags);
                          setFormData(prev => ({ ...prev, tags: newTags }));
                        }}
                      />
                    </Badge>
                  ))
                ) : (
                  <span className="text-gray-500 text-sm">No tags selected</span>
                )}
              </div>
              
              {/* Tag Selection Checkboxes */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Available Certification Tags:</Label>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded-md p-3 bg-white">
                  {availableTags.length > 0 ? (
                    availableTags.map(tag => (
                      <div key={tag.id} className="flex items-center space-x-2 p-1 hover:bg-gray-50 rounded">
                        <input
                          type="checkbox"
                          id={`tag-${tag.id}`}
                          checked={selectedTags.includes(tag.name)}
                          onChange={(e) => {
                            const isChecked = e.target.checked;
                            console.log('Tag checkbox clicked:', tag.name, isChecked);
                            
                            let newTags;
                            if (isChecked) {
                              // Add tag
                              newTags = [...selectedTags, tag.name];
                            } else {
                              // Remove tag
                              newTags = selectedTags.filter(t => t !== tag.name);
                            }
                            setSelectedTags(newTags);
                            setFormData(prev => ({ ...prev, tags: newTags }));
                          }}
                          className="rounded"
                        />
                        <label htmlFor={`tag-${tag.id}`} className="flex items-center gap-2 cursor-pointer text-sm">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: tag.color }}
                          />
                          {tag.name}
                        </label>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-2 text-center text-gray-500 text-sm py-4">
                      Loading certification tags...
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  Available: {availableTags.length} certification tags | Selected: {selectedTags.length}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stock and Pricing */}
      <Card>
        <CardHeader>
          <CardTitle>Stock and Pricing</CardTitle>
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
              <Label htmlFor="moq">MOQ</Label>
              <Input
                id="moq"
                type="number"
                step="0.01"
                value={formData.moq}
                onChange={(e) => setFormData(prev => ({ ...prev, moq: e.target.value }))}
                placeholder="Minimum order quantity"
              />
            </div>
            <div>
              <Label htmlFor="packingSize">Packing Size</Label>
              <Input
                id="packingSize"
                value={formData.packingSize}
                onChange={(e) => setFormData(prev => ({ ...prev, packingSize: e.target.value }))}
                placeholder="25kg bag, 1kg pouch"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="priceUSD">Price (USD) 💵</Label>
              <Input
                id="priceUSD"
                type="number"
                step="0.01"
                value={formData.priceUSD}
                onChange={(e) => setFormData(prev => ({ ...prev, priceUSD: e.target.value }))}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label htmlFor="priceINR">Price (INR) ₹</Label>
              <Input
                id="priceINR"
                type="number"
                step="0.01"
                value={formData.priceINR}
                onChange={(e) => setFormData(prev => ({ ...prev, priceINR: e.target.value }))}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label htmlFor="priceEUR">Price (EUR) €</Label>
              <Input
                id="priceEUR"
                type="number"
                step="0.01"
                value={formData.priceEUR}
                onChange={(e) => setFormData(prev => ({ ...prev, priceEUR: e.target.value }))}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label htmlFor="priceGBP">Price (GBP) £</Label>
              <Input
                id="priceGBP"
                type="number"
                step="0.01"
                value={formData.priceGBP}
                onChange={(e) => setFormData(prev => ({ ...prev, priceGBP: e.target.value }))}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="priceType">Price Type</Label>
              <Select value={formData.priceType} onValueChange={(value) => setFormData(prev => ({ ...prev, priceType: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select price type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EXW">EXW</SelectItem>
                  <SelectItem value="FOB">FOB</SelectItem>
                  <SelectItem value="CIF">CIF</SelectItem>
                  <SelectItem value="CFR">CFR</SelectItem>
                  <SelectItem value="DDP">DDP</SelectItem>
                  <SelectItem value="DDU">DDU</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="priceLocation">Price Location</Label>
              <Input
                id="priceLocation"
                value={formData.priceLocation}
                onChange={(e) => setFormData(prev => ({ ...prev, priceLocation: e.target.value }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Document Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Product Documents
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-500">Upload certificates, COAs, specifications, and other documents</p>
          
          {/* Company Specific Documents */}
          <div>
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
                    placeholder="Document URL"
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
              </div>
              
              {/* Registration Certificate */}
              <div className="space-y-2">
                <Label htmlFor="registrationCert" className="text-xs font-medium">Registration Certificate</Label>
                <div className="flex gap-2">
                  <Input
                    value={formData.registrationCert}
                    onChange={(e) => setFormData(prev => ({ ...prev, registrationCert: e.target.value }))}
                    placeholder="Document URL"
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
              </div>
            </div>
          </div>
          
          {/* Product Specific Documents */}
          <div>
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
                    placeholder="Document URL"
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
              </div>
              
              {/* Organic Certificate */}
              <div className="space-y-2">
                <Label htmlFor="certDocument" className="text-xs font-medium">Organic Certificate</Label>
                <div className="flex gap-2">
                  <Input
                    value={formData.certDocument}
                    onChange={(e) => setFormData(prev => ({ ...prev, certDocument: e.target.value }))}
                    placeholder="Document URL"
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
              </div>
              
              {/* Specification Document */}
              <div className="space-y-2">
                <Label htmlFor="specDocument" className="text-xs font-medium">Technical Specification Sheet</Label>
                <div className="flex gap-2">
                  <Input
                    value={formData.specDocument}
                    onChange={(e) => setFormData(prev => ({ ...prev, specDocument: e.target.value }))}
                    placeholder="Document URL"
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
              </div>
              
              {/* MSDS Document */}
              <div className="space-y-2">
                <Label htmlFor="msdsDocument" className="text-xs font-medium">MSDS / Safety Data Sheet</Label>
                <div className="flex gap-2">
                  <Input
                    value={formData.msdsDocument}
                    onChange={(e) => setFormData(prev => ({ ...prev, msdsDocument: e.target.value }))}
                    placeholder="Document URL"
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
              </div>
            </div>
          </div>
          
          {/* Certification Documents */}
          <div>
            <h4 className="text-sm font-medium text-gray-800 mb-3">Certification Documents</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Kosher Certificate */}
              <div className="space-y-2">
                <Label htmlFor="kosherCert" className="text-xs font-medium">KOSHER-OK Certificate</Label>
                <div className="flex gap-2">
                  <Input
                    value={formData.kosherCert}
                    onChange={(e) => setFormData(prev => ({ ...prev, kosherCert: e.target.value }))}
                    placeholder="Document URL"
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
              </div>
              
              {/* Organic NOP Certificate */}
              <div className="space-y-2">
                <Label htmlFor="organicNopCert" className="text-xs font-medium">Organic-NOP(USDA) Certificate</Label>
                <div className="flex gap-2">
                  <Input
                    value={formData.organicNopCert}
                    onChange={(e) => setFormData(prev => ({ ...prev, organicNopCert: e.target.value }))}
                    placeholder="Document URL"
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
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* FAQ Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Frequently Asked Questions
          </CardTitle>
          <p className="text-sm text-gray-600">
            Add custom FAQs for this product. If no FAQs are added, default professional FAQs will be displayed.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {(formData.faqs as any[]).map((faq, index) => (
            <div key={index} className="border rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-start">
                <span className="text-sm font-medium text-gray-600">FAQ #{index + 1}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const newFaqs = [...(formData.faqs as any[])];
                    newFaqs.splice(index, 1);
                    setFormData(prev => ({ ...prev, faqs: newFaqs }));
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div>
                <Label htmlFor={`faq-question-${index}`}>Question</Label>
                <Input
                  id={`faq-question-${index}`}
                  value={faq.question}
                  onChange={(e) => {
                    const newFaqs = [...(formData.faqs as any[])];
                    newFaqs[index].question = e.target.value;
                    setFormData(prev => ({ ...prev, faqs: newFaqs }));
                  }}
                  placeholder="Enter the FAQ question"
                />
              </div>
              <div>
                <Label htmlFor={`faq-answer-${index}`}>Answer</Label>
                <Textarea
                  id={`faq-answer-${index}`}
                  value={faq.answer}
                  onChange={(e) => {
                    const newFaqs = [...(formData.faqs as any[])];
                    newFaqs[index].answer = e.target.value;
                    setFormData(prev => ({ ...prev, faqs: newFaqs }));
                  }}
                  placeholder="Enter the FAQ answer"
                  rows={3}
                />
              </div>
            </div>
          ))}
          
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              const newFaqs = [...(formData.faqs as any[]), { question: '', answer: '' }];
              setFormData(prev => ({ ...prev, faqs: newFaqs }));
            }}
            className="w-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add FAQ
          </Button>
          
          {(formData.faqs as any[]).length === 0 && (
            <div className="text-center py-6 border-2 border-dashed border-gray-200 rounded-lg">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm text-gray-500 mb-2">No custom FAQs added</p>
              <p className="text-xs text-gray-400">Default professional FAQs will be displayed on product page</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* SEO Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-4 h-4" />
            SEO & Visibility
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="seoTitle">SEO Title</Label>
            <Input
              id="seoTitle"
              value={formData.seoTitle}
              onChange={(e) => setFormData(prev => ({ ...prev, seoTitle: e.target.value }))}
              placeholder="Optimized title for search engines"
            />
          </div>
          
          <div>
            <Label htmlFor="seoDescription">SEO Description</Label>
            <Textarea
              id="seoDescription"
              value={formData.seoDescription}
              onChange={(e) => setFormData(prev => ({ ...prev, seoDescription: e.target.value }))}
              rows={3}
              placeholder="Meta description for search engines"
            />
          </div>
          
          <div>
            <Label htmlFor="canonicalUrl">Canonical URL</Label>
            <Input
              id="canonicalUrl"
              value={formData.canonicalUrl}
              onChange={(e) => setFormData(prev => ({ ...prev, canonicalUrl: e.target.value }))}
              placeholder="https://example.com/product-name"
            />
          </div>
        </CardContent>
      </Card>

      {/* Status and Visibility */}
      <Card>
        <CardHeader>
          <CardTitle>Status and Visibility</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="leadTime">Lead Time</Label>
              <Input
                id="leadTime"
                value={formData.leadTime}
                onChange={(e) => setFormData(prev => ({ ...prev, leadTime: e.target.value }))}
                placeholder="5-7 days, 2-3 weeks"
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
            <div className="flex items-center space-x-2">
              <Switch
                checked={formData.isOrganic}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isOrganic: checked }))}
              />
              <Label>Organic</Label>
            </div>
          </div>

          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <Switch
                checked={formData.isVisible}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isVisible: checked }))}
              />
              <Label>Visible on Website</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={formData.sampleAvailable}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, sampleAvailable: checked }))}
              />
              <Label>Sample Available</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={formData.stopSell}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, stopSell: checked }))}
              />
              <Label>Stop Sell</Label>
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
          <div>
            <Label htmlFor="internalNotes">Internal Notes (For internal use only)</Label>
            <Textarea
              id="internalNotes"
              value={formData.internalNotes}
              onChange={(e) => setFormData(prev => ({ ...prev, internalNotes: e.target.value }))}
              rows={3}
              placeholder="Internal notes for team members..."
            />
          </div>
        </CardContent>
      </Card>
      
      <div className="flex items-center justify-between pt-4">
        {onClose && (
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
        )}
        <Button type="submit" className="flex-1 ml-4" disabled={isLoading || uploading}>
          {isLoading ? "Saving..." : uploading ? "Uploading..." : product ? "Update Product" : "Create Product"}
        </Button>
      </div>
    </form>
  );
}