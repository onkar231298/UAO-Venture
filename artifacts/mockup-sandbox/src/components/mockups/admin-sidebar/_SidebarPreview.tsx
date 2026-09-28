import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Activity, BarChart3, Building2, Calculator, ClipboardCheck, ClipboardList,
  Clock, DollarSign, FileText, Globe, LayoutDashboard, LogOut, Mail, Package,
  Send, Settings, ShieldAlert, ShoppingCart, TrendingUp, Truck, Upload, Users,
  Warehouse, X,
} from "lucide-react";

const salesSubKeys = ['sales', 'enquiry-sample', 'sample-requests', 'high-volume-bids', 'quotation-negotiations', 'sales-orders', 'sales-crm', 'company-management', 'duplicate-review'];

const iconColors: Record<string, string> = {
  overview: "#2D6B3C",
  inventory: "#77964C",
  sales: "#3C7C46",
  "enquiry-sample": "#608B50",
  "sample-requests": "#77964C",
  "high-volume-bids": "#4C8054",
  "quotation-negotiations": "#718B57",
  "sales-orders": "#54805D",
  "sales-crm": "#3D7548",
  "company-management": "#4D835E",
  "duplicate-review": "#729552",
  purchase: "#79964D",
  logistics: "#4F8973",
  accounts: "#6F8A50",
  website: "#4F8973",
  newsletter: "#819E53",
  blog: "#587D57",
  users: "#3D7548",
  "hr-management": "#74934E",
  "quality-management": "#4E8665",
  "sales-activity-logs": "#718B57",
  "security-monitor": "#577F52",
  analytics: "#588262",
  documents: "#789A51",
  settings: "#4D8059",
};

