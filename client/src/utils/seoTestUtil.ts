// Utility to test structured data implementation
export function testStructuredData() {
  console.log('=== Structured Data Test Results ===');
  
  // Check for structured data scripts
  const structuredDataScripts = document.querySelectorAll('script[type="application/ld+json"]');
  console.log(`Found ${structuredDataScripts.length} structured data scripts`);
  
  structuredDataScripts.forEach((script, index) => {
    try {
      const data = JSON.parse(script.textContent || '{}');
      console.log(`Script ${index + 1}:`, {
        type: data['@type'],
        context: data['@context'],
        name: data.name,
        id: script.id
      });
    } catch (error) {
      console.error(`Error parsing script ${index + 1}:`, error);
    }
  });
  
  // Check meta tags
  const title = document.title;
  const description = document.querySelector('meta[name="description"]')?.getAttribute('content');
  const canonical = document.querySelector('link[rel="canonical"]')?.getAttribute('href');
  const ogTitle = document.querySelector('meta[property="og:title"]')?.getAttribute('content');
  const ogImage = document.querySelector('meta[property="og:image"]')?.getAttribute('content');
  
  console.log('Meta Tags:', {
    title,
    description: description?.substring(0, 100) + '...',
    canonical,
    ogTitle: ogTitle?.substring(0, 50) + '...',
    ogImage: ogImage?.substring(0, 50) + '...'
  });
  
  // Test validation URLs
  const currentUrl = window.location.href;
  const googleTestUrl = `https://search.google.com/test/rich-results?url=${encodeURIComponent(currentUrl)}`;
  const facebookDebugUrl = `https://developers.facebook.com/tools/debug/?q=${encodeURIComponent(currentUrl)}`;
  
  console.log('Validation URLs:');
  console.log('Google Rich Results Test:', googleTestUrl);
  console.log('Facebook Debug Tool:', facebookDebugUrl);
  
  return {
    structuredDataCount: structuredDataScripts.length,
    hasTitle: !!title,
    hasDescription: !!description,
    hasCanonical: !!canonical,
    hasOgTags: !!ogTitle && !!ogImage,
    validationUrls: { googleTestUrl, facebookDebugUrl }
  };
}

// Add to window for easy testing in browser console
if (typeof window !== 'undefined') {
  (window as any).testStructuredData = testStructuredData;
}