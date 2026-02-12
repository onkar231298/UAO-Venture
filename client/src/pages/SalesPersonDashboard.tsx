import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { SalesLayout } from "@/components/layouts/SalesLayout";
import { MyActivityWidget } from "@/components/hr/MyActivityWidget";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { queryClient, apiRequest } from "@/lib/queryClient";
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
  Building2,
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
  Settings,
  Plus,
  AlertTriangle,
  RefreshCw
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

const companySchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  primaryEmail: z.string().email("Invalid email").optional().or(z.literal("")),
  primaryPhone: z.string().optional(),
  gstNumber: z.string().optional(),
  industryType: z.string().optional(),
  companySize: z.string().optional(),
  website: z.string().optional().or(z.literal("")),
  addressStreet: z.string().optional(),
  addressCity: z.string().optional(),
  addressState: z.string().optional(),
  addressCountry: z.string().optional(),
  addressZip: z.string().optional(),
});

export default function SalesPersonDashboard() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [selectedSample, setSelectedSample] = useState<any>(null);
  const [showSampleDialog, setShowSampleDialog] = useState(false);
  const [showLeadDialog, setShowLeadDialog] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [showCreateCompanyDialog, setShowCreateCompanyDialog] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState<any>(null);
  const [isCheckingDuplicates, setIsCheckingDuplicates] = useState(false);

  const companyForm = useForm<z.infer<typeof companySchema>>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      companyName: "",
      primaryEmail: "",
      primaryPhone: "",
      gstNumber: "",
      industryType: "",
      companySize: "",
      website: "",
      addressStreet: "",
      addressCity: "",
      addressState: "",
      addressCountry: "",
      addressZip: "",
    },
  });

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

  // Check for duplicates when company details change
  const checkForDuplicates = async (companyName: string, email?: string, phone?: string) => {
    if (!companyName || companyName.length < 3) {
      setDuplicateWarning(null);
      return;
    }
    
    setIsCheckingDuplicates(true);
    try {
      const response = await fetch('/api/check-duplicate-company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyName, email: email || undefined, phone: phone || undefined }),
      });
      
      if (response.ok) {
        const result = await response.json();
        setDuplicateWarning(result);
      }
    } catch (error) {
      console.error('Error checking for duplicates:', error);
    } finally {
      setIsCheckingDuplicates(false);
    }
  };

  // Debounce duplicate check
  useEffect(() => {
    const companyName = companyForm.watch('companyName');
    const email = companyForm.watch('primaryEmail');
    const phone = companyForm.watch('primaryPhone');
    
    if (!showCreateCompanyDialog) {
      setDuplicateWarning(null);
      return;
    }
    
    const timeoutId = setTimeout(() => {
      checkForDuplicates(companyName, email, phone);
    }, 500);
    
    return () => clearTimeout(timeoutId);
  }, [companyForm.watch('companyName'), companyForm.watch('primaryEmail'), companyForm.watch('primaryPhone'), showCreateCompanyDialog]);

  // Create company mutation
  const createCompanyMutation = useMutation({
    mutationFn: async (data: z.infer<typeof companySchema>) => {
      return await apiRequest("/api/crm/companies", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm/companies"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sales/my-companies"] });
      setShowCreateCompanyDialog(false);
      companyForm.reset();
      setDuplicateWarning(null);
      toast({
        title: "Success",
        description: "Company created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create company",
        variant: "destructive",
      });
    },
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
  
  // Admin and Super Admin should use Admin Dashboard, not Sales Dashboard
  const isAdminRole = userRole === 'admin' || userRole === 'super_admin';
  if (isAdminRole) {
    window.location.href = '/admin';
    return null;
  }
  
  // Only sales_executive and sales_manager should access this dashboard
  const isSalesRole = userRole === 'sales_executive' || userRole === 'sales_manager';

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
    <SalesLayout title="Overview" subtitle="Here's what's happening with your sales pipeline today.">
      {/* Tab Navigation for different sections */}
      <div className="mb-6 flex flex-wrap gap-2">
        <Button
          variant={activeTab === 'overview' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveTab('overview')}
        >
          <Home className="w-4 h-4 mr-2" />
          Dashboard
        </Button>
        <Button
          variant={activeTab === 'inquiries' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveTab('inquiries')}
        >
          <MessageSquare className="w-4 h-4 mr-2" />
          Inquiries
          {summary.pendingInquiries > 0 && (
            <Badge className="ml-2 bg-yellow-100 text-yellow-800">{summary.pendingInquiries}</Badge>
          )}
        </Button>
        <Button
          variant={activeTab === 'samples' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveTab('samples')}
        >
          <Package className="w-4 h-4 mr-2" />
          Samples
          {summary.samplesInProgress > 0 && (
            <Badge className="ml-2 bg-purple-100 text-purple-800">{summary.samplesInProgress}</Badge>
          )}
        </Button>
        <Button
          variant={activeTab === 'bids' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveTab('bids')}
        >
          <Briefcase className="w-4 h-4 mr-2" />
          High Volume Bids
          {summary.pendingBids > 0 && (
            <Badge className="ml-2 bg-orange-100 text-orange-800">{summary.pendingBids}</Badge>
          )}
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
          onClick={() => setShowCreateCompanyDialog(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Company
        </Button>
      </div>

          {activeTab === 'overview' && (
            <>
              {/* Activity Status Widget */}
              <div className="mb-6">
                <MyActivityWidget />
              </div>

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
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setSelectedSample(sample);
                              setShowSampleDialog(true);
                            }}
                            data-testid={`button-view-sample-${sample.id}`}
                          >
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

      {/* Lead Detail Dialog */}
      {selectedLead && (
        <LeadDetailDialog
          lead={selectedLead}
          open={showLeadDialog}
          onOpenChange={setShowLeadDialog}
        />
      )}

      {/* Sample Details Dialog */}
      <Dialog open={showSampleDialog} onOpenChange={setShowSampleDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Sample Request Details</DialogTitle>
            <DialogDescription>
              Request ID: {selectedSample?.requestId || `Sample #${selectedSample?.id}`}
            </DialogDescription>
          </DialogHeader>
          {selectedSample && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="font-semibold">Status:</span>
                {getStatusBadge(selectedSample.status || 'pending')}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Customer Name</p>
                  <p className="font-medium">{selectedSample.customerName || selectedSample.contactName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Company</p>
                  <p className="font-medium">{selectedSample.companyName || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{selectedSample.emailAddress || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="font-medium">{selectedSample.phoneNumber || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Sample Size</p>
                  <p className="font-medium">{selectedSample.sampleSize || '25g'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Purpose</p>
                  <p className="font-medium">{selectedSample.purpose || 'N/A'}</p>
                </div>
                {selectedSample.expectedOrderQuantity && (
                  <div className="col-span-2">
                    <p className="text-sm text-gray-500">Expected Order Quantity</p>
                    <p className="font-medium">{selectedSample.expectedOrderQuantity}</p>
                  </div>
                )}
              </div>

              {selectedSample.message && (
                <div>
                  <p className="text-sm text-gray-500">Message</p>
                  <p className="mt-1 p-3 bg-gray-50 rounded text-sm">{selectedSample.message}</p>
                </div>
              )}

              {selectedSample.shippingAddress && (
                <div>
                  <p className="text-sm text-gray-500 font-semibold">Shipping Address</p>
                  <div className="mt-2 p-3 bg-gray-50 rounded">
                    <p>{selectedSample.shippingAddress}</p>
                    {selectedSample.city && (
                      <p>{selectedSample.city}, {selectedSample.state} {selectedSample.postalCode}</p>
                    )}
                    {selectedSample.country && <p>{selectedSample.country}</p>}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Created</p>
                  <p className="font-medium">
                    {selectedSample.createdAt && format(new Date(selectedSample.createdAt), "PPpp")}
                  </p>
                </div>
                {selectedSample.updatedAt && (
                  <div>
                    <p className="text-sm text-gray-500">Last Updated</p>
                    <p className="font-medium">
                      {format(new Date(selectedSample.updatedAt), "PPpp")}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
          <div className="flex justify-end pt-4">
            <Button variant="outline" onClick={() => setShowSampleDialog(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Company Dialog */}
      <Dialog open={showCreateCompanyDialog} onOpenChange={setShowCreateCompanyDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Company</DialogTitle>
            <DialogDescription>
              Add a new company to the CRM system
            </DialogDescription>
          </DialogHeader>

          <Form {...companyForm}>
            <form onSubmit={companyForm.handleSubmit((data) => createCompanyMutation.mutate(data))} className="space-y-4">
              {duplicateWarning && duplicateWarning.hasPotentialDuplicates && (
                <div 
                  className={`p-4 rounded-lg border ${
                    duplicateWarning.highestConfidence >= 80 
                      ? 'bg-red-50 border-red-200 text-red-800' 
                      : duplicateWarning.highestConfidence >= 60 
                        ? 'bg-amber-50 border-amber-200 text-amber-800'
                        : 'bg-blue-50 border-blue-200 text-blue-800'
                  }`}
                  data-testid="alert-duplicate-warning"
                >
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <h4 className="font-medium">
                        {duplicateWarning.highestConfidence >= 80 
                          ? 'Possible Duplicate Detected!' 
                          : 'Similar Companies Found'}
                      </h4>
                      <p className="text-sm mt-1">
                        {duplicateWarning.highestConfidence >= 80 
                          ? 'This company may already exist in the system. Please review before creating.'
                          : 'Similar companies exist. You may want to verify this is a new company.'}
                      </p>
                      <div className="mt-2 space-y-2">
                        {duplicateWarning.matches?.slice(0, 3).map((match: any) => (
                          <div 
                            key={match.companyId} 
                            className="text-sm"
                          >
                            <div className="flex items-center gap-2">
                              <Building2 className="h-3 w-3" />
                              <span className="font-medium">{match.companyName}</span>
                              <Badge variant="outline" className="text-xs">
                                {match.confidence}% match
                              </Badge>
                            </div>
                            <div className="ml-5 text-xs mt-0.5">
                              {match.assignedToUserName ? (
                                <span className="text-amber-700 dark:text-amber-400 font-medium">
                                  Assigned to: {match.assignedToUserName}
                                </span>
                              ) : (
                                <span className="text-gray-500 italic">
                                  Unassigned
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <FormField
                control={companyForm.control}
                name="companyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Name *</FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Input placeholder="Enter company name" {...field} data-testid="input-company-name" />
                      </FormControl>
                      {isCheckingDuplicates && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={companyForm.control}
                  name="primaryEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Primary Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="email@company.com" {...field} data-testid="input-primary-email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={companyForm.control}
                  name="primaryPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Primary Phone Number</FormLabel>
                      <FormControl>
                        <Input placeholder="+1-xxx-xxx-xxxx" {...field} data-testid="input-primary-phone" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={companyForm.control}
                  name="gstNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>GST Number</FormLabel>
                      <FormControl>
                        <Input placeholder="GST number" {...field} data-testid="input-gst-number" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={companyForm.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website</FormLabel>
                      <FormControl>
                        <Input placeholder="https://example.com" {...field} data-testid="input-website" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={companyForm.control}
                  name="industryType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Industry Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-industry-type">
                            <SelectValue placeholder="Select industry" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="food">Food & Beverage</SelectItem>
                          <SelectItem value="pharma">Pharmaceuticals</SelectItem>
                          <SelectItem value="cosmetics">Cosmetics & Personal Care</SelectItem>
                          <SelectItem value="nutraceuticals">Nutraceuticals</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={companyForm.control}
                  name="companySize"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Size</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-company-size">
                            <SelectValue placeholder="Select size" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="1-10">1-10 employees</SelectItem>
                          <SelectItem value="11-50">11-50 employees</SelectItem>
                          <SelectItem value="51-200">51-200 employees</SelectItem>
                          <SelectItem value="201-500">201-500 employees</SelectItem>
                          <SelectItem value="500+">500+ employees</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Address Information</h4>
                <div className="space-y-3">
                  <FormField
                    control={companyForm.control}
                    name="addressStreet"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Street Address</FormLabel>
                        <FormControl>
                          <Input placeholder="Street address" {...field} data-testid="input-address-street" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={companyForm.control}
                      name="addressCity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City</FormLabel>
                          <FormControl>
                            <Input placeholder="City" {...field} data-testid="input-address-city" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={companyForm.control}
                      name="addressState"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>State</FormLabel>
                          <FormControl>
                            <Input placeholder="State" {...field} data-testid="input-address-state" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={companyForm.control}
                      name="addressCountry"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Country</FormLabel>
                          <FormControl>
                            <Input placeholder="Country" {...field} data-testid="input-address-country" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={companyForm.control}
                      name="addressZip"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ZIP Code</FormLabel>
                          <FormControl>
                            <Input placeholder="ZIP code" {...field} data-testid="input-address-zip" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>

              <DialogFooter className="pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setShowCreateCompanyDialog(false);
                    companyForm.reset();
                    setDuplicateWarning(null);
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createCompanyMutation.isPending}
                  data-testid="button-create-company-submit"
                >
                  {createCompanyMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Company'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </SalesLayout>
  );
}
