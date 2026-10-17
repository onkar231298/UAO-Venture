const HERO_INTERNAL_PATHS = new Set([
  "/",
  "/about",
  "/about-us",
  "/our-team",
  "/our-farmers",
  "/certifications",
  "/contact",
  "/ingredients",
  "/landing",
  "/products",
  "/health-support",
  "/login",
  "/forgot-password",
  "/reset-password",
  "/chat",
  "/register",
  "/customer/profile",
  "/customer/dashboard",
  "/customer/inquiries",
  "/customer/high-volume-bids",
  "/customer/sample-requests",
  "/customer/saved",
  "/customer/quotes",
  "/customer/downloads",
  "/customer/catalogs",
  "/customer/products",
  "/customer/search",
  "/product",
  "/blog",
  "/privacy-policy",
  "/terms-of-service",
  "/cookie-policy",
  "/industries",
  "/food-ingredients",
  "/organic-herbs",
  "/eu-organic-spices",
  "/bulk-organic-exporter-india",
  "/organic-spice-supplier-india",
  "/organic-ingredients-supplier-usa",
  "/organic-ingredients-supplier-germany",
  "/organic-ingredients-exporter-uae",
  "/presentation",
  "/packaging-solutions",
  "/services/quality-testing",
  "/services/rd-support",
  "/services/regulatory-compliance",
  "/services/custom-packaging",
  "/services/logistics-solutions",
]);

const HERO_INTERNAL_DYNAMIC_PATHS = [
  /^\/products\/[^/]+$/,
  /^\/ingredients\/[^/]+$/,
  /^\/health-support\/[^/]+$/,
  /^\/category\/[^/]+$/,
  /^\/search\/[^/]+$/,
  /^\/product\/[^/]+$/,
  /^\/blog\/[^/]+$/,
];

const HERO_SITE_ORIGIN = "https://brightfameorganic.com";

function isSupportedHeroInternalPath(pathname: string): boolean {
  return HERO_INTERNAL_PATHS.has(pathname)
    || HERO_INTERNAL_DYNAMIC_PATHS.some((pattern) => pattern.test(pathname));
}

export function getSafeHeroActionHref(value: string | null | undefined): string | null {
  const href = value?.trim();
  if (!href || /[\u0000-\u001f\u007f\\]/.test(href)) return null;

  try {
    if (href.startsWith("/")) {
      if (href.startsWith("//")) return null;
      const url = new URL(href, HERO_SITE_ORIGIN);
      if (url.origin !== HERO_SITE_ORIGIN || !isSupportedHeroInternalPath(url.pathname)) return null;
      return `${url.pathname}${url.search}${url.hash}`;
    }

    const url = new URL(href);
    if ((url.protocol !== "http:" && url.protocol !== "https:") || !url.hostname || url.username || url.password) {
      return null;
    }
    return url.toString();
  } catch {
    return null;
  }
}

export function isExternalHeroActionHref(href: string): boolean {
  return !href.startsWith("/");
}

export function isSafeHeroActionDestination(value: string): boolean {
  return value.trim() === "" || getSafeHeroActionHref(value) !== null;
}
