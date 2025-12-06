import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Users,
  Package,
  TrendingUp,
  DollarSign,
  MessageSquare,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  Eye,
  Send,
  Phone,
  Mail,
  Building,
  Target,
  Award,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Calendar,
  User,
  ChevronRight,
  LogOut,
  Home,
  Briefcase,
  ClipboardList,
  Truck,
  Settings
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import LeadDetailDialog from "@/components/LeadDetailDialog";
import { NotificationBell } from "@/components/NotificationBell";

interface DashboardData {
  summary: {
    activeLeads: number;
    pendingInquiries: number;
    samplesInProgress: number;
    pendingBids: number;
    quotationsSent: number;
  };
  performance: {
    dealsWon: number;
    dealsLost: number;
    conversionRate: number;
    totalDealValue: number;
    totalLeads: number;
  };
  user: {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
  };
}

export default function SalesPersonDashboard() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [showLeadDialog, setShowLeadDialog] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  const { data: dashboardData, isLoading: dashboardLoading } = useQuery<DashboardData>({
    queryKey: ['/api/sales/dashboard'],
    enabled: isAuthenticated && !!user,
  });

  const { data: leadsData, isLoading: leadsLoading } = useQuery<{ leads: any[]; total: number }>({
    queryKey: ['/api/sales/my-leads'],
    enabled: isAuthenticated && !!user,
  });

  const { data: inquiriesData, isLoading: inquiriesLoading } = useQuery<{ inquiries: any[]; total: number }>({
    queryKey: ['/api/sales/my-inquiries'],
    enabled: isAuthenticated && !!user,
  });

  const { data: samplesData, isLoading: samplesLoading } = useQuery<{ requests: any[]; total: number }>({
    queryKey: ['/api/sales/my-samples'],
    enabled: isAuthenticated && !!user,
  });

  const { data: bidsData, isLoading: bidsLoading } = useQuery<{ bids: any[]; total: number }>({
    queryKey: ['/api/sales/my-bids'],
    enabled: isAuthenticated && !!user,
  });

  if (isLoading || dashboardLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-green-600" />
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-96">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>Please login to access the sales dashboard.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.href = '/api/login'} className="w-full">
              Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const userRole = (user as any).role || '';
  const isSalesRole = userRole.includes('sales') || userRole.includes('admin');

  if (!isSalesRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-96">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>You don't have permission to access this dashboard.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.href = '/'} className="w-full">
              Go to Homepage
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const summary = dashboardData?.summary || {
    activeLeads: 0,
    pendingInquiries: 0,
    samplesInProgress: 0,
    pendingBids: 0,
    quotationsSent: 0,
  };

  const performance = dashboardData?.performance || {
    dealsWon: 0,
    dealsLost: 0,
    conversionRate: 0,
    totalDealValue: 0,
    totalLeads: 0,
  };

  const leads = leadsData?.leads || [];
  const inquiries = inquiriesData?.inquiries || [];
  const samples = samplesData?.requests || [];
  const bids = bidsData?.bids || [];

  const getStatusBadge = (status: string) => {
    const statusMap: { [key: string]: { color: string; label: string } } = {
      pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
      active: { color: 'bg-blue-100 text-blue-800', label: 'Active' },
      completed: { color: 'bg-green-100 text-green-800', label: 'Completed' },
      cancelled: { color: 'bg-red-100 text-red-800', label: 'Cancelled' },
      new: { color: 'bg-purple-100 text-purple-800', label: 'New' },
      contacted: { color: 'bg-indigo-100 text-indigo-800', label: 'Contacted' },
      qualified: { color: 'bg-cyan-100 text-cyan-800', label: 'Qualified' },
      proposal: { color: 'bg-orange-100 text-orange-800', label: 'Proposal' },
      negotiation: { color: 'bg-amber-100 text-amber-800', label: 'Negotiation' },
      won: { color: 'bg-emerald-100 text-emerald-800', label: 'Won' },
      lost: { color: 'bg-red-100 text-red-800', label: 'Lost' },
    };
    const s = statusMap[status] || { color: 'bg-gray-100 text-gray-800', label: status };
    return <Badge className={s.color}>{s.label}</Badge>;
  };

  const getBidStatusBadge = (status: string) => {
    const statusMap: { [key: string]: { color: string; label: string } } = {
      submitted: { color: 'bg-blue-100 text-blue-800', label: 'Submitted' },
      manager_approval: { color: 'bg-yellow-100 text-yellow-800', label: 'Awaiting Approval' },
      sales_discussion: { color: 'bg-purple-100 text-purple-800', label: 'In Discussion' },
      quotation_sent: { color: 'bg-orange-100 text-orange-800', label: 'Quote Sent' },
      completed: { color: 'bg-green-100 text-green-800', label: 'Completed' },
    };
    const s = statusMap[status] || { color: 'bg-gray-100 text-gray-800', label: status };
    return <Badge className={s.color}>{s.label}</Badge>;
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-sm border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Sales Dashboard</h2>
          <p className="text-sm text-gray-600 capitalize">{userRole.replace('_', ' ')}</p>
        </div>

        <nav className="flex-1 p-4">
          <div className="space-y-1">
            <Button
              variant={activeTab === 'overview' ? 'secondary' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setActiveTab('overview')}
              data-testid="nav-overview"
            >
              <Home className="w-4 h-4 mr-3" />
              Overview
            </Button>
            <Link href="/sales/leads">
              <Button
                variant="ghost"
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
            <Button
              variant={activeTab === 'inquiries' ? 'secondary' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setActiveTab('inquiries')}
              data-testid="nav-inquiries"
            >
              <MessageSquare className="w-4 h-4 mr-3" />
              My Inquiries
              {summary.pendingInquiries > 0 && (
                <Badge className="ml-auto bg-yellow-100 text-yellow-800">{summary.pendingInquiries}</Badge>
              )}
            </Button>
            <Button
              variant={activeTab === 'samples' ? 'secondary' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setActiveTab('samples')}
              data-testid="nav-samples"
            >
              <Package className="w-4 h-4 mr-3" />
              My Samples
              {summary.samplesInProgress > 0 && (
                <Badge className="ml-auto bg-purple-100 text-purple-800">{summary.samplesInProgress}</Badge>
              )}
            </Button>
            <Button
              variant={activeTab === 'bids' ? 'secondary' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setActiveTab('bids')}
              data-testid="nav-bids"
            >
              <Briefcase className="w-4 h-4 mr-3" />
              My High Volume Bids
              {summary.pendingBids > 0 && (
                <Badge className="ml-auto bg-orange-100 text-orange-800">{summary.pendingBids}</Badge>
              )}
            </Button>
          </div>
          
          <div className="mt-6 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-2 px-3">Settings</p>
            <Link href="/crm/email-settings">
              <Button
                variant="ghost"
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
            <div>
              <p className="font-medium text-sm">{dashboardData?.user?.firstName} {dashboardData?.user?.lastName}</p>
              <p className="text-xs text-gray-500 capitalize">{userRole.replace('_', ' ')}</p>
            </div>
          </div>
          <Button variant="outline" className="w-full" onClick={() => window.location.href = '/api/logout'}>
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-6">
          {/* Header */}
          <div className="mb-6 flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome back, {dashboardData?.user?.firstName || 'Sales Rep'}!
              </h1>
              <p className="text-gray-600">Here's what's happening with your sales pipeline today.</p>
            </div>
            <NotificationBell />
          </div>

          {activeTab === 'overview' && (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                <Link href="/sales/leads">
                  <Card className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-500">Active Leads</p>
                          <p className="text-2xl font-bold text-blue-600">{summary.activeLeads}</p>
                        </div>
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Target className="w-6 h-6 text-blue-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>

                <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('inquiries')}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">Pending Inquiries</p>
                        <p className="text-2xl font-bold text-yellow-600">{summary.pendingInquiries}</p>
                      </div>
                      <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                        <MessageSquare className="w-6 h-6 text-yellow-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('samples')}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">Samples In Progress</p>
                        <p className="text-2xl font-bold text-purple-600">{summary.samplesInProgress}</p>
                      </div>
                      <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Package className="w-6 h-6 text-purple-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('bids')}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">Pending Bids</p>
                        <p className="text-2xl font-bold text-orange-600">{summary.pendingBids}</p>
                      </div>
                      <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                        <Briefcase className="w-6 h-6 text-orange-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('bids')}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">Quotes Awaiting</p>
                        <p className="text-2xl font-bold text-pink-600">{summary.quotationsSent}</p>
                      </div>
                      <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center">
                        <Clock className="w-6 h-6 text-pink-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Performance Metrics */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5" />
                      Performance Overview
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="flex items-center justify-center gap-1 text-green-600 mb-1">
                          <ArrowUpRight className="w-4 h-4" />
                          <span className="text-2xl font-bold">{performance.dealsWon}</span>
                        </div>
                        <p className="text-sm text-gray-600">Deals Won</p>
                      </div>
                      <div className="text-center p-4 bg-red-50 rounded-lg">
                        <div className="flex items-center justify-center gap-1 text-red-600 mb-1">
                          <ArrowDownRight className="w-4 h-4" />
                          <span className="text-2xl font-bold">{performance.dealsLost}</span>
                        </div>
                        <p className="text-sm text-gray-600">Deals Lost</p>
                      </div>
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="flex items-center justify-center gap-1 text-blue-600 mb-1">
                          <Award className="w-4 h-4" />
                          <span className="text-2xl font-bold">{performance.conversionRate}%</span>
                        </div>
                        <p className="text-sm text-gray-600">Conversion Rate</p>
                      </div>
                      <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <div className="flex items-center justify-center gap-1 text-purple-600 mb-1">
                          <DollarSign className="w-4 h-4" />
                          <span className="text-2xl font-bold">${(performance.totalDealValue / 1000).toFixed(1)}k</span>
                        </div>
                        <p className="text-sm text-gray-600">Total Value</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="w-5 h-5" />
                      Quick Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Link href="/sales/leads">
                      <Button className="w-full justify-start" variant="outline">
                        <Target className="w-4 h-4 mr-2" />
                        View All Leads
                      </Button>
                    </Link>
                    <Button className="w-full justify-start" variant="outline" onClick={() => setActiveTab('bids')}>
                      <Briefcase className="w-4 h-4 mr-2" />
                      Manage Bids
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Items */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Leads */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-lg">Recent Leads</CardTitle>
                    <Link href="/sales/leads">
                      <Button variant="ghost" size="sm">
                        View All <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </Link>
                  </CardHeader>
                  <CardContent>
                    {leadsLoading ? (
                      <div className="flex justify-center py-4">
                        <Loader2 className="w-6 h-6 animate-spin" />
                      </div>
                    ) : leads.length === 0 ? (
                      <p className="text-center text-gray-500 py-4">No leads assigned yet</p>
                    ) : (
                      <div className="space-y-3">
                        {leads.slice(0, 5).map((lead: any) => (
                          <div
                            key={lead.id}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
                            onClick={() => {
                              setSelectedLead(lead);
                              setShowLeadDialog(true);
                            }}
                            data-testid={`lead-item-${lead.id}`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                <User className="w-5 h-5 text-blue-600" />
                              </div>
                              <div>
                                <p className="font-medium">{lead.company?.companyName || 'Unknown Company'}</p>
                                <p className="text-sm text-gray-500">{lead.contactPerson?.contactName || 'No contact'}</p>
                              </div>
                            </div>
                            {getStatusBadge(lead.stage || lead.status)}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Recent Bids */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-lg">Recent High Volume Bids</CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => setActiveTab('bids')}>
                      View All <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {bidsLoading ? (
                      <div className="flex justify-center py-4">
                        <Loader2 className="w-6 h-6 animate-spin" />
                      </div>
                    ) : bids.length === 0 ? (
                      <p className="text-center text-gray-500 py-4">No bids assigned yet</p>
                    ) : (
                      <div className="space-y-3">
                        {bids.slice(0, 5).map((bid: any) => (
                          <div
                            key={bid.id}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                            data-testid={`bid-item-${bid.id}`}
                          >
                            <div>
                              <p className="font-medium">{bid.customerName || 'Unknown Customer'}</p>
                              <p className="text-sm text-gray-500">
                                {bid.estimatedValue ? `$${parseFloat(bid.estimatedValue).toLocaleString()}` : 'No value set'}
                              </p>
                            </div>
                            {getBidStatusBadge(bid.bidProgressStatus || 'submitted')}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          )}

          {/* Inquiries Tab */}
          {activeTab === 'inquiries' && (
            <Card>
              <CardHeader>
                <CardTitle>My Assigned Inquiries</CardTitle>
                <CardDescription>Product inquiries assigned to you</CardDescription>
              </CardHeader>
              <CardContent>
                {inquiriesLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin" />
                  </div>
                ) : inquiries.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No inquiries assigned to you</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {inquiries.map((inquiry: any) => (
                      <div
                        key={inquiry.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                        data-testid={`inquiry-row-${inquiry.id}`}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                            <MessageSquare className="w-6 h-6 text-yellow-600" />
                          </div>
                          <div>
                            <p className="font-semibold">{inquiry.customerName || 'Unknown Customer'}</p>
                            <p className="text-sm text-gray-500">{inquiry.productName || 'Product inquiry'}</p>
                            <p className="text-xs text-gray-400">
                              {inquiry.createdAt && formatDistanceToNow(new Date(inquiry.createdAt), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {getStatusBadge(inquiry.status || 'pending')}
                          <Button variant="outline" size="sm" onClick={() => window.location.href = `/admin/inquiries/${inquiry.id}`}>
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Samples Tab */}
          {activeTab === 'samples' && (
            <Card>
              <CardHeader>
                <CardTitle>My Sample Requests</CardTitle>
                <CardDescription>Sample requests assigned to you for processing</CardDescription>
              </CardHeader>
              <CardContent>
                {samplesLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin" />
                  </div>
                ) : samples.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No sample requests assigned to you</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {samples.map((sample: any) => (
                      <div
                        key={sample.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                        data-testid={`sample-row-${sample.id}`}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                            <Package className="w-6 h-6 text-purple-600" />
                          </div>
                          <div>
                            <p className="font-semibold">{sample.requestId || `Sample #${sample.id}`}</p>
                            <p className="text-sm text-gray-500">{sample.customerName || 'Unknown Customer'}</p>
                            <p className="text-xs text-gray-400">
                              {sample.createdAt && formatDistanceToNow(new Date(sample.createdAt), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {getStatusBadge(sample.status || 'pending')}
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Bids Tab */}
          {activeTab === 'bids' && (
            <Card>
              <CardHeader>
                <CardTitle>My High Volume Bids</CardTitle>
                <CardDescription>High volume bids requiring your attention</CardDescription>
              </CardHeader>
              <CardContent>
                {bidsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin" />
                  </div>
                ) : bids.length === 0 ? (
                  <div className="text-center py-8">
                    <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No high volume bids assigned to you</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {bids.map((bid: any) => (
                      <div
                        key={bid.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                        data-testid={`bid-row-${bid.id}`}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                            <Briefcase className="w-6 h-6 text-orange-600" />
                          </div>
                          <div>
                            <p className="font-semibold">{bid.customerName || 'Unknown Customer'}</p>
                            <p className="text-sm text-gray-500">{bid.companyName || 'No company'}</p>
                            {bid.estimatedValue && (
                              <p className="text-sm text-green-600 font-medium">
                                Value: ${parseFloat(bid.estimatedValue).toLocaleString()}
                              </p>
                            )}
                            <p className="text-xs text-gray-400">
                              {bid.createdAt && formatDistanceToNow(new Date(bid.createdAt), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {getBidStatusBadge(bid.bidProgressStatus || 'submitted')}
                          <Button variant="outline" size="sm" onClick={() => window.location.href = '/admin/crm/leads'}>
                            <Eye className="w-4 h-4 mr-1" />
                            Manage
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      {/* Lead Detail Dialog */}
      {selectedLead && (
        <LeadDetailDialog
          lead={selectedLead}
          open={showLeadDialog}
          onOpenChange={setShowLeadDialog}
        />
      )}
    </div>
  );
}
