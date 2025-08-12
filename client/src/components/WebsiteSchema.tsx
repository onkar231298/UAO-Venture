import { useEffect } from 'react';

export default function WebsiteSchema() {
  useEffect(() => {
    const baseUrl = window.location.origin;
    
    // Website Schema for search box
    const websiteSchema = {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "BFI Organic - Premium Organic Ingredients Supplier",
      "alternateName": "Bright Fame Organic",
      "url": baseUrl,
      "description": "Leading global supplier of certified organic ingredients, spices, herbs, and botanical extracts for pharmaceutical, nutraceutical, and food industries.",
      "potentialAction": {
        "@type": "SearchAction",
        "target": {
          "@type": "EntryPoint",
          "urlTemplate": `${baseUrl}/products?search={search_term_string}`
        },
        "query-input": "required name=search_term_string"
      },
      "mainEntity": {
        "@type": "Organization",
        "@id": `${baseUrl}#organization`
      },
      "keywords": "organic ingredients, bulk spices, herbal extracts, pharmaceutical ingredients, nutraceutical ingredients, organic supplier, wholesale organic, certified organic, B2B ingredients",
      "inLanguage": "en-US",
      "copyrightYear": new Date().getFullYear(),
      "copyrightHolder": {
        "@type": "Organization",
        "name": "Bright Fame Organic Pvt. Ltd."
      }
    };

    // LocalBusiness Schema for better local SEO
    const localBusinessSchema = {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      "@id": `${baseUrl}#localbusiness`,
      "name": "Bright Fame Organic Pvt. Ltd.",
      "image": `${baseUrl}/bfi-logo.png`,
      "telephone": "+91-7249847439",
      "email": "admin@bright-organic.com",
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
      "paymentAccepted": "Cash, Credit Card, Bank Transfer",
      "currenciesAccepted": "USD, EUR, INR, GBP, CAD",
      "areaServed": [
        {
          "@type": "Country",
          "name": "United States"
        },
        {
          "@type": "Country", 
          "name": "Canada"
        },
        {
          "@type": "Country",
          "name": "United Kingdom"
        },
        {
          "@type": "Country",
          "name": "India"
        },
        {
          "@type": "Place",
          "name": "Europe"
        },
        {
          "@type": "Country",
          "name": "China"
        },
        {
          "@type": "Country",
          "name": "Japan"
        },
        {
          "@type": "Country",
          "name": "Korea"
        }
      ],
      "hasOfferCatalog": {
        "@type": "OfferCatalog",
        "name": "Organic Ingredients & Extracts",
        "itemListElement": [
          {
            "@type": "OfferCatalog",
            "name": "Adaptogenic Herbs",
            "description": "Premium organic adaptogenic herbs for supplement and pharmaceutical applications"
          },
          {
            "@type": "OfferCatalog",
            "name": "Culinary Spices", 
            "description": "Certified organic culinary spices for food and beverage industry"
          },
          {
            "@type": "OfferCatalog",
            "name": "Herbal Extracts",
            "description": "Standardized herbal extracts for nutraceutical and cosmetic applications"
          },
          {
            "@type": "OfferCatalog",
            "name": "Bioactive Compounds",
            "description": "Natural bioactive compounds and nutrients for pharmaceutical research"
          }
        ]
      }
    };

    // Clean up existing schemas
    const existingSchemas = document.querySelectorAll('script[type="application/ld+json"][id^="website-schema"]');
    existingSchemas.forEach(script => script.remove());

    // Add new schemas
    const websiteScript = document.createElement('script');
    websiteScript.type = 'application/ld+json';
    websiteScript.id = 'website-schema';
    websiteScript.textContent = JSON.stringify(websiteSchema);
    document.head.appendChild(websiteScript);

    const localBusinessScript = document.createElement('script');
    localBusinessScript.type = 'application/ld+json';
    localBusinessScript.id = 'local-business-schema';
    localBusinessScript.textContent = JSON.stringify(localBusinessSchema);
    document.head.appendChild(localBusinessScript);

    return () => {
      // Cleanup on unmount
      const scripts = document.querySelectorAll('script[type="application/ld+json"][id^="website-schema"], script[type="application/ld+json"][id^="local-business-schema"]');
      scripts.forEach(script => script.remove());
    };
  }, []);

  return null;
}