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
  ClipboardCheck,
  Menu,
  X
} from "lucide-react";

const salesSubKeys = ['sales', 'enquiry-sample', 'sample-requests', 'high-volume-bids', 'quotation-negotiations', 'sales-orders', 'sales-crm', 'company-management', 'duplicate-review'];

export default function AdminDashboard() {
  const { toast } = useToast();
  const [adminUser, setAdminUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [location, setLocation] = useLocation();

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

  const handleNavClick = (key: string, onClick?: () => void) => {
    if (onClick) {
      onClick();
    }
    setSidebarOpen(false);
  };

  const navButton = (key: string, label: string, Icon: any, isActive: boolean, onClick: () => void, size: 'normal' | 'small' = 'normal', testId?: string) => (
    <button
      key={key}
      onClick={() => handleNavClick(key, onClick)}
      className={`w-full flex items-center px-4 py-2 text-sm rounded-lg transition-colors ${
        isActive
          ? "bg-blue-100 text-blue-900 border border-blue-200"
          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
      }`}
      data-testid={testId}
    >
      <Icon className={`mr-3 flex-shrink-0 ${size === 'small' ? 'h-4 w-4' : 'h-5 w-5'}`} />
      <span className="truncate">{label}</span>
    </button>
  );

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`${sidebarOpen ? 'flex' : 'hidden'} md:flex fixed md:static inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 shadow-sm border-r border-gray-200 dark:border-gray-700 flex-col`}>
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Bright Fame Admin Portal</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">Organic Platform</p>
            </div>
            <button className="md:hidden p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => setSidebarOpen(false)}>
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>
          <a 
            href="/" 
            className="inline-flex items-center text-sm text-green-600 hover:text-green-700 mt-3"
          >
            <Globe className="w-4 h-4 mr-1" />
            Back to Website
          </a>
        </div>

        <nav className="flex-1 p-4 overflow-y-auto">
          <div className="space-y-6">
            <div>
              <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">MAIN</h3>
              <div className="space-y-1">
                {navButton('overview', 'Dashboard', LayoutDashboard, activeSection === 'overview', () => setLocation('/admin/dashboard'))}
              </div>
            </div>

            <div>
              <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">OPERATIONS</h3>
              <div className="space-y-1">
                {navButton('inventory', 'Inventory Management', Warehouse, activeSection === 'inventory', () => setActiveSection('inventory'))}
                {navButton('sales', 'Sales Management', TrendingUp, salesSubKeys.includes(activeSection), () => setActiveSection('sales'))}

                {salesSubKeys.includes(activeSection) && (
                  <div className="ml-6 mt-1 space-y-1">
                    {navButton('enquiry-sample', 'Customer Inquiries', Send, activeSection === 'enquiry-sample', () => setActiveSection('enquiry-sample'), 'small')}
                    {navButton('sample-requests', 'Sample Requests', Package, activeSection === 'sample-requests', () => setActiveSection('sample-requests'), 'small', 'nav-sample-requests')}
                    {navButton('high-volume-bids', 'High Volume Bids', TrendingUp, activeSection === 'high-volume-bids', () => setActiveSection('high-volume-bids'), 'small', 'nav-high-volume-bids')}
                    {navButton('quotation-negotiations', 'Quote Negotiations', DollarSign, activeSection === 'quotation-negotiations', () => setActiveSection('quotation-negotiations'), 'small', 'nav-quotation-negotiations')}
                    {navButton('sales-orders', 'Sales Orders', ShoppingCart, activeSection === 'sales-orders', () => setActiveSection('sales-orders'), 'small', 'nav-sales-orders')}
                    {navButton('sales-crm', 'Lead Management', Users, activeSection === 'sales-crm', () => setLocation('/admin/dashboard/crm/leads'), 'small')}
                    {navButton('company-management', 'Company Management', Building2, activeSection === 'company-management', () => setLocation('/admin/dashboard/crm/companies'), 'small', 'nav-company-management')}
                    {navButton('duplicate-review', 'Duplicate Review', Activity, activeSection === 'duplicate-review', () => setActiveSection('duplicate-review'), 'small', 'nav-duplicate-review')}
                  </div>
                )}

                {navButton('purchase', 'Purchase Management', ShoppingCart, activeSection === 'purchase', () => setActiveSection('purchase'))}
                {navButton('logistics', 'Logistics Management', Truck, activeSection === 'logistics', () => setActiveSection('logistics'))}
                {navButton('accounts', 'Accounts & Finance', Calculator, activeSection === 'accounts', () => setActiveSection('accounts'))}
              </div>
            </div>

            <div>
              <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">WEBSITE & CONTENT</h3>
              <div className="space-y-1">
                {navButton('website', 'Website Management', Globe, activeSection === 'website', () => setActiveSection('website'))}
                {navButton('newsletter', 'Newsletter', Mail, activeSection === 'newsletter', () => setActiveSection('newsletter'))}
                {navButton('blog', 'Blog Management', FileText, activeSection === 'blog', () => setActiveSection('blog'))}
              </div>
            </div>

            <div>
              <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">PEOPLE & COMPLIANCE</h3>
              <div className="space-y-1">
                {navButton('users', 'User Management', Users, activeSection === 'users', () => setActiveSection('users'))}
                {navButton('hr-management', 'HR Management', Clock, activeSection === 'hr-management', () => setActiveSection('hr-management'))}
                {navButton('quality-management', 'Quality Management', ClipboardCheck, activeSection === 'quality-management', () => setActiveSection('quality-management'))}
              </div>
            </div>

            <div>
              <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">ANALYTICS</h3>
              <div className="space-y-1">
                {navButton('analytics', 'Analytics & Reports', BarChart3, activeSection === 'analytics', () => setActiveSection('analytics'))}
              </div>
            </div>

            <div>
              <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">PROFILE</h3>
              <div className="space-y-1">
                {navButton('settings', 'System Settings', Settings, activeSection === 'settings', () => setActiveSection('settings'))}
              </div>
            </div>
          </div>
        </nav>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => window.location.href = '/api/logout'}
            className="w-full flex items-center px-4 py-2 text-sm text-red-600 rounded-lg hover:bg-red-50 transition-colors"
          >
            <LogOut className="mr-3 h-4 w-4" />
            Log out
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <header className="sticky top-0 z-10 bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between px-4 py-3 md:px-6">
            <div className="flex items-center gap-3 flex-1">
              <button className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => setSidebarOpen(true)}>
                <Menu className="h-5 w-5 text-gray-600 dark:text-gray-300" />
              </button>
              <div className="flex-1">
                <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                  {getPageTitle()}
                </h1>
                <p className="hidden md:block text-sm text-gray-600 dark:text-gray-400">
                  Manage your B2B organic ingredients platform
                </p>
              </div>
            </div>

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
      </main>
    </div>
  );
}