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

// Country to currency mapping
const COUNTRY_CURRENCY_MAP: Record<string, string> = {
  US: 'USD',
  IN: 'INR',
  DE: 'EUR',
  FR: 'EUR',
  IT: 'EUR',
  ES: 'EUR',
  NL: 'EUR',
  BE: 'EUR',
  AT: 'EUR',
  PT: 'EUR',
  IE: 'EUR',
  FI: 'EUR',
  LU: 'EUR',
  GB: 'GBP',
  UK: 'GBP',
};

// Get user's location-based currency
export async function detectUserCurrency(): Promise<string> {
  try {
    // Try to get location from browser geolocation API
    if (navigator.geolocation) {
      return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            try {
              // Use reverse geocoding to get country
              const response = await fetch(
                `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${position.coords.latitude}&longitude=${position.coords.longitude}&localityLanguage=en`
              );
              const data = await response.json();
              const countryCode = data.countryCode;
              const currency = COUNTRY_CURRENCY_MAP[countryCode] || 'USD';
              resolve(currency);
            } catch {
              resolve('USD'); // Fallback to USD
            }
          },
          () => {
            resolve(detectCurrencyByIP());
          },
          { timeout: 5000 }
        );
      });
    }
    
    // Fallback to IP-based detection
    return detectCurrencyByIP();
  } catch {
    return 'USD'; // Ultimate fallback
  }
}

// Detect currency based on IP location
async function detectCurrencyByIP(): Promise<string> {
  try {
    const response = await fetch('https://ipapi.co/json/');
    const data = await response.json();
    const countryCode = data.country_code;
    return COUNTRY_CURRENCY_MAP[countryCode] || 'USD';
  } catch {
    // Fallback to browser locale
    return detectCurrencyByLocale();
  }
}

// Detect currency from browser locale
function detectCurrencyByLocale(): string {
  try {
    const locale = navigator.language || 'en-US';
    
    // Common locale to currency mappings
    if (locale.includes('en-US') || locale.includes('en-CA')) return 'USD';
    if (locale.includes('en-IN') || locale.includes('hi')) return 'INR';
    if (locale.includes('en-GB')) return 'GBP';
    if (locale.includes('de') || locale.includes('fr') || locale.includes('it') || locale.includes('es')) return 'EUR';
    
    return 'USD'; // Default fallback
  } catch {
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