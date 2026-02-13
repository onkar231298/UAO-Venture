import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Grid, 
  List, 
  Package2,
  Heart,
  Eye,
  ShoppingCart,
  Search
} from "lucide-react";
import { LocationBasedPricing } from "@/components/LocationBasedPricing";
import { useSEO } from "@/hooks/useSEO";

interface Product {
  id: number;
  productId: string;
  name: string;
  slug: string;
  description: string | null;
  mainImage: string | null;
  mainImageThumbnail: string | null;
  mainImageMedium: string | null;
  mainImageLarge: string | null;
  tags: string[] | null;
  category: string | null;
  price: number | null;
  currency: string | null;
  inStock: boolean | null;
}

export default function SearchResults() {
  const { query } = useParams();
  const [, setLocation] = useLocation();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 24;

  // Decode the search query (handles both encoded and non-encoded URLs)
  const searchQuery = query ? decodeURIComponent(query) : '';

  // Fetch search results
  const { data: productsData, isLoading, error } = useQuery<{ products: Product[]; total: number }>({
    queryKey: ["/api/products", "search", searchQuery, currentPage],
    queryFn: async () => {
      if (!searchQuery?.trim()) return { products: [], total: 0 };
      
      const params = new URLSearchParams();
      params.append('search', searchQuery.trim());
      params.append('limit', itemsPerPage.toString());
      params.append('offset', ((currentPage - 1) * itemsPerPage).toString());
      
      const response = await fetch(`/api/products?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`);
      }
      return response.json();
    },
    enabled: !!searchQuery?.trim(),
    staleTime: 30000,
    retry: 1
  });

  // Initialize SEO for search results page
  useSEO({
    title: searchQuery ? `Search Results for "${searchQuery}" - Bright Fame Organic` : 'Search Results - Bright Fame Organic',
    description: searchQuery ? `Search results for "${searchQuery}". Find premium organic ingredients, herbal extracts, and natural products matching your search.` : 'Search for premium organic ingredients and natural products.',
    keywords: searchQuery ? `${searchQuery}, organic ingredients, herbal extracts, natural products, search results` : 'organic ingredients, search, natural products',
    canonicalUrl: `${window.location.origin}/search/${searchQuery ? encodeURIComponent(searchQuery) : ''}`,
    pageType: "search",
    pageId: searchQuery ? `search-${encodeURIComponent(searchQuery)}` : 'search'
  });

  // Console log for debugging
  useEffect(() => {
    console.log('SearchResults mounted', { query, searchQuery, productsData });
  }, [query, searchQuery, productsData]);

  const products = productsData?.products || [];
  const totalPages = Math.ceil((productsData?.total || 0) / itemsPerPage);

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-16">
            <Search className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Search Error</h1>
            <p className="text-gray-500 mb-4">There was an error with your search. Please try again.</p>
            <Button onClick={() => setLocation('/products')}>
              Browse All Products
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Show empty search state
  if (!searchQuery?.trim()) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-16">
            <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">No search query provided</h1>
            <p className="text-gray-500 mb-4">Please enter a search term to find products.</p>
            <Button onClick={() => setLocation('/products')}>
              Browse All Products
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Search Results Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <span>Home</span>
            <span>/</span>
            <span>Search</span>
            <span>/</span>
            <span className="text-green-600 font-medium">"{searchQuery}"</span>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Search Results for "{searchQuery}"
          </h1>
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <p className="text-gray-600">
              {productsData?.total || 0} products found {productsData?.total === 0 ? '' : `matching "${searchQuery}"`}
            </p>
            
            <div className="flex items-center gap-4">
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
              
              {/* View toggle only - remove sorting for simplicity */}
              <span className="text-sm text-gray-500">
                Sorted by relevance
              </span>
            </div>
          </div>
        </div>

        {/* Search Results */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, index) => (
              <Card key={index} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="aspect-square bg-gray-200 rounded-lg mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : products.length > 0 ? (
          <div className={viewMode === 'grid' 
            ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" 
            : "space-y-4"
          }>
            {products.map((product) => (
              <Card 
                key={product.id} 
                className={`group hover:shadow-lg transition-all duration-200 cursor-pointer ${
                  viewMode === 'list' ? 'flex' : ''
                }`}
                onClick={() => setLocation(`/products/${product.slug}`)}
              >
                <CardContent className={`p-4 ${viewMode === 'list' ? 'flex items-center gap-4 w-full' : ''}`}>
                  {/* Product Image */}
                  <div className={`${viewMode === 'list' ? 'w-24 h-24 flex-shrink-0' : 'aspect-square'} bg-gray-100 rounded-lg mb-4 relative overflow-hidden`}>
                    {product.mainImageThumbnail || product.mainImage ? (
                      <img 
                        src={product.mainImageThumbnail || product.mainImage || ''} 
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package2 className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                    
                    {/* Quick Actions */}
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <div className="flex flex-col gap-1">
                        <Button size="sm" variant="secondary" className="h-8 w-8 p-0">
                          <Heart className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="secondary" className="h-8 w-8 p-0">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <div className={viewMode === 'list' ? 'flex-1' : ''}>
                    {/* Product Info */}
                    <div className="mb-3">
                      <h3 className="font-semibold text-gray-900 line-clamp-2 mb-1 group-hover:text-green-600 transition-colors">
                        {product.name}
                      </h3>
                      <p className="text-sm text-gray-500 mb-2">SKU: {product.productId}</p>
                      
                      {/* Tags */}
                      {product.tags && Array.isArray(product.tags) && product.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {product.tags.slice(0, 2).map((tag, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {String(tag)}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    {/* Pricing */}
                    <div className="mb-3">
                      <LocationBasedPricing 
                        product={product} 
                        showCurrencySelector={false}
                        isAdminView={false}
                        className="text-sm"
                      />
                    </div>
                    
                    {/* Action Button */}
                    <Button 
                      size="sm" 
                      className="w-full bg-green-600 hover:bg-green-700"
                      onClick={(e) => {
                        e.stopPropagation();
                        setLocation(`/products/${product.slug}`);
                      }}
                    >
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-500 mb-4">
              We couldn't find any products matching "{searchQuery}". Try different keywords or browse our categories.
            </p>
            <div className="flex gap-4 justify-center">
              <Button 
                variant="outline"
                onClick={() => setLocation('/products')}
              >
                Browse All Products
              </Button>
              <Button 
                onClick={() => setLocation('/')}
              >
                Go to Homepage
              </Button>
            </div>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-8">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const page = i + 1;
              return (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </Button>
              );
            })}
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        )}
      </div>
      
      <Footer />
    </div>
  );
}