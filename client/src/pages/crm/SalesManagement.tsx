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

export default function SalesManagement() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State management
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedAction, setSelectedAction] = useState("");

  // Data fetching
  const { data: inquiries, isLoading: inquiriesLoading } = useQuery({
    queryKey: ['/api/inquiries'],
    enabled: !authLoading && !!user
  });

  const { data: quotations, isLoading: quotationsLoading } = useQuery({
    queryKey: ['/api/quotations'],
    enabled: !authLoading && !!user
  });

  const { data: sampleRequests, isLoading: sampleRequestsLoading } = useQuery({
    queryKey: ['/api/sample-requests'],
    enabled: !authLoading && !!user
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

  if (authLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
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

          {/* Filters and Search */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Search & Filters</CardTitle>
              <CardDescription>Filter and search through sales data</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search by customer, product, or inquiry ID..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div className="flex gap-2">
                  {/* Action Dropdown */}
                  <Select value={selectedAction} onValueChange={setSelectedAction}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Actions" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bulk_follow_up">Bulk Follow Up</SelectItem>
                      <SelectItem value="export_leads">Export Leads</SelectItem>
                      <SelectItem value="assign_sales_rep">Assign Sales Rep</SelectItem>
                      <SelectItem value="mark_priority">Mark as Priority</SelectItem>
                      <SelectItem value="send_newsletter">Send Newsletter</SelectItem>
                      <SelectItem value="create_campaign">Create Campaign</SelectItem>
                      <SelectItem value="view_analytics">View Analytics</SelectItem>
                      <SelectItem value="generate_reports">Generate Reports</SelectItem>
                      <SelectItem value="view_sales_orders">View Sales Orders</SelectItem>
                      <SelectItem value="export_crm_data">Export CRM Data</SelectItem>
                      <SelectItem value="bulk_actions">Bulk Actions</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Status Filter */}
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="quoted">Quoted</SelectItem>
                      <SelectItem value="converted">Converted</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Horizontal Tabs Layout */}
          <Tabs defaultValue="quote-requests" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="quote-requests">Quote Requests</TabsTrigger>
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
                {inquiriesLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="animate-pulse bg-gray-100 h-16 rounded"></div>
                    ))}
                  </div>
                ) : (inquiries as any)?.inquiries?.length ? (
                  <div className="space-y-4">
                    {(inquiries as any).inquiries.map((inquiry: Inquiry) => (
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
                            <Button variant="outline" size="sm">
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

