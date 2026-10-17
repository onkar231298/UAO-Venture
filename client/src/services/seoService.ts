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
      const response = await fetch('/api/seo/settings');
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
    if (this.settings.enableAutoMetaTags && window.location.pathname === '/') {
      this.updateDocumentTitle();
      this.updateMetaDescription();
      this.updateMetaKeywords();
    }

    // Structured data is rendered by the server from validated factual fields.
    // Add analytics tracking only.
    this.addAnalyticsTracking();
  }

  // Update document title from the configured global setting.
  private updateDocumentTitle() {
    if (!this.settings?.siteTitle) return;
    
    document.title = this.settings.siteTitle;
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

  // Update meta keywords from configured terms only.
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

  // Get configured keywords. Do not infer a visitor's region from timezone.
  private getAllKeywords(): string {
    if (!this.settings) return '';

    const keywords = [
      this.settings.primaryKeywords,
      this.settings.pharmaceuticalKeywords,
      this.settings.nutraceuticalKeywords
    ].filter(Boolean).join(', ');

    return keywords;
  }

  // Add Organization Schema for better SEO
  private addOrganizationSchema() {
    if (!this.settings) return;

    const configuredSchema = this.settings.organizationSchema && typeof this.settings.organizationSchema === 'object'
      ? this.settings.organizationSchema as Record<string, unknown>
      : {};
    const organizationSchema = {
       ...configuredSchema,
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "Atlas Ingredients",
       "url": "https://bright-organic.com",
       "logo": "https://bright-organic.com/logo.png",
      "description": this.settings.siteDescription,
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "Opp. Murlidhar Guest House, Mehsana-Vishnagar Road, Kansarakui",
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
       "keywords": this.getAllKeywords(),
       "areaServed": [this.settings.businessLocation, this.settings.primaryTargetRegion].filter(Boolean)
    };

    this.addJSONLD('organization-schema', organizationSchema);
  }

  // Add Local Business Schema for local SEO
  private addLocalBusinessSchema() {
    if (!this.settings?.enableLocalSeo) return;

    const localBusinessSchema = {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      "name": "Atlas Ingredients",
       "image": "https://bright-organic.com/logo.png",
      "description": this.settings.siteDescription,
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "Opp. Murlidhar Guest House, Mehsana-Vishnagar Road, Kansarakui",
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
       "areaServed": [this.settings.businessLocation, this.settings.primaryTargetRegion].filter(Boolean),
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
    if (this.settings.googleAnalyticsId && /^(?:G-[A-Z0-9]{4,20}|UA-\d{4,12}-\d{1,4})$/.test(this.settings.googleAnalyticsId)) {
      this.addGoogleAnalytics(this.settings.googleAnalyticsId);
    }

    // Google Tag Manager
    if (this.settings.googleTagManagerId && /^GTM-[A-Z0-9]{4,20}$/.test(this.settings.googleTagManagerId)) {
      this.addGoogleTagManager(this.settings.googleTagManagerId);
    }

    // Facebook Pixel
    if (this.settings.facebookPixelId && /^\d{5,20}$/.test(this.settings.facebookPixelId)) {
      this.addFacebookPixel(this.settings.facebookPixelId);
    }
  }

  // Add Google Analytics
  private addGoogleAnalytics(gaId: string) {
    if ((window as any).gtag) {
      (window as any).gtag('config', gaId);
      return;
    }
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
      gtag('config', ${JSON.stringify(gaId)});
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
       })(window,document,'script','dataLayer',${JSON.stringify(gtmId)});
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
       fbq('init', ${JSON.stringify(pixelId)});
      fbq('track', 'PageView');
    `;
    document.head.appendChild(script);
  }

  // Update hreflang tags if enabled
  updateHreflangTags(pageType: string, pageId: string) {
    // Hreflang is rendered on the server exclusively from stored rows. The
    // client must not fabricate locale URLs from the current location.
    void pageType;
    void pageId;
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