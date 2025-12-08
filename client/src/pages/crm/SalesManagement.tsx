import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import RoleBasedRoute from "@/components/RoleBasedRoute";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Search, MessageSquare, TrendingUp, Users, Package, Plus, Eye, FileText, Mail, Phone, Clock, User, Building, MapPin, UserPlus, CheckCircle2, RefreshCw, XCircle, Send } from "lucide-react";
import { type Inquiry } from "@shared/schema";
import QuotationForm from "@/components/QuotationForm";
import InquiryDetailsDialog from "@/components/InquiryDetailsDialog";

import LeadManagement from "./LeadManagement";
import CompanyManagement from "./CompanyManagement";
import DuplicateReview from "./DuplicateReview";

export default function SalesManagement({ activeSubSection }: { activeSubSection?: string } = {}) {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State management - ALL hooks must be called before any returns
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [urgencyFilter, setUrgencyFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [showInquiryDetails, setShowInquiryDetails] = useState(false);
  const [convertDialogOpen, setConvertDialogOpen] = useState(false);
  const [inquiryToConvert, setInquiryToConvert] = useState<Inquiry | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Data fetching
  const { data: inquiries, isLoading: inquiriesLoading } = useQuery({
    queryKey: ['/api/inquiries'],
    enabled: !authLoading && !!user && activeSubSection !== 'sales-crm' && activeSubSection !== 'company-management'
  });

  const { data: quotations } = useQuery({
    queryKey: ['/api/quotations'],
    enabled: !authLoading && !!user && activeSubSection !== 'sales-crm' && activeSubSection !== 'company-management'
  });

  const { data: sampleRequests } = useQuery({
    queryKey: ['/api/sample-requests'],
    enabled: !authLoading && !!user && activeSubSection !== 'sales-crm' && activeSubSection !== 'company-management'
  });

  // Mutations
  const createQuotationMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/quotations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create quotation');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Quotation created successfully"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/quotations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/inquiries'] });
    },
    onError: (error: Error) => {
      if (error.message === 'UNAUTHORIZED') {
        return;
      }
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const convertToLeadMutation = useMutation({
    mutationFn: async ({ inquiryId, notes }: { inquiryId: number; notes?: string }) => {
      const response = await fetch(`/api/admin/inquiries/${inquiryId}/convert-to-lead`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notes }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to convert inquiry to lead');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: "Inquiry successfully converted to CRM lead"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/inquiries'] });
      queryClient.invalidateQueries({ queryKey: ['/api/leads'] });
      setConvertDialogOpen(false);
      setInquiryToConvert(null);
    },
    onError: (error: Error) => {
      if (error.message === 'UNAUTHORIZED') {
        return;
      }
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Auto-refresh inquiries every 5 minutes
  useEffect(() => {
    const intervalId = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ['/api/inquiries'] });
    }, 300000);

    return () => clearInterval(intervalId);
  }, [queryClient]);

  // Manual refresh function
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['/api/inquiries'] });
    toast({
      title: "Refreshed",
      description: "Inquiries data has been updated"
    });
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  // Filter product enquiries (excluding high volume bids)
  const filteredProductEnquiries = React.useMemo(() => {
    if (!(inquiries as any)?.inquiries) return [];
    
    let filtered = (inquiries as any).inquiries.filter((inquiry: Inquiry) => {
      // Exclude high volume bids - only show regular product enquiries
      if (inquiry.inquiryType === 'high_volume_bid') return false;

      // Search filter
      const searchMatch = searchTerm === "" || 
        inquiry.contactName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inquiry.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inquiry.inquiryId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (inquiry as any).productName?.toLowerCase().includes(searchTerm.toLowerCase());

      // Status filter
      const statusMatch = statusFilter === "all" || inquiry.status === statusFilter;

      // Urgency filter
      const urgencyMatch = urgencyFilter === "all" || inquiry.urgency === urgencyFilter;

      // Date filter
      let dateMatch = true;
      if (dateFilter !== "all" && inquiry.createdAt) {
        const inquiryDate = new Date(inquiry.createdAt);
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        switch (dateFilter) {
          case "today":
            dateMatch = inquiryDate >= today;
            break;
          case "yesterday":
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            dateMatch = inquiryDate >= yesterday && inquiryDate < today;
            break;
          case "week":
            const weekStart = new Date(today);
            weekStart.setDate(weekStart.getDate() - weekStart.getDay());
            dateMatch = inquiryDate >= weekStart;
            break;
          case "month":
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
            dateMatch = inquiryDate >= monthStart;
            break;
          case "quarter":
            const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
            dateMatch = inquiryDate >= quarterStart;
            break;
        }
      }

      return searchMatch && statusMatch && urgencyMatch && dateMatch;
    });

    // Sort inquiries
    filtered.sort((a: Inquiry, b: Inquiry) => {
      switch (sortBy) {
        case "oldest":
          return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
        case "high_value":
          const aQty = parseFloat(a.quantity || "0");
          const bQty = parseFloat(b.quantity || "0");
          return bQty - aQty;
        case "urgency":
          const urgencyOrder = { urgent: 3, normal: 2, low: 1 };
          return (urgencyOrder[b.urgency as keyof typeof urgencyOrder] || 0) - 
                 (urgencyOrder[a.urgency as keyof typeof urgencyOrder] || 0);
        case "company":
          return (a.companyName || "").localeCompare(b.companyName || "");
        case "newest":
        default:
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      }
    });

    return filtered;
  }, [inquiries, searchTerm, statusFilter, dateFilter, urgencyFilter, sortBy]);

  // Status badge helper function
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'responded':
        return <Badge className="bg-blue-100 text-blue-800">Responded</Badge>;
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case 'closed':
        return <Badge className="bg-red-100 text-red-800">Closed</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>;
    }
  };

  if (authLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  // Route to Lead Management
  if (activeSubSection === 'sales-crm') {
    return (
      <RoleBasedRoute allowedRoles={['admin', 'super_admin', 'sales_manager', 'sales_executive']}>
        <LeadManagement />
      </RoleBasedRoute>
    );
  }
  
  // Route to Company Management
  if (activeSubSection === 'company-management') {
    return (
      <RoleBasedRoute allowedRoles={['admin', 'super_admin', 'sales_manager', 'sales_executive']}>
        <CompanyManagement />
      </RoleBasedRoute>
    );
  }
  
  // Route to Duplicate Review
  if (activeSubSection === 'duplicate-review') {
    return (
      <RoleBasedRoute allowedRoles={['admin', 'super_admin', 'sales_manager']}>
        <DuplicateReview />
      </RoleBasedRoute>
    );
  }

  return (
    <RoleBasedRoute allowedRoles={['admin', 'super_admin', 'sales_manager', 'sales_executive']}>
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Sales Management</h1>
            <p className="text-gray-600">Manage customer inquiries, quotations, and sales pipeline</p>
          </div>

          {/* Dashboard Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Inquiries</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{(inquiries as any)?.total || 0}</div>
                <p className="text-xs text-muted-foreground">Active customer inquiries</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Quotes</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{(quotations as any)?.total || 0}</div>
                <p className="text-xs text-muted-foreground">Awaiting customer response</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Sample Requests</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{(sampleRequests as any)?.total || 0}</div>
                <p className="text-xs text-muted-foreground">Product sample requests</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">12.5%</div>
                <p className="text-xs text-muted-foreground">Inquiry to order conversion</p>
              </CardContent>
            </Card>
          </div>



          {/* Product Enquiry Section */}
          <div className="w-full mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <span>Product Enquiry</span>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        data-testid="button-refresh-inquiries"
                        className="min-h-[44px]"
                      >
                        <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                        Refresh
                      </Button>
                      <Button size="sm" className="min-h-[44px]">
                        <Plus className="w-4 h-4 mr-2" />
                        New Enquiry
                      </Button>
                    </div>
                  </CardTitle>
                  <CardDescription>Regular product enquiries and quote requests</CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Product Enquiry Filters */}
                  <div className="flex flex-col gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                    <div className="w-full">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          placeholder="Search inquiries by customer, company, or product..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 bg-white min-h-[44px]"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-full sm:w-32 min-h-[44px]">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="responded">Responded</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={dateFilter} onValueChange={setDateFilter}>
                        <SelectTrigger className="w-full sm:w-32 min-h-[44px]">
                          <SelectValue placeholder="Date" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Time</SelectItem>
                          <SelectItem value="today">Today</SelectItem>
                          <SelectItem value="week">This Week</SelectItem>
                          <SelectItem value="month">This Month</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
                        <SelectTrigger className="w-full sm:w-32 min-h-[44px]">
                          <SelectValue placeholder="Urgency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                          <SelectItem value="normal">Normal</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                {inquiriesLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="animate-pulse bg-gray-100 h-16 rounded"></div>
                    ))}
                  </div>
                ) : filteredProductEnquiries?.length ? (
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-600">
                        Showing {filteredProductEnquiries.length} product enquiries
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {statusFilter !== "all" && (
                          <Badge variant="outline" className="text-xs">
                            Status: {statusFilter}
                          </Badge>
                        )}
                        {dateFilter !== "all" && (
                          <Badge variant="outline" className="text-xs">
                            Date: {dateFilter}
                          </Badge>
                        )}
                        {urgencyFilter !== "all" && (
                          <Badge variant="outline" className="text-xs">
                            Urgency: {urgencyFilter}
                          </Badge>
                        )}
                      </div>
                    </div>
                    {filteredProductEnquiries.map((inquiry: Inquiry & { productName?: string; latestQuotationStatus?: string | null }) => (
                      <div key={inquiry.id} className="border rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex flex-col gap-3 mb-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-medium">INQ-{inquiry.id}</span>
                            {getStatusBadge(inquiry.status || 'pending')}
                            <Badge variant="outline" className={
                              inquiry.urgency === 'urgent' ? 'border-red-500 text-red-700' :
                              inquiry.urgency === 'normal' ? 'border-yellow-500 text-yellow-700' :
                              'border-gray-500 text-gray-700'
                            }>
                              {inquiry.urgency}
                            </Badge>
                            {inquiry.crmLeadId && (
                              <Badge className="bg-green-100 text-green-800 border-green-300">
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                Converted to Lead
                              </Badge>
                            )}
                            {/* Quotation Status Badges */}
                            {inquiry.latestQuotationStatus === 'accepted' && (
                              <Badge className="bg-green-100 text-green-800 border-2 border-green-300">
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                Quote Accepted
                              </Badge>
                            )}
                            {inquiry.latestQuotationStatus === 'rejected' && (
                              <Badge className="bg-red-100 text-red-800 border-2 border-red-300">
                                <XCircle className="w-3 h-3 mr-1" />
                                Quote Rejected
                              </Badge>
                            )}
                            {inquiry.latestQuotationStatus === 'sent' && (
                              <Badge className="bg-blue-100 text-blue-800 border-2 border-blue-300">
                                <Send className="w-3 h-3 mr-1" />
                                Quote Sent
                              </Badge>
                            )}
                          </div>
                          <div className="flex flex-col sm:flex-row gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                setSelectedInquiry(inquiry);
                                setShowInquiryDetails(true);
                              }}
                              data-testid={`button-view-inquiry-${inquiry.id}`}
                              className="min-h-[44px] w-full sm:w-auto"
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </Button>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button size="sm" data-testid={`button-create-quote-${inquiry.id}`} className="min-h-[44px] w-full sm:w-auto">
                                  <FileText className="w-4 h-4 mr-1" />
                                  Create Quote
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle>Create Quotation for INQ-{inquiry.id}</DialogTitle>
                                </DialogHeader>
                                <div className="max-h-[75vh] overflow-y-auto pr-2">
                                  <QuotationForm 
                                    inquiry={inquiry} 
                                    onSubmit={(data: any) => createQuotationMutation.mutate(data)}
                                    isLoading={createQuotationMutation.isPending}
                                  />
                                </div>
                              </DialogContent>
                            </Dialog>
                            {!inquiry.crmLeadId && (
                              <Button 
                                variant="default"
                                size="sm"
                                onClick={() => {
                                  setInquiryToConvert(inquiry);
                                  setConvertDialogOpen(true);
                                }}
                                disabled={convertToLeadMutation.isPending}
                                data-testid={`button-convert-lead-${inquiry.id}`}
                                className="min-h-[44px] w-full sm:w-auto"
                              >
                                <UserPlus className="w-4 h-4 mr-1" />
                                Convert to Lead
                              </Button>
                            )}
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Customer:</span>
                            <p className="font-medium">{inquiry.contactName}</p>
                          </div>
                          <div>
                            <span className="text-gray-600">Product:</span>
                            <p className="font-medium">{(inquiry as any).productName}</p>
                          </div>
                          <div>
                            <span className="text-gray-600">Quantity:</span>
                            <p className="font-medium">{inquiry.quantity} {inquiry.unit}</p>
                          </div>
                        </div>
                        {inquiry.message && (
                          <div className="mt-2">
                            <span className="text-gray-600 text-sm">Message:</span>
                            <p className="text-sm mt-1">{inquiry.message}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No inquiries found</h3>
                    <p className="text-gray-600">New customer inquiries will appear here</p>
                  </div>
                )}
                </CardContent>
              </Card>
          </div>
        </div>
      </div>

      {/* Inquiry Details Dialog */}
      {selectedInquiry && (
        <InquiryDetailsDialog
          inquiry={selectedInquiry}
          open={showInquiryDetails}
          onOpenChange={setShowInquiryDetails}
          onConvertToLead={(inquiry) => {
            setInquiryToConvert(inquiry);
            setConvertDialogOpen(true);
          }}
          isConvertingToLead={convertToLeadMutation.isPending}
        />
      )}

      {/* Convert to Lead Confirmation Dialog */}
      <AlertDialog open={convertDialogOpen} onOpenChange={setConvertDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Convert Inquiry to CRM Lead?</AlertDialogTitle>
            <AlertDialogDescription>
              This will convert inquiry <strong>INQ-{inquiryToConvert?.id}</strong> from <strong>{inquiryToConvert?.contactName}</strong> into a CRM lead.
              <br /><br />
              A company and contact record will be created if they don't already exist, and the lead will be assigned to you for follow-up.
              <br /><br />
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={convertToLeadMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (inquiryToConvert) {
                  convertToLeadMutation.mutate({
                    inquiryId: inquiryToConvert.id,
                    notes: `Converted from product inquiry INQ-${inquiryToConvert.id}`
                  });
                }
              }}
              disabled={convertToLeadMutation.isPending}
              data-testid="button-confirm-convert-lead"
            >
              {convertToLeadMutation.isPending ? 'Converting...' : 'Convert to Lead'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </RoleBasedRoute>
  );
}

