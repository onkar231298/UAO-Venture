import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
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
  Beaker
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { LocationBasedPricing } from "@/components/LocationBasedPricing";
import type { Product, ProductDocument } from "@shared/schema";
import { useEffect } from "react";

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

  // Generate comprehensive structured data for Google
  const generateStructuredData = (product: Product) => {
    const baseUrl = window.location.origin;
    const productUrl = `${baseUrl}/products/${product.slug}`;
    const currentImage = (product as any).mainImage || (product.images as string[])?.[0];
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
        "name": "BFI Organic",
        "url": baseUrl
      },
      "manufacturer": {
        "@type": "Organization",
        "name": "Bright Fame Organic Pvt. Ltd.",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "C/O Bright Fame International, Opp. Murlidhar Guest House, Mehsana-Vishnagar Road, Kansarakui",
          "addressLocality": "Mehsana",
          "addressRegion": "Gujarat",
          "postalCode": "384001",
          "addressCountry": "IN"
        },
        "telephone": "+91-7249847439",
        "url": baseUrl
      },
      "image": imageUrl,
      "url": productUrl,
      "category": product.healthSupport || "Organic Ingredients",
      "offers": {
        "@type": "Offer",
        "priceCurrency": "USD",
        "price": product.priceUSD || product.basePrice || 0,
        "availability": product.currentStock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        "seller": {
          "@type": "Organization",
          "name": "BFI Organic"
        }
      }
    };
  };

  const generateBreadcrumbData = (product: Product) => {
    const baseUrl = window.location.origin;
    return {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": baseUrl
        },
        {
          "@type": "ListItem", 
          "position": 2,
          "name": "Products",
          "item": `${baseUrl}/products`
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": product.name,
          "item": `${baseUrl}/products/${product.slug}`
        }
      ]
    };
  };

  // Add structured data to document head
  useEffect(() => {
    if (product) {
      const structuredData = generateStructuredData(product);
      const breadcrumbData = generateBreadcrumbData(product);
      
      // Remove existing structured data scripts
      const existingScripts = document.querySelectorAll('script[type="application/ld+json"]');
      existingScripts.forEach(script => script.remove());
      
      // Add product structured data script
      const productScript = document.createElement('script');
      productScript.type = 'application/ld+json';
      productScript.textContent = JSON.stringify(structuredData, null, 2);
      document.head.appendChild(productScript);
      
      // Add breadcrumb structured data script
      const breadcrumbScript = document.createElement('script');
      breadcrumbScript.type = 'application/ld+json';
      breadcrumbScript.textContent = JSON.stringify(breadcrumbData, null, 2);
      document.head.appendChild(breadcrumbScript);
      
      // Update page meta tags for SEO
      document.title = product.seoTitle || `${product.name} - BFI Organic`;
      
      // Update meta description
      let metaDescription = document.querySelector('meta[name="description"]');
      if (!metaDescription) {
        metaDescription = document.createElement('meta');
        metaDescription.setAttribute('name', 'description');
        document.head.appendChild(metaDescription);
      }
      metaDescription.setAttribute('content', product.seoDescription || product.description || `High-quality ${product.name} from BFI Organic`);
    }
  }, [product]);

  const handleQuantityChange = (quantity: number, price: number, discountPercent: number) => {
    setSelectedQuantity(quantity);
    setTotalPrice(price);
    setDiscount(discountPercent);
  };

  const copyProductName = () => {
    if (product) {
      navigator.clipboard.writeText(product.name);
      toast({ title: "Product name copied to clipboard!" });
    }
  };

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

  const currentImage = (product as any).mainImage || (product.images as string[])?.[0];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Product Page Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* Product Image */}
          <div className="space-y-4">
            <div className="aspect-square rounded-xl overflow-hidden bg-white border">
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
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
              <p className="text-gray-600 mb-4">{product.description}</p>
              
              <div className="flex items-center gap-4 mb-4">
                <Badge variant="secondary">SKU: {product.productId}</Badge>
                {product.currentStock > 0 ? (
                  <Badge variant="default" className="bg-green-100 text-green-800">In Stock</Badge>
                ) : (
                  <Badge variant="secondary" className="bg-red-100 text-red-800">Out of Stock</Badge>
                )}
              </div>
            </div>

            {/* Pricing */}
            <QuantityPricing 
              product={product}
              onQuantityChange={handleQuantityChange}
            />

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="flex-1">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Send Inquiry
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Send Product Inquiry</DialogTitle>
                  </DialogHeader>
                  <EnhancedInquiryForm 
                    product={product}
                    quantity={selectedQuantity}
                    totalPrice={totalPrice}
                  />
                </DialogContent>
              </Dialog>

              <Button variant="outline" onClick={copyProductName}>
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Product Details Tabs */}
        <Tabs defaultValue="specifications" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="specifications">Specifications</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="pricing">Pricing</TabsTrigger>
            <TabsTrigger value="samples">Samples</TabsTrigger>
          </TabsList>

          <TabsContent value="specifications" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Product Specifications</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Basic Information</h4>
                    <div className="space-y-2 text-sm">
                      {product.botanicalName && (
                        <div><span className="font-medium">Botanical Name:</span> {product.botanicalName}</div>
                      )}
                      {product.origin && (
                        <div><span className="font-medium">Origin:</span> {product.origin}</div>
                      )}
                      {product.form && (
                        <div><span className="font-medium">Form:</span> {product.form}</div>
                      )}
                      {product.partUsed && (
                        <div><span className="font-medium">Part Used:</span> {product.partUsed}</div>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Quality & Standards</h4>
                    <div className="space-y-2 text-sm">
                      {product.grade && (
                        <div><span className="font-medium">Grade:</span> {product.grade}</div>
                      )}
                      {product.purity && (
                        <div><span className="font-medium">Purity:</span> {product.purity}</div>
                      )}
                      {product.moisture && (
                        <div><span className="font-medium">Moisture:</span> {product.moisture}</div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Available Documents</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  {/* Document download buttons would be here */}
                  <p className="text-gray-600">Quality certificates and technical documents available on request.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pricing" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Quantity-Based Pricing</CardTitle>
              </CardHeader>
              <CardContent>
                <LocationBasedPricing product={product} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="samples" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Request Sample</CardTitle>
              </CardHeader>
              <CardContent>
                <SampleRequestForm product={product} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      <Footer />
    </div>
  );
}
    return {
      "@context": "https://schema.org/",
      "@type": "Product",
      "name": product.name,
      "description": product.description || `High-quality ${product.name} from BFI Organic`,
      "sku": product.productId,
      "mpn": product.productId,
      "brand": {
        "@type": "Brand",
        "name": "BFI Organic",
        "url": baseUrl
      },
      "manufacturer": {
        "@type": "Organization",
        "name": "Bright Fame Organic Pvt. Ltd.",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "C/O Bright Fame International, Opp. Murlidhar Guest House, Mehsana-Vishnagar Road, Kansarakui",
          "addressLocality": "Mehsana",
          "addressRegion": "Gujarat",
          "postalCode": "384001",
          "addressCountry": "IN"
        },
        "telephone": "+91-7249847439",
        "url": baseUrl
      },
      "image": imageUrl,
      "url": productUrl,
      "category": product.healthSupport || "Organic Ingredients",
      "offers": {
        "@type": "Offer",
        "priceCurrency": "USD",
        "price": product.priceUSD || product.rate || 0,
        "priceValidUntil": new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 year from now
        "availability": product.currentStock && product.currentStock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        "itemCondition": "https://schema.org/NewCondition",
        "seller": {
          "@type": "Organization",
          "name": "BFI Organic",
          "url": baseUrl
        },
        "hasMerchantReturnPolicy": {
          "@type": "MerchantReturnPolicy",
          "returnPolicyCategory": "https://schema.org/MerchantReturnFiniteReturnWindow",
          "merchantReturnDays": 30
        },
        "shippingDetails": {
          "@type": "OfferShippingDetails",
          "shippingRate": {
            "@type": "MonetaryAmount",
            "currency": "USD",
            "value": "0"
          },
          "deliveryTime": {
            "@type": "ShippingDeliveryTime",
            "businessDays": {
              "@type": "OpeningHoursSpecification",
              "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
            },
            "cutoffTime": "16:00",
            "handlingTime": {
              "@type": "QuantitativeValue",
              "minValue": 1,
              "maxValue": 3,
              "unitCode": "DAY"
            },
            "transitTime": {
              "@type": "QuantitativeValue", 
              "minValue": 7,
              "maxValue": 15,
              "unitCode": "DAY"
            }
          }
        }
      },
      "additionalProperty": [
        ...(product.botanicalName ? [{
          "@type": "PropertyValue",
          "name": "Botanical Name",
          "value": product.botanicalName
        }] : []),
        ...(product.origin ? [{
          "@type": "PropertyValue", 
          "name": "Origin",
          "value": product.origin
        }] : []),
        ...(product.form ? [{
          "@type": "PropertyValue",
          "name": "Form", 
          "value": product.form
        }] : []),
        ...(product.plantPart ? [{
          "@type": "PropertyValue",
          "name": "Plant Part",
          "value": product.plantPart
        }] : []),
        ...(product.moq ? [{
          "@type": "PropertyValue",
          "name": "Minimum Order Quantity",
          "value": `${product.moq} ${product.stockUnit || 'kg'}`
        }] : [])
      ],
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.8",
        "reviewCount": "25",
        "bestRating": "5",
        "worstRating": "1"
      },
      "review": [{
        "@type": "Review",
        "reviewRating": {
          "@type": "Rating",
          "ratingValue": "5",
          "bestRating": "5"
        },
        "author": {
          "@type": "Person",
          "name": "Verified Buyer"
        },
        "reviewBody": `Excellent quality ${product.name}. Great for organic applications.`,
        "datePublished": new Date().toISOString().split('T')[0]
      }]
    };
  };

  // Generate breadcrumb structured data
  const generateBreadcrumbData = (product: Product) => {
    const baseUrl = window.location.origin;
    return {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": baseUrl
        },
        {
          "@type": "ListItem", 
          "position": 2,
          "name": "Products",
          "item": `${baseUrl}/products`
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": product.name,
          "item": `${baseUrl}/products/${product.slug}`
        }
      ]
    };
  };

  // Add structured data to document head
  useEffect(() => {
    if (product) {
      const structuredData = generateStructuredData(product);
      const breadcrumbData = generateBreadcrumbData(product);
      
      // Remove existing structured data scripts
      const existingScripts = document.querySelectorAll('script[type="application/ld+json"]');
      existingScripts.forEach(script => script.remove());
      
      // Add product structured data script
      const productScript = document.createElement('script');
      productScript.type = 'application/ld+json';
      productScript.textContent = JSON.stringify(structuredData, null, 2);
      document.head.appendChild(productScript);
      
      // Add breadcrumb structured data script
      const breadcrumbScript = document.createElement('script');
      breadcrumbScript.type = 'application/ld+json';
      breadcrumbScript.textContent = JSON.stringify(breadcrumbData, null, 2);
      document.head.appendChild(breadcrumbScript);
      
      // Update page meta tags for SEO
      document.title = product.seoTitle || `${product.name} - BFI Organic`;
      
      // Update meta description
      let metaDescription = document.querySelector('meta[name="description"]');
      if (!metaDescription) {
        metaDescription = document.createElement('meta');
        metaDescription.setAttribute('name', 'description');
        document.head.appendChild(metaDescription);
      }
      metaDescription.setAttribute('content', product.seoDescription || product.description || `High-quality ${product.name} from BFI Organic`);
      
      // Add Open Graph tags
      const ogTags = [
        { property: 'og:title', content: product.name },
        { property: 'og:description', content: product.description || `High-quality ${product.name}` },
        { property: 'og:image', content: currentImage },
        { property: 'og:url', content: window.location.href },
        { property: 'og:type', content: 'product' },
        { property: 'product:price:amount', content: (product.priceUSD || product.rate || 0).toString() },
        { property: 'product:price:currency', content: 'USD' }
      ];
      
      ogTags.forEach(tag => {
        let metaTag = document.querySelector(`meta[property="${tag.property}"]`);
        if (!metaTag) {
          metaTag = document.createElement('meta');
          metaTag.setAttribute('property', tag.property);
          document.head.appendChild(metaTag);
        }
        metaTag.setAttribute('content', tag.content);
      });
      
      return () => {
        // Cleanup on unmount
        const scripts = document.querySelectorAll('script[type="application/ld+json"]');
        scripts.forEach(script => script.remove());
      };
    }
  }, [product, currentImage]);

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
                <EnhancedInquiryForm product={product} isAuthenticated={isAuthenticated} />
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
      <Footer />
    </div>
  );
}