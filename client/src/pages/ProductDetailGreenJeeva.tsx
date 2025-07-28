import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import Header from "@/components/Header";
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
  Copy,
  Eye,
  FileText,
  CheckCircle,
  Package,
  Truck,
  Star,
  Users,
  Globe,
  Beaker
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { LocationBasedPricing } from "@/components/LocationBasedPricing";
import type { Product, ProductDocument } from "@shared/schema";

export default function ProductDetailGreenJeeva() {
  const { slug } = useParams();
  const { user, isAuthenticated } = useAuth() as { user: any; isAuthenticated: boolean };
  const { toast } = useToast();
  const [selectedQuantity, setSelectedQuantity] = useState(25);
  const [totalPrice, setTotalPrice] = useState(0);
  const [discount, setDiscount] = useState(0);

  const { data: product, isLoading } = useQuery<Product>({
    queryKey: ["/api/products/slug", slug],
  });

  const { data: documents } = useQuery<ProductDocument[]>({
    queryKey: ["/api/products", product?.id, "documents"],
    enabled: !!product?.id,
  });

  if (isLoading) {
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

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h1>
            <p className="text-gray-600">The product you're looking for doesn't exist.</p>
          </div>
        </div>
      </div>
    );
  }

  const handleQuantityChange = (quantity: number, price: number, discountPercent: number) => {
    setSelectedQuantity(quantity);
    setTotalPrice(price);
    setDiscount(discountPercent);
  };

  const copyProductName = () => {
    navigator.clipboard.writeText(product.name);
    toast({ title: "Product name copied to clipboard!" });
  };

  const currentImage = (product as any).mainImage || (product.images as string[])?.[0];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <nav className="mb-6 text-sm text-gray-600">
          <span>Home</span> / <span>Products</span> / <span className="text-gray-900">{product.name}</span>
        </nav>

        <div className="grid lg:grid-cols-12 gap-8 mb-8">
          {/* Left Column - Product Image & Documents */}
          <div className="lg:col-span-4">
            {/* Product Image */}
            <div className="sticky top-4">
              <div className="relative mb-6 bg-white rounded-lg shadow-sm overflow-hidden">
                {currentImage ? (
                  <img
                    src={currentImage}
                    alt={product.name}
                    className="w-full h-80 object-cover"
                  />
                ) : (
                  <div className="w-full h-80 flex items-center justify-center bg-gray-100 text-gray-400">
                    <div className="text-center">
                      <div className="text-4xl mb-3">📷</div>
                      <div className="text-lg font-medium">No Preview Available</div>
                    </div>
                  </div>
                )}
                {product.isOrganic && (
                  <Badge className="absolute top-4 left-4 bg-green-600">
                    <Leaf className="w-3 h-3 mr-1" />
                    Organic
                  </Badge>
                )}
              </div>

              {/* Document Downloads */}
              <Card className="mb-6">
                <CardHeader className="pb-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg">
                  <CardTitle className="text-base font-semibold text-blue-900 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    All Product Documents
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {!isAuthenticated ? (
                    <div className="text-center py-4 bg-gray-50 rounded">
                      <p className="text-sm text-gray-600 mb-3">You must log in to view documents</p>
                      <Button size="sm" onClick={() => window.location.href = '/api/login'}>
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
                        {product.additionalDocs && (product.additionalDocs as string[]).length > 0 && (
                          (product.additionalDocs as string[]).map((docUrl, index) => (
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

              {/* Certifications */}
              <div className="flex flex-wrap gap-2 mb-4">
                {product.certifications && (product.certifications as string[]).map((cert: string, index: number) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    {cert}
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
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Request Quote for {product.name}</DialogTitle>
                    </DialogHeader>
                    <InquiryForm product={product} />
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
                    <h4 className="font-medium text-sm text-blue-900">Need pricing or bulk orders?</h4>
                    <MessageSquare className="w-4 h-4 text-blue-600" />
                  </div>
                  <EnhancedInquiryForm 
                    product={product} 
                    isAuthenticated={isAuthenticated} 
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
                      isAuthenticated={isAuthenticated} 
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
                <Tabs defaultValue="spec" className="w-full">
                  <TabsList className="grid w-full grid-cols-4 mb-0 rounded-none border-b bg-gray-50">
                    <TabsTrigger value="spec" className="text-xs px-2 py-3 data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-orange-500">Product Spec</TabsTrigger>
                    <TabsTrigger value="description" className="text-xs px-2 py-3 data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-orange-500">Description</TabsTrigger>
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
                          
                          {/* Product Type and Grade Info */}
                          {(product.productType || product.productGrade) && (
                            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                              <h4 className="font-semibold text-gray-900 mb-2">Product Classification:</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                {product.productType && (
                                  <div>
                                    <span className="text-gray-600">Type:</span>
                                    <span className="ml-2 font-medium capitalize">{product.productType}</span>
                                  </div>
                                )}
                                {product.productGrade && (
                                  <div>
                                    <span className="text-gray-600">Grade:</span>
                                    <span className="ml-2 font-medium">{product.productGrade}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Certifications Display */}
                          {product.certifications && (product.certifications as string[]).length > 0 && (
                            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                <Shield className="w-4 h-4" />
                                Certifications & Standards
                              </h4>
                              <div className="flex flex-wrap gap-2">
                                {(product.certifications as string[]).map((cert: string, index: number) => (
                                  <Badge key={index} variant="outline" className="text-xs bg-white">
                                    <CheckCircle className="w-3 h-3 mr-1 text-green-600" />
                                    {cert}
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
                    <div className="space-y-4 w-full">
                      {/* Display FAQs from backend - either custom or default */}
                      {product.faqs && (product.faqs as any[]).length > 0 ? (
                        (product.faqs as any[]).map((faq, index) => (
                          <div key={index} className="border-l-4 border-orange-500 pl-4 py-2">
                            <h4 className="font-semibold text-gray-900 text-sm">{faq.question}</h4>
                            <p className="text-gray-700 text-sm mt-1">{faq.answer}</p>
                          </div>
                        ))
                      ) : (
                        /* Fallback message when no FAQs are available */
                        <div className="text-center py-8">
                          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <MessageSquare className="w-6 h-6 text-gray-400" />
                          </div>
                          <h3 className="font-semibold text-gray-900 mb-2">No FAQs Available</h3>
                          <p className="text-gray-600 text-sm mb-4">
                            Product FAQs have not been added yet. Please contact us with any questions about this product.
                          </p>
                          <Button variant="outline" size="sm">
                            <MessageSquare className="w-4 h-4 mr-2" />
                            Ask a Question
                          </Button>
                        </div>
                      )}
                    </div>
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

            {/* Tell Us Your Requirement Form */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg">Tell Us Your Requirement</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Product*</label>
                  <Input value={product.name} disabled className="mt-1" />
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700">Pack Quantity*</label>
                  <div className="flex gap-2 mt-1">
                    <Input 
                      type="number" 
                      placeholder="25" 
                      value={selectedQuantity}
                      onChange={(e) => setSelectedQuantity(parseInt(e.target.value) || 25)}
                    />
                    <Select defaultValue="kg">
                      <SelectTrigger className="w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="kg">Kg</SelectItem>
                        <SelectItem value="gm">Gm</SelectItem>
                        <SelectItem value="lb">Lb</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Total: {selectedQuantity}.00Kg x 1 = {selectedQuantity}.00Kg
                  </p>
                </div>

                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="w-full bg-orange-600 hover:bg-orange-700">
                      Place an Enquiry
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Place Enquiry for {product.name}</DialogTitle>
                    </DialogHeader>
                    <InquiryForm product={product} />
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>

            {/* Related Products */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-base">Bought Together</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  See what are often bought with this product!
                </p>
                <Button variant="outline" size="sm" className="mt-3 w-full">
                  View Related Products
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>



      </div>
    </div>
  );
}