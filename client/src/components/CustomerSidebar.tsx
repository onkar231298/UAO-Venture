import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  LayoutDashboard, 
  Package, 
  MessageSquare, 
  FileText, 
  ShoppingCart, 
  User, 
  Heart,
  Download,
  Search,
  Filter,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Home
} from "lucide-react";
import { useCustomerAuth } from "@/hooks/useCustomerAuth";
import { useQuery } from "@tanstack/react-query";

export default function CustomerSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [location, setLocation] = useLocation();
  const { customer, logoutCustomer } = useCustomerAuth();

  // Fetch counts for badges
  const { data: inquiriesData } = useQuery({
    queryKey: ["/api/customer/inquiries", customer?.id],
    queryFn: async () => {
      if (!customer?.id) return { inquiries: [], total: 0 };
      try {
        const response = await fetch(`/api/customer/inquiries/${customer.id}`);
        if (!response.ok) return { inquiries: [], total: 0 };
        const data = await response.json();
        return data;
      } catch (error) {
        return { inquiries: [], total: 0 };
      }
    },
    enabled: !!customer?.id,
  });

  const { data: quotationsData } = useQuery({
    queryKey: ["/api/customer/quotations", customer?.id],
    queryFn: async () => {
      if (!customer?.id) return { quotations: [], total: 0 };
      try {
        const response = await fetch(`/api/customer/quotations/${customer.id}`);
        if (!response.ok) return { quotations: [], total: 0 };
        const data = await response.json();
        return data;
      } catch (error) {
        return { quotations: [], total: 0 };
      }
    },
    enabled: !!customer?.id,
  });

  // Fetch saved products count
  const { data: savedProductsData } = useQuery({
    queryKey: ["/api/customer/saved-products", customer?.id],
    queryFn: async () => {
      if (!customer?.id) return [];
      try {
        const response = await fetch(`/api/customer/saved-products/${customer.id}`);
        if (!response.ok) return [];
        const data = await response.json();
        return Array.isArray(data) ? data : [];
      } catch (error) {
        return [];
      }
    },
    enabled: !!customer?.id,
  });

  const inquiriesCount = inquiriesData?.total || 0;
  const quotationsCount = quotationsData?.total || 0;
  const savedProductsCount = Array.isArray(savedProductsData) ? savedProductsData.length : 0;

  const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/customer/dashboard" },
    { icon: Package, label: "Browse Products", href: "/customer/products" },
    { icon: Search, label: "Search", href: "/customer/search" },
    { icon: MessageSquare, label: "My Inquiries", href: "/customer/inquiries", badge: inquiriesCount.toString() },
    { icon: Heart, label: "Saved Products", href: "/customer/saved", badge: savedProductsCount.toString() },
    { icon: ShoppingCart, label: "Quote Requests", href: "/customer/quotes", badge: quotationsCount.toString() },
    { icon: Download, label: "Downloads", href: "/customer/downloads" },
    { icon: FileText, label: "Catalogs", href: "/customer/catalogs" },
    { icon: User, label: "My Profile", href: "/customer/profile" },
  ];

  const isActive = (href: string) => {
    if (href === "/customer/dashboard") {
      return location === href;
    }
    return location.startsWith(href);
  };

  return (
    <div className={`bg-white shadow-lg border-r border-gray-200 transition-all duration-300 ${
      isCollapsed ? 'w-16' : 'w-64'
    } min-h-screen flex flex-col`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">BFI</span>
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">Customer Portal</h2>
                <p className="text-xs text-gray-500">Organic Ingredients</p>
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="ml-auto"
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Customer Info */}
      {customer && (
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Avatar className="w-10 h-10">
              <AvatarFallback className="bg-green-100 text-green-700">
                {customer.firstName?.[0]}{customer.lastName?.[0]}
              </AvatarFallback>
            </Avatar>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">
                  {customer.firstName} {customer.lastName}
                </p>
                <p className="text-sm text-gray-500 truncate">{customer.companyName}</p>
                <Badge variant="outline" className="mt-1 text-xs bg-green-50 text-green-700 border-green-200">
                  {customer.accountStatus}
                </Badge>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Navigation Menu */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <Button
              variant={isActive(item.href) ? "default" : "ghost"}
              className={`w-full justify-start h-10 ${
                isCollapsed ? 'px-2' : 'px-3'
              } ${
                isActive(item.href) 
                  ? 'bg-green-600 text-white hover:bg-green-700' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <item.icon className={`w-5 h-5 ${isCollapsed ? '' : 'mr-3'}`} />
              {!isCollapsed && (
                <>
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.badge && (
                    <Badge 
                      variant="secondary" 
                      className="ml-auto text-xs bg-gray-200 text-gray-700"
                    >
                      {item.badge}
                    </Badge>
                  )}
                </>
              )}
            </Button>
          </Link>
        ))}
      </nav>

      {/* Footer Actions */}
      <div className="p-4 border-t border-gray-200 space-y-2">
        <Button
          variant="ghost"
          className={`w-full justify-start h-10 ${
            isCollapsed ? 'px-2' : 'px-3'
          } text-gray-700 hover:bg-gray-100`}
          onClick={() => setLocation('/')}
        >
          <Home className={`w-5 h-5 ${isCollapsed ? '' : 'mr-3'}`} />
          {!isCollapsed && "Back to Website"}
        </Button>
        
        <Button
          variant="ghost"
          className={`w-full justify-start h-10 ${
            isCollapsed ? 'px-2' : 'px-3'
          } text-gray-700 hover:bg-gray-100`}
        >
          <Settings className={`w-5 h-5 ${isCollapsed ? '' : 'mr-3'}`} />
          {!isCollapsed && "Settings"}
        </Button>
        
        <Button
          variant="ghost"
          className={`w-full justify-start h-10 ${
            isCollapsed ? 'px-2' : 'px-3'
          } text-red-600 hover:bg-red-50`}
          onClick={() => {
            logoutCustomer();
            setLocation('/');
          }}
        >
          <LogOut className={`w-5 h-5 ${isCollapsed ? '' : 'mr-3'}`} />
          {!isCollapsed && "Logout"}
        </Button>
      </div>
    </div>
  );
}