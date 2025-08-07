import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import ProductFAQs from "@/components/ProductFAQs";
import OptimizedImage from "@/components/OptimizedImage";
import ImagePreloader from "@/components/ImagePreloader";
import { useAuth } from "@/hooks/useAuth";
import { useCustomerAuth } from "@/hooks/useCustomerAuth";
import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import InquiryForm from "@/components/InquiryForm";
import QuantityPricing from "@/components/QuantityPricing";
import { EnhancedInquiryForm } from "@/components/EnhancedInquiryForm";
import { SampleRequestForm } from "@/components/SampleRequestForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Shield, 
  Leaf, 
  Award, 
  Download, 
  Heart, 
  Share2, 
  MessageSquare,
  MessageSquarePlus, 
  Copy,
  Eye,
  FileText,
  CheckCircle,
  Package,
  Truck,
  Star,
  Users,
  Globe,
  Beaker,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { LocationBasedPricing } from "@/components/LocationBasedPricing";
import StructuredData from "@/components/StructuredData";
import { testStructuredData } from "@/utils/seoTestUtil";
import FrequentlyBoughtTogether from "@/components/FrequentlyBoughtTogether";
import RelatedProductsCarousel from "@/components/RelatedProductsCarousel";
import PopularProducts from "@/components/PopularProducts";
import type { Product, ProductDocument } from "@shared/schema";

