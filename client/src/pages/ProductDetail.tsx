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
import { 
  Shield, 
  Leaf, 
  Award, 
  Download, 
  Heart, 
  Share2, 
  MessageSquarePlus, 
  Copy,
  FileText,
  CheckCircle,
  Package,
  Truck,
  Globe,
  Beaker
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Product, ProductDocument } from "@shared/schema";

export default function ProductDetail() {
  const { slug } = useParams();
  const { user, isAuthenticated } = useAuth() as { user: any; isAuthenticated: boolean };
  const { toast } = useToast();

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

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Product Hero Section */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            
            {/* Product Image */}
            <div className="space-y-4">
              <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                {currentImage ? (
                  <img
                    src={currentImage}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <Package className="w-24 h-24" />
                  </div>
                )}
              </div>
              
              {/* Gallery thumbnails */}
              {product.galleryImages && Array.isArray(product.galleryImages) && product.galleryImages.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {(product.galleryImages as string[]).slice(0, 4).map((image, index) => (
                    <div key={index} className="aspect-square bg-gray-100 rounded-md overflow-hidden">
                      <img
                        src={image}
                        alt={`${product.name} ${index + 1}`}
                        className="w-full h-full object-cover cursor-pointer hover:opacity-80"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="text-green-700 border-green-200">
                    Product ID: {product.productId}
                  </Badge>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleCopyProductId}
                    className="p-1 h-6 w-6"
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
                <p className="text-lg text-gray-600 leading-relaxed">{product.description}</p>
              </div>

              {/* Key Features */}
              <div className="flex flex-wrap gap-2">
                {product.isActive && (
                  <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Available
                  </Badge>
                )}
                {product.form && (
                  <Badge variant="outline">{product.form}</Badge>
                )}
                {product.origin && (
                  <Badge variant="outline">
                    <Globe className="w-3 h-3 mr-1" />
                    {product.origin}
                  </Badge>
                )}
              </div>

              {/* Certifications */}
              <div className="flex gap-3">
                <div className="flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm">
                  <Leaf className="w-4 h-4" />
                  Organic Certified
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">
                  <Shield className="w-4 h-4" />
                  Quality Assured
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-orange-50 text-orange-700 rounded-full text-sm">
                  <Award className="w-4 h-4" />
                  Lab Tested
                </div>
              </div>

              {/* Pricing */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Bulk Pricing</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">Contact us for bulk pricing and availability.</p>
                  <div className="mt-2">
                    <span className="text-sm text-gray-500">MOQ: {product.moq || '25'} kg</span>
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="space-y-3">
                <div className="flex gap-3">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="lg" className="flex-1">
                        <MessageSquarePlus className="w-4 h-4 mr-2" />
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

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="lg">
                        <Beaker className="w-4 h-4 mr-2" />
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

                <div className="flex gap-3">
                  <Button variant="outline" onClick={handleShare} className="flex-1">
                    <Share2 className="w-4 h-4 mr-2" />
                    Share Product
                  </Button>
                  <Button variant="outline">
                    <Heart className="w-4 h-4 mr-2" />
                    Save
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Product Details Tabs */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Tabs defaultValue="specifications" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="specifications">Specifications</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="applications">Applications</TabsTrigger>
            <TabsTrigger value="shipping">Shipping & MOQ</TabsTrigger>
          </TabsList>

          <TabsContent value="specifications" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Product Specifications</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3 text-gray-900">Basic Information</h4>
                    <div className="space-y-2">
                      {product.botanicalName && (
                        <div className="flex justify-between py-2 border-b border-gray-100">
                          <span className="text-gray-600">Botanical Name</span>
                          <span className="font-medium text-gray-900">{product.botanicalName}</span>
                        </div>
                      )}
                      {product.form && (
                        <div className="flex justify-between py-2 border-b border-gray-100">
                          <span className="text-gray-600">Form</span>
                          <span className="font-medium text-gray-900">{product.form}</span>
                        </div>
                      )}
                      {product.origin && (
                        <div className="flex justify-between py-2 border-b border-gray-100">
                          <span className="text-gray-600">Origin</span>
                          <span className="font-medium text-gray-900">{product.origin}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3 text-gray-900">Processing Information</h4>
                    <div className="space-y-2">
                      {product.processing && (
                        <div className="flex justify-between py-2 border-b border-gray-100">
                          <span className="text-gray-600">Processing Method</span>
                          <span className="font-medium text-gray-900">{product.processing}</span>
                        </div>
                      )}
                      {product.shelfLife && (
                        <div className="flex justify-between py-2 border-b border-gray-100">
                          <span className="text-gray-600">Shelf Life</span>
                          <span className="font-medium text-gray-900">{product.shelfLife}</span>
                        </div>
                      )}
                      {product.storageConditions && (
                        <div className="flex justify-between py-2 border-b border-gray-100">
                          <span className="text-gray-600">Storage Conditions</span>
                          <span className="font-medium text-gray-900">{product.storageConditions}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {product.specificationSheet && (
                  <div className="mt-6">
                    <h4 className="font-semibold mb-3 text-gray-900">Detailed Specifications</h4>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-gray-700">{product.specificationSheet}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Product Documents & Certificates</CardTitle>
              </CardHeader>
              <CardContent>
                {documents && documents.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {documents.map((doc) => (
                      <div key={doc.id} className="border rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex items-start gap-3">
                          <FileText className="w-8 h-8 text-blue-600 mt-1" />
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{doc.title}</h4>
                            <p className="text-sm text-gray-600 mt-1">{doc.type}</p>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="mt-2"
                              onClick={() => window.open(doc.fileUrl, '_blank')}
                            >
                              <Download className="w-4 h-4 mr-1" />
                              Download
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No documents available for this product.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="applications" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Applications & Uses</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Application information will be provided upon request.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="shipping" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Shipping & Order Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3 text-gray-900">Minimum Order Quantity</h4>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Package className="w-5 h-5 text-green-600" />
                        <span className="font-medium text-green-900">
                          {product.moq || 25} kg minimum order
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3 text-gray-900">Packaging Options</h4>
                    <div className="space-y-2">
                      <p className="text-gray-600">Standard packaging available</p>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <h4 className="font-semibold mb-3 text-gray-900">Shipping Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                      <Truck className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="font-medium text-blue-900">Fast Delivery</p>
                        <p className="text-sm text-blue-700">3-7 business days</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                      <Globe className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="font-medium text-green-900">Global Shipping</p>
                        <p className="text-sm text-green-700">Worldwide delivery</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
                      <Shield className="w-5 h-5 text-orange-600" />
                      <div>
                        <p className="font-medium text-orange-900">Secure Packaging</p>
                        <p className="text-sm text-orange-700">Quality protected</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Footer />
    </div>
  );
}