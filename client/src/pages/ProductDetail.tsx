import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { EnhancedInquiryForm } from "@/components/EnhancedInquiryForm";
import { SampleRequestForm } from "@/components/SampleRequestForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
  Calculator,
  Info
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { LocationBasedPricing } from "@/components/LocationBasedPricing";
import type { Product, ProductDocument } from "@shared/schema";

export default function ProductDetail() {
  const { slug } = useParams();
  const { user, isAuthenticated } = useAuth() as { user: any; isAuthenticated: boolean };
  const { toast } = useToast();
  const [selectedQuantity, setSelectedQuantity] = useState(100);
  const [customQuantity, setCustomQuantity] = useState("");

  const { data: product, isLoading } = useQuery<Product>({
    queryKey: ["/api/products/slug", slug],
  });

  const { data: documents } = useQuery<ProductDocument[]>({
    queryKey: ["/api/products", product?.id, "documents"],
    enabled: !!product?.id,
  });

  // Generate comprehensive structured data for Google
  const generateStructuredData = (product: Product) => {
    const baseUrl = window.location.origin;
    const productUrl = `${baseUrl}/products/${product.slug}`;
    const currentImage = product.mainImage || (product.galleryImages as string[])?.[0];
    const imageUrl = currentImage?.startsWith('http') ? currentImage : `${baseUrl}${currentImage}`;
    
    return {
      "@context": "https://schema.org/",
      "@type": "Product",
      "name": product.name,
      "description": product.description || `High-quality ${product.name} from BFI Organic`,
      "sku": product.productId,
      "mpn": product.productId,
      "brand": {
        "@type": "Brand",
        "name": "BFI Organic"
      },
      "manufacturer": {
        "@type": "Organization",
        "name": "BFI Organic"
      },
      "image": imageUrl,
      "url": productUrl,
      "offers": {
        "@type": "Offer",
        "availability": product.isActive ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        "seller": {
          "@type": "Organization",
          "name": "BFI Organic"
        }
      },
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.8",
        "reviewCount": "127"
      }
    };
  };

  // SEO and page setup
  useEffect(() => {
    if (product) {
      // Update page title
      document.title = `${product.name} - Premium Organic Ingredients | BFI Organic`;
      
      // Update meta description
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute('content', 
          `Buy ${product.name} - ${product.description || 'Premium organic ingredients'}. Bulk quantities available. Contact BFI Organic for wholesale pricing.`
        );
      }

      // Add structured data
      const structuredData = generateStructuredData(product);
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.text = JSON.stringify(structuredData);
      document.head.appendChild(script);

      return () => {
        // Clean up
        document.head.removeChild(script);
      };
    }
  }, [product]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Product not found</h1>
          <p className="text-gray-600 mt-2">The product you're looking for doesn't exist.</p>
        </div>
        <Footer />
      </div>
    );
  }

  const currentImage = product.mainImage || (product.galleryImages as string[])?.[0];

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product.name,
        text: product.description || '',
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link copied!",
        description: "Product link has been copied to clipboard.",
      });
    }
  };

  const handleCopyProductId = () => {
    navigator.clipboard.writeText(product.productId);
    toast({
      title: "Product ID copied!",
      description: `${product.productId} has been copied to clipboard.`,
    });
  };

  const calculatePrice = (quantity: number) => {
    // Sample pricing logic - replace with actual pricing data
    const basePrice = 1757.50;
    let discount = 0;
    
    if (quantity >= 5000) discount = 15;
    else if (quantity >= 1000) discount = 12;
    else if (quantity >= 500) discount = 8;
    else if (quantity >= 100) discount = 5;
    
    const discountedPrice = basePrice * (1 - discount / 100);
    return { price: discountedPrice, discount, total: discountedPrice * quantity };
  };

  const pricingData = calculatePrice(selectedQuantity);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Main Product Section */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Side - Product Image & Documents */}
            <div className="lg:col-span-1 space-y-6">
              {/* Product Image */}
              <div className="bg-gradient-to-br from-orange-50 to-green-50 rounded-2xl p-8 relative">
                <div className="absolute top-4 left-4">
                  <Badge className="bg-green-600 text-white hover:bg-green-600">
                    <Leaf className="w-3 h-3 mr-1" />
                    Organic
                  </Badge>
                </div>
                
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">{product.name}</h2>
                  <div className="relative mx-auto w-64 h-64 mb-6">
                    {currentImage ? (
                      <img
                        src={currentImage}
                        alt={product.name}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <Package className="w-32 h-32" />
                      </div>
                    )}
                  </div>
                  
                  {/* Certification Icons */}
                  <div className="flex justify-center space-x-4 mb-4">
                    <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-sm">
                      <Leaf className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-sm">
                      <Shield className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-sm">
                      <Award className="w-6 h-6 text-orange-600" />
                    </div>
                    <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-sm">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                </div>
              </div>

              {/* All Product Documents */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    All Product Documents
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isAuthenticated ? (
                    documents && documents.length > 0 ? (
                      <div className="space-y-2">
                        {documents.map((doc) => (
                          <div key={doc.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                            <span className="text-sm text-gray-700">{doc.title}</span>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => window.open(doc.fileUrl, '_blank')}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-600">No documents available</p>
                    )
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-sm text-gray-600 mb-3">You must log in to view documents</p>
                      <Button size="sm" className="bg-green-600 hover:bg-green-700">
                        Log in
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Middle - Product Info */}
            <div className="lg:col-span-1 space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-sm text-gray-600">SKU#: </span>
                  <span className="text-sm font-medium text-gray-900">{product.productId}</span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleCopyProductId}
                    className="p-1 h-6 w-6"
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>

                {/* Certifications */}
                <div className="flex flex-wrap gap-3 mb-6">
                  <div className="flex items-center gap-1 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    USDA NOP
                  </div>
                  <div className="flex items-center gap-1 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    NPOP
                  </div>
                  <div className="flex items-center gap-1 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    EU Organic
                  </div>
                  <div className="flex items-center gap-1 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    FDA Approved
                  </div>
                  <div className="flex items-center gap-1 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    GMP Certified
                  </div>
                  <div className="flex items-center gap-1 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    ISO Certified
                  </div>
                  <div className="flex items-center gap-1 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    Kosher
                  </div>
                  <div className="flex items-center gap-1 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    Halal
                  </div>
                  <div className="flex items-center gap-1 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    Non-GMO
                  </div>
                </div>

                {/* Pricing */}
                <div className="bg-green-50 rounded-lg p-4 mb-6">
                  <div className="text-3xl font-bold text-green-700 mb-1">₹{pricingData.price.toFixed(2)}</div>
                  <div className="text-sm text-green-600 mb-2">EXW Warehouse India</div>
                  <div className="text-sm text-gray-600 mb-2">per kg</div>
                  <div className="text-sm text-blue-600 mb-3">Showing regional pricing for: Indian Rupee</div>
                  <div className="text-sm text-gray-600">MOQ: {product.moq || 100} kg | Lead Time: 5-7 days</div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button className="flex-1 bg-orange-600 hover:bg-orange-700">
                          <MessageSquare className="w-4 h-4 mr-2" />
                          Request Quote
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Request Quote - {product.name}</DialogTitle>
                        </DialogHeader>
                        <EnhancedInquiryForm product={product} isAuthenticated={isAuthenticated} />
                      </DialogContent>
                    </Dialog>

                    <Button variant="outline" onClick={handleShare}>
                      <Heart className="w-4 h-4 mr-2" />
                      Wishlist
                    </Button>

                    <Button variant="outline" onClick={handleShare}>
                      <Share2 className="w-4 h-4 mr-2" />
                      Share
                    </Button>
                  </div>

                  {/* Inquiry Section */}
                  <Card className="border-blue-200 bg-blue-50">
                    <CardContent className="p-4">
                      <p className="text-sm text-blue-800 mb-3">Need pricing or bulk orders?</p>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button className="w-full bg-blue-600 hover:bg-blue-700">
                            <MessageSquare className="w-4 h-4 mr-2" />
                            Send Inquiry
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Send Inquiry - {product.name}</DialogTitle>
                          </DialogHeader>
                          <EnhancedInquiryForm product={product} isAuthenticated={isAuthenticated} />
                        </DialogContent>
                      </Dialog>
                    </CardContent>
                  </Card>

                  {/* Sample Request */}
                  <Card className="border-orange-200 bg-orange-50">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Beaker className="w-4 h-4 text-orange-600" />
                            <span className="font-medium text-orange-800">Request a Free Sample</span>
                          </div>
                          <p className="text-sm text-orange-700">Get a free sample to test quality before placing bulk orders</p>
                        </div>
                        <div className="text-right ml-4">
                          <div className="text-sm text-orange-600 mb-1">Sample Size</div>
                          <div className="font-medium text-orange-800">25-100g</div>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button size="sm" className="mt-2 bg-orange-600 hover:bg-orange-700">
                                <Beaker className="w-4 h-4 mr-1" />
                                Request Sample
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Request Sample - {product.name}</DialogTitle>
                              </DialogHeader>
                              <SampleRequestForm product={product} isAuthenticated={isAuthenticated} />
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>

            {/* Right Side - Quantity Pricing */}
            <div className="lg:col-span-1">
              <Card className="sticky top-4">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calculator className="w-5 h-5 text-green-600" />
                    Quantity Pricing
                  </CardTitle>
                  <p className="text-sm text-gray-600">Current pricing in INR • Prices shown in your regional currency</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Pricing Table */}
                  <div className="space-y-2">
                    {[
                      { qty: 100, price: 1757.50, discount: 5.0, selected: selectedQuantity === 100 },
                      { qty: 500, price: 1702.00, discount: 8.0, selected: selectedQuantity === 500 },
                      { qty: 1000, price: 1628.00, discount: 12.0, selected: selectedQuantity === 1000 },
                      { qty: 5000, price: 1572.50, discount: 15.0, selected: selectedQuantity === 5000 }
                    ].map((tier, index) => (
                      <div 
                        key={index}
                        className={`grid grid-cols-4 gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                          tier.selected 
                            ? 'border-green-500 bg-green-50' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setSelectedQuantity(tier.qty)}
                      >
                        <div className="font-medium text-gray-900">{tier.qty} kg</div>
                        <div className="text-right font-medium">₹{tier.price.toFixed(2)}/kg</div>
                        <div className="text-right text-green-600">~ {tier.discount.toFixed(1)}%</div>
                        <div className="text-right">
                          {tier.selected ? (
                            <span className="text-white bg-green-600 px-2 py-1 rounded text-xs">Selected</span>
                          ) : (
                            <Button variant="outline" size="sm" className="text-xs px-2 py-1 h-auto">
                              Select
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Custom Quantity */}
                  <div className="border-t pt-4">
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Custom Quantity</label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder="Min. 100"
                        value={customQuantity}
                        onChange={(e) => setCustomQuantity(e.target.value)}
                        className="flex-1"
                      />
                      <Button 
                        variant="outline"
                        onClick={() => {
                          const qty = parseInt(customQuantity);
                          if (qty >= 100) setSelectedQuantity(qty);
                        }}
                      >
                        Calculate
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">MOQ: 100 kg</p>
                  </div>

                  {/* Selected Quantity Summary */}
                  <div className="bg-gray-50 rounded-lg p-4 border-t">
                    <h4 className="font-medium text-gray-900 mb-3">Selected Quantity</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Quantity:</span>
                        <span className="font-medium">{selectedQuantity} kg</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Price per kg:</span>
                        <span className="font-medium">₹{pricingData.price.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Price:</span>
                        <span className="font-bold text-lg">₹{pricingData.total.toLocaleString()}.00</span>
                      </div>
                      {pricingData.discount > 0 && (
                        <div className="flex justify-between text-green-600">
                          <span>You Save:</span>
                          <span className="font-medium">{pricingData.discount.toFixed(1)}%</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Product Information Section */}
      <div className="bg-orange-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-sm">
            <div className="border-b border-gray-200 p-6">
              <h2 className="text-xl font-bold text-orange-600 flex items-center gap-2">
                <Info className="w-5 h-5" />
                Product Information
              </h2>
            </div>
            
            <Tabs defaultValue="spec" className="w-full">
              <TabsList className="w-full justify-start border-b rounded-none bg-transparent p-0">
                <TabsTrigger 
                  value="spec" 
                  className="border-b-2 border-transparent data-[state=active]:border-orange-500 data-[state=active]:bg-transparent rounded-none"
                >
                  Product Spec
                </TabsTrigger>
                <TabsTrigger 
                  value="description"
                  className="border-b-2 border-transparent data-[state=active]:border-orange-500 data-[state=active]:bg-transparent rounded-none"
                >
                  Description
                </TabsTrigger>
                <TabsTrigger 
                  value="faqs"
                  className="border-b-2 border-transparent data-[state=active]:border-orange-500 data-[state=active]:bg-transparent rounded-none"
                >
                  FAQs
                </TabsTrigger>
                <TabsTrigger 
                  value="vendors"
                  className="border-b-2 border-transparent data-[state=active]:border-orange-500 data-[state=active]:bg-transparent rounded-none"
                >
                  Other Vendors
                </TabsTrigger>
              </TabsList>

              <TabsContent value="spec" className="p-6">
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-600 mb-2">No Specifications Available</h3>
                  <p className="text-gray-500">Product specifications have not been uploaded yet. Please contact us for detailed product information.</p>
                </div>
              </TabsContent>

              <TabsContent value="description" className="p-6">
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">{product.description || "Product description will be available soon."}</p>
                </div>
              </TabsContent>

              <TabsContent value="faqs" className="p-6">
                <div className="text-center py-12">
                  <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">FAQs will be available soon.</p>
                </div>
              </TabsContent>

              <TabsContent value="vendors" className="p-6">
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Other vendor information will be available soon.</p>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Tell Us Your Requirement Section */}
      <div className="bg-white py-8">
        <div className="max-w-7xl mx-auto px-4">
          <Card className="border-orange-200">
            <CardHeader>
              <CardTitle className="text-lg text-orange-600 flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Tell Us Your Requirement
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">Submit your detailed inquiry with contact information for personalized assistance</p>
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="bg-orange-600 hover:bg-orange-700">
                    Submit Inquiry
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Submit Your Requirement</DialogTitle>
                  </DialogHeader>
                  <EnhancedInquiryForm product={product} isAuthenticated={isAuthenticated} />
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
}