import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { NotificationBell } from "@/components/NotificationBell";
import {
  Home,
  Target,
  Building2,
  MessageSquare,
  Package,
  Briefcase,
  Mail,
  User,
  LogOut,
  FileText,
} from "lucide-react";

interface SalesLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

interface DashboardData {
  summary: {
    activeLeads: number;
    pendingInquiries: number;
    samplesInProgress: number;
    pendingBids: number;
  };
}

export function SalesLayout({ children, title, subtitle }: SalesLayoutProps) {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const userRole = (user as any)?.role || 'sales_executive';

  const { data: dashboardData } = useQuery<DashboardData>({
    queryKey: ['/api/sales/dashboard'],
    enabled: !!user,
  });

  const summary = dashboardData?.summary || {
    activeLeads: 0,
    pendingInquiries: 0,
    samplesInProgress: 0,
    pendingBids: 0,
  };

  const isActive = (path: string) => location === path;

  return (
    <div className="flex h-screen bg-gray-50">
      <aside className="w-64 bg-white shadow-sm border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Sales Dashboard</h2>
          <p className="text-sm text-gray-600 capitalize">{userRole.replace('_', ' ')}</p>
        </div>

        <nav className="flex-1 p-4">
          <div className="space-y-1">
            <Link href="/sales">
              <Button
                variant={isActive('/sales') ? 'secondary' : 'ghost'}
                className="w-full justify-start"
                data-testid="nav-overview"
              >
                <Home className="w-4 h-4 mr-3" />
                Overview
              </Button>
            </Link>
            <Link href="/sales/leads">
              <Button
                variant={isActive('/sales/leads') ? 'secondary' : 'ghost'}
                className="w-full justify-start"
                data-testid="nav-leads"
              >
                <Target className="w-4 h-4 mr-3" />
                My Leads
                {summary.activeLeads > 0 && (
                  <Badge className="ml-auto bg-blue-100 text-blue-800">{summary.activeLeads}</Badge>
                )}
              </Button>
            </Link>
            <Link href="/sales/my-companies">
              <Button
                variant={isActive('/sales/my-companies') ? 'secondary' : 'ghost'}
                className="w-full justify-start"
                data-testid="nav-my-companies"
              >
                <Building2 className="w-4 h-4 mr-3" />
                My Companies
              </Button>
            </Link>
            <Link href="/sales/my-sales">
              <Button
                variant={isActive('/sales/my-sales') ? 'secondary' : 'ghost'}
                className="w-full justify-start"
                data-testid="nav-my-sales"
              >
                <FileText className="w-4 h-4 mr-3" />
                My Sales & Quotations
              </Button>
            </Link>
          </div>
          
          <div className="mt-6 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-2 px-3">Settings</p>
            <Link href="/crm/email-settings">
              <Button
                variant={isActive('/crm/email-settings') ? 'secondary' : 'ghost'}
                className="w-full justify-start"
                data-testid="nav-email-settings"
              >
                <Mail className="w-4 h-4 mr-3" />
                Email Settings
              </Button>
            </Link>
          </div>
        </nav>

        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-green-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {(user as any)?.firstName} {(user as any)?.lastName}
              </p>
              <p className="text-xs text-gray-500 truncate">{(user as any)?.email}</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => logout?.()}
            data-testid="button-logout"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
              {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
            </div>
            <div className="flex items-center gap-4">
              <NotificationBell />
            </div>
          </div>
        </div>
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
