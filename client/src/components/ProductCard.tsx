import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import InquiryForm from "./InquiryForm";
import { SampleRequestForm } from "./SampleRequestForm";
import OptimizedImage from "./OptimizedImage";
import { useCurrency } from '@/contexts/CurrencyContext';
import { useCustomerAuth } from '@/hooks/useCustomerAuth';
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { isCustomerProductSaved, toggleCustomerSavedProduct } from "@/lib/customerSavedProducts";
import { getProductPrice, formatPrice } from '@/lib/currencyUtils';
import { Heart, MessageSquare, MapPin, PackageCheck } from "lucide-react";
import type { Product, ProductType } from "@shared/schema";
import { PrimaryProductType } from "./ProductTypeDisplay";

interface ProductCardProps {
  variant?: "default" | "catalog";
  product: Product & { primaryType?: ProductType | null };
}

export default function ProductCard({ product, variant = "default" }: ProductCardProps) {
  const { currency } = useCurrency();
  const { customer, isCustomerAuthenticated } = useCustomerAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSaved, setIsSaved] = useState(false);
  const isCatalog = variant === "catalog";

  useEffect(() => {
    const syncSavedState = () => {
      setIsSaved(customer?.id ? isCustomerProductSaved(customer.id, product.id) : false);
    };

    syncSavedState();
    const handleSavedProductsChanged = (event: Event) => {
      const detail = (event as CustomEvent<{ customerId?: string }>).detail;
      if (detail?.customerId === customer?.id) syncSavedState();
    };
    window.addEventListener("atlas-customer-saved-products-changed", handleSavedProductsChanged);
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === `atlas_customer_saved_products:${customer?.id}`) syncSavedState();
    };
    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("atlas-customer-saved-products-changed", handleSavedProductsChanged);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [customer?.id, product.id]);

  const handleSaveProduct = () => {
    if (!customer?.id || !isCustomerAuthenticated) {
      toast({
        title: "Sign in to save products",
        description: "Saved products are kept with your customer account on this browser.",
      });
      setLocation("/login");
      return;
    }

    try {
      const saved = toggleCustomerSavedProduct(customer.id, product);
      setIsSaved(saved);
      queryClient.invalidateQueries({ queryKey: ["customer-saved-products", customer.id] });
      toast({ title: saved ? "Product saved" : "Product removed from saved products" });
    } catch (error) {
      toast({
        title: "Could not save product",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    }
  };
  
  // Get the product image - prioritize WebP fields over legacy fields
  const galleryImages = product.galleryImages as string[] | null;
  const productImage = product.mainImageMedium || product.mainImageThumbnail || product.mainImage || (galleryImages && galleryImages.length > 0 ? galleryImages[0] : null);
  const hasImage = !!productImage;

  return (
    <Card className={isCatalog ? "catalog-product-card group" : "group hover:shadow-lg transition-all duration-200"}>
      <div className={isCatalog ? "catalog-product-visual" : "relative"}>
        <Link href={`/products/${product.slug}`} className="block">
          <div className={`relative overflow-hidden ${isCatalog ? "catalog-product-image" : "rounded-t-xl bg-gray-100"}`}>
            {hasImage ? (
              <OptimizedImage
                src={productImage}
                alt={product.name}
                className={isCatalog
                  ? "h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.035]"
                  : "w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-200"}
                lazy={true}
                placeholder={
                  <div className={isCatalog ? "catalog-image-placeholder animate-pulse" : "w-full aspect-square flex items-center justify-center bg-gray-100 text-gray-400 animate-pulse"}>
                    {isCatalog ? <span className="catalog-placeholder-rule" /> : <span className="text-xs sm:text-sm font-medium">Loading image</span>}
                  </div>
                }
              />
            ) : (
              <div className={isCatalog ? "catalog-image-placeholder" : "w-full aspect-square flex items-center justify-center bg-gray-100 text-gray-400"}>
                {isCatalog ? (
                  <span className="catalog-no-image-label">Image unavailable</span>
                ) : (
                  <span className="text-xs sm:text-sm font-medium">No preview available</span>
                )}
              </div>
            )}
            {product.primaryType && (
              <div className={isCatalog ? "absolute left-4 top-4" : "absolute top-1 sm:top-2 left-1 sm:left-2"}>
                <PrimaryProductType
                  types={[{...product.primaryType, isPrimary: true}]}
                  size="sm"
                  appearance={isCatalog ? "catalog" : "default"}
                  className={isCatalog ? "" : "shadow-sm"}
                />
              </div>
            )}
            {isCatalog && (
              <div className="catalog-image-index" aria-hidden="true">
                ATLAS / INGREDIENTS
              </div>
            )}
          </div>
        </Link>
        <div className={isCatalog ? "absolute right-4 top-4 z-10" : "absolute top-1 sm:top-2 right-1 sm:right-2"}>
          <Button
            size="sm"
            variant="secondary"
            aria-label={isSaved ? `Remove ${product.name} from saved products` : `Save ${product.name} to favorites`}
            aria-pressed={isSaved}
            onClick={handleSaveProduct}
            className={isCatalog
              ? `catalog-favorite-button h-10 w-10 rounded-full p-0 ${isSaved ? "text-rose-600" : ""}`
              : `h-6 w-6 sm:h-8 sm:w-8 p-0 ${isSaved ? "text-rose-600" : ""}`}
          >
            <Heart className={`${isCatalog ? "h-[18px] w-[18px]" : "w-3 h-3 sm:w-4 sm:h-4"} ${isSaved ? "fill-current text-rose-600" : ""}`} />
          </Button>
        </div>
      </div>

      <CardContent className={isCatalog ? "catalog-product-content" : "p-3 sm:p-4"}>
        <Link href={`/products/${product.slug}`} className="block">
          {isCatalog ? (
            <div className="catalog-product-heading">
              <div className="catalog-sku">SKU <span>{product.productId}</span></div>
              <h3 className="catalog-product-name">{product.name}</h3>
              {product.botanicalName && <p className="catalog-botanical">{product.botanicalName}</p>}
            </div>
          ) : (
            <div className="space-y-2">
              <h3 className="font-semibold text-gray-900 text-sm sm:text-base line-clamp-2">{product.name}</h3>
              <p className="text-xs sm:text-sm text-gray-600">SKU: {product.productId}</p>
              {product.botanicalName && <p className="text-xs text-gray-500 italic line-clamp-1">{product.botanicalName}</p>}
              {product.origin && <p className="text-xs sm:text-sm text-gray-600">Origin: {product.origin}</p>}
              <div className="flex justify-between items-center pt-2">
                <div>
                  <div className="text-lg font-bold text-green-600">
                    {(() => {
                      const price = getProductPrice(product, currency);
                      return price ? formatPrice(price, currency) : 'Contact for Price';
                    })()}
                  </div>
                  <div className="text-xs text-gray-500">per {product.priceUnit || 'kg'}</div>
                </div>
                {product.moq && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded whitespace-nowrap">MOQ: {product.moq} kg</span>}
              </div>
            </div>
          )}
        </Link>

        {isCatalog && (
          <>
            {(product.origin || product.moq) && (
              <div className="catalog-product-facts">
                {product.origin && (
                  <div className="catalog-fact">
                    <MapPin aria-hidden="true" />
                    <span><span className="catalog-fact-label">Origin</span>{product.origin}</span>
                  </div>
                )}
                {product.moq && (
                  <div className="catalog-fact">
                    <PackageCheck aria-hidden="true" />
                    <span><span className="catalog-fact-label">Minimum order</span>{product.moq} kg</span>
                  </div>
                )}
              </div>
            )}
            <div className="catalog-product-price">
              <div>
                <div className="catalog-price-value">
                  {(() => {
                    const price = getProductPrice(product, currency);
                    return price ? formatPrice(price, currency) : 'Contact for price';
                  })()}
                </div>
                <div className="catalog-price-unit">per {product.priceUnit || 'kg'}</div>
              </div>
            </div>
          </>
        )}
      </CardContent>

      <CardContent className={isCatalog ? "catalog-product-actions" : "px-3 sm:px-4 pb-3 sm:pb-4 pt-0"}>
        <div className={isCatalog ? "flex gap-2" : "flex space-x-2"}>
          <Dialog>
            <DialogTrigger asChild>
              <Button className={isCatalog
                ? "catalog-quote-button flex-1"
                : "flex-1 bg-green-600 hover:bg-green-700 text-xs sm:text-sm py-2"}>
                <MessageSquare className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Get Quote</span>
                <span className="sm:hidden">Quote</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Request Quote for {product.name}</DialogTitle>
              </DialogHeader>
              <InquiryForm 
                product={product} 
                isCustomerAuthenticated={isCustomerAuthenticated}
                customerData={customer}
              />
            </DialogContent>
          </Dialog>
          
          <SampleRequestForm
            product={product}
            isAuthenticated={isCustomerAuthenticated}
            customerData={customer}
            triggerLabel="Sample"
            triggerVariant="outline"
            triggerClassName={isCatalog ? "catalog-sample-button" : "text-sm"}
          />
        </div>
      </CardContent>
    </Card>
  );
}
