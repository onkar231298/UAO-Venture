import { useEffect } from "react";
import { Switch, Route, useLocation, Link } from "wouter";
import TestMultiCurrency from "@/pages/TestMultiCurrency";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CustomerAuthProvider } from "@/hooks/useCustomerAuth";
import { useAuth } from "@/hooks/useAuth";
import ReCAPTCHAProvider from "@/components/ReCAPTCHAProvider";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { CallStateProvider } from "@/contexts/CallStateContext";
import { seoService } from "@/services/seoService";
import { initGA } from "./lib/analytics";
import { useAnalytics } from "./hooks/use-analytics";
import Landing from "@/pages/Landing";
import Home from "@/pages/Home";
import About from "@/pages/About";
import AboutUs from "@/pages/AboutUs";
import OurTeam from "@/pages/OurTeam";
import OurFarmers from "@/pages/OurFarmers";
import Contact from "@/pages/Contact";
import Ingredients from "@/pages/Ingredients";
import Products from "@/pages/Products";
import ProductDetail from "@/pages/ProductDetail";
import CategoryPage from "@/pages/CategoryPage";
import HealthSupport from "@/pages/HealthSupport";
import HealthSupportPage from "@/pages/HealthSupportPage";
import SearchResults from "@/pages/SearchResults";
import Blog from "@/pages/Blog";
import BlogPost from "@/pages/BlogPost";
import UnifiedLogin from "@/pages/UnifiedLogin";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import AdminDashboard from "@/pages/AdminDashboard";
import CustomerDashboard from "@/pages/CustomerDashboard";
import StaffDashboard from "@/pages/StaffDashboard";
import QualityDashboard from "@/pages/quality/QualityDashboard";
import SalesPersonDashboard from "@/pages/SalesPersonDashboard";
import SalesLeadManagement from "@/pages/SalesLeadManagement";
import VideoUploadTest from "@/pages/VideoUploadTest";
import VideoHeroSliderManager from "@/pages/VideoHeroSliderManager";
import CustomerRegistration from "@/pages/CustomerRegistration";
import CustomerLogin from "@/pages/CustomerLogin";
import CustomerProfile from "@/pages/CustomerProfile";
import CustomerInquiries from "@/pages/CustomerInquiries";
import CustomerSavedProducts from "@/pages/CustomerSavedProducts";
import CustomerQuotes from "@/pages/CustomerQuotes";
import UserManagement from "@/pages/admin/UserManagement";
import NotFound from "@/pages/not-found";
import TestWebPUpload from "@/pages/TestWebPUpload";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import TermsOfService from "@/pages/TermsOfService";
import CookiePolicy from "@/pages/CookiePolicy";
import QualityTesting from "@/pages/services/QualityTesting";
import RDSupport from "@/pages/services/RDSupport";
import RegulatoryCompliance from "@/pages/services/RegulatoryCompliance";
import CustomPackaging from "@/pages/services/CustomPackaging";
import LogisticsSolutions from "@/pages/services/LogisticsSolutions";
import Certifications from "@/pages/Certifications";
import Industries from "@/pages/Industries";
import FoodIngredients from "@/pages/FoodIngredients";
import OrganicHerbs from "@/pages/OrganicHerbs";
import EUOrganicSpices from "@/pages/EUOrganicSpices";
import BulkOrganicExporter from "@/pages/BulkOrganicExporter";
import RegionalIngredientSupplier from "@/pages/RegionalIngredientSupplier";
import OrganicSupplierIndia from "@/pages/OrganicSupplierIndia";
import Presentation from "@/pages/Presentation";
import PackagingSolutions from "@/pages/PackagingSolutions";
import EmailSettings from "@/pages/crm/EmailSettings";
import MyCompanies from "@/pages/crm/MyCompanies";
import MySalesAndQuotations from "@/pages/crm/MySalesAndQuotations";
import MyAttendancePage from "@/pages/sales/MyAttendancePage";
import QualityRequestsPage from "@/pages/sales/QualityRequestsPage";
import MyActivityLog from "@/pages/sales/MyActivityLog";
import FollowUpsPage from "@/pages/sales/FollowUpsPage";
import SalesSampleRequestsPage from "@/pages/sales/SalesSampleRequestsPage";
import SalesOrdersPage from "@/pages/crm/SalesOrdersPage";
import InternalChat from "@/pages/InternalChat";
import { InternalChatLauncher } from "@/components/InternalChatLauncher";
import { PortalThemeProvider } from "@/components/portal/PortalTheme";
import "./styles/portal-theme.css";
import CustomerSidebar from "@/components/CustomerSidebar";
import { PortalThemeToggle } from "@/components/portal/PortalTheme";
import { PortalMobileNav, type PortalNavDestination } from "@/components/portal/PortalMobileNav";
import { SalesLayout } from "@/components/layouts/SalesLayout";
import { LayoutDashboard, Building2, AlarmClock, MessageCircle, FileText, Target, Package, ClipboardCheck, Calendar, Users, Settings, LogOut, TrendingUp } from "lucide-react";

