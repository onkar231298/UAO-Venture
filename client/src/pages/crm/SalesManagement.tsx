import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import RoleBasedRoute from "@/components/RoleBasedRoute";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Search, Filter, Download, MessageSquare, TrendingUp, DollarSign, Users, Package, Plus, Eye, FileText, Mail, Phone, Clock, User, Building, MapPin } from "lucide-react";
import { type Inquiry } from "@shared/schema";
import QuotationForm from "@/components/QuotationForm";
import InquiryDetailsDialog from "@/components/InquiryDetailsDialog";

import LeadManagement from "./LeadManagement";
import CompanyManagement from "./CompanyManagement";

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

  // Data fetching
  const { data: inquiries, isLoading: inquiriesLoading } = useQuery({
    queryKey: ['/api/inquiries'],
    enabled: !authLoading && !!user && activeSubSection !== 'sales-crm' && activeSubSection !== 'company-management'
  });

  const { data: quotations, isLoading: quotationsLoading } = useQuery({
    queryKey: ['/api/quotations'],
    enabled: !authLoading && !!user && activeSubSection !== 'sales-crm' && activeSubSection !== 'company-management'
  });

  const { data: sampleRequests, isLoading: sampleRequestsLoading } = useQuery({
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

  // Filter and sort inquiries
  const filteredInquiries = React.useMemo(() => {
    if (!(inquiries as any)?.inquiries) return [];
    
    let filtered = (inquiries as any).inquiries.filter((inquiry: Inquiry) => {
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

  return (
    <RoleBasedRoute allowedRoles={['admin', 'super_admin', 'sales_manager', 'sales_executive']}>
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Sales Management</h1>
            <p className="text-gray-600">Manage customer inquiries, quotations, and sales pipeline</p>
          </div>

          {/* Dashboard Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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



          {/* Horizontal Tabs Layout */}
          <Tabs defaultValue="quote-requests" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="quote-requests">Quote Requests</TabsTrigger>
              <TabsTrigger value="accepted-quotes">Accepted Quotes</TabsTrigger>
              <TabsTrigger value="high-volume-bid">High Volume Bid</TabsTrigger>
              <TabsTrigger value="sample-request">Sample Request</TabsTrigger>
            </TabsList>

            <TabsContent value="quote-requests" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Quote Requests</span>
                    <Button size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      New Quote Request
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Quote Requests Filters */}
                  <div className="flex flex-col lg:flex-row gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          placeholder="Search inquiries by customer, company, or product..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 bg-white"
                        />
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-32">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="responded">Responded</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={dateFilter} onValueChange={setDateFilter}>
                        <SelectTrigger className="w-32">
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
                        <SelectTrigger className="w-32">
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
                ) : filteredInquiries?.length ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-600">
                        Showing {filteredInquiries.length} of {(inquiries as any)?.inquiries?.length || 0} inquiries
                      </div>
                      <div className="flex gap-2">
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
                    {filteredInquiries.map((inquiry: Inquiry) => (
                      <div key={inquiry.id} className="border rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            <span className="font-medium">INQ-{inquiry.id}</span>
                            {getStatusBadge(inquiry.status || 'pending')}
                            <Badge variant="outline" className={
                              inquiry.urgency === 'urgent' ? 'border-red-500 text-red-700' :
                              inquiry.urgency === 'normal' ? 'border-yellow-500 text-yellow-700' :
                              'border-gray-500 text-gray-700'
                            }>
                              {inquiry.urgency}
                            </Badge>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                setSelectedInquiry(inquiry);
                                setShowInquiryDetails(true);
                              }}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </Button>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button size="sm">
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
                          </div>
                        </div>
                        <div className="grid md:grid-cols-3 gap-4 text-sm">
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
            </TabsContent>

            <TabsContent value="accepted-quotes" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Accepted Quotations - Ready for Order Processing</span>
                    <div className="flex gap-2">
                      <Badge className="bg-green-100 text-green-800">
                        {(quotations as any)?.quotations?.filter((q: any) => q.status === 'accepted')?.length || 0} Accepted
                      </Badge>
                      <Button size="sm" variant="outline">
                        <Download className="w-4 h-4 mr-2" />
                        Export Orders
                      </Button>
                    </div>
                  </CardTitle>
                  <CardDescription>
                    Quotations accepted by customers - process these into sales orders
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Accepted Quotes Filters */}
                  <div className="flex flex-col lg:flex-row gap-4 mb-6 p-4 bg-green-50 rounded-lg">
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          placeholder="Search accepted quotations by customer or quotation ID..."
                          className="pl-10 bg-white"
                        />
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Select defaultValue="accepted">
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="accepted">Accepted</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select defaultValue="all">
                        <SelectTrigger className="w-32">
                          <SelectValue placeholder="Date" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Time</SelectItem>
                          <SelectItem value="today">Today</SelectItem>
                          <SelectItem value="week">This Week</SelectItem>
                          <SelectItem value="month">This Month</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select defaultValue="high_value">
                        <SelectTrigger className="w-32">
                          <SelectValue placeholder="Sort" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="high_value">High Value</SelectItem>
                          <SelectItem value="newest">Newest</SelectItem>
                          <SelectItem value="oldest">Oldest</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {quotationsLoading ? (
                    <div className="space-y-4">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="animate-pulse bg-gray-100 h-16 rounded"></div>
                      ))}
                    </div>
                  ) : (quotations as any)?.quotations?.filter((q: any) => q.status === 'accepted')?.length ? (
                    <div className="space-y-4">
                      {(quotations as any).quotations
                        .filter((quotation: any) => quotation.status === 'accepted')
                        .map((quotation: any) => (
                        <div key={quotation.id} className="border rounded-lg p-4 hover:bg-gray-50 bg-green-50 border-green-200">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <span className="font-semibold text-lg">{quotation.quotationId}</span>
                              <Badge className="bg-green-600 text-white">ACCEPTED</Badge>
                              <Badge variant="outline" className="text-xs">
                                {quotation.currency || 'USD'}
                              </Badge>
                            </div>
                            <div className="text-right">
                              <div className="text-xl font-bold text-green-600">
                                {quotation.currency || 'USD'} {quotation.totalAmount}
                              </div>
                              <div className="text-sm text-gray-600">
                                {quotation.priceType?.replace('_', ' ') || 'Ex-Warehouse'}
                              </div>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-3">
                            <div>
                              <span className="font-medium text-gray-600">Customer:</span>
                              <div>{quotation.customerId}</div>
                            </div>
                            <div>
                              <span className="font-medium text-gray-600">Accepted Date:</span>
                              <div>{quotation.updatedAt ? new Date(quotation.updatedAt).toLocaleDateString() : 'N/A'}</div>
                            </div>
                            <div>
                              <span className="font-medium text-gray-600">Valid Until:</span>
                              <div>{quotation.validUntil ? new Date(quotation.validUntil).toLocaleDateString() : 'N/A'}</div>
                            </div>
                          </div>

                          {quotation.terms && (
                            <div className="bg-white rounded border p-3 mb-3">
                              <span className="font-medium text-gray-600">Terms & Conditions:</span>
                              <p className="text-sm mt-1 whitespace-pre-line">{quotation.terms}</p>
                            </div>
                          )}

                          <div className="flex items-center justify-between pt-3 border-t">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Clock className="w-4 h-4" />
                              Created: {quotation.createdAt ? new Date(quotation.createdAt).toLocaleDateString() : 'N/A'}
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button variant="outline" size="sm">
                                <Eye className="w-4 h-4 mr-1" />
                                View Details
                              </Button>
                              <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                                <Package className="w-4 h-4 mr-1" />
                                Create Sales Order
                              </Button>
                              <Button variant="outline" size="sm">
                                <Mail className="w-4 h-4 mr-1" />
                                Contact Customer
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Package className="mx-auto w-12 h-12 text-gray-400 mb-4" />
                      <p className="text-gray-500 mb-2">No accepted quotations yet</p>
                      <p className="text-xs text-gray-400">
                        Quotations accepted by customers will appear here for order processing
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="high-volume-bid" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>High Volume Bids</span>
                    <Button size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      New Bid Request
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* High Volume Bid Filters */}
                  <div className="flex flex-col lg:flex-row gap-4 mb-6 p-4 bg-blue-50 rounded-lg">
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          placeholder="Search high volume bids by customer or product..."
                          className="pl-10 bg-white"
                        />
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Select defaultValue="all">
                        <SelectTrigger className="w-32">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="quoted">Quoted</SelectItem>
                          <SelectItem value="negotiating">Negotiating</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select defaultValue="1000+">
                        <SelectTrigger className="w-32">
                          <SelectValue placeholder="Min Qty" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1000+">1000+ kg</SelectItem>
                          <SelectItem value="5000+">5000+ kg</SelectItem>
                          <SelectItem value="10000+">10000+ kg</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select defaultValue="all">
                        <SelectTrigger className="w-32">
                          <SelectValue placeholder="Date" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Time</SelectItem>
                          <SelectItem value="today">Today</SelectItem>
                          <SelectItem value="week">This Week</SelectItem>
                          <SelectItem value="month">This Month</SelectItem>
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
                ) : (inquiries as any)?.inquiries?.filter((inq: Inquiry) => inq.inquiryType === 'bulk_order').length ? (
                  <div className="space-y-4">
                    {(inquiries as any).inquiries.filter((inq: Inquiry) => inq.inquiryType === 'bulk_order').map((inquiry: Inquiry) => (
                      <div key={inquiry.id} className="border rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            <span className="font-medium">BID-{inquiry.id}</span>
                            {getStatusBadge(inquiry.status || 'pending')}
                          </div>
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4 mr-1" />
                            View Bid
                          </Button>
                        </div>
                        <div className="grid md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Customer:</span>
                            <p className="font-medium">{inquiry.contactName}</p>
                          </div>
                          <div>
                            <span className="text-gray-600">Volume:</span>
                            <p className="font-medium">{inquiry.quantity} {inquiry.unit}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No high volume bids found</h3>
                    <p className="text-gray-600">Large quantity bid requests will appear here</p>
                  </div>
                )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="sample-request" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Sample Requests</span>
                    <span className="text-sm text-gray-500">Manage product sample requests</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Sample Requests Filters */}
                  <div className="flex flex-col lg:flex-row gap-4 mb-6 p-4 bg-orange-50 rounded-lg">
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          placeholder="Search sample requests by customer or product..."
                          className="pl-10 bg-white"
                        />
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Select defaultValue="all">
                        <SelectTrigger className="w-32">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="approved">Approved</SelectItem>
                          <SelectItem value="shipped">Shipped</SelectItem>
                          <SelectItem value="delivered">Delivered</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select defaultValue="all">
                        <SelectTrigger className="w-32">
                          <SelectValue placeholder="Priority" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Priority</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                          <SelectItem value="normal">Normal</SelectItem>
                          <SelectItem value="low">Low</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select defaultValue="all">
                        <SelectTrigger className="w-32">
                          <SelectValue placeholder="Date" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Time</SelectItem>
                          <SelectItem value="today">Today</SelectItem>
                          <SelectItem value="week">This Week</SelectItem>
                          <SelectItem value="month">This Month</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                {sampleRequestsLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="animate-pulse bg-gray-100 h-16 rounded"></div>
                    ))}
                  </div>
                ) : (sampleRequests as any)?.requests?.length ? (
                  <div className="space-y-4">
                    {(sampleRequests as any).requests.map((request: any) => (
                      <div key={request.id} className="border rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            <span className="font-medium">SAM-{request.id}</span>
                            {getStatusBadge(request.status || 'pending')}
                          </div>
                          <Button variant="outline" size="sm">
                            <Package className="w-4 h-4 mr-1" />
                            Process
                          </Button>
                        </div>
                        <div className="grid md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Customer:</span>
                            <p className="font-medium">{request.customerName}</p>
                          </div>
                          <div>
                            <span className="text-gray-600">Product:</span>
                            <p className="font-medium">{request.productName}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No sample requests found</h3>
                    <p className="text-gray-600">New sample requests will appear here</p>
                  </div>
                )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Inquiry Details Dialog */}
      {selectedInquiry && (
        <InquiryDetailsDialog
          inquiry={selectedInquiry}
          open={showInquiryDetails}
          onOpenChange={setShowInquiryDetails}
        />
      )}
    </RoleBasedRoute>
  );
}

// Helper function to get status badge styling
const getStatusBadge = (status: string) => {
  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    quoted: 'bg-blue-100 text-blue-800',
    converted: 'bg-green-100 text-green-800',
    closed: 'bg-gray-100 text-gray-800'
  };
  
  return (
    <Badge className={statusColors[status as keyof typeof statusColors] || statusColors.pending}>
      {status}
    </Badge>
  );
};

