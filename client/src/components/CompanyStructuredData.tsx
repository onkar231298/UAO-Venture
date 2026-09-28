import { useEffect } from 'react';

export default function CompanyStructuredData() {
  useEffect(() => {
    const PHONE = "+91-7249847439";
    const EMAIL = "admin@bright-organic.com";
    const BASE_URL = "https://bright-organic.com";

    const address = {
      "@type": "PostalAddress",
      "streetAddress": "Opp. Murlidhar Guest House, Mehsana-Vishnagar Road, Kansarakui",
      "addressLocality": "Mehsana",
      "addressRegion": "Gujarat",
      "postalCode": "384001",
      "addressCountry": "IN"
    };

    const omkarContact = {
      "@type": "Person",
      "name": "Omkar Suryavanshi",
      "jobTitle": "Director – Business Development",
      "worksFor": {
        "@type": "Organization",
        "name": "Cape NatureX Organic Pvt. Ltd."
      },
      "telephone": PHONE,
      "email": EMAIL,
      "url": `${BASE_URL}/contact`
    };

    const organizationSchema = {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "Cape NatureX Organic Pvt. Ltd.",
      "alternateName": ["Cape NatureX Organic", "BFO"],
      "description": "India's leading B2B manufacturer and bulk exporter of EU Organic certified herbal powders, teas, whole herbs, whole spices, botanical extracts and spray dried ingredients. Direct manufacturer based in Mehsana, Gujarat, India.",
      "url": BASE_URL,
      "logo": `${BASE_URL}/cape-naturex-logo.png`,
      "image": `${BASE_URL}/cape-naturex-logo.png`,
      "foundingDate": "2010",
      "address": address,
      "contactPoint": [
        {
          "@type": "ContactPoint",
          "telephone": PHONE,
          "contactType": "customer service",
          "name": "Omkar Suryavanshi",
          "email": EMAIL,
          "availableLanguage": ["English", "Hindi", "Gujarati"],
          "areaServed": ["DE", "NL", "FR", "GB", "US", "IN", "CA", "AU"]
        },
        {
          "@type": "ContactPoint",
          "telephone": PHONE,
          "contactType": "sales",
          "name": "Omkar Suryavanshi",
          "email": EMAIL,
          "availableLanguage": ["English", "Hindi"]
        }
      ],
      "employee": [omkarContact],
      "founders": [
        {
          "@type": "Person",
          "name": "Cape NatureX Organic Leadership Team"
        }
      ],
      "sameAs": [
        BASE_URL,
        "https://www.linkedin.com/company/bright-fame-organic"
      ],
      "industry": "Organic Ingredients Manufacturing",
      "naics": "311999",
      "numberOfEmployees": {
        "@type": "QuantitativeValue",
        "value": "50-250"
      },
      "areaServed": [
        "Germany", "Netherlands", "France", "United Kingdom",
        "United States", "India", "Canada", "Australia",
        "Poland", "Italy", "Spain", "Belgium", "Austria", "Switzerland"
      ],
      "knowsAbout": [
        "EU Organic Certification",
        "Herbal Powders",
        "Botanical Extracts",
        "Organic Spices",
        "Herbal Teas",
        "B2B Bulk Ingredient Supply",
        "ETO-free Processing",
        "EU 2018/848 Compliance"
      ],
      "makesOffer": [
        {
          "@type": "Offer",
          "itemOffered": { "@type": "Product", "name": "EU Organic Certified Herbal Powders" },
          "eligibleRegion": "EU"
        },
        {
          "@type": "Offer",
          "itemOffered": { "@type": "Product", "name": "EU Organic Certified Herbal Teas" },
          "eligibleRegion": "EU"
        },
        {
          "@type": "Offer",
          "itemOffered": { "@type": "Product", "name": "EU Organic Certified Whole Spices" },
          "eligibleRegion": "EU"
        },
        {
          "@type": "Offer",
          "itemOffered": { "@type": "Product", "name": "Botanical Extracts" },
          "eligibleRegion": "Worldwide"
        }
      ],
      "certifications": [
        "EU Organic (Regulation 2018/848)",
        "USDA NOP Organic",
        "India Organic (NPOP)",
        "JAS (Japan Agricultural Standard)",
        "ISO 22000:2018",
        "HACCP",
        "GMP",
        "ETO-Free"
      ]
    };

    const personSchema = {
      "@context": "https://schema.org",
      "@type": "Person",
      "name": "Omkar Suryavanshi",
      "jobTitle": "Director – Business Development",
      "telephone": PHONE,
      "email": EMAIL,
      "worksFor": {
        "@type": "Organization",
        "name": "Cape NatureX Organic Pvt. Ltd.",
        "url": BASE_URL
      },
      "url": `${BASE_URL}/contact`,
      "sameAs": [BASE_URL]
    };

    const localBusinessSchema = {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      "name": "Cape NatureX Organic Pvt. Ltd.",
      "description": "India's top B2B manufacturer of EU Organic certified herbal ingredients. Factory-direct bulk supply to Europe and worldwide.",
      "url": BASE_URL,
      "telephone": PHONE,
      "email": EMAIL,
      "address": address,
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": "23.6002",
        "longitude": "72.3953"
      },
      "openingHoursSpecification": [
        {
          "@type": "OpeningHoursSpecification",
          "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
          "opens": "09:00",
          "closes": "18:00"
        },
        {
          "@type": "OpeningHoursSpecification",
          "dayOfWeek": "Saturday",
          "opens": "09:00",
          "closes": "14:00"
        }
      ],
      "priceRange": "$$$$",
      "currenciesAccepted": "INR, USD, EUR, GBP",
      "paymentAccepted": "Bank Transfer, Letter of Credit",
      "employee": [omkarContact]
    };

    const schemas = [organizationSchema, personSchema, localBusinessSchema];

    schemas.forEach((schema, index) => {
      const existing = document.getElementById(`company-schema-${index}`);
      if (existing) existing.remove();

      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.text = JSON.stringify(schema);
      script.id = `company-schema-${index}`;
      document.head.appendChild(script);
    });

    return () => {
      schemas.forEach((_, index) => {
        const existing = document.getElementById(`company-schema-${index}`);
        if (existing) existing.remove();
      });
    };
  }, []);

  return null;
}