import { useActivityHeartbeat } from "@/hooks/useActivityHeartbeat";
import PortalAppearanceSettings from "@/components/portal/PortalAppearanceSettings";

// Helper component for product URL redirect
function ProductRedirect({ params }: { params: { slug: string } }) {
  const [, setLocation] = useLocation();
  
  useEffect(() => {
    setLocation(`/products/${params.slug}`, { replace: true });
  }, [params.slug, setLocation]);
  
  return null;
}

function CustomerProductsPortal() {
  return (
    <PortalThemeProvider className="bfo-customer-standalone">
      <div className="bfo-customer-standalone-shell">
        <CustomerSidebar />
        <main className="bfo-customer-standalone-content">
          <div className="bfo-standalone-toolbar">
            <Link href="/customer/dashboard" className="bfo-portal-link"><LayoutDashboard size={16} />Customer portal</Link>
            <PortalThemeToggle />
          </div>
          <Products />
        </main>
      </div>
    </PortalThemeProvider>
  );
}

function CustomerProfilePortal() {
  return (
    <PortalThemeProvider className="bfo-customer-standalone">
      <div className="bfo-customer-standalone-shell">
        <CustomerSidebar />
        <main className="bfo-customer-standalone-content">
          <div className="bfo-standalone-toolbar">
            <Link href="/customer/dashboard" className="bfo-portal-link"><LayoutDashboard size={16} />Customer portal</Link>
            <PortalThemeToggle />
          </div>
          <CustomerProfile />
        </main>
      </div>
    </PortalThemeProvider>
  );
}

function ChatPortal() {
  const { user } = useAuth();
  const role = (user as any)?.role || "";
  if (!user) return <PortalThemeProvider className="bfo-chat-portal"><InternalChat /></PortalThemeProvider>;
  const homeHref = role === "admin" || role === "super_admin" ? "/admin"
    : role.startsWith("sales") ? "/sales"
      : role.startsWith("quality") ? "/quality/dashboard" : "/staff";
  const chatNavItems: PortalNavDestination[] = [
    { key: "home", label: "Dashboard", icon: LayoutDashboard, onSelect: () => { window.location.href = homeHref; } },
    { key: "/chat", label: "Internal Chat", icon: MessageCircle, active: true, onSelect: () => { window.location.href = "/chat"; } },
    ...(role.startsWith("sales") ? [
      { key: "/sales/my-companies", label: "My Companies", icon: Building2, onSelect: () => { window.location.href = "/sales/my-companies"; } },
      { key: "/sales/follow-ups", label: "Follow-ups", icon: AlarmClock, onSelect: () => { window.location.href = "/sales/follow-ups"; } },
      { key: "/sales/leads", label: "My Leads", icon: Target, onSelect: () => { window.location.href = "/sales/leads"; } },
      { key: "/sales/my-sales", label: "My Sales & Quotations", icon: FileText, onSelect: () => { window.location.href = "/sales/my-sales"; } },
      { key: "/sales/sample-requests", label: "Sample Requests", icon: Package, onSelect: () => { window.location.href = "/sales/sample-requests"; } },
      { key: "/sales/quality-requests", label: "Quality Requests", icon: ClipboardCheck, onSelect: () => { window.location.href = "/sales/quality-requests"; } },
      { key: "/sales/my-attendance", label: "My Attendance", icon: Calendar, onSelect: () => { window.location.href = "/sales/my-attendance"; } },
      { key: "/sales/my-activity-log", label: "My Activity Log", icon: FileText, onSelect: () => { window.location.href = "/sales/my-activity-log"; } },
      { key: "/crm/email-settings", label: "Email Settings", icon: Settings, onSelect: () => { window.location.href = "/crm/email-settings"; } },
      { key: "/sales/appearance", label: "Appearance", icon: Settings, onSelect: () => { window.location.href = "/sales/appearance"; } },
    ] : role === "admin" || role === "super_admin" ? [
      { key: "/admin", label: "Dashboard", icon: LayoutDashboard, onSelect: () => { window.location.href = "/admin"; } },
      { key: "/admin/inventory", label: "Inventory Management", icon: Package, onSelect: () => { window.location.href = "/admin?section=inventory"; } },
      { key: "/admin/sales", label: "Sales Management", icon: FileText, onSelect: () => { window.location.href = "/admin?section=sales"; } },
      { key: "/admin/inquiries", label: "Customer Inquiries", icon: MessageCircle, onSelect: () => { window.location.href = "/admin?section=enquiry-sample"; } },
      { key: "/admin/samples", label: "Sample Requests", icon: Package, onSelect: () => { window.location.href = "/admin?section=sample-requests"; } },
      { key: "/admin/bids", label: "High Volume Bids", icon: TrendingUp, onSelect: () => { window.location.href = "/admin?section=high-volume-bids"; } },
      { key: "/admin/negotiations", label: "Quote Negotiations", icon: FileText, onSelect: () => { window.location.href = "/admin?section=quotation-negotiations"; } },
      { key: "/admin/orders", label: "Sales Orders", icon: Package, onSelect: () => { window.location.href = "/admin?section=sales-orders"; } },
      { key: "/admin/leads", label: "Lead Management", icon: Target, onSelect: () => { window.location.href = "/admin/dashboard/crm/leads"; } },
      { key: "/admin/companies", label: "Company Management", icon: Building2, onSelect: () => { window.location.href = "/admin/dashboard/crm/companies"; } },
      { key: "/admin/duplicates", label: "Duplicate Review", icon: Users, onSelect: () => { window.location.href = "/admin?section=duplicate-review"; } },
      { key: "/admin/purchase", label: "Purchase Management", icon: Package, onSelect: () => { window.location.href = "/admin?section=purchase"; } },
      { key: "/admin/logistics", label: "Logistics Management", icon: Package, onSelect: () => { window.location.href = "/admin?section=logistics"; } },
      { key: "/admin/accounts", label: "Accounts & Finance", icon: FileText, onSelect: () => { window.location.href = "/admin?section=accounts"; } },
      { key: "/admin/website", label: "Website Management", icon: Settings, onSelect: () => { window.location.href = "/admin?section=website"; } },
      { key: "/admin/newsletter", label: "Newsletter", icon: FileText, onSelect: () => { window.location.href = "/admin?section=newsletter"; } },
      { key: "/admin/blog", label: "Blog Management", icon: FileText, onSelect: () => { window.location.href = "/admin?section=blog"; } },
      { key: "/admin/users", label: "User Management", icon: Users, onSelect: () => { window.location.href = "/admin?section=users"; } },
      { key: "/admin/hr", label: "HR Management", icon: Users, onSelect: () => { window.location.href = "/admin?section=hr-management"; } },
      { key: "/admin/quality", label: "Quality Management", icon: ClipboardCheck, onSelect: () => { window.location.href = "/admin?section=quality-management"; } },
      { key: "/admin/activity", label: "Sales Activity Logs", icon: FileText, onSelect: () => { window.location.href = "/admin?section=sales-activity-logs"; } },
      { key: "/admin/security", label: "Security & Activity", icon: Settings, onSelect: () => { window.location.href = "/admin?section=security-monitor"; } },
      { key: "/admin/analytics", label: "Analytics & Reports", icon: FileText, onSelect: () => { window.location.href = "/admin?section=analytics"; } },
      ...(role === "super_admin" ? [{ key: "/admin/documents", label: "Document Upload", icon: FileText, onSelect: () => { window.location.href = "/admin?section=documents"; } }] : []),
      { key: "/admin/settings", label: "System Settings", icon: Settings, onSelect: () => { window.location.href = "/admin?section=settings"; } },
    ] : role.startsWith("quality") ? [
      { key: "/quality/dashboard", label: "Dashboard", icon: LayoutDashboard, onSelect: () => { window.location.href = "/quality/dashboard"; } },
      { key: "/quality/sample-requests", label: "Sample Requests", icon: Package, onSelect: () => { window.location.href = "/quality/dashboard?section=sample-requests"; } },
      { key: "/quality/document-requests", label: "Document Requests", icon: FileText, onSelect: () => { window.location.href = "/quality/dashboard?section=document-requests"; } },
      { key: "/quality/records", label: "Testing Records", icon: ClipboardCheck, onSelect: () => { window.location.href = "/quality/dashboard?section=field-quality-records"; } },
      { key: "/quality/reports", label: "Test Reports", icon: FileText, onSelect: () => { window.location.href = "/quality/dashboard?section=test-reports"; } },
      { key: "/quality/batches", label: "Batch Management", icon: Package, onSelect: () => { window.location.href = "/quality/dashboard?section=batch-management"; } },
      { key: "/quality/vendors", label: "Material Vendors", icon: Building2, onSelect: () => { window.location.href = "/quality/dashboard?section=material-vendors"; } },
      { key: "/quality/vendor-approvals", label: "Customer Vendor Approvals", icon: Users, onSelect: () => { window.location.href = "/quality/dashboard?section=customer-vendor-approvals"; } },
      { key: "/quality/ncrs", label: "Non-Conformance Reports", icon: ClipboardCheck, onSelect: () => { window.location.href = "/quality/dashboard?section=ncrs"; } },
      { key: "/quality/website", label: "Website Management", icon: Settings, onSelect: () => { window.location.href = "/quality/dashboard?section=website-management"; } },
      { key: "/quality/attendance", label: "My Attendance", icon: Calendar, onSelect: () => { window.location.href = "/quality/dashboard?section=my-attendance"; } },
      { key: "/quality/profile", label: "Profile Settings", icon: Settings, onSelect: () => { window.location.href = "/quality/dashboard?section=profile-settings"; } },
    ] : [
      ...(({
        sales_manager: ["sales", "analytics"], sales_executive: ["sales"],
        purchase_manager: ["purchase", "analytics"], purchase_executive: ["purchase"],
        inventory_manager: ["inventory", "analytics"], inventory_executive: ["inventory"],
        logistics_manager: ["logistics", "analytics"], logistics_executive: ["logistics"],
        accounts_manager: ["accounts", "analytics"], accounts_executive: ["accounts"],
        seo_manager: ["website", "analytics"], website_manager: ["website"],
        quality_manager: ["quality", "analytics"], quality_executive: ["quality"],
      } as Record<string, string[]>)[role] || []).map((module) => ({
        key: `/staff/${module}`, label: `${module[0].toUpperCase()}${module.slice(1)} Management`,
        icon: module === "quality" ? ClipboardCheck : Package,
        onSelect: () => { window.location.href = module === "quality" ? "/quality/dashboard" : `/staff?section=${module}`; },
      })),
      { key: "/staff", label: "Staff Dashboard", icon: LayoutDashboard, onSelect: () => { window.location.href = "/staff"; } },
      { key: "/staff/attendance", label: "My Attendance", icon: Calendar, onSelect: () => { window.location.href = "/staff?section=my-attendance"; } },
      { key: "/staff/settings", label: "Profile Settings", icon: Settings, onSelect: () => { window.location.href = "/staff?section=settings"; } },
    ]),
    { key: "logout", label: "Log out", icon: LogOut, onSelect: () => { window.location.href = "/api/logout"; } },
  ];
  return (
    <PortalThemeProvider className="bfo-chat-portal">
      <div className="bfo-chat-standalone">
        <div className="bfo-standalone-toolbar">
          <Link href={homeHref} className="bfo-portal-link"><LayoutDashboard size={16} />Back to {role.split("_")[0] || "workspace"}</Link>
          <PortalThemeToggle />
        </div>
        <InternalChat />
      </div>
      <PortalMobileNav items={chatNavItems} primaryKeys={role.startsWith("sales") ? ["home", "/sales/my-companies", "/sales/follow-ups", "/chat"] : role === "admin" || role === "super_admin" ? ["home", "/admin/companies", "/admin/leads", "/admin/inquiries"] : role.startsWith("quality") ? ["home", "/quality/sample-requests", "/quality/records", "/quality/reports"] : ["home", chatNavItems[2]?.key || "/chat", "/staff/attendance", "/chat"]} />
    </PortalThemeProvider>
  );
}

