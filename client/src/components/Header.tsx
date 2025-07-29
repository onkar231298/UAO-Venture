import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import type { Category } from "@shared/schema";
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
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch categories for ingredients dropdown
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Navigate to products page with search parameter
      setLocation(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-50">
      {/* Main Header */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 sm:space-x-6 lg:space-x-8">
            {/* Logo */}
            <Link href="/">
              <div className="flex items-center cursor-pointer">
                <img 
                  src="/attached_assets/Final Logo_1753730040470.png" 
                  alt="Bright Fame Organic" 
                  className="h-12 sm:h-16 w-auto object-contain"
                />
              </div>
            </Link>
            
            {/* Navigation */}
            <nav className="hidden lg:flex items-center space-x-6">
              <Link href="/" className={`text-gray-700 hover:text-green-600 transition-colors ${location === '/' ? 'text-green-600 font-medium' : ''}`}>
                Home
              </Link>
              <Link href="/products" className={`text-gray-700 hover:text-green-600 transition-colors ${location === '/products' ? 'text-green-600 font-medium' : ''}`}>
                Products
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger className="text-gray-700 hover:text-green-600 transition-colors flex items-center">
                  Ingredients <ChevronDown className="ml-1 h-3 w-3" />
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[500px] p-2">
                  {/* All Ingredients Link */}
                  <Link href="/ingredients">
                    <DropdownMenuItem className="mb-2 bg-green-50 hover:bg-green-100 font-medium text-green-700 py-2">
                      All Ingredients
                    </DropdownMenuItem>
                  </Link>
                  
                  <DropdownMenuSeparator className="mb-2" />
                  
                  {/* Categories in Three Columns */}
                  <div className="grid grid-cols-3 gap-1">
                    {categories.map((category) => (
                      <Link key={category.id} href={`/products?category=${encodeURIComponent(category.name)}`}>
                        <DropdownMenuItem className="text-xs px-2 py-1.5 hover:bg-gray-50 cursor-pointer leading-tight">
                          {category.name}
                        </DropdownMenuItem>
                      </Link>
                    ))}
                  </div>
                  
                  {/* Show placeholder if no categories loaded */}
                  {categories.length === 0 && (
                    <div className="text-sm text-gray-500 text-center py-2">
                      Loading categories...
                    </div>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
              <a href="#" className="text-gray-700 hover:text-green-600 transition-colors">
                Certifications
              </a>
              <a href="#" className="text-gray-700 hover:text-green-600 transition-colors">
                R&D Lab
              </a>
              <a href="#" className="text-gray-700 hover:text-green-600 transition-colors">
                Services
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
              <Button variant="ghost" size="sm" className="hidden sm:flex">
                <Heart className="w-4 h-4" />
                <span className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 ml-1">0</span>
              </Button>
              
              <Button variant="ghost" size="sm">
                <ShoppingCart className="w-4 h-4" />
                <span className="bg-green-600 text-white text-xs rounded-full px-1.5 py-0.5 ml-1">0</span>
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
              ) : (
                <Button variant="ghost" onClick={() => window.location.href = "/login"}>
                  <User className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Login</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-green-600 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-2">
          <div className="flex items-center space-x-2 sm:space-x-4">
            <button className="lg:hidden flex items-center space-x-1 text-xs sm:text-sm">
              <Menu className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Categories</span>
            </button>
            
            <div className="flex-1 max-w-2xl">
              <form onSubmit={handleSearch} className="relative">
                <Input
                  type="search"
                  placeholder="Search for organic ingredients..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-300 border-0"
                />
                <Button
                  type="submit"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-transparent hover:bg-green-700 p-1 h-auto"
                >
                  <Search className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500" />
                </Button>
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

            {/* Mobile Menu Button */}
            <button className="md:hidden p-2">
              <Menu className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
