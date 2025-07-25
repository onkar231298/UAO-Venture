import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
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
  Edit,
  Eye,
  Activity,
  Home,
  Search,
  Globe,
  MessageSquare,
  ShoppingBag,
  Warehouse,
  CreditCard,
  TrendingUp,
  UserCheck,
  Building,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Clock,
  CheckSquare,
  AlertCircle,
  Target,
  PieChart,
  LayoutDashboard,
  MessageCircle,
  Clipboard,
  Receipt,
  Hash,
  ArrowUpDown,
  AlertTriangle,
  Send,
  TrendingDown,
  Calculator,
  HardDrive
} from "lucide-react";

export default function AdminDashboard() {
  const { toast } = useToast();
  const [adminUser, setAdminUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('overview');

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
        window.location.hash = '/login';
        return;
      }
      
      // Check if user is admin
      if (user.role !== 'admin' && user.role !== 'super_admin') {
        toast({
          title: "Access Denied",
          description: "Admin privileges required.",
          variant: "destructive",
        });
        window.location.hash = '/';
        return;
      }
      
      setAdminUser(user);
      setAuthLoading(false);
    }
  }, [isAuthenticated, isLoading, user, toast]);

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
          window.location.hash = "/login";
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

  const navigationItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      section: 'overview'
    },
    {
      id: 'website',
      label: 'Website Management',
      icon: Globe,
      section: 'website',
      children: [
        { id: 'products', label: 'Product Management', icon: Package },
        { id: 'categories', label: 'Categories', icon: FileText },
        { id: 'seo', label: 'SEO & Meta Data', icon: Search },
        { id: 'content', label: 'Content Management', icon: Edit }
      ]
    },
    {
      id: 'users',
      label: 'User Management',
      icon: Users,
      section: 'users',
      children: [
        { id: 'customers', label: 'Customer Management', icon: UserCheck },
        { id: 'staff', label: 'Staff & Roles', icon: Building },
        { id: 'permissions', label: 'Permissions', icon: CheckSquare }
      ]
    },
    {
      id: 'sales',
      label: 'Sales & CRM',
      icon: TrendingUp,
      section: 'sales',
      children: [
        { id: 'inquiries', label: 'Customer Inquiries', icon: MessageSquare },
        { id: 'leads', label: 'Lead Management', icon: Target },
        { id: 'quotations', label: 'Quotations & Pricing', icon: FileText },
        { id: 'sales-orders', label: 'Sales Orders', icon: ShoppingCart },
        { id: 'pipeline', label: 'Sales Pipeline', icon: BarChart3 },
        { id: 'customer-interactions', label: 'Customer Interactions', icon: MessageCircle },
        { id: 'sales-reports', label: 'Sales Reports', icon: BarChart3 }
      ]
    },
    {
      id: 'purchase',
      label: 'Purchase Management',
      icon: ShoppingBag,
      section: 'purchase',
      children: [
        { id: 'vendors', label: 'Vendor Management', icon: Building },
        { id: 'purchase-orders', label: 'Purchase Orders', icon: ShoppingCart },
        { id: 'purchase-requests', label: 'Purchase Requests', icon: Clipboard },
        { id: 'vendor-quotes', label: 'Vendor Quotations', icon: Receipt },
        { id: 'po-history', label: 'Purchase History', icon: Clock },
        { id: 'purchase-reports', label: 'Purchase Reports', icon: BarChart3 }
      ]
    },
    {
      id: 'inventory',
      label: 'Inventory Management',
      icon: Warehouse,
      section: 'inventory',
      children: [
        { id: 'stock-overview', label: 'Stock Overview', icon: Package },
        { id: 'stock-levels', label: 'Stock Levels', icon: BarChart3 },
        { id: 'batch-management', label: 'Batch Management', icon: Hash },
        { id: 'locations', label: 'Warehouse Locations', icon: MapPin },
        { id: 'expiry-tracking', label: 'Expiry Tracking', icon: Calendar },
        { id: 'stock-movements', label: 'Stock Movements', icon: ArrowUpDown },
        { id: 'low-stock-alerts', label: 'Low Stock Alerts', icon: AlertTriangle },
        { id: 'inventory-reports', label: 'Inventory Reports', icon: FileText }
      ]
    },
    {
      id: 'logistics',
      label: 'Logistics Management',
      icon: Truck,
      section: 'logistics',
      children: [
        { id: 'dispatch-orders', label: 'Dispatch Orders', icon: Send },
        { id: 'shipping-management', label: 'Shipping Management', icon: Truck },
        { id: 'delivery-tracking', label: 'Delivery Tracking', icon: MapPin },
        { id: 'logistics-partners', label: 'Logistics Partners', icon: Building },
        { id: 'shipping-rates', label: 'Shipping Rates', icon: DollarSign },
        { id: 'delivery-reports', label: 'Delivery Reports', icon: FileText }
      ]
    },
    {
      id: 'accounts',
      label: 'Accounts & Finance',
      icon: CreditCard,
      section: 'accounts',
      children: [
        { id: 'invoicing', label: 'Invoice Management', icon: FileText },
        { id: 'payments', label: 'Payment Tracking', icon: CreditCard },
        { id: 'receivables', label: 'Accounts Receivable', icon: TrendingUp },
        { id: 'payables', label: 'Accounts Payable', icon: TrendingDown },
        { id: 'financial-reports', label: 'Financial Reports', icon: BarChart3 },
        { id: 'tax-management', label: 'Tax Management', icon: Calculator },
        { id: 'budget-planning', label: 'Budget Planning', icon: PieChart }
      ]
    },
    {
      id: 'analytics',
      label: 'Analytics & Reports',
      icon: BarChart3,
      section: 'analytics',
      children: [
        { id: 'sales-analytics', label: 'Sales Analytics', icon: TrendingUp },
        { id: 'product-analytics', label: 'Product Performance', icon: Package },
        { id: 'user-analytics', label: 'User Analytics', icon: Users },
        { id: 'custom-reports', label: 'Custom Reports', icon: FileText }
      ]
    },
    {
      id: 'settings',
      label: 'System Settings',
      icon: Settings,
      section: 'settings',
      children: [
        { id: 'general', label: 'General Settings', icon: Settings },
        { id: 'company', label: 'Company Profile', icon: Building },
        { id: 'email', label: 'Email Templates', icon: Mail },
        { id: 'notifications', label: 'Notifications', icon: AlertCircle },
        { id: 'security', label: 'Security Settings', icon: CheckSquare },
        { id: 'backup', label: 'Backup & Restore', icon: HardDrive }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      {/* Sidebar Navigation */}
      <aside className="w-72 bg-white dark:bg-gray-800 shadow-lg border-r flex flex-col">
        {/* Logo/Brand */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">B</span>
            </div>
            <div className="ml-3">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">BFI Organic</h1>
            </div>
          </div>
        </div>

        {/* Admin User Profile */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
              <span className="text-gray-600 font-medium text-sm">
                {adminUser.firstName?.[0]}{adminUser.lastName?.[0]}
              </span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {adminUser.firstName} {adminUser.lastName}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {adminUser.email}
              </p>
              <p className="text-xs text-gray-500">
                Admin • BFI Organic Pvt. Ltd.
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 overflow-y-auto">
          <div className="px-4 py-4">
            {/* MAIN Section */}
            <div className="mb-6">
              <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                MAIN
              </h3>
              <div className="space-y-1">
                <button
                  onClick={() => setActiveSection('overview')}
                  className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    activeSection === 'overview'
                      ? 'bg-blue-600 text-white'
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
                  <Package className="mr-3 h-5 w-5" />
                  Inventory
                </button>
                
                <button
                  onClick={() => setActiveSection('sales')}
                  className={`w-full flex items-center px-4 py-2 text-sm rounded-lg transition-colors ${
                    activeSection === 'sales'
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <TrendingUp className="mr-3 h-5 w-5" />
                  Sales Management
                </button>

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
                  <DollarSign className="mr-3 h-5 w-5" />
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
                  {navigationItems.find(item => item.section === activeSection)?.label || 'Dashboard'}
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Manage your B2B organic ingredients platform
                </p>
              </div>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                {adminUser.role?.replace('_', ' ').toUpperCase()}
              </Badge>
            </div>
          </div>
        </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome back, {adminUser.firstName || 'Admin'}!
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
              <CardTitle className="text-sm font-medium">Quotations</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(stats as any)?.totalQuotations || 0}</div>
              <p className="text-xs text-muted-foreground">Generated quotes</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Dashboard Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="sales">Sales & CRM</TabsTrigger>
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Common administrative tasks</CardDescription>
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
                  <Button className="w-full justify-start" variant="outline">
                    <BarChart3 className="mr-2 h-4 w-4" />
                    Analytics Reports
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>System Status</CardTitle>
                  <CardDescription>Platform health and performance</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Database</span>
                    <Badge className="bg-green-100 text-green-800">Online</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Authentication</span>
                    <Badge className="bg-green-100 text-green-800">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">API Services</span>
                    <Badge className="bg-green-100 text-green-800">Running</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">File Storage</span>
                    <Badge className="bg-green-100 text-green-800">Ready</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="products" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Product Management</CardTitle>
                <CardDescription>Manage your product catalog</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">All Products</h3>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Product
                    </Button>
                  </div>
                  <p className="text-sm text-gray-600">
                    Product management interface will be implemented here.
                    This will include product CRUD operations, category management, 
                    SEO settings, and document upload capabilities.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>Manage users and roles</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  User management interface will include role assignment, 
                  user permissions, and account management features.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sales" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Sales & CRM</CardTitle>
                <CardDescription>Manage inquiries, quotations, and sales orders</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  CRM interface will include inquiry management, quotation generation,
                  customer interaction tracking, and sales analytics.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="inventory" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Inventory Management</CardTitle>
                <CardDescription>Track stock levels and manage inventory</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Inventory interface will include stock tracking, batch management,
                  expiry date monitoring, and dispatch management.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>System Settings</CardTitle>
                <CardDescription>Configure platform settings</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Settings interface will include system configuration,
                  email templates, notification settings, and platform preferences.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      </main>
    </div>
  );
}