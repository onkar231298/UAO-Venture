import { useEffect } from 'react';

interface InternationalSEOConfig {
  defaultLanguage?: string;
  defaultCountry?: string;
  targetMarkets?: Array<{
    country: string;
    language: string;
    currency: string;
    domain?: string;
  }>;
}

const DEFAULT_MARKETS = [
  { country: 'US', language: 'en', currency: 'USD' },
  { country: 'CA', language: 'en', currency: 'CAD' },
  { country: 'GB', language: 'en', currency: 'GBP' },
  { country: 'IN', language: 'en', currency: 'INR' },
  { country: 'CN', language: 'zh', currency: 'CNY' },
  { country: 'JP', language: 'ja', currency: 'JPY' },
  { country: 'KR', language: 'ko', currency: 'KRW' },
  { country: 'DE', language: 'de', currency: 'EUR' },
  { country: 'FR', language: 'fr', currency: 'EUR' },
  { country: 'ES', language: 'es', currency: 'EUR' },
  { country: 'IT', language: 'it', currency: 'EUR' },
  { country: 'NL', language: 'nl', currency: 'EUR' }
];

export function useInternationalSEO(config: InternationalSEOConfig = {}) {
  const {
    defaultLanguage = 'en',
    defaultCountry = 'US',
    targetMarkets = DEFAULT_MARKETS
  } = config;

  useEffect(() => {
    const baseUrl = window.location.origin;
    const currentPath = window.location.pathname;

    // Generate hreflang tags for international SEO
    generateHreflangTags(baseUrl, currentPath, targetMarkets, defaultLanguage, defaultCountry);

    // Add geo targeting meta tags
    addGeoTargetingMeta(targetMarkets);

    // Add language and region meta tags
    addLanguageRegionMeta(defaultLanguage, defaultCountry);

    // Add currency and pricing meta tags
    addCurrencyMeta(targetMarkets);

  }, [defaultLanguage, defaultCountry, targetMarkets]);

  return null;
}

function generateHreflangTags(
  baseUrl: string, 
  currentPath: string, 
  markets: Array<{country: string; language: string; currency: string; domain?: string}>,
  defaultLanguage: string,
  defaultCountry: string
) {
  // Remove existing hreflang tags
  const existingHreflang = document.querySelectorAll('link[rel="alternate"][hreflang]');
  existingHreflang.forEach(tag => tag.remove());

  // Add default hreflang (x-default)
  addHreflangTag('x-default', `${baseUrl}${currentPath}`);

  // Add hreflang tags for each target market
  markets.forEach(market => {
    const hreflang = `${market.language}-${market.country}`;
    const url = market.domain 
      ? `${market.domain}${currentPath}`
      : `${baseUrl}${currentPath}?hl=${market.language}&gl=${market.country}`;
    
    addHreflangTag(hreflang, url);
  });

  // Add default language hreflang
  addHreflangTag(defaultLanguage, `${baseUrl}${currentPath}`);
}

function addHreflangTag(hreflang: string, href: string) {
  const link = document.createElement('link');
  link.rel = 'alternate';
  link.hreflang = hreflang;
  link.href = href;
  document.head.appendChild(link);
}

function addGeoTargetingMeta(markets: Array<{country: string; language: string; currency: string}>) {
  const countries = markets.map(m => m.country).join(', ');
  
  updateOrCreateMeta('geo.region', countries);
  updateOrCreateMeta('geo.placename', 'Global');
  updateOrCreateMeta('geo.position', '23.5880;72.3693'); // Mehsana, Gujarat coordinates
  updateOrCreateMeta('ICBM', '23.5880, 72.3693');
  updateOrCreateMeta('distribution', 'global');
  updateOrCreateMeta('coverage', 'worldwide');
  updateOrCreateMeta('target-country', countries);
}

function addLanguageRegionMeta(defaultLanguage: string, defaultCountry: string) {
  updateOrCreateMeta('language', defaultLanguage);
  updateOrCreateMeta('content-language', defaultLanguage);
  updateOrCreateMeta('geo.country', defaultCountry);
  
  // Add HTTP-equiv content-language
  let httpEquivLang = document.querySelector('meta[http-equiv="content-language"]');
  if (!httpEquivLang) {
    httpEquivLang = document.createElement('meta');
    httpEquivLang.setAttribute('http-equiv', 'content-language');
    document.head.appendChild(httpEquivLang);
  }
  httpEquivLang.setAttribute('content', defaultLanguage);
}

function addCurrencyMeta(markets: Array<{country: string; language: string; currency: string}>) {
  const currencies = Array.from(new Set(markets.map(m => m.currency))).join(', ');
  
  updateOrCreateMeta('currency', currencies);
  updateOrCreateMeta('price-currency', 'USD'); // Primary currency for B2B
  updateOrCreateMeta('accept-currency', currencies);
  
  // Add Open Graph currency for social media
  updateOrCreateMeta('og:price:currency', 'USD', 'property');
  updateOrCreateMeta('product:price:currency', 'USD', 'property');
}

function updateOrCreateMeta(name: string, content: string, attributeType: 'name' | 'property' = 'name') {
  let meta = document.querySelector(`meta[${attributeType}="${name}"]`);
  
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute(attributeType, name);
    document.head.appendChild(meta);
  }
  
  meta.setAttribute('content', content);
}

export default useInternationalSEO;