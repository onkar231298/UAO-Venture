import { useEffect } from 'react';

export default function CompanyStructuredData() {
  useEffect(() => {
    // Company/Organization Schema
    const organizationSchema = {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "Bright Fame Organic Pvt. Ltd.",
      "alternateName": "BFI Organic",
      "description": "Leading B2B supplier of certified organic ingredients, herbs, spices, and botanical extracts serving pharmaceutical, nutraceutical, and food industries worldwide.",
      "url": "https://bright-organic.com",
      "logo": "https://bright-organic.com/bfi-logo.png",
      "image": "https://bright-organic.com/bfi-logo.png",
      "foundingDate": "2000",
      "founders": [
        {
          "@type": "Person",
          "name": "Bright Fame Organic Leadership Team"
        }
      ],
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "Industrial Area",
        "addressLocality": "Ahmedabad",
        "addressRegion": "Gujarat",
        "postalCode": "380001",
        "addressCountry": "IN"
      },
      "contactPoint": {
        "@type": "ContactPoint",
        "telephone": "+91-9999999999",
        "contactType": "Customer Service",
        "email": "info@brightfameorganic.com",
        "availableLanguage": ["English", "Hindi", "Gujarati"]
      },
      "sameAs": [
        "https://www.linkedin.com/company/bright-fame-organic",
        "https://twitter.com/brightfameorg",
        "https://www.facebook.com/brightfameorganic"
      ],
      "industry": "Organic Ingredients Manufacturing",
      "naics": "311999",
      "numberOfEmployees": {
        "@type": "QuantitativeValue",
        "value": "100-250"
      },
      "location": {
        "@type": "Place",
        "name": "Bright Fame Organic Manufacturing Facility",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "Industrial Area",
          "addressLocality": "Ahmedabad",
          "addressRegion": "Gujarat",
          "postalCode": "380001",
          "addressCountry": "IN"
        },
        "geo": {
          "@type": "GeoCoordinates",
          "latitude": "23.0225",
          "longitude": "72.5714"
        }
      },
      "offers": {
        "@type": "Offer",
        "description": "B2B Organic Ingredients Supply",
        "category": "Manufacturing and Supply",
        "eligibleRegion": ["IN", "US", "GB", "CA", "AU", "DE", "FR", "JP", "KR", "CN"],
        "businessFunction": "http://purl.org/goodrelations/v1#Sell"
      },
      "makesOffer": [
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Product",
            "name": "Organic Herbal Extracts",
            "category": "Pharmaceutical Raw Materials"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Product",
            "name": "Organic Spices",
            "category": "Food Ingredients"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Product",
            "name": "Nutraceutical Ingredients",
            "category": "Health Supplements"
          }
        }
      ],
      "certifications": [
        "ISO 9001:2015",
        "ISO 22000:2018", 
        "HACCP",
        "Organic Certification",
        "GMP Certified"
      ],
      "keywords": "organic ingredients supplier, B2B organic herbs, pharmaceutical raw materials, nutraceutical ingredients, herbal extracts manufacturer, organic spices supplier, Gujarat organic company"
    };

    // Manufacturing Company Schema
    const manufacturingSchema = {
      "@context": "https://schema.org",
      "@type": "Manufacturer",
      "name": "Bright Fame Organic Pvt. Ltd.",
      "description": "ISO certified organic ingredients manufacturing facility specializing in herbs, spices, and botanical extracts for global B2B customers.",
      "url": "https://bright-organic.com",
      "logo": "https://bright-organic.com/bfi-logo.png",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "Industrial Area",
        "addressLocality": "Ahmedabad", 
        "addressRegion": "Gujarat",
        "postalCode": "380001",
        "addressCountry": "IN"
      },
      "makesOffer": {
        "@type": "Offer",
        "description": "B2B Organic Ingredients Manufacturing & Supply",
        "category": "Organic Manufacturing",
        "eligibleRegion": "Worldwide",
        "businessFunction": "http://purl.org/goodrelations/v1#Sell"
      },
      "hasCredential": [
        {
          "@type": "EducationalOccupationalCredential",
          "name": "ISO 9001:2015 Certification",
          "credentialCategory": "Quality Management"
        },
        {
          "@type": "EducationalOccupationalCredential", 
          "name": "Organic Certification",
          "credentialCategory": "Organic Standards"
        }
      ]
    };

    // Local Business Schema for regional SEO
    const localBusinessSchema = {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      "name": "Bright Fame Organic Pvt. Ltd.",
      "description": "Leading organic ingredients manufacturer and supplier in Gujarat, India",
      "url": "https://bright-organic.com",
      "telephone": "+91-9999999999",
      "email": "info@brightfameorganic.com",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "Industrial Area",
        "addressLocality": "Ahmedabad",
        "addressRegion": "Gujarat", 
        "postalCode": "380001",
        "addressCountry": "IN"
      },
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": "23.0225",
        "longitude": "72.5714"
      },
      "openingHoursSpecification": {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        "opens": "09:00",
        "closes": "18:00"
      },
      "priceRange": "$$$$",
      "currenciesAccepted": "INR, USD, EUR, GBP",
      "paymentAccepted": "Bank Transfer, Letter of Credit, Cash"
    };

    // Add all schemas to the page
    const schemas = [organizationSchema, manufacturingSchema, localBusinessSchema];
    
    schemas.forEach((schema, index) => {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.text = JSON.stringify(schema);
      script.id = `company-schema-${index}`;
      
      // Remove existing schema if present
      const existing = document.getElementById(`company-schema-${index}`);
      if (existing) {
        existing.remove();
      }
      
      document.head.appendChild(script);
    });

    return () => {
      // Cleanup schemas on unmount
      schemas.forEach((_, index) => {
        const existing = document.getElementById(`company-schema-${index}`);
        if (existing) {
          existing.remove();
        }
      });
    };
  }, []);

  return null;
}