import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import WebsiteManagement from "@/pages/crm/WebsiteManagement";
import SalesManagement from "@/pages/crm/SalesManagement";
import NewsletterSubscriptions from "@/pages/admin/NewsletterSubscriptions";
import BlogManagement from "@/pages/admin/BlogManagement";
import UserManagement from "@/pages/admin/UserManagement";
import {
  Users,
  Package,
  ShoppingCart,
  Truck,
  DollarSign,
  BarChart3,
  FileText,
  Settings,
  Plus,
  Activity,
  Globe,
  Warehouse,
  Calculator,
  TrendingUp,
  LayoutDashboard,
  Send,
  Mail
} from "lucide-react";

export default function AdminDashboard() {
  const { toast } = useToast();
  const [adminUser, setAdminUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('overview');
  const [location, setLocation] = useLocation();

  // Check admin authentication using useAuth hook
  const { user, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated || !user) {
        toast({
          title: "Authentication Required",
          description: "Please login to access admin dashboard.",
          variant: "destructive",
        });
        window.location.href = '/login';
        return;
      }
      
      // Check if user is admin
      if ((user as any).role !== 'admin' && (user as any).role !== 'super_admin') {
        toast({
          title: "Access Denied",
          description: "Admin privileges required.",
          variant: "destructive",
        });
        window.location.href = '/';
        return;
      }
      
      setAdminUser(user);
      setAuthLoading(false);
    }
  }, [isAuthenticated, isLoading, user, toast]);

  // Set active section based on URL path
  useEffect(() => {
    if (location.includes('/dashboard/crm/leads')) {
      setActiveSection('sales-crm');
    } else if (location.includes('/dashboard/crm/companies')) {
      setActiveSection('company-management');
    } else if (location.includes('/dashboard/sales')) {
      setActiveSection('sales');
    } else if (location.includes('/dashboard/enquiry-sample')) {
      setActiveSection('enquiry-sample');
    } else if (location.includes('/dashboard/website')) {
      setActiveSection('website');
    } else if (location.includes('/dashboard/users')) {
      setActiveSection('users');
    } else if (location.includes('/dashboard/newsletter')) {
      setActiveSection('newsletter');
    } else if (location.includes('/dashboard/blog')) {
      setActiveSection('blog');
    } else if (location.includes('/dashboard')) {
      setActiveSection('overview');
    }
  }, [location]);

  // Fetch dashboard stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
    enabled: !!adminUser,
    retry: (failureCount, error) => {
      if (error && (error as any).message?.includes('401')) {
        toast({
          title: "Session Expired", 
          description: "Please login again.",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/login";
        }, 500);
        return false;
      }
      return failureCount < 3;
    }
  });

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Activity className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!adminUser) {
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-white dark:bg-gray-800 shadow-sm border-r border-gray-200 dark:border-gray-700 flex flex-col">
        {/* Logo/Brand */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">BFI Admin Portal</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">Organic Platform</p>
          <a 
            href="/" 
            className="inline-flex items-center text-sm text-green-600 hover:text-green-700 mt-3"
          >
            <Globe className="w-4 h-4 mr-1" />
            Back to Website
          </a>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <div className="space-y-8">
            {/* MAIN Section */}
            <div className="mb-6">
              <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                MAIN
              </h3>
              <div className="space-y-1">
                <button
                  onClick={() => setLocation('/admin/dashboard')}
                  className={`w-full flex items-center px-4 py-2 text-sm rounded-lg transition-colors ${
                    activeSection === 'overview'
                      ? 'bg-blue-100 text-blue-900 border border-blue-200'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <LayoutDashboard className="mr-3 h-5 w-5" />
                  Dashboard
                </button>
              </div>
            </div>

            {/* OPERATIONS Section */}
            <div className="mb-6">
              <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                OPERATIONS
              </h3>
              <div className="space-y-1">
                <button
                  onClick={() => setActiveSection('inventory')}
                  className={`w-full flex items-center px-4 py-2 text-sm rounded-lg transition-colors ${
                    activeSection === 'inventory'
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <Warehouse className="mr-3 h-5 w-5" />
                  Inventory Management
                </button>
                <button
                  onClick={() => setActiveSection('sales')}
                  className={`w-full flex items-center px-4 py-2 text-sm rounded-lg transition-colors ${
                    activeSection === 'sales' || activeSection === 'enquiry-sample' || activeSection === 'sales-crm' || activeSection === 'company-management'
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <TrendingUp className="mr-3 h-5 w-5" />
                  Sales Management
                </button>
                
                {/* Sales Management Sub-items */}
                {(activeSection === 'sales' || activeSection === 'enquiry-sample' || activeSection === 'bidding-requests' || activeSection === 'sample-requests' || activeSection === 'sales-crm' || activeSection === 'company-management') && (
                  <div className="ml-6 mt-2 space-y-1">
                    <button
                      onClick={() => setActiveSection('enquiry-sample')}
                      className={`w-full flex items-center px-3 py-2 text-sm rounded-lg transition-colors ${
                        activeSection === 'enquiry-sample'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      <Send className="mr-3 h-4 w-4" />
                      Customer Inquiries
                    </button>
                    <button
                      onClick={() => setActiveSection('bidding-requests')}
                      className={`w-full flex items-center px-3 py-2 text-sm rounded-lg transition-colors ${
                        activeSection === 'bidding-requests'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      <TrendingUp className="mr-3 h-4 w-4" />
                      Bidding Requests
                    </button>
                    <button
                      onClick={() => setActiveSection('sample-requests')}
                      className={`w-full flex items-center px-3 py-2 text-sm rounded-lg transition-colors ${
                        activeSection === 'sample-requests'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      <Package className="mr-3 h-4 w-4" />
                      Sample Requests
                    </button>
                    <button
                      onClick={() => setLocation('/admin/dashboard/crm/leads')}
                      className={`w-full flex items-center px-3 py-2 text-sm rounded-lg transition-colors ${
                        activeSection === 'sales-crm'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      <Users className="mr-3 h-4 w-4" />
                      Lead Management
                    </button>
                    <button
                      onClick={() => setLocation('/admin/dashboard/crm/companies')}
                      className={`w-full flex items-center px-3 py-2 text-sm rounded-lg transition-colors ${
                        activeSection === 'company-management'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                      data-testid="nav-company-management"
                    >
                      <Warehouse className="mr-3 h-4 w-4" />
                      Company Management
                    </button>
                  </div>
                )}
                <button
                  onClick={() => setActiveSection('purchase')}
                  className={`w-full flex items-center px-4 py-2 text-sm rounded-lg transition-colors ${
                    activeSection === 'purchase'
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <ShoppingCart className="mr-3 h-5 w-5" />
                  Purchase Management
                </button>
                <button
                  onClick={() => setActiveSection('logistics')}
                  className={`w-full flex items-center px-4 py-2 text-sm rounded-lg transition-colors ${
                    activeSection === 'logistics'
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <Truck className="mr-3 h-5 w-5" />
                  Logistics Management
                </button>
                <button
                  onClick={() => setActiveSection('accounts')}
                  className={`w-full flex items-center px-4 py-2 text-sm rounded-lg transition-colors ${
                    activeSection === 'accounts'
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <Calculator className="mr-3 h-5 w-5" />
                  Accounts & Finance
                </button>
                <button
                  onClick={() => setActiveSection('website')}
                  className={`w-full flex items-center px-4 py-2 text-sm rounded-lg transition-colors ${
                    activeSection === 'website'
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <Globe className="mr-3 h-5 w-5" />
                  Website Management
                </button>
                <button
                  onClick={() => setActiveSection('users')}
                  className={`w-full flex items-center px-4 py-2 text-sm rounded-lg transition-colors ${
                    activeSection === 'users'
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <Users className="mr-3 h-5 w-5" />
                  User Management
                </button>
                <button
                  onClick={() => setActiveSection('analytics')}
                  className={`w-full flex items-center px-4 py-2 text-sm rounded-lg transition-colors ${
                    activeSection === 'analytics'
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <BarChart3 className="mr-3 h-5 w-5" />
                  Analytics & Reports
                </button>
                <button
                  onClick={() => setActiveSection('newsletter')}
                  className={`w-full flex items-center px-4 py-2 text-sm rounded-lg transition-colors ${
                    activeSection === 'newsletter'
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <Mail className="mr-3 h-5 w-5" />
                  Newsletter Subscriptions
                </button>
                <button
                  onClick={() => setActiveSection('blog')}
                  className={`w-full flex items-center px-4 py-2 text-sm rounded-lg transition-colors ${
                    activeSection === 'blog'
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <FileText className="mr-3 h-5 w-5" />
                  Blog Management
                </button>
              </div>
            </div>

            {/* PROFILE Section */}
            <div className="mb-6">
              <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                PROFILE
              </h3>
              <div className="space-y-1">
                <button
                  onClick={() => setActiveSection('settings')}
                  className={`w-full flex items-center px-4 py-2 text-sm rounded-lg transition-colors ${
                    activeSection === 'settings'
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <Settings className="mr-3 h-5 w-5" />
                  System Settings
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => window.location.href = '/api/logout'}
            className="w-full flex items-center px-4 py-2 text-sm text-red-600 rounded-lg hover:bg-red-50 transition-colors"
          >
            <Send className="mr-3 h-4 w-4 rotate-45" />
            Log out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto">
        {/* Top Header */}
        <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {activeSection === 'overview' ? 'Dashboard' : 
                   activeSection === 'inventory' ? 'Inventory Management' :
                   activeSection === 'sales' ? 'Sales Management' :
                   activeSection === 'enquiry-sample' ? 'Enquiry and Sample Management' :
                   activeSection === 'sales-crm' ? 'Sales CRM' :
                   activeSection === 'purchase' ? 'Purchase Management' :
                   activeSection === 'logistics' ? 'Logistics Management' :
                   activeSection === 'accounts' ? 'Accounts & Finance' :
                   activeSection === 'website' ? 'Website Management' :
                   activeSection === 'users' ? 'User Management' :
                   activeSection === 'analytics' ? 'Analytics & Reports' :
                   activeSection === 'newsletter' ? 'Newsletter Subscriptions' :
                   activeSection === 'blog' ? 'Blog Management' :
                   activeSection === 'settings' ? 'System Settings' : 'Dashboard'}
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Manage your B2B organic ingredients platform
                </p>
              </div>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                {(adminUser as any)?.role?.replace('_', ' ').toUpperCase()}
              </Badge>
            </div>
          </div>
        </header>

        {/* Content Based on Active Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {activeSection === 'overview' && (
            <>
              {/* Welcome Section */}
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  Welcome back, {(adminUser as any).firstName || 'Admin'}!
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Manage your B2B organic ingredients platform from this dashboard.
                </p>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Products</CardTitle>
                    <Package className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{(stats as any)?.totalProducts || 0}</div>
                    <p className="text-xs text-muted-foreground">Active in catalog</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Inquiries</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{(stats as any)?.totalInquiries || 0}</div>
                    <p className="text-xs text-muted-foreground">Customer inquiries</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{(stats as any)?.totalUsers || 0}</div>
                    <p className="text-xs text-muted-foreground">Registered users</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Revenue</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">$0</div>
                    <p className="text-xs text-muted-foreground">This month</p>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activities and Quick Actions */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Activities</CardTitle>
                    <CardDescription>Latest platform activities and updates</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <div className="text-sm">
                        <span className="font-medium">New product added:</span> Organic Turmeric Extract
                      </div>
                      <span className="text-xs text-gray-500 ml-auto">2 hours ago</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <div className="text-sm">
                        <span className="font-medium">Customer inquiry:</span> Bulk pricing request
                      </div>
                      <span className="text-xs text-gray-500 ml-auto">4 hours ago</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      <div className="text-sm">
                        <span className="font-medium">Stock update:</span> Ashwagandha Powder restocked
                      </div>
                      <span className="text-xs text-gray-500 ml-auto">1 day ago</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                    <CardDescription>Frequently used administrative functions</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button className="w-full justify-start" variant="outline">
                      <Plus className="mr-2 h-4 w-4" />
                      Add New Product
                    </Button>
                    <Button className="w-full justify-start" variant="outline">
                      <Users className="mr-2 h-4 w-4" />
                      Manage Users
                    </Button>
                    <Button className="w-full justify-start" variant="outline">
                      <FileText className="mr-2 h-4 w-4" />
                      View Inquiries
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </>
          )}

          {/* Other sections content */}
          {activeSection === 'website' && (
            <WebsiteManagement />
          )}

          {(activeSection === 'sales' || activeSection === 'enquiry-sample' || activeSection === 'bidding-requests' || activeSection === 'sample-requests' || activeSection === 'sales-crm' || activeSection === 'company-management') && (
            <SalesManagement activeSubSection={activeSection} />
          )}

          {activeSection === 'newsletter' && (
            <NewsletterSubscriptions />
          )}

          {activeSection === 'blog' && (
            <BlogManagement />
          )}

          {activeSection === 'users' && (
            <UserManagement />
          )}
          
          {activeSection !== 'overview' && activeSection !== 'website' && activeSection !== 'sales' && activeSection !== 'enquiry-sample' && activeSection !== 'bidding-requests' && activeSection !== 'sample-requests' && activeSection !== 'sales-crm' && activeSection !== 'company-management' && activeSection !== 'newsletter' && activeSection !== 'blog' && activeSection !== 'users' && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {activeSection === 'inventory' ? 'Inventory Management' :
                   activeSection === 'sales' ? 'Sales Management' :
                   activeSection === 'purchase' ? 'Purchase Management' :
                   activeSection === 'logistics' ? 'Logistics Management' :
                   activeSection === 'accounts' ? 'Accounts & Finance' :
                   activeSection === 'users' ? 'User Management' :
                   activeSection === 'analytics' ? 'Analytics & Reports' :
                   activeSection === 'settings' ? 'System Settings' : 'Module'}
                </CardTitle>
                <CardDescription>This module interface will be implemented here</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Complete {activeSection} management interface coming soon with full functionality.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}