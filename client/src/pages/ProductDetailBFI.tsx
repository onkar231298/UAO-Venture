import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import type { Product } from "@shared/schema";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, Heart, Share2, Download, Truck, Phone, Mail, MessageCircle, ChevronLeft, ChevronRight, Star, Shield, Award, Globe, Users } from "lucide-react";

export default function ProductDetailBFI() {
  const { slug } = useParams();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [activeTab, setActiveTab] = useState("overview");

  const { data: product, isLoading, error } = useQuery<Product>({
    queryKey: [`/api/products/slug/${slug}`],
  });

  // Mock gallery images for now
  const galleryImages = [
    "/api/placeholder/600/400",
    "/api/placeholder/600/400",
    "/api/placeholder/600/400"
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="h-96 bg-gray-200 rounded"></div>
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

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50">
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

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % galleryImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Mobile Breadcrumb */}
      <div className="lg:hidden bg-white border-b px-4 py-2">
        <div className="text-sm text-gray-600">
          <span>Products</span> → <span className="text-gray-900">{product.name}</span>
        </div>
      </div>

      <div className="container mx-auto px-4 py-4 lg:py-8">
        {/* Desktop Breadcrumb */}
        <div className="hidden lg:block mb-6">
          <div className="text-sm text-gray-600">
            <span>Home</span> → <span>Products</span> → <span>Category</span> → <span className="text-gray-900">{product.name}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image Gallery Section */}
          <div className="space-y-4">
            {/* Main Image with Mobile Actions */}
            <div className="relative bg-white rounded-lg overflow-hidden shadow-sm">
              <img 
                src={galleryImages[currentImageIndex]} 
                alt={product.name}
                className="w-full h-64 lg:h-96 object-cover"
              />
              
              {/* Mobile Action Buttons Overlay */}
              <div className="lg:hidden absolute top-4 right-4 flex gap-2">
                <Button size="sm" variant="secondary" className="bg-white/90 backdrop-blur-sm">
                  <Heart className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="secondary" className="bg-white/90 backdrop-blur-sm">
                  <Share2 className="w-4 h-4" />
                </Button>
              </div>

              {/* Navigation Arrows */}
              {galleryImages.length > 1 && (
                <>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/90 backdrop-blur-sm"
                    onClick={prevImage}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/90 backdrop-blur-sm"
                    onClick={nextImage}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </>
              )}
            </div>

            {/* Thumbnail Gallery */}
            {galleryImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {galleryImages.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`flex-shrink-0 w-16 h-16 lg:w-20 lg:h-20 rounded-lg overflow-hidden border-2 ${
                      currentImageIndex === index ? 'border-green-500' : 'border-gray-200'
                    }`}
                  >
                    <img src={image} alt={`${product.name} ${index + 1}`} className="w-full h-full object-cover" />
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
              
              <p className="text-gray-600 mb-4">SKU: {product.productId}</p>

              {/* Certifications & Tags */}
              <div className="flex flex-wrap gap-2 mb-6">
                {product.certifications && Array.isArray(product.certifications) && product.certifications.map((cert: string, index: number) => (
                  <Badge key={`cert-${index}`} variant="outline" className="text-xs">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    {cert}
                  </Badge>
                ))}
                
                {product.tags && typeof product.tags === 'string' && product.tags.split(',').map((tag: string, index: number) => (
                  <Badge key={`tag-${index}`} variant="secondary" className="text-xs">
                    {tag.trim()}
                  </Badge>
                ))}
              </div>

              {/* Simplified Pricing Display */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <div className="text-lg font-semibold text-green-800 mb-2">
                  Pricing: Contact for Quote
                </div>
                <div className="text-sm text-green-700 mb-2">
                  MOQ: {product.moq || 'Contact for MOQ'}
                </div>
                
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

              {/* CTA Buttons */}
              <div className="space-y-3">
                <Button className="w-full bg-green-600 hover:bg-green-700">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Request Quote
                </Button>
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline">
                    <Phone className="w-4 h-4 mr-2" />
                    Call Now
                  </Button>
                  <Button variant="outline">
                    <Mail className="w-4 h-4 mr-2" />
                    Email Us
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile-First Tabs Section */}
        <div className="mt-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            {/* Mobile: 2-Row Tab Layout */}
            <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 h-auto lg:h-10">
              <TabsTrigger value="overview" className="text-xs lg:text-sm">Overview</TabsTrigger>
              <TabsTrigger value="specs" className="text-xs lg:text-sm">Specifications</TabsTrigger>
              <TabsTrigger value="documents" className="text-xs lg:text-sm">Documents</TabsTrigger>
              <TabsTrigger value="applications" className="text-xs lg:text-sm">Applications</TabsTrigger>
              <TabsTrigger value="packaging" className="text-xs lg:text-sm">Packaging</TabsTrigger>
              <TabsTrigger value="faqs" className="text-xs lg:text-sm">FAQs</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Product Overview</CardTitle>
                  <CardDescription>Complete product information and details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {product.description && (
                    <div>
                      <h4 className="font-semibold mb-2">Description</h4>
                      <p className="text-gray-700">{product.description}</p>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {product.origin && (
                      <div>
                        <h4 className="font-semibold mb-1">Origin</h4>
                        <p className="text-gray-700">{product.origin}</p>
                      </div>
                    )}
                    {product.form && (
                      <div>
                        <h4 className="font-semibold mb-1">Form</h4>
                        <p className="text-gray-700">{product.form}</p>
                      </div>
                    )}
                    {product.shelfLife && (
                      <div>
                        <h4 className="font-semibold mb-1">Shelf Life</h4>
                        <p className="text-gray-700">{product.shelfLife}</p>
                      </div>
                    )}
                    {product.storageConditions && (
                      <div>
                        <h4 className="font-semibold mb-1">Storage</h4>
                        <p className="text-gray-700">{product.storageConditions}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="specs" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Technical Specifications</CardTitle>
                  <CardDescription>Detailed technical and chemical specifications</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {product.physicalAppearance && (
                      <div>
                        <h4 className="font-semibold mb-1">Physical Appearance</h4>
                        <p className="text-gray-700">{product.physicalAppearance}</p>
                      </div>
                    )}
                    {product.mesh && (
                      <div>
                        <h4 className="font-semibold mb-1">Mesh Size</h4>
                        <p className="text-gray-700">{product.mesh}</p>
                      </div>
                    )}
                    {product.moisture && (
                      <div>
                        <h4 className="font-semibold mb-1">Moisture Content</h4>
                        <p className="text-gray-700">{product.moisture}</p>
                      </div>
                    )}
                    {product.totalAsh && (
                      <div>
                        <h4 className="font-semibold mb-1">Total Ash</h4>
                        <p className="text-gray-700">{product.totalAsh}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="documents" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Documents & Certificates</CardTitle>
                  <CardDescription>Download product certificates and technical documents</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Button variant="outline" className="w-full justify-start">
                      <Download className="w-4 h-4 mr-2" />
                      Certificate of Analysis (COA)
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Download className="w-4 h-4 mr-2" />
                      Technical Data Sheet
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Download className="w-4 h-4 mr-2" />
                      Safety Data Sheet (SDS)
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Download className="w-4 h-4 mr-2" />
                      Organic Certificate
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="applications" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Applications & Uses</CardTitle>
                  <CardDescription>Common applications and industry uses</CardDescription>
                </CardHeader>
                <CardContent>
                  {product.applications ? (
                    <p className="text-gray-700">{product.applications}</p>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-gray-700">• Dietary supplements and nutraceuticals</p>
                      <p className="text-gray-700">• Food and beverage industry</p>
                      <p className="text-gray-700">• Cosmetic and personal care products</p>
                      <p className="text-gray-700">• Traditional medicine formulations</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="packaging" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Packaging Information</CardTitle>
                  <CardDescription>Available packaging options and specifications</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {product.packagingOptions ? (
                      <p className="text-gray-700">{product.packagingOptions}</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-semibold mb-1">Standard Packaging</h4>
                          <p className="text-gray-700">25kg multi-wall paper bags</p>
                        </div>
                        <div>
                          <h4 className="font-semibold mb-1">Bulk Packaging</h4>
                          <p className="text-gray-700">500kg to 1000kg super sacks</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="faqs" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Frequently Asked Questions</CardTitle>
                  <CardDescription>Common questions about this product</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-1">What is the minimum order quantity?</h4>
                      <p className="text-gray-700">{product.moq || "Please contact us for MOQ information."}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">What certifications do you provide?</h4>
                      <p className="text-gray-700">We provide organic certificates, COA, and other industry-standard certifications.</p>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">What are the shipping options?</h4>
                      <p className="text-gray-700">We offer worldwide shipping with various options including air freight and sea freight.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Fixed Bottom CTA for Mobile */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t p-4 z-50">
          <div className="flex gap-3">
            <Button className="flex-1 bg-green-600 hover:bg-green-700">
              <MessageCircle className="w-4 h-4 mr-2" />
              Get Quote
            </Button>
            <Button variant="outline">
              <Phone className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Bottom spacing for mobile fixed CTA */}
        <div className="lg:hidden h-20"></div>
      </div>
    </div>
  );
}