export function SidebarPreview({ branded }: { branded: boolean }) {
  const [activeSection, setActiveSection] = useState('overview');
  const unresolvedSecurityAlerts = 2;
  const handleNavClick = (key: string, onClick?: () => void) => {
    if (onClick) onClick();
  };

  const navButton = (key: string, label: string, Icon: any, isActive: boolean, onClick: () => void, size: 'normal' | 'small' = 'normal', testId?: string) => (
    <button
      key={key}
      onClick={() => handleNavClick(key, onClick)}
      className={`w-full flex items-center px-4 py-2 text-sm rounded-lg transition-colors ${
        isActive
          ? branded
            ? "bg-[#edf5e7] text-[#294a2c] border border-[#c9dbbd] shadow-[inset_3px_0_0_#6f9b50] font-semibold"
            : "bg-blue-100 text-blue-900 border border-blue-200"
          : branded
            ? "text-[#344b39] hover:bg-[#f2f7ef]"
            : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
      }`}
      data-testid={testId}
    >
      <Icon
        className={`mr-3 flex-shrink-0 ${size === 'small' ? 'h-4 w-4' : 'h-5 w-5'}`}
        style={branded ? { color: iconColors[key] ?? "#4F8059" } : undefined}
      />
      <span className="truncate">{label}</span>
    </button>
  );

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <aside className={`flex w-64 bg-white shadow-sm border-r flex-col ${
        branded ? "dark:bg-white border-[#dce7d6] border-t-[3px] border-t-[#95b259]" : "dark:bg-gray-800 border-gray-200 dark:border-gray-700"
      }`}>
        <div className={`p-6 border-b ${branded ? "border-[#e2eadc]" : "border-gray-200 dark:border-gray-700"}`}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className={`text-xl font-bold ${branded ? "text-[#294a2c]" : "text-gray-900 dark:text-white"}`}>Cape NatureX Admin Portal</h2>
              <p className={`text-sm ${branded ? "text-[#718b57]" : "text-gray-600 dark:text-gray-400"}`}>Organic Platform</p>
            </div>
            <button className="md:hidden p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>
          <a
            href="/"
            onClick={(event) => event.preventDefault()}
            className={`inline-flex items-center text-sm mt-3 ${
              branded ? "text-[#357644] hover:text-[#294a2c]" : "text-green-600 hover:text-green-700"
            }`}
          >
            <Globe className="w-4 h-4 mr-1" />
            Back to Website
          </a>
        </div>

        <nav className="flex-1 p-4 overflow-y-auto">
          <div className="space-y-6">
            <div>
              <h3 className={`px-3 text-xs font-semibold uppercase tracking-wider mb-3 ${branded ? "text-[#718b57]" : "text-gray-500"}`}>MAIN</h3>
              <div className="space-y-1">
                {navButton('overview', 'Dashboard', LayoutDashboard, activeSection === 'overview', () => setActiveSection('overview'))}
              </div>
            </div>

            <div>
              <h3 className={`px-3 text-xs font-semibold uppercase tracking-wider mb-3 ${branded ? "text-[#718b57]" : "text-gray-500"}`}>OPERATIONS</h3>
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
                    {navButton('sales-crm', 'Lead Management', Users, activeSection === 'sales-crm', () => setActiveSection('sales-crm'), 'small')}
                    {navButton('company-management', 'Company Management', Building2, activeSection === 'company-management', () => setActiveSection('company-management'), 'small', 'nav-company-management')}
                    {navButton('duplicate-review', 'Duplicate Review', Activity, activeSection === 'duplicate-review', () => setActiveSection('duplicate-review'), 'small', 'nav-duplicate-review')}
                  </div>
                )}
                {navButton('purchase', 'Purchase Management', ShoppingCart, activeSection === 'purchase', () => setActiveSection('purchase'))}
                {navButton('logistics', 'Logistics Management', Truck, activeSection === 'logistics', () => setActiveSection('logistics'))}
                {navButton('accounts', 'Accounts & Finance', Calculator, activeSection === 'accounts', () => setActiveSection('accounts'))}
              </div>
            </div>

            <div>
              <h3 className={`px-3 text-xs font-semibold uppercase tracking-wider mb-3 ${branded ? "text-[#718b57]" : "text-gray-500"}`}>WEBSITE & CONTENT</h3>
              <div className="space-y-1">
                {navButton('website', 'Website Management', Globe, activeSection === 'website', () => setActiveSection('website'))}
                {navButton('newsletter', 'Newsletter', Mail, activeSection === 'newsletter', () => setActiveSection('newsletter'))}
                {navButton('blog', 'Blog Management', FileText, activeSection === 'blog', () => setActiveSection('blog'))}
              </div>
            </div>

            <div>
              <h3 className={`px-3 text-xs font-semibold uppercase tracking-wider mb-3 ${branded ? "text-[#718b57]" : "text-gray-500"}`}>PEOPLE & COMPLIANCE</h3>
              <div className="space-y-1">
                {navButton('users', 'User Management', Users, activeSection === 'users', () => setActiveSection('users'))}
                {navButton('hr-management', 'HR Management', Clock, activeSection === 'hr-management', () => setActiveSection('hr-management'))}
                {navButton('quality-management', 'Quality Management', ClipboardCheck, activeSection === 'quality-management', () => setActiveSection('quality-management'))}
                {navButton('sales-activity-logs', 'Sales Activity Logs', ClipboardList, activeSection === 'sales-activity-logs', () => setActiveSection('sales-activity-logs'))}
                <button
                  onClick={() => handleNavClick('security-monitor', () => setActiveSection('security-monitor'))}
                  className={`w-full flex items-center px-4 py-2 text-sm rounded-lg transition-colors ${
                    activeSection === 'security-monitor'
                      ? branded ? "bg-[#edf5e7] text-[#294a2c] border border-[#c9dbbd] shadow-[inset_3px_0_0_#6f9b50] font-semibold" : "bg-blue-100 text-blue-900 border border-blue-200"
                      : branded ? "text-[#344b39] hover:bg-[#f2f7ef]" : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                >
                  <ShieldAlert className="mr-3 flex-shrink-0 h-5 w-5" style={branded ? { color: iconColors['security-monitor'] } : undefined} />
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
              <h3 className={`px-3 text-xs font-semibold uppercase tracking-wider mb-3 ${branded ? "text-[#718b57]" : "text-gray-500"}`}>ANALYTICS</h3>
              <div className="space-y-1">
                {navButton('analytics', 'Analytics & Reports', BarChart3, activeSection === 'analytics', () => setActiveSection('analytics'))}
              </div>
            </div>

            <div>
              <h3 className={`px-3 text-xs font-semibold uppercase tracking-wider mb-3 ${branded ? "text-[#718b57]" : "text-gray-500"}`}>ADMIN TOOLS</h3>
              <div className="space-y-1">
                {navButton('documents', 'Document Upload', Upload, activeSection === 'documents', () => setActiveSection('documents'))}
              </div>
            </div>

            <div>
              <h3 className={`px-3 text-xs font-semibold uppercase tracking-wider mb-3 ${branded ? "text-[#718b57]" : "text-gray-500"}`}>PROFILE</h3>
              <div className="space-y-1">
                {navButton('settings', 'System Settings', Settings, activeSection === 'settings', () => setActiveSection('settings'))}
              </div>
            </div>
          </div>
        </nav>

        <div className={`p-4 border-t ${branded ? "border-[#e2eadc]" : "border-gray-200 dark:border-gray-700"}`}>
          <button className="w-full flex items-center px-4 py-2 text-sm text-red-600 rounded-lg hover:bg-red-50 transition-colors">
            <LogOut className="mr-3 h-4 w-4" />
            Log out
          </button>
        </div>
      </aside>
    </div>
  );
}