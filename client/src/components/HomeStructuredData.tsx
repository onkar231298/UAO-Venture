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

    // Organization Schema for Homepage
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
        "email": "admin@bfiorganic.com",
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
      }
    };

    // Website Schema
    const websiteSchema = {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "BFI Organic - Premium B2B Organic Ingredients",
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