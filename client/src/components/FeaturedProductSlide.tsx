import { Link } from "wouter";
import { ArrowUpRight, Leaf, MapPin, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import InquiryForm from "@/components/InquiryForm";
import OptimizedImage from "@/components/OptimizedImage";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useCustomerAuth } from "@/hooks/useCustomerAuth";
import { formatPrice, getProductPrice } from "@/lib/currencyUtils";
import type { Product } from "@shared/schema";
import CustomerFavoriteButton from "@/components/CustomerFavoriteButton";

export interface FeaturedProduct {
  id: number;
  name: string;
  slug: string;
  productId: string;
  description?: string | null;
  productType?: string | null;
  botanicalName?: string | null;
  origin?: string | null;
  priceUSD?: string | number | null;
  priceINR?: string | number | null;
  priceEUR?: string | number | null;
  priceGBP?: string | number | null;
  priceUnit?: string | null;
  moq?: string | number | null;
  mainImage?: string | null;
  mainImageMedium?: string | null;
  mainImageThumbnail?: string | null;
  imageUrl?: string | null;
  galleryImages?: string[] | null;
}

interface FeaturedProductSlideProps {
  product: FeaturedProduct;
  index: number;
  total: number;
}

const productTypeLabels: Record<string, string> = {
  organic: "Organic",
  natural: "Natural",
  conventional: "Conventional",
  synthetic: "Synthetic",
  nature_identical: "Nature Identical",
  other: "Other",
};

function getProductTypeLabel(productType?: string | null) {
  if (!productType?.trim()) return null;
  return productTypeLabels[productType] ?? productType.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getDescriptionExcerpt(description?: string | null) {
  if (!description?.trim()) return null;
  const plainText = description.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  if (!plainText) return null;
  return plainText.length > 250 ? `${plainText.slice(0, 247).trimEnd()}…` : plainText;
}

export default function FeaturedProductSlide({ product, index, total }: FeaturedProductSlideProps) {
  const { currency } = useCurrency();
  const { customer, isCustomerAuthenticated } = useCustomerAuth();
  const galleryImages = product.galleryImages;
  const productImage =
    product.mainImageMedium ||
    product.mainImageThumbnail ||
    product.mainImage ||
    product.imageUrl ||
    (galleryImages?.length ? galleryImages[0] : null);
  const price = getProductPrice(product, currency);
  const description = getDescriptionExcerpt(product.description);
  const productType = getProductTypeLabel(product.productType);
  const orderMinimum = product.moq !== null && product.moq !== undefined && String(product.moq).trim() !== ""
    ? `${product.moq} ${product.priceUnit || "kg"}`
    : null;

  return (
    <article
      className="featured-product-slide"
      aria-roledescription="slide"
      aria-label={`${product.name}, product ${index + 1} of ${total}`}
    >
      <div className="featured-product-media">
        <div className="featured-product-image-orbit" aria-hidden="true" />
        {productType && (
          <span className="featured-product-type">
            <Leaf aria-hidden="true" />
            {productType}
          </span>
        )}
        <CustomerFavoriteButton
          productId={product.id}
          productName={product.name}
          className="featured-product-wishlist"
          iconClassName="h-5 w-5"
        />
        <Link
          href={`/products/${product.slug}`}
          className="featured-product-image-link"
          aria-label={`View ${product.name}`}
        >
          {productImage ? (
            <OptimizedImage
              src={productImage}
              alt={product.name}
              className="featured-product-image"
              lazy={false}
              priority
              placeholder={
                <div className="featured-product-image-fallback">
                  <Leaf aria-hidden="true" />
                  <span>Loading product image</span>
                </div>
              }
            />
          ) : (
            <div className="featured-product-image-fallback">
              <Leaf aria-hidden="true" />
              <span>No Preview Available</span>
            </div>
          )}
        </Link>
        <span className="featured-product-photo-note">Current product image</span>
      </div>

      <div className="featured-product-copy">
        <p className="featured-product-kicker">
          <span className="featured-product-kicker-line" />
          Featured ingredient
        </p>
        <Link href={`/products/${product.slug}`} className="featured-product-name-link">
          <h3 className="featured-product-name">{product.name}</h3>
          <ArrowUpRight aria-hidden="true" />
        </Link>
        {description && <p className="featured-product-description">{description}</p>}

        <dl className="featured-product-facts">
          {product.botanicalName && (
            <div className="featured-product-fact featured-product-fact-botanical">
              <dt>Botanical name</dt>
              <dd className="featured-product-botanical">{product.botanicalName}</dd>
            </div>
          )}
          {product.origin && (
            <div className="featured-product-fact">
              <dt><MapPin aria-hidden="true" /> Origin</dt>
              <dd>{product.origin}</dd>
            </div>
          )}
          <div className="featured-product-fact">
            <dt>SKU</dt>
            <dd>{product.productId}</dd>
          </div>
          <div className="featured-product-fact">
            <dt>Price</dt>
            <dd className="featured-product-price">
              {price !== null ? formatPrice(price, currency) : "Contact for Price"}
              {price !== null && <span> per {product.priceUnit || "kg"}</span>}
            </dd>
          </div>
          {orderMinimum && (
            <div className="featured-product-fact">
              <dt>Minimum order</dt>
              <dd>{orderMinimum}</dd>
            </div>
          )}
        </dl>

        <div className="featured-product-actions">
          <Link href={`/products/${product.slug}`} className="featured-product-detail-action">
            View product <ArrowUpRight aria-hidden="true" />
          </Link>
          <Dialog>
            <DialogTrigger asChild>
              <Button type="button" className="featured-product-quote-action">
                <MessageSquare aria-hidden="true" />
                Get Quote
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Request Quote for {product.name}</DialogTitle>
              </DialogHeader>
              <InquiryForm
                product={product as unknown as Product}
                isCustomerAuthenticated={isCustomerAuthenticated}
                customerData={customer}
              />
            </DialogContent>
          </Dialog>
          <button type="button" className="featured-product-sample-action">
            Sample
          </button>
        </div>
      </div>
    </article>
  );
}
