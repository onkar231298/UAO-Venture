// Currency detection and pricing utilities

export interface CurrencyInfo {
  code: string;
  symbol: string;
  name: string;
}

export const CURRENCIES: Record<string, CurrencyInfo> = {
  USD: { code: 'USD', symbol: '$', name: 'US Dollar' },
  INR: { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro' },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound' },
};

// Extended Country to currency mapping for better coverage
const COUNTRY_CURRENCY_MAP: Record<string, string> = {
  // North America
  US: 'USD',
  CA: 'USD', // Canada - USD for B2B convenience
  MX: 'USD', // Mexico - USD for B2B
  
  // India
  IN: 'INR',
  
  // Eurozone countries
  DE: 'EUR', // Germany
  FR: 'EUR', // France
  IT: 'EUR', // Italy
  ES: 'EUR', // Spain
  NL: 'EUR', // Netherlands
  BE: 'EUR', // Belgium
  AT: 'EUR', // Austria
  PT: 'EUR', // Portugal
  IE: 'EUR', // Ireland
  FI: 'EUR', // Finland
  LU: 'EUR', // Luxembourg
  MT: 'EUR', // Malta
  CY: 'EUR', // Cyprus
  SK: 'EUR', // Slovakia
  SI: 'EUR', // Slovenia
  EE: 'EUR', // Estonia
  LV: 'EUR', // Latvia
  LT: 'EUR', // Lithuania
  GR: 'EUR', // Greece
  
  // UK
  GB: 'GBP',
  UK: 'GBP',
  
  // Other major markets - default to USD for B2B convenience
  AU: 'USD', // Australia
  NZ: 'USD', // New Zealand
  SG: 'USD', // Singapore
  HK: 'USD', // Hong Kong
  JP: 'USD', // Japan
  KR: 'USD', // South Korea
  CN: 'USD', // China
  TH: 'USD', // Thailand
  MY: 'USD', // Malaysia
  ID: 'USD', // Indonesia
  PH: 'USD', // Philippines
  VN: 'USD', // Vietnam
  AE: 'USD', // UAE
  SA: 'USD', // Saudi Arabia
  BR: 'USD', // Brazil
  AR: 'USD', // Argentina
  CL: 'USD', // Chile
  CO: 'USD', // Colombia
  PE: 'USD', // Peru
  ZA: 'USD', // South Africa
  EG: 'USD', // Egypt
  KE: 'USD', // Kenya
  NG: 'USD', // Nigeria
  GH: 'USD', // Ghana
  TZ: 'USD', // Tanzania
  UG: 'USD', // Uganda
  RW: 'USD', // Rwanda
  ET: 'USD', // Ethiopia
};

// Get user's location-based currency (IP-based approach - no permissions required)
export async function detectUserCurrency(): Promise<string> {
  try {
    // Primary: Server-side IP detection (most reliable)
    const response = await fetch('/api/detect-currency');
    const data = await response.json();
    
    if (data.currency && ['USD', 'INR', 'EUR', 'GBP'].includes(data.currency)) {
      console.log(`Currency detected via server: ${data.currency} from ${data.source}`);
      return data.currency;
    }
  } catch (error) {
    console.warn('Server-side currency detection failed:', error);
  }

  try {
    // Fallback: Client-side IP detection
    return await detectCurrencyByIP();
  } catch {
    // Ultimate fallback: Browser locale detection
    return detectCurrencyByLocale();
  }
}

// Detect currency based on IP location with multiple fallback services
async function detectCurrencyByIP(): Promise<string> {
  // Try multiple IP geolocation services for reliability
  const services = [
    // Service 1: ipapi.co (free tier: 1000 requests/day)
    async () => {
      const response = await fetch('https://ipapi.co/json/', { timeout: 3000 } as any);
      const data = await response.json();
      return data.country_code;
    },
    
    // Service 2: ipinfo.io (free tier: 50,000 requests/month)
    async () => {
      const response = await fetch('https://ipinfo.io/json', { timeout: 3000 } as any);
      const data = await response.json();
      return data.country;
    },
    
    // Service 3: Free alternative service
    async () => {
      const response = await fetch('https://api.country.is/', { timeout: 3000 } as any);
      const data = await response.json();
      return data.country;
    }
  ];

  // Try each service in sequence
  for (const service of services) {
    try {
      const countryCode = await service();
      if (countryCode && COUNTRY_CURRENCY_MAP[countryCode]) {
        console.log(`Currency detected via IP: ${countryCode} -> ${COUNTRY_CURRENCY_MAP[countryCode]}`);
        return COUNTRY_CURRENCY_MAP[countryCode];
      }
    } catch (error) {
      console.warn('IP geolocation service failed:', error);
      continue;
    }
  }
  
  // Ultimate fallback to browser locale
  return detectCurrencyByLocale();
}

// Detect currency from browser locale with improved mapping
function detectCurrencyByLocale(): string {
  try {
    const locale = navigator.language || 'en-US';
    console.log(`Detecting currency from locale: ${locale}`);
    
    // Enhanced locale to currency mappings
    if (locale.includes('en-US') || locale.includes('en-CA') || locale.includes('en-AU')) return 'USD';
    if (locale.includes('en-IN') || locale.includes('hi') || locale.includes('bn') || locale.includes('ta')) return 'INR';
    if (locale.includes('en-GB')) return 'GBP';
    
    // European locales
    if (locale.includes('de') || locale.includes('fr') || locale.includes('it') || 
        locale.includes('es') || locale.includes('nl') || locale.includes('pt') ||
        locale.includes('fi') || locale.includes('da') || locale.includes('sv') ||
        locale.includes('no') || locale.includes('pl') || locale.includes('cs') ||
        locale.includes('hu') || locale.includes('ro') || locale.includes('bg') ||
        locale.includes('hr') || locale.includes('sk') || locale.includes('sl') ||
        locale.includes('et') || locale.includes('lv') || locale.includes('lt') ||
        locale.includes('el') || locale.includes('mt') || locale.includes('cy')) {
      return 'EUR';
    }
    
    console.log(`Using default USD for locale: ${locale}`);
    return 'USD'; // Default fallback for B2B convenience
  } catch (error) {
    console.warn('Locale detection failed:', error);
    return 'USD';
  }
}

// Format price with currency symbol
export function formatPrice(price: number, currencyCode: string): string {
  const currency = CURRENCIES[currencyCode];
  if (!currency) return `${price}`;
  
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  } catch {
    return `${currency.symbol}${price.toFixed(2)}`;
  }
}

// Get appropriate price from product based on user currency (location-restricted)
export function getProductPrice(product: any, userCurrency: string): number | null {
  const priceField = `price${userCurrency}`;
  const price = product[priceField];
  
  if (price && !isNaN(parseFloat(price))) {
    return parseFloat(price);
  }
  
  // No fallback - users should only see their regional pricing
  return null;
}

// Get all available currencies for a product (for admin use only)
export function getAllProductPrices(product: any): Array<{currency: string, price: number}> {
  const prices = [];
  
  Object.entries(CURRENCIES).forEach(([code, info]) => {
    const priceField = `price${code}`;
    const price = product[priceField];
    if (price && !isNaN(parseFloat(price))) {
      prices.push({ currency: code, price: parseFloat(price) });
    }
  });
  
  return prices;
}

// Format price display with terms
export function formatPriceWithTerms(price: number, currency: string, priceType: string, location: string): string {
  const formattedPrice = formatPrice(price, currency);
  return `${formattedPrice} ${priceType} ${location}`;
}