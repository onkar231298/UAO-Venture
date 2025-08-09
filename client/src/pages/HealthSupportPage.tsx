import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import ProductCard from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Filter, ArrowUpDown } from "lucide-react";
import { useState, useEffect } from "react";
import type { Product } from "@shared/schema";

export default function HealthSupportPage() {
  const [, params] = useRoute("/health-support/:slug");
  const slug = params?.slug || "";
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

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
    <div className="min-h-screen bg-gray-50">
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

      {/* Products Section */}
      <div className="container mx-auto px-4 py-8">
        {/* Filters and Sort */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-600" />
            <span className="text-sm text-gray-600">
              Showing {products.length} of {totalProducts} products
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Sort by:</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSort("name")}
              className="flex items-center gap-1"
            >
              Name
              <ArrowUpDown className="w-3 h-3" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSort("price")}
              className="flex items-center gap-1"
            >
              Price
              <ArrowUpDown className="w-3 h-3" />
            </Button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg p-4 animate-pulse">
                <div className="bg-gray-200 h-48 rounded-lg mb-4"></div>
                <div className="bg-gray-200 h-4 rounded mb-2"></div>
                <div className="bg-gray-200 h-4 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        )}

        {/* Products Grid */}
        {!isLoading && products.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
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
  );
}