// Utility functions for dynamic pricing calculations

export interface PricingTier {
  quantity: number;
  price: number;
  discount: number;
}

export interface PricingConfig {
  basePrice: number;
  moq: number;
  currency: string;
  discountTiers: {
    tier2Multiplier: number;
    tier3Multiplier: number;
    tier4Multiplier: number;
    tier5Multiplier: number;
    tier2Discount: number;
    tier3Discount: number;
    tier4Discount: number;
    tier5Discount: number;
  };
}

/**
 * Generate dynamic pricing tiers based on MOQ and configuration
 */
export function generateDynamicPricingTiers(
  moq: number, 
  basePrice: number, 
  config?: Partial<PricingConfig['discountTiers']>
): PricingTier[] {
  const defaultConfig = {
    tier2Multiplier: 2.5,
    tier3Multiplier: 5,
    tier4Multiplier: 10,
    tier5Multiplier: 25,
    tier2Discount: 3,
    tier3Discount: 6,
    tier4Discount: 10,
    tier5Discount: 15,
    ...config
  };

  const tiers: PricingTier[] = [];
  
  // Tier 1: MOQ (base price, no discount)
  tiers.push({ quantity: moq, price: basePrice, discount: 0 });
  
  // Tier 2: 2.5x MOQ (3% discount)
  const tier2Qty = Math.ceil(moq * defaultConfig.tier2Multiplier);
  if (tier2Qty > moq) {
    tiers.push({ quantity: tier2Qty, price: basePrice, discount: defaultConfig.tier2Discount });
  }
  
  // Tier 3: 5x MOQ (6% discount)
  const tier3Qty = Math.ceil(moq * defaultConfig.tier3Multiplier);
  if (tier3Qty > tier2Qty) {
    tiers.push({ quantity: tier3Qty, price: basePrice, discount: defaultConfig.tier3Discount });
  }
  
  // Tier 4: 10x MOQ (10% discount)
  const tier4Qty = Math.ceil(moq * defaultConfig.tier4Multiplier);
  if (tier4Qty > tier3Qty) {
    tiers.push({ quantity: tier4Qty, price: basePrice, discount: defaultConfig.tier4Discount });
  }
  
  // Tier 5: 25x MOQ (15% discount) - for bulk orders
  const tier5Qty = Math.ceil(moq * defaultConfig.tier5Multiplier);
  if (tier5Qty > tier4Qty) {
    tiers.push({ quantity: tier5Qty, price: basePrice, discount: defaultConfig.tier5Discount });
  }
  
  return tiers;
}

/**
 * Calculate price with discount applied
 */
export function calculateDiscountedPrice(basePrice: number, discount: number): number {
  return basePrice * (1 - discount / 100);
}

/**
 * Find applicable pricing tier for a given quantity
 */
export function findApplicableTier(quantity: number, tiers: PricingTier[]): PricingTier {
  let applicableTier = tiers[0];
  for (const tier of tiers) {
    if (quantity >= tier.quantity) {
      applicableTier = tier;
    }
  }
  return applicableTier;
}

/**
 * Calculate total price for a quantity
 */
export function calculateTotalPrice(
  quantity: number, 
  tiers: PricingTier[]
): { totalPrice: number; discount: number; pricePerUnit: number } {
  const tier = findApplicableTier(quantity, tiers);
  const pricePerUnit = calculateDiscountedPrice(tier.price, tier.discount);
  const totalPrice = pricePerUnit * quantity;

  return {
    totalPrice,
    discount: tier.discount,
    pricePerUnit
  };
}

/**
 * Validate MOQ-based pricing configuration
 */
export function validatePricingConfig(moq: number, basePrice: number): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (moq <= 0) {
    errors.push('MOQ must be greater than 0');
  }
  
  if (basePrice <= 0) {
    errors.push('Base price must be greater than 0');
  }
  
  if (moq < 1) {
    errors.push('MOQ should be at least 1 unit');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Generate pricing table data for display
 */
export function generatePricingTableData(
  moq: number,
  basePrice: number,
  currency: string = 'USD',
  stockUnit: string = 'kg'
) {
  const tiers = generateDynamicPricingTiers(moq, basePrice);
  
  return tiers.map((tier, index) => ({
    id: index + 1,
    quantity: tier.quantity,
    quantityDisplay: `${tier.quantity.toLocaleString()} ${stockUnit}`,
    pricePerUnit: calculateDiscountedPrice(tier.price, tier.discount),
    discount: tier.discount,
    totalPrice: calculateDiscountedPrice(tier.price, tier.discount) * tier.quantity,
    savings: tier.discount > 0 ? `${tier.discount}%` : '0%',
    isMOQ: index === 0,
    currency
  }));
}