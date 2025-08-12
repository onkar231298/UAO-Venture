import { useEffect } from 'react';
import type { Category, Product } from '@shared/schema';

interface CategoryStructuredDataProps {
  category: Category;
  products?: Product[];
  totalProducts?: number;
}

export default function CategoryStructuredData({ category, products = [], totalProducts = 0 }: CategoryStructuredDataProps) {
  useEffect(() => {
    if (!category) return;

    const baseUrl = window.location.origin;
    const categoryUrl = `${baseUrl}/ingredients/${category.slug}`;

    // ItemList Schema for category page
    const itemListSchema = {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "name": `${category.name} - Organic Ingredients`,
      "description": `Premium organic ${category.name.toLowerCase()} for pharmaceutical, nutraceutical, and food applications. Certified organic, sustainably sourced, globally shipped.`,
      "url": categoryUrl,
      "numberOfItems": totalProducts,
      "itemListElement": products.slice(0, 10).map((product, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "item": {
          "@type": "Product",
          "name": product.name,
          "description": product.description || `High-quality ${product.name} from BFI Organic`,
          "url": `${baseUrl}/products/${product.slug}`,
          "image": product.mainImage?.startsWith('http') 
            ? product.mainImage 
            : `${baseUrl}${product.mainImage}`,
          "sku": product.productId,
          "brand": {
            "@type": "Brand",
            "name": "BFI Organic"
          },
          "offers": {
            "@type": "Offer",
            "priceCurrency": "USD",
            "price": product.priceUSD || product.rate || 0,
            "availability": product.currentStock && parseFloat(product.currentStock.toString()) > 0 
              ? "https://schema.org/InStock" 
              : "https://schema.org/OutOfStock"
          }
        }
      }))
    };

    // CollectionPage Schema
    const collectionPageSchema = {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "name": `${category.name} Collection`,
      "description": `Explore our comprehensive collection of organic ${category.name.toLowerCase()}. All products are certified organic, sustainably sourced, and available for bulk purchase worldwide.`,
      "url": categoryUrl,
      "mainEntity": {
        "@type": "ItemList",
        "@id": `${categoryUrl}#itemlist`
      },
      "breadcrumb": {
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
            "name": "Ingredients",
            "item": `${baseUrl}/ingredients`
          },
          {
            "@type": "ListItem",
            "position": 3,
            "name": category.name,
            "item": categoryUrl
          }
        ]
      },
      "isPartOf": {
        "@type": "WebSite",
        "name": "BFI Organic",
        "url": baseUrl
      },
      "about": {
        "@type": "Thing",
        "name": category.name,
        "description": `Organic ${category.name.toLowerCase()} for commercial and industrial applications`
      }
    };

    // FAQ Schema for category (if category has common questions)
    const categoryFAQs = generateCategoryFAQs(category);
    const faqSchema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": categoryFAQs.map(faq => ({
        "@type": "Question",
        "name": faq.question,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": faq.answer
        }
      }))
    };

    // Clean up existing category schemas
    const existingSchemas = document.querySelectorAll('script[type="application/ld+json"][id^="category-"]');
    existingSchemas.forEach(script => script.remove());

    // Add new schemas
    const itemListScript = document.createElement('script');
    itemListScript.type = 'application/ld+json';
    itemListScript.id = 'category-itemlist-schema';
    itemListScript.textContent = JSON.stringify(itemListSchema);
    document.head.appendChild(itemListScript);

    const collectionScript = document.createElement('script');
    collectionScript.type = 'application/ld+json';
    collectionScript.id = 'category-collection-schema';
    collectionScript.textContent = JSON.stringify(collectionPageSchema);
    document.head.appendChild(collectionScript);

    const faqScript = document.createElement('script');
    faqScript.type = 'application/ld+json';
    faqScript.id = 'category-faq-schema';
    faqScript.textContent = JSON.stringify(faqSchema);
    document.head.appendChild(faqScript);

    return () => {
      const scripts = document.querySelectorAll('script[type="application/ld+json"][id^="category-"]');
      scripts.forEach(script => script.remove());
    };
  }, [category, products, totalProducts]);

  return null;
}

// Generate category-specific FAQs for SEO
function generateCategoryFAQs(category: Category) {
  const categoryName = category.name.toLowerCase();
  
  const baseFAQs = [
    {
      question: `What are the applications of organic ${categoryName}?`,
      answer: `Organic ${categoryName} from BFI Organic are used in pharmaceutical manufacturing, nutraceutical formulations, food & beverage processing, cosmetic applications, and supplement production. All products meet international quality standards.`
    },
    {
      question: `Are your ${categoryName} certified organic for international markets?`,
      answer: `Yes, all our ${categoryName} products are certified organic by USDA, EU Organic, and India Organic standards. We provide complete documentation including certificates of analysis, pesticide residue reports, and compliance certificates for global markets including US, Europe, Canada, and Asia.`
    },
    {
      question: `What is the minimum order quantity for bulk ${categoryName}?`,
      answer: `Our minimum order quantity for ${categoryName} typically ranges from 25-100 kg depending on the specific product. We accommodate both small batch orders for R&D and large commercial quantities for manufacturing. Contact us for specific MOQ requirements.`
    },
    {
      question: `Do you provide samples of ${categoryName} for quality testing?`,
      answer: `Yes, we provide free samples (25-100g) of all ${categoryName} products for quality evaluation and testing. Samples include basic documentation and can be shipped worldwide. This allows you to verify quality before placing bulk orders.`
    },
    {
      question: `What is the typical lead time for ${categoryName} orders to Europe and North America?`,
      answer: `Standard lead time for ${categoryName} orders is 15-20 business days for Europe and North America, including quality testing, documentation preparation, and shipping. Express shipping options are available for urgent requirements.`
    }
  ];

  // Add category-specific FAQs
  if (categoryName.includes('herb') || categoryName.includes('adaptogenic')) {
    baseFAQs.push({
      question: `Are your ${categoryName} suitable for pharmaceutical applications?`,
      answer: `Yes, our ${categoryName} meet pharmaceutical grade standards with complete documentation including COA, microbiological analysis, heavy metals testing, and pesticide residue reports suitable for pharma and nutraceutical applications.`
    });
  }

  if (categoryName.includes('spice') || categoryName.includes('culinary')) {
    baseFAQs.push({
      question: `Are your ${categoryName} food grade certified?`,
      answer: `Absolutely! Our ${categoryName} are food grade certified and comply with FDA, EU, and international food safety standards. They are suitable for food processing, seasoning blends, and commercial food production.`
    });
  }

  return baseFAQs;
}