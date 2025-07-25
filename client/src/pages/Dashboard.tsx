import { useAuth } from "@/hooks/useAuth";
import type { User } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart3, 
  Package, 
  MessageSquare, 
  FileText, 
  ShoppingCart, 
  Truck,
  Users,
  DollarSign,
  TrendingUp,
  Bell,
  Settings
} from "lucide-react";

export default function Dashboard() {
  const { user, isAuthenticated, isLoading } = useAuth() as { user: User | null; isAuthenticated: boolean; isLoading: boolean };
  const { toast } = useToast();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  // Redirect logic
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
    
    // Redirect admin users to admin dashboard (only if not already there)
    if (user && (user.role === 'admin' || user.role === 'super_admin') && !window.location.hash.includes('/admin/dashboard')) {
      window.location.hash = '/admin/dashboard';
      return;
    }
  }, [isAuthenticated, isLoading, toast, user]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-8"></div>
            <div className="grid md:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const getRoleDisplayName = (role: string) => {
    const roleMap: Record<string, string> = {
      super_admin: "Super Administrator",
      admin: "Administrator",
      sales_manager: "Sales Manager",
      sales_executive: "Sales Executive",
      purchase_manager: "Purchase Manager",
      purchase_executive: "Purchase Executive",
      inventory_manager: "Inventory Manager",
      inventory_executive: "Inventory Executive",
      logistics_manager: "Logistics Manager",
      logistics_executive: "Logistics Executive",
      accounts_manager: "Accounts Manager",
      accounts_executive: "Accounts Executive",
      seo_manager: "SEO Manager",
      website_manager: "Website Manager",
      customer: "Customer"
    };
    return roleMap[role] || role;
  };

  const getModulesForRole = (role: string) => {
    const modules = [];
    
    if (role.includes('admin')) {
      modules.push(
        { name: "Sales Management", href: "/crm/sales", icon: BarChart3, color: "blue" },
        { name: "Purchase Management", href: "/crm/purchase", icon: ShoppingCart, color: "green" },
        { name: "Inventory Management", href: "/crm/inventory", icon: Package, color: "purple" },
        { name: "Logistics Management", href: "/crm/logistics", icon: Truck, color: "orange" },
        { name: "Accounts Management", href: "/crm/accounts", icon: DollarSign, color: "red" },
        { name: "Website Management", href: "/crm/website", icon: Settings, color: "gray" }
      );
    } else if (role.includes('sales')) {
      modules.push(
        { name: "Sales Management", href: "/crm/sales", icon: BarChart3, color: "blue" },
        { name: "Customer Inquiries", href: "/crm/sales", icon: MessageSquare, color: "blue" },
        { name: "Quotations", href: "/crm/sales", icon: FileText, color: "blue" }
      );
    } else if (role.includes('purchase')) {
      modules.push(
        { name: "Purchase Management", href: "/crm/purchase", icon: ShoppingCart, color: "green" },
        { name: "Vendor Management", href: "/crm/purchase", icon: Users, color: "green" }
      );
    } else if (role.includes('inventory')) {
      modules.push(
        { name: "Inventory Management", href: "/crm/inventory", icon: Package, color: "purple" },
        { name: "Stock Tracking", href: "/crm/inventory", icon: BarChart3, color: "purple" }
      );
    } else if (role.includes('logistics')) {
      modules.push(
        { name: "Logistics Management", href: "/crm/logistics", icon: Truck, color: "orange" },
        { name: "Shipping & Delivery", href: "/crm/logistics", icon: Truck, color: "orange" }
      );
    } else if (role.includes('accounts')) {
      modules.push(
        { name: "Accounts Management", href: "/crm/accounts", icon: DollarSign, color: "red" },
        { name: "Financial Reports", href: "/crm/accounts", icon: BarChart3, color: "red" }
      );
    } else if (role === 'website_manager') {
      modules.push(
        { name: "Website Management", href: "/crm/website", icon: Settings, color: "gray" },
        { name: "Product Management", href: "/crm/website", icon: Package, color: "gray" }
      );
    }
    
    return modules;
  };

  const modules = getModulesForRole(user.role || 'customer');

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Welcome back, {user.firstName || 'User'}!
              </h1>
              <div className="flex items-center space-x-2">
                <Badge variant="outline">{getRoleDisplayName(user.role || 'customer')}</Badge>
                {user.companyName && (
                  <span className="text-gray-600">• {user.companyName}</span>
                )}
              </div>
            </div>
            <Button variant="outline" size="sm">
              <Bell className="w-4 h-4 mr-2" />
              Notifications
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        {stats && (
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Products</p>
                    <p className="text-2xl font-bold">{stats.totalProducts}</p>
                  </div>
                  <Package className="w-8 h-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Active Inquiries</p>
                    <p className="text-2xl font-bold">{stats.totalInquiries}</p>
                  </div>
                  <MessageSquare className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Quotations</p>
                    <p className="text-2xl font-bold">{stats.totalQuotations}</p>
                  </div>
                  <FileText className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Orders</p>
                    <p className="text-2xl font-bold">{stats.totalOrders}</p>
                  </div>
                  <ShoppingCart className="w-8 h-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* CRM Modules */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Modules</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {modules.map((module, index) => (
              <Link key={index} href={module.href}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center bg-${module.color}-100`}>
                        <module.icon className={`w-6 h-6 text-${module.color}-600`} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{module.name}</h3>
                        <p className="text-sm text-gray-600">
                          Manage {module.name.toLowerCase()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <MessageSquare className="w-5 h-5 text-blue-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium">New inquiry received</p>
                  <p className="text-xs text-gray-600">2 hours ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <FileText className="w-5 h-5 text-green-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Quotation sent</p>
                  <p className="text-xs text-gray-600">4 hours ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <ShoppingCart className="w-5 h-5 text-orange-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium">New order placed</p>
                  <p className="text-xs text-gray-600">1 day ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
