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
  Home,
  TrendingUp,
} from "lucide-react";
import { useCustomerAuth } from "@/hooks/useCustomerAuth";
import { useQuery } from "@tanstack/react-query";
import { PortalThemeToggle } from "@/components/portal/PortalTheme";
import { PortalMobileNav, type PortalNavDestination } from "@/components/portal/PortalMobileNav";

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

  const { data: sampleRequestsData } = useQuery({
    queryKey: ["/api/customer/sample-requests", customer?.id],
    queryFn: async () => {
      if (!customer?.id) return { requests: [], total: 0 };
      try {
        const response = await fetch(`/api/customer/sample-requests/${customer.id}`);
        if (!response.ok) return { requests: [], total: 0 };
        const data = await response.json();
        return data;
      } catch (error) {
        return { requests: [], total: 0 };
      }
    },
    enabled: !!customer?.id,
  });

  const inquiriesCount = inquiriesData?.total || 0;
  const quotationsCount = quotationsData?.total || 0;
  const savedProductsCount = Array.isArray(savedProductsData) ? savedProductsData.length : 0;
  const sampleRequestsCount = sampleRequestsData?.total || 0;
  
  // Calculate high volume bids from inquiries
  const highVolumeBidsCount = inquiriesData?.inquiries?.filter((inq: any) => inq.inquiryType === 'high_volume_bid').length || 0;

  const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/customer/dashboard", group: "OVERVIEW" },
    { icon: Package, label: "Sample Requests", href: "/customer/sample-requests", badge: sampleRequestsCount.toString(), group: "ORDERS & REQUESTS" },
    { icon: Package, label: "Browse Products", href: "/customer/products", group: "PRODUCT CATALOG" },
    { icon: Search, label: "Search", href: "/customer/search", group: "PRODUCT CATALOG" },
    { icon: MessageSquare, label: "My Inquiries", href: "/customer/inquiries", badge: inquiriesCount.toString(), group: "ORDERS & REQUESTS" },
    { icon: TrendingUp, label: "High Volume Bids", href: "/customer/high-volume-bids", badge: highVolumeBidsCount.toString(), group: "ORDERS & REQUESTS" },
    { icon: Heart, label: "Saved Products", href: "/customer/saved", badge: savedProductsCount.toString(), group: "PRODUCT CATALOG" },
    { icon: FileText, label: "Quotations", href: "/customer/quotes", badge: quotationsCount.toString(), group: "ORDERS & REQUESTS" },
    { icon: Download, label: "Downloads", href: "/customer/downloads", group: "RESOURCES" },
    { icon: FileText, label: "Catalogs", href: "/customer/catalogs", group: "RESOURCES" },
    { icon: User, label: "My Profile", href: "/customer/profile", group: "ACCOUNT" },
  ];
  const menuGroups = [...new Set(menuItems.map((item) => item.group))];
  const mobileItems: PortalNavDestination[] = [
    ...menuItems.map((item) => ({
      key: item.href,
      label: item.label,
      group: item.group,
      icon: item.icon,
      active: isActive(item.href),
      badge: item.badge,
      onSelect: () => setLocation(item.href),
    })),
    { key: "website", label: "Back to Website", icon: Home, group: "ACCOUNT", onSelect: () => setLocation("/") },
    { key: "settings", label: "Settings", icon: Settings, group: "ACCOUNT", onSelect: () => setLocation("/customer/settings") },
    { key: "logout", label: "Logout", icon: LogOut, group: "ACCOUNT", onSelect: () => { logoutCustomer(); setLocation("/"); } },
  ];

  function isActive(href: string) {
    if (href === "/customer/dashboard") {
      return location === href;
    }
    return location.startsWith(href);
  }

  return (
    <>
    <div className={`bfo-workspace-rail bfo-customer-sidebar bg-white shadow-lg border-r border-gray-200 transition-all duration-300 ${
      isCollapsed ? 'w-16' : 'w-64'
    } min-h-screen flex flex-col`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex flex-col gap-2">
              <img
                src="/atlas-ingredients-logo.svg"
                alt="Atlas Ingredients"
                className="h-8 w-[132px] object-contain object-left"
              />
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
        {menuGroups.map((group) => (
          <details key={group} className="bfo-customer-nav-group" open>
            {!isCollapsed && <summary>{group}</summary>}
            <div className="space-y-1">
              {menuItems.filter((item) => item.group === group).map((item) => (
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
                          <Badge variant="secondary" className="ml-auto text-xs bg-gray-200 text-gray-700">
                            {item.badge}
                          </Badge>
                        )}
                      </>
                    )}
                  </Button>
                </Link>
              ))}
            </div>
          </details>
        ))}
      </nav>

      {/* Footer Actions */}
      <div className="p-4 border-t border-gray-200 space-y-2">
        <PortalThemeToggle className="w-full" />
        <Button
          variant="ghost"
          title="Back to Website"
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
          title="Settings"
          aria-label="Settings"
          className={`w-full justify-start h-10 ${
            isCollapsed ? 'px-2' : 'px-3'
          } ${isActive("/customer/settings") ? "bg-green-100 text-green-800" : "text-gray-700 hover:bg-gray-100"}`}
          onClick={() => setLocation('/customer/settings')}
        >
          <Settings className={`w-5 h-5 ${isCollapsed ? '' : 'mr-3'}`} />
          {!isCollapsed && "Settings"}
        </Button>
        
        <Button
          variant="ghost"
          title="Logout"
          aria-label="Logout"
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
    <PortalMobileNav items={mobileItems} primaryKeys={["/customer/dashboard", "/customer/sample-requests", "/customer/products", "/customer/inquiries"]} showThemeToggle />
    </>
  );
}