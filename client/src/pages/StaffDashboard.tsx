import { useEffect, useState, type MouseEvent as ReactMouseEvent } from "react";
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
  BarChart3,
  FileText,
  Settings,
  Activity,
  Globe,
  Warehouse,
  Calculator,
  TrendingUp,
  LayoutDashboard,
  Calendar,
  ClipboardCheck,
  LogOut,
  Menu,
  X,
  MessageCircle,
  ChevronDown,
} from "lucide-react";
import { PunchInOutButton } from "@/components/hr/PunchInOutButton";
import { MyAttendance } from "@/components/hr/MyAttendance";
import { useSearch } from "wouter";
import { PortalThemeProvider, PortalThemeToggle } from "@/components/portal/PortalTheme";
import { PortalTopbarActions } from "@/components/portal/PortalTopbarActions";
import { PortalMobileNav, type PortalNavDestination } from "@/components/portal/PortalMobileNav";

const toggleStaffNavGroup = (event: ReactMouseEvent<HTMLButtonElement>) => {
  const button = event.currentTarget;
  const expanded = button.getAttribute("aria-expanded") === "true";
  button.setAttribute("aria-expanded", String(!expanded));
  button.querySelector("svg")?.classList.toggle("-rotate-90", expanded);
  button.nextElementSibling?.toggleAttribute("hidden", expanded);
};

export default function StaffDashboard() {
  const routeSearch = useSearch();
  const { toast } = useToast();
  const [staffUser, setStaffUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeSection, setActiveSection] = useState(() => new URLSearchParams(window.location.search).get('section') || 'overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { user, isAuthenticated, isLoading } = useAuth();
  useEffect(() => {
    const target = new URLSearchParams(routeSearch).get("section");
    if (target) setActiveSection(target);
  }, [routeSearch]);

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
      website_manager: ['website'],
      quality_manager: ['quality', 'analytics'],
      quality_executive: ['quality']
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

  const { data: stats } = useQuery({
    queryKey: ["/api/dashboard/stats"],
    enabled: !!staffUser,
  });

  const { data: chatUnreadData } = useQuery<{ count: number }>({
    queryKey: ["/api/chat/unread-count"],
    enabled: !!staffUser,
    refetchInterval: 10000,
    refetchOnWindowFocus: true,
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
  const roleDisplayName = (staffUser as any).role?.replace(/_/g, ' ').toUpperCase();

  const moduleIcons: Record<string, any> = {
    sales: TrendingUp,
    purchase: ShoppingCart,
    inventory: Warehouse,
    logistics: Truck,
    accounts: Calculator,
    website: Globe,
    quality: ClipboardCheck,
    analytics: BarChart3,
  };

  const moduleLabels: Record<string, string> = {
    sales: 'Sales Management',
    purchase: 'Purchase Management',
    inventory: 'Inventory Management',
    logistics: 'Logistics Management',
    accounts: 'Accounts & Finance',
    website: 'Website Management',
    quality: 'Quality Management',
    analytics: 'Analytics & Reports',
  };

  const sectionTitles: Record<string, string> = {
    overview: 'Dashboard',
    sales: 'Sales Management',
    purchase: 'Purchase Management',
    inventory: 'Inventory Management',
    logistics: 'Logistics Management',
    accounts: 'Accounts & Finance',
    website: 'Website Management',
    quality: 'Quality Management',
    analytics: 'Analytics & Reports',
    'my-attendance': 'My Attendance',
    settings: 'Profile Settings',
  };
  const handleModuleClick = (module: string) => {
    if (module === 'quality') {
      window.location.href = '/quality/dashboard';
    } else {
      setActiveSection(module);
      setSidebarOpen(false);
    }
  };

  const staffNavItems: PortalNavDestination[] = [
    { key: "overview", label: "Dashboard", icon: LayoutDashboard, active: activeSection === "overview", onSelect: () => setActiveSection("overview") },
    { key: "chat", label: "Internal Chat", icon: MessageCircle, badge: chatUnreadData?.count || undefined, onSelect: () => { window.location.href = "/chat"; } },
    ...userModules.map((module: string) => ({
      key: module,
      label: moduleLabels[module] || module,
      icon: moduleIcons[module] || Package,
      active: activeSection === module,
      onSelect: () => handleModuleClick(module),
    })),
    { key: "my-attendance", label: "My Attendance", icon: Calendar, active: activeSection === "my-attendance", onSelect: () => setActiveSection("my-attendance") },
    { key: "settings", label: "Profile Settings", icon: Settings, active: activeSection === "settings", onSelect: () => setActiveSection("settings") },
    { key: "logout", label: "Log out", icon: LogOut, onSelect: () => { window.location.href = "/api/logout"; } },
  ];

  return (
    <PortalThemeProvider className="bfo-staff-portal">
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`${sidebarOpen ? 'fixed inset-y-0 left-0 z-50 flex' : 'hidden'} md:flex w-64 bg-white dark:bg-gray-800 shadow-sm border-r border-gray-200 dark:border-gray-700 flex-col`}>
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Staff Portal</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">{roleDisplayName}</p>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <nav className="flex-1 p-4 overflow-y-auto">
          <div className="space-y-6">
            <div>
              <button type="button" className="bfo-nav-group-toggle" aria-expanded="true" onClick={toggleStaffNavGroup}><span>MAIN</span><ChevronDown size={14} /></button>
              <div className="space-y-1">
                <button
                  onClick={() => { setActiveSection('overview'); setSidebarOpen(false); }}
                  className={`w-full flex items-center px-4 py-2 text-sm rounded-lg transition-colors ${
                    activeSection === 'overview'
                      ? 'bg-blue-100 text-blue-900 border border-blue-200'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <LayoutDashboard className="mr-3 h-5 w-5 flex-shrink-0" />
                  <span className="truncate">Dashboard</span>
                </button>
                <button
                  onClick={() => { window.location.href = '/chat'; }}
                  className="w-full flex items-center px-4 py-2 text-sm rounded-lg transition-colors text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <MessageCircle className="mr-3 h-5 w-5 flex-shrink-0" />
                  <span className="truncate">Internal Chat</span>
                  {(chatUnreadData?.count || 0) > 0 && (
                    <Badge className="ml-auto bg-emerald-600 text-white">
                      {(chatUnreadData?.count || 0) > 99 ? '99+' : chatUnreadData?.count}
                    </Badge>
                  )}
                </button>
              </div>
            </div>

            {userModules.length > 0 && (
              <div>
                <button type="button" className="bfo-nav-group-toggle" aria-expanded="true" onClick={toggleStaffNavGroup}><span>MY MODULES</span><ChevronDown size={14} /></button>
                <div className="space-y-1">
                  {userModules.map((module: string) => {
                    const Icon = moduleIcons[module] || Package;
                    const label = moduleLabels[module] || module;
                    return (
                      <button
                        key={module}
                        onClick={() => handleModuleClick(module)}
                        className={`w-full flex items-center px-4 py-2 text-sm rounded-lg transition-colors ${
                          activeSection === module
                            ? 'bg-blue-100 text-blue-900 border border-blue-200'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
                        <span className="truncate">{label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div>
              <button type="button" className="bfo-nav-group-toggle" aria-expanded="true" onClick={toggleStaffNavGroup}><span>HR</span><ChevronDown size={14} /></button>
              <div className="space-y-1">
                <button
                  onClick={() => { setActiveSection('my-attendance'); setSidebarOpen(false); }}
                  className={`w-full flex items-center px-4 py-2 text-sm rounded-lg transition-colors ${
                    activeSection === 'my-attendance'
                      ? 'bg-blue-100 text-blue-900 border border-blue-200'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <Calendar className="mr-3 h-5 w-5 flex-shrink-0" />
                  <span className="truncate">My Attendance</span>
                </button>
              </div>
            </div>

            <div>
              <button type="button" className="bfo-nav-group-toggle" aria-expanded="true" onClick={toggleStaffNavGroup}><span>PROFILE</span><ChevronDown size={14} /></button>
              <div className="space-y-1">
                <button
                  onClick={() => { setActiveSection('settings'); setSidebarOpen(false); }}
                  className={`w-full flex items-center px-4 py-2 text-sm rounded-lg transition-colors ${
                    activeSection === 'settings'
                      ? 'bg-blue-100 text-blue-900 border border-blue-200'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <Settings className="mr-3 h-5 w-5 flex-shrink-0" />
                  <span className="truncate">Profile Settings</span>
                </button>
              </div>
            </div>
          </div>
        </nav>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => (window.location.href = "/api/logout")}
            className="w-full flex items-center px-4 py-2 text-sm text-red-600 rounded-lg hover:bg-red-50 transition-colors"
          >
            <LogOut className="mr-3 h-4 w-4" />
            Log out
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="px-4 md:px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              <button
                onClick={() => setSidebarOpen(true)}
                className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <Menu className="h-5 w-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                  {sectionTitles[activeSection] || 'Dashboard'}
                </h1>
                <p className="hidden md:block text-sm text-gray-600 dark:text-gray-400">{roleDisplayName} Portal</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <PunchInOutButton />
              <PortalTopbarActions role={(staffUser as any)?.role || "staff"} />
              <PortalThemeToggle />
              <Badge variant="secondary" className="hidden md:inline-flex bg-blue-100 text-blue-800">
                {roleDisplayName}
              </Badge>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {activeSection === 'overview' && (
            <>
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  Welcome back, {(staffUser as any).firstName || 'Team Member'}!
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Manage your assigned modules from this dashboard.
                </p>
              </div>

              <div className="mb-6">
                <MyActivityWidget />
              </div>

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

              <Card>
                <CardHeader>
                  <CardTitle>Your Available Modules</CardTitle>
                  <CardDescription>Click on any module to access its features</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {userModules.map((module: string) => {
                      const Icon = moduleIcons[module] || Package;
                      return (
                        <Button
                          key={module}
                          variant="outline"
                          className="h-auto p-4 flex flex-col items-center space-y-2"
                          onClick={() => handleModuleClick(module)}
                        >
                          <Icon className="h-8 w-8" />
                          <span className="text-sm font-medium capitalize">{module}</span>
                        </Button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {activeSection === 'my-attendance' && (
            <MyAttendance />
          )}

          {activeSection !== 'overview' && activeSection !== 'my-attendance' && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {sectionTitles[activeSection] || 'Module'}
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
    <PortalMobileNav items={staffNavItems} primaryKeys={["overview", ...(userModules[0] ? [userModules[0]] : []), "my-attendance", "chat"]} />
    </PortalThemeProvider>
  );
}
