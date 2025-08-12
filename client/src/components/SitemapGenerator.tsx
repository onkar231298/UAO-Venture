import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { Product, Category } from '@shared/schema';

// Generate sitemap for better SEO indexing
export default function SitemapGenerator() {
  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ['/api/products'],
    queryFn: () => fetch('/api/products?limit=1000').then(res => res.json()).then(data => data.products || [])
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['/api/categories']
  });

  useEffect(() => {
    if (products.length === 0 || categories.length === 0) return;

    generateSitemap(products, categories);
  }, [products, categories]);

  return null;
}

function generateSitemap(products: Product[], categories: Category[]) {
  const baseUrl = window.location.origin;
  const currentDate = new Date().toISOString().split('T')[0];

  const sitemapUrls = [
    // Homepage
    {
      loc: baseUrl,
      lastmod: currentDate,
      changefreq: 'daily',
      priority: '1.0'
    },
    
    // Main products page
    {
      loc: `${baseUrl}/products`,
      lastmod: currentDate,
      changefreq: 'daily',
      priority: '0.9'
    },

    // Main ingredients page
    {
      loc: `${baseUrl}/ingredients`,
      lastmod: currentDate,
      changefreq: 'weekly',
      priority: '0.8'
    },

    // Category pages
    ...categories.map(category => ({
      loc: `${baseUrl}/ingredients/${category.slug}`,
      lastmod: currentDate,
      changefreq: 'weekly',
      priority: '0.8'
    })),

    // Product pages
    ...products.map(product => ({
      loc: `${baseUrl}/products/${product.slug}`,
      lastmod: product.updatedAt ? new Date(product.updatedAt).toISOString().split('T')[0] : currentDate,
      changefreq: 'weekly',
      priority: '0.7'
    })),

    // Health support pages (if they exist)
    {
      loc: `${baseUrl}/health-support`,
      lastmod: currentDate,
      changefreq: 'weekly',
      priority: '0.6'
    },

    // Static pages
    {
      loc: `${baseUrl}/about`,
      lastmod: currentDate,
      changefreq: 'monthly',
      priority: '0.5'
    },
    {
      loc: `${baseUrl}/contact`,
      lastmod: currentDate,
      changefreq: 'monthly',
      priority: '0.5'
    },
    {
      loc: `${baseUrl}/certifications`,
      lastmod: currentDate,
      changefreq: 'monthly',
      priority: '0.6'
    }
  ];

  // Generate XML sitemap
  const sitemapXML = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${sitemapUrls.map(url => `  <url>
    <loc>${url.loc}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  // Store in localStorage for admin to download or submit to search engines
  localStorage.setItem('generated-sitemap', sitemapXML);
  
  // Log for development
  if (import.meta.env.DEV) {
    console.log('✅ Sitemap generated with', sitemapUrls.length, 'URLs');
    console.log('📄 Access sitemap XML from localStorage key: generated-sitemap');
  }

  // Create robots.txt content
  const robotsTxt = `User-agent: *
Allow: /

# Sitemaps
Sitemap: ${baseUrl}/sitemap.xml

# Crawl-delay for respectful crawling
Crawl-delay: 1

# Block admin areas
Disallow: /admin/
Disallow: /api/
Disallow: /_internal/

# Allow important directories
Allow: /products/
Allow: /ingredients/
Allow: /health-support/
Allow: /images/
Allow: /assets/

# Block search URLs with parameters to avoid duplicate content
Disallow: /*?search=*
Disallow: /*?filter=*
Disallow: /*?page=*

# Allow specific search engine bots
User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /

User-agent: Slurp
Allow: /

# Block AI training crawlers if desired
User-agent: GPTBot
Disallow: /

User-agent: ChatGPT-User
Disallow: /

User-agent: CCBot
Disallow: /

User-agent: anthropic-ai
Disallow: /

User-agent: Claude-Web
Disallow: /`;

  localStorage.setItem('generated-robots-txt', robotsTxt);
  
  if (import.meta.env.DEV) {
    console.log('🤖 Robots.txt generated - access from localStorage key: generated-robots-txt');
  }
}

// Export function to download sitemap
export function downloadSitemap() {
  const sitemap = localStorage.getItem('generated-sitemap');
  if (!sitemap) {
    console.error('No sitemap found. Please generate it first.');
    return;
  }

  const blob = new Blob([sitemap], { type: 'application/xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'sitemap.xml';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Export function to download robots.txt
export function downloadRobotsTxt() {
  const robotsTxt = localStorage.getItem('generated-robots-txt');
  if (!robotsTxt) {
    console.error('No robots.txt found. Please generate it first.');
    return;
  }

  const blob = new Blob([robotsTxt], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'robots.txt';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}