function EmailSettingsPortal() {
  return <SalesLayout title="Email Settings" subtitle="Manage your assigned mailbox"><EmailSettings /></SalesLayout>;
}

function SalesAppearancePortal() {
  return <SalesLayout title="Appearance Settings" subtitle="Personalise your CRM workspace"><PortalAppearanceSettings /></SalesLayout>;
}

function Router() {
  const { user, isAuthenticated, isLoading } = useAuth();
  
  // Track page views when routes change
  useAnalytics();

  return (
    <Switch>
      {/* Public routes - always accessible for everyone */}
      <Route path="/" component={Home} />
      <Route path="/about" component={About} />
      <Route path="/about-us" component={AboutUs} />
      <Route path="/our-team" component={OurTeam} />
      <Route path="/our-farmers" component={OurFarmers} />
      <Route path="/certifications" component={Certifications} />
      <Route path="/contact" component={Contact} />
      <Route path="/ingredients" component={Ingredients} />
      <Route path="/landing" component={Landing} />
      <Route path="/products" component={Products} />
      <Route path="/ingredients/:slug" component={CategoryPage} />
      <Route path="/health-support" component={HealthSupport} />
      <Route path="/health-support/:slug" component={HealthSupportPage} />
      <Route path="/category/:slug" component={CategoryPage} />
      <Route path="/search/:query" component={SearchResults} />
      <Route path="/login" component={UnifiedLogin} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/chat" component={ChatPortal} />

      <Route path="/register" component={CustomerRegistration} />
      <Route path="/customer/profile" component={CustomerProfilePortal} />
      <Route path="/customer/dashboard" component={CustomerDashboard} />
      <Route path="/customer/inquiries" component={CustomerDashboard} />
      <Route path="/customer/high-volume-bids" component={CustomerDashboard} />
      <Route path="/customer/sample-requests" component={CustomerDashboard} />
      <Route path="/customer/saved" component={CustomerDashboard} />
      <Route path="/customer/quotes" component={CustomerDashboard} />
      <Route path="/customer/downloads" component={CustomerDashboard} />
      <Route path="/customer/catalogs" component={CustomerDashboard} />
      <Route path="/customer/products" component={CustomerProductsPortal} />
      <Route path="/customer/search" component={CustomerProductsPortal} />
      <Route path="/products/:slug" component={ProductDetail} />
      
      {/* Redirect old product URLs to new format */}
      <Route path="/product/:slug" component={ProductRedirect} />
      <Route path="/blog" component={Blog} />
      <Route path="/blog/:slug" component={BlogPost} />
      <Route path="/privacy-policy" component={PrivacyPolicy} />
      <Route path="/terms-of-service" component={TermsOfService} />
      <Route path="/cookie-policy" component={CookiePolicy} />
      
      {/* Industry-specific landing pages for SEO */}
      <Route path="/industries" component={Industries} />
      <Route path="/food-ingredients" component={FoodIngredients} />
      <Route path="/organic-herbs" component={OrganicHerbs} />
      <Route path="/eu-organic-spices" component={EUOrganicSpices} />
      <Route path="/bulk-organic-exporter-india" component={BulkOrganicExporter} />
      <Route path="/organic-spice-supplier-india" component={OrganicSupplierIndia} />
      <Route path="/organic-ingredients-supplier-usa" component={() => <RegionalIngredientSupplier market="usa" />} />
      <Route path="/organic-ingredients-supplier-germany" component={() => <RegionalIngredientSupplier market="germany" />} />
      <Route path="/organic-ingredients-exporter-uae" component={() => <RegionalIngredientSupplier market="uae" />} />
      <Route path="/presentation" component={Presentation} />
      <Route path="/packaging-solutions" component={PackagingSolutions} />
      
      {/* Service pages */}
      <Route path="/services/quality-testing" component={QualityTesting} />
      <Route path="/services/rd-support" component={RDSupport} />
      <Route path="/services/regulatory-compliance" component={RegulatoryCompliance} />
      <Route path="/services/custom-packaging" component={CustomPackaging} />
      <Route path="/services/logistics-solutions" component={LogisticsSolutions} />
      <Route path="/test-currency" component={TestMultiCurrency} />
      <Route path="/video-test" component={VideoUploadTest} />
      <Route path="/video-slider" component={() => <VideoHeroSliderManager canvaVideoUrl="" />} />
      <Route path="/test-webp-upload" component={TestWebPUpload} />
      
      {/* Admin dashboard routes - always registered, authentication handled inside AdminDashboard */}
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/*" component={AdminDashboard} />
      <Route path="/dashboard" component={AdminDashboard} />
      
      {/* Protected dashboard routes - only for authenticated users */}
      {!isLoading && isAuthenticated && user ? (
        <>          
          {/* Customer dashboard - accessible without admin auth */}
          <Route path="/customer/*" component={CustomerDashboard} />
          
          {/* Sales person dashboard - only for sales_executive and sales_manager */}
          {((user as any).role === 'sales_executive' || (user as any).role === 'sales_manager') ? (
            <>
              <Route path="/sales" component={SalesPersonDashboard} />
              <Route path="/sales/appearance" component={SalesAppearancePortal} />
              <Route path="/sales/leads" component={SalesLeadManagement} />
              <Route path="/sales/my-companies" component={MyCompanies} />
              <Route path="/sales/follow-ups" component={FollowUpsPage} />
              <Route path="/sales/my-sales" component={MySalesAndQuotations} />
              <Route path="/sales/my-attendance" component={MyAttendancePage} />
              <Route path="/sales/quality-requests" component={QualityRequestsPage} />
              <Route path="/sales/my-activity-log" component={MyActivityLog} />
              <Route path="/sales/sample-requests" component={SalesSampleRequestsPage} />
              <Route path="/sales/*" component={SalesPersonDashboard} />
              <Route path="/crm/email-settings" component={EmailSettingsPortal} />
            </>
          ) : null}
          
          {/* Staff dashboard - for all other roles */}
          {((user as any).role !== 'admin' && (user as any).role !== 'super_admin' && (user as any).role !== 'customer') ? (
            <>
              <Route path="/staff/*" component={StaffDashboard} />
              <Route path="/staff" component={StaffDashboard} />
              <Route path="/quality/dashboard" component={QualityDashboard} />
              <Route path="/quality/dashboard/*" component={QualityDashboard} />
            </>
          ) : null}
        </>
      ) : null}
      
      {/* 404 for any unmatched routes */}
      <Route component={NotFound} />
    </Switch>
  );
}

function ActivityHeartbeatTracker() {
  useActivityHeartbeat();
  return null;
}

function App() {
  // Initialize SEO service and Google Analytics on app load
  useEffect(() => {
    try {
      seoService.initializeSettings();
      
      // Verify required environment variable is present
      if (!import.meta.env.VITE_GA_MEASUREMENT_ID) {
        console.warn('Missing required Google Analytics key: VITE_GA_MEASUREMENT_ID');
      } else {
        initGA();
      }
    } catch (error) {
      console.warn('App initialization error:', error);
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ReCAPTCHAProvider>
        <CustomerAuthProvider>
          <CurrencyProvider>
            <CallStateProvider>
              <TooltipProvider>
                <Toaster />

                <ActivityHeartbeatTracker />
                 <InternalChatLauncher />
                <Router />
              </TooltipProvider>
            </CallStateProvider>
          </CurrencyProvider>
        </CustomerAuthProvider>
      </ReCAPTCHAProvider>
    </QueryClientProvider>
  );
}

export default App;