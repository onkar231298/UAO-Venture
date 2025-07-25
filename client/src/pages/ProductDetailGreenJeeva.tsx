import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import Header from "@/components/Header";
import InquiryForm from "@/components/InquiryForm";
import QuantityPricing from "@/components/QuantityPricing";
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
  Globe
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

        <div className="grid lg:grid-cols-3 gap-8 mb-8">
          {/* Left Column - Product Image & Documents */}
          <div className="lg:col-span-1">
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
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold">All Product Documents</CardTitle>
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
          <div className="lg:col-span-1">
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
                    MOQ: {product.moq} {product.unit || 'kg'} | Lead Time: {product.leadTime || 'Contact us'}
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

              {/* High Volume Bid */}
              <Card className="bg-blue-50 border-blue-200 mb-6">
                <CardContent className="p-4">
                  <p className="text-sm text-blue-800 mb-2">
                    Want high volume of this product?
                  </p>
                  <Button variant="outline" size="sm" className="border-blue-300 text-blue-700">
                    <Package className="w-4 h-4 mr-2" />
                    Place High Volume Bid
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Right Column - Pricing & Order */}
          <div className="lg:col-span-1">
            <div className="sticky top-4">
              <QuantityPricing 
                product={product} 
                onQuantityChange={handleQuantityChange}
              />

              {/* Inquiry Form */}
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

        {/* Full-Width Specification Tabs Section */}
        <div className="w-full">
          <Tabs defaultValue="spec" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-6 max-w-2xl mx-auto">
              <TabsTrigger value="spec" className="text-sm">Product Spec</TabsTrigger>
              <TabsTrigger value="description" className="text-sm">Description</TabsTrigger>
              <TabsTrigger value="faqs" className="text-sm">FAQs</TabsTrigger>
              <TabsTrigger value="vendors" className="text-sm">Other Vendors</TabsTrigger>
            </TabsList>

            <TabsContent value="spec" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Product Specifications</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-sm">
                    {product.botanicalName && (
                      <div className="border-b pb-3">
                        <span className="font-medium text-gray-600">Botanical Name:</span>
                        <br />
                        <span className="italic text-base">{product.botanicalName}</span>
                      </div>
                    )}
                    {product.plantPart && (
                      <div className="border-b pb-3">
                        <span className="font-medium text-gray-600">Plant Part Used:</span>
                        <br />
                        <span className="text-base">{product.plantPart}</span>
                      </div>
                    )}
                    {product.form && (
                      <div className="border-b pb-3">
                        <span className="font-medium text-gray-600">Form:</span>
                        <br />
                        <span className="text-base">{product.form}</span>
                      </div>
                    )}
                    {product.origin && (
                      <div className="border-b pb-3">
                        <span className="font-medium text-gray-600">Country of Origin:</span>
                        <br />
                        <span className="text-base">{product.origin}</span>
                      </div>
                    )}
                    {product.shelfLife && (
                      <div className="border-b pb-3">
                        <span className="font-medium text-gray-600">Shelf Life:</span>
                        <br />
                        <span className="text-base">{product.shelfLife}</span>
                      </div>
                    )}
                    {product.meshSize && (
                      <div className="border-b pb-3">
                        <span className="font-medium text-gray-600">Mesh Size:</span>
                        <br />
                        <span className="text-base">{product.meshSize}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="description" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Product Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-base max-w-none">
                    <p className="text-base leading-relaxed">{product.description}</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="faqs" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Frequently Asked Questions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="border-b pb-4">
                      <h4 className="font-medium text-gray-900 mb-3 text-base">What is the moisture content specification?</h4>
                      <p className="text-base text-gray-600 leading-relaxed">The moisture content is maintained at ≤ 10% to ensure optimal stability and prevent microbial growth.</p>
                    </div>
                    <div className="border-b pb-4">
                      <h4 className="font-medium text-gray-900 mb-3 text-base">What quality testing is performed?</h4>
                      <p className="text-base text-gray-600 leading-relaxed">Each lot undergoes comprehensive testing including organoleptic evaluation, heavy metals analysis, microbial testing, and pesticide residue screening.</p>
                    </div>
                    <div className="border-b pb-4">
                      <h4 className="font-medium text-gray-900 mb-3 text-base">What are the storage requirements?</h4>
                      <p className="text-base text-gray-600 leading-relaxed">Store in a cool, dry place away from direct sunlight. Keep in original packaging until use to maintain product quality.</p>
                    </div>
                    <div className="pb-4">
                      <h4 className="font-medium text-gray-900 mb-3 text-base">What certifications does this product have?</h4>
                      <p className="text-base text-gray-600 leading-relaxed">This product comes with comprehensive certifications including organic certificates, kosher certification, and compliance documentation as specified.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="vendors" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Other Vendors</CardTitle>
                </CardHeader>
                <CardContent>
                  {!isAuthenticated ? (
                    <div className="text-center py-12 bg-gray-50 rounded">
                      <Users className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                      <p className="text-gray-600 mb-4 text-base">You must log in to view other vendors</p>
                      <Button size="default" onClick={() => window.location.href = '/api/login'}>
                        Log in
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-gray-50 rounded">
                      <Globe className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                      <p className="text-gray-600 text-base">No other vendors available for this product at the moment.</p>
                      <p className="text-sm text-gray-500 mt-2">Check back later for alternative suppliers.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}