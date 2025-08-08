import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductsPageStructuredData from "@/components/ProductsPageStructuredData";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Filter, 
  Grid, 
  List, 
  ArrowUpDown, 
  Package2,
  Star,
  Eye,
  Heart,
  ShoppingCart
} from "lucide-react";
import { LocationBasedPricing } from "@/components/LocationBasedPricing";
import type { Product, Category } from "@shared/schema";
import { useSEO } from "@/hooks/useSEO";

export default function CategoryPage() {
  const { slug } = useParams();
  const [location, setLocation] = useLocation();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('name');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 24;

  // Handle redirect from old /category/ URLs to new /ingredients/ URLs
  useEffect(() => {
    if (location.startsWith('/category/') && slug) {
      const newPath = `/ingredients/${slug}`;
      setLocation(newPath, { replace: true });
      return;
    }
  }, [location, slug, setLocation]);

  // Convert slug back to category name
  const categoryName = slug 
    ? slug.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())
    : '';

  // Initialize SEO for category page
  useSEO({
    title: `${categoryName} - Premium Organic Ingredients | BFI Organic`,
    description: `Discover our premium ${categoryName.toLowerCase()} collection. Certified organic, pharmaceutical grade, and sustainably sourced for maximum quality and efficacy.`,
    keywords: `${categoryName.toLowerCase()}, organic ${categoryName.toLowerCase()}, natural ${categoryName.toLowerCase()}, pharmaceutical grade, certified organic`,
    canonicalUrl: `${window.location.origin}/ingredients/${slug}`,
    pageType: "category",
    pageId: `category-${slug}`
  });

  // Fetch all categories for validation
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  // Find the matching category
  const category = categories.find(cat => 
    cat.name.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-') === slug
  );

  // Fetch products for this category
  const { data: productsData, isLoading, refetch } = useQuery<{ products: Product[]; total: number }>({
    queryKey: ["/api/products", "category", category?.name, currentPage, sortBy],
    queryFn: async () => {
      if (!category) return { products: [], total: 0 };
      
      const params = new URLSearchParams();
      params.append('category', category.name);
      params.append('limit', itemsPerPage.toString());
      params.append('offset', ((currentPage - 1) * itemsPerPage).toString());
      params.append('sortBy', sortBy);
      
      const response = await fetch(`/api/products?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch products');
      return response.json();
    },
    enabled: !!category,
    staleTime: 30000,
    gcTime: 300000,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  // Handle browser navigation and focus events
  useEffect(() => {
    const handleFocus = () => {
      if (category) refetch();
    };
    
    const handleVisibilityChange = () => {
      if (!document.hidden && category) {
        refetch();
      }
    };
    
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [refetch, category]);

  const products = productsData?.products || [];
  const totalPages = Math.ceil((productsData?.total || 0) / itemsPerPage);

  // Redirect to 404 if category not found
  useEffect(() => {
    if (categories.length > 0 && !category) {
      setLocation('/not-found');
    }
  }, [categories, category, setLocation]);

  if (!category && categories.length > 0) {
    return null; // Will redirect to 404
  }

  return (
    <div className="min-h-screen bg-background">
      <ProductsPageStructuredData products={products} />
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Category Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <span>Home</span>
            <span>/</span>
            <span>Categories</span>
            <span>/</span>
            <span className="text-green-600 font-medium">{categoryName}</span>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{categoryName}</h1>
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <p className="text-gray-600">
              {productsData?.total || 0} products found in {categoryName}
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
              
              {/* Sort Dropdown */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
              >
                <option value="name">Sort by Name</option>
                <option value="popularity">Sort by Popularity</option>
                <option value="price_low">Price: Low to High</option>
                <option value="price_high">Price: High to Low</option>
                <option value="newest">Newest First</option>
              </select>
            </div>
          </div>
        </div>

        {/* Products Grid/List */}
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
                onClick={() => setLocation(`/product/${product.slug}`)}
              >
                <CardContent className={`p-4 ${viewMode === 'list' ? 'flex items-center gap-4 w-full' : ''}`}>
                  {/* Product Image */}
                  <div className={`${viewMode === 'list' ? 'w-24 h-24 flex-shrink-0' : 'aspect-square'} bg-gray-100 rounded-lg mb-4 relative overflow-hidden`}>
                    {product.mainImage || (product.galleryImages && Array.isArray(product.galleryImages) && product.galleryImages.length > 0) ? (
                      <img 
                        src={product.mainImage || (product.galleryImages as any[])[0]?.url || (product.galleryImages as any[])[0]} 
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
                          {product.tags.slice(0, 2).map((tag: unknown, index: number) => (
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
                        setLocation(`/product/${product.slug}`);
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
            <Package2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-500">We couldn't find any products in {categoryName} category.</p>
            <Button 
              className="mt-4"
              onClick={() => setLocation('/products')}
            >
              Browse All Products
            </Button>
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