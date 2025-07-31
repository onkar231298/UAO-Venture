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
        "availability": product.currentStock && Number(product.currentStock) > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
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

  const currentImage = product.mainImage || (product.galleryImages as string[])?.[0];

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
                {product.currentStock && Number(product.currentStock) > 0 ? (
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
                    isAuthenticated={isAuthenticated}
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
                      {product.plantPart && (
                        <div><span className="font-medium">Plant Part:</span> {product.plantPart}</div>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Quality & Standards</h4>
                    <div className="space-y-2 text-sm">
                      {product.productGrade && (
                        <div><span className="font-medium">Grade:</span> {product.productGrade}</div>
                      )}
                      {product.curcuminContent && (
                        <div><span className="font-medium">Active Content:</span> {product.curcuminContent}</div>
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
                <SampleRequestForm product={product} isAuthenticated={isAuthenticated} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      <Footer />
    </div>
  );
}
