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
      {/* Main Header */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between">
          {/* Left Side - Logo */}
          <div className="flex items-center">
            <Link href="/">
              <div className="flex items-center cursor-pointer hover:opacity-90 transition-opacity">
                <img 
                  src="/attached_assets/Final Logo_1753730040470.png" 
                  alt="Bright Fame Organic" 
                  className="h-10 sm:h-12 w-auto object-contain"
                />
              </div>
            </Link>
            
            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="ml-4 lg:hidden text-gray-600 hover:text-green-600 hover:bg-green-50"
              onClick={() => setShowMobileMenu(!showMobileMenu)}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>

          {/* Center - Navigation */}
          <nav className="hidden lg:flex items-center space-x-4 xl:space-x-6">
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

          {/* Right Side - User Actions */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Country Selector */}
            <div className="hidden md:flex items-center space-x-2">
              <div className="flex items-center space-x-1 text-sm text-gray-600">
                <Globe className="w-4 h-4" />
                <span>India</span>
              </div>
            </div>
            
            {/* User Actions */}
            <div className="flex items-center space-x-1 sm:space-x-2">
              <Button variant="ghost" size="sm" className="hidden sm:flex text-gray-600 hover:text-red-500 hover:bg-red-50">
                <Heart className="w-5 h-5" />
                <span className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 ml-1">0</span>
              </Button>

              {/* Show different UI based on authentication status */}
              {isAuthenticated || isCustomerAuthenticated ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="bg-green-600 text-white hover:bg-green-700 border-green-600">
                      <Avatar className="w-4 h-4 sm:w-6 sm:h-6 mr-1 sm:mr-2">
                        <AvatarImage src={user?.avatar} />
                        <AvatarFallback className="bg-green-500 text-white text-xs">
                          {isAuthenticated ? user?.name?.charAt(0) || 'A' : customer?.email?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="hidden sm:inline">
                        {isAuthenticated ? user?.name || 'Admin' : customer?.email || 'User'}
                      </span>
                      <span className="sm:hidden">
                        {isAuthenticated ? 'Admin' : 'User'}
                      </span>
                      <ChevronDown className="w-3 h-3 ml-1" />
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
                          // Admin logout - redirect to login page
                          window.location.href = '/login';
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
                  <Button variant="ghost" size="sm" className="text-gray-600 hover:text-green-600 hover:bg-green-50">
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
      <div className="bg-green-600 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-2">
          <div className="flex items-center space-x-2 sm:space-x-4">
            <div className="relative">
              <button 
                className="flex items-center space-x-1 text-xs sm:text-sm bg-green-700 hover:bg-green-800 px-3 py-2 rounded-lg transition-colors"
                onClick={() => setShowCategorySidebar(!showCategorySidebar)}
              >
                <Menu className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">ALL CATEGORIES</span>
                <span className="sm:hidden">Categories</span>
              </button>
            </div>
            
            {/* Search Bar */}
            <div className="flex-1 relative max-w-2xl">
              <form onSubmit={handleSearch} className="relative">
                <input
                  type="text"
                  placeholder="Search for organic ingredients..."
                  value={searchQuery}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  className="w-full px-4 py-2 pl-4 pr-12 text-sm text-gray-900 bg-white border border-green-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-300 focus:border-transparent"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-green-600 hover:text-green-700"
                >
                  <Search className="w-4 h-4" />
                </button>
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

            {/* Contact Info */}
            <div className="hidden lg:flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4" />
                <div>
                  <div className="text-green-200 text-xs">Customer Support</div>
                  <div className="font-medium">+91-7249847439</div>
                </div>
              </div>
              <a 
                href="https://wa.me/917249847439" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center space-x-2 hover:text-green-200 transition-colors cursor-pointer"
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
