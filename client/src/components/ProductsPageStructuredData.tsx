import { useEffect } from 'react';
import type { Product } from '@shared/schema';

interface ProductsPageStructuredDataProps {
  products?: Product[];
}

export default function ProductsPageStructuredData({ products }: ProductsPageStructuredDataProps) {
  useEffect(() => {
    const baseUrl = window.location.origin;

    // Remove existing structured data scripts
    const existingScripts = document.querySelectorAll('script[type="application/ld+json"]');
    existingScripts.forEach(script => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    });

    // Organization Schema
    const organizationSchema = {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "Bright Fame Organic Pvt. Ltd.",
      "alternateName": "BFI Organic",
      "url": baseUrl,
      "logo": `${baseUrl}/bfi-logo.png`,
      "description": "Leading supplier of certified organic ingredients, spices, herbs, and botanical extracts for B2B customers worldwide."
    };

    // Breadcrumb Schema for Products Page
    const breadcrumbSchema = {
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
        }
      ]
    };

    // Collection Page Schema for Products Listing
    const collectionPageSchema = {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "name": "Organic Ingredients & Natural Products",
      "description": "Browse our comprehensive collection of certified organic ingredients, herbal extracts, and natural products for B2B customers.",
      "url": `${baseUrl}/products`,
      "mainEntity": {
        "@type": "ItemList",
        "name": "Organic Products Catalog",
        "description": "Complete catalog of organic ingredients and natural products",
        "numberOfItems": products?.length || 0,
        ...(products && products.length > 0 && {
          "itemListElement": products.slice(0, 10).map((product, index) => ({
            "@type": "ListItem",
            "position": index + 1,
            "item": {
              "@type": "Product",
              "name": product.name,
              "description": product.description || `High-quality ${product.name}`,
              "sku": product.productId,
              "url": `${baseUrl}/product/${product.slug}`,
              "image": product.mainImage,
              "brand": {
                "@type": "Brand",
                "name": "BFI Organic"
              },
              "offers": {
                "@type": "Offer",
                "priceCurrency": "USD",
                "price": product.priceUSD || 0,
                "availability": product.currentStock && parseFloat(product.currentStock.toString()) > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"
              }
            }
          }))
        })
      }
    };

    // Inject schemas into page head
    const schemas = [
      { id: 'organization-schema', data: organizationSchema },
      { id: 'breadcrumb-schema', data: breadcrumbSchema },
      { id: 'collection-page-schema', data: collectionPageSchema }
    ];

    schemas.forEach(({ id, data }) => {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.id = id;
      script.textContent = JSON.stringify(data, null, 2);
      document.head.appendChild(script);
    });

    // Cleanup function
    return () => {
      schemas.forEach(({ id }) => {
        const script = document.getElementById(id);
        if (script && script.parentNode) {
          script.parentNode.removeChild(script);
        }
      });
    };
  }, [products]);

  // This component doesn't render anything visible
  return null;
}