import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { NotificationBell } from "@/components/NotificationBell";
import {
  Home,
  Target,
  Building2,
  Mail,
  LogOut,
  FileText,
  Calendar,
  ClipboardCheck,
  Menu,
  X,
  AlarmClock,
  ClipboardList,
} from "lucide-react";
import { PunchInOutButton } from "@/components/hr/PunchInOutButton";

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
  const { user } = useAuth();
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const userRole = (user as any)?.role || 'sales_executive';
  const roleDisplayName = userRole.replace(/_/g, ' ').toUpperCase();

  const { data: dashboardData } = useQuery<DashboardData>({
    queryKey: ['/api/sales/dashboard'],
    enabled: !!user,
  });

  const { data: followUpData } = useQuery<{ overdueCount: number; todayCount: number }>({
    queryKey: ['/api/crm/follow-ups/today'],
    enabled: !!user,
    refetchInterval: 5 * 60 * 1000,
    select: (d: any) => ({ overdueCount: d?.overdueCount || 0, todayCount: d?.todayCount || 0 }),
  });

  const followUpBadge = (followUpData?.overdueCount || 0) + (followUpData?.todayCount || 0);

  const summary = dashboardData?.summary || {
    activeLeads: 0,
    pendingInquiries: 0,
    samplesInProgress: 0,
    pendingBids: 0,
  };

  const isActive = (path: string) => location === path;

  const sidebarSections = [
    {
      label: "MAIN",
      items: [
        { key: "/sales", label: "Overview", icon: Home },
      ],
    },
    {
      label: "SALES",
      items: [
        { key: "/sales/leads", label: "My Leads", icon: Target, badge: summary.activeLeads > 0 ? summary.activeLeads : undefined },
        { key: "/sales/my-companies", label: "My Companies", icon: Building2 },
        { key: "/sales/my-companies?tab=followups", label: "Follow-ups", icon: AlarmClock, badge: followUpBadge > 0 ? followUpBadge : undefined, badgeColor: (followUpData?.overdueCount || 0) > 0 ? "bg-red-500 text-white" : "bg-amber-500 text-white" },
        { key: "/sales/my-sales", label: "My Sales & Quotations", icon: FileText },
      ],
    },
    {
      label: "ACTIVITY",
      items: [
        { key: "/sales/my-activity-log", label: "My Activity Log", icon: ClipboardList },
      ],
    },
    {
      label: "QUALITY",
      items: [
        { key: "/sales/quality-requests", label: "Quality Requests", icon: ClipboardCheck },
      ],
    },
    {
      label: "HR",
      items: [
        { key: "/sales/my-attendance", label: "My Attendance", icon: Calendar },
      ],
    },
    {
      label: "SETTINGS",
      items: [
        { key: "/crm/email-settings", label: "Email Settings", icon: Mail },
      ],
    },
  ];

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`${sidebarOpen ? 'fixed inset-y-0 left-0 z-50 flex' : 'hidden'} md:flex w-64 bg-white dark:bg-gray-800 shadow-sm border-r border-gray-200 dark:border-gray-700 flex-col`}>
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            {(user as any)?.profileImageUrl ? (
              <img src={(user as any).profileImageUrl} alt="Profile" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                {(user as any)?.firstName ? (user as any).firstName[0].toUpperCase() : (user as any)?.email?.[0]?.toUpperCase() || 'U'}
              </div>
            )}
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-gray-900 dark:text-white truncate">
                {(user as any)?.firstName || (user as any)?.lastName
                  ? `${(user as any).firstName || ''} ${(user as any).lastName || ''}`.trim()
                  : (user as any)?.email || 'Sales Portal'}
              </h2>
              <p className="text-xs text-gray-600 dark:text-gray-400">{roleDisplayName}</p>
            </div>
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
            {sidebarSections.map((section) => (
              <div key={section.label}>
                <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  {section.label}
                </h3>
                <div className="space-y-1">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.key);
                    return (
                      <Link key={item.key} href={item.key}>
                        <button
                          onClick={() => setSidebarOpen(false)}
                          className={`w-full flex items-center px-4 py-2 text-sm rounded-lg transition-colors ${
                            active
                              ? "bg-blue-100 text-blue-900 border border-blue-200"
                              : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                          }`}
                        >
                          <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
                          <span className="truncate">{item.label}</span>
                          {(item as any).badge && (
                            <Badge className={`ml-auto ${(item as any).badgeColor || 'bg-blue-100 text-blue-800'}`}>{(item as any).badge}</Badge>
                          )}
                        </button>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
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
        <header className="sticky top-0 z-10 bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="px-4 md:px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              <button
                onClick={() => setSidebarOpen(true)}
                className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <Menu className="h-5 w-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">{title}</h1>
                {subtitle && <p className="text-sm text-gray-600 dark:text-gray-400">{subtitle}</p>}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <PunchInOutButton />
              <NotificationBell />
              <Badge variant="secondary" className="hidden md:inline-flex bg-blue-100 text-blue-800">
                {roleDisplayName}
              </Badge>
            </div>
          </div>
        </header>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
