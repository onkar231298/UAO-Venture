import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import WebsiteManagement from "@/pages/crm/WebsiteManagement";
import SalesManagement from "@/pages/crm/SalesManagement";
import SampleRequestsPage from "@/pages/crm/SampleRequestsPage";
import HighVolumeBidsPage from "@/pages/crm/HighVolumeBidsPage";
import QuotationNegotiationsPage from "@/pages/crm/QuotationNegotiationsPage";
import SalesOrdersPage from "@/pages/crm/SalesOrdersPage";
import NewsletterSubscriptions from "@/pages/admin/NewsletterSubscriptions";
import BlogManagement from "@/pages/admin/BlogManagement";
import UserManagement from "@/pages/admin/UserManagement";
import SystemSettings from "@/pages/admin/SystemSettings";
import HRManagement from "@/pages/admin/HRManagement";
import AdminQualityOverview from "@/pages/admin/AdminQualityOverview";
import { NotificationBell } from "@/components/NotificationBell";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarInset,
  SidebarFooter,
} from "@/components/ui/sidebar";
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
  Mail,
  LogOut,
  Building2,
  Clock,
  ClipboardCheck
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

  const getPageTitle = () => {
    switch(activeSection) {
      case 'overview': return 'Dashboard';
      case 'inventory': return 'Inventory Management';
      case 'sales': return 'Sales Management';
      case 'enquiry-sample': return 'Customer Inquiries';
      case 'sales-crm': return 'Lead Management';
      case 'sample-requests': return 'Sample Requests';
      case 'high-volume-bids': return 'High Volume Bids';
      case 'quotation-negotiations': return 'Quote Negotiations';
      case 'sales-orders': return 'Sales Orders';
      case 'company-management': return 'Company Management';
      case 'purchase': return 'Purchase Management';
      case 'logistics': return 'Logistics Management';
      case 'accounts': return 'Accounts & Finance';
      case 'website': return 'Website Management';
      case 'users': return 'User Management';
      case 'analytics': return 'Analytics & Reports';
      case 'newsletter': return 'Newsletter Subscriptions';
      case 'blog': return 'Blog Management';
      case 'settings': return 'System Settings';
      case 'hr-management': return 'HR Management';
      default: return 'Dashboard';
    }
  };

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-gray-50 dark:bg-gray-900">
        {/* Sidebar Navigation */}
        <Sidebar className="border-r border-gray-200 dark:border-gray-700">
          {/* Logo/Brand */}
          <SidebarHeader className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Bright Fame Admin Portal</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">Organic Platform</p>
            <a 
              href="/" 
              className="inline-flex items-center text-sm text-green-600 hover:text-green-700 mt-3"
            >
              <Globe className="w-4 h-4 mr-1" />
              Back to Website
            </a>
          </SidebarHeader>

          {/* Navigation Menu */}
          <SidebarContent className="px-2 py-4">
            {/* MAIN Section */}
            <div className="mb-4">
              <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                MAIN
              </h3>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => setLocation('/admin/dashboard')}
                    isActive={activeSection === 'overview'}
                    className="w-full"
                  >
                    <LayoutDashboard className="mr-3 h-5 w-5" />
                    <span>Dashboard</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </div>

            {/* OPERATIONS Section */}
            <div className="mb-4">
              <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                OPERATIONS
              </h3>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => setActiveSection('inventory')}
                    isActive={activeSection === 'inventory'}
                    className="w-full"
                  >
                    <Warehouse className="mr-3 h-5 w-5" />
                    <span>Inventory Management</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => setActiveSection('sales')}
                    isActive={['sales', 'enquiry-sample', 'sample-requests', 'high-volume-bids', 'quotation-negotiations', 'sales-orders', 'sales-crm', 'company-management', 'duplicate-review'].includes(activeSection)}
                    className="w-full"
                  >
                    <TrendingUp className="mr-3 h-5 w-5" />
                    <span>Sales Management</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                
                {/* Sales Management Sub-items */}
                {['sales', 'enquiry-sample', 'sample-requests', 'high-volume-bids', 'quotation-negotiations', 'sales-orders', 'sales-crm', 'company-management', 'duplicate-review'].includes(activeSection) && (
                  <div className="ml-6 mt-1 space-y-1">
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        onClick={() => setActiveSection('enquiry-sample')}
                        isActive={activeSection === 'enquiry-sample'}
                        size="sm"
                        className="w-full"
                      >
                        <Send className="mr-3 h-4 w-4" />
                        <span>Customer Inquiries</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        onClick={() => setActiveSection('sample-requests')}
                        isActive={activeSection === 'sample-requests'}
                        size="sm"
                        className="w-full"
                        data-testid="nav-sample-requests"
                      >
                        <Package className="mr-3 h-4 w-4" />
                        <span>Sample Requests</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        onClick={() => setActiveSection('high-volume-bids')}
                        isActive={activeSection === 'high-volume-bids'}
                        size="sm"
                        className="w-full"
                        data-testid="nav-high-volume-bids"
                      >
                        <TrendingUp className="mr-3 h-4 w-4" />
                        <span>High Volume Bids</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        onClick={() => setActiveSection('quotation-negotiations')}
                        isActive={activeSection === 'quotation-negotiations'}
                        size="sm"
                        className="w-full"
                        data-testid="nav-quotation-negotiations"
                      >
                        <DollarSign className="mr-3 h-4 w-4" />
                        <span>Quote Negotiations</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        onClick={() => setActiveSection('sales-orders')}
                        isActive={activeSection === 'sales-orders'}
                        size="sm"
                        className="w-full"
                        data-testid="nav-sales-orders"
                      >
                        <ShoppingCart className="mr-3 h-4 w-4" />
                        <span>Sales Orders</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        onClick={() => setLocation('/admin/dashboard/crm/leads')}
                        isActive={activeSection === 'sales-crm'}
                        size="sm"
                        className="w-full"
                      >
                        <Users className="mr-3 h-4 w-4" />
                        <span>Lead Management</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        onClick={() => setLocation('/admin/dashboard/crm/companies')}
                        isActive={activeSection === 'company-management'}
                        size="sm"
                        className="w-full"
                        data-testid="nav-company-management"
                      >
                        <Building2 className="mr-3 h-4 w-4" />
                        <span>Company Management</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        onClick={() => setActiveSection('duplicate-review')}
                        isActive={activeSection === 'duplicate-review'}
                        size="sm"
                        className="w-full"
                        data-testid="nav-duplicate-review"
                      >
                        <Activity className="mr-3 h-4 w-4" />
                        <span>Duplicate Review</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </div>
                )}

                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => setActiveSection('purchase')}
                    isActive={activeSection === 'purchase'}
                    className="w-full"
                  >
                    <ShoppingCart className="mr-3 h-5 w-5" />
                    <span>Purchase Management</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => setActiveSection('logistics')}
                    isActive={activeSection === 'logistics'}
                    className="w-full"
                  >
                    <Truck className="mr-3 h-5 w-5" />
                    <span>Logistics Management</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => setActiveSection('accounts')}
                    isActive={activeSection === 'accounts'}
                    className="w-full"
                  >
                    <Calculator className="mr-3 h-5 w-5" />
                    <span>Accounts & Finance</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => setActiveSection('website')}
                    isActive={activeSection === 'website'}
                    className="w-full"
                  >
                    <Globe className="mr-3 h-5 w-5" />
                    <span>Website Management</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => setActiveSection('users')}
                    isActive={activeSection === 'users'}
                    className="w-full"
                  >
                    <Users className="mr-3 h-5 w-5" />
                    <span>User Management</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => setActiveSection('analytics')}
                    isActive={activeSection === 'analytics'}
                    className="w-full"
                  >
                    <BarChart3 className="mr-3 h-5 w-5" />
                    <span>Analytics & Reports</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => setActiveSection('newsletter')}
                    isActive={activeSection === 'newsletter'}
                    className="w-full"
                  >
                    <Mail className="mr-3 h-5 w-5" />
                    <span>Newsletter Subscriptions</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => setActiveSection('blog')}
                    isActive={activeSection === 'blog'}
                    className="w-full"
                  >
                    <FileText className="mr-3 h-5 w-5" />
                    <span>Blog Management</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => setActiveSection('hr-management')}
                    isActive={activeSection === 'hr-management'}
                    className="w-full"
                  >
                    <Clock className="mr-3 h-5 w-5" />
                    <span>HR Management</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => setActiveSection('quality-management')}
                    isActive={activeSection === 'quality-management'}
                    className="w-full"
                  >
                    <ClipboardCheck className="mr-3 h-5 w-5" />
                    <span>Quality Management</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </div>

            {/* PROFILE Section */}
            <div className="mb-4">
              <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                PROFILE
              </h3>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => setActiveSection('settings')}
                    isActive={activeSection === 'settings'}
                    className="w-full"
                  >
                    <Settings className="mr-3 h-5 w-5" />
                    <span>System Settings</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </div>
          </SidebarContent>

          {/* Logout Button */}
          <SidebarFooter className="p-4 border-t border-gray-200 dark:border-gray-700">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => window.location.href = '/api/logout'}
                  className="w-full text-red-600 hover:bg-red-50"
                >
                  <LogOut className="mr-3 h-4 w-4" />
                  <span>Log out</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>

        {/* Main Content Area with App Bar */}
        <SidebarInset className="flex-1 overflow-auto">
          {/* Top App Bar */}
          <header className="sticky top-0 z-10 bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between px-4 py-3 md:px-6">
              {/* Left: Mobile Trigger + Title */}
              <div className="flex items-center gap-3 flex-1">
                <SidebarTrigger className="md:hidden" />
                <div className="flex-1">
                  <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                    {getPageTitle()}
                  </h1>
                  <p className="hidden md:block text-sm text-gray-600 dark:text-gray-400">
                    Manage your B2B organic ingredients platform
                  </p>
                </div>
              </div>

              {/* Right: Notifications + User Info + Badge */}
              <div className="flex items-center gap-3">
                <NotificationBell />
                <Badge variant="secondary" className="hidden md:inline-flex bg-green-100 text-green-800">
                  {(adminUser as any)?.role?.replace('_', ' ').toUpperCase()}
                </Badge>
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-blue-600 text-white">
                    {(adminUser as any)?.firstName?.[0] || 'A'}
                    {(adminUser as any)?.lastName?.[0] || 'D'}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>
          </header>

        {/* Content Based on Active Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {activeSection === 'overview' && (
            <>
              {/* Welcome Section */}
              <div className="mb-6 sm:mb-8">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  Welcome back, {(adminUser as any).firstName || 'Admin'}!
                </h2>
                <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">
                  Manage your B2B organic ingredients platform from this dashboard.
                </p>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 sm:mb-8">
                <Card className="p-4 sm:p-6">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0">
                    <CardTitle className="text-sm font-medium">Total Products</CardTitle>
                    <Package className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent className="p-0 pt-2">
                    <div className="text-2xl font-bold">{(stats as any)?.totalProducts || 0}</div>
                    <p className="text-xs text-muted-foreground">Active in catalog</p>
                  </CardContent>
                </Card>

                <Card className="p-4 sm:p-6">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0">
                    <CardTitle className="text-sm font-medium">Total Inquiries</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent className="p-0 pt-2">
                    <div className="text-2xl font-bold">{(stats as any)?.totalInquiries || 0}</div>
                    <p className="text-xs text-muted-foreground">Customer inquiries</p>
                  </CardContent>
                </Card>

                <Card className="p-4 sm:p-6">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0">
                    <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent className="p-0 pt-2">
                    <div className="text-2xl font-bold">{(stats as any)?.totalUsers || 0}</div>
                    <p className="text-xs text-muted-foreground">Registered users</p>
                  </CardContent>
                </Card>

                <Card className="p-4 sm:p-6">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0">
                    <CardTitle className="text-sm font-medium">Revenue</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent className="p-0 pt-2">
                    <div className="text-2xl font-bold">$0</div>
                    <p className="text-xs text-muted-foreground">This month</p>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activities and Quick Actions */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <Card className="p-4 sm:p-6">
                  <CardHeader className="p-0 pb-4">
                    <CardTitle>Recent Activities</CardTitle>
                    <CardDescription>Latest platform activities and updates</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 p-0">
                    <div className="flex items-start sm:items-center gap-2 sm:gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-1 sm:mt-0 flex-shrink-0"></div>
                      <div className="text-sm flex-1 min-w-0">
                        <span className="font-medium">New product added:</span> Organic Turmeric Extract
                      </div>
                      <span className="text-xs text-gray-500 flex-shrink-0">2h ago</span>
                    </div>
                    <div className="flex items-start sm:items-center gap-2 sm:gap-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-1 sm:mt-0 flex-shrink-0"></div>
                      <div className="text-sm flex-1 min-w-0">
                        <span className="font-medium">Customer inquiry:</span> Bulk pricing request
                      </div>
                      <span className="text-xs text-gray-500 flex-shrink-0">4h ago</span>
                    </div>
                    <div className="flex items-start sm:items-center gap-2 sm:gap-3">
                      <div className="w-2 h-2 bg-orange-500 rounded-full mt-1 sm:mt-0 flex-shrink-0"></div>
                      <div className="text-sm flex-1 min-w-0">
                        <span className="font-medium">Stock update:</span> Ashwagandha Powder restocked
                      </div>
                      <span className="text-xs text-gray-500 flex-shrink-0">1d ago</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="p-4 sm:p-6">
                  <CardHeader className="p-0 pb-4">
                    <CardTitle>Quick Actions</CardTitle>
                    <CardDescription>Frequently used administrative functions</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 p-0">
                    <Button className="w-full justify-start min-h-[44px]" variant="outline">
                      <Plus className="mr-2 h-4 w-4" />
                      Add New Product
                    </Button>
                    <Button className="w-full justify-start min-h-[44px]" variant="outline">
                      <Users className="mr-2 h-4 w-4" />
                      Manage Users
                    </Button>
                    <Button className="w-full justify-start min-h-[44px]" variant="outline">
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

          {(activeSection === 'sales' || activeSection === 'enquiry-sample' || activeSection === 'bidding-requests' || activeSection === 'sales-crm' || activeSection === 'company-management' || activeSection === 'duplicate-review') && (
            <SalesManagement activeSubSection={activeSection} />
          )}

          {activeSection === 'sample-requests' && (
            <SampleRequestsPage />
          )}

          {activeSection === 'high-volume-bids' && (
            <HighVolumeBidsPage />
          )}

          {activeSection === 'quotation-negotiations' && (
            <QuotationNegotiationsPage />
          )}

          {activeSection === 'sales-orders' && (
            <SalesOrdersPage />
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

          {activeSection === 'settings' && (
            <SystemSettings />
          )}

          {activeSection === 'hr-management' && (
            <HRManagement />
          )}

          {activeSection === 'quality-management' && (
            <AdminQualityOverview />
          )}
          
          {activeSection !== 'overview' && activeSection !== 'website' && activeSection !== 'sales' && activeSection !== 'enquiry-sample' && activeSection !== 'bidding-requests' && activeSection !== 'sample-requests' && activeSection !== 'sales-crm' && activeSection !== 'company-management' && activeSection !== 'duplicate-review' && activeSection !== 'newsletter' && activeSection !== 'blog' && activeSection !== 'users' && activeSection !== 'settings' && activeSection !== 'hr-management' && activeSection !== 'quality-management' && activeSection !== 'high-volume-bids' && activeSection !== 'quotation-negotiations' && activeSection !== 'sales-orders' && (
            <Card className="p-4 sm:p-6">
              <CardHeader className="p-0 pb-4">
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
              <CardContent className="p-0">
                <p className="text-sm text-gray-600">
                  Complete {activeSection} management interface coming soon with full functionality.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}