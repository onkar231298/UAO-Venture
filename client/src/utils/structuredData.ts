/**
 * Client-side structured data injection utility
 * Fetches structured data from API and injects it into the page for SEO
 */

interface StructuredDataSchema {
  id: string;
  data: object;
}

interface StructuredDataResponse {
  schemas: StructuredDataSchema[];
  meta: {
    title: string;
    description: string;
    image: string;
    url: string;
    canonical: string;
  };
}

/**
 * Inject structured data scripts and meta tags for a product page
 */
export async function injectProductStructuredData(slug: string): Promise<void> {
  try {
    console.log('Testing structured data for product:', slug);
    
    const response = await fetch(`/api/products/${slug}/structured-data`);
    if (!response.ok) {
      console.warn('Failed to fetch structured data:', response.status);
      return;
    }
    
    const data: StructuredDataResponse = await response.json();
    
    // Clear existing structured data scripts
    const existingScripts = document.querySelectorAll('script[type="application/ld+json"]');
    existingScripts.forEach(script => script.remove());
    
    // Inject new structured data schemas
    data.schemas.forEach(schema => {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.id = schema.id;
      script.textContent = JSON.stringify(schema.data, null, 2);
      document.head.appendChild(script);
    });
    
    // Update page meta tags
    updateMetaTags(data.meta);
    
    // Log for testing purposes
    console.log('=== Structured Data Test Results ===');
    console.log(`Found ${data.schemas.length} structured data scripts`);
    data.schemas.forEach((schema, index) => {
      console.log(`Script ${index + 1}:`, {
        type: schema.data['@type'],
        context: schema.data['@context'],
        name: schema.data['name'],
        id: schema.id
      });
    });
    
    console.log('Meta Tags:', {
      title: data.meta.title,
      description: data.meta.description.substring(0, 100) + '...',
      canonical: data.meta.canonical,
      ogTitle: document.querySelector('meta[property="og:title"]')?.getAttribute('content')?.substring(0, 50) + '...',
      ogImage: document.querySelector('meta[property="og:image"]')?.getAttribute('content')?.substring(0, 50) + '...'
    });
    
    // Generate test URLs for validation
    const currentUrl = encodeURIComponent(window.location.href);
    console.log('Validation URLs:');
    console.log('Google Rich Results Test:', `https://search.google.com/test/rich-results?url=${currentUrl}`);
    console.log('Facebook Debug Tool:', `https://developers.facebook.com/tools/debug/?q=${currentUrl}`);
    
  } catch (error) {
    console.error('Error injecting structured data:', error);
  }
}

/**
 * Update page meta tags dynamically
 */
function updateMetaTags(meta: StructuredDataResponse['meta']): void {
  // Update title
  document.title = meta.title;
  
  // Update meta description
  updateOrCreateMeta('name', 'description', meta.description);
  
  // Update canonical URL
  updateOrCreateLink('rel', 'canonical', meta.canonical);
  
  // Update Open Graph tags
  updateOrCreateMeta('property', 'og:title', meta.title);
  updateOrCreateMeta('property', 'og:description', meta.description);
  updateOrCreateMeta('property', 'og:image', meta.image);
  updateOrCreateMeta('property', 'og:url', meta.url);
  updateOrCreateMeta('property', 'og:type', 'product');
  
  // Update Twitter Card tags
  updateOrCreateMeta('name', 'twitter:card', 'summary_large_image');
  updateOrCreateMeta('name', 'twitter:title', meta.title);
  updateOrCreateMeta('name', 'twitter:description', meta.description);
  updateOrCreateMeta('name', 'twitter:image', meta.image);
}

/**
 * Update or create a meta tag
 */
function updateOrCreateMeta(attribute: string, value: string, content: string): void {
  let meta = document.querySelector(`meta[${attribute}="${value}"]`) as HTMLMetaElement;
  
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute(attribute, value);
    document.head.appendChild(meta);
  }
  
  meta.content = content;
}

/**
 * Update or create a link tag
 */
function updateOrCreateLink(attribute: string, value: string, href: string): void {
  let link = document.querySelector(`link[${attribute}="${value}"]`) as HTMLLinkElement;
  
  if (!link) {
    link = document.createElement('link');
    link.setAttribute(attribute, value);
    document.head.appendChild(link);
  }
  
  link.href = href;
}

/**
 * Clean up structured data when navigating away from product pages
 */
export function cleanupStructuredData(): void {
  const scripts = document.querySelectorAll('script[type="application/ld+json"]');
  scripts.forEach(script => {
    // Only remove product-specific schemas, keep organization schema
    if (script.id && !script.id.includes('organization')) {
      script.remove();
    }
  });
}