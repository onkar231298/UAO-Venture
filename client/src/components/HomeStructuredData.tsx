import { useEffect } from 'react';

export default function HomeStructuredData() {
  useEffect(() => {
    const baseUrl = window.location.origin;

    // Remove existing structured data scripts
    const existingScripts = document.querySelectorAll('script[type="application/ld+json"]');
    existingScripts.forEach(script => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    });

    // Organization Schema for Homepage with enhanced navigation signals
    const organizationSchema = {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "Bright Fame Organic Pvt. Ltd.",
      "alternateName": "Bright Fame Organic",
      "url": baseUrl,
      "logo": `${baseUrl}/bfi-logo.png`,
      "image": `${baseUrl}/bfi-logo.png`,
      "description": "Leading supplier of certified organic ingredients, spices, herbs, and botanical extracts for B2B customers worldwide. USDA and EU certified organic products from India.",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "C/O Bright Fame International, Opp. Murlidhar Guest House, Mehsana-Vishnagar Road, Kansarakui",
        "addressLocality": "Mehsana",
        "addressRegion": "Gujarat",
        "postalCode": "384001",
        "addressCountry": "IN"
      },
      "contactPoint": {
        "@type": "ContactPoint",
        "telephone": "+91-7249847439",
        "contactType": "customer service",
        "email": "admin@bright-organic.com",
        "availableLanguage": ["English", "Hindi"],
        "areaServed": ["US", "EU", "IN", "GB", "CA", "AU"]
      },
      "sameAs": [
        `${baseUrl}`,
        "https://www.linkedin.com/company/bright-fame-organic"
      ],
      "foundingDate": "2010",
      "numberOfEmployees": {
        "@type": "QuantitativeValue",
        "value": "50-100"
      },
      "vatID": "24AABCB1234A1ZX",
      "taxID": "AABCB1234A",
      "areaServed": {
        "@type": "Country",
        "name": ["United States", "India", "United Kingdom", "Germany", "France", "Canada", "Australia"]
      },
      "hasOfferCatalog": {
        "@type": "OfferCatalog",
        "name": "Organic Ingredients Catalog",
        "itemListElement": [
          {
            "@type": "OfferCatalog",
            "name": "Organic Herbs & Spices",
            "itemListElement": [
              {
                "@type": "Offer",
                "itemOffered": {
                  "@type": "Product",
                  "name": "Premium Organic Herbs"
                }
              }
            ]
          },
          {
            "@type": "OfferCatalog",
            "name": "Botanical Extracts",
            "itemListElement": [
              {
                "@type": "Offer",
                "itemOffered": {
                  "@type": "Product",
                  "name": "High-Quality Botanical Extracts"
                }
              }
            ]
          }
        ]
      },
      "subOrganization": [
        {
          "@type": "Organization",
          "name": "Bright Fame Organic - Food Ingredients Division",
          "url": `${baseUrl}/food-ingredients`
        },
        {
          "@type": "Organization",
          "name": "Bright Fame Organic - Organic Herbs Division",
          "url": `${baseUrl}/organic-herbs`
        }
      ]
    };

    // Website Schema with enhanced navigation
    const websiteSchema = {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "Bright Fame Organic - Premium B2B Organic Ingredients",
      "alternateName": "Bright Fame Organic",
      "url": baseUrl,
      "description": "Leading B2B marketplace for certified organic ingredients, herbs, spices, and botanical extracts. USDA and EU organic certified products from India.",
      "publisher": {
        "@type": "Organization",
        "name": "Bright Fame Organic Pvt. Ltd."
      },
      "potentialAction": {
        "@type": "SearchAction",
        "target": {
          "@type": "EntryPoint",
          "urlTemplate": `${baseUrl}/products?search={search_term_string}`
        },
        "query-input": "required name=search_term_string"
      }
    };

    // Site Navigation Element Schema - Helps Google understand site structure
    const siteNavigationSchema = {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "name": "Main Site Navigation",
      "description": "Primary navigation pages for Bright Fame Organic website",
      "itemListElement": [
        {
          "@type": "SiteNavigationElement",
          "position": 1,
          "name": "Products",
          "description": "Browse our comprehensive catalog of premium organic ingredients and natural products",
          "url": `${baseUrl}/products`
        },
        {
          "@type": "SiteNavigationElement",
          "position": 2,
          "name": "Ingredients",
          "description": "Explore organic ingredients by category - herbs, spices, extracts and more",
          "url": `${baseUrl}/ingredients`
        },
        {
          "@type": "SiteNavigationElement",
          "position": 3,
          "name": "About Us",
          "description": "Learn about Bright Fame Organic - 25+ years of organic ingredient expertise",
          "url": `${baseUrl}/about`
        },
        {
          "@type": "SiteNavigationElement",
          "position": 4,
          "name": "Certifications",
          "description": "View our USDA, EU Organic, ISO 22000, and quality certifications",
          "url": `${baseUrl}/certifications`
        },
        {
          "@type": "SiteNavigationElement",
          "position": 5,
          "name": "Contact Us",
          "description": "Get in touch with our organic ingredient experts for quotes and inquiries",
          "url": `${baseUrl}/contact`
        },
        {
          "@type": "SiteNavigationElement",
          "position": 6,
          "name": "Health Support",
          "description": "Find ingredients by health benefits - immune support, digestive health, and more",
          "url": `${baseUrl}/health-support`
        },
        {
          "@type": "SiteNavigationElement",
          "position": 7,
          "name": "Blog & Resources",
          "description": "Industry insights, certification guides, and organic ingredient education",
          "url": `${baseUrl}/blog`
        },
        {
          "@type": "SiteNavigationElement",
          "position": 8,
          "name": "Food Ingredients",
          "description": "Food-grade organic ingredients for manufacturers - EU certified and HACCP compliant",
          "url": `${baseUrl}/food-ingredients`
        }
      ]
    };

    // Breadcrumb Schema for Homepage
    const breadcrumbSchema = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": baseUrl
        }
      ]
    };

    // LocalBusiness Schema
    const localBusinessSchema = {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      "@id": `${baseUrl}#organization`,
      "name": "Bright Fame Organic Pvt. Ltd.",
      "image": `${baseUrl}/bfi-logo.png`,
      "telephone": "+91-7249847439",
      "email": "admin@bfiorganic.com",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "C/O Bright Fame International, Opp. Murlidhar Guest House, Mehsana-Vishnagar Road, Kansarakui",
        "addressLocality": "Mehsana",
        "addressRegion": "Gujarat",
        "postalCode": "384001",
        "addressCountry": "IN"
      },
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": 23.5880,
        "longitude": 72.3693
      },
      "url": baseUrl,
      "priceRange": "$$",
      "openingHours": "Mo-Sa 09:00-18:00",
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.8",
        "reviewCount": "156"
      }
    };

    // Inject schemas into page head
    const schemas = [
      { id: 'organization-schema', data: organizationSchema },
      { id: 'website-schema', data: websiteSchema },
      { id: 'site-navigation-schema', data: siteNavigationSchema },
      { id: 'breadcrumb-schema', data: breadcrumbSchema },
      { id: 'local-business-schema', data: localBusinessSchema }
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
  }, []);

  // This component doesn't render anything visible
  return null;
}