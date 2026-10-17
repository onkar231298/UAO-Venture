import { useEffect } from 'react';

interface EnhancedSEOHeadProps {
  title: string;
  description: string;
  keywords?: string;
  canonicalUrl?: string;
  ogImage?: string;
  pageType?: 'website' | 'product' | 'category' | 'article';
  productPrice?: number;
  currency?: string;
  availability?: 'InStock' | 'OutOfStock';
  brand?: string;
  category?: string;
  geoTargeting?: string[];
}

export default function EnhancedSEOHead({
  title,
  description,
  keywords,
  canonicalUrl,
  ogImage,
  pageType = 'website',
  productPrice,
  currency = 'USD',
  availability,
  brand = 'Atlas Ingredients',
  category,
  geoTargeting = ['US', 'CA', 'GB', 'EU', 'IN', 'CN', 'JP', 'KR']
}: EnhancedSEOHeadProps) {
  
  useEffect(() => {
    // Update document title
    document.title = title;

    // Update or create meta tags
    updateMetaTag('description', description);
    
    if (keywords) {
      updateMetaTag('keywords', keywords);
    }

    // Enhanced Open Graph tags
    updateMetaTag('og:title', title, 'property');
    updateMetaTag('og:description', description, 'property');
    updateMetaTag('og:type', pageType === 'product' ? 'product' : 'website', 'property');
    updateMetaTag('og:site_name', 'Atlas Ingredients - Premium Organic Ingredients', 'property');
    updateMetaTag('og:locale', 'en_US', 'property');
    
    if (canonicalUrl) {
      updateMetaTag('og:url', canonicalUrl, 'property');
      updateOrCreateLink('canonical', canonicalUrl);
    }

    if (ogImage) {
      updateMetaTag('og:image', ogImage, 'property');
      updateMetaTag('og:image:alt', title, 'property');
      updateMetaTag('og:image:width', '1200', 'property');
      updateMetaTag('og:image:height', '630', 'property');
    }

    // Twitter Card tags
    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:title', title);
    updateMetaTag('twitter:description', description);
    updateMetaTag('twitter:site', '@brightfameorg');
    
    if (ogImage) {
      updateMetaTag('twitter:image', ogImage);
    }

    // Product-specific meta tags
    if (pageType === 'product' && productPrice) {
      updateMetaTag('product:price:amount', productPrice.toString(), 'property');
      updateMetaTag('product:price:currency', currency, 'property');
      
      if (availability) {
        updateMetaTag('product:availability', availability, 'property');
      }
      
      if (brand) {
        updateMetaTag('product:brand', brand, 'property');
      }
      
      if (category) {
        updateMetaTag('product:category', category, 'property');
      }
    }

    // Geographic targeting
    if (geoTargeting.length > 0) {
      updateMetaTag('geo.region', geoTargeting.join(', '));
      updateMetaTag('distribution', 'global');
      updateMetaTag('target-country', geoTargeting.join(', '));
    }

    // Business-specific meta tags
    updateMetaTag('business:contact_data:street_address', 'Mehsana-Vishnagar Road, Kansarakui');
    updateMetaTag('business:contact_data:locality', 'Mehsana');
    updateMetaTag('business:contact_data:region', 'Gujarat');
    updateMetaTag('business:contact_data:postal_code', '384001');
    updateMetaTag('business:contact_data:country_name', 'India');
    updateMetaTag('business:contact_data:email', 'admin@bright-organic.com');
    updateMetaTag('business:contact_data:phone_number', '+91-7249847439');

    // Robots and indexing
    updateMetaTag('robots', 'index, follow, max-image-preview:large, max-snippet:-1');
    updateMetaTag('googlebot', 'index, follow');
    updateMetaTag('bingbot', 'index, follow');

    // Additional SEO meta tags
    updateMetaTag('author', 'Atlas Ingredients');
    updateMetaTag('publisher', 'Atlas Ingredients');
    updateMetaTag('copyright', `© ${new Date().getFullYear()} Atlas Ingredients`);
    updateMetaTag('language', 'English');
    updateMetaTag('revisit-after', '7 days');

    // Industry and application tags
    updateMetaTag('industry', 'Organic Ingredients, Pharmaceutical, Nutraceutical, Food Processing');
    updateMetaTag('application', 'B2B, Bulk Supply, Wholesale, Manufacturing');

  }, [title, description, keywords, canonicalUrl, ogImage, pageType, productPrice, currency, availability, brand, category, geoTargeting]);

  return null;
}

// Helper function to update meta tags
function updateMetaTag(name: string, content: string, attributeType: 'name' | 'property' = 'name') {
  let meta = document.querySelector(`meta[${attributeType}="${name}"]`);
  
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute(attributeType, name);
    document.head.appendChild(meta);
  }
  
  meta.setAttribute('content', content);
}

// Helper function to update or create link tags
function updateOrCreateLink(rel: string, href: string) {
  let link = document.querySelector(`link[rel="${rel}"]`);
  
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', rel);
    document.head.appendChild(link);
  }
  
  link.setAttribute('href', href);
}