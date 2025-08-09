// SEO Service - Applies global SEO settings across the website
import type { GlobalSeoSettings } from "@shared/schema";

class SEOService {
  private static instance: SEOService;
  private settings: GlobalSeoSettings | null = null;

  private constructor() {}

  static getInstance(): SEOService {
    if (!SEOService.instance) {
      SEOService.instance = new SEOService();
    }
    return SEOService.instance;
  }

  // Initialize SEO settings
  async initializeSettings() {
    try {
      const response = await fetch('/api/admin/seo/settings');
      if (response.ok) {
        this.settings = await response.json();
        this.applyGlobalSEOSettings();
      }
    } catch (error) {
      console.error('Failed to load SEO settings:', error);
    }
  }

  // Apply global SEO settings to the current page
  private applyGlobalSEOSettings() {
    if (!this.settings) return;

    // Update document title if auto meta tags are enabled
    if (this.settings.enableAutoMetaTags) {
      this.updateDocumentTitle();
      this.updateMetaDescription();
      this.updateMetaKeywords();
    }

    // Add structured data if enabled
    if (this.settings.enableStructuredData) {
      this.addOrganizationSchema();
    }

    // Add local SEO if enabled
    if (this.settings.enableLocalSeo) {
      this.addLocalBusinessSchema();
    }

    // Add analytics tracking
    this.addAnalyticsTracking();
  }

  // Update document title with region-specific optimization
  private updateDocumentTitle() {
    if (!this.settings?.siteTitle) return;
    
    const currentPath = window.location.pathname;
    let title = this.settings.siteTitle;

    // Add region-specific keywords based on user location or preferences
    const regionKeywords = this.getRegionSpecificKeywords();
    if (regionKeywords && currentPath === '/') {
      title = `${title} | ${regionKeywords.split(',')[0]?.trim()}`;
    }

    document.title = title;
  }

  // Update meta description
  private updateMetaDescription() {
    if (!this.settings?.siteDescription) return;

    let metaDescription = document.querySelector('meta[name="description"]') as HTMLMetaElement;
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.name = 'description';
      document.head.appendChild(metaDescription);
    }
    metaDescription.content = this.settings.siteDescription;
  }

  // Update meta keywords with region-specific targeting
  private updateMetaKeywords() {
    const keywords = this.getAllKeywords();
    if (!keywords) return;

    let metaKeywords = document.querySelector('meta[name="keywords"]') as HTMLMetaElement;
    if (!metaKeywords) {
      metaKeywords = document.createElement('meta');
      metaKeywords.name = 'keywords';
      document.head.appendChild(metaKeywords);
    }
    metaKeywords.content = keywords;
  }

  // Get all relevant keywords including region-specific ones
  private getAllKeywords(): string {
    if (!this.settings) return '';

    const keywords = [
      this.settings.primaryKeywords,
      this.settings.pharmaceuticalKeywords,
      this.settings.nutraceuticalKeywords,
      this.getRegionSpecificKeywords()
    ].filter(Boolean).join(', ');

    return keywords;
  }

  // Get region-specific keywords based on user location
  private getRegionSpecificKeywords(): string {
    if (!this.settings) return '';

    // Simple region detection based on time zone or can be enhanced with IP geolocation
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    if (timeZone.includes('America')) {
      return this.settings.northAmericaKeywords || '';
    } else if (timeZone.includes('Europe')) {
      return this.settings.europeKeywords || '';
    } else if (timeZone.includes('Asia/Kolkata') || timeZone.includes('India')) {
      return this.settings.indiaKeywords || '';
    } else if (timeZone.includes('Asia')) {
      return this.settings.asiaPacificKeywords || '';
    } else if (timeZone.includes('Middle_East')) {
      return this.settings.middleEastKeywords || '';
    }

    return this.settings.primaryKeywords || '';
  }

  // Add Organization Schema for better SEO
  private addOrganizationSchema() {
    if (!this.settings) return;

    const organizationSchema = {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "Bright Fame Organic",
      "alternateName": "Bright Fame International",
      "url": window.location.origin,
      "logo": `${window.location.origin}/logo.png`,
      "description": this.settings.siteDescription,
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "C/O Bright Fame International, Opp. Murlidhar Guest House, Mehsana-Vishnagar Road, Kansarakui",
        "addressLocality": "Mehsana",
        "addressRegion": "Gujarat",
        "postalCode": "384001",
        "addressCountry": "IN"
      },
      "contactPoint": {
        "@type": "ContactPoint",
        "telephone": "+91-7249847439",
        "contactType": "Customer Service",
        "availableLanguage": ["English", "Hindi"]
      },
      "sameAs": [
        this.settings.twitterHandle ? `https://twitter.com/${this.settings.twitterHandle.replace('@', '')}` : null
      ].filter(Boolean),
      "keywords": this.getAllKeywords()
    };

    this.addJSONLD('organization-schema', organizationSchema);
  }

  // Add Local Business Schema for local SEO
  private addLocalBusinessSchema() {
    if (!this.settings?.enableLocalSeo) return;

    const localBusinessSchema = {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      "name": "Bright Fame Organic",
      "image": `${window.location.origin}/logo.png`,
      "description": this.settings.siteDescription,
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "C/O Bright Fame International, Opp. Murlidhar Guest House, Mehsana-Vishnagar Road, Kansarakui",
        "addressLocality": "Mehsana",
        "addressRegion": "Gujarat",
        "postalCode": "384001",
        "addressCountry": "IN"
      },
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": "23.5880",
        "longitude": "72.3693"
      },
      "telephone": "+91-7249847439",
      "priceRange": "$$",
      "openingHoursSpecification": [
        {
          "@type": "OpeningHoursSpecification",
          "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
          "opens": "09:00",
          "closes": "18:00"
        }
      ]
    };

    this.addJSONLD('local-business-schema', localBusinessSchema);
  }

  // Add JSON-LD structured data
  private addJSONLD(id: string, data: object) {
    // Remove existing schema with same ID
    const existing = document.getElementById(id);
    if (existing) {
      existing.remove();
    }

    const script = document.createElement('script');
    script.id = id;
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(data);
    document.head.appendChild(script);
  }

  // Add analytics tracking codes
  private addAnalyticsTracking() {
    if (!this.settings) return;

    // Google Analytics
    if (this.settings.googleAnalyticsId) {
      this.addGoogleAnalytics(this.settings.googleAnalyticsId);
    }

    // Google Tag Manager
    if (this.settings.googleTagManagerId) {
      this.addGoogleTagManager(this.settings.googleTagManagerId);
    }

    // Facebook Pixel
    if (this.settings.facebookPixelId) {
      this.addFacebookPixel(this.settings.facebookPixelId);
    }
  }

  // Add Google Analytics
  private addGoogleAnalytics(gaId: string) {
    if (document.querySelector(`script[src*="gtag/js?id=${gaId}"]`)) return;

    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
    document.head.appendChild(script);

    const inlineScript = document.createElement('script');
    inlineScript.textContent = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${gaId}');
    `;
    document.head.appendChild(inlineScript);
  }

  // Add Google Tag Manager
  private addGoogleTagManager(gtmId: string) {
    if (document.querySelector(`script[src*="googletagmanager.com/gtm.js?id=${gtmId}"]`)) return;

    const script = document.createElement('script');
    script.textContent = `
      (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
      new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
      j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
      'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
      })(window,document,'script','dataLayer','${gtmId}');
    `;
    document.head.appendChild(script);
  }

  // Add Facebook Pixel
  private addFacebookPixel(pixelId: string) {
    if (document.querySelector('script[src*="connect.facebook.net"]')) return;

    const script = document.createElement('script');
    script.textContent = `
      !function(f,b,e,v,n,t,s)
      {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s)}(window, document,'script',
      'https://connect.facebook.net/en_US/fbevents.js');
      fbq('init', '${pixelId}');
      fbq('track', 'PageView');
    `;
    document.head.appendChild(script);
  }

  // Update hreflang tags if enabled
  updateHreflangTags(pageType: string, pageId: string) {
    if (!this.settings?.enableHreflang) return;

    // Remove existing hreflang tags
    document.querySelectorAll('link[rel="alternate"]').forEach(el => el.remove());

    // Add hreflang tags for different regions
    const regions = [
      { lang: 'en', region: 'us', url: `${window.location.origin}/en-us${window.location.pathname}` },
      { lang: 'en', region: 'gb', url: `${window.location.origin}/en-gb${window.location.pathname}` },
      { lang: 'en', region: 'in', url: `${window.location.origin}/en-in${window.location.pathname}` },
      { lang: 'es', region: 'es', url: `${window.location.origin}/es-es${window.location.pathname}` },
    ];

    regions.forEach(({ lang, region, url }) => {
      const link = document.createElement('link');
      link.rel = 'alternate';
      link.hreflang = `${lang}-${region}`;
      link.href = url;
      document.head.appendChild(link);
    });

    // Add x-default
    const defaultLink = document.createElement('link');
    defaultLink.rel = 'alternate';
    defaultLink.hreflang = 'x-default';
    defaultLink.href = `${window.location.origin}${window.location.pathname}`;
    document.head.appendChild(defaultLink);
  }

  // Get current settings
  getSettings(): GlobalSeoSettings | null {
    return this.settings;
  }

  // Track SEO performance events
  trackSEOEvent(eventName: string, data?: object) {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', eventName, {
        event_category: 'SEO',
        ...data
      });
    }
  }
}

export const seoService = SEOService.getInstance();