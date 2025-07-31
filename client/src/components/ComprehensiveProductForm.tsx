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
import type { Product, Category } from "@shared/schema";

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
      healthSupport: formData.healthSupport || undefined,
      hsCode: formData.hsCode || undefined,
      productGrade: formData.productGrade || undefined,
      form: formData.form || undefined,
      leadTime: formData.leadTime || undefined,
      
      // Ensure arrays are properly formatted
      certifications: Array.isArray(formData.certifications) ? formData.certifications : [],
      galleryImages: Array.isArray(formData.galleryImages) ? formData.galleryImages.filter(img => img.trim() !== '') : [],
      faqs: Array.isArray(formData.faqs) ? (formData.faqs as any[]).filter(faq => faq.question.trim() !== '' && faq.answer.trim() !== '') : [],
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
    <form onSubmit={handleSubmit} className="space-y-6 max-h-[80vh] overflow-y-auto">
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
              <Label htmlFor="productId">Product ID</Label>
              <Input
                id="productId"
                value={formData.productId}
                onChange={(e) => setFormData(prev => ({ ...prev, productId: e.target.value }))}
                placeholder="Auto-generated if left empty"
              />
            </div>
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

          {/* Gallery Images - Multi-Upload */}
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
                            formDataUpload.append('galleryImages', file);
                            if (formData.name) {
                              formDataUpload.append('productId', formData.name.replace(/[^a-zA-Z0-9]/g, ''));
                            }

                            const response = await fetch('/api/admin/products/upload', {
                              method: 'POST',
                              body: formDataUpload,
                            });

                            if (!response.ok) throw new Error('Upload failed');

                            const result = await response.json();
                            const imageUrl = result.files.galleryImages;
                            
                            if (imageUrl) {
                              setFormData(prev => ({
                                ...prev,
                                galleryImages: [...(Array.isArray(prev.galleryImages) ? prev.galleryImages : []), imageUrl]
                              }));
                            }
                          }
                          toast({
                            title: "Success",
                            description: `${files.length} images uploaded successfully`,
                          });
                        } catch (error) {
                          toast({
                            title: "Upload Error",
                            description: "Failed to upload images",
                            variant: "destructive",
                          });
                        } finally {
                          setUploading(false);
                        }
                      }
                    }}
                    disabled={uploading}
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    JPG, PNG, WebP up to 10MB each. Multiple files supported.
                  </p>
                </div>
              </div>

              {/* Gallery Preview */}
              {Array.isArray(formData.galleryImages) && formData.galleryImages.length > 0 && (
                <div className="grid grid-cols-4 gap-2">
                  {formData.galleryImages.map((image: string, index: number) => (
                    <div key={index} className="relative group">
                      <img
                        src={image}
                        alt={`Gallery ${index + 1}`}
                        className="w-full h-20 object-cover rounded border"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            galleryImages: Array.isArray(prev.galleryImages) 
                              ? prev.galleryImages.filter((_: any, i: number) => i !== index) 
                              : []
                          }));
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Product Classification */}
      <Card>
        <CardHeader>
          <CardTitle>Product Classification</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="origin">Origin</Label>
              <Select value={formData.origin} onValueChange={(value) => setFormData(prev => ({ ...prev, origin: value }))}>
                <SelectTrigger>
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
            <div>
              <Label htmlFor="healthSupport">Health Support</Label>
              <Select value={formData.healthSupport} onValueChange={(value) => setFormData(prev => ({ ...prev, healthSupport: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select health support" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Antioxidant">Antioxidant</SelectItem>
                  <SelectItem value="Digestive Support">Digestive Support</SelectItem>
                  <SelectItem value="Immune Support">Immune Support</SelectItem>
                  <SelectItem value="Anti-inflammatory">Anti-inflammatory</SelectItem>
                  <SelectItem value="Cardiovascular Support">Cardiovascular Support</SelectItem>
                  <SelectItem value="Cognitive Support">Cognitive Support</SelectItem>
                  <SelectItem value="Energy & Vitality">Energy & Vitality</SelectItem>
                  <SelectItem value="Respiratory Support">Respiratory Support</SelectItem>
                  <SelectItem value="Joint & Bone Health">Joint & Bone Health</SelectItem>
                  <SelectItem value="Skin Health">Skin Health</SelectItem>
                  <SelectItem value="Weight Management">Weight Management</SelectItem>
                  <SelectItem value="Detoxification">Detoxification</SelectItem>
                  <SelectItem value="Hormonal Balance">Hormonal Balance</SelectItem>
                  <SelectItem value="Sleep Support">Sleep Support</SelectItem>
                  <SelectItem value="Stress & Mood Support">Stress & Mood Support</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="categoryId">Category *</Label>
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
              <Label htmlFor="form">Form</Label>
              <Select value={formData.form} onValueChange={(value) => setFormData(prev => ({ ...prev, form: value }))}>
                <SelectTrigger>
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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="hsCode">HS Code</Label>
              <Input
                id="hsCode"
                value={formData.hsCode}
                onChange={(e) => setFormData(prev => ({ ...prev, hsCode: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="productGrade">Product Grade</Label>
              <Input
                id="productGrade"
                value={formData.productGrade}
                onChange={(e) => setFormData(prev => ({ ...prev, productGrade: e.target.value }))}
                placeholder="Food Grade, Pharma Grade, etc."
              />
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="priceUSD">Price (USD)</Label>
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
              <Label htmlFor="priceINR">Price (INR)</Label>
              <Input
                id="priceINR"
                type="number"
                step="0.01"
                value={formData.priceINR}
                onChange={(e) => setFormData(prev => ({ ...prev, priceINR: e.target.value }))}
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