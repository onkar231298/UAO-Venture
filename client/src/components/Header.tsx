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
  LayoutDashboard
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
              <div className="flex items-center space-x-2 cursor-pointer">
                <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                  <Leaf className="text-white text-lg" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-green-600">Bright Fame Organic</h1>
                  <p className="text-xs text-gray-500">Pvt. Ltd.</p>
                </div>
              </div>
            </Link>
            
            {/* Navigation */}
            <nav className="hidden lg:flex items-center space-x-6">
              <Link href="/" className={`text-gray-700 hover:text-green-600 transition-colors ${location === '/' ? 'text-green-600 font-medium' : ''}`}>
                Products
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger className="text-gray-700 hover:text-green-600 transition-colors flex items-center">
                  Ingredients <ChevronDown className="ml-1 h-3 w-3" />
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem>Organic Powders</DropdownMenuItem>
                  <DropdownMenuItem>Herbal Extracts</DropdownMenuItem>
                  <DropdownMenuItem>Essential Oils</DropdownMenuItem>
                  <DropdownMenuItem>Raw Materials</DropdownMenuItem>
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

          <div className="flex items-center space-x-4">
            {/* Country Selector */}
            <div className="hidden md:flex items-center space-x-2">
              <div className="flex items-center space-x-1 text-sm text-gray-600">
                <Globe className="w-4 h-4" />
                <span>India</span>
              </div>
            </div>
            
            {/* User Actions */}
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm">
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
                <Button variant="ghost" onClick={() => window.location.href = "/api/login"}>
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
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center space-x-4">
            <button className="lg:hidden flex items-center space-x-1 text-sm">
              <Menu className="w-4 h-4" />
              <span>Categories</span>
            </button>
            
            <div className="flex-1 max-w-2xl">
              <form onSubmit={handleSearch} className="relative">
                <Input
                  type="search"
                  placeholder="Search for organic ingredients..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-300 border-0"
                />
                <Button
                  type="submit"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-transparent hover:bg-green-700 p-1 h-auto"
                >
                  <Search className="w-4 h-4 text-gray-500" />
                </Button>
              </form>
            </div>

            <div className="hidden md:flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-2">
                <Phone className="text-white w-4 h-4" />
                <div>
                  <div className="font-medium">+91-98765-43210</div>
                  <div className="text-xs text-green-200">Customer Support</div>
                </div>
              </div>
              <a href="#" className="flex items-center space-x-1 hover:text-green-200 bg-green-700 px-3 py-2 rounded-lg">
                <Phone className="w-4 h-4" />
                <span>WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