export default function ProductDetailBFI() {
  console.log("ProductDetailBFI component starting to render...");
  const { slug } = useParams();
  console.log("Product slug from URL:", slug);
  
  const { user, isAuthenticated } = useAuth() as { user: any; isAuthenticated: boolean };
  const { customer, isCustomerAuthenticated } = useCustomerAuth();
  const { toast } = useToast();
  const [selectedQuantity, setSelectedQuantity] = useState(25);
  const [totalPrice, setTotalPrice] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const { data: product, isLoading, error } = useQuery<Product>({
    queryKey: ["/api/products/slug", slug],
    queryFn: async () => {
      console.log("Fetching product for slug:", slug);
      const response = await fetch(`/api/products/slug/${slug}`);
      if (!response.ok) throw new Error('Product not found');
      const data = await response.json();
      console.log("Product data received:", data);
      return data;
    },
    enabled: !!slug,
  });

  const { data: documents } = useQuery<ProductDocument[]>({
    queryKey: ["/api/products", product?.id, "documents"],
    enabled: !!product?.id,
  });

  const { data: faqs } = useQuery<{ question: string; answer: string; }[]>({
    queryKey: ["/api/products", product?.id, "faqs"],
    enabled: !!product?.id,
  });

  const handleQuantityChange = (quantity: number, price: number, discountPercent: number) => {
    setSelectedQuantity(quantity);
    setTotalPrice(price);
    setDiscount(discountPercent);
  };

  // Create gallery images array with database imageUrl and galleryImages
  const getAllImages = () => {
    if (!product) return [];
    
    const images = [];
    
    // Add main image - prioritize WebP fields over legacy fields
    const mainImage = product.mainImageMedium || product.mainImageLarge || product.mainImage;
    if (mainImage) {
      images.push(mainImage);
    }
    
    // Add gallery images if they exist and are not duplicates of main image
    if (product.galleryImages && Array.isArray(product.galleryImages)) {
      const mainImg = product.mainImageMedium || product.mainImageLarge || product.mainImage;
      const galleryImages = product.galleryImages.filter((img: string) => 
        img && img.trim() !== '' && img !== mainImg
      );
      images.push(...galleryImages);
    }
    
    return images;
  };

  const allImages = getAllImages();
  const currentImage = allImages.length > 0 ? allImages[currentImageIndex] : null;

  // Auto-advance carousel every 3 seconds
  useEffect(() => {
    if (allImages.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => 
        prevIndex === allImages.length - 1 ? 0 : prevIndex + 1
      );
    }, 3000);

    return () => clearInterval(interval);
  }, [allImages.length]);

  const goToImage = (index: number) => {
    setCurrentImageIndex(index);
  };

  const nextImage = () => {
    setCurrentImageIndex((prevIndex) => 
      prevIndex === allImages.length - 1 ? 0 : prevIndex + 1
    );
  };

  const previousImage = () => {
    setCurrentImageIndex((prevIndex) => 
      prevIndex === 0 ? allImages.length - 1 : prevIndex - 1
    );
  };

  const copyProductName = () => {
    if (product) {
      navigator.clipboard.writeText(product.name);
      toast({ title: "Product name copied to clipboard!" });
    }
  };

  // Update page meta tags for SEO and test structured data
  useEffect(() => {
    if (product) {
      // Update page title if not already set by server
      if (document.title === 'Vite + React + TS') {
        document.title = product.seoTitle || `${product.name} - BFI Organic`;
      }
      
      // Update meta description if not already set by server
      let metaDescription = document.querySelector('meta[name="description"]');
      if (!metaDescription || metaDescription.getAttribute('content') === '') {
        if (!metaDescription) {
          metaDescription = document.createElement('meta');
          metaDescription.setAttribute('name', 'description');
          document.head.appendChild(metaDescription);
        }
        metaDescription.setAttribute('content', product.seoDescription || product.description || `High-quality ${product.name} from BFI Organic`);
      }
      
      // Test structured data after component mounts (development only)
      if (import.meta.env.DEV) {
        setTimeout(() => {
          console.log('Testing structured data for product:', product.name);
          testStructuredData();
        }, 1000);
      }
    }
  }, [product]);

  console.log("ProductDetailBFI render state:", { isLoading, hasProduct: !!product, error, slug });

  if (isLoading) {
    console.log("Showing loading state for slug:", slug);
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="grid lg:grid-cols-2 gap-8">
              <div className="h-96 bg-gray-200 rounded-xl"></div>
              <div className="space-y-4">
                <div className="h-6 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    console.error("Error loading product:", error);
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Error Loading Product</h1>
            <p className="text-gray-600">Could not load product: {slug}</p>
            <p className="text-sm text-gray-500 mt-2">Error: {error?.message}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-4 px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    console.log("No product found for slug:", slug);
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h1>
            <p className="text-gray-600">The product you're looking for doesn't exist: {slug}</p>
          </div>
        </div>
      </div>
    );
  }

  console.log("Rendering product page for:", product.name);



  return (
    <div className="min-h-screen bg-background">
      {/* Structured Data for SEO */}
      <StructuredData product={product} faqs={faqs} />
      <Header />
      
      <div className="container mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <nav className="mb-6 text-sm text-gray-600">
          <span>Home</span> / <span>Products</span> / <span className="text-gray-900">{product.name}</span>
        </nav>

        {/* Preload product images for better performance */}
        <ImagePreloader imageUrls={allImages} priority={true} />
        
        <div className="grid lg:grid-cols-12 gap-8 mb-8">
          {/* Left Column - Product Image & Documents */}
          <div className="lg:col-span-4">
            {/* Product Image Carousel */}
            <div className="sticky top-4">
              <div className="relative mb-6 bg-white rounded-lg shadow-sm overflow-hidden group">
                {currentImage ? (
                  <div className="relative">
                    <OptimizedImage
                      src={currentImage}
                      alt={`${product.name} - Image ${currentImageIndex + 1}`}
                      className="w-full aspect-square object-cover"
                      priority={currentImageIndex === 0} // Prioritize first image
                      lazy={false} // Don't lazy load main product images
                      placeholder={
                        <div className="w-full aspect-square flex items-center justify-center bg-gray-100 text-gray-400 animate-pulse">
                          <div className="text-center">
                            <div className="text-4xl mb-3">📷</div>
                            <div className="text-lg font-medium">Loading Image...</div>
                          </div>
                        </div>
                      }
                    />
                    
                    {/* Navigation Arrows - Only show if multiple images */}
                    {allImages.length > 1 && (
                      <>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="absolute left-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 hover:bg-white"
                          onClick={previousImage}
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 hover:bg-white"
                          onClick={nextImage}
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                        
                        {/* Image Counter */}
                        <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded">
                          {currentImageIndex + 1} / {allImages.length}
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="w-full aspect-square flex items-center justify-center bg-gray-100 text-gray-400">
                    <div className="text-center">
                      <div className="text-4xl mb-3">📷</div>
                      <div className="text-lg font-medium">No Preview Available</div>
                    </div>
                  </div>
                )}
                
                {product.productType && (
                  <Badge className="absolute top-4 left-4 bg-green-600">
                    <Leaf className="w-3 h-3 mr-1" />
                    {product.productType === 'organic' ? 'Organic' :
                     product.productType === 'natural' ? 'Natural' :
                     product.productType === 'conventional' ? 'Conventional' :
                     product.productType === 'synthetic' ? 'Synthetic' :
                     product.productType === 'nature_identical' ? 'Nature Identical' :
                     product.productType === 'other' ? 'Other' : 
                     'Organic'}
                  </Badge>
                )}
              </div>
              
              {/* Image Thumbnails - Only show if multiple images */}
              {allImages.length > 1 && (
                <div className="flex gap-2 mb-6 overflow-x-auto">
                  {allImages.map((image, index) => (
                    <button
                      key={index}
                      className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                        index === currentImageIndex 
                          ? 'border-orange-500 ring-2 ring-orange-200' 
                          : 'border-gray-200 hover:border-orange-300'
                      }`}
                      onClick={() => goToImage(index)}
                    >
                      <OptimizedImage
                        src={image}
                        alt={`${product.name} - Thumbnail ${index + 1}`}
                        className="w-full h-full object-cover"
                        lazy={true}
                        placeholder={
                          <div className="w-full h-full bg-gray-100 animate-pulse flex items-center justify-center">
                            <div className="text-xs text-gray-400">📷</div>
                          </div>
                        }
                      />
                    </button>
                  ))}
                </div>
              )}

              {/* Document Downloads */}
              <Card className="mb-6">
                <CardHeader className="pb-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg">
                  <CardTitle className="text-base font-semibold text-blue-900 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    All Product Documents
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {!isAuthenticated && !isCustomerAuthenticated ? (
                    <div className="text-center py-4 bg-gray-50 rounded">
                      <p className="text-sm text-gray-600 mb-3">You must log in to view documents</p>
                      <Button size="sm" onClick={() => window.location.href = '/login'}>
                        Log in
                      </Button>
                    </div>
                  ) : (
                    <>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full justify-start"
                        onClick={() => {
                          const allDocs = [
                            product.businessLicense,
                            product.registrationCert,
                            product.kosherCert,
                            product.organicNopCert,
                            product.coaDocument,
                            product.specDocument,
                            product.msdsDocument,
                            product.nonGmoDocument,
                            ...(product.additionalDocs && Array.isArray(product.additionalDocs) ? product.additionalDocs : [])
                          ].filter(Boolean);
                          
                          if (allDocs.length === 0) {
                            toast({
                              title: "No Documents",
                              description: "No documents are available for this product",
                              variant: "destructive"
                            });
                            return;
                          }
                          
                          allDocs.forEach(url => window.open(url, '_blank'));
                        }}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download All ({[
                          product.businessLicense,
                          product.registrationCert,
                          product.kosherCert,
                          product.organicNopCert,
                          product.coaDocument,
                          product.specDocument,
                          product.msdsDocument,
                          product.nonGmoDocument,
                          ...(product.additionalDocs && Array.isArray(product.additionalDocs) ? product.additionalDocs : [])
                        ].filter(Boolean).length})
                      </Button>
                      <Separator />
                      
                      {/* Company Documents */}
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-gray-700 mb-2">Company Specific Documents</p>
                        {[
                          { name: 'Business License', url: product.businessLicense },
                          { name: 'Certificate of Registration', url: product.registrationCert },
                          { name: 'KOSHER-OK', url: product.kosherCert },
                          { name: 'Organic-NOP(USDA)', url: product.organicNopCert }
                        ].map((doc) => (
                          <Button 
                            key={doc.name} 
                            variant="ghost" 
                            size="sm" 
                            className={`w-full justify-start text-xs h-8 ${!doc.url ? 'opacity-50 cursor-not-allowed' : ''}`}
                            onClick={() => doc.url ? window.open(doc.url, '_blank') : null}
                            disabled={!doc.url}
                          >
                            <FileText className="w-3 h-3 mr-2" />
                            {doc.name} 
                            <span className={`ml-auto ${doc.url ? 'text-blue-600' : 'text-gray-400'}`}>
                              {doc.url ? 'Download PDF' : 'Not Available'}
                            </span>
                          </Button>
                        ))}
                      </div>

                      <Separator />
                      
                      {/* Product Documents */}
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-gray-700 mb-2">Product Specific Documents</p>
                        {[
                          { name: 'COA Document', url: product.coaDocument },
                          { name: 'Specification Sheet', url: product.specDocument },
                          { name: 'MSDS Documents', url: product.msdsDocument },
                          { name: 'Non GMO Statement', url: product.nonGmoDocument }
                        ].map((doc) => (
                          <Button 
                            key={doc.name} 
                            variant="ghost" 
                            size="sm" 
                            className={`w-full justify-start text-xs h-8 ${!doc.url ? 'opacity-50 cursor-not-allowed' : ''}`}
                            onClick={() => doc.url ? window.open(doc.url, '_blank') : null}
                            disabled={!doc.url}
                          >
                            <FileText className="w-3 h-3 mr-2" />
                            {doc.name} 
                            <span className={`ml-auto ${doc.url ? 'text-blue-600' : 'text-gray-400'}`}>
                              {doc.url ? 'Download PDF' : 'Not Available'}
                            </span>
                          </Button>
                        ))}
                        {/* Additional Documents */}
                        {product.additionalDocs && Array.isArray(product.additionalDocs) && (product.additionalDocs as string[]).length > 0 && (
                          (product.additionalDocs as string[]).map((docUrl: string, index: number) => (
                            <Button 
                              key={`additional-${index}`} 
                              variant="ghost" 
                              size="sm" 
                              className="w-full justify-start text-xs h-8"
                              onClick={() => window.open(docUrl, '_blank')}
                            >
                              <FileText className="w-3 h-3 mr-2" />
                              Additional Document {index + 1} <span className="text-blue-600 ml-auto">Download PDF</span>
                            </Button>
                          ))
                        )}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>


            </div>
          </div>

          {/* Middle Column - Product Info */}
          <div className="lg:col-span-4">
            {/* Product Title & Basic Info */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                {product.name}
                <Button variant="ghost" size="sm" onClick={copyProductName} className="p-1">
                  <Copy className="w-4 h-4" />
                </Button>
              </h1>
              <p className="text-gray-600 mb-4">SKU#: {product.productId}</p>

              {/* Certifications & Tags */}
              <div className="flex flex-wrap gap-2 mb-4">
                {/* Display certifications */}
                {product.certifications && Array.isArray(product.certifications) && (product.certifications as string[]).map((cert: string, index: number) => (
                  <Badge key={`cert-${index}`} variant="outline" className="text-xs">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    {cert}
                  </Badge>
                ))}
                {/* Display tags */}
                {product.tags && Array.isArray(product.tags) && product.tags.length > 0 && product.tags.map((tag: string, index: number) => (
                  <Badge key={`tag-${index}`} variant="secondary" className="text-xs bg-green-100 text-green-800 border-green-200">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    {tag}
                  </Badge>
                ))}
              </div>

              {/* Multi-Currency Pricing Display */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <LocationBasedPricing 
                  product={product} 
                  showCurrencySelector={false}
                  isAdminView={false}
                  className="mb-2"
                />
                {product.moq && (
                  <div className="text-sm text-gray-600 mt-2">
                    MOQ: {product.moq} {product.stockUnit || 'kg'} | Lead Time: {product.leadTime || 'Contact us'}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 mb-6">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="bg-orange-600 hover:bg-orange-700 text-white">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Request Quote
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
                    <DialogHeader>
                      <DialogTitle>Request Quote for {product.name}</DialogTitle>
                    </DialogHeader>
                    <div className="flex-1 overflow-y-auto">
                      <InquiryForm 
                        product={product} 
                        customerData={customer}
                        isCustomerAuthenticated={isCustomerAuthenticated}
                      />
                    </div>
                  </DialogContent>
                </Dialog>

                <Button variant="outline" size="default">
                  <Heart className="w-4 h-4 mr-2" />
                  Wishlist
                </Button>

                <Button variant="outline" size="default">
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
              </div>

              {/* Enhanced Inquiry Form */}
              <Card className="bg-blue-50 border-blue-200 mb-6">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-sm text-blue-900">Bid for High Volume?</h4>
                    <MessageSquare className="w-4 h-4 text-blue-600" />
                  </div>
                  <EnhancedInquiryForm 
                    product={product as Product} 
                    isAuthenticated={isAuthenticated}
                    customerData={customer}
                    isCustomerAuthenticated={isCustomerAuthenticated}
                  />
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Right Column - Pricing & Order */}
          <div className="lg:col-span-4">
            <div className="sticky top-4">
              <QuantityPricing 
                product={product} 
                onQuantityChange={handleQuantityChange}
              />
            </div>
          </div>

          {/* Sample Request Section - Spans Middle and Right Columns */}
          <div className="lg:col-span-8 lg:col-start-5 mb-6">
            <Card className="w-full max-w-none bg-gradient-to-r from-orange-50 to-yellow-50 border-orange-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                      <Beaker className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Request a Free Sample</h3>
                      <p className="text-sm text-gray-600">
                        Get a free sample to test quality before placing bulk orders
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-xs text-gray-500">Sample Size</div>
                      <div className="font-medium text-sm">25-100g</div>
                    </div>
                    <SampleRequestForm 
                      product={product} 
                      isAuthenticated={isAuthenticated || isCustomerAuthenticated}
                      customerData={customer}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Product Information Tabs Section - Spans Middle and Right Columns */}
          <div className="lg:col-span-8 lg:col-start-5 -mt-4">
            <Card className="w-full max-w-none">
              <CardHeader className="pb-3 bg-gradient-to-r from-orange-50 to-amber-50 rounded-t-lg">
                <CardTitle className="text-lg text-orange-900 flex items-center gap-2">
                  <Package className="w-5 h-5 text-orange-600" />
                  Product Information
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Tabs defaultValue="description" className="w-full">
                  <TabsList className="grid w-full grid-cols-4 mb-0 rounded-none border-b bg-gray-50">
                    <TabsTrigger value="description" className="text-xs px-2 py-3 data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-orange-500">Description</TabsTrigger>
                    <TabsTrigger value="spec" className="text-xs px-2 py-3 data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-orange-500">Product Spec</TabsTrigger>
                    <TabsTrigger value="faqs" className="text-xs px-2 py-3 data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-orange-500">FAQs</TabsTrigger>
                    <TabsTrigger value="vendors" className="text-xs px-2 py-3 data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-orange-500">Other Vendors</TabsTrigger>
                  </TabsList>

                  <TabsContent value="spec" className="m-0 p-4 space-y-4">
                    <div className="w-full">
                      {/* Check if HTML specification sheet exists */}
                      {!product.specificationSheet || product.specificationSheet.trim() === '' ? (
                        <div className="text-center py-8">
                          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <FileText className="w-6 h-6 text-gray-400" />
                          </div>
                          <h3 className="font-semibold text-gray-900 mb-2">No Specifications Available</h3>
                          <p className="text-gray-600 text-sm">
                            Product specifications have not been uploaded yet. Please contact us for detailed product information.
                          </p>
                        </div>
                      ) : (
                        <div 
                          className="prose prose-sm max-w-none w-full"
                          dangerouslySetInnerHTML={{ __html: product.specificationSheet }}
                        />
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="description" className="m-0 p-4 space-y-4">
                    <div className="prose prose-sm max-w-none w-full">
                      {product.description ? (
                        <div className="space-y-4">
                          <div 
                            className="text-gray-700 text-sm leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: product.description.replace(/\n/g, '<br />') }}
                          />
                          


                          {/* Certifications & Tags Display */}
                          {((product.certifications && (product.certifications as string[]).length > 0) || ((product as any).tags && ((product as any).tags as string[]).length > 0)) && (
                            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                <Shield className="w-4 h-4" />
                                Certifications & Quality Standards
                              </h4>
                              <div className="flex flex-wrap gap-2">
                                {/* Display certifications */}
                                {product.certifications && (product.certifications as string[]).map((cert: string, index: number) => (
                                  <Badge key={`cert-detail-${index}`} variant="outline" className="text-xs bg-white">
                                    <CheckCircle className="w-3 h-3 mr-1 text-green-600" />
                                    {cert}
                                  </Badge>
                                ))}
                                {/* Display tags */}
                                {(product as any).tags && ((product as any).tags as string[]).map((tag: string, index: number) => (
                                  <Badge key={`tag-detail-${index}`} variant="secondary" className="text-xs bg-green-100 text-green-800 border-green-200">
                                    <CheckCircle className="w-3 h-3 mr-1 text-green-600" />
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <FileText className="w-6 h-6 text-gray-400" />
                          </div>
                          <h3 className="font-semibold text-gray-900 mb-2">No Description Available</h3>
                          <p className="text-gray-600 text-sm">
                            Product description has not been added yet. Please contact us for detailed product information.
                          </p>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="faqs" className="m-0 p-4 space-y-4">
                    <ProductFAQs productId={product.id} />
                  </TabsContent>

                  <TabsContent value="vendors" className="m-0 p-4 space-y-4">
                    <div className="text-center py-8 w-full">
                      <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <h3 className="font-semibold text-gray-900 mb-2">Alternative Suppliers</h3>
                      <p className="text-gray-600 text-sm mb-4">
                        Compare prices and specifications from other verified suppliers
                      </p>
                      <Button variant="outline" size="sm">
                        <Globe className="w-4 h-4 mr-2" />
                        View Other Suppliers
                      </Button>
                      <p className="text-gray-500 text-xs mt-3">
                        Feature coming soon - Compare multiple suppliers for the best deals
                      </p>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Tell Us Your Requirement Form - Enhanced with Contact Info */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MessageSquarePlus className="w-5 h-5 text-orange-600" />
                  Tell Us Your Requirement
                </CardTitle>
                <p className="text-sm text-gray-600">
                  Submit your detailed inquiry with contact information for personalized assistance
                </p>
              </CardHeader>
              <CardContent>
                <EnhancedInquiryForm 
                  product={product as Product} 
                  isAuthenticated={isAuthenticated || isCustomerAuthenticated}
                  customerData={customer}
                />
              </CardContent>
            </Card>

          </div>
        </div>
        
        {/* Frequently Bought Together Section */}
        <FrequentlyBoughtTogether 
          productId={product.id} 
          currentProduct={product}
          className="mt-8"
        />
        
        {/* Related Products Carousel */}
        <RelatedProductsCarousel 
          productId={product.id}
          categoryId={product.categoryId}
          title="You Might Also Like"
          className="mt-8"
        />
        
        {/* Popular Products */}
        <PopularProducts 
          title="Popular Products"
          className="mt-8"
        />
      </div>
      <Footer />
    </div>
  );
}