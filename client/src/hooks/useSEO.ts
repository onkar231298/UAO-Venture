// Hook for applying SEO settings to individual pages
import { useEffect } from 'react';
import { seoService } from '@/services/seoService';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonicalUrl?: string;
  ogImage?: string;
  pageType?: string;
  pageId?: string;
}

export function useSEO({
  title,
  description,
  keywords,
  canonicalUrl,
  ogImage,
  pageType = 'page',
  pageId = '1'
}: SEOProps = {}) {
  useEffect(() => {
    const settings = seoService.getSettings();
    
    // Apply page-specific SEO
    if (title) {
      const fullTitle = settings?.enableAutoMetaTags 
        ? `${title} | ${settings.siteTitle || 'BFI Organic'}`
        : title;
      document.title = fullTitle;
    }

    if (description) {
      let metaDescription = document.querySelector('meta[name="description"]') as HTMLMetaElement;
      if (!metaDescription) {
        metaDescription = document.createElement('meta');
        metaDescription.name = 'description';
        document.head.appendChild(metaDescription);
      }
      metaDescription.content = description;
    }

    if (keywords) {
      let metaKeywords = document.querySelector('meta[name="keywords"]') as HTMLMetaElement;
      if (!metaKeywords) {
        metaKeywords = document.createElement('meta');
        metaKeywords.name = 'keywords';
        document.head.appendChild(metaKeywords);
      }
      metaKeywords.content = keywords;
    }

    // Add canonical URL
    if (canonicalUrl) {
      let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
      if (!canonical) {
        canonical = document.createElement('link');
        canonical.rel = 'canonical';
        document.head.appendChild(canonical);
      }
      canonical.href = canonicalUrl;
    }

    // Add Open Graph tags
    if (ogImage) {
      let ogImageTag = document.querySelector('meta[property="og:image"]') as HTMLMetaElement;
      if (!ogImageTag) {
        ogImageTag = document.createElement('meta');
        ogImageTag.setAttribute('property', 'og:image');
        document.head.appendChild(ogImageTag);
      }
      ogImageTag.content = ogImage;
    }

    // Update hreflang tags if enabled
    seoService.updateHreflangTags(pageType, pageId);

    // Track page view for SEO analytics
    seoService.trackSEOEvent('page_view', {
      page_title: title,
      page_type: pageType,
      page_id: pageId
    });

  }, [title, description, keywords, canonicalUrl, ogImage, pageType, pageId]);

  return {
    trackSEOEvent: seoService.trackSEOEvent.bind(seoService),
    getSettings: seoService.getSettings.bind(seoService)
  };
}