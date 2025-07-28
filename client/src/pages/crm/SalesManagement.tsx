import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import RoleBasedRoute from "@/components/RoleBasedRoute";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  BarChart3, 
  MessageSquare, 
  FileText, 
  Users, 
  TrendingUp,
  Search,
  Plus,
  Edit,
  Eye,
  Calendar,
  DollarSign
} from "lucide-react";
import type { Inquiry, Quotation } from "@shared/schema";

export default function SalesManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("inquiries");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Queries
  const { data: inquiries, isLoading: inquiriesLoading } = useQuery({
    queryKey: ["/api/inquiries", { status: statusFilter, search: searchQuery }],
  });

  const { data: quotations, isLoading: quotationsLoading } = useQuery({
    queryKey: ["/api/quotations", { status: statusFilter }],
  });

  const { data: salesOrders, isLoading: ordersLoading } = useQuery({
    queryKey: ["/api/sales-orders", { status: statusFilter }],
  });

  const { data: sampleRequests, isLoading: sampleRequestsLoading } = useQuery({
    queryKey: ["/api/sample-requests", { status: statusFilter }],
  });

  const { data: dashboardStats } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  // Mutations
  const updateInquiryMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Inquiry> }) => {
      return await apiRequest("PUT", `/api/inquiries/${id}`, data);
    },
    onSuccess: () => {
      toast({ title: "Inquiry updated successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/inquiries"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => window.location.href = "/api/login", 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update inquiry",
        variant: "destructive",
      });
    },
  });

  const createQuotationMutation = useMutation({
    mutationFn: async (data: Partial<Quotation>) => {
      return await apiRequest("POST", "/api/quotations", data);
    },
    onSuccess: () => {
      toast({ title: "Quotation created successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/quotations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inquiries"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => window.location.href = "/api/login", 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to create quotation",
        variant: "destructive",
      });
    },
  });

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { variant: any; label: string }> = {
      pending: { variant: "secondary", label: "Pending" },
      quoted: { variant: "default", label: "Quoted" },
      converted: { variant: "default", label: "Converted" },
      closed: { variant: "outline", label: "Closed" },
      draft: { variant: "secondary", label: "Draft" },
      sent: { variant: "default", label: "Sent" },
      accepted: { variant: "default", label: "Accepted" },
      rejected: { variant: "destructive", label: "Rejected" },
      expired: { variant: "outline", label: "Expired" },
    };

    const config = statusMap[status] || { variant: "secondary", label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <RoleBasedRoute allowedRoles={['super_admin', 'admin', 'sales_manager', 'sales_executive']}>
      <div className="min-h-screen bg-background">
        <Header />
        
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Sales Management</h1>
            <p className="text-gray-600">Manage customer inquiries, quotations, and sales orders</p>
          </div>

          {/* Stats Cards */}
          {dashboardStats && (
            <div className="grid md:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Active Inquiries</p>
                      <p className="text-2xl font-bold">{dashboardStats.totalInquiries}</p>
                    </div>
                    <MessageSquare className="w-8 h-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Quotations</p>
                      <p className="text-2xl font-bold">{dashboardStats.totalQuotations}</p>
                    </div>
                    <FileText className="w-8 h-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Sales Orders</p>
                      <p className="text-2xl font-bold">{dashboardStats.totalOrders}</p>
                    </div>
                    <BarChart3 className="w-8 h-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Revenue</p>
                      <p className="text-2xl font-bold">${dashboardStats.revenueThisMonth.toLocaleString()}</p>
                    </div>
                    <DollarSign className="w-8 h-8 text-orange-600" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-4">
                <div className="relative flex-1 min-w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search inquiries, customers..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="quoted">Quoted</SelectItem>
                    <SelectItem value="converted">Converted</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Main Content Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="inquiries">Customer Inquiries</TabsTrigger>
              <TabsTrigger value="samples">Sample Requests</TabsTrigger>
              <TabsTrigger value="quotations">Quotations</TabsTrigger>
              <TabsTrigger value="orders">Sales Orders</TabsTrigger>
            </TabsList>

            {/* Inquiries Tab */}
            <TabsContent value="inquiries" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Customer Inquiries</span>
                    <Button size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Manual Inquiry
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
                  ) : inquiries?.inquiries?.length ? (
                    <div className="space-y-4">
                      {inquiries.inquiries.map((inquiry: Inquiry) => (
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
                                <DialogContent className="max-w-2xl">
                                  <DialogHeader>
                                    <DialogTitle>Create Quotation for INQ-{inquiry.id}</DialogTitle>
                                  </DialogHeader>
                                  <QuotationForm 
                                    inquiry={inquiry} 
                                    onSubmit={(data) => createQuotationMutation.mutate(data)}
                                    isLoading={createQuotationMutation.isPending}
                                  />
                                </DialogContent>
                              </Dialog>
                            </div>
                          </div>
                          <div className="grid md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="text-gray-600">Customer:</span>
                              <p className="font-medium">{inquiry.customerId}</p>
                            </div>
                            <div>
                              <span className="text-gray-600">Quantity:</span>
                              <p className="font-medium">{inquiry.quantity} {inquiry.unit}</p>
                            </div>
                            <div>
                              <span className="text-gray-600">Date:</span>
                              <p className="font-medium">{new Date(inquiry.createdAt!).toLocaleDateString()}</p>
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

            {/* Sample Requests Tab */}
            <TabsContent value="samples" className="mt-6">
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
                  ) : sampleRequests?.requests?.length ? (
                    <div className="space-y-4">
                      {sampleRequests.requests.map((request: any) => (
                        <div key={request.id} className="border rounded-lg p-4 hover:bg-gray-50">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-3">
                              <span className="font-medium">SAM-{request.id}</span>
                              {getStatusBadge(request.status || 'pending')}
                              <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                                {request.sampleSize}
                              </Badge>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button variant="outline" size="sm">
                                <Eye className="w-4 h-4 mr-1" />
                                View Details
                              </Button>
                              <Button size="sm" variant="outline">
                                <Edit className="w-4 h-4 mr-1" />
                                Update Status
                              </Button>
                            </div>
                          </div>
                          <div className="grid md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-gray-600">Contact:</span>
                              <p className="font-medium">{request.contactName}</p>
                              <p className="text-xs text-gray-500">{request.companyName}</p>
                            </div>
                            <div>
                              <span className="text-gray-600">Purpose:</span>
                              <p className="font-medium capitalize">{request.purpose?.replace('_', ' ')}</p>
                            </div>
                            <div>
                              <span className="text-gray-600">Expected Order:</span>
                              <p className="font-medium">{request.expectedOrderQuantity ? `${request.expectedOrderQuantity} kg` : 'Not specified'}</p>
                            </div>
                            <div>
                              <span className="text-gray-600">Date:</span>
                              <p className="font-medium">{new Date(request.createdAt!).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <div className="mt-3 grid md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="text-gray-600">Email:</span>
                              <p className="font-medium">{request.emailAddress}</p>
                            </div>
                            <div>
                              <span className="text-gray-600">Phone:</span>
                              <p className="font-medium">{request.phoneNumber}</p>
                            </div>
                            <div>
                              <span className="text-gray-600">Location:</span>
                              <p className="font-medium">{request.city}, {request.state}, {request.country}</p>
                            </div>
                          </div>
                          {request.message && (
                            <div className="mt-2">
                              <span className="text-gray-600 text-sm">Additional Requirements:</span>
                              <p className="text-sm mt-1 bg-gray-50 p-2 rounded">{request.message}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-6 h-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 8a2 2 0 012-2h10a2 2 0 012 2v11a2 2 0 01-2 2H7a2 2 0 01-2-2V8z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5V3a2 2 0 012-2h2a2 2 0 012 2v2M5 12h14" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No sample requests found</h3>
                      <p className="text-gray-600">New sample requests will appear here</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Quotations Tab */}
            <TabsContent value="quotations" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Quotations</span>
                    <Button size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      New Quotation
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {quotationsLoading ? (
                    <div className="space-y-4">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="animate-pulse bg-gray-100 h-16 rounded"></div>
                      ))}
                    </div>
                  ) : quotations?.quotations?.length ? (
                    <div className="space-y-4">
                      {quotations.quotations.map((quotation: Quotation) => (
                        <div key={quotation.id} className="border rounded-lg p-4 hover:bg-gray-50">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-3">
                              <span className="font-medium">{quotation.quotationId}</span>
                              {getStatusBadge(quotation.status || 'draft')}
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button variant="outline" size="sm">
                                <Eye className="w-4 h-4 mr-1" />
                                View
                              </Button>
                              <Button variant="outline" size="sm">
                                <Edit className="w-4 h-4 mr-1" />
                                Edit
                              </Button>
                            </div>
                          </div>
                          <div className="grid md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-gray-600">Customer:</span>
                              <p className="font-medium">{quotation.customerId}</p>
                            </div>
                            <div>
                              <span className="text-gray-600">Amount:</span>
                              <p className="font-medium">${quotation.totalAmount}</p>
                            </div>
                            <div>
                              <span className="text-gray-600">Valid Until:</span>
                              <p className="font-medium">
                                {quotation.validUntil ? new Date(quotation.validUntil).toLocaleDateString() : 'N/A'}
                              </p>
                            </div>
                            <div>
                              <span className="text-gray-600">Created:</span>
                              <p className="font-medium">{new Date(quotation.createdAt!).toLocaleDateString()}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No quotations found</h3>
                      <p className="text-gray-600">Created quotations will appear here</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Sales Orders Tab */}
            <TabsContent value="orders" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Sales Orders</CardTitle>
                </CardHeader>
                <CardContent>
                  {ordersLoading ? (
                    <div className="space-y-4">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="animate-pulse bg-gray-100 h-16 rounded"></div>
                      ))}
                    </div>
                  ) : salesOrders?.orders?.length ? (
                    <div className="space-y-4">
                      {salesOrders.orders.map((order: any) => (
                        <div key={order.id} className="border rounded-lg p-4 hover:bg-gray-50">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-3">
                              <span className="font-medium">{order.orderId}</span>
                              {getStatusBadge(order.status || 'pending')}
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button variant="outline" size="sm">
                                <Eye className="w-4 h-4 mr-1" />
                                View
                              </Button>
                            </div>
                          </div>
                          <div className="grid md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-gray-600">Customer:</span>
                              <p className="font-medium">{order.customerId}</p>
                            </div>
                            <div>
                              <span className="text-gray-600">Amount:</span>
                              <p className="font-medium">${order.totalAmount}</p>
                            </div>
                            <div>
                              <span className="text-gray-600">Expected Delivery:</span>
                              <p className="font-medium">
                                {order.expectedDelivery ? new Date(order.expectedDelivery).toLocaleDateString() : 'TBD'}
                              </p>
                            </div>
                            <div>
                              <span className="text-gray-600">Order Date:</span>
                              <p className="font-medium">{new Date(order.orderDate).toLocaleDateString()}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No sales orders found</h3>
                      <p className="text-gray-600">Confirmed orders will appear here</p>
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

// Quotation Form Component
function QuotationForm({ 
  inquiry, 
  onSubmit, 
  isLoading 
}: { 
  inquiry: Inquiry; 
  onSubmit: (data: any) => void; 
  isLoading: boolean; 
}) {
  const [formData, setFormData] = useState({
    inquiryId: inquiry.id,
    customerId: inquiry.customerId,
    validUntil: "",
    totalAmount: "",
    terms: "",
    notes: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      totalAmount: parseFloat(formData.totalAmount),
      validUntil: formData.validUntil ? new Date(formData.validUntil) : null,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Valid Until</Label>
          <Input
            type="date"
            value={formData.validUntil}
            onChange={(e) => setFormData(prev => ({ ...prev, validUntil: e.target.value }))}
            required
          />
        </div>
        <div>
          <Label>Total Amount ($)</Label>
          <Input
            type="number"
            step="0.01"
            value={formData.totalAmount}
            onChange={(e) => setFormData(prev => ({ ...prev, totalAmount: e.target.value }))}
            required
          />
        </div>
      </div>
      
      <div>
        <Label>Terms & Conditions</Label>
        <Textarea
          value={formData.terms}
          onChange={(e) => setFormData(prev => ({ ...prev, terms: e.target.value }))}
          placeholder="Enter payment terms, delivery conditions, etc."
        />
      </div>
      
      <div>
        <Label>Notes</Label>
        <Textarea
          value={formData.notes}
          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          placeholder="Additional notes or comments"
        />
      </div>
      
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Creating..." : "Create Quotation"}
      </Button>
    </form>
  );
}
