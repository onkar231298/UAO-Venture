import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Package, 
  Heart, 
  MessageSquarePlus, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle, 
  FileText,
  Download,
  Share2,
  Globe,
  Leaf,
  Award,
  Shield,
  Truck,
  Clock,
  MapPin,
  ExternalLink
} from "lucide-react";
import Header from "@/components/Header";
import { LocationBasedPricing } from "@/components/LocationBasedPricing";
import { EnhancedInquiryForm } from "@/components/EnhancedInquiryForm";
import { useAuth } from "@/hooks/useAuth";
import { useCustomerAuth } from "@/hooks/useCustomerAuth";

export default function ProductDetail() {
  const { slug } = useParams();
  const [location] = useLocation();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const { isAuthenticated } = useAuth();
  const { isAuthenticated: isCustomerAuthenticated, customer } = useCustomerAuth();

  const { data: product, isLoading, error } = useQuery({
    queryKey: [`/api/products/slug/${slug}`],
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="aspect-square bg-gray-200 rounded-lg animate-pulse"></div>
            <div className="space-y-4">
              <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-6 bg-gray-200 rounded animate-pulse w-3/4"></div>
              <div className="h-32 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-12 text-center">
          <Package className="w-24 h-24 mx-auto mb-6 text-gray-400" />
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Product Not Found</h1>
          <p className="text-gray-600 mb-8">The product you're looking for doesn't exist or has been removed.</p>
          <Button onClick={() => window.history.back()}>Go Back</Button>
        </div>
      </div>
    );
  }

  const allImages = [
    ...(product.mainImage ? [product.mainImage] : []),
    ...(product.galleryImages || []),
  ].filter(Boolean);

  const currentImage = allImages[currentImageIndex];

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
  };

  const previousImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  };

  const specifications = [
    { label: "Product ID", value: product.productId },
    { label: "Origin", value: product.origin },
    { label: "Form", value: product.form },
    { label: "Botanical Name", value: product.botanicalName },
    { label: "HSN Code", value: product.hsnCode },
    { label: "CAS Number", value: product.casNumber },
    { label: "Shelf Life", value: product.shelfLife },
    { label: "Mesh Size", value: product.meshSize },
    { label: "Moisture Content", value: product.moistureContent },
    { label: "Total Ash", value: product.totalAsh },
    { label: "Acid Insoluble Ash", value: product.acidInsolubleAsh },
    { label: "Bulk Density", value: product.bulkDensity },
    { label: "Tapped Density", value: product.tappedDensity },
    { label: "pH Level", value: product.phLevel },
    { label: "Lead Content", value: product.leadContent },
    { label: "Arsenic Content", value: product.arsenicContent },
    { label: "Cadmium Content", value: product.cadmiumContent },
    { label: "Mercury Content", value: product.mercuryContent },
    { label: "Pesticide Residue", value: product.pesticideResidue },
    { label: "Microbiological Count", value: product.microbiologicalCount },
    { label: "Salmonella", value: product.salmonella },
    { label: "E.Coli", value: product.eColi },
    { label: "Yeast & Mold", value: product.yeastMold },
    { label: "Color", value: product.color },
    { label: "Odor", value: product.odor },
    { label: "Taste", value: product.taste },
    { label: "Texture", value: product.texture },
    { label: "Solubility", value: product.solubility },
    { label: "Extract Ratio", value: product.extractRatio },
    { label: "Active Compounds", value: product.activeCompounds },
    { label: "Processing Method", value: product.processingMethod },
    { label: "Storage Temperature", value: product.storageTemperature },
    { label: "Storage Humidity", value: product.storageHumidity },
    { label: "Storage Instructions", value: product.storageInstructions }
  ].filter(spec => spec.value);

  const documents = [
    { name: "Certificate of Analysis", url: product.coaUrl, icon: <FileText className="w-4 h-4" /> },
    { name: "MSDS Document", url: product.msdsUrl, icon: <Shield className="w-4 h-4" /> },
    { name: "Specification Sheet", url: product.specSheetUrl, icon: <FileText className="w-4 h-4" /> },
    { name: "Third Party Certificate", url: product.thirdPartyCertUrl, icon: <Award className="w-4 h-4" /> }
  ].filter(doc => doc.url);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Mobile Breadcrumb - Mobile Only */}
      <div className="lg:hidden bg-white border-b px-4 py-2 text-sm">
        <div className="flex items-center space-x-2 text-gray-600">
          <span>Products</span>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-900 font-medium line-clamp-1">{product.name}</span>
        </div>
      </div>

      <div className="container mx-auto px-4 py-4 lg:py-8 pb-20 lg:pb-8">
        {/* Desktop Breadcrumb - Desktop Only */}
        <nav className="hidden lg:flex items-center space-x-2 text-sm text-gray-600 mb-6">
          <a href="/" className="hover:text-orange-600">Home</a>
          <ChevronRight className="w-4 h-4" />
          <a href="/products" className="hover:text-orange-600">Products</a>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-900 font-medium">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12">
          {/* Product Images Section */}
          <div className="space-y-4">
            <div className="relative bg-white rounded-lg overflow-hidden shadow-sm">
              {currentImage ? (
                <div className="relative">
                  <img
                    src={currentImage}
                    alt={`${product.name}`}
                    className="w-full aspect-square object-cover"
                  />
                  
                  {allImages.length > 1 && (
                    <>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white shadow-lg h-10 w-10 p-0 rounded-full"
                        onClick={previousImage}
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white shadow-lg h-10 w-10 p-0 rounded-full"
                        onClick={nextImage}
                      >
                        <ChevronRight className="w-5 h-5" />
                      </Button>
                      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 text-white text-sm px-3 py-1 rounded-full">
                        {currentImageIndex + 1} / {allImages.length}
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="w-full aspect-square flex items-center justify-center bg-gradient-to-br from-orange-50 to-orange-100">
                  <div className="text-center p-8">
                    <div className="w-20 h-20 mx-auto mb-4 bg-orange-200 rounded-full flex items-center justify-center">
                      <Package className="w-10 h-10 text-orange-600" />
                    </div>
                    <div className="text-xl font-semibold text-orange-800 mb-2">{product.name}</div>
                    <div className="text-sm text-orange-600">Premium Quality Product</div>
                  </div>
                </div>
              )}
              
              {/* Product Badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                {product.productType && (
                  <Badge className="bg-green-600 text-white">
                    <Leaf className="w-3 h-3 mr-1" />
                    {product.productType === 'organic' ? 'Organic' : 'Premium'}
                  </Badge>
                )}
                {product.inStock && (
                  <Badge variant="outline" className="bg-white/90 text-green-700 border-green-200">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    In Stock
                  </Badge>
                )}
              </div>

              {/* Mobile Action Buttons */}
              <div className="lg:hidden absolute top-4 right-4 flex flex-col gap-2">
                <Button size="sm" variant="secondary" className="h-10 w-10 p-0 bg-white/90 rounded-full">
                  <Heart className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="secondary" className="h-10 w-10 p-0 bg-white/90 rounded-full">
                  <Share2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            {/* Image Thumbnails */}
            {allImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {allImages.map((image, index) => (
                  <button
                    key={index}
                    className={`flex-shrink-0 w-16 h-16 lg:w-20 lg:h-20 rounded-lg overflow-hidden border-2 transition-all ${
                      index === currentImageIndex 
                        ? 'border-orange-500 ring-2 ring-orange-200' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setCurrentImageIndex(index)}
                  >
                    <img
                      src={image}
                      alt={`Thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Information Section */}
          <div className="space-y-6">
            {/* Product Header */}
            <div className="bg-white rounded-lg p-4 lg:p-6 shadow-sm">
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-3">{product.name}</h1>
              
              {product.botanicalName && (
                <p className="text-lg text-gray-600 italic mb-4">{product.botanicalName}</p>
              )}
              
              <p className="text-gray-600 mb-4">SKU#: {product.productId}</p>

              {/* Certifications & Tags */}
              <div className="flex flex-wrap gap-2 mb-6">
                {product.certifications && Array.isArray(product.certifications) && product.certifications.map((cert, index) => (
                  <Badge key={`cert-${index}`} variant="outline" className="text-xs">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    {cert}
                  </Badge>
                ))}
                
                {product.tags && product.tags.split(',').map((tag, index) => (
                  <Badge key={`tag-${index}`} variant="secondary" className="text-xs">
                    {tag.trim()}
                  </Badge>
                ))}
              </div>

              {/* Multi-Currency Pricing Display */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <LocationBasedPricing 
                  product={{...product, moq: product.moq || 'Contact for MOQ'}} 
                  showCurrencySelector={false}
                  isAdminView={false}
                  className="mb-2"
                />
                
                <div className="flex items-center text-sm text-green-700 mt-2">
                  <Truck className="w-4 h-4 mr-2" />
                  <span>Free shipping on bulk orders • Worldwide delivery available</span>
                </div>
              </div>

              {/* Quick Actions - Desktop */}
              <div className="hidden lg:flex gap-3 mb-6">
                <Button variant="outline" className="flex-1">
                  <Heart className="w-4 h-4 mr-2" />
                  Save Product
                </Button>
                <Button variant="outline">
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
                <Button variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Download Spec
                </Button>
              </div>

              {/* Key Product Info */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                {product.origin && (
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                    <div>
                      <div className="text-gray-500">Origin</div>
                      <div className="font-medium">{product.origin}</div>
                    </div>
                  </div>
                )}
                
                {product.form && (
                  <div className="flex items-center">
                    <Package className="w-4 h-4 mr-2 text-gray-400" />
                    <div>
                      <div className="text-gray-500">Form</div>
                      <div className="font-medium">{product.form}</div>
                    </div>
                  </div>
                )}
                
                {product.shelfLife && (
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-2 text-gray-400" />
                    <div>
                      <div className="text-gray-500">Shelf Life</div>
                      <div className="font-medium">{product.shelfLife}</div>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center">
                  <Shield className="w-4 h-4 mr-2 text-gray-400" />
                  <div>
                    <div className="text-gray-500">Quality</div>
                    <div className="font-medium">Premium Grade</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Product Description */}
            {product.description && (
              <div className="bg-white rounded-lg p-4 lg:p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Product Description</h3>
                <div className={`text-gray-700 leading-relaxed ${!showFullDescription ? 'line-clamp-4' : ''}`}>
                  {product.description}
                </div>
                {product.description.length > 200 && (
                  <Button 
                    variant="link" 
                    className="p-0 h-auto mt-2 text-orange-600"
                    onClick={() => setShowFullDescription(!showFullDescription)}
                  >
                    {showFullDescription ? 'Show Less' : 'Read More'}
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Detailed Information Tabs */}
        <div className="mt-8 lg:mt-12">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 bg-white rounded-lg p-1 shadow-sm mb-6">
              <TabsTrigger value="overview" className="text-xs lg:text-sm">Overview</TabsTrigger>
              <TabsTrigger value="specifications" className="text-xs lg:text-sm">Specs</TabsTrigger>
              <TabsTrigger value="documents" className="text-xs lg:text-sm">Docs</TabsTrigger>
              <TabsTrigger value="applications" className="text-xs lg:text-sm hidden lg:block">Applications</TabsTrigger>
              <TabsTrigger value="packaging" className="text-xs lg:text-sm hidden lg:block">Packaging</TabsTrigger>
              <TabsTrigger value="faqs" className="text-xs lg:text-sm hidden lg:block">FAQs</TabsTrigger>
            </TabsList>

            {/* Mobile: Additional Tabs Row */}
            <div className="lg:hidden mb-6">
              <TabsList className="grid w-full grid-cols-3 bg-white rounded-lg p-1 shadow-sm">
                <TabsTrigger value="applications" className="text-xs">Uses</TabsTrigger>
                <TabsTrigger value="packaging" className="text-xs">Package</TabsTrigger>
                <TabsTrigger value="faqs" className="text-xs">FAQs</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="overview" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Globe className="w-5 h-5 mr-2 text-orange-600" />
                    Product Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {product.keyFeatures && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Key Features</h4>
                      <p className="text-gray-700">{product.keyFeatures}</p>
                    </div>
                  )}
                  
                  {product.healthBenefits && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Health Benefits</h4>
                      <p className="text-gray-700">{product.healthBenefits}</p>
                    </div>
                  )}
                  
                  {product.usageInstructions && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Usage Instructions</h4>
                      <p className="text-gray-700">{product.usageInstructions}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="specifications" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="w-5 h-5 mr-2 text-orange-600" />
                    Technical Specifications
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {specifications.map((spec, index) => (
                      <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-sm font-medium text-gray-600">{spec.label}:</span>
                        <span className="text-sm text-gray-900 text-right">{spec.value}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="documents" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Download className="w-5 h-5 mr-2 text-orange-600" />
                    Available Documents
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {documents.map((doc, index) => (
                      <Button 
                        key={index} 
                        variant="outline" 
                        className="h-auto p-4 justify-start"
                        asChild
                      >
                        <a href={doc.url} target="_blank" rel="noopener noreferrer">
                          <div className="flex items-center w-full">
                            {doc.icon}
                            <span className="ml-3 flex-1 text-left">{doc.name}</span>
                            <ExternalLink className="w-4 h-4 ml-2" />
                          </div>
                        </a>
                      </Button>
                    ))}
                    
                    {/* Additional Documents */}
                    {product.additionalDocs && Array.isArray(product.additionalDocs) && product.additionalDocs.length > 0 && (
                      product.additionalDocs.map((docUrl, index) => (
                        <Button 
                          key={`additional-${index}`} 
                          variant="outline" 
                          className="h-auto p-4 justify-start"
                          asChild
                        >
                          <a href={docUrl} target="_blank" rel="noopener noreferrer">
                            <div className="flex items-center w-full">
                              <FileText className="w-4 h-4" />
                              <span className="ml-3 flex-1 text-left">Additional Document {index + 1}</span>
                              <ExternalLink className="w-4 h-4 ml-2" />
                            </div>
                          </a>
                        </Button>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="applications" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Leaf className="w-5 h-5 mr-2 text-orange-600" />
                    Applications & Uses
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {product.applications ? (
                    <div className="prose prose-sm max-w-none">
                      <p className="text-gray-700">{product.applications}</p>
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">Application information will be updated soon.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="packaging" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Package className="w-5 h-5 mr-2 text-orange-600" />
                    Packaging & Storage
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {product.packagingOptions && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Available Packaging</h4>
                      <p className="text-gray-700">{product.packagingOptions}</p>
                    </div>
                  )}
                  
                  {product.storageInstructions && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Storage Instructions</h4>
                      <p className="text-gray-700">{product.storageInstructions}</p>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-sm">
                    {product.storageTemperature && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Storage Temperature:</span>
                        <span className="font-medium">{product.storageTemperature}</span>
                      </div>
                    )}
                    
                    {product.storageHumidity && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Storage Humidity:</span>
                        <span className="font-medium">{product.storageHumidity}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="faqs" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MessageSquarePlus className="w-5 h-5 mr-2 text-orange-600" />
                    Frequently Asked Questions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {product.faqs ? (
                    <div className="space-y-4">
                      {JSON.parse(product.faqs).map((faq, index) => (
                        <div key={index} className="border-b border-gray-100 pb-4">
                          <h4 className="font-medium text-gray-900 mb-2">{faq.question}</h4>
                          <p className="text-gray-700">{faq.answer}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">FAQ information will be updated soon.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Inquiry Form Section */}
        <div className="mt-8 lg:mt-12">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center text-xl lg:text-2xl">
                <MessageSquarePlus className="w-6 h-6 mr-3 text-orange-600" />
                Get a Custom Quote
              </CardTitle>
              <p className="text-gray-600 mt-2">
                Submit your detailed inquiry with contact information for personalized assistance
              </p>
            </CardHeader>
            <CardContent>
              <EnhancedInquiryForm 
                product={{...product, moq: product.moq || 'Contact for MOQ'}} 
                isAuthenticated={isAuthenticated || isCustomerAuthenticated}
                customerData={customer}
                isCustomerAuthenticated={isCustomerAuthenticated}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Fixed Bottom CTA - Mobile Only */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t p-4 z-30 shadow-lg">
        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" className="h-12">
            <Heart className="w-4 h-4 mr-2" />
            Save Product
          </Button>
          <Button className="h-12 bg-orange-600 hover:bg-orange-700">
            <MessageSquarePlus className="w-4 h-4 mr-2" />
            Get Quote
          </Button>
        </div>
      </div>
    </div>
  );
}