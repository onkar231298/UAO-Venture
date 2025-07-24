import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
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
  LayoutDashboard,
  MessageCircle,
  Flag
} from "lucide-react";

export default function Header() {
  const [location] = useLocation();
  const { user, isAuthenticated } = useAuth() as { user: any; isAuthenticated: boolean };
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement search functionality
    console.log("Search:", searchQuery);
  };

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-50">
      {/* Main Header */}
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-8">
            {/* Logo */}
            <Link href="/">
              <div className="flex items-center space-x-3 cursor-pointer">
                <div className="w-12 h-12 bg-gradient-to-r from-green-600 to-blue-600 rounded-lg flex items-center justify-center">
                  <Leaf className="text-white text-xl" />
                </div>
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                    BFI Organic
                  </h1>
                  <p className="text-xs text-gray-500">Pvt. Ltd.</p>
                </div>
              </div>
            </Link>
            
            {/* Navigation */}
            <nav className="hidden lg:flex items-center space-x-6">
              <Link href="/" className={`text-gray-700 hover:text-green-600 transition-colors font-medium ${location === '/' ? 'text-green-600' : ''}`}>
                Products
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger className="text-gray-700 hover:text-green-600 transition-colors flex items-center font-medium">
                  Branded Ingredients <ChevronDown className="ml-1 h-3 w-3" />
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem>Organic Powders</DropdownMenuItem>
                  <DropdownMenuItem>Herbal Extracts</DropdownMenuItem>
                  <DropdownMenuItem>Essential Oils</DropdownMenuItem>
                  <DropdownMenuItem>Raw Materials</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <a href="#" className="text-gray-700 hover:text-green-600 transition-colors font-medium">
                Certifications
              </a>
              <a href="#" className="text-gray-700 hover:text-green-600 transition-colors font-medium">
                Certified Ingredients
              </a>
              <a href="#" className="text-gray-700 hover:text-green-600 transition-colors font-medium">
                R&D Lab
              </a>
              <DropdownMenu>
                <DropdownMenuTrigger className="text-gray-700 hover:text-green-600 transition-colors flex items-center font-medium">
                  Services <ChevronDown className="ml-1 h-3 w-3" />
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem>Custom Manufacturing</DropdownMenuItem>
                  <DropdownMenuItem>Quality Testing</DropdownMenuItem>
                  <DropdownMenuItem>Private Labeling</DropdownMenuItem>
                  <DropdownMenuItem>R&D Support</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </nav>
          </div>

          <div className="flex items-center space-x-4">
            {/* Country Selector */}
            <div className="hidden md:flex items-center space-x-2">
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-800">
                  <Flag className="w-4 h-4 text-orange-500" />
                  <span className="font-medium">India</span>
                  <ChevronDown className="w-3 h-3" />
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem>🇮🇳 India</DropdownMenuItem>
                  <DropdownMenuItem>🇺🇸 United States</DropdownMenuItem>
                  <DropdownMenuItem>🇬🇧 United Kingdom</DropdownMenuItem>
                  <DropdownMenuItem>🇨🇦 Canada</DropdownMenuItem>
                  <DropdownMenuItem>🇦🇺 Australia</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            {/* User Actions */}
            <div className="flex items-center space-x-2">
              {isAuthenticated && user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center space-x-2">
                      <User className="w-4 h-4" />
                      <span className="hidden sm:inline">Login</span>
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="px-2 py-1.5">
                      <p className="text-sm font-medium">{user.firstName} {user.lastName}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                      {user.role && (
                        <Badge variant="outline" className="mt-1 text-xs">
                          {user.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </Badge>
                      )}
                    </div>
                    <DropdownMenuSeparator />
                    {user.role !== 'customer' && (
                      <>
                        <DropdownMenuItem asChild>
                          <Link href="/dashboard" className="flex items-center">
                            <LayoutDashboard className="w-4 h-4 mr-2" />
                            Dashboard
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}
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
                <Button variant="ghost" onClick={() => window.location.href = "/api/login"} className="flex items-center space-x-1">
                  <User className="w-4 h-4" />
                  <span className="hidden sm:inline">Login</span>
                </Button>
              )}
              
              <Button variant="ghost" size="sm" className="relative">
                <Heart className="w-5 h-5" />
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">0</span>
              </Button>
              
              <Button variant="ghost" size="sm" className="relative">
                <ShoppingCart className="w-5 h-5" />
                <span className="absolute -top-2 -right-2 bg-green-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">0</span>
              </Button>
            </div>

            {/* WhatsApp and Contact Info - Green Jeeva Style */}
            <div className="flex items-center space-x-4">
              <Button 
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
                onClick={() => window.open('https://wa.me/919876543210', '_blank')}
              >
                <MessageCircle className="w-4 h-4" />
                <span className="hidden sm:inline">WhatsApp</span>
              </Button>
              
              <div className="hidden lg:flex items-center space-x-2 text-sm border-l pl-4">
                <Phone className="text-green-600 w-4 h-4" />
                <div>
                  <div className="font-bold text-green-600">+91-98765-43210</div>
                  <div className="text-xs text-gray-500">Customer Support</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar - Green Jeeva Style */}
      <div className="bg-gradient-to-r from-green-600 to-green-500 text-white">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center space-x-4">
            <button className="lg:hidden flex items-center space-x-1 text-sm font-medium">
              <Menu className="w-4 h-4" />
              <span>ALL CATEGORIES</span>
            </button>
            
            <div className="flex-1 max-w-2xl">
              <form onSubmit={handleSearch} className="relative">
                <Input
                  type="search"
                  placeholder="Search for organic ingredients..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-300 border-0 text-base"
                />
                <Button
                  type="submit"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-green-600 hover:bg-green-700 px-3 py-2 rounded-md"
                >
                  <Search className="w-4 h-4 text-white" />
                </Button>
              </form>
            </div>

            <Button 
              className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg flex items-center space-x-2 font-medium"
              onClick={() => window.open('https://wa.me/919876543210', '_blank')}
            >
              <MessageCircle className="w-5 h-5" />
              <span>WhatsApp</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
