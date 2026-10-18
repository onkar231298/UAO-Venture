export interface CustomerSavedProduct {
  id: number;
  name: string;
  slug: string;
  productId: string;
  category: string;
  price: string | number | null;
  imageUrl: string | null;
}

const storageKey = (customerId: string) => `atlas_customer_saved_products:${customerId}`;

export function getCustomerSavedProducts(customerId: string): CustomerSavedProduct[] {
  if (typeof window === "undefined" || !customerId) return [];

  try {
    const value = localStorage.getItem(storageKey(customerId));
    if (!value) return [];
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter((product): product is CustomerSavedProduct =>
      typeof product?.id === "number" &&
      typeof product?.name === "string" &&
      typeof product?.slug === "string" &&
      typeof product?.productId === "string",
    );
  } catch (error) {
    console.error("Could not read saved products from this browser:", error);
    return [];
  }
}

export function isCustomerProductSaved(customerId: string, productId: number): boolean {
  return getCustomerSavedProducts(customerId).some((product) => product.id === productId);
}

export function toggleCustomerSavedProduct(
  customerId: string,
  product: {
    id: number;
    name: string;
    slug: string;
    productId: string;
    price?: string | number | null;
    primaryType?: { name?: string } | null;
    mainImageMedium?: string | null;
    mainImageThumbnail?: string | null;
    mainImage?: string | null;
  },
): boolean {
  if (typeof window === "undefined" || !customerId) {
    throw new Error("Sign in to save products.");
  }

  const saved = getCustomerSavedProducts(customerId);
  const alreadySaved = saved.some((item) => item.id === product.id);
  const next = alreadySaved
    ? saved.filter((item) => item.id !== product.id)
    : [
        ...saved,
        {
          id: product.id,
          name: product.name,
          slug: product.slug,
          productId: product.productId,
          category: product.primaryType?.name || "Product",
          price: product.price ?? null,
          imageUrl: product.mainImageMedium || product.mainImageThumbnail || product.mainImage || null,
        },
      ];

  try {
    localStorage.setItem(storageKey(customerId), JSON.stringify(next));
  } catch (error) {
    console.error("Could not save products in this browser:", error);
    throw new Error("Your browser could not save this product. Please check available storage and try again.");
  }

  window.dispatchEvent(new CustomEvent("atlas-customer-saved-products-changed", { detail: { customerId } }));
  return !alreadySaved;
}

export function removeCustomerSavedProduct(customerId: string, productId: number): void {
  if (typeof window === "undefined" || !customerId) return;
  const next = getCustomerSavedProducts(customerId).filter((product) => product.id !== productId);
  localStorage.setItem(storageKey(customerId), JSON.stringify(next));
  window.dispatchEvent(new CustomEvent("atlas-customer-saved-products-changed", { detail: { customerId } }));
}
