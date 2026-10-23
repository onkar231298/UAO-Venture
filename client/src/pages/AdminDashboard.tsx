import { useEffect, useState, type MouseEvent as ReactMouseEvent } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useLocation, useSearch } from "wouter";
import WebsiteManagement from "@/pages/crm/WebsiteManagement";
import SalesManagement from "@/pages/crm/SalesManagement";
import SampleRequestsPage from "@/pages/crm/SampleRequestsPage";
import HighVolumeBidsPage from "@/pages/crm/HighVolumeBidsPage";
import QuotationNegotiationsPage from "@/pages/crm/QuotationNegotiationsPage";
import SalesOrdersPage from "@/pages/crm/SalesOrdersPage";
import PurchaseManagement from "@/pages/crm/PurchaseManagement";
import ProductionManagementLanding from "@/pages/admin/ProductionManagement";
import NewsletterSubscriptions from "@/pages/admin/NewsletterSubscriptions";
import BlogManagement from "@/pages/admin/BlogManagement";
import UserManagement from "@/pages/admin/UserManagement";
import SystemSettings from "@/pages/admin/SystemSettings";
import HRManagement from "@/pages/admin/HRManagement";
import AdminQualityOverview from "@/pages/admin/AdminQualityOverview";
import SecurityMonitor from "@/pages/admin/SecurityMonitor";
import SalesActivityLogs from "@/pages/admin/SalesActivityLogs";
import DocumentUpload from "@/pages/admin/DocumentUpload";
import { NotificationBell } from "@/components/NotificationBell";
import { PortalThemeProvider, PortalThemeToggle } from "@/components/portal/PortalTheme";
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
  Factory,
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
  X,
  Briefcase,
  FlaskConical,
  UserCheck,
  ArrowRight,
  AlertCircle,
  CheckSquare,
  MessageSquare,
  ShieldAlert,
  ClipboardList,
  Upload,
  ChevronDown,
} from "lucide-react";
import { PortalMobileNav, type PortalNavDestination } from "@/components/portal/PortalMobileNav";
import { PortalSidebarBranch } from "@/components/portal/PortalNavigation";

const salesSubKeys = ['sales', 'enquiry-sample', 'sample-requests', 'high-volume-bids', 'quotation-negotiations', 'sales-orders', 'sales-crm', 'company-management', 'duplicate-review'];
const toggleNavGroup = (event: ReactMouseEvent<HTMLButtonElement>) => {
  const button = event.currentTarget;
  const expanded = button.getAttribute("aria-expanded") === "true";
  button.setAttribute("aria-expanded", String(!expanded));
  button.querySelector("svg")?.classList.toggle("-rotate-90", expanded);
  button.nextElementSibling?.toggleAttribute("hidden", expanded);
};

export default function AdminDashboard() {
  const { toast } = useToast();
  const [adminUser, setAdminUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeSection, setActiveSection] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('section') || 'overview';
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [location, setLocation] = useLocation();
  const searchParams = useSearch();

  const { user, isAuthenticated, isLoading } = useAuth();

  const { data: securityAlertsCount } = useQuery<{ alerts: any[]; total: number }>({
    queryKey: ["/api/admin/security/alerts", { isResolved: "false" }],
    queryFn: async () => {
      const res = await fetch("/api/admin/security/alerts?isResolved=false&limit=1");
      if (!res.ok) return { alerts: [], total: 0 };
      return res.json();
    },
    staleTime: 30000,
    enabled: !!(user && ((user as any).role === 'admin' || (user as any).role === 'super_admin')),
  });
  const unresolvedSecurityAlerts = securityAlertsCount?.total ?? 0;
  const adminDisplayName = [adminUser?.firstName, adminUser?.lastName].filter(Boolean).join(" ").trim()
    || adminUser?.email?.split("@")[0]
    || "Admin";

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
    const requestedSection = new URLSearchParams(window.location.search).get("section");
    if (requestedSection) {
      setActiveSection(requestedSection);
      return;
    }
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
  }, [location, searchParams]);

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

  const { data: overview, isLoading: overviewLoading } = useQuery<{
    recentCompanies: { id: number; companyName: string; createdAt: string }[];
    recentInquiries: { id: number; companyName: string | null; status: string | null; createdAt: string }[];
    stageDistribution: { stage: string; count: number }[];
  }>({
    queryKey: ["/api/dashboard/overview"],
    enabled: !!adminUser,
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
      case 'production': return 'Production Management';
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
      case 'documents': return 'Document Upload';
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
      aria-current={isActive && (key !== "sales" || activeSection === "sales") ? "page" : undefined}
    >
      <Icon className={`mr-3 flex-shrink-0 ${size === 'small' ? 'h-4 w-4' : 'h-5 w-5'}`} />
      <span className="truncate">{label}</span>
    </button>
  );
  const adminNavItems: PortalNavDestination[] = [
    { key: "overview", label: "Dashboard", icon: LayoutDashboard, active: activeSection === "overview", onSelect: () => setActiveSection("overview") },
    { key: "inventory", label: "Inventory Management", icon: Warehouse, active: activeSection === "inventory", onSelect: () => setActiveSection("inventory") },
    { key: "production", label: "Production Management", icon: Factory, active: activeSection === "production", onSelect: () => setActiveSection("production") },
    { key: "sales", label: "Sales Management", icon: TrendingUp, active: activeSection === "sales", onSelect: () => setActiveSection("sales") },
    { key: "enquiry-sample", label: "Customer Inquiries", icon: Send, active: activeSection === "enquiry-sample", onSelect: () => setActiveSection("enquiry-sample") },
    { key: "sample-requests", label: "Sample Requests", icon: Package, active: activeSection === "sample-requests", onSelect: () => setActiveSection("sample-requests") },
    { key: "high-volume-bids", label: "High Volume Bids", icon: TrendingUp, active: activeSection === "high-volume-bids", onSelect: () => setActiveSection("high-volume-bids") },
    { key: "quotation-negotiations", label: "Quote Negotiations", icon: DollarSign, active: activeSection === "quotation-negotiations", onSelect: () => setActiveSection("quotation-negotiations") },
    { key: "sales-orders", label: "Sales Orders", icon: ShoppingCart, active: activeSection === "sales-orders", onSelect: () => setActiveSection("sales-orders") },
    { key: "sales-crm", label: "Lead Management", icon: Users, active: activeSection === "sales-crm", onSelect: () => setLocation("/admin/dashboard/crm/leads") },
    { key: "company-management", label: "Company Management", icon: Building2, active: activeSection === "company-management", onSelect: () => setLocation("/admin/dashboard/crm/companies") },
    { key: "duplicate-review", label: "Duplicate Review", icon: Activity, active: activeSection === "duplicate-review", onSelect: () => setActiveSection("duplicate-review") },
    { key: "purchase", label: "Purchase Management", icon: ShoppingCart, active: activeSection === "purchase", onSelect: () => setActiveSection("purchase") },
    { key: "logistics", label: "Logistics Management", icon: Truck, active: activeSection === "logistics", onSelect: () => setActiveSection("logistics") },
    { key: "accounts", label: "Accounts & Finance", icon: Calculator, active: activeSection === "accounts", onSelect: () => setActiveSection("accounts") },
    { key: "website", label: "Website Management", icon: Globe, active: activeSection === "website", onSelect: () => setActiveSection("website") },
    { key: "newsletter", label: "Newsletter", icon: Mail, active: activeSection === "newsletter", onSelect: () => setActiveSection("newsletter") },
    { key: "blog", label: "Blog Management", icon: FileText, active: activeSection === "blog", onSelect: () => setActiveSection("blog") },
    { key: "users", label: "User Management", icon: Users, active: activeSection === "users", onSelect: () => setActiveSection("users") },
    { key: "hr-management", label: "HR Management", icon: Clock, active: activeSection === "hr-management", onSelect: () => setActiveSection("hr-management") },
    { key: "quality-management", label: "Quality Management", icon: ClipboardCheck, active: activeSection === "quality-management", onSelect: () => setActiveSection("quality-management") },
    { key: "sales-activity-logs", label: "Sales Activity Logs", icon: ClipboardList, active: activeSection === "sales-activity-logs", onSelect: () => setActiveSection("sales-activity-logs") },
    { key: "security-monitor", label: "Security & Activity", icon: ShieldAlert, active: activeSection === "security-monitor", onSelect: () => setActiveSection("security-monitor") },
    { key: "analytics", label: "Analytics & Reports", icon: BarChart3, active: activeSection === "analytics", onSelect: () => setActiveSection("analytics") },
    ...(adminUser?.role === "super_admin" ? [{ key: "documents", label: "Document Upload", icon: Upload, active: activeSection === "documents", onSelect: () => setActiveSection("documents") }] : []),
    { key: "settings", label: "System Settings", icon: Settings, active: activeSection === "settings", onSelect: () => setActiveSection("settings") },
    { key: "website-home", label: "Back to Website", icon: Globe, onSelect: () => setLocation("/") },
    { key: "logout", label: "Log out", icon: LogOut, onSelect: () => { window.location.href = "/api/logout"; } },
  ].map((item) => ({
    ...item,
    parentKey: salesSubKeys.includes(item.key) && item.key !== "sales" ? "sales" : undefined,
    group: item.key === "overview" ? "Main"
      : ["inventory", "purchase", "logistics", "accounts", ...salesSubKeys].includes(item.key) ? "Operations"
      : ["website", "newsletter", "blog"].includes(item.key) ? "Website & Content"
      : ["users", "hr-management", "quality-management", "sales-activity-logs", "security-monitor"].includes(item.key) ? "People & Compliance"
      : item.key === "analytics" ? "Analytics" : item.key === "documents" ? "Admin Tools" : "Profile",
  }));

  return (
    <PortalThemeProvider className="bfo-admin-portal">
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`bfo-workspace-rail ${sidebarOpen ? 'flex' : 'hidden'} md:flex fixed md:static inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 shadow-sm border-r border-gray-200 dark:border-gray-700 flex-col`}>
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Atlas Ingredients Admin Portal</h2>
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
              <button type="button" className="bfo-nav-group-toggle" aria-expanded="true" onClick={toggleNavGroup}><span>MAIN</span><ChevronDown size={14} /></button>
              <div className="space-y-1">
                {navButton('overview', 'Dashboard', LayoutDashboard, activeSection === 'overview', () => setLocation('/admin/dashboard'))}
              </div>
            </div>

            <div>
              <button type="button" className="bfo-nav-group-toggle" aria-expanded="true" onClick={toggleNavGroup}><span>OPERATIONS</span><ChevronDown size={14} /></button>
              <div className="space-y-1">
                {navButton('inventory', 'Inventory Management', Warehouse, activeSection === 'inventory', () => setActiveSection('inventory'))}
                {navButton('production', 'Production Management', Factory, activeSection === 'production', () => setActiveSection('production'))}
                <PortalSidebarBranch label="Sales Management" active={salesSubKeys.includes(activeSection)} activeKey={activeSection}
                  trigger={navButton('sales', 'Sales Management', TrendingUp, salesSubKeys.includes(activeSection), () => setActiveSection('sales'))}>
                    {navButton('enquiry-sample', 'Customer Inquiries', Send, activeSection === 'enquiry-sample', () => setActiveSection('enquiry-sample'), 'small')}
                    {navButton('sample-requests', 'Sample Requests', Package, activeSection === 'sample-requests', () => setActiveSection('sample-requests'), 'small', 'nav-sample-requests')}
                    {navButton('high-volume-bids', 'High Volume Bids', TrendingUp, activeSection === 'high-volume-bids', () => setActiveSection('high-volume-bids'), 'small', 'nav-high-volume-bids')}
                    {navButton('quotation-negotiations', 'Quote Negotiations', DollarSign, activeSection === 'quotation-negotiations', () => setActiveSection('quotation-negotiations'), 'small', 'nav-quotation-negotiations')}
                    {navButton('sales-orders', 'Sales Orders', ShoppingCart, activeSection === 'sales-orders', () => setActiveSection('sales-orders'), 'small', 'nav-sales-orders')}
                    {navButton('sales-crm', 'Lead Management', Users, activeSection === 'sales-crm', () => setLocation('/admin/dashboard/crm/leads'), 'small')}
                    {navButton('company-management', 'Company Management', Building2, activeSection === 'company-management', () => setLocation('/admin/dashboard/crm/companies'), 'small', 'nav-company-management')}
                    {navButton('duplicate-review', 'Duplicate Review', Activity, activeSection === 'duplicate-review', () => setActiveSection('duplicate-review'), 'small', 'nav-duplicate-review')}
                </PortalSidebarBranch>

                {navButton('purchase', 'Purchase Management', ShoppingCart, activeSection === 'purchase', () => setActiveSection('purchase'))}
                {navButton('logistics', 'Logistics Management', Truck, activeSection === 'logistics', () => setActiveSection('logistics'))}
                {navButton('accounts', 'Accounts & Finance', Calculator, activeSection === 'accounts', () => setActiveSection('accounts'))}
              </div>
            </div>

            <div>
              <button type="button" className="bfo-nav-group-toggle" aria-expanded="true" onClick={toggleNavGroup}><span>WEBSITE &amp; CONTENT</span><ChevronDown size={14} /></button>
              <div className="space-y-1">
                {navButton('website', 'Website Management', Globe, activeSection === 'website', () => setActiveSection('website'))}
                {navButton('newsletter', 'Newsletter', Mail, activeSection === 'newsletter', () => setActiveSection('newsletter'))}
                {navButton('blog', 'Blog Management', FileText, activeSection === 'blog', () => setActiveSection('blog'))}
              </div>
            </div>

            <div>
              <button type="button" className="bfo-nav-group-toggle" aria-expanded="true" onClick={toggleNavGroup}><span>PEOPLE &amp; COMPLIANCE</span><ChevronDown size={14} /></button>
              <div className="space-y-1">
                {navButton('users', 'User Management', Users, activeSection === 'users', () => setActiveSection('users'))}
                {navButton('hr-management', 'HR Management', Clock, activeSection === 'hr-management', () => setActiveSection('hr-management'))}
                {navButton('quality-management', 'Quality Management', ClipboardCheck, activeSection === 'quality-management', () => setActiveSection('quality-management'))}
                {navButton('sales-activity-logs', 'Sales Activity Logs', ClipboardList, activeSection === 'sales-activity-logs', () => setActiveSection('sales-activity-logs'))}
                <button
                  onClick={() => handleNavClick('security-monitor', () => setActiveSection('security-monitor'))}
                  className={`w-full flex items-center px-4 py-2 text-sm rounded-lg transition-colors ${
                    activeSection === 'security-monitor'
                      ? "bg-blue-100 text-blue-900 border border-blue-200"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                >
                  <ShieldAlert className="mr-3 flex-shrink-0 h-5 w-5" />
                  <span className="truncate flex-1 text-left">Security &amp; Activity</span>
                  {unresolvedSecurityAlerts > 0 && (
                    <Badge variant="destructive" className="ml-1 h-5 min-w-5 px-1 text-[10px] shrink-0 flex items-center justify-center">
                      {unresolvedSecurityAlerts > 99 ? "99+" : unresolvedSecurityAlerts}
                    </Badge>
                  )}
                </button>
              </div>
            </div>

            <div>
              <button type="button" className="bfo-nav-group-toggle" aria-expanded="true" onClick={toggleNavGroup}><span>ANALYTICS</span><ChevronDown size={14} /></button>
              <div className="space-y-1">
                {navButton('analytics', 'Analytics & Reports', BarChart3, activeSection === 'analytics', () => setActiveSection('analytics'))}
              </div>
            </div>

            {(adminUser as any)?.role === 'super_admin' && (
              <div>
                <button type="button" className="bfo-nav-group-toggle" aria-expanded="true" onClick={toggleNavGroup}><span>ADMIN TOOLS</span><ChevronDown size={14} /></button>
                <div className="space-y-1">
                  {navButton('documents', 'Document Upload', Upload, activeSection === 'documents', () => setActiveSection('documents'))}
                </div>
              </div>
            )}

            <div>
              <button type="button" className="bfo-nav-group-toggle" aria-expanded="true" onClick={toggleNavGroup}><span>PROFILE</span><ChevronDown size={14} /></button>
              <div className="space-y-1">
                {navButton('settings', 'System Settings', Settings, activeSection === 'settings', () => setActiveSection('settings'))}
              </div>
            </div>
          </div>
        </nav>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            aria-label="Log out"
            title="Log out"
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

            <div className="flex items-center gap-2 md:gap-3">
              <PortalThemeToggle />
              <NotificationBell />
              <Badge variant="secondary" className="bfo-role-badge hidden md:inline-flex bg-green-100 text-green-800">
                {(adminUser as any)?.role?.replace('_', ' ').toUpperCase()}
              </Badge>
              <span className="bfo-user-name" title={adminDisplayName}>{adminDisplayName}</span>
              <Avatar className="h-8 w-8" aria-label={`Profile: ${adminDisplayName}`} title={adminDisplayName}>
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
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-1">
                  Welcome back, {(adminUser as any).firstName || 'Admin'}!
                </h2>
                <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">
                  Here's a live snapshot of your B2B organic ingredients platform.
                </p>
              </div>

              {/* KPI Row 1 — CRM & Sales */}
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <Card className="p-4 sm:p-5 border-l-4 border-l-blue-500">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Companies</span>
                    <Building2 className="h-4 w-4 text-blue-500" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {statsLoading ? '—' : ((stats as any)?.totalCompanies ?? 0).toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {((stats as any)?.activeCompanies ?? 0).toLocaleString()} active
                  </p>
                </Card>

                <Card className="p-4 sm:p-5 border-l-4 border-l-purple-500">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Contacts</span>
                    <Users className="h-4 w-4 text-purple-500" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {statsLoading ? '—' : ((stats as any)?.totalContacts ?? 0).toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Across all companies</p>
                </Card>

                <Card className="p-4 sm:p-5 border-l-4 border-l-orange-500">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Active Leads</span>
                    <TrendingUp className="h-4 w-4 text-orange-500" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {statsLoading ? '—' : ((stats as any)?.totalLeads ?? 0).toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">In pipeline</p>
                </Card>

                <Card className="p-4 sm:p-5 border-l-4 border-l-green-500">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Staff</span>
                    <UserCheck className="h-4 w-4 text-green-500" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {statsLoading ? '—' : ((stats as any)?.totalStaff ?? 0).toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Internal users</p>
                </Card>
              </div>

              {/* KPI Row 2 — Operations */}
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <Card className="p-4 sm:p-5 border-l-4 border-l-emerald-500">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Products</span>
                    <Package className="h-4 w-4 text-emerald-500" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {statsLoading ? '—' : ((stats as any)?.totalProducts ?? 0).toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {((stats as any)?.activeProducts ?? 0).toLocaleString()} active
                  </p>
                </Card>

                <Card className="p-4 sm:p-5 border-l-4 border-l-yellow-500">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Pending Inquiries</span>
                    <MessageSquare className="h-4 w-4 text-yellow-500" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {statsLoading ? '—' : ((stats as any)?.pendingInquiries ?? 0).toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Awaiting response</p>
                </Card>

                <Card className="p-4 sm:p-5 border-l-4 border-l-pink-500">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Sample Requests</span>
                    <CheckSquare className="h-4 w-4 text-pink-500" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {statsLoading ? '—' : ((stats as any)?.pendingSampleRequests ?? 0).toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Pending dispatch</p>
                </Card>

                <Card className="p-4 sm:p-5 border-l-4 border-l-red-500">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Quotations</span>
                    <FileText className="h-4 w-4 text-red-500" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {statsLoading ? '—' : ((stats as any)?.pendingQuotations ?? 0).toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Draft / pending</p>
                </Card>
              </div>

              {/* Department Quick-Launch */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Departments</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {[
                    {
                      label: 'Sales & CRM',
                      icon: <Briefcase className="h-5 w-5" />,
                      color: 'text-blue-600',
                      bg: 'bg-blue-50 dark:bg-blue-950',
                      section: 'company-management',
                      metric: `${((stats as any)?.totalCompanies ?? 0).toLocaleString()} companies`,
                      extra: overview?.stageDistribution,
                    },
                    {
                      label: 'Products',
                      icon: <Package className="h-5 w-5" />,
                      color: 'text-emerald-600',
                      bg: 'bg-emerald-50 dark:bg-emerald-950',
                      section: 'website',
                      metric: `${((stats as any)?.activeProducts ?? 0).toLocaleString()} active`,
                    },
                    {
                      label: 'Quality',
                      icon: <FlaskConical className="h-5 w-5" />,
                      color: 'text-purple-600',
                      bg: 'bg-purple-50 dark:bg-purple-950',
                      section: 'quality-management',
                      metric: 'Batches & QC',
                    },
                    {
                      label: 'HR',
                      icon: <UserCheck className="h-5 w-5" />,
                      color: 'text-orange-600',
                      bg: 'bg-orange-50 dark:bg-orange-950',
                      section: 'hr-management',
                      metric: `${((stats as any)?.totalStaff ?? 0)} staff`,
                    },
                    {
                      label: 'Website',
                      icon: <Globe className="h-5 w-5" />,
                      color: 'text-teal-600',
                      bg: 'bg-teal-50 dark:bg-teal-950',
                      section: 'website',
                      metric: 'Content & SEO',
                    },
                    {
                      label: 'Users',
                      icon: <Users className="h-5 w-5" />,
                      color: 'text-rose-600',
                      bg: 'bg-rose-50 dark:bg-rose-950',
                      section: 'users',
                      metric: `${((stats as any)?.totalStaff ?? 0)} staff accounts`,
                    },
                  ].map((dept) => (
                    <Card
                      key={dept.label}
                      className="p-3 sm:p-4 cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => setActiveSection(dept.section)}
                    >
                      <div className={`inline-flex p-2 rounded-lg ${dept.bg} ${dept.color} mb-2`}>
                        {dept.icon}
                      </div>
                      <div className="font-semibold text-sm text-gray-900 dark:text-white mb-0.5">{dept.label}</div>
                      <div className="text-xs text-muted-foreground mb-2">{dept.metric}</div>
                      {dept.label === 'Sales & CRM' && (dept.extra ?? []).length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {(dept.extra ?? []).map(({ stage, count }) => (
                            <span
                              key={stage}
                              className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                            >
                              {stage.charAt(0).toUpperCase() + stage.slice(1)}: {count.toLocaleString()}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className={`flex items-center text-xs font-medium ${dept.color}`}>
                        Go <ArrowRight className="h-3 w-3 ml-1" />
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Recent Activity Feed + Quick Actions */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {/* Recent Activity */}
                <Card className="p-4 sm:p-6">
                  <CardHeader className="p-0 pb-4">
                    <CardTitle className="text-base">Recent Activity</CardTitle>
                    <CardDescription>Latest companies and inquiries</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    {overviewLoading ? (
                      <div className="space-y-3">
                        {[1,2,3,4,5].map(i => (
                          <div key={i} className="h-9 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {/* Recent companies */}
                        {(overview?.recentCompanies ?? []).slice(0, 5).map((c) => (
                          <div
                            key={`company-${c.id}`}
                            className="flex items-center gap-3 py-2 border-b border-gray-100 dark:border-gray-800 last:border-0"
                          >
                            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <span className="text-xs text-muted-foreground">New company: </span>
                              <span className="text-sm font-medium truncate">{c.companyName}</span>
                            </div>
                            <span className="text-xs text-gray-400 flex-shrink-0">
                              {c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : ''}
                            </span>
                          </div>
                        ))}
                        {/* Recent inquiries */}
                        {(overview?.recentInquiries ?? []).map((inq) => (
                          <div
                            key={`inq-${inq.id}`}
                            className="flex items-center gap-3 py-2 border-b border-gray-100 dark:border-gray-800 last:border-0"
                          >
                            <div className="w-2 h-2 bg-yellow-500 rounded-full flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <span className="text-xs text-muted-foreground">Inquiry: </span>
                              <span className="text-sm font-medium truncate">{inq.companyName || 'Unknown'}</span>
                            </div>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              <Badge variant="outline" className="text-[10px] px-1 py-0">
                                {inq.status}
                              </Badge>
                              <span className="text-xs text-gray-400">
                                {inq.createdAt ? new Date(inq.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : ''}
                              </span>
                            </div>
                          </div>
                        ))}
                        {!(overview?.recentCompanies?.length) && !(overview?.recentInquiries?.length) && (
                          <p className="text-sm text-muted-foreground text-center py-4">No recent activity yet.</p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card className="p-4 sm:p-6">
                  <CardHeader className="p-0 pb-4">
                    <CardTitle className="text-base">Quick Actions</CardTitle>
                    <CardDescription>Jump to frequently used sections</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 p-0">
                    <Button
                      className="w-full justify-start min-h-[44px]"
                      variant="outline"
                      onClick={() => setActiveSection('website')}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add / Manage Products
                    </Button>
                    <Button
                      className="w-full justify-start min-h-[44px]"
                      variant="outline"
                      onClick={() => setActiveSection('users')}
                    >
                      <Users className="mr-2 h-4 w-4" />
                      Manage Users
                    </Button>
                    <Button
                      className="w-full justify-start min-h-[44px]"
                      variant="outline"
                      onClick={() => setActiveSection('enquiry-sample')}
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      View Inquiries
                    </Button>
                    <Button
                      className="w-full justify-start min-h-[44px]"
                      variant="outline"
                      onClick={() => setActiveSection('company-management')}
                    >
                      <Building2 className="mr-2 h-4 w-4" />
                      Company Management
                    </Button>
                    <Button
                      className="w-full justify-start min-h-[44px]"
                      variant="outline"
                      onClick={() => setActiveSection('quality-management')}
                    >
                      <FlaskConical className="mr-2 h-4 w-4" />
                      Quality Management
                    </Button>
                    <Button
                      className="w-full justify-start min-h-[44px]"
                      variant="outline"
                      onClick={() => setActiveSection('hr-management')}
                    >
                      <UserCheck className="mr-2 h-4 w-4" />
                      HR Management
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

          {activeSection === 'purchase' && (
            <PurchaseManagement />
          )}

          {activeSection === 'production' && (
            <ProductionManagementLanding />
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
            <SystemSettings canManagePdfTemplates={adminUser?.role === "super_admin"} />
          )}

          {activeSection === 'hr-management' && (
            <HRManagement />
          )}

          {activeSection === 'quality-management' && (
            <AdminQualityOverview />
          )}

          {activeSection === 'sales-activity-logs' && (
            <SalesActivityLogs />
          )}

          {activeSection === 'security-monitor' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold">Security &amp; Activity Monitor</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Track staff logins, data access patterns, and detect suspicious activity in real time.
                </p>
              </div>
              <SecurityMonitor />
            </div>
          )}

          {activeSection === 'documents' && (
            <DocumentUpload />
          )}
          
          {activeSection !== 'overview' && activeSection !== 'website' && activeSection !== 'sales' && activeSection !== 'enquiry-sample' && activeSection !== 'bidding-requests' && activeSection !== 'sample-requests' && activeSection !== 'sales-crm' && activeSection !== 'company-management' && activeSection !== 'duplicate-review' && activeSection !== 'newsletter' && activeSection !== 'blog' && activeSection !== 'users' && activeSection !== 'settings' && activeSection !== 'hr-management' && activeSection !== 'quality-management' && activeSection !== 'security-monitor' && activeSection !== 'sales-activity-logs' && activeSection !== 'high-volume-bids' && activeSection !== 'quotation-negotiations' && activeSection !== 'sales-orders' && activeSection !== 'purchase' && activeSection !== 'production' && activeSection !== 'documents' && (
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
    <PortalMobileNav items={adminNavItems} primaryKeys={["overview", "company-management", "sales-crm", "enquiry-sample"]} />
    </PortalThemeProvider>
  );
}