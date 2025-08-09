import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useCustomerAuth } from "@/hooks/useCustomerAuth";
import { useQuery } from "@tanstack/react-query";
import type { Category, Product } from "@shared/schema";
import CategorySidebar from "@/components/CategorySidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator 
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  Leaf, 
  Search, 
  User, 
  Heart, 
  ShoppingCart, 
  Menu,
  Globe,
  ChevronDown,
  ChevronRight,
  Phone,
  LogOut,
  Settings,
  LayoutDashboard,
  FileText,
  Info,
  Award
} from "lucide-react";

export default function Header() {
  const [location, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth() as { user: any; isAuthenticated: boolean };
  const { customer, isCustomerAuthenticated, logoutCustomer } = useCustomerAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [showCategorySidebar, setShowCategorySidebar] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [mobileIngredientsOpen, setMobileIngredientsOpen] = useState(false);
  const [mobileHealthSupportOpen, setMobileHealthSupportOpen] = useState(false);
  const [mobileAboutOpen, setMobileAboutOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Fetch categories for ingredients dropdown
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  // Fetch health supports for health support dropdown
  const { data: healthSupports = [] } = useQuery({
    queryKey: ["/api/health-supports"],
  });

  // Fetch search suggestions when user types
  const { data: suggestionsData } = useQuery<{ products: Product[]; total: number }>({
    queryKey: ["/api/products", searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim()) return { products: [], total: 0 };
      const response = await fetch(`/api/products?search=${encodeURIComponent(searchQuery.trim())}&limit=5`);
      if (!response.ok) throw new Error('Failed to fetch suggestions');
      return response.json();
    },
    enabled: searchQuery.length >= 2,
  });

  // Update suggestions when data changes
  useEffect(() => {
    if (suggestionsData?.products) {
      setSuggestions(suggestionsData.products);
      setShowSuggestions(searchQuery.length >= 2 && suggestionsData.products.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [suggestionsData, searchQuery]);

  // Close suggestions and mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu when navigating to new page
  useEffect(() => {
    setShowMobileMenu(false);
    setShowCategorySidebar(false);
  }, [location]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setShowSuggestions(false);
      
      // Clean the search query
      const cleanQuery = searchQuery.trim();
      
      // Always go to search results page for comprehensive search
      // This ensures all matching products are shown, not just exact matches
      setSearchQuery("");
      setLocation(`/search/${encodeURIComponent(cleanQuery)}`);
    }
  };

  const handleSuggestionClick = (product: Product) => {
    setSearchQuery("");
    setShowSuggestions(false);
    // Navigate directly to product detail page using slug
    setLocation(`/product/${product.slug}`);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) {
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        // Navigate to first suggestion and trigger click
        if (suggestions.length > 0) {
          handleSuggestionClick(suggestions[0]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        break;
    }
  };

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  return (
    <header className="bg-white shadow-lg border-b border-gray-200 sticky top-0 z-50">
      {/* Top Line - Logo and Search */}
      <div className="bg-green-50 border-b border-green-100">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-2">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/">
              <div className="flex items-center cursor-pointer hover:opacity-90 transition-opacity">
                <img 
                  src="/attached_assets/Final Logo_1753730040470.png" 
                  alt="Bright Fame Organic" 
                  className="h-8 sm:h-10 w-auto object-contain"
                />
              </div>
            </Link>
            
            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden text-gray-600 hover:text-green-600 hover:bg-green-100"
              onClick={() => setShowMobileMenu(!showMobileMenu)}
            >
              <Menu className="h-5 w-5" />
            </Button>

            {/* Search and Actions */}
            <div className="hidden lg:flex items-center space-x-4">
              {/* Search */}
              <div className="relative">
                <form onSubmit={handleSearch} className="relative">
                  <input
                    type="text"
                    placeholder="Search ingredients..."
                    value={searchQuery}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    className="w-80 px-4 py-2 pl-10 text-sm border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                </form>

                {/* Search Suggestions */}
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-64 overflow-y-auto z-50">
                    {suggestions.map((product) => (
                      <div
                        key={product.id}
                        className="px-4 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                        onClick={() => handleSuggestionClick(product)}
                      >
                        <div className="text-sm font-medium text-gray-900">{product.name}</div>
                        <div className="text-xs text-gray-500">
                          {product.categories?.slice(0, 2).map(cat => cat.name).join(', ')}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Auth/Actions */}
              <div className="flex items-center space-x-3">
                {user ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-sm">
                        <User className="w-4 h-4 mr-2" />
                        {user.email}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {user.role === 'admin' && (
                        <Link href="/admin">
                          <DropdownMenuItem>Admin Dashboard</DropdownMenuItem>
                        </Link>
                      )}
                      {user.role === 'customer' && (
                        <Link href="/customer/dashboard">
                          <DropdownMenuItem>My Dashboard</DropdownMenuItem>
                        </Link>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleLogout}>
                        Logout
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Link href="/login">
                    <Button variant="outline" size="sm">
                      Login
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Line - Navigation */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-center">
          {/* Main Navigation */}
          <nav className="hidden lg:flex items-center space-x-8">
            <Link href="/" className={`text-sm text-gray-700 hover:text-green-600 font-medium transition-colors border-b-2 border-transparent hover:border-green-600 pb-1 ${location === '/' ? 'text-green-600 border-green-600' : ''}`}>
              Home
            </Link>
            <Link href="/products" className={`text-sm text-gray-700 hover:text-green-600 font-medium transition-colors border-b-2 border-transparent hover:border-green-600 pb-1 ${location === '/products' ? 'text-green-600 border-green-600' : ''}`}>
              Products
            </Link>
            <Link href="/blog" className={`text-sm text-gray-700 hover:text-green-600 font-medium transition-colors border-b-2 border-transparent hover:border-green-600 pb-1 ${location === '/blog' ? 'text-green-600 border-green-600' : ''}`}>
              Blog
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="text-sm text-gray-700 hover:text-green-600 font-medium transition-colors flex items-center border-b-2 border-transparent hover:border-green-600 pb-1 h-auto p-0">
                  Ingredients <ChevronDown className="ml-1 h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[500px] p-3 shadow-xl border border-gray-200" align="start">
                {/* All Ingredients Link */}
                  <Link href="/products">
                    <DropdownMenuItem className="mb-3 bg-green-500 hover:bg-green-600 font-semibold text-white py-3 rounded-md text-center cursor-pointer">
                      All Ingredients
                    </DropdownMenuItem>
                  </Link>
                  
                  <DropdownMenuSeparator className="mb-2" />
                  
                  {/* Categories in Three Columns */}
                  <div className="grid grid-cols-3 gap-1">
                    {categories && categories.length > 0 ? categories.map((category) => {
                      const categorySlug = category.name
                        .toLowerCase()
                        .replace(/[^a-z0-9\s]/g, '')
                        .replace(/\s+/g, '-')
                        .replace(/-+/g, '-')
                        .trim();
                      
                      return (
                        <Link key={category.id} href={`/ingredients/${categorySlug}`}>
                          <DropdownMenuItem className="text-xs px-2 py-1.5 hover:bg-gray-50 cursor-pointer leading-tight">
                            {category.name}
                          </DropdownMenuItem>
                        </Link>
                      );
                    }) : (
                      <>
                        {/* Fallback categories for immediate display */}
                        <Link href="/ingredients/herbal-powders">
                          <DropdownMenuItem className="text-xs px-2 py-1.5 hover:bg-gray-50 cursor-pointer leading-tight">
                            Herbal Powders
                          </DropdownMenuItem>
                        </Link>
                        <Link href="/ingredients/spices">
                          <DropdownMenuItem className="text-xs px-2 py-1.5 hover:bg-gray-50 cursor-pointer leading-tight">
                            Spices
                          </DropdownMenuItem>
                        </Link>
                        <Link href="/ingredients/essential-oils">
                          <DropdownMenuItem className="text-xs px-2 py-1.5 hover:bg-gray-50 cursor-pointer leading-tight">
                            Essential Oils
                          </DropdownMenuItem>
                        </Link>
                        <Link href="/ingredients/adaptogenic-herbs">
                          <DropdownMenuItem className="text-xs px-2 py-1.5 hover:bg-gray-50 cursor-pointer leading-tight">
                            Adaptogenic Herbs
                          </DropdownMenuItem>
                        </Link>
                        <Link href="/ingredients/ayurvedic-herbs">
                          <DropdownMenuItem className="text-xs px-2 py-1.5 hover:bg-gray-50 cursor-pointer leading-tight">
                            Ayurvedic Herbs
                          </DropdownMenuItem>
                        </Link>
                        <Link href="/ingredients/botanical-extracts">
                          <DropdownMenuItem className="text-xs px-2 py-1.5 hover:bg-gray-50 cursor-pointer leading-tight">
                            Botanical Extracts
                          </DropdownMenuItem>
                        </Link>
                      </>
                    )}
                  </div>
                  
                  {/* Show loading only if categories array is empty and loading */}
                  {(!categories || categories.length === 0) && (
                    <div className="text-sm text-gray-500 text-center py-2">
                      {categories === undefined ? 'Loading categories...' : 'No categories available'}
                    </div>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
              
              {/* Health Support Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="text-sm text-gray-700 hover:text-green-600 font-medium transition-colors flex items-center border-b-2 border-transparent hover:border-green-600 pb-1 h-auto p-0">
                  Health Support <ChevronDown className="ml-1 h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[500px] p-3 shadow-xl border border-gray-200" align="start">
                  {/* All Health Support Link */}
                  <Link href="/products">
                    <DropdownMenuItem className="mb-3 bg-green-500 hover:bg-green-600 font-semibold text-white py-3 rounded-md text-center cursor-pointer">
                      All Health Support
                    </DropdownMenuItem>
                  </Link>
                  
                  <DropdownMenuSeparator className="mb-2" />
                  
                  {/* Health Supports in Three Columns */}
                  <div className="grid grid-cols-3 gap-1">
                    {healthSupports && healthSupports.length > 0 ? healthSupports.map((healthSupport: any) => {
                      return (
                        <Link key={healthSupport.id} href={`/health-support/${healthSupport.slug}`}>
                          <DropdownMenuItem className="text-xs px-2 py-1.5 hover:bg-gray-50 cursor-pointer leading-tight">
                            {healthSupport.name}
                          </DropdownMenuItem>
                        </Link>
                      );
                    }) : (
                      <>
                        {/* Fallback health supports for immediate display */}
                        <Link href="/health-support/digestive-health">
                          <DropdownMenuItem className="text-xs px-2 py-1.5 hover:bg-gray-50 cursor-pointer leading-tight">
                            Digestive Support
                          </DropdownMenuItem>
                        </Link>
                        <Link href="/health-support/immune-health">
                          <DropdownMenuItem className="text-xs px-2 py-1.5 hover:bg-gray-50 cursor-pointer leading-tight">
                            Immune Support
                          </DropdownMenuItem>
                        </Link>
                        <Link href="/health-support/cognitive-health">
                          <DropdownMenuItem className="text-xs px-2 py-1.5 hover:bg-gray-50 cursor-pointer leading-tight">
                            Cognitive Support
                          </DropdownMenuItem>
                        </Link>
                        <Link href="/health-support/stress-relief">
                          <DropdownMenuItem className="text-xs px-2 py-1.5 hover:bg-gray-50 cursor-pointer leading-tight">
                            Stress Relief
                          </DropdownMenuItem>
                        </Link>
                        <Link href="/health-support/energy-vitality">
                          <DropdownMenuItem className="text-xs px-2 py-1.5 hover:bg-gray-50 cursor-pointer leading-tight">
                            Energy & Vitality
                          </DropdownMenuItem>
                        </Link>
                        <Link href="/health-support/cardiovascular-health">
                          <DropdownMenuItem className="text-xs px-2 py-1.5 hover:bg-gray-50 cursor-pointer leading-tight">
                            Cardiovascular Support
                          </DropdownMenuItem>
                        </Link>
                      </>
                    )}
                  </div>
                  
                  {/* Show loading only if health supports array is empty and loading */}
                  {(!healthSupports || healthSupports.length === 0) && (
                    <div className="text-sm text-gray-500 text-center py-2">
                      {healthSupports === undefined ? 'Loading health supports...' : 'No health supports available'}
                    </div>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="text-sm text-gray-700 hover:text-green-600 font-medium transition-colors flex items-center border-b-2 border-transparent hover:border-green-600 pb-1 h-auto p-0">
                  About <ChevronDown className="ml-1 h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-48 p-2 shadow-xl border border-gray-200" align="start">
                <Link href="/about-us">
                  <DropdownMenuItem className="text-sm px-3 py-2 hover:bg-gray-50 cursor-pointer">
                    About Us
                  </DropdownMenuItem>
                </Link>
                <Link href="/our-team">
                  <DropdownMenuItem className="text-sm px-3 py-2 hover:bg-gray-50 cursor-pointer">
                    Our Team
                  </DropdownMenuItem>
                </Link>
                <Link href="/our-farmers">
                  <DropdownMenuItem className="text-sm px-3 py-2 hover:bg-gray-50 cursor-pointer">
                    Our Farmers
                  </DropdownMenuItem>
                </Link>
              </DropdownMenuContent>
            </DropdownMenu>
            <Link href="/contact" className={`text-sm text-gray-700 hover:text-green-600 font-medium transition-colors border-b-2 border-transparent hover:border-green-600 pb-1 ${location === '/contact' ? 'text-green-600 border-green-600' : ''}`}>
              Contact
            </Link>
            <Link href="/certifications" className={`text-sm text-gray-700 hover:text-green-600 font-medium transition-colors border-b-2 border-transparent hover:border-green-600 pb-1 ${location === '/certifications' ? 'text-green-600 border-green-600' : ''}`}>
              Certifications
            </Link>
          </nav>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {showMobileMenu && (
        <div className="lg:hidden bg-white border-t border-gray-200 shadow-lg">
          <div className="container mx-auto px-4 py-2">
            <nav className="space-y-1">
              <Link 
                href="/" 
                className={`flex items-center space-x-3 py-3 px-3 rounded-lg transition-all duration-200 ${
                  location === '/' 
                    ? 'text-green-600 bg-green-50 font-medium' 
                    : 'text-gray-700 hover:text-green-600 hover:bg-gray-50'
                }`}
                onClick={() => setShowMobileMenu(false)}
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-green-100">
                  <Leaf className="w-4 h-4 text-green-600" />
                </div>
                <span className="font-medium">Home</span>
              </Link>
              
              <Link 
                href="/products" 
                className={`flex items-center space-x-3 py-3 px-3 rounded-lg transition-all duration-200 ${
                  location === '/products' 
                    ? 'text-green-600 bg-green-50 font-medium' 
                    : 'text-gray-700 hover:text-green-600 hover:bg-gray-50'
                }`}
                onClick={() => setShowMobileMenu(false)}
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-100">
                  <ShoppingCart className="w-4 h-4 text-blue-600" />
                </div>
                <span className="font-medium">All Products</span>
              </Link>

              <Link 
                href="/blog" 
                className={`flex items-center space-x-3 py-3 px-3 rounded-lg transition-all duration-200 ${
                  location === '/blog' 
                    ? 'text-green-600 bg-green-50 font-medium' 
                    : 'text-gray-700 hover:text-green-600 hover:bg-gray-50'
                }`}
                onClick={() => setShowMobileMenu(false)}
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-orange-100">
                  <FileText className="w-4 h-4 text-orange-600" />
                </div>
                <span className="font-medium">Blog</span>
              </Link>

              {/* Ingredients Accordion */}
              <Collapsible open={mobileIngredientsOpen} onOpenChange={setMobileIngredientsOpen}>
                <CollapsibleTrigger className="flex items-center justify-between w-full py-3 px-3 rounded-lg text-gray-700 hover:text-green-600 hover:bg-gray-50 transition-all duration-200">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-100">
                      <Leaf className="w-4 h-4 text-emerald-600" />
                    </div>
                    <span className="font-medium">Ingredients</span>
                  </div>
                  <ChevronRight className={`w-4 h-4 transition-transform duration-200 ${mobileIngredientsOpen ? 'rotate-90' : ''}`} />
                </CollapsibleTrigger>
                <CollapsibleContent className="pl-3 space-y-1 mt-2">
                <Link 
                  href="/ingredients" 
                  className="block py-2 text-sm text-gray-600 hover:text-green-600 transition-colors"
                  onClick={() => setShowMobileMenu(false)}
                >
                  → View All Ingredients
                </Link>
                {categories && categories.slice(0, 6).map((category: any) => (
                  <Link 
                    key={category.id}
                    href={`/ingredients/${category.slug}`}
                    className="block py-2 text-sm text-gray-600 hover:text-green-600 transition-colors"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    • {category.name}
                  </Link>
                ))}
                {categories && categories.length > 6 && (
                  <Link 
                    href="/ingredients" 
                    className="block py-2 text-sm text-green-600 font-medium"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    + View {categories.length - 6} more categories
                  </Link>
                )}
              </CollapsibleContent>
            </Collapsible>

              {/* Health Support Accordion */}
              <Collapsible open={mobileHealthSupportOpen} onOpenChange={setMobileHealthSupportOpen}>
                <CollapsibleTrigger className="flex items-center justify-between w-full py-3 px-3 rounded-lg text-gray-700 hover:text-green-600 hover:bg-gray-50 transition-all duration-200">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-purple-100">
                      <Heart className="w-4 h-4 text-purple-600" />
                    </div>
                    <span className="font-medium">Health Support</span>
                  </div>
                  <ChevronRight className={`w-4 h-4 transition-transform duration-200 ${mobileHealthSupportOpen ? 'rotate-90' : ''}`} />
                </CollapsibleTrigger>
                <CollapsibleContent className="pl-3 space-y-1 mt-2">
                <Link 
                  href="/products" 
                  className="block py-2 text-sm text-gray-600 hover:text-green-600 transition-colors"
                  onClick={() => setShowMobileMenu(false)}
                >
                  → View All Health Support
                </Link>
                {healthSupports && healthSupports.slice(0, 6).map((healthSupport: any) => (
                  <Link 
                    key={healthSupport.id}
                    href={`/health-support/${healthSupport.slug}`}
                    className="block py-2 text-sm text-gray-600 hover:text-green-600 transition-colors"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    • {healthSupport.name}
                  </Link>
                ))}
                {healthSupports && healthSupports.length > 6 && (
                  <Link 
                    href="/products" 
                    className="block py-2 text-sm text-green-600 font-medium"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    + View {healthSupports.length - 6} more options
                  </Link>
                )}
              </CollapsibleContent>
            </Collapsible>
              
              {/* About Accordion */}
              <Collapsible open={mobileAboutOpen} onOpenChange={setMobileAboutOpen}>
                <CollapsibleTrigger className="flex items-center justify-between w-full py-3 px-3 rounded-lg text-gray-700 hover:text-green-600 hover:bg-gray-50 transition-all duration-200">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-100">
                      <Info className="w-4 h-4 text-indigo-600" />
                    </div>
                    <span className="font-medium">About</span>
                  </div>
                  <ChevronRight className={`w-4 h-4 transition-transform duration-200 ${mobileAboutOpen ? 'rotate-90' : ''}`} />
                </CollapsibleTrigger>
                <CollapsibleContent className="pl-3 space-y-1 mt-2">
                  <Link 
                    href="/about-us" 
                    className="block py-2 text-sm text-gray-600 hover:text-green-600 transition-colors"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    → About Us
                  </Link>
                  <Link 
                    href="/our-team" 
                    className="block py-2 text-sm text-gray-600 hover:text-green-600 transition-colors"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    → Our Team
                  </Link>
                  <Link 
                    href="/our-farmers" 
                    className="block py-2 text-sm text-gray-600 hover:text-green-600 transition-colors"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    → Our Farmers
                  </Link>
                </CollapsibleContent>
              </Collapsible>
              
              <Link 
                href="/contact" 
                className={`flex items-center space-x-3 py-3 px-3 rounded-lg transition-all duration-200 ${
                  location === '/contact' 
                    ? 'text-green-600 bg-green-50 font-medium' 
                    : 'text-gray-700 hover:text-green-600 hover:bg-gray-50'
                }`}
                onClick={() => setShowMobileMenu(false)}
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-pink-100">
                  <Phone className="w-4 h-4 text-pink-600" />
                </div>
                <span className="font-medium">Contact</span>
              </Link>
              
              <Link 
                href="/certifications" 
                className={`flex items-center space-x-3 py-3 px-3 rounded-lg transition-all duration-200 ${
                  location === '/certifications' 
                    ? 'text-green-600 bg-green-50 font-medium' 
                    : 'text-gray-700 hover:text-green-600 hover:bg-gray-50'
                }`}
                onClick={() => setShowMobileMenu(false)}
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-yellow-100">
                  <Award className="w-4 h-4 text-yellow-600" />
                </div>
                <span className="font-medium">Certifications</span>
              </Link>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
