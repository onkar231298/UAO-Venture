import { useEffect } from 'react';
import type { Product } from '@shared/schema';

interface StructuredDataProps {
  product: Product;
  faqs?: Array<{ question: string; answer: string }>;
}

export default function StructuredData({ product, faqs }: StructuredDataProps) {
  useEffect(() => {
    if (!product) return;

    const baseUrl = window.location.origin;
    const productUrl = `${baseUrl}/product/${product.slug}`;
    const imageUrl = product.mainImage?.startsWith('http') ? product.mainImage : `${baseUrl}${product.mainImage}`;

    // Remove existing structured data scripts
    const existingScripts = document.querySelectorAll('script[type="application/ld+json"]');
    existingScripts.forEach(script => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    });

    // Product Schema
    const productSchema = {
      "@context": "https://schema.org/",
      "@type": "Product",
      "name": product.name,
      "description": product.description || `High-quality ${product.name} from Atlas Ingredients`,
      "sku": product.productId,
      "mpn": product.productId,
      "brand": {
        "@type": "Brand",
        "name": "Atlas Ingredients",
        "url": baseUrl
      },
      "manufacturer": {
        "@type": "Organization",
        "name": "Atlas Ingredients",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "Opp. Murlidhar Guest House, Mehsana-Vishnagar Road, Kansarakui",
          "addressLocality": "Mehsana",
          "addressRegion": "Gujarat",
          "postalCode": "384001",
          "addressCountry": "IN"
        },
        "telephone": "+91-7249847439",
        "url": baseUrl,
        "email": "admin@bright-organic.com"
      },
      "image": imageUrl,
      "url": productUrl,
      "category": product.healthSupport || "Organic Ingredients",
      "offers": {
        "@type": "Offer",
        "priceCurrency": "USD",
        "price": product.priceUSD || product.rate || 0,
        "priceValidUntil": new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        "availability": product.currentStock && parseFloat(product.currentStock.toString()) > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        "itemCondition": "https://schema.org/NewCondition",
        "seller": {
          "@type": "Organization",
          "name": "Atlas Ingredients",
          "url": baseUrl
        },
        "acceptedPaymentMethod": [
          "https://schema.org/CreditCard",
          "https://schema.org/BankTransferInAdvance",
          "https://schema.org/CheckInAdvance"
        ]
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
        ...(product.hsCode ? [{
          "@type": "PropertyValue",
          "name": "HS Code", 
          "value": product.hsCode
        }] : [])
      ],
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.8",
        "reviewCount": "127",
        "bestRating": "5",
        "worstRating": "1"
      },
      "keywords": [
        product.name.toLowerCase(),
        product.botanicalName?.toLowerCase(),
        "organic ingredients",
        "bulk supplier",
        "pharmaceutical grade",
        "wholesale",
        product.origin?.toLowerCase(),
        ...(product.healthSupport ? [product.healthSupport.toLowerCase()] : [])
      ].filter(Boolean).join(", ")
    };

    // Breadcrumb Schema
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
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": product.name,
          "item": productUrl
        }
      ]
    };

    // FAQ Schema (if FAQs exist)
    const faqSchema = faqs && faqs.length > 0 ? {
      "@context": "https://schema.org/",
      "@type": "FAQPage",
      "mainEntity": faqs.map(faq => ({
        "@type": "Question",
        "name": faq.question,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": faq.answer
        }
      }))
    } : null;

    // Organization Schema
    const organizationSchema = {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "Atlas Ingredients",
      "alternateName": "Atlas Ingredients",
      "url": baseUrl,
      "logo": `${baseUrl}/atlas-ingredients-logo.svg`,
      "image": `${baseUrl}/atlas-ingredients-logo.svg`,
      "description": "Leading supplier of certified organic ingredients, spices, herbs, and botanical extracts for B2B customers worldwide.",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "Opp. Murlidhar Guest House, Mehsana-Vishnagar Road, Kansarakui",
        "addressLocality": "Mehsana",
        "addressRegion": "Gujarat",
        "postalCode": "384001",
        "addressCountry": "IN"
      },
      "contactPoint": [
        {
          "@type": "ContactPoint",
          "telephone": "+91-7249847439",
          "contactType": "customer service",
          "email": "admin@bright-organic.com",
          "availableLanguage": ["English", "Hindi"],
          "areaServed": ["IN", "US", "CA", "GB", "EU", "CN", "JP", "KR"]
        },
        {
          "@type": "ContactPoint",
          "contactType": "sales",
          "email": "admin@bright-organic.com",
          "availableLanguage": ["English"],
          "areaServed": "Worldwide"
        }
      ],
      "sameAs": [
        "https://www.linkedin.com/company/bright-fame-organic",
        "https://www.facebook.com/brightfameorganic",
        "https://twitter.com/brightfameorg"
      ],
      "hasOfferCatalog": {
        "@type": "OfferCatalog",
        "name": "Organic Ingredients Catalog",
        "itemListElement": [
          {
            "@type": "OfferCatalog",
            "name": "Adaptogenic Herbs"
          },
          {
            "@type": "OfferCatalog", 
            "name": "Culinary Spices"
          },
          {
            "@type": "OfferCatalog",
            "name": "Herbal Extracts"
          }
        ]
      },
      "makesOffer": {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "Bulk Organic Ingredients Supply",
          "description": "Global B2B supply of certified organic ingredients"
        },
        "areaServed": ["US", "CA", "GB", "EU", "IN", "CN", "JP", "KR"]
      }
    };

    // Inject schemas into page head
    const schemas = [
      { id: 'product-schema', data: productSchema },
      { id: 'breadcrumb-schema', data: breadcrumbSchema },
      { id: 'organization-schema', data: organizationSchema },
      ...(faqSchema ? [{ id: 'faq-schema', data: faqSchema }] : [])
    ];

    schemas.forEach(({ id, data }) => {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.id = id;
      script.textContent = JSON.stringify(data, null, 2);
      document.head.appendChild(script);
    });

    // Update page meta tags
    document.title = product.seoTitle || `${product.name} - Atlas Ingredients`;
    
    // Update meta description
    let metaDescription = document.querySelector('meta[name="description"]') as HTMLMetaElement;
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.name = 'description';
      document.head.appendChild(metaDescription);
    }
    metaDescription.content = product.seoDescription || product.description || `High-quality ${product.name} from Atlas Ingredients`;

    // Update Open Graph tags
    const ogTags = [
      { property: 'og:title', content: product.seoTitle || `${product.name} - Atlas Ingredients` },
      { property: 'og:description', content: product.seoDescription || product.description || `High-quality ${product.name} from Atlas Ingredients` },
      { property: 'og:image', content: imageUrl },
      { property: 'og:url', content: productUrl },
      { property: 'og:type', content: 'product' },
      { property: 'product:brand', content: 'Atlas Ingredients' },
      { property: 'product:availability', content: product.currentStock && parseFloat(product.currentStock.toString()) > 0 ? 'in stock' : 'out of stock' },
      { property: 'product:condition', content: 'new' },
      { property: 'product:price:amount', content: (product.priceUSD || product.rate || 0).toString() },
      { property: 'product:price:currency', content: 'USD' }
    ];

    ogTags.forEach(({ property, content }) => {
      let tag = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement;
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute('property', property);
        document.head.appendChild(tag);
      }
      tag.content = content;
    });

    // Update Twitter Card tags
    const twitterTags = [
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: product.seoTitle || `${product.name} - Atlas Ingredients` },
      { name: 'twitter:description', content: product.seoDescription || product.description || `High-quality ${product.name} from Atlas Ingredients` },
      { name: 'twitter:image', content: imageUrl }
    ];

    twitterTags.forEach(({ name, content }) => {
      let tag = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement;
      if (!tag) {
        tag = document.createElement('meta');
        tag.name = name;
        document.head.appendChild(tag);
      }
      tag.content = content;
    });

    // Add canonical URL
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = productUrl;

    // Cleanup function
    return () => {
      schemas.forEach(({ id }) => {
        const script = document.getElementById(id);
        if (script && script.parentNode) {
          script.parentNode.removeChild(script);
        }
      });
    };
  }, [product, faqs]);

  // This component doesn't render anything visible
  return null;
}