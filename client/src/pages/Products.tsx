import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Search, Filter, ChevronDown, ChevronUp, Leaf, Globe, Package2, Heart, Award, X } from "lucide-react";
import SmartSearch from "@/components/SmartSearch";
import ProductsPageStructuredData from "@/components/ProductsPageStructuredData";
import type { Product, Category } from "@shared/schema";
import { useSEO } from "@/hooks/useSEO";

interface ProductFilters {
  search: string;
  category: string[];
  healthSupport: string[];
  origin: string[];
  form: string[];
  materials: string[];
  productType: string[];
  priceRange: [number, number] | null;
  inStock: boolean | null;
}

export default function Products() {
  const [location] = useLocation();
  
  // Initialize SEO for products page
  useSEO({
    title: "Premium Organic Ingredients & Natural Products",
    description: "Discover our comprehensive range of organic ingredients, herbal extracts, and natural products. Certified organic, pharmaceutical grade, and sustainably sourced from global suppliers.",
    keywords: "organic ingredients, herbal extracts, natural products, pharmaceutical ingredients, nutraceutical ingredients, organic herbs, botanical extracts",
    canonicalUrl: `${window.location.origin}/products`,
    pageType: "products",
    pageId: "products-listing"
  });
  
  // Initialize filters from URL parameters
  const initializeFiltersFromURL = () => {
    const params = new URLSearchParams(window.location.search);
    return {
      search: params.get('search') || "",
      category: params.get('category') ? params.get('category')!.split(',') : [],
      healthSupport: params.get('healthSupport') ? params.get('healthSupport')!.split(',') : [],
      origin: params.get('origin') ? params.get('origin')!.split(',') : [],
      form: params.get('form') ? params.get('form')!.split(',') : [],
      materials: params.get('materials') ? params.get('materials')!.split(',') : [],
      productType: params.get('productType') ? params.get('productType')!.split(',') : [],
      priceRange: null,
      inStock: params.get('inStock') ? params.get('inStock') === 'true' : null,
    };
  };

  const [filters, setFilters] = useState<ProductFilters>(initializeFiltersFromURL);

  // Handle browser back/forward navigation
  useEffect(() => {
    const handlePopState = () => {
      // Reinitialize filters when user navigates back/forward
      setFilters(initializeFiltersFromURL());
      setCurrentPage(1);
    };

    // Listen for browser navigation events
    window.addEventListener('popstate', handlePopState);
    
    // Also handle page visibility changes (when user comes back to tab)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Page became visible, refresh filters from URL
        setFilters(initializeFiltersFromURL());
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [openSections, setOpenSections] = useState({
    category: true,
    healthSupport: true,
    origin: true,
    form: true,
    productType: true,
  });

  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 100;

  // Convert filters to URL query parameters
  const buildQueryParams = (filters: ProductFilters, page: number = 1) => {
    const params = new URLSearchParams();
    
    // Pagination parameters
    params.append('limit', itemsPerPage.toString());
    params.append('offset', ((page - 1) * itemsPerPage).toString());
    
    if (filters.search) params.append('search', filters.search);
    if (filters.category.length > 0) params.append('category', filters.category.join(','));
    if (filters.productType.length > 0) params.append('productType', filters.productType.join(','));
    if (filters.healthSupport.length > 0) params.append('healthSupport', filters.healthSupport.join(','));
    if (filters.origin.length > 0) params.append('origin', filters.origin.join(','));
    if (filters.form.length > 0) params.append('form', filters.form.join(','));
    if (filters.materials.length > 0) params.append('materials', filters.materials.join(','));
    if (filters.inStock !== null) params.append('inStock', filters.inStock.toString());
    if (filters.priceRange) {
      params.append('priceMin', filters.priceRange[0].toString());
      params.append('priceMax', filters.priceRange[1].toString());
    }
    
    return params.toString();
  };

  // Debounced filters for API calls (delay search by 500ms)
  const [debouncedFilters, setDebouncedFilters] = useState(filters);
  
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedFilters(filters);
    }, 300); // 300ms debounce for better UX
    
    return () => clearTimeout(timeoutId);
  }, [filters]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedFilters]);

  // Fetch products with debounced filters and pagination
  const { data: productsData, isLoading, refetch } = useQuery<{ products: Product[]; total: number }>({
    queryKey: ["/api/products", buildQueryParams(debouncedFilters, currentPage)],
    queryFn: async () => {
      const queryParams = buildQueryParams(debouncedFilters, currentPage);
      console.log('🔍 Frontend Query:', queryParams);
      console.log('🎯 Current filters:', debouncedFilters);
      const response = await fetch(`/api/products?${queryParams}`);
      if (!response.ok) throw new Error('Failed to fetch products');
      const data = await response.json();
      console.log('📊 Frontend Response:', { total: data.total, productCount: data.products?.length });
      return data;
    },
    staleTime: 0, // Always fresh data for product type testing
    gcTime: 60000, // Keep in cache for 1 minute only
    refetchOnWindowFocus: true, // Refetch when window gets focus
    refetchOnMount: true, // Always refetch on component mount
  });

  // Force refetch when coming back from another page
  useEffect(() => {
    const handleFocus = () => {
      refetch();
    };
    
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [refetch]);

  // Fetch categories
  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  // Fetch product types
  const { data: productTypes = [] } = useQuery({
    queryKey: ["/api/product-types"],
  });

  // Extract unique filter options from products
  const healthSupportOptions = [
    "Stress Relief", "Cognitive Function", "Stress & Mood Support", 
    "Cardiovascular Support", "Cognitive Support", "Anti-inflammatory",
    "Antioxidant", "Digestive Support", "Hormonal Balance", 
    "Immune Support", "Skin Health", "Energy & Vitality",
    "Respiratory Support", "Joint & Bone Health", "Weight Management", 
    "Detoxification", "Sleep Support"
  ];

  const originOptions = [
    "India", "China", "United States", "Germany", "Brazil", "Mexico",
    "Turkey", "Egypt", "Madagascar", "Sri Lanka", "Indonesia", "Peru"
  ];

  const formOptions = [
    "Powder", "Extract", "Oil", "Whole", "Capsule", "Tablet",
    "Liquid", "Dried", "Fresh", "Granules", "Flakes"
  ];

  const updateFilter = (key: keyof ProductFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const toggleArrayFilter = (key: keyof ProductFilters, value: string) => {
    setFilters(prev => {
      const currentArray = prev[key] as string[] || [];
      return {
        ...prev,
        [key]: currentArray.includes(value)
          ? currentArray.filter(item => item !== value)
          : [...currentArray, value]
      };
    });
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      category: [],
      healthSupport: [],
      origin: [],
      form: [],
      materials: [],
      productType: [],
      priceRange: null,
      inStock: null,
    });
  };

  const removeFilter = (filterType: string, value?: string) => {
    if (value) {
      // Handle array filters
      const key = filterType as keyof ProductFilters;
      if (key === 'category' || key === 'healthSupport' || key === 'origin' || key === 'form' || key === 'materials') {
        toggleArrayFilter(key, value);
      }
    } else {
      // Handle non-array filters
      if (filterType === 'search') {
        updateFilter('search', '');
      } else if (filterType === 'inStock') {
        updateFilter('inStock', null);
      } else {
        // Clear array filters
        const key = filterType as keyof ProductFilters;
        if (key === 'category' || key === 'healthSupport' || key === 'origin' || key === 'form' || key === 'materials') {
          updateFilter(key, []);
        }
      }
    }
  };

  // Update active filters for display
  useEffect(() => {
    const active: string[] = [];
    if (filters.search) active.push(`Search: ${filters.search}`);
    filters.category.forEach(cat => active.push(`Category: ${cat}`));
    filters.healthSupport.forEach(health => active.push(`Health: ${health}`));
    filters.origin.forEach(origin => active.push(`Origin: ${origin}`));
    filters.form.forEach(form => active.push(`Form: ${form}`));
    filters.materials.forEach(material => active.push(`Material: ${material}`));
    filters.productType.forEach(type => active.push(`Product Type: ${type}`));
    if (filters.inStock !== null) active.push(`In Stock: ${filters.inStock ? 'Yes' : 'No'}`);
    setActiveFilters(active);
  }, [filters]);

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  return (
    <div className="min-h-screen bg-background">
      <ProductsPageStructuredData products={productsData?.products || []} />
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Mobile Filter Toggle */}
          <div className="lg:hidden mb-4">
            <Button 
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              variant="outline" 
              className="w-full flex items-center justify-center gap-2"
            >
              <Filter className="h-4 w-4" />
              {showMobileFilters ? 'Hide Filters' : 'Show Filters'}
            </Button>
          </div>

          {/* Filters Sidebar */}
          <div className={`lg:w-80 space-y-6 ${showMobileFilters ? 'block' : 'hidden lg:block'}`}>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Filters
                </h2>
                {activeFilters.length > 0 && (
                  <Button variant="outline" size="sm" onClick={clearFilters}>
                    Clear All
                  </Button>
                )}
              </div>

              {/* Active Filters */}
              {activeFilters.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium mb-3">Active Filters</h3>
                  <div className="flex flex-wrap gap-2">
                    {activeFilters.map((filter, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center gap-1">
                        {filter}
                        <X 
                          className="h-3 w-3 cursor-pointer" 
                          onClick={() => {
                            const [type, value] = filter.split(': ');
                            const filterKey = type.toLowerCase().replace(' ', '');
                            removeFilter(filterKey, value);
                          }}
                        />
                      </Badge>
                    ))}
                  </div>
                  <Separator className="mt-4" />
                </div>
              )}

              {/* Search */}
              <div className="mb-6">
                <Label htmlFor="search" className="text-sm font-medium mb-2 block">
                  Search Products
                </Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="Search by name, description..."
                    value={filters.search}
                    onChange={(e) => updateFilter('search', e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>



              {/* Product Types */}
              <Collapsible open={openSections.productType} onOpenChange={() => toggleSection('productType')}>
                <CollapsibleTrigger className="flex items-center justify-between w-full p-3 text-left bg-gray-50 rounded-lg hover:bg-gray-100">
                  <span className="font-medium flex items-center gap-2">
                    <Award className="h-4 w-4" />
                    Product Types
                  </span>
                  {openSections.productType ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-3">
                  <ScrollArea className="h-48">
                    <div className="space-y-3">
                      {productTypes && productTypes.length > 0 ? productTypes.map((type: any) => (
                        <div key={type.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`productType-${type.id}`}
                            checked={filters.productType.includes(type.slug)}
                            onCheckedChange={() => toggleArrayFilter('productType', type.slug)}
                          />
                          <Label htmlFor={`productType-${type.id}`} className="text-sm">
                            {type.name}
                          </Label>
                        </div>
                      )) : (
                        <div className="text-sm text-gray-500 text-center py-2">
                          Loading product types...
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </CollapsibleContent>
              </Collapsible>

              {/* Categories */}
              <Collapsible open={openSections.category} onOpenChange={() => toggleSection('category')}>
                <CollapsibleTrigger className="flex items-center justify-between w-full p-3 text-left bg-gray-50 rounded-lg hover:bg-gray-100">
                  <span className="font-medium flex items-center gap-2">
                    <Package2 className="h-4 w-4" />
                    Categories
                  </span>
                  {openSections.category ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-3">
                  <ScrollArea className="h-48">
                    <div className="space-y-3">
                      {categories && categories.length > 0 ? categories.map((category) => (
                        <div key={category.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`category-${category.id}`}
                            checked={filters.category.includes(category.name)}
                            onCheckedChange={() => toggleArrayFilter('category', category.name)}
                          />
                          <Label htmlFor={`category-${category.id}`} className="text-sm">
                            {category.name}
                          </Label>
                        </div>
                      )) : (
                        <div className="text-sm text-gray-500 text-center py-2">
                          Loading categories...
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </CollapsibleContent>
              </Collapsible>

              {/* Health Support */}
              <Collapsible open={openSections.healthSupport} onOpenChange={() => toggleSection('healthSupport')}>
                <CollapsibleTrigger className="flex items-center justify-between w-full p-3 text-left bg-gray-50 rounded-lg hover:bg-gray-100">
                  <span className="font-medium flex items-center gap-2">
                    <Heart className="h-4 w-4" />
                    Health Support
                  </span>
                  {openSections.healthSupport ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-3">
                  <ScrollArea className="h-48">
                    <div className="space-y-3">
                      {healthSupportOptions.map((option) => (
                        <div key={option} className="flex items-center space-x-2">
                          <Checkbox
                            id={`health-${option}`}
                            checked={filters.healthSupport.includes(option)}
                            onCheckedChange={() => toggleArrayFilter('healthSupport', option)}
                          />
                          <Label htmlFor={`health-${option}`} className="text-sm">
                            {option}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CollapsibleContent>
              </Collapsible>

              {/* Country of Origin */}
              <Collapsible open={openSections.origin} onOpenChange={() => toggleSection('origin')}>
                <CollapsibleTrigger className="flex items-center justify-between w-full p-3 text-left bg-gray-50 rounded-lg hover:bg-gray-100">
                  <span className="font-medium flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Country of Origin
                  </span>
                  {openSections.origin ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-3">
                  <ScrollArea className="h-48">
                    <div className="space-y-3">
                      {originOptions.map((option) => (
                        <div key={option} className="flex items-center space-x-2">
                          <Checkbox
                            id={`origin-${option}`}
                            checked={filters.origin.includes(option)}
                            onCheckedChange={() => toggleArrayFilter('origin', option)}
                          />
                          <Label htmlFor={`origin-${option}`} className="text-sm">
                            {option}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CollapsibleContent>
              </Collapsible>

              {/* Form */}
              <Collapsible open={openSections.form} onOpenChange={() => toggleSection('form')}>
                <CollapsibleTrigger className="flex items-center justify-between w-full p-3 text-left bg-gray-50 rounded-lg hover:bg-gray-100">
                  <span className="font-medium flex items-center gap-2">
                    <Award className="h-4 w-4" />
                    Form of Product
                  </span>
                  {openSections.form ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-3">
                  <ScrollArea className="h-48">
                    <div className="space-y-3">
                      {formOptions.map((option) => (
                        <div key={option} className="flex items-center space-x-2">
                          <Checkbox
                            id={`form-${option}`}
                            checked={filters.form.includes(option)}
                            onCheckedChange={() => toggleArrayFilter('form', option)}
                          />
                          <Label htmlFor={`form-${option}`} className="text-sm">
                            {option}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CollapsibleContent>
              </Collapsible>

              {/* Product Types */}
              <Collapsible open={openSections.productType} onOpenChange={() => toggleSection('productType')}>
                <CollapsibleTrigger className="flex items-center justify-between w-full p-3 text-left bg-gray-50 rounded-lg hover:bg-gray-100">
                  <span className="font-medium flex items-center gap-2">
                    <Award className="h-4 w-4" />
                    Available Product Types
                  </span>
                  {openSections.productType ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-3">
                  <div className="space-y-3">
                    {productTypes && productTypes.length > 0 ? productTypes.map((type: any) => (
                      <div key={type.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`productType-${type.id}`}
                          checked={filters.productType.includes(type.slug)}
                          onCheckedChange={() => toggleArrayFilter('productType', type.slug)}
                        />
                        <Label htmlFor={`productType-${type.id}`} className="text-sm flex items-center gap-2">
                          {type.name}
                          {filters.productType.includes(type.slug) && (
                            <Badge variant="secondary" className="text-xs">
                              ★ Primary
                            </Badge>
                          )}
                        </Label>
                      </div>
                    )) : (
                      <div className="text-sm text-gray-500 text-center py-2">
                        Loading product types...
                      </div>
                    )}
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Stock Status */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Stock Status</Label>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="inStock"
                    checked={filters.inStock === true}
                    onCheckedChange={(checked) => updateFilter('inStock', checked ? true : null)}
                  />
                  <Label htmlFor="inStock" className="text-sm">In Stock Only</Label>
                </div>
              </div>
            </div>
          </div>

          {/* Products Grid */}
          <div className="flex-1">
            <div className="bg-white rounded-lg shadow-sm p-6">
              {/* Results Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">All Products</h1>
                  <p className="text-gray-600 mt-1">
                    {productsData?.total || 0} products found
                  </p>
                </div>
                <Select defaultValue="name">
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Name (A-Z)</SelectItem>
                    <SelectItem value="price-low">Price (Low to High)</SelectItem>
                    <SelectItem value="price-high">Price (High to Low)</SelectItem>
                    <SelectItem value="newest">Newest First</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Products Grid */}
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <Card key={index} className="animate-pulse">
                      <CardContent className="p-6">
                        <div className="bg-gray-200 h-48 rounded-lg mb-4"></div>
                        <div className="bg-gray-200 h-4 rounded mb-2"></div>
                        <div className="bg-gray-200 h-4 rounded w-3/4"></div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : productsData?.products && productsData.products.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {productsData.products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Package2 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
                  <p className="text-gray-600 mb-4">
                    Try adjusting your filters or search terms to find what you're looking for.
                  </p>
                  <Button onClick={clearFilters} variant="outline">
                    Clear Filters
                  </Button>
                </div>
              )}

              {/* Debug info */}
              {productsData && (
                <div className="text-sm text-gray-500 mb-4">
                  Showing {productsData.products.length} of {productsData.total} products
                </div>
              )}

              {/* Pagination */}
              {productsData && productsData.total > itemsPerPage && (
                <div className="flex justify-center mt-8">
                  <div className="flex items-center space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    
                    {/* Page numbers */}
                    {Array.from({ length: Math.min(5, Math.ceil(productsData.total / itemsPerPage)) }, (_, i) => {
                      const pageNum = i + 1;
                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(pageNum)}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                    
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(productsData.total / itemsPerPage)))}
                      disabled={currentPage >= Math.ceil(productsData.total / itemsPerPage)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}