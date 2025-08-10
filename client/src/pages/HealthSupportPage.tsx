import { useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import HealthSupportSidebar from "@/components/HealthSupportSidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Heart, Filter, ArrowUpDown, Search, ChevronDown, ChevronUp, Menu, X, Grid, List, Package2, Globe, Award, Leaf } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import type { Product, Category } from "@shared/schema";

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

export default function HealthSupportPage() {
  const [, params] = useRoute("/health-support/:slug");
  const [location] = useLocation();
  const slug = params?.slug || "";
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [showHealthSupportSidebar, setShowHealthSupportSidebar] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  
  // Initialize filters with current health support category pre-selected
  const initializeFiltersFromURL = () => {
    const params = new URLSearchParams(window.location.search);
    
    return {
      search: params.get('search') || "",
      category: params.get('category') ? params.get('category')!.split(',') : [],
      healthSupport: slug ? [slug] : [], // Pre-select current health support
      origin: params.get('origin') ? params.get('origin')!.split(',') : [],
      form: params.get('form') ? params.get('form')!.split(',') : [],
      materials: params.get('materials') ? params.get('materials')!.split(',') : [],
      productType: params.get('productType') ? params.get('productType')!.split(',') : [],
      priceRange: null,
      inStock: params.get('inStock') ? params.get('inStock') === 'true' : null,
    };
  };

  const [filters, setFilters] = useState<ProductFilters>(initializeFiltersFromURL);
  
  // Track collapsible sections state
  const [openSections, setOpenSections] = useState({
    productType: true,
    category: true,
    healthSupport: true,
    origin: false,
    form: false,
    materials: false,
  });

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    
    if (filters.search) params.set('search', filters.search);
    if (filters.category.length > 0) params.set('category', filters.category.join(','));
    if (filters.healthSupport.length > 0 && filters.healthSupport.join(',') !== slug) {
      params.set('healthSupport', filters.healthSupport.join(','));
    }
    if (filters.origin.length > 0) params.set('origin', filters.origin.join(','));
    if (filters.form.length > 0) params.set('form', filters.form.join(','));
    if (filters.materials.length > 0) params.set('materials', filters.materials.join(','));
    if (filters.productType.length > 0) params.set('productType', filters.productType.join(','));
    if (filters.inStock !== null) params.set('inStock', filters.inStock.toString());

    const newUrl = params.toString() ? `${location}?${params.toString()}` : location;
    if (newUrl !== window.location.href) {
      window.history.replaceState({}, '', newUrl);
    }
  }, [filters, location, slug]);

  // Reset health support filter when slug changes
  useEffect(() => {
    if (slug && !filters.healthSupport.includes(slug)) {
      setFilters(prev => ({
        ...prev,
        healthSupport: [slug]
      }));
    }
  }, [slug]);

  // Build query parameters for API call
  const queryParams = useMemo(() => {
    const params = new URLSearchParams();
    
    if (filters.search) params.set('search', filters.search);
    if (filters.category.length > 0) params.set('category', filters.category.join(','));
    if (filters.healthSupport.length > 0) params.set('healthSupport', filters.healthSupport.join(','));
    if (filters.origin.length > 0) params.set('origin', filters.origin.join(','));
    if (filters.form.length > 0) params.set('form', filters.form.join(','));
    if (filters.materials.length > 0) params.set('materials', filters.materials.join(','));
    if (filters.productType.length > 0) params.set('productType', filters.productType.join(','));
    if (filters.inStock !== null) params.set('inStock', filters.inStock.toString());
    
    params.set('limit', '100');
    
    return params.toString();
  }, [filters]);

  // Fetch all health supports
  const { data: healthSupports } = useQuery({
    queryKey: ["/api/health-supports"],
  });

  // Fetch categories
  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  // Fetch product types
  const { data: productTypes = [] } = useQuery({
    queryKey: ["/api/product-types"],
  });

  // Fetch products with filters
  const { data: productsData, isLoading, refetch } = useQuery<{ products: Product[]; total: number }>({
    queryKey: ["/api/products", queryParams],
    queryFn: async () => {
      const response = await fetch(`/api/products?${queryParams}`);
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

  // Filter options
  const healthSupportOptions = (healthSupports as any[])?.map((hs: any) => ({ name: hs.name, slug: hs.slug })) || [];
  
  const originOptions = [
    "India", "China", "United States", "Germany", "Brazil", "Mexico",
    "Turkey", "Egypt", "Madagascar", "Sri Lanka", "Indonesia", "Peru"
  ];

  const formOptions = [
    "Powder", "Extract", "Oil", "Whole", "Capsule", "Tablet",
    "Liquid", "Dried", "Fresh", "Granules", "Flakes"
  ];

  // Filter functions
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
      healthSupport: slug ? [slug] : [], // Keep current health support selected
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
      if (key === 'category' || key === 'healthSupport' || key === 'origin' || key === 'form' || key === 'materials' || key === 'productType') {
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
        if (key === 'category' || key === 'healthSupport' || key === 'origin' || key === 'form' || key === 'materials' || key === 'productType') {
          updateFilter(key, key === 'healthSupport' && slug ? [slug] : []);
        }
      }
    }
  };

  // Update active filters for display
  useEffect(() => {
    const active: string[] = [];
    if (filters.search) active.push(`Search: ${filters.search}`);
    filters.category.forEach(cat => active.push(`Category: ${cat}`));
    filters.healthSupport.forEach(health => {
      const healthSupportData = (healthSupports as any[])?.find((hs: any) => hs.slug === health);
      active.push(`Health: ${healthSupportData?.name || health}`);
    });
    filters.origin.forEach(origin => active.push(`Origin: ${origin}`));
    filters.form.forEach(form => active.push(`Form: ${form}`));
    filters.materials.forEach(material => active.push(`Material: ${material}`));
    filters.productType.forEach(type => {
      const productTypeData = (productTypes as any[])?.find((pt: any) => pt.slug === type);
      active.push(`Type: ${productTypeData?.name || type}`);
    });
    if (filters.inStock !== null) active.push(`In Stock: ${filters.inStock ? 'Yes' : 'No'}`);
    setActiveFilters(active);
  }, [filters, healthSupports, productTypes]);

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

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
                            // Map display names to actual filter keys
                            const keyMap: Record<string, string> = {
                              'Search': 'search',
                              'Category': 'category', 
                              'Health': 'healthSupport',
                              'Origin': 'origin',
                              'Form': 'form',
                              'Material': 'materials',
                              'Type': 'productType',
                              'In Stock': 'inStock'
                            };
                            const filterKey = keyMap[type] || type.toLowerCase().replace(' ', '');
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
                      {productTypes && (productTypes as any[]).length > 0 ? (productTypes as any[]).map((type: any) => (
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
                      {healthSupportOptions.map((option: any) => (
                        <div key={option.slug} className="flex items-center space-x-2">
                          <Checkbox
                            id={`health-${option.slug}`}
                            checked={filters.healthSupport.includes(option.slug)}
                            onCheckedChange={() => toggleArrayFilter('healthSupport', option.slug)}
                          />
                          <Label htmlFor={`health-${option.slug}`} className="text-sm">
                            {option.name}
                            {option.slug === slug && (
                              <Badge variant="outline" className="ml-2 text-xs">Current</Badge>
                            )}
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
                    <Leaf className="h-4 w-4" />
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

          {/* Main Products Area */}
          <div className="flex-1">
            <div className="bg-white rounded-lg shadow-sm p-6">
              {/* Results Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{healthSupportName}</h1>
                  <p className="text-gray-600 mt-1">
                    {totalProducts} products found
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
                    Try adjusting your filters or search terms to find what you're looking for.
                  </p>
                  <Button onClick={clearFilters} variant="outline">
                    Clear All Filters
                  </Button>
                </div>
              )}
            </div>
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