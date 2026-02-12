import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { MyActivityWidget } from "@/components/hr/MyActivityWidget";
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
  Calendar
} from "lucide-react";
import { PunchInOutButton } from "@/components/hr/PunchInOutButton";
import { MyAttendance } from "@/components/hr/MyAttendance";

export default function StaffDashboard() {
  const { toast } = useToast();
  const [staffUser, setStaffUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('overview');

  // Check staff authentication using useAuth hook
  const { user, isAuthenticated, isLoading } = useAuth();

  // Get user's allowed modules based on role
  const getUserModules = (role: string) => {
    const modules: any = {
      sales_manager: ['sales', 'analytics'],
      sales_executive: ['sales'],
      purchase_manager: ['purchase', 'analytics'],
      purchase_executive: ['purchase'],
      inventory_manager: ['inventory', 'analytics'],
      inventory_executive: ['inventory'],
      logistics_manager: ['logistics', 'analytics'],
      logistics_executive: ['logistics'],
      accounts_manager: ['accounts', 'analytics'],
      accounts_executive: ['accounts'],
      seo_manager: ['website', 'analytics'],
      website_manager: ['website']
    };
    return modules[role] || [];
  };

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated || !user) {
        toast({
          title: "Authentication Required",
          description: "Please login to access staff dashboard.",
          variant: "destructive",
        });
        window.location.href = "/api/login";
        return;
      }
      
      // Check if user is staff (not admin or customer)
      const userRole = (user as any).role;
      if (userRole === 'admin' || userRole === 'super_admin' || userRole === 'customer') {
        toast({
          title: "Access Denied",
          description: "Staff privileges required.",
          variant: "destructive",
        });
        window.location.reload();
        return;
      }
      
      setStaffUser(user);
      setAuthLoading(false);
    }
  }, [isAuthenticated, isLoading, user, toast]);

  // Fetch dashboard stats
  const { data: stats } = useQuery({
    queryKey: ["/api/dashboard/stats"],
    enabled: !!staffUser,
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

  if (!staffUser) {
    return null;
  }

  const userModules = getUserModules((staffUser as any).role);
  const roleDisplayName = (staffUser as any).role?.replace('_', ' ').toUpperCase();

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-white dark:bg-gray-800 shadow-sm border-r border-gray-200 dark:border-gray-700 flex flex-col">
        {/* Logo/Brand */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">BFI Staff Portal</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">{roleDisplayName}</p>
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
                  onClick={() => setActiveSection('overview')}
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

            {/* MY MODULES Section */}
            <div className="mb-6">
              <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                MY MODULES
              </h3>
              <div className="space-y-1">
                {userModules.includes('sales') && (
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
                )}
                
                {userModules.includes('purchase') && (
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
                )}
                
                {userModules.includes('inventory') && (
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
                )}
                
                {userModules.includes('logistics') && (
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
                )}
                
                {userModules.includes('accounts') && (
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
                )}
                
                {userModules.includes('website') && (
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
                )}
                
                {userModules.includes('analytics') && (
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
                )}
              </div>
            </div>

            {/* HR Section */}
            <div className="mb-6">
              <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                HR
              </h3>
              <div className="space-y-1">
                <button
                  onClick={() => setActiveSection('my-attendance')}
                  className={`w-full flex items-center px-4 py-2 text-sm rounded-lg transition-colors ${
                    activeSection === 'my-attendance'
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <Calendar className="mr-3 h-5 w-5" />
                  My Attendance
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
                  Profile Settings
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
                   activeSection === 'sales' ? 'Sales Management' :
                   activeSection === 'purchase' ? 'Purchase Management' :
                   activeSection === 'inventory' ? 'Inventory Management' :
                   activeSection === 'logistics' ? 'Logistics Management' :
                   activeSection === 'accounts' ? 'Accounts & Finance' :
                   activeSection === 'website' ? 'Website Management' :
                   activeSection === 'analytics' ? 'Analytics & Reports' :
                   activeSection === 'my-attendance' ? 'My Attendance' :
                   activeSection === 'settings' ? 'Profile Settings' : 'Dashboard'}
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {roleDisplayName} Portal
                </p>
              </div>
              <div className="flex items-center gap-3">
                <PunchInOutButton />
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  {roleDisplayName}
                </Badge>
              </div>
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
                  Welcome back, {(staffUser as any).firstName || 'Team Member'}!
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Manage your assigned modules from this dashboard.
                </p>
              </div>

              {/* Activity Status Widget */}
              <div className="mb-6">
                <MyActivityWidget />
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">My Tasks</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">0</div>
                    <p className="text-xs text-muted-foreground">Pending tasks</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Module Access</CardTitle>
                    <Settings className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{userModules.length}</div>
                    <p className="text-xs text-muted-foreground">Available modules</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Department</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{(staffUser as any).role?.split('_')[0]?.toUpperCase()}</div>
                    <p className="text-xs text-muted-foreground">Your department</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Role Level</CardTitle>
                    <Badge className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{(staffUser as any).role?.includes('manager') ? 'Manager' : 'Executive'}</div>
                    <p className="text-xs text-muted-foreground">Access level</p>
                  </CardContent>
                </Card>
              </div>

              {/* Available Modules */}
              <Card>
                <CardHeader>
                  <CardTitle>Your Available Modules</CardTitle>
                  <CardDescription>Click on any module to access its features</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {userModules.map((module) => (
                      <Button
                        key={module}
                        variant="outline"
                        className="h-auto p-4 flex flex-col items-center space-y-2"
                        onClick={() => setActiveSection(module)}
                      >
                        {module === 'sales' && <TrendingUp className="h-8 w-8" />}
                        {module === 'purchase' && <ShoppingCart className="h-8 w-8" />}
                        {module === 'inventory' && <Warehouse className="h-8 w-8" />}
                        {module === 'logistics' && <Truck className="h-8 w-8" />}
                        {module === 'accounts' && <Calculator className="h-8 w-8" />}
                        {module === 'website' && <Globe className="h-8 w-8" />}
                        {module === 'analytics' && <BarChart3 className="h-8 w-8" />}
                        <span className="text-sm font-medium capitalize">{module}</span>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* My Attendance Section */}
          {activeSection === 'my-attendance' && (
            <MyAttendance />
          )}

          {/* Other sections content */}
          {activeSection !== 'overview' && activeSection !== 'my-attendance' && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {activeSection === 'sales' ? 'Sales Management' :
                   activeSection === 'purchase' ? 'Purchase Management' :
                   activeSection === 'inventory' ? 'Inventory Management' :
                   activeSection === 'logistics' ? 'Logistics Management' :
                   activeSection === 'accounts' ? 'Accounts & Finance' :
                   activeSection === 'website' ? 'Website Management' :
                   activeSection === 'analytics' ? 'Analytics & Reports' :
                   activeSection === 'settings' ? 'Profile Settings' : 'Module'}
                </CardTitle>
                <CardDescription>This module interface will be implemented here</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Complete {activeSection} management interface coming soon with full functionality for your role level.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}