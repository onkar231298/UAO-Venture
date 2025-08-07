import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useCustomerAuth } from "@/hooks/useCustomerAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/Header";
import { CheckCircle, FileText, ShoppingCart, Heart, Share2, ChevronLeft, ChevronRight } from "lucide-react";
import FrequentlyBoughtTogether from "@/components/FrequentlyBoughtTogether";
import RelatedProductsCarousel from "@/components/RelatedProductsCarousel";

// Types
interface Product {
  id: number;
  productId: string;
  name: string;
  description: string;
  botanicalName?: string;
  mainImage?: string;
  mainImageLarge?: string;
  mainImageMedium?: string;
  galleryImages?: string[];
  certifications?: string[];
  tags?: string[];
  seoTitle?: string;
  seoDescription?: string;
  additionalDocs?: string[];
}

interface ProductDocument {
  id: number;
  name: string;
  url?: string;
}

export default function ProductDetailBFI() {
  // Get URL parameter
  const { slug } = useParams<{ slug: string }>();
  console.log("ProductDetailBFI component starting to render...");
  console.log("Product slug from URL:", slug);

  // Early return for missing slug - before any hooks
  if (!slug) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Invalid Product URL</h1>
          <p className="text-gray-600">No product identifier found in URL.</p>
        </div>
      </div>
    );
  }

  // ALL HOOKS DECLARED HERE - NO CONDITIONAL HOOKS
  const { user, isAuthenticated } = useAuth() as { user: any; isAuthenticated: boolean };
  const { customer, isCustomerAuthenticated } = useCustomerAuth();
  const { toast } = useToast();
  const [selectedQuantity, setSelectedQuantity] = useState(25);
  const [totalPrice, setTotalPrice] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Product query
  const { data: product, isLoading, error } = useQuery<Product>({
    queryKey: ["/api/products/slug", slug],
    queryFn: async () => {
      console.log("Fetching product for slug:", slug);
      const response = await fetch(`/api/products/slug/${slug}`);
      if (!response.ok) {
        throw new Error(`Product not found: ${response.status}`);
      }
      const data = await response.json();
      console.log("Product data received:", data);
      return data;
    },
    enabled: !!slug,
  });

  // Documents query
  const { data: documents } = useQuery<ProductDocument[]>({
    queryKey: ["/api/products", product?.id, "documents"],
    enabled: !!product?.id,
  });

  // FAQs query
  const { data: faqs } = useQuery<{ question: string; answer: string; }[]>({
    queryKey: ["/api/products", product?.id, "faqs"],
    enabled: !!product?.id,
  });

  // Related products queries
  const { data: frequentlyBoughtTogether } = useQuery<Product[]>({
    queryKey: ["/api/products", "related", product?.id],
    queryFn: async () => {
      const response = await fetch(`/api/products?limit=6`);
      if (!response.ok) throw new Error('Failed to fetch related products');
      const data = await response.json();
      return data.products || [];
    },
    enabled: !!product?.id,
  });

  const { data: youMightAlsoLike } = useQuery<Product[]>({
    queryKey: ["/api/products", "similar", product?.id],
    queryFn: async () => {
      const response = await fetch(`/api/products?limit=8`);
      if (!response.ok) throw new Error('Failed to fetch similar products');
      const data = await response.json();
      return data.products || [];
    },
    enabled: !!product?.id,
  });

  // Currency detection
  const { data: currencyData } = useQuery({
    queryKey: ['/api/detect-currency'],
    staleTime: 1000 * 60 * 30, // 30 minutes
  });

  // Currency values
  const currency = currencyData?.currency || 'INR';
  const countryCode = currencyData?.countryCode || 'IN';

  // Helper functions
  const handleQuantityChange = (quantity: number, price: number, discountPercent: number) => {
    setSelectedQuantity(quantity);
    setTotalPrice(price);
    setDiscount(discountPercent);
  };

  const getAllImages = () => {
    if (!product) return [];
    
    const images = [];
    const mainImage = product.mainImageMedium || product.mainImageLarge || product.mainImage;
    if (mainImage) {
      images.push(mainImage);
    }
    
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

  const nextImage = () => {
    setCurrentImageIndex((prevIndex) => 
      prevIndex === allImages.length - 1 ? 0 : prevIndex + 1
    );
  };

  const prevImage = () => {
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

  // Effects - ALL DECLARED AFTER STATE AND QUERIES
  useEffect(() => {
    if (allImages.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => 
        prevIndex === allImages.length - 1 ? 0 : prevIndex + 1
      );
    }, 3000);

    return () => clearInterval(interval);
  }, [allImages.length]);

  useEffect(() => {
    if (product) {
      if (document.title === 'Vite + React + TS') {
        document.title = product.seoTitle || `${product.name} - BFI Organic`;
      }
      
      let metaDescription = document.querySelector('meta[name="description"]');
      if (!metaDescription || metaDescription.getAttribute('content') === '') {
        if (!metaDescription) {
          metaDescription = document.createElement('meta');
          metaDescription.setAttribute('name', 'description');
          document.head.appendChild(metaDescription);
        }
        metaDescription.setAttribute('content', product.seoDescription || product.description || `High-quality ${product.name} from BFI Organic`);
      }
    }
  }, [product]);

  console.log("Query state:", { isLoading, error: error?.message, hasProduct: !!product });

  // CONDITIONAL RENDERING - AFTER ALL HOOKS
  if (isLoading) {
    console.log("Product is loading...");
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading product details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    console.error("Product fetch error:", error);
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Product</h1>
          <p className="text-gray-600 mb-4">There was an error loading the product: {(error as Error).message}</p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </div>
    );
  }

  if (!product) {
    console.log("Product not found - no data returned");
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h1>
          <p className="text-gray-600">The product you're looking for doesn't exist or has been removed.</p>
        </div>
      </div>
    );
  }

  console.log("Rendering product page for:", product.name);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <span>Home</span>
            <span>/</span>
            <span>Products</span>
            <span>/</span>
            <span className="text-gray-900 font-medium">{product.name}</span>
          </div>
        </div>

        {/* Main Product Section */}
        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="relative aspect-square bg-gray-100 rounded-xl overflow-hidden">
              {currentImage ? (
                <img
                  src={currentImage}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  No image available
                </div>
              )}
              
              {allImages.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-md"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-md"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>

            {/* Image thumbnails */}
            {allImages.length > 1 && (
              <div className="flex space-x-2 overflow-x-auto">
                {allImages.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 ${
                      index === currentImageIndex ? 'border-orange-500' : 'border-gray-200'
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
              {product.botanicalName && (
                <p className="text-sm text-gray-600 italic">Botanical Name: {product.botanicalName}</p>
              )}
              <p className="text-gray-600 mb-4">SKU#: {product.productId}</p>
            </div>

            {/* Certifications & Tags */}
            <div className="flex flex-wrap gap-2">
              {product.certifications && Array.isArray(product.certifications) && 
                (product.certifications as string[]).map((cert: string, index: number) => (
                  <Badge key={`cert-${index}`} variant="outline" className="text-xs">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    {cert}
                  </Badge>
                ))}
              {product.tags && Array.isArray(product.tags) && product.tags.length > 0 && product.tags.map((tag: string, index: number) => (
                <Badge key={`tag-${index}`} variant="secondary" className="text-xs bg-green-100 text-green-800 border-green-200">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  {tag}
                </Badge>
              ))}
            </div>

            {/* Description */}
            <div>
              <h3 className="text-lg font-semibold mb-2">Description</h3>
              <p className="text-gray-700 leading-relaxed">{product.description}</p>
            </div>

            {/* Documents */}
            {documents && documents.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Documents</h3>
                <div className="space-y-2">
                  {documents.map((doc) => (
                    <Button 
                      key={doc.id}
                      variant="ghost" 
                      size="sm" 
                      className="w-full justify-start text-xs h-8"
                      onClick={() => doc.url && window.open(doc.url, '_blank')}
                    >
                      <FileText className="w-3 h-3 mr-2" />
                      {doc.name} <span className="text-blue-600 ml-auto">
                        {doc.url ? 'Download PDF' : 'Not Available'}
                      </span>
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <Button size="lg" className="flex-1">
                <ShoppingCart className="w-5 h-5 mr-2" />
                Request Quote
              </Button>
              <Button variant="outline" size="lg">
                <Heart className="w-5 h-5" />
              </Button>
              <Button variant="outline" size="lg" onClick={copyProductName}>
                <Share2 className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* FAQs */}
        {faqs && faqs.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6">Frequently Asked Questions</h2>
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-2">{faq.question}</h3>
                  <p className="text-gray-700">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Frequently Bought Together */}
        {frequentlyBoughtTogether && frequentlyBoughtTogether.length > 0 && (
          <div className="mb-12">
            <FrequentlyBoughtTogether 
              products={frequentlyBoughtTogether}
              currency={currency}
              countryCode={countryCode}
            />
          </div>
        )}

        {/* You Might Also Like */}
        {youMightAlsoLike && youMightAlsoLike.length > 0 && (
          <div className="mb-12">
            <RelatedProductsCarousel 
              products={youMightAlsoLike}
              currency={currency}
              countryCode={countryCode}
            />
          </div>
        )}
      </div>
    </div>
  );
}