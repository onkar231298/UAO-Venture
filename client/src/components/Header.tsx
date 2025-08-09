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
import { 
  Leaf, 
  Search, 
  User, 
  Heart, 
  ShoppingCart, 
  Menu,
  Globe,
  ChevronDown,
  Phone,
  LogOut,
  Settings,
  LayoutDashboard
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
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 sm:space-x-6 lg:space-x-8">
            {/* Logo */}
            <Link href="/">
              <div className="flex items-center cursor-pointer hover:opacity-90 transition-opacity">
                <img 
                  src="/attached_assets/Final Logo_1753730040470.png" 
                  alt="Bright Fame Organic" 
                  className="h-12 sm:h-16 w-auto object-contain"
                />
              </div>
            </Link>
            
            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden text-gray-600 hover:text-green-600 hover:bg-green-50"
              onClick={() => setShowMobileMenu(!showMobileMenu)}
            >
              <Menu className="h-5 w-5" />
            </Button>

            {/* Navigation */}
            <nav className="hidden lg:flex items-center space-x-8">
              <Link href="/" className={`text-gray-700 hover:text-green-600 font-medium transition-colors border-b-2 border-transparent hover:border-green-600 pb-1 ${location === '/' ? 'text-green-600 border-green-600' : ''}`}>
                Home
              </Link>
              <Link href="/products" className={`text-gray-700 hover:text-green-600 font-medium transition-colors border-b-2 border-transparent hover:border-green-600 pb-1 ${location === '/products' ? 'text-green-600 border-green-600' : ''}`}>
                Products
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="text-gray-700 hover:text-green-600 font-medium transition-colors flex items-center border-b-2 border-transparent hover:border-green-600 pb-1 h-auto p-0">
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
                  <Button variant="ghost" className="text-gray-700 hover:text-green-600 font-medium transition-colors flex items-center border-b-2 border-transparent hover:border-green-600 pb-1 h-auto p-0">
                    Health Support <ChevronDown className="ml-1 h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[500px] p-3 shadow-xl border border-gray-200" align="start">
                  {/* All Health Support Link */}
                  <Link href="/products?healthSupport=all">
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
                        <Link href="/health-support/digestive-support">
                          <DropdownMenuItem className="text-xs px-2 py-1.5 hover:bg-gray-50 cursor-pointer leading-tight">
                            Digestive Support
                          </DropdownMenuItem>
                        </Link>
                        <Link href="/health-support/immune-support">
                          <DropdownMenuItem className="text-xs px-2 py-1.5 hover:bg-gray-50 cursor-pointer leading-tight">
                            Immune Support
                          </DropdownMenuItem>
                        </Link>
                        <Link href="/health-support/cognitive-support">
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
                        <Link href="/health-support/cardiovascular-support">
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

              <Link href="/about" className={`text-gray-700 hover:text-green-600 font-medium transition-colors border-b-2 border-transparent hover:border-green-600 pb-1 ${location === '/about' ? 'text-green-600 border-green-600' : ''}`}>
                About
              </Link>
              <Link href="/contact" className={`text-gray-700 hover:text-green-600 font-medium transition-colors border-b-2 border-transparent hover:border-green-600 pb-1 ${location === '/contact' ? 'text-green-600 border-green-600' : ''}`}>
                Contact
              </Link>
              <a href="#" className="text-gray-700 hover:text-green-600 font-medium transition-colors border-b-2 border-transparent hover:border-green-600 pb-1">
                Certifications
              </a>
            </nav>
          </div>

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
              
              <Button variant="ghost" size="sm" className="text-gray-600 hover:text-green-600 hover:bg-green-50">
                <ShoppingCart className="w-5 h-5" />
                <span className="bg-green-500 text-white text-xs rounded-full px-1.5 py-0.5 ml-1">0</span>
              </Button>

              {isAuthenticated && user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center space-x-2">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={user.profileImageUrl || ""} />
                        <AvatarFallback>
                          {(user.firstName?.[0] || '') + (user.lastName?.[0] || '')}
                        </AvatarFallback>
                      </Avatar>
                      <span className="hidden sm:inline">{user.firstName || 'User'}</span>
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="px-2 py-1.5">
                      <p className="text-sm font-medium">{user.firstName} {user.lastName}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                      {user.role && (
                        <Badge variant="outline" className="mt-1 text-xs">
                          {user.role.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                        </Badge>
                      )}
                    </div>
                    <DropdownMenuSeparator />
                    {/* Dashboard link based on user role */}
                    {(user.role === 'admin' || user.role === 'super_admin') && (
                      <DropdownMenuItem asChild>
                        <Link href="/admin" className="flex items-center">
                          <LayoutDashboard className="w-4 h-4 mr-2" />
                          Admin Dashboard
                        </Link>
                      </DropdownMenuItem>
                    )}
                    {user.role === 'customer' && (
                      <DropdownMenuItem asChild>
                        <Link href="/dashboard" className="flex items-center">
                          <LayoutDashboard className="w-4 h-4 mr-2" />
                          My Dashboard
                        </Link>
                      </DropdownMenuItem>
                    )}
                    {(user.role !== 'admin' && user.role !== 'super_admin' && user.role !== 'customer') && (
                      <DropdownMenuItem asChild>
                        <Link href="/staff" className="flex items-center">
                          <LayoutDashboard className="w-4 h-4 mr-2" />
                          Staff Dashboard
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <Settings className="w-4 h-4 mr-2" />
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="w-4 h-4 mr-2" />
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : isCustomerAuthenticated && customer ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center space-x-2">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="bg-green-100 text-green-700">
                          {customer.firstName?.[0]}{customer.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <span className="hidden sm:inline">{customer.firstName}</span>
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="px-2 py-1.5">
                      <p className="text-sm font-medium">{customer.firstName} {customer.lastName}</p>
                      <p className="text-xs text-gray-500">{customer.email}</p>
                      <Badge variant="outline" className="mt-1 text-xs bg-green-50 text-green-700 border-green-200">
                        Customer
                      </Badge>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/customer/dashboard" className="flex items-center">
                        <LayoutDashboard className="w-4 h-4 mr-2" />
                        My Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/customer/profile" className="flex items-center">
                        <User className="w-4 h-4 mr-2" />
                        My Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/products" className="flex items-center">
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Browse Products
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => {
                      logoutCustomer();
                      setLocation('/');
                    }}>
                      <LogOut className="w-4 h-4 mr-2" />
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" onClick={() => setLocation("/login")}>
                    <User className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">Login</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setLocation("/register")}
                    className="bg-green-600 text-white hover:bg-green-700 border-green-600"
                  >
                    <span className="hidden sm:inline">Register</span>
                    <span className="sm:hidden">Sign Up</span>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {showMobileMenu && (
        <div className="lg:hidden bg-white border-t border-gray-200">
          <div className="container mx-auto px-4 py-4 space-y-2">
            <Link 
              href="/" 
              className={`block py-2 text-gray-700 hover:text-green-600 transition-colors ${location === '/' ? 'text-green-600 font-medium' : ''}`}
              onClick={() => setShowMobileMenu(false)}
            >
              Home
            </Link>
            <Link 
              href="/products" 
              className={`block py-2 text-gray-700 hover:text-green-600 transition-colors ${location === '/products' ? 'text-green-600 font-medium' : ''}`}
              onClick={() => setShowMobileMenu(false)}
            >
              Products
            </Link>
            <Link 
              href="/ingredients" 
              className="block py-2 text-gray-700 hover:text-green-600 transition-colors"
              onClick={() => setShowMobileMenu(false)}
            >
              All Ingredients
            </Link>
            <Link 
              href="/products?healthSupport=all" 
              className={`block py-2 text-gray-700 hover:text-green-600 transition-colors ${location.startsWith('/health-support') ? 'text-green-600 font-medium' : ''}`}
              onClick={() => setShowMobileMenu(false)}
            >
              Health Support
            </Link>
            <Link 
              href="/blog" 
              className={`block py-2 text-gray-700 hover:text-green-600 transition-colors ${location === '/blog' || location.startsWith('/blog/') ? 'text-green-600 font-medium' : ''}`}
              onClick={() => setShowMobileMenu(false)}
            >
              Blog
            </Link>
            <div className="py-2 text-gray-700">Certifications</div>
            <div className="py-2 text-gray-700">R&D Lab</div>
            <div className="py-2 text-gray-700">Services</div>
          </div>
        </div>
      )}

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
              
              {/* Category Sidebar positioned below button */}
              <CategorySidebar 
                isOpen={showCategorySidebar} 
                onClose={() => setShowCategorySidebar(false)} 
              />
            </div>
            
            <div className="flex-1 max-w-2xl" ref={searchRef}>
              <form onSubmit={handleSearch} className="relative">
                <Input
                  type="search"
                  placeholder="Search for organic ingredients..."
                  value={searchQuery}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  onFocus={() => searchQuery.length >= 2 && suggestions.length > 0 && setShowSuggestions(true)}
                  className="w-full px-3 sm:px-4 py-2 pr-10 text-sm sm:text-base rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-300 border-0"
                />
                <Button
                  type="submit"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-transparent hover:bg-green-700 p-1 h-auto"
                >
                  <Search className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500" />
                </Button>
                
                {/* Search Suggestions Dropdown */}
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg mt-1 z-50 max-h-80 overflow-y-auto">
                    {suggestions.map((product) => (
                      <div
                        key={product.id}
                        className="flex items-center p-2 sm:p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleSuggestionClick(product);
                        }}
                        onMouseDown={(e) => e.preventDefault()}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 text-sm truncate">
                            {product.name}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {product.productId}
                          </div>
                        </div>
                        <div className="ml-2 flex-shrink-0">
                          <div className="text-xs font-medium px-2 py-1 rounded-full bg-green-100 text-green-700">
                            Available
                          </div>
                        </div>
                      </div>
                    ))}
                    <div className="p-2 border-t border-gray-100 bg-gray-50">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowSuggestions(false);
                          setSearchQuery("");
                          setLocation(`/search/${encodeURIComponent(searchQuery.trim())}`);
                        }}
                        className="text-xs text-green-600 hover:text-green-700 font-medium w-full text-left"
                      >
                        View all results for "{searchQuery}"
                      </button>
                    </div>
                  </div>
                )}
              </form>
            </div>

            <div className="hidden md:flex items-center space-x-3 lg:space-x-4 text-sm">
              <div className="flex items-center space-x-2">
                <Phone className="text-white w-4 h-4" />
                <div className="hidden lg:block">
                  <div className="font-medium">+91-7249847439</div>
                  <div className="text-xs text-green-200">Customer Support</div>
                </div>
                <div className="block lg:hidden">
                  <div className="font-medium text-xs">+91-7249847439</div>
                </div>
              </div>
              <a href="#" className="flex items-center space-x-1 hover:text-green-200 bg-green-700 px-2 lg:px-3 py-2 rounded-lg text-xs lg:text-sm">
                <Phone className="w-3 h-3 lg:w-4 lg:h-4" />
                <span>WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
