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
  Award,
  MessageCircle
} from "lucide-react";
import "./Header.css";

export default function Header() {
  const [location, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth() as { user: any; isAuthenticated: boolean };
  const { customer, isCustomerAuthenticated, logoutCustomer } = useCustomerAuth();
  const { data: savedProducts = [] } = useQuery<any[]>({
    queryKey: [`/api/customer/saved-products/${customer?.id}`],
    enabled: isCustomerAuthenticated && !!customer?.id,
  });
  const wishlistCount = isCustomerAuthenticated ? savedProducts.length : 0;
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const [showCategorySidebar, setShowCategorySidebar] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [mobileIngredientsOpen, setMobileIngredientsOpen] = useState(false);
  const [mobileIndustriesOpen, setMobileIndustriesOpen] = useState(false);
  const [mobileHealthSupportOpen, setMobileHealthSupportOpen] = useState(false);
  const [mobileAboutOpen, setMobileAboutOpen] = useState(false);
  const [detectedCountry, setDetectedCountry] = useState<string>("");
  const searchRef = useRef<HTMLDivElement>(null);
  const isSuggestionListOpen = showSuggestions && suggestions.length > 0;
  const isPathActive = (...paths: string[]) =>
    paths.some((path) => location === path || (path !== "/" && location.startsWith(`${path}/`)));

  // Fetch detected country based on IP
  useEffect(() => {
    const fetchCountry = async () => {
      try {
        const response = await fetch('/api/detect-currency');
        const data = await response.json();
        if (data.countryName) {
          setDetectedCountry(data.countryName);
        } else if (data.countryCode) {
          setDetectedCountry(data.countryCode);
        }
      } catch (error) {
        console.error('Failed to detect country:', error);
      }
    };
    fetchCountry();
  }, []);

  // Fetch categories for ingredients dropdown
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  // Fetch health supports for health support dropdown
  const { data: healthSupports = [] } = useQuery<Array<{ id: number; name: string; slug: string }>>({
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
    setActiveSuggestionIndex(-1);
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
        setActiveSuggestionIndex(-1);
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
      setActiveSuggestionIndex(-1);
      
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
    setActiveSuggestionIndex(-1);
    // Navigate directly to product detail page using slug
    setLocation(`/product/${product.slug}`);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setActiveSuggestionIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      if (showSuggestions) {
        e.preventDefault();
        setShowSuggestions(false);
        setActiveSuggestionIndex(-1);
      }
      return;
    }

    if (!showSuggestions || suggestions.length === 0) {
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveSuggestionIndex((currentIndex) =>
          Math.min(currentIndex + 1, suggestions.length - 1)
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveSuggestionIndex((currentIndex) =>
          currentIndex < 0
            ? suggestions.length - 1
            : Math.max(currentIndex - 1, 0)
        );
        break;
      case "Enter":
        if (activeSuggestionIndex >= 0 && suggestions[activeSuggestionIndex]) {
          e.preventDefault();
          handleSuggestionClick(suggestions[activeSuggestionIndex]);
        }
        break;
    }
  };

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const handleWishlistClick = () => {
    setLocation(isCustomerAuthenticated ? "/customer/saved" : "/login");
  };

  return (
    <header className="bfo-refined-header bg-white shadow-lg border-b border-gray-200 sticky top-0 z-50">
      {/* Main Header */}
      <div className="bfo-header-top-inner container mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="bfo-header-row flex items-center justify-between">
          {/* Left Side - Logo */}
          <div className="bfo-header-brand flex items-center">
            <Link href="/">
              <div className="flex items-center cursor-pointer hover:opacity-90 transition-opacity">
                <img 
                  src="/atlas-ingredients-logo.svg"
                  alt="Atlas Ingredients"
                  className="bfo-header-logo h-10 sm:h-12 w-auto object-contain"
                />
              </div>
            </Link>
            
            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              aria-label={showMobileMenu ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={showMobileMenu}
              className="bfo-header-mobile-toggle ml-4 lg:hidden text-gray-600 hover:text-green-600 hover:bg-green-50"
              onClick={() => setShowMobileMenu(!showMobileMenu)}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>

          {/* Center - Navigation */}
          <nav aria-label="Main navigation" className="bfo-header-nav hidden lg:flex items-center">
            <Link href="/" aria-current={location === "/" ? "page" : undefined} className={`bfo-nav-link text-sm text-gray-700 hover:text-green-600 font-medium transition-colors border-b-2 border-transparent hover:border-green-600 pb-1 ${location === '/' ? 'text-green-600 border-green-600 is-current' : ''}`}>
              Home
            </Link>
            <Link href="/products" aria-current={location === "/products" ? "page" : undefined} className={`bfo-nav-link text-sm text-gray-700 hover:text-green-600 font-medium transition-colors border-b-2 border-transparent hover:border-green-600 pb-1 ${location === '/products' ? 'text-green-600 border-green-600 is-current' : ''}`}>
              Products
            </Link>
            <Link href="/blog" aria-current={location === "/blog" ? "page" : undefined} className={`bfo-nav-link text-sm text-gray-700 hover:text-green-600 font-medium transition-colors border-b-2 border-transparent hover:border-green-600 pb-1 ${location === '/blog' ? 'text-green-600 border-green-600 is-current' : ''}`}>
              Blog
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className={`bfo-nav-trigger text-sm text-gray-700 hover:text-green-600 font-medium transition-colors flex items-center border-b-2 border-transparent hover:border-green-600 pb-1 h-auto p-0 ${isPathActive("/ingredients") ? "is-current" : ""}`}>
                  Ingredients <ChevronDown className="ml-1 h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bfo-nav-dropdown w-[500px] p-3 shadow-xl border border-gray-200" align="start">
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
              
              {/* Industries Dropdown - NEW for SEO */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className={`bfo-nav-trigger text-sm text-gray-700 hover:text-green-600 font-medium transition-colors flex items-center border-b-2 border-transparent hover:border-green-600 pb-1 h-auto p-0 ${isPathActive("/food-ingredients", "/organic-herbs", "/eu-organic-spices") ? "is-current" : ""}`}>
                    Industries <ChevronDown className="ml-1 h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bfo-nav-dropdown w-80 p-3 shadow-xl border border-gray-200" align="start">
                  <div className="space-y-2">
                    <Link href="/food-ingredients">
                      <DropdownMenuItem className="p-3 hover:bg-green-50 cursor-pointer rounded-md border border-gray-100">
                        <div>
                          <div className="font-medium text-gray-900">Food Ingredients</div>
                          <div className="text-xs text-gray-600">EU certified organic ingredients for food manufacturers</div>
                        </div>
                      </DropdownMenuItem>
                    </Link>
                    
                    <Link href="/organic-herbs">
                      <DropdownMenuItem className="p-3 hover:bg-green-50 cursor-pointer rounded-md border border-gray-100">
                        <div>
                          <div className="font-medium text-gray-900">Organic Herbs</div>
                          <div className="text-xs text-gray-600">Premium medicinal & Ayurvedic herbs for pharma industry</div>
                        </div>
                      </DropdownMenuItem>
                    </Link>
                    
                    <Link href="/eu-organic-spices">
                      <DropdownMenuItem className="p-3 hover:bg-green-50 cursor-pointer rounded-md border border-gray-100">
                        <div>
                          <div className="font-medium text-gray-900">EU Organic Spices</div>
                          <div className="text-xs text-gray-600">European market certified organic spices & seasonings</div>
                        </div>
                      </DropdownMenuItem>
                    </Link>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Health Support Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className={`bfo-nav-trigger text-sm text-gray-700 hover:text-green-600 font-medium transition-colors flex items-center border-b-2 border-transparent hover:border-green-600 pb-1 h-auto p-0 ${isPathActive("/health-support") ? "is-current" : ""}`}>
                  Health Support <ChevronDown className="ml-1 h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bfo-nav-dropdown w-[500px] p-3 shadow-xl border border-gray-200" align="start">
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
                <Button variant="ghost" className={`bfo-nav-trigger text-sm text-gray-700 hover:text-green-600 font-medium transition-colors flex items-center border-b-2 border-transparent hover:border-green-600 pb-1 h-auto p-0 ${isPathActive("/about-us", "/our-team", "/our-farmers") ? "is-current" : ""}`}>
                  About <ChevronDown className="ml-1 h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bfo-nav-dropdown w-48 p-2 shadow-xl border border-gray-200" align="start">
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
            <Link href="/contact" aria-current={location === "/contact" ? "page" : undefined} className={`bfo-nav-link text-sm text-gray-700 hover:text-green-600 font-medium transition-colors border-b-2 border-transparent hover:border-green-600 pb-1 ${location === '/contact' ? 'text-green-600 border-green-600 is-current' : ''}`}>
              Contact
            </Link>
            <Link href="/certifications" aria-current={location === "/certifications" ? "page" : undefined} className={`bfo-nav-link text-sm text-gray-700 hover:text-green-600 font-medium transition-colors border-b-2 border-transparent hover:border-green-600 pb-1 ${location === '/certifications' ? 'text-green-600 border-green-600 is-current' : ''}`}>
              Certifications
            </Link>
          </nav>

          {/* Right Side - User Actions */}
          <div className="bfo-header-actions flex items-center">
            {/* Country Indicator */}
            {detectedCountry && (
              <div className="bfo-header-country-indicator hidden md:flex items-center space-x-2">
                <div className="flex items-center space-x-1 text-sm text-gray-600">
                  <Globe className="w-4 h-4" />
                  <span>{detectedCountry}</span>
                </div>
              </div>
            )}
            
            {/* User Actions */}
            <div className="bfo-header-user-actions flex items-center">
              <Button aria-label="Wishlist" onClick={handleWishlistClick} variant="ghost" size="sm" className="hidden sm:flex text-gray-600 hover:text-red-500 hover:bg-red-50">
                <Heart className="w-5 h-5" />
                <span className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 ml-1">{wishlistCount}</span>
              </Button>

              {/* Show different UI based on authentication status */}
              {isAuthenticated || isCustomerAuthenticated ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="bfo-account-menu-trigger bg-green-700 text-white hover:bg-green-800 border-green-700 !text-white hover:!text-white"
                    >
                      <Avatar className="w-4 h-4 sm:w-6 sm:h-6 mr-1 sm:mr-2">
                        <AvatarImage src={user?.avatar} />
                        <AvatarFallback className="bg-green-500 text-white text-xs">
                          {isAuthenticated ? user?.name?.charAt(0) || 'A' : customer?.firstName?.charAt(0) || customer?.email?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="hidden sm:inline !text-white">
                        {isAuthenticated ? user?.name || 'Admin' : customer?.firstName ? `${customer.firstName} ${customer.lastName || ''}`.trim() : customer?.companyName || 'User'}
                      </span>
                      <span className="sm:hidden !text-white">
                        {isAuthenticated ? 'Admin' : customer?.firstName || 'User'}
                      </span>
                      <ChevronDown className="w-3 h-3 ml-1 !text-white" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    {isAuthenticated && (
                      <>
                        <DropdownMenuItem asChild>
                          <Link href="/admin/dashboard" className="flex items-center cursor-pointer">
                            <LayoutDashboard className="w-4 h-4 mr-2" />
                            Admin Dashboard
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/admin/products" className="flex items-center cursor-pointer">
                            <Settings className="w-4 h-4 mr-2" />
                            Manage Products
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}
                    {isCustomerAuthenticated && (
                      <>
                        <DropdownMenuItem asChild>
                          <Link href="/customer/dashboard" className="flex items-center cursor-pointer">
                            <LayoutDashboard className="w-4 h-4 mr-2" />
                            Dashboard
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/customer/profile" className="flex items-center cursor-pointer">
                            <User className="w-4 h-4 mr-2" />
                            My Profile
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/customer/orders" className="flex items-center cursor-pointer">
                            <FileText className="w-4 h-4 mr-2" />
                            My Orders
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}
                    <DropdownMenuItem 
                      onClick={() => {
                        if (isAuthenticated) {
                          // Admin logout - use the API endpoint
                          window.location.href = '/api/logout';
                        } else if (isCustomerAuthenticated) {
                          // Customer logout
                          logoutCustomer();
                        }
                      }}
                      className="text-red-600 focus:text-red-600 cursor-pointer"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link href="/login">
                  <Button aria-label="Log in" variant="ghost" size="sm" className="text-gray-600 hover:text-green-600 hover:bg-green-50">
                    <User className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">Login</span>
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bfo-header-search-band bg-green-600 text-white">
        <div className="bfo-header-search-inner container mx-auto px-4 sm:px-6 lg:px-8 py-2">
          <div className="flex items-center">
            <div className="bfo-header-category-wrap relative">
              <button 
                aria-label="Open all product categories"
                aria-expanded={showCategorySidebar}
                className="bfo-header-category-button flex items-center text-xs sm:text-sm bg-green-700 hover:bg-green-800 px-3 py-2 rounded-lg transition-colors"
                onClick={() => setShowCategorySidebar(!showCategorySidebar)}
              >
                <Menu className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">ALL CATEGORIES</span>
                <span className="sm:hidden">Categories</span>
              </button>
            </div>
            
            {/* Search Bar */}
            <div className="bfo-header-search-area relative">
              <form onSubmit={handleSearch} className="bfo-header-search-form relative">
                <input
                  type="text"
                  placeholder="Search for organic ingredients..."
                  value={searchQuery}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => {
                    setShowSuggestions(false);
                    setActiveSuggestionIndex(-1);
                  }, 200)}
                  aria-label="Search organic ingredients"
                  role="combobox"
                  aria-autocomplete="list"
                  aria-expanded={isSuggestionListOpen}
                  aria-controls={
                    isSuggestionListOpen ? "header-search-suggestions" : undefined
                  }
                  aria-activedescendant={
                    isSuggestionListOpen && activeSuggestionIndex >= 0
                      ? `header-search-option-${activeSuggestionIndex}`
                      : undefined
                  }
                  className="bfo-header-search-input w-full px-4 py-2 pl-4 pr-12 text-sm text-gray-900 bg-white border border-green-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-300 focus:border-transparent"
                />
                <button
                  type="submit"
                  aria-label="Search"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-green-600 hover:text-green-700"
                >
                  <Search className="w-4 h-4" />
                </button>
              </form>

              {/* Search Suggestions */}
              {isSuggestionListOpen && (
                <div
                  id="header-search-suggestions"
                  role="listbox"
                  aria-label="Product suggestions"
                  className="bfo-header-search-suggestions absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-64 overflow-y-auto z-50"
                >
                  {suggestions.map((product, index) => (
                    <div
                      key={product.id}
                      id={`header-search-option-${index}`}
                      role="option"
                      aria-selected={activeSuggestionIndex === index}
                      className={`px-4 py-2 cursor-pointer border-b border-gray-100 last:border-b-0 ${
                        activeSuggestionIndex === index
                          ? "bg-gray-100"
                          : "hover:bg-gray-50"
                      }`}
                      onMouseEnter={() => setActiveSuggestionIndex(index)}
                      onMouseDown={(event) => event.preventDefault()}
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

            {/* Contact Info */}
            <div className="bfo-header-support hidden lg:flex items-center space-x-4 text-sm">
              <a href="tel:+917249847439" className="bfo-header-phone flex items-center space-x-2" aria-label="Call Customer Support at +91-7249847439">
                <Phone className="w-4 h-4" />
                <div>
                  <div className="text-green-200 text-xs">Customer Support</div>
                  <div className="font-medium">+91-7249847439</div>
                </div>
              </a>
              <a 
                href="https://wa.me/917249847439" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center space-x-2 hover:text-green-200 transition-colors cursor-pointer"
                aria-label="Contact Customer Support on WhatsApp"
              >
                <MessageCircle className="w-4 h-4" />
                <span>WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {showMobileMenu && (
        <div className="bfo-header-mobile-menu lg:hidden bg-white border-t border-gray-200 shadow-lg">
          <div className="container mx-auto px-4 py-2">
            <nav aria-label="Mobile navigation" className="bfo-mobile-nav">
              <Link 
                href="/" 
                className={`bfo-mobile-link flex items-center space-x-3 py-3 px-3 rounded-lg transition-all duration-200 ${
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
                className={`bfo-mobile-link flex items-center space-x-3 py-3 px-3 rounded-lg transition-all duration-200 ${
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
                className={`bfo-mobile-link flex items-center space-x-3 py-3 px-3 rounded-lg transition-all duration-200 ${
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
                <CollapsibleTrigger className="bfo-mobile-accordion-trigger flex items-center justify-between w-full py-3 px-3 rounded-lg text-gray-700 hover:text-green-600 hover:bg-gray-50 transition-all duration-200">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-100">
                      <Leaf className="w-4 h-4 text-emerald-600" />
                    </div>
                    <span className="font-medium">Ingredients</span>
                  </div>
                  <ChevronRight className={`w-4 h-4 transition-transform duration-200 ${mobileIngredientsOpen ? 'rotate-90' : ''}`} />
                </CollapsibleTrigger>
                <CollapsibleContent className="bfo-mobile-subnav pl-3 space-y-1 mt-2">
                <Link 
                  href="/ingredients" 
                  className="block py-2 text-sm text-gray-600 hover:text-green-600 transition-colors"
                  onClick={() => setShowMobileMenu(false)}
                >
                  → View All Ingredients
                </Link>
                {categories && categories.map((category: any) => (
                  <Link 
                    key={category.id}
                    href={`/ingredients/${category.name
                      .toLowerCase()
                      .replace(/[^a-z0-9\s]/g, '')
                      .replace(/\s+/g, '-')
                      .replace(/-+/g, '-')
                      .trim()}`}
                    className="block py-2 text-sm text-gray-600 hover:text-green-600 transition-colors"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    • {category.name}
                  </Link>
                ))}
              </CollapsibleContent>
            </Collapsible>

              {/* Industries Accordion */}
              <Collapsible open={mobileIndustriesOpen} onOpenChange={setMobileIndustriesOpen}>
                <CollapsibleTrigger className="bfo-mobile-accordion-trigger flex items-center justify-between w-full py-3 px-3 rounded-lg text-gray-700 hover:text-green-600 hover:bg-gray-50 transition-all duration-200">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-100">
                      <ShoppingCart className="w-4 h-4 text-emerald-700" />
                    </div>
                    <span className="font-medium">Industries</span>
                  </div>
                  <ChevronRight className={`w-4 h-4 transition-transform duration-200 ${mobileIndustriesOpen ? 'rotate-90' : ''}`} />
                </CollapsibleTrigger>
                <CollapsibleContent className="bfo-mobile-subnav pl-3 space-y-1 mt-2">
                  <Link href="/food-ingredients" className="block py-2 text-sm text-gray-600 hover:text-green-600 transition-colors" onClick={() => setShowMobileMenu(false)}>
                    Food Ingredients
                  </Link>
                  <Link href="/organic-herbs" className="block py-2 text-sm text-gray-600 hover:text-green-600 transition-colors" onClick={() => setShowMobileMenu(false)}>
                    Organic Herbs
                  </Link>
                  <Link href="/eu-organic-spices" className="block py-2 text-sm text-gray-600 hover:text-green-600 transition-colors" onClick={() => setShowMobileMenu(false)}>
                    EU Organic Spices
                  </Link>
                </CollapsibleContent>
              </Collapsible>

              {/* Health Support Accordion */}
              <Collapsible open={mobileHealthSupportOpen} onOpenChange={setMobileHealthSupportOpen}>
                <CollapsibleTrigger className="bfo-mobile-accordion-trigger flex items-center justify-between w-full py-3 px-3 rounded-lg text-gray-700 hover:text-green-600 hover:bg-gray-50 transition-all duration-200">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-purple-100">
                      <Heart className="w-4 h-4 text-purple-600" />
                    </div>
                    <span className="font-medium">Health Support</span>
                  </div>
                  <ChevronRight className={`w-4 h-4 transition-transform duration-200 ${mobileHealthSupportOpen ? 'rotate-90' : ''}`} />
                </CollapsibleTrigger>
                <CollapsibleContent className="bfo-mobile-subnav pl-3 space-y-1 mt-2">
                <Link 
                  href="/products" 
                  className="block py-2 text-sm text-gray-600 hover:text-green-600 transition-colors"
                  onClick={() => setShowMobileMenu(false)}
                >
                  → View All Health Support
                </Link>
                {healthSupports && healthSupports.map((healthSupport: any) => (
                  <Link 
                    key={healthSupport.id}
                    href={`/health-support/${healthSupport.slug}`}
                    className="block py-2 text-sm text-gray-600 hover:text-green-600 transition-colors"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    • {healthSupport.name}
                  </Link>
                ))}
              </CollapsibleContent>
            </Collapsible>
              
              {/* About Accordion */}
              <Collapsible open={mobileAboutOpen} onOpenChange={setMobileAboutOpen}>
                <CollapsibleTrigger className="bfo-mobile-accordion-trigger flex items-center justify-between w-full py-3 px-3 rounded-lg text-gray-700 hover:text-green-600 hover:bg-gray-50 transition-all duration-200">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-100">
                      <Info className="w-4 h-4 text-indigo-600" />
                    </div>
                    <span className="font-medium">About</span>
                  </div>
                  <ChevronRight className={`w-4 h-4 transition-transform duration-200 ${mobileAboutOpen ? 'rotate-90' : ''}`} />
                </CollapsibleTrigger>
                <CollapsibleContent className="bfo-mobile-subnav pl-3 space-y-1 mt-2">
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
                className={`bfo-mobile-link flex items-center space-x-3 py-3 px-3 rounded-lg transition-all duration-200 ${
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
                className={`bfo-mobile-link flex items-center space-x-3 py-3 px-3 rounded-lg transition-all duration-200 ${
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

              <button
                type="button"
                aria-label="Wishlist"
                onClick={handleWishlistClick}
                className="bfo-mobile-link bfo-mobile-wishlist"
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-rose-50">
                  <Heart className="w-4 h-4 text-rose-600" />
                </div>
                <span className="font-medium">Wishlist</span>
                <span className="bfo-mobile-wishlist-count">{wishlistCount}</span>
              </button>

              <div className="bfo-mobile-support" aria-label="Customer support">
                <a href="tel:+917249847439" aria-label="Call Customer Support at +91-7249847439">
                  <Phone className="w-4 h-4" />
                  <span>+91-7249847439</span>
                </a>
                <a href="https://wa.me/917249847439" target="_blank" rel="noopener noreferrer" aria-label="Contact Customer Support on WhatsApp">
                  <MessageCircle className="w-4 h-4" />
                  <span>WhatsApp</span>
                </a>
              </div>
            </nav>
          </div>
        </div>
      )}
      
      {/* Category Sidebar */}
      {showCategorySidebar && (
        <CategorySidebar 
          isOpen={showCategorySidebar}
          onClose={() => setShowCategorySidebar(false)}
        />
      )}
    </header>
  );
}
