import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import HealthSupportSidebar from "@/components/HealthSupportSidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Heart, Filter, ArrowUpDown, Search, ChevronDown, ChevronUp, Menu, X, Grid, List } from "lucide-react";
import { useState, useEffect } from "react";
import type { Product } from "@shared/schema";

export default function HealthSupportPage() {
  const [, params] = useRoute("/health-support/:slug");
  const slug = params?.slug || "";
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [showHealthSupportSidebar, setShowHealthSupportSidebar] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Fetch all health supports
  const { data: healthSupports } = useQuery({
    queryKey: ["/api/health-supports"],
    queryFn: async () => {
      const response = await fetch(`/api/health-supports`);
      if (!response.ok) throw new Error('Failed to fetch health supports');
      return response.json();
    },
  });

  // Fetch products for this health support
  const { data: productsData, isLoading } = useQuery<{ products: Product[]; total: number }>({
    queryKey: ["/api/products", "health-support", slug, sortBy, sortOrder],
    queryFn: async () => {
      const params = new URLSearchParams({
        healthSupport: slug,
        limit: "100",
        sortBy,
        sortOrder,
      });
      const response = await fetch(`/api/products?${params}`);
      if (!response.ok) throw new Error('Failed to fetch products');
      return response.json();
    },
    enabled: !!slug,
  });

  // Derived values
  const healthSupport = healthSupports?.find((hs: any) => hs.slug === slug);
  const products = productsData?.products || [];
  const totalProducts = productsData?.total || 0;
  const healthSupportName = healthSupport?.name || slug.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());

  // Check for mobile view
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Set document title and meta description
  useEffect(() => {
    document.title = `${healthSupportName} - Organic Ingredients | BFI Organic`;
    
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.setAttribute('name', 'description');
      document.head.appendChild(metaDescription);
    }
    metaDescription.setAttribute('content', `Discover organic ingredients specifically designed for ${healthSupportName.toLowerCase()}. Browse our premium collection of natural products for optimal health and wellness.`);
  }, [healthSupportName]);

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  // Early return for invalid slug only after all hooks are called
  if (!slug) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Health Support Category Not Found</h1>
            <p className="text-gray-600">The health support category you're looking for doesn't exist.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              {healthSupportName}
            </h1>
            <p className="text-lg md:text-xl text-green-100 mb-6">
              Discover premium organic ingredients specifically designed for {healthSupportName.toLowerCase()}
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              <Badge variant="secondary" className="bg-white/20 text-white">
                {totalProducts} Product{totalProducts !== 1 ? 's' : ''} Available
              </Badge>
              <Badge variant="secondary" className="bg-white/20 text-white">
                Organic Certified
              </Badge>
              <Badge variant="secondary" className="bg-white/20 text-white">
                Premium Quality
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* Sidebar - Desktop */}
          {!isMobile && (
            <div className="w-64 flex-shrink-0">
              <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-6">
                {/* Search */}
                <div className="mb-6">
                  <Label htmlFor="search" className="text-sm font-medium mb-2 block">
                    Search Products
                  </Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="search"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search ingredients..."
                      className="pl-10"
                    />
                  </div>
                </div>

                <Separator className="mb-6" />

                {/* Health Support Categories */}
                <div className="mb-6">
                  <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <Heart className="w-4 h-4 text-green-600" />
                    Other Health Categories
                  </h3>
                  <ScrollArea className="h-48">
                    {healthSupports?.map((hs: any) => (
                      <div key={hs.id} className="mb-2">
                        <div className={`p-2 rounded-md text-sm cursor-pointer transition-colors ${
                          hs.slug === slug 
                            ? 'bg-green-50 text-green-700 border border-green-200' 
                            : 'hover:bg-gray-50 text-gray-700'
                        }`}>
                          <a href={`/health-support/${hs.slug}`} className="block">
                            {hs.name}
                          </a>
                        </div>
                      </div>
                    ))}
                  </ScrollArea>
                </div>

                <Separator className="mb-6" />

                {/* View All Health Support */}
                <div className="text-center">
                  <a 
                    href="/health-support" 
                    className="text-sm text-green-600 hover:text-green-700 font-medium"
                  >
                    View All Health Categories →
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Main Products Area */}
          <div className="flex-1">
            {/* Mobile Filter Toggle */}
            {isMobile && (
              <div className="flex items-center gap-4 mb-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowHealthSupportSidebar(true)}
                  className="flex items-center gap-2"
                >
                  <Heart className="w-4 h-4" />
                  Health Categories
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2"
                >
                  <Filter className="w-4 h-4" />
                  Filters
                  {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </Button>
              </div>
            )}

            {/* Mobile Filters */}
            {isMobile && showFilters && (
              <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="mobile-search" className="text-sm font-medium mb-2 block">
                      Search Products
                    </Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        id="mobile-search"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search ingredients..."
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Filters and Sort Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-gray-600" />
                <span className="text-sm text-gray-600">
                  Showing {products.length} of {totalProducts} products
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                {/* View Mode Toggle */}
                <div className="flex items-center gap-1 border border-gray-200 rounded-lg p-1">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => setViewMode('grid')}
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => setViewMode('list')}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>

                {/* Sort Dropdown */}
                <select
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [field, order] = e.target.value.split('-');
                    setSortBy(field);
                    setSortOrder(order as 'asc' | 'desc');
                  }}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
                >
                  <option value="name-asc">Name A-Z</option>
                  <option value="name-desc">Name Z-A</option>
                  <option value="price-asc">Price Low to High</option>
                  <option value="price-desc">Price High to Low</option>
                </select>
              </div>
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className={viewMode === 'grid' 
                ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6" 
                : "space-y-4"
              }>
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="bg-white rounded-lg p-4 animate-pulse">
                    <div className="bg-gray-200 h-48 rounded-lg mb-4"></div>
                    <div className="bg-gray-200 h-4 rounded mb-2"></div>
                    <div className="bg-gray-200 h-4 rounded w-3/4"></div>
                  </div>
                ))}
              </div>
            )}

            {/* Products Grid/List */}
            {!isLoading && products.length > 0 && (
              <div className={viewMode === 'grid' 
                ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6" 
                : "space-y-4"
              }>
                {products.map((product) => (
                  <ProductCard key={product.id} product={product as any} />
                ))}
              </div>
            )}

            {/* Empty State */}
            {!isLoading && products.length === 0 && (
              <div className="text-center py-16">
                <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  No products found
                </h3>
                <p className="text-gray-600 mb-6">
                  We don't have any products available for {healthSupportName.toLowerCase()} at the moment.
                </p>
                <Button 
                  onClick={() => window.history.back()}
                  variant="outline"
                >
                  Go Back
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Health Support Sidebar */}
      <HealthSupportSidebar
        isOpen={showHealthSupportSidebar}
        onClose={() => setShowHealthSupportSidebar(false)}
        currentSlug={slug}
      />

      <Footer />
    </div>
  );
}