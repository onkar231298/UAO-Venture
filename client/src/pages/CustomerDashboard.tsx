import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCustomerAuth } from "@/hooks/useCustomerAuth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import CustomerSidebar from "@/components/CustomerSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Search, Heart, MessageSquare, FileText, Package, TrendingUp, Eye, Clock, User, Building, Plus, Check, Truck, MapPin, DollarSign, Loader2, RefreshCw } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";

export default function CustomerDashboard() {
  const { customer, isCustomerAuthenticated } = useCustomerAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [location, setLocation] = useLocation();
  const [selectedQuotation, setSelectedQuotation] = useState(null);
  const [selectedSampleRequest, setSelectedSampleRequest] = useState<any>(null);
  const [showSampleTrackingDialog, setShowSampleTrackingDialog] = useState(false);
  const [showCounterOfferDialog, setShowCounterOfferDialog] = useState(false);
  const [counterPrice, setCounterPrice] = useState("");
  const [counterNotes, setCounterNotes] = useState("");
  const [selectedBidForTracking, setSelectedBidForTracking] = useState<any>(null);
  const [showBidTrackingDialog, setShowBidTrackingDialog] = useState(false);

  // Data fetching for customer-specific data with auto-refresh every 30 seconds
  const { data: inquiries, isLoading: inquiriesLoading, refetch: refetchInquiries, isRefetching: isRefetchingInquiries } = useQuery({
    queryKey: [`/api/customer/inquiries/${customer?.id}`],
    enabled: isCustomerAuthenticated && !!customer?.id,
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });

  const { data: savedProducts, isLoading: savedLoading, refetch: refetchSaved, isRefetching: isRefetchingSaved } = useQuery({
    queryKey: [`/api/customer/saved-products/${customer?.id}`],
    enabled: isCustomerAuthenticated && !!customer?.id,
    refetchInterval: 30000,
  });

  const { data: quotations, isLoading: quotationsLoading, refetch: refetchQuotations, isRefetching: isRefetchingQuotations } = useQuery({
    queryKey: [`/api/customer/quotations/${customer?.id}`],
    enabled: isCustomerAuthenticated && !!customer?.id,
    refetchInterval: 30000,
  });

  const { data: sampleRequests, isLoading: sampleRequestsLoading, refetch: refetchSampleRequests, isRefetching: isRefetchingSampleRequests } = useQuery({
    queryKey: [`/api/customer/sample-requests/${customer?.id}`],
    enabled: isCustomerAuthenticated && !!customer?.id,
    refetchInterval: 30000,
  });

  // Manual refresh all data
  const handleRefreshAll = () => {
    refetchInquiries();
    refetchSaved();
    refetchQuotations();
    refetchSampleRequests();
    toast({
      title: "Refreshing",
      description: "Updating your data...",
    });
  };

  const isRefreshing = isRefetchingInquiries || isRefetchingSaved || isRefetchingQuotations || isRefetchingSampleRequests;

  // Query for bid tracking data (uses the numeric database id)
  const { data: bidTrackingData, isLoading: bidTrackingLoading } = useQuery<any>({
    queryKey: ['/api/customer/high-volume-bids', selectedBidForTracking?.id, 'tracking'],
    queryFn: async () => {
      if (!selectedBidForTracking?.id) return null;
      const response = await fetch(`/api/customer/high-volume-bids/${selectedBidForTracking.id}/tracking`);
      if (!response.ok) {
        console.error('Failed to fetch tracking data for bid:', selectedBidForTracking.id);
        return null;
      }
      return response.json();
    },
    enabled: showBidTrackingDialog && !!selectedBidForTracking?.id,
  });

  // Extract inquiries data
  const allInquiries = (inquiries as any)?.inquiries || [];
  const highVolumeBids = allInquiries.filter((inq: any) => inq.inquiryType === 'high_volume_bid');
  const regularInquiries = allInquiries.filter((inq: any) => inq.inquiryType !== 'high_volume_bid');

  const queryClient = useQueryClient();

  // Accept quotation mutation
  const acceptQuotationMutation = useMutation({
    mutationFn: async (quotationId: number) => {
      const response = await fetch(`/api/quotations/${quotationId}/accept`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('Failed to accept quotation');
      return response.json();
    },
    onSuccess: () => {
      // Invalidate customer quotations
      queryClient.invalidateQueries({ queryKey: [`/api/customer/quotations/${customer?.id}`] });
      // Invalidate customer inquiries to reflect updated bid status
      queryClient.invalidateQueries({ queryKey: [`/api/customer/inquiries/${customer?.id}`] });
      // Invalidate ALL admin high volume bids queries (including filtered tabs)
      // Using exact: false ensures all queries starting with this key are invalidated
      queryClient.invalidateQueries({ queryKey: ['/api/admin/high-volume-bids'], exact: false });
      toast({
        title: "Quotation Accepted",
        description: "Your quotation has been accepted successfully. Our sales team will contact you to proceed with the order.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to accept quotation. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Counter-offer mutation
  const counterOfferMutation = useMutation({
    mutationFn: async ({ quotationId, price, notes }: { quotationId: number; price: number; notes: string }) => {
      const response = await fetch(`/api/quotations/${customer?.id}/${quotationId}/counter-offer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          counterPrice: price,
          notes: notes
        })
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to submit counter-offer');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/customer/quotations/${customer?.id}`] });
      toast({
        title: "Counter-Offer Submitted",
        description: "Your counter-offer has been sent to our sales team for review.",
      });
      setShowCounterOfferDialog(false);
      setCounterPrice("");
      setCounterNotes("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit counter-offer. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Mark sample request as delivered mutation
  const markSampleDeliveredMutation = useMutation({
    mutationFn: async (requestId: number) => {
      const response = await fetch(`/api/customer/sample-requests/${customer?.id}/${requestId}/delivered`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('Failed to mark sample as delivered');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/customer/sample-requests/${customer?.id}`] });
      toast({
        title: "Sample Marked as Delivered",
        description: "Thank you for confirming the delivery of your sample.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to mark sample as delivered. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Respond to bid revision (accept/reject) mutation
  const respondToBidRevisionMutation = useMutation({
    mutationFn: async ({ revisionId, status, responseNotes }: { revisionId: number; status: 'accepted' | 'rejected'; responseNotes?: string }) => {
      const response = await fetch(`/api/customer/bid-revisions/${customer?.id}/${revisionId}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, responseNotes })
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to respond to quote');
      }
      return response.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/customer/high-volume-bids', selectedBidForTracking?.id, 'tracking'] });
      queryClient.invalidateQueries({ queryKey: [`/api/customer/inquiries/${customer?.id}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/crm/leads'] });
      toast({
        title: variables.status === 'accepted' ? "Quote Accepted" : "Quote Rejected",
        description: variables.status === 'accepted' 
          ? "You have accepted the revised quote. Our sales team will contact you to proceed."
          : "You have rejected the revised quote. Our team may send an updated offer.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to respond to quote. Please try again.",
        variant: "destructive",
      });
    }
  });

  if (!isCustomerAuthenticated) {
    return <div className="flex items-center justify-center min-h-screen">Please login to access your dashboard.</div>;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'responded': return 'bg-blue-100 text-blue-800';
      case 'quoted': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-emerald-100 text-emerald-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'urgent': return 'border-red-500 text-red-700';
      case 'high': return 'border-orange-500 text-orange-700';
      case 'normal': return 'border-yellow-500 text-yellow-700';
      case 'low': return 'border-gray-500 text-gray-700';
      default: return 'border-gray-500 text-gray-700';
    }
  };

  // Function to render the main content based on the current route
  const renderMainContent = () => {
    const path = location.replace('/customer/', '');
    
    switch (path) {
      case 'dashboard':
        return renderDashboardOverview();
      case 'inquiries':
        return renderInquiries();
      case 'high-volume-bids':
        return renderInquiries(); // Redirect to inquiries with tabs
      case 'saved':
        return renderSavedProducts();
      case 'quotes':
        return renderQuotations();
      case 'sample-requests':
        return renderSampleRequests();
      case 'downloads':
        return renderDownloads();
      case 'catalogs':
        return renderCatalogs();
      case 'profile':
        return renderProfile();
      default:
        return renderDashboardOverview();
    }
  };

  const renderDashboardOverview = () => (
    <div className="space-y-4 sm:space-y-6">
      <div className="mb-6 sm:mb-8">
        <div className="flex items-start sm:items-center justify-between gap-4 flex-col sm:flex-row">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2">Dashboard Overview</h1>
            <p className="text-sm sm:text-base text-gray-600">Welcome back, {customer?.firstName} {customer?.lastName}</p>
            <p className="text-sm text-gray-500">{customer?.companyName}</p>
          </div>
          <Button 
            variant="outline"
            size="sm"
            data-testid="button-refresh-all"
            onClick={handleRefreshAll}
            disabled={isRefreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh All
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Inquiries</p>
                <p className="text-2xl font-bold text-gray-900">{inquiries?.total || 0}</p>
              </div>
              <MessageSquare className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Saved Products</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{savedProducts?.length || 0}</p>
              </div>
              <Heart className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">High Volume Bids</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{highVolumeBids?.length || 0}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Quotes</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{quotations?.length || 0}</p>
              </div>
              <FileText className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">Recent Activity</CardTitle>
          <CardDescription className="text-sm">Your latest inquiries and updates</CardDescription>
        </CardHeader>
        <CardContent>
          {inquiries?.inquiries && inquiries.inquiries.length > 0 ? (
            <div className="space-y-3 sm:space-y-4">
              {inquiries.inquiries.slice(0, 3).map((inquiry: any) => (
                <div key={inquiry.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 p-3 sm:p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    <MessageSquare className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm sm:text-base truncate">{inquiry.inquiryId}</p>
                      <p className="text-sm text-gray-500 truncate">{inquiry.productName}</p>
                    </div>
                  </div>
                  <Badge className={`${getStatusColor(inquiry.status)} shrink-0`}>
                    {inquiry.status}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm sm:text-base text-gray-500">No recent activity</p>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderInquiries = () => (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Inquiries & Bids</h1>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button 
            variant="outline"
            size="sm"
            className="min-h-[44px]" 
            data-testid="button-refresh-inquiries"
            onClick={() => refetchInquiries()}
            disabled={isRefetchingInquiries}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefetchingInquiries ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            className="min-h-[44px] flex-1 sm:flex-none" 
            data-testid="button-new-inquiry"
            onClick={() => setLocation('/products')}
          >
            <Plus className="w-4 h-4 mr-2" />
            New Inquiry
          </Button>
        </div>
      </div>

      {/* Tabbed Interface */}
      <Tabs defaultValue="inquiries" className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-auto">
          <TabsTrigger value="inquiries">My Enquiry</TabsTrigger>
          <TabsTrigger value="high-volume-bids">High Volume Bid</TabsTrigger>
          <TabsTrigger value="received-quotes">Received Quotes</TabsTrigger>
        </TabsList>

        <TabsContent value="inquiries" className="mt-4 sm:mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <MessageSquare className="w-5 h-5" />
                My Enquiry
              </CardTitle>
              <CardDescription className="text-sm">All submitted inquiries and requests</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Search and Filter */}
              <div className="mb-4 sm:mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search my enquiries..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 min-h-[44px]"
                  />
                </div>
              </div>

              {inquiriesLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="animate-pulse bg-gray-100 h-16 rounded"></div>
                  ))}
                </div>
              ) : regularInquiries && regularInquiries.length > 0 ? (
                <div className="space-y-4">
                  {regularInquiries.map((inquiry: any) => (
                    <div key={inquiry.id} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-semibold text-lg">{inquiry.inquiryId}</span>
                            <Badge className={getStatusColor(inquiry.status)}>
                              {inquiry.status}
                            </Badge>
                            <Badge variant="outline" className={getUrgencyColor(inquiry.urgency)}>
                              {inquiry.urgency}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="font-medium">Product:</span> {inquiry.productName}
                            </div>
                            <div>
                              <span className="font-medium">Quantity:</span> {inquiry.quantity} {inquiry.unit}
                            </div>
                            <div className="flex items-center">
                              <Clock className="w-4 h-4 mr-1 text-gray-400" />
                              <span>{formatDistanceToNow(new Date(inquiry.createdAt))} ago</span>
                            </div>
                          </div>
                          {inquiry.message && (
                            <div className="mt-3 p-3 bg-gray-50 rounded text-sm">
                              <span className="font-medium">Requirements:</span> {inquiry.message}
                            </div>
                          )}
                        </div>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className="min-h-[44px]" data-testid={`button-view-inquiry-${inquiry.id}`}>
                              <Eye className="w-4 h-4 mr-1" />
                              View Details
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-[95vw] sm:max-w-3xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle className="text-base sm:text-lg">Inquiry Details - {inquiry.inquiryId}</DialogTitle>
                              <DialogDescription className="text-sm">
                                Complete inquiry information and status
                              </DialogDescription>
                            </DialogHeader>
                            
                            <div className="space-y-4 sm:space-y-6">
                              {/* Inquiry Header */}
                              <div className="border-b pb-3 sm:pb-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                  <div>
                                    <h3 className="font-semibold mb-2">Inquiry Information</h3>
                                    <div className="space-y-1 text-sm">
                                      <p><span className="font-medium">Inquiry ID:</span> {inquiry.inquiryId}</p>
                                      <p><span className="font-medium">Date:</span> {new Date(inquiry.createdAt).toLocaleDateString()}</p>
                                      <p><span className="font-medium">Status:</span> 
                                        <Badge className={`ml-2 ${getStatusColor(inquiry.status)}`}>
                                          {inquiry.status}
                                        </Badge>
                                      </p>
                                      <p><span className="font-medium">Urgency:</span> 
                                        <Badge className={`ml-2 ${getUrgencyColor(inquiry.urgency)}`} variant="outline">
                                          {inquiry.urgency}
                                        </Badge>
                                      </p>
                                    </div>
                                  </div>
                                  <div>
                                    <h3 className="font-semibold mb-2">Product Details</h3>
                                    <div className="space-y-1 text-sm">
                                      <p><span className="font-medium">Product:</span> {inquiry.productName}</p>
                                      <p><span className="font-medium">Quantity:</span> {inquiry.quantity} {inquiry.unit}</p>
                                      {inquiry.inquiryType === 'high_volume_bid' && (
                                        <p>
                                          <Badge className="bg-blue-100 text-blue-800">
                                            High Volume Bid
                                          </Badge>
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Requirements */}
                              {inquiry.message && (
                                <div>
                                  <h3 className="font-semibold mb-2">Requirements & Details</h3>
                                  <div className="bg-gray-50 p-4 rounded-lg">
                                    <p className="text-sm whitespace-pre-wrap">{inquiry.message}</p>
                                  </div>
                                </div>
                              )}

                              {/* Shipping Information */}
                              {inquiry.shippingAddress && (
                                <div>
                                  <h3 className="font-semibold mb-2">Shipping Address</h3>
                                  <div className="bg-blue-50 p-3 rounded text-sm">
                                    <p>{inquiry.shippingAddress}</p>
                                  </div>
                                </div>
                              )}

                              {/* Contact Information */}
                              <div>
                                <h3 className="font-semibold mb-2">Contact Information</h3>
                                <div className="bg-gray-50 p-3 rounded text-sm space-y-1">
                                  <p><span className="font-medium">Email:</span> {inquiry.emailAddress}</p>
                                  {inquiry.phoneNumber && (
                                    <p><span className="font-medium">Phone:</span> {inquiry.phoneNumber}</p>
                                  )}
                                </div>
                              </div>

                              {/* Quotations Response */}
                              {(() => {
                                const relatedQuotations = quotations?.quotations?.filter(
                                  (q: any) => q.inquiryId === inquiry.id
                                ) || [];
                                
                                return relatedQuotations.length > 0 && (
                                  <div className="pt-4 border-t">
                                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                                      <FileText className="w-5 h-5 text-green-600" />
                                      Admin Response - Quotation Received
                                    </h3>
                                    <div className="space-y-4">
                                      {relatedQuotations.map((quote: any) => (
                                        <div key={quote.id} className="bg-green-50 border border-green-200 rounded-lg p-4">
                                          <div className="flex items-center justify-between mb-3">
                                            <div>
                                              <p className="font-semibold text-lg">{quote.quotationId}</p>
                                              <p className="text-sm text-gray-600">
                                                Sent on {new Date(quote.createdAt).toLocaleDateString()}
                                              </p>
                                            </div>
                                            <Badge className={`${
                                              quote.status === 'sent' ? 'bg-blue-100 text-blue-800' :
                                              quote.status === 'accepted' ? 'bg-green-100 text-green-800' :
                                              quote.status === 'expired' ? 'bg-red-100 text-red-800' :
                                              'bg-gray-100 text-gray-800'
                                            }`}>
                                              {quote.status}
                                            </Badge>
                                          </div>
                                          
                                          <div className="grid grid-cols-2 gap-4 mb-3">
                                            <div className="bg-white p-3 rounded">
                                              <p className="text-sm text-gray-600 mb-1">Unit Price</p>
                                              <p className="text-lg font-semibold text-green-700">
                                                {quote.currency} {parseFloat(quote.unitPrice).toLocaleString()}
                                              </p>
                                            </div>
                                            <div className="bg-white p-3 rounded">
                                              <p className="text-sm text-gray-600 mb-1">Total Amount</p>
                                              <p className="text-lg font-semibold text-green-700">
                                                {quote.currency} {parseFloat(quote.totalAmount).toLocaleString()}
                                              </p>
                                            </div>
                                          </div>
                                          
                                          <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                                            <div>
                                              <span className="font-medium">Quantity:</span> {quote.quantity} {quote.unit}
                                            </div>
                                            <div>
                                              <span className="font-medium">Valid Until:</span> {new Date(quote.validUntil).toLocaleDateString()}
                                            </div>
                                            <div>
                                              <span className="font-medium">Payment Terms:</span> {quote.paymentTerms}
                                            </div>
                                            <div>
                                              <span className="font-medium">Delivery Terms:</span> {quote.deliveryTerms}
                                            </div>
                                          </div>

                                          {quote.notes && (
                                            <div className="bg-white p-3 rounded mt-3">
                                              <p className="text-sm font-medium mb-1">Notes:</p>
                                              <p className="text-sm text-gray-700">{quote.notes}</p>
                                            </div>
                                          )}
                                          
                                          <div className="flex gap-2 mt-3 pt-3 border-t">
                                            <Button 
                                              size="sm"
                                              variant="outline"
                                              onClick={() => window.open(`/api/quotations/${quote.id}/pdf`, '_blank')}
                                            >
                                              <FileText className="w-4 h-4 mr-1" />
                                              Download PDF
                                            </Button>
                                            {quote.status === 'sent' && (
                                              <Button 
                                                size="sm"
                                                className="bg-green-600 hover:bg-green-700"
                                                onClick={() => acceptQuotationMutation.mutate(quote.id)}
                                                disabled={acceptQuotationMutation.isPending}
                                              >
                                                <Package className="w-4 h-4 mr-1" />
                                                {acceptQuotationMutation.isPending ? 'Accepting...' : 'Accept Quote'}
                                              </Button>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                );
                              })()}

                              {/* Timeline */}
                              <div className="pt-4 border-t">
                                <h3 className="font-semibold mb-3">Timeline</h3>
                                <div className="space-y-2 text-sm">
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                    <span className="font-medium">Created:</span>
                                    <span>{new Date(inquiry.createdAt).toLocaleString()}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                    <span className="font-medium">Last Updated:</span>
                                    <span>{new Date(inquiry.updatedAt).toLocaleString()}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <MessageSquare className="mx-auto w-12 h-12 text-gray-400 mb-4" />
                  <p className="text-gray-500">No inquiries found</p>
                  <Button className="mt-4" onClick={() => setLocation('/products')}>
                    <Plus className="w-4 h-4 mr-2" />
                    Submit Your First Inquiry
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="high-volume-bids" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                High Volume Bids
              </CardTitle>
              <CardDescription>Large quantity orders and bulk purchase requests</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Search and Filter */}
              <div className="mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search high volume bids..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {inquiriesLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="animate-pulse bg-gray-100 h-16 rounded"></div>
                  ))}
                </div>
              ) : highVolumeBids && highVolumeBids.length > 0 ? (
                <div className="space-y-4">
                  {highVolumeBids.map((bid: any) => (
                    <div key={bid.id} className="border-l-4 border-l-blue-500 border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-semibold text-lg">BID-{bid.id}</span>
                            <Badge className={getStatusColor(bid.status)}>
                              {bid.status}
                            </Badge>
                            <Badge variant="outline" className="bg-blue-50 text-blue-700">
                              {parseInt(bid.quantity) >= 10000 ? 'Premium Volume' : 'High Volume'}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="font-medium">Product:</span> {bid.productName}
                            </div>
                            <div>
                              <span className="font-medium text-blue-600">Volume:</span> {bid.quantity} {bid.unit}
                            </div>
                            <div>
                              <span className="font-medium">Bid ID:</span> {bid.inquiryId}
                            </div>
                          </div>
                          {bid.message && (
                            <div className="mt-3 p-3 bg-blue-50 rounded text-sm">
                              <span className="font-medium">Requirements:</span> {bid.message}
                            </div>
                          )}
                          <div className="flex items-center mt-2">
                            <Clock className="w-4 h-4 mr-1 text-gray-400" />
                            <span className="text-sm text-gray-500">
                              Submitted {formatDistanceToNow(new Date(bid.createdAt))} ago
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <Button 
                            variant="default" 
                            size="sm" 
                            className="bg-blue-600 hover:bg-blue-700"
                            onClick={() => {
                              setSelectedBidForTracking(bid);
                              setShowBidTrackingDialog(true);
                            }}
                            data-testid={`button-track-bid-${bid.id}`}
                          >
                            <MapPin className="w-4 h-4 mr-1" />
                            Track Status
                          </Button>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm" data-testid={`button-view-bid-${bid.id}`}>
                                <Eye className="w-4 h-4 mr-1" />
                                View Details
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-[95vw] sm:max-w-3xl max-h-[90vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle className="text-base sm:text-lg">High Volume Bid Details - {bid.inquiryId}</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-3 sm:space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                  <div>
                                    <p className="text-sm text-gray-600">Bid ID</p>
                                    <p className="font-medium">{bid.inquiryId}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-gray-600">Status</p>
                                    <Badge className={getStatusColor(bid.status)}>{bid.status}</Badge>
                                  </div>
                                  <div>
                                    <p className="text-sm text-gray-600">Product</p>
                                    <p className="font-medium">{bid.productName}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-gray-600">Quantity</p>
                                    <p className="font-medium text-blue-600">{bid.quantity} {bid.unit}</p>
                                  </div>
                                  {bid.targetPrice && (
                                    <div>
                                      <p className="text-sm text-gray-600">Target Price</p>
                                      <p className="font-medium">${bid.targetPrice}/{bid.unit}</p>
                                    </div>
                                  )}
                                  {bid.expectedDelivery && (
                                    <div>
                                      <p className="text-sm text-gray-600">Expected Delivery</p>
                                      <p className="font-medium">{format(new Date(bid.expectedDelivery), 'MMM dd, yyyy')}</p>
                                    </div>
                                  )}
                                  <div>
                                    <p className="text-sm text-gray-600">Urgency</p>
                                    <Badge variant="outline" className={getUrgencyColor(bid.urgency)}>
                                      {bid.urgency}
                                    </Badge>
                                  </div>
                                  <div>
                                    <p className="text-sm text-gray-600">Submitted</p>
                                    <p className="font-medium">{format(new Date(bid.createdAt), 'MMM dd, yyyy HH:mm')}</p>
                                  </div>
                                </div>
                                
                                {bid.message && (
                                  <div>
                                    <p className="text-sm text-gray-600 mb-2">Requirements</p>
                                    <div className="bg-blue-50 p-4 rounded-lg">
                                      <p className="text-sm">{bid.message}</p>
                                    </div>
                                  </div>
                                )}
                                
                                {bid.bidStatus && (
                                  <div>
                                    <p className="text-sm text-gray-600 mb-2">Approval Status</p>
                                    <div className="flex items-center space-x-2">
                                      {bid.bidStatus === 'pending' && <Badge className="bg-yellow-100 text-yellow-800">Awaiting Approval</Badge>}
                                      {bid.bidStatus === 'approved' && <Badge className="bg-green-100 text-green-800">Approved</Badge>}
                                      {bid.bidStatus === 'rejected' && <Badge className="bg-red-100 text-red-800">Rejected</Badge>}
                                      {bid.bidStatus === 'in_discussion' && <Badge className="bg-purple-100 text-purple-800">In Discussion</Badge>}
                                    </div>
                                    {bid.approvalNotes && (
                                      <div className="mt-2 bg-gray-50 p-3 rounded">
                                        <p className="text-sm font-medium text-gray-700">Manager Notes:</p>
                                        <p className="text-sm text-gray-600 mt-1">{bid.approvalNotes}</p>
                                      </div>
                                    )}
                                  </div>
                                )}
                                
                                {/* Quotations Response */}
                                {(() => {
                                  const relatedQuotations = quotations?.quotations?.filter(
                                    (q: any) => q.inquiryId === bid.id
                                  ) || [];
                                  
                                  return relatedQuotations.length > 0 && (
                                    <div className="pt-4 border-t">
                                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                                        <FileText className="w-5 h-5 text-green-600" />
                                        Admin Response - Revised Quote Received
                                      </h3>
                                      <div className="space-y-4">
                                        {relatedQuotations.map((quote: any) => (
                                          <div key={quote.id} className="bg-green-50 border border-green-200 rounded-lg p-4">
                                            <div className="flex items-center justify-between mb-3">
                                              <div>
                                                <p className="font-semibold text-lg">{quote.quotationId}</p>
                                                <p className="text-sm text-gray-600">
                                                  Sent on {new Date(quote.createdAt).toLocaleDateString()}
                                                </p>
                                              </div>
                                              <Badge className={`${
                                                quote.status === 'sent' ? 'bg-blue-100 text-blue-800' :
                                                quote.status === 'accepted' ? 'bg-green-100 text-green-800' :
                                                quote.status === 'expired' ? 'bg-red-100 text-red-800' :
                                                'bg-gray-100 text-gray-800'
                                              }`}>
                                                {quote.status}
                                              </Badge>
                                            </div>
                                            
                                            <div className="grid grid-cols-2 gap-4 mb-3">
                                              <div className="bg-white p-3 rounded">
                                                <p className="text-sm text-gray-600 mb-1">Unit Price</p>
                                                <p className="text-lg font-semibold text-green-700">
                                                  {quote.currency} {parseFloat(quote.unitPrice || quote.totalAmount).toLocaleString()}
                                                </p>
                                              </div>
                                              <div className="bg-white p-3 rounded">
                                                <p className="text-sm text-gray-600 mb-1">Total Amount</p>
                                                <p className="text-lg font-semibold text-green-700">
                                                  {quote.currency} {parseFloat(quote.totalAmount).toLocaleString()}
                                                </p>
                                              </div>
                                            </div>
                                            
                                            <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                                              <div>
                                                <span className="font-medium">Quantity:</span> {bid.quantity} {bid.unit}
                                              </div>
                                              <div>
                                                <span className="font-medium">Valid Until:</span> {new Date(quote.validUntil).toLocaleDateString()}
                                              </div>
                                            </div>

                                            {quote.terms && (
                                              <div className="bg-white p-3 rounded mt-3">
                                                <p className="text-sm font-medium mb-1">Terms & Conditions:</p>
                                                <p className="text-sm text-gray-700 whitespace-pre-line">{quote.terms}</p>
                                              </div>
                                            )}

                                            {quote.notes && (
                                              <div className="bg-white p-3 rounded mt-3">
                                                <p className="text-sm font-medium mb-1">Notes:</p>
                                                <p className="text-sm text-gray-700">{quote.notes}</p>
                                              </div>
                                            )}
                                            
                                            <div className="flex gap-2 mt-3 pt-3 border-t">
                                              <Button 
                                                size="sm"
                                                variant="outline"
                                                onClick={() => window.open(`/api/quotations/${quote.id}/pdf`, '_blank')}
                                                data-testid={`button-download-quote-pdf-${quote.id}`}
                                              >
                                                <FileText className="w-4 h-4 mr-1" />
                                                Download PDF
                                              </Button>
                                              {quote.status === 'sent' && (
                                                <Button 
                                                  size="sm"
                                                  className="bg-green-600 hover:bg-green-700"
                                                  onClick={() => acceptQuotationMutation.mutate(quote.id)}
                                                  disabled={acceptQuotationMutation.isPending}
                                                  data-testid={`button-accept-quote-${quote.id}`}
                                                >
                                                  <Package className="w-4 h-4 mr-1" />
                                                  {acceptQuotationMutation.isPending ? 'Accepting...' : 'Accept Quote'}
                                                </Button>
                                              )}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  );
                                })()}
                                
                                <div className="bg-blue-50 p-4 rounded-lg">
                                  <p className="text-sm text-blue-900">
                                    <strong>Next Steps:</strong> Our team will review your high volume bid request and respond within 24-48 hours. 
                                    {bid.bidStatus === 'approved' && ' Your bid has been approved and a sales representative will contact you shortly.'}
                                    {bid.bidStatus === 'pending' && ' We are currently reviewing your request.'}
                                  </p>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                          {bid.bidStatus === 'pending' && (
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button size="sm" data-testid={`button-track-bid-${bid.id}`}>
                                  <FileText className="w-4 h-4 mr-1" />
                                  Track Progress
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-[95vw] sm:max-w-2xl">
                                <DialogHeader>
                                  <DialogTitle className="text-base sm:text-lg">Bid Progress - {bid.inquiryId}</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-3 sm:space-y-4">
                                  <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white">✓</div>
                                    <div>
                                      <p className="font-medium">Bid Submitted</p>
                                      <p className="text-sm text-gray-600">{format(new Date(bid.createdAt), 'MMM dd, yyyy HH:mm')}</p>
                                    </div>
                                  </div>
                                  
                                  <div className={`flex items-center space-x-3 p-3 rounded-lg ${bid.bidStatus === 'approved' ? 'bg-green-50' : 'bg-gray-100'}`}>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${bid.bidStatus === 'approved' ? 'bg-green-500' : 'bg-gray-400'}`}>
                                      {bid.bidStatus === 'approved' ? '✓' : '2'}
                                    </div>
                                    <div>
                                      <p className="font-medium">Manager Approval</p>
                                      <p className="text-sm text-gray-600">
                                        {bid.bidStatus === 'approved' ? 'Approved on ' + (bid.approvedAt ? format(new Date(bid.approvedAt), 'MMM dd, yyyy') : 'Recently') : 'Pending review'}
                                      </p>
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center space-x-3 p-3 bg-gray-100 rounded-lg">
                                    <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center text-white">3</div>
                                    <div>
                                      <p className="font-medium">Sales Discussion</p>
                                      <p className="text-sm text-gray-600">Awaiting approval</p>
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center space-x-3 p-3 bg-gray-100 rounded-lg">
                                    <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center text-white">4</div>
                                    <div>
                                      <p className="font-medium">Quotation Sent</p>
                                      <p className="text-sm text-gray-600">Awaiting approval</p>
                                    </div>
                                  </div>
                                  
                                  <div className="bg-blue-50 p-4 rounded-lg mt-4">
                                    <p className="text-sm text-blue-900">
                                      <strong>Current Status:</strong> {bid.bidStatus === 'pending' ? 'Your bid is under review by our management team.' : 'Your bid has been approved and is being processed by our sales team.'}
                                    </p>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <TrendingUp className="mx-auto w-12 h-12 text-gray-400 mb-4" />
                  <p className="text-gray-500">No high volume bids found</p>
                  <Button className="mt-4">
                    <Plus className="w-4 h-4 mr-2" />
                    Submit High Volume Bid
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="received-quotes" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Received Quotes
              </CardTitle>
              <CardDescription>All quotations received from our sales team</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Search and Filter */}
              <div className="mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search received quotes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Quotation Process Flow */}
              <div className="mb-6 p-4 bg-green-50 rounded-lg">
                <h3 className="font-semibold text-green-900 mb-3 flex items-center">
                  <FileText className="w-4 h-4 mr-2" />
                  Quotation Status Guide
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-yellow-100 text-yellow-800">Draft</Badge>
                    <span className="text-xs">Being prepared by sales team</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-blue-100 text-blue-800">Sent</Badge>
                    <span className="text-xs">Ready for your review</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-100 text-green-800">Accepted</Badge>
                    <span className="text-xs">Confirmed and processing</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-red-100 text-red-800">Expired</Badge>
                    <span className="text-xs">Past validity date</span>
                  </div>
                </div>
              </div>

              {quotationsLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="animate-pulse bg-gray-100 h-20 rounded"></div>
                  ))}
                </div>
              ) : (quotations as any)?.quotations && (quotations as any).quotations.length > 0 ? (
                <div className="space-y-4">
                  {(quotations as any).quotations.map((quotation: any) => (
                    <div key={quotation.id} className="border border-green-200 bg-green-50 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-3">
                            <span className="font-semibold text-lg">{quotation.quotationId}</span>
                            <Badge className={`${
                              quotation.status === 'sent' ? 'bg-blue-100 text-blue-800' :
                              quotation.status === 'accepted' ? 'bg-green-100 text-green-800' :
                              quotation.status === 'expired' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {quotation.status}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm mb-3">
                            <div>
                              <span className="font-medium">Product:</span> {quotation.productName}
                            </div>
                            <div>
                              <span className="font-medium">Quantity:</span> {quotation.quantity} {quotation.unit}
                            </div>
                            <div>
                              <span className="font-medium">Total Price:</span> {quotation.currency} {quotation.totalAmount?.toLocaleString()}
                            </div>
                            <div>
                              <span className="font-medium">Valid Until:</span> {new Date(quotation.validUntil).toLocaleDateString()}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="font-medium">Payment Terms:</span> {quotation.paymentTerms}
                            </div>
                            <div>
                              <span className="font-medium">Delivery Terms:</span> {quotation.deliveryTerms}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex space-x-2 ml-4">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Eye className="w-4 h-4 mr-1" />
                                View Details
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[90vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle className="text-base sm:text-lg">Quotation Details - {quotation.quotationId}</DialogTitle>
                                <DialogDescription className="text-sm">
                                  Complete quotation information and pricing details
                                </DialogDescription>
                              </DialogHeader>
                              
                              <div className="space-y-4 sm:space-y-6">
                                {/* Quotation Header */}
                                <div className="border-b pb-3 sm:pb-4">
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                    <div>
                                      <h3 className="font-semibold mb-2">Quotation Information</h3>
                                      <div className="space-y-1 text-sm">
                                        <p><span className="font-medium">Quote ID:</span> {quotation.quotationId}</p>
                                        <p><span className="font-medium">Date:</span> {new Date(quotation.createdAt).toLocaleDateString()}</p>
                                        <p><span className="font-medium">Valid Until:</span> {new Date(quotation.validUntil).toLocaleDateString()}</p>
                                        <p><span className="font-medium">Status:</span> 
                                          <Badge className={`ml-2 ${
                                            quotation.status === 'sent' ? 'bg-blue-100 text-blue-800' :
                                            quotation.status === 'accepted' ? 'bg-green-100 text-green-800' :
                                            quotation.status === 'expired' ? 'bg-red-100 text-red-800' :
                                            'bg-gray-100 text-gray-800'
                                          }`}>
                                            {quotation.status}
                                          </Badge>
                                        </p>
                                      </div>
                                    </div>
                                    <div>
                                      <h3 className="font-semibold mb-2">Product Details</h3>
                                      <div className="space-y-1 text-sm">
                                        <p><span className="font-medium">Product:</span> {quotation.productName}</p>
                                        <p><span className="font-medium">Quantity:</span> {quotation.quantity} {quotation.unit}</p>
                                        <p><span className="font-medium">Unit Price:</span> {quotation.currency} {quotation.unitPrice}</p>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Pricing Details */}
                                <div>
                                  <h3 className="font-semibold mb-3">Pricing Breakdown</h3>
                                  <div className="bg-gray-50 p-4 rounded-lg">
                                    <div className="space-y-2 text-sm">
                                      <div className="flex justify-between">
                                        <span>Unit Price:</span>
                                        <span>{quotation.currency} {quotation.unitPrice}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span>Quantity:</span>
                                        <span>{quotation.quantity} {quotation.unit}</span>
                                      </div>
                                      <div className="border-t pt-2 flex justify-between font-semibold">
                                        <span>Total Amount:</span>
                                        <span>{quotation.currency} {quotation.totalAmount?.toLocaleString()}</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Terms and Conditions */}
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <h3 className="font-semibold mb-2">Payment Terms</h3>
                                    <p className="text-sm bg-blue-50 p-3 rounded">{quotation.paymentTerms}</p>
                                  </div>
                                  <div>
                                    <h3 className="font-semibold mb-2">Delivery Terms</h3>
                                    <p className="text-sm bg-blue-50 p-3 rounded">{quotation.deliveryTerms}</p>
                                  </div>
                                </div>

                                {/* Company Information */}
                                <div className="space-y-3">
                                  <h3 className="text-lg font-semibold border-b pb-2">Company Information</h3>
                                  <div className="p-4 bg-green-50 rounded-lg">
                                    <h4 className="font-semibold">Bright Fame Organic Pvt. Ltd.</h4>
                                        <p className="text-sm">Opp. Murlidhar Guest House, Mehsana-Vishnagar Road</p>
                                    <p className="text-sm">Kansarakui, Mehsana, Gujarat 384001</p>
                                    <p className="text-sm mt-2">Phone: +91-7249847439</p>
                                    <p className="text-sm">Email: admin@bright-organic.com</p>
                                  </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-3 pt-4 border-t">
                                  {quotation.status === 'sent' && (
                                    <Button 
                                      className="bg-green-600 hover:bg-green-700"
                                      onClick={() => acceptQuotationMutation.mutate(quotation.id)}
                                      disabled={acceptQuotationMutation.isPending}
                                    >
                                      <Package className="w-4 h-4 mr-2" />
                                      {acceptQuotationMutation.isPending ? 'Accepting...' : 'Accept Quotation'}
                                    </Button>
                                  )}
                                  <Button 
                                    variant="outline"
                                    onClick={() => window.open(`/api/quotations/${quotation.id}/pdf`, '_blank')}
                                  >
                                    <FileText className="w-4 h-4 mr-2" />
                                    Download PDF
                                  </Button>
                                  <Button variant="outline">
                                    <MessageSquare className="w-4 h-4 mr-2" />
                                    Contact Sales
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                          
                          {quotation.status === 'sent' && (
                            <Button 
                              size="sm" 
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => acceptQuotationMutation.mutate(quotation.id)}
                              disabled={acceptQuotationMutation.isPending}
                            >
                              <Package className="w-4 h-4 mr-1" />
                              {acceptQuotationMutation.isPending ? 'Accepting...' : 'Accept'}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="mx-auto w-12 h-12 text-gray-400 mb-4" />
                  <p className="text-gray-500">No quotations received yet</p>
                  <p className="text-xs text-gray-400 mb-4">Quotations will appear here after our sales team reviews your inquiries.</p>
                  <Button className="mt-4">
                    <Plus className="w-4 h-4 mr-2" />
                    Submit an Inquiry
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );

  const renderSavedProducts = () => (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Saved Products</h1>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="w-5 h-5" />
            Saved Products
          </CardTitle>
          <CardDescription>Products you've saved for later reference</CardDescription>
        </CardHeader>
        <CardContent>
          {savedLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="animate-pulse bg-gray-100 h-16 rounded"></div>
              ))}
            </div>
          ) : savedProducts && savedProducts.length ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedProducts.map((product: any) => (
                <div key={product.id} className="border rounded-lg p-4">
                  <h3 className="font-semibold">{product.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">{product.category}</p>
                  <div className="mt-3 flex justify-between items-center">
                    <span className="text-lg font-bold">${product.price}</span>
                    <Button size="sm">View Details</Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Heart className="mx-auto w-12 h-12 text-gray-400 mb-4" />
              <p className="text-gray-500">No saved products yet</p>
              <Button className="mt-4">Browse Products</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderQuotations = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">My Quotations</h1>
        <Button 
          variant="outline"
          size="sm"
          data-testid="button-refresh-quotations"
          onClick={() => refetchQuotations()}
          disabled={isRefetchingQuotations}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isRefetchingQuotations ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>
      
      {/* Quotation Process Explanation */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <TrendingUp className="w-5 h-5" />
            How the Quotation Process Works
          </CardTitle>
        </CardHeader>
        <CardContent className="text-blue-800">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-2">
                <MessageSquare className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-sm">1. Submit Inquiry</h3>
              <p className="text-xs mt-1">You submit a product inquiry with quantity and requirements</p>
            </div>
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-2">
                <User className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-sm">2. Sales Review</h3>
              <p className="text-xs mt-1">Our sales team reviews your inquiry and prepares a detailed quotation</p>
            </div>
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-2">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-sm">3. Quotation Sent</h3>
              <p className="text-xs mt-1">You receive a formal quotation with pricing, terms, and validity period</p>
            </div>
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-2">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-sm">4. Place Order</h3>
              <p className="text-xs mt-1">Accept the quotation to proceed with your order</p>
            </div>
          </div>
          <div className="mt-4 p-3 bg-blue-100 rounded-lg">
            <p className="text-sm font-medium">💡 Pro Tip:</p>
            <p className="text-xs mt-1">All quotations include multi-currency pricing (USD, EUR, GBP, INR, etc.) and international trade terms (Ex-Warehouse, FOB, CIF, DDP) for global compliance.</p>
          </div>
        </CardContent>
      </Card>

      {/* Quotation Status Guide */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Badge className="w-5 h-5" />
            Quotation Status Guide
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <Badge className="bg-yellow-100 text-yellow-800">Draft</Badge>
              <span className="text-sm">Being prepared by sales team</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-blue-100 text-blue-800">Sent</Badge>
              <span className="text-sm">Quotation sent to you for review</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-green-100 text-green-800">Accepted</Badge>
              <span className="text-sm">You've accepted, ready for order</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-red-100 text-red-800">Expired</Badge>
              <span className="text-sm">Validity period has ended</span>
            </div>
          </div>
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm font-medium text-green-800">📋 Inquiry Status Update:</p>
            <p className="text-xs mt-1 text-green-700">When you receive a quotation, your original inquiry status automatically changes to "Responded" to show that we've addressed your request.</p>
          </div>
        </CardContent>
      </Card>

      {/* Active Quotations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            My Quotations
          </CardTitle>
          <CardDescription>View and manage your quotation requests</CardDescription>
          <div className="flex gap-2 mt-4">
            <Badge variant="outline" className="text-xs">
              📋 <strong>Sent:</strong> Ready for your review and acceptance
            </Badge>
            <Badge variant="outline" className="text-xs">
              ✅ <strong>Accepted:</strong> Orders confirmed and processing
            </Badge>
            <Badge variant="outline" className="text-xs">
              ⏰ <strong>Expired:</strong> Past validity date
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {quotationsLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="animate-pulse bg-gray-100 h-16 rounded"></div>
              ))}
            </div>
          ) : quotations && quotations.quotations && quotations.quotations.length ? (
            <div className="space-y-4">
              {quotations.quotations.map((quotation: any) => (
                <div key={quotation.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg">{quotation.quotationId}</h3>
                        <Badge className={getStatusColor(quotation.status)}>
                          {quotation.status}
                        </Badge>
                        {quotation.currency && (
                          <Badge variant="outline" className="text-xs">
                            {quotation.currency}
                          </Badge>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Total Amount:</span> 
                          <span className="ml-1 text-lg font-bold text-green-600">
                            {quotation.currency || 'USD'} {quotation.totalAmount}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium">Price Type:</span> 
                          <span className="ml-1 capitalize">{quotation.priceType?.replace('_', ' ') || 'Ex-Warehouse'}</span>
                        </div>
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-1 text-gray-400" />
                          <span>
                            Valid until: {quotation.validUntil ? 
                              new Date(quotation.validUntil).toLocaleDateString() : 
                              'Not specified'
                            }
                          </span>
                        </div>
                      </div>
                      {quotation.terms && (
                        <div className="mt-3 p-3 bg-gray-50 rounded text-sm">
                          <span className="font-medium">Terms & Conditions:</span>
                          <p className="mt-1 whitespace-pre-line">{quotation.terms}</p>
                        </div>
                      )}
                      {quotation.notes && (
                        <div className="mt-2 p-2 bg-blue-50 rounded text-sm">
                          <span className="font-medium">Notes:</span> {quotation.notes}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => setSelectedQuotation(quotation)}>
                            <Eye className="w-4 h-4 mr-1" />
                            View Details
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
                              <FileText className="w-5 h-5" />
                              Quotation Details - {quotation.quotationId}
                            </DialogTitle>
                            <DialogDescription className="text-sm">
                              Complete quotation information and terms
                            </DialogDescription>
                          </DialogHeader>
                          
                          <div className="space-y-4 sm:space-y-6">
                            {/* Header Section */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 p-3 sm:p-4 bg-gray-50 rounded-lg">
                              <div>
                                <h4 className="font-semibold text-sm text-gray-600">Quotation ID</h4>
                                <p className="text-lg font-bold">{quotation.quotationId}</p>
                              </div>
                              <div>
                                <h4 className="font-semibold text-sm text-gray-600">Status</h4>
                                <Badge className={getStatusColor(quotation.status)}>
                                  {quotation.status}
                                </Badge>
                              </div>
                              <div>
                                <h4 className="font-semibold text-sm text-gray-600">Created Date</h4>
                                <p>{quotation.createdAt ? new Date(quotation.createdAt).toLocaleDateString() : 'N/A'}</p>
                              </div>
                            </div>

                            {/* Pricing Section */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="space-y-4">
                                <h3 className="text-lg font-semibold border-b pb-2">Pricing Details</h3>
                                <div className="space-y-3">
                                  <div>
                                    <span className="font-medium">Total Amount:</span>
                                    <div className="text-2xl font-bold text-green-600">
                                      {quotation.currency || 'USD'} {quotation.totalAmount}
                                    </div>
                                  </div>
                                  <div>
                                    <span className="font-medium">Price Type:</span>
                                    <div className="text-lg capitalize">
                                      {quotation.priceType?.replace('_', ' ') || 'Ex-Warehouse'}
                                    </div>
                                  </div>
                                  <div>
                                    <span className="font-medium">Currency:</span>
                                    <div className="text-lg">{quotation.currency || 'USD'}</div>
                                  </div>
                                </div>
                              </div>

                              <div className="space-y-4">
                                <h3 className="text-lg font-semibold border-b pb-2">Validity & Timeline</h3>
                                <div className="space-y-3">
                                  <div>
                                    <span className="font-medium">Valid Until:</span>
                                    <div className="text-lg">
                                      {quotation.validUntil ? 
                                        new Date(quotation.validUntil).toLocaleDateString() : 
                                        'Not specified'
                                      }
                                    </div>
                                  </div>
                                  <div>
                                    <span className="font-medium">Created:</span>
                                    <div>{quotation.createdAt ? new Date(quotation.createdAt).toLocaleDateString() : 'N/A'}</div>
                                  </div>
                                  <div>
                                    <span className="font-medium">Last Updated:</span>
                                    <div>{quotation.updatedAt ? new Date(quotation.updatedAt).toLocaleDateString() : 'N/A'}</div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Terms and Conditions */}
                            {quotation.terms && (
                              <div className="space-y-3">
                                <h3 className="text-lg font-semibold border-b pb-2">Terms & Conditions</h3>
                                <div className="p-4 bg-gray-50 rounded-lg">
                                  <pre className="whitespace-pre-wrap text-sm">{quotation.terms}</pre>
                                </div>
                              </div>
                            )}

                            {/* Notes */}
                            {quotation.notes && (
                              <div className="space-y-3">
                                <h3 className="text-lg font-semibold border-b pb-2">Additional Notes</h3>
                                <div className="p-4 bg-blue-50 rounded-lg">
                                  <p className="text-sm">{quotation.notes}</p>
                                </div>
                              </div>
                            )}

                            {/* Company Information */}
                            <div className="space-y-3">
                              <h3 className="text-lg font-semibold border-b pb-2">Company Information</h3>
                              <div className="p-4 bg-green-50 rounded-lg">
                                <h4 className="font-semibold">Bright Fame Organic Pvt. Ltd.</h4>
                                <p className="text-sm">Opp. Murlidhar Guest House, Mehsana-Vishnagar Road</p>
                                <p className="text-sm">Kansarakui, Mehsana, Gujarat 384001</p>
                                <p className="text-sm mt-2">Phone: +91-7249847439</p>
                                <p className="text-sm">Email: admin@bright-organic.com</p>
                              </div>
                            </div>

                            {/* Counter-Offer Info */}
                            {quotation.customerCounterPrice && (
                              <div className="space-y-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                                <h3 className="text-lg font-semibold text-amber-900 border-b border-amber-200 pb-2">
                                  Your Counter-Offer
                                </h3>
                                <div className="space-y-2">
                                  <div>
                                    <span className="font-medium text-amber-900">Counter Price:</span>
                                    <div className="text-2xl font-bold text-amber-700">
                                      {quotation.currency || 'USD'} {quotation.customerCounterPrice}
                                    </div>
                                  </div>
                                  {quotation.counterOfferNotes && (
                                    <div>
                                      <span className="font-medium text-amber-900">Your Notes:</span>
                                      <p className="text-sm text-amber-800 mt-1">{quotation.counterOfferNotes}</p>
                                    </div>
                                  )}
                                  <div className="text-xs text-amber-700 bg-amber-100 p-2 rounded">
                                    ⏳ Awaiting sales team review and response
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex gap-3 pt-4 border-t">
                              {quotation.status === 'sent' && (
                                <>
                                  <Button 
                                    className="bg-green-600 hover:bg-green-700"
                                    onClick={() => acceptQuotationMutation.mutate(quotation.id)}
                                    disabled={acceptQuotationMutation.isPending}
                                    data-testid="button-accept-quote"
                                  >
                                    <Package className="w-4 h-4 mr-2" />
                                    {acceptQuotationMutation.isPending ? 'Accepting...' : 'Accept Quotation'}
                                  </Button>
                                  <Button 
                                    variant="outline"
                                    className="border-blue-600 text-blue-600 hover:bg-blue-50"
                                    onClick={() => {
                                      setSelectedQuotation(quotation);
                                      setCounterPrice("");
                                      setCounterNotes("");
                                      setShowCounterOfferDialog(true);
                                    }}
                                    data-testid="button-counter-offer"
                                  >
                                    <DollarSign className="w-4 h-4 mr-2" />
                                    Make Counter-Offer
                                  </Button>
                                </>
                              )}
                              <Button variant="outline">
                                <FileText className="w-4 h-4 mr-2" />
                                Download PDF
                              </Button>
                              <Button variant="outline">
                                <MessageSquare className="w-4 h-4 mr-2" />
                                Contact Sales
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                      {quotation.status === 'sent' && (
                        <Button 
                          size="sm" 
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => acceptQuotationMutation.mutate(quotation.id)}
                          disabled={acceptQuotationMutation.isPending}
                        >
                          <Package className="w-4 h-4 mr-1" />
                          {acceptQuotationMutation.isPending ? 'Accepting...' : 'Accept Quote'}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="mx-auto w-12 h-12 text-gray-400 mb-4" />
              <p className="text-gray-500 mb-2">No quotations found</p>
              <p className="text-xs text-gray-400 mb-4">
                Submit an inquiry to receive your first quotation
              </p>
              <Button onClick={() => setLocation('/customer/inquiries')}>
                <Plus className="w-4 h-4 mr-2" />
                Submit New Inquiry
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Counter-Offer Dialog */}
      <Dialog open={showCounterOfferDialog} onOpenChange={setShowCounterOfferDialog}>
        <DialogContent data-testid="dialog-counter-offer">
          <DialogHeader>
            <DialogTitle>Make Counter-Offer</DialogTitle>
            <DialogDescription>
              {selectedQuotation && `${(selectedQuotation as any).quotationId} - Current Price: ${(selectedQuotation as any).currency || 'USD'} ${(selectedQuotation as any).totalAmount}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                💡 <strong>Negotiation Tip:</strong> Our sales team reviews all counter-offers. 
                Provide your target price and explain your reasoning to help reach a mutual agreement.
              </p>
            </div>
            <div>
              <Label htmlFor="counter-price">Your Counter Price *</Label>
              <Input
                id="counter-price"
                type="number"
                step="0.01"
                placeholder="Enter your proposed price"
                value={counterPrice}
                onChange={(e) => setCounterPrice(e.target.value)}
                data-testid="input-counter-price"
              />
              {selectedQuotation && (
                <p className="text-xs text-gray-500 mt-1">
                  Current quotation: {(selectedQuotation as any).currency || 'USD'} {(selectedQuotation as any).totalAmount}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="counter-notes">Explanation (Optional)</Label>
              <Textarea
                id="counter-notes"
                placeholder="Explain why you're proposing this price (e.g., budget constraints, market rates, bulk order discount request)"
                value={counterNotes}
                onChange={(e) => setCounterNotes(e.target.value)}
                rows={4}
                data-testid="input-counter-notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCounterOfferDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!counterPrice || parseFloat(counterPrice) <= 0) {
                  toast({
                    title: "Invalid Price",
                    description: "Please enter a valid counter price",
                    variant: "destructive",
                  });
                  return;
                }
                counterOfferMutation.mutate({
                  quotationId: (selectedQuotation as any).id,
                  price: parseFloat(counterPrice),
                  notes: counterNotes
                });
              }}
              disabled={counterOfferMutation.isPending || !counterPrice}
              className="bg-blue-600 hover:bg-blue-700"
              data-testid="button-submit-counter-offer"
            >
              {counterOfferMutation.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</>
              ) : (
                <>Submit Counter-Offer</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );

  const renderDownloads = () => (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Downloads</h1>
      <Card>
        <CardHeader>
          <CardTitle>Available Downloads</CardTitle>
          <CardDescription>Access your certificates, specifications and documents</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <FileText className="mx-auto w-12 h-12 text-gray-400 mb-4" />
            <p className="text-gray-500">No downloads available yet</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderCatalogs = () => (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Product Catalogs</h1>
      <Card>
        <CardHeader>
          <CardTitle>Available Catalogs</CardTitle>
          <CardDescription>Browse our latest product catalogs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Package className="mx-auto w-12 h-12 text-gray-400 mb-4" />
            <p className="text-gray-500">No catalogs available yet</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderProfile = () => (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Profile Information
          </CardTitle>
          <CardDescription>Manage your account details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">First Name</label>
                <p className="text-lg">{customer?.firstName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Last Name</label>
                <p className="text-lg">{customer?.lastName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Email</label>
                <p className="text-lg">{customer?.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Company</label>
                <p className="text-lg">{customer?.companyName}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderHighVolumeBids = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">High Volume Bids</h1>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          New Bid Request
        </Button>
      </div>

      {/* High Volume Bids List */}
      <div className="space-y-4">
        {inquiriesLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : highVolumeBids && highVolumeBids.length > 0 ? (
          highVolumeBids.map((bid: any) => (
            <Card key={bid.id} className="hover:shadow-md transition-shadow border-l-4 border-l-blue-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                    <div>
                      <h3 className="font-semibold text-lg">BID-{bid.id}</h3>
                      <p className="text-sm text-gray-500">High Volume Bid Request</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={`${getStatusColor(bid.status)}`}>
                      {bid.status}
                    </Badge>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700">
                      {parseInt(bid.quantity) >= 10000 ? 'Premium Volume' : 'High Volume'}
                    </Badge>
                  </div>
                </div>
                
                <div className="grid md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600">Product</p>
                    <p className="font-medium">{bid.productName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Volume</p>
                    <p className="font-medium text-blue-600">{bid.quantity} {bid.unit}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Bid ID</p>
                    <p className="font-medium">{bid.inquiryId}</p>
                  </div>
                </div>
                
                {bid.message && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-600">Requirements</p>
                    <p className="text-sm bg-blue-50 p-3 rounded">{bid.message}</p>
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-500">
                      Submitted {bid.createdAt && formatDistanceToNow(new Date(bid.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <div className="flex space-x-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" data-testid={`button-view-bid-${bid.id}`}>
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-[95vw] sm:max-w-3xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle className="text-base sm:text-lg">High Volume Bid Details - {bid.inquiryId}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-3 sm:space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                            <div>
                              <p className="text-sm text-gray-600">Bid ID</p>
                              <p className="font-medium">{bid.inquiryId}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Status</p>
                              <Badge className={getStatusColor(bid.status)}>{bid.status}</Badge>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Product</p>
                              <p className="font-medium">{bid.productName}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Quantity</p>
                              <p className="font-medium text-blue-600">{bid.quantity} {bid.unit}</p>
                            </div>
                            {bid.targetPrice && (
                              <div>
                                <p className="text-sm text-gray-600">Target Price</p>
                                <p className="font-medium">${bid.targetPrice}/{bid.unit}</p>
                              </div>
                            )}
                            {bid.expectedDelivery && (
                              <div>
                                <p className="text-sm text-gray-600">Expected Delivery</p>
                                <p className="font-medium">{format(new Date(bid.expectedDelivery), 'MMM dd, yyyy')}</p>
                              </div>
                            )}
                            <div>
                              <p className="text-sm text-gray-600">Urgency</p>
                              <Badge variant="outline" className={getUrgencyColor(bid.urgency)}>
                                {bid.urgency}
                              </Badge>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Submitted</p>
                              <p className="font-medium">{format(new Date(bid.createdAt), 'MMM dd, yyyy HH:mm')}</p>
                            </div>
                          </div>
                          
                          {bid.message && (
                            <div>
                              <p className="text-sm text-gray-600 mb-2">Requirements</p>
                              <div className="bg-blue-50 p-4 rounded-lg">
                                <p className="text-sm">{bid.message}</p>
                              </div>
                            </div>
                          )}
                          
                          {bid.bidStatus && (
                            <div>
                              <p className="text-sm text-gray-600 mb-2">Approval Status</p>
                              <div className="flex items-center space-x-2">
                                {bid.bidStatus === 'pending' && <Badge className="bg-yellow-100 text-yellow-800">Awaiting Approval</Badge>}
                                {bid.bidStatus === 'approved' && <Badge className="bg-green-100 text-green-800">Approved</Badge>}
                                {bid.bidStatus === 'rejected' && <Badge className="bg-red-100 text-red-800">Rejected</Badge>}
                                {bid.bidStatus === 'in_discussion' && <Badge className="bg-purple-100 text-purple-800">In Discussion</Badge>}
                              </div>
                              {bid.approvalNotes && (
                                <div className="mt-2 bg-gray-50 p-3 rounded">
                                  <p className="text-sm font-medium text-gray-700">Manager Notes:</p>
                                  <p className="text-sm text-gray-600 mt-1">{bid.approvalNotes}</p>
                                </div>
                              )}
                            </div>
                          )}
                          
                          <div className="bg-blue-50 p-4 rounded-lg">
                            <p className="text-sm text-blue-900">
                              <strong>Next Steps:</strong> Our team will review your high volume bid request and respond within 24-48 hours. 
                              {bid.bidStatus === 'approved' && ' Your bid has been approved and a sales representative will contact you shortly.'}
                              {bid.bidStatus === 'pending' && ' We are currently reviewing your request.'}
                            </p>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                    {bid.bidStatus === 'pending' && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" data-testid={`button-track-bid-${bid.id}`}>
                            <FileText className="w-4 h-4 mr-2" />
                            Track Progress
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-[95vw] sm:max-w-2xl">
                          <DialogHeader>
                            <DialogTitle className="text-base sm:text-lg">Bid Progress - {bid.inquiryId}</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-3 sm:space-y-4">
                            <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white">✓</div>
                              <div>
                                <p className="font-medium">Bid Submitted</p>
                                <p className="text-sm text-gray-600">{format(new Date(bid.createdAt), 'MMM dd, yyyy HH:mm')}</p>
                              </div>
                            </div>
                            
                            <div className={`flex items-center space-x-3 p-3 rounded-lg ${bid.bidStatus === 'approved' ? 'bg-green-50' : 'bg-gray-100'}`}>
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${bid.bidStatus === 'approved' ? 'bg-green-500' : 'bg-gray-400'}`}>
                                {bid.bidStatus === 'approved' ? '✓' : '2'}
                              </div>
                              <div>
                                <p className="font-medium">Manager Approval</p>
                                <p className="text-sm text-gray-600">
                                  {bid.bidStatus === 'approved' ? 'Approved on ' + (bid.approvedAt ? format(new Date(bid.approvedAt), 'MMM dd, yyyy') : 'Recently') : 'Pending review'}
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-3 p-3 bg-gray-100 rounded-lg">
                              <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center text-white">3</div>
                              <div>
                                <p className="font-medium">Sales Discussion</p>
                                <p className="text-sm text-gray-600">Awaiting approval</p>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-3 p-3 bg-gray-100 rounded-lg">
                              <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center text-white">4</div>
                              <div>
                                <p className="font-medium">Quotation Sent</p>
                                <p className="text-sm text-gray-600">Awaiting approval</p>
                              </div>
                            </div>
                            
                            <div className="bg-blue-50 p-4 rounded-lg mt-4">
                              <p className="text-sm text-blue-900">
                                <strong>Current Status:</strong> {bid.bidStatus === 'pending' ? 'Your bid is under review by our management team.' : 'Your bid has been approved and is being processed by our sales team.'}
                              </p>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No high volume bids yet</h3>
              <p className="text-gray-600 mb-4">You haven't submitted any high volume bid requests yet.</p>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Submit High Volume Bid
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );

  const renderSampleRequests = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Sample Requests</h1>
        <Button 
          variant="outline"
          size="sm"
          data-testid="button-refresh-sample-requests"
          onClick={() => refetchSampleRequests()}
          disabled={isRefetchingSampleRequests}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isRefetchingSampleRequests ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Sample Requests List */}
      <div className="space-y-4">
        {sampleRequestsLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (sampleRequests as any)?.requests && (sampleRequests as any).requests.length > 0 ? (
          (sampleRequests as any).requests.map((request: any) => (
            <Card key={request.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <Package className="w-5 h-5 text-purple-600" />
                    <div>
                      <h3 className="font-semibold text-lg">{request.requestId}</h3>
                      <p className="text-sm text-gray-500">Sample Request</p>
                    </div>
                  </div>
                  <Badge className={`${getStatusColor(request.status || 'pending')}`}>
                    {request.status || 'pending'}
                  </Badge>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600">Product</p>
                    <p className="font-medium">{request.productName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Customer</p>
                    <p className="font-medium">{request.customerName}</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-500">
                      Requested {request.createdAt && formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {request.status === "shipped" && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => markSampleDeliveredMutation.mutate(request.id)}
                        disabled={markSampleDeliveredMutation.isPending}
                        className="text-green-600 hover:text-green-700"
                        data-testid={`button-mark-delivered-${request.id}`}
                      >
                        <Check className="w-4 h-4 mr-2" />
                        {markSampleDeliveredMutation.isPending ? "Marking..." : "Mark as Delivered"}
                      </Button>
                    )}
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setSelectedSampleRequest(request);
                        setShowSampleTrackingDialog(true);
                      }}
                      data-testid={`button-track-${request.id}`}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Track Sample
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No sample requests yet</h3>
              <p className="text-gray-600">You haven't requested any product samples yet.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );

  // Sample Request Timeline Component
  const getTimelineStatus = (currentStatus: string, stepStatus: string) => {
    const statuses = ['pending', 'approved', 'shipped', 'completed'];
    const currentIndex = statuses.indexOf(currentStatus);
    const stepIndex = statuses.indexOf(stepStatus);
    
    if (currentStatus === 'rejected') {
      return stepStatus === 'rejected' ? 'rejected' : 'inactive';
    }
    
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'active';
    return 'inactive';
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <CustomerSidebar />
      
      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-4 sm:p-6 lg:p-8">
          {/* Render main content based on route */}
          {renderMainContent()}
        </div>
      </div>

      {/* Sample Request Tracking Dialog */}
      <Dialog open={showSampleTrackingDialog} onOpenChange={setShowSampleTrackingDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">Sample Request Tracking</DialogTitle>
            <DialogDescription className="text-sm">
              Request ID: {selectedSampleRequest?.requestId}
            </DialogDescription>
          </DialogHeader>
          
          {selectedSampleRequest && (
            <div className="space-y-4 sm:space-y-6">
              {/* Visual Timeline */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg">
                <h3 className="font-semibold mb-4 text-gray-900">Tracking Status</h3>
                <div className="flex items-center justify-between relative">
                  {/* Progress Line */}
                  <div className="absolute top-6 left-0 right-0 h-1 bg-gray-200 z-0"></div>
                  <div 
                    className="absolute top-6 left-0 h-1 bg-green-500 z-0 transition-all duration-500"
                    style={{
                      width: selectedSampleRequest.status === 'completed' ? '100%' : 
                             selectedSampleRequest.status === 'shipped' ? '66%' : 
                             selectedSampleRequest.status === 'approved' ? '33%' : '0%'
                    }}
                  ></div>
                  
                  {/* Status Steps */}
                  {[
                    { status: 'pending', label: 'Pending', icon: Clock },
                    { status: 'approved', label: 'Approved', icon: Check },
                    { status: 'shipped', label: 'Shipped', icon: Truck },
                    { status: 'completed', label: 'Delivered', icon: Package }
                  ].map((step, index) => {
                    const stepStatus = getTimelineStatus(selectedSampleRequest.status, step.status);
                    const Icon = step.icon;
                    
                    return (
                      <div key={step.status} className="flex flex-col items-center relative z-10">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-all ${
                          stepStatus === 'completed' ? 'bg-green-500 text-white' :
                          stepStatus === 'active' ? 'bg-blue-500 text-white animate-pulse' :
                          stepStatus === 'rejected' ? 'bg-red-500 text-white' :
                          'bg-gray-200 text-gray-400'
                        }`}>
                          <Icon className="w-6 h-6" />
                        </div>
                        <span className={`text-xs font-medium ${
                          stepStatus === 'completed' || stepStatus === 'active' ? 'text-gray-900' : 'text-gray-400'
                        }`}>
                          {step.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
                
                {selectedSampleRequest.status === 'rejected' && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-red-800 text-sm">
                    <strong>Request Rejected</strong>
                    {selectedSampleRequest.notes && <p className="mt-1">{selectedSampleRequest.notes}</p>}
                  </div>
                )}
              </div>

              {/* Request Details */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Request Information</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Request ID:</span>
                        <span className="font-medium">{selectedSampleRequest.requestId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Sample Size:</span>
                        <span className="font-medium">{selectedSampleRequest.sampleSize || "25g"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Purpose:</span>
                        <span className="font-medium">{selectedSampleRequest.purpose}</span>
                      </div>
                      {selectedSampleRequest.expectedOrderQuantity && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Expected Order:</span>
                          <span className="font-medium">{selectedSampleRequest.expectedOrderQuantity}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-600">Requested:</span>
                        <span className="font-medium">
                          {format(new Date(selectedSampleRequest.createdAt), "PPp")}
                        </span>
                      </div>
                    </div>
                  </div>

                  {selectedSampleRequest.message && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Your Message</h4>
                      <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                        {selectedSampleRequest.message}
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <MapPin className="w-4 h-4 mr-2" />
                      Shipping Address
                    </h4>
                    <div className="bg-gray-50 p-3 rounded text-sm">
                      <p>{selectedSampleRequest.shippingAddress}</p>
                      <p>{selectedSampleRequest.city}, {selectedSampleRequest.state} {selectedSampleRequest.postalCode}</p>
                      <p>{selectedSampleRequest.country}</p>
                    </div>
                  </div>

                  {selectedSampleRequest.trackingNumber && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                        <Truck className="w-4 h-4 mr-2" />
                        Tracking Information
                      </h4>
                      <div className="bg-blue-50 border border-blue-200 p-3 rounded">
                        <p className="text-sm text-gray-600 mb-1">Tracking Number:</p>
                        <p className="font-mono text-lg font-semibold text-blue-900">
                          {selectedSampleRequest.trackingNumber}
                        </p>
                      </div>
                    </div>
                  )}

                  {selectedSampleRequest.notes && selectedSampleRequest.status !== 'rejected' && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Admin Notes</h4>
                      <p className="text-sm text-gray-600 bg-yellow-50 border border-yellow-200 p-3 rounded">
                        {selectedSampleRequest.notes}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Current Status:</span>
                  <Badge className={`${getStatusColor(selectedSampleRequest.status || 'pending')}`}>
                    {(selectedSampleRequest.status || 'pending').toUpperCase()}
                  </Badge>
                </div>
                <Button variant="outline" onClick={() => setShowSampleTrackingDialog(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Bid Progress Tracking Dialog */}
      <Dialog open={showBidTrackingDialog} onOpenChange={setShowBidTrackingDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Bid Progress - {selectedBidForTracking?.inquiryId}
            </DialogTitle>
            <DialogDescription className="text-sm">
              Track the progress of your high volume bid
            </DialogDescription>
          </DialogHeader>
          
          {bidTrackingLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-500">Loading tracking information...</span>
            </div>
          ) : bidTrackingData ? (
            <div className="space-y-6 py-4">
              {/* Progress Steps */}
              <div className="space-y-4">
                {[
                  { key: 'submitted', label: 'Bid Submitted', icon: Check, description: 'Your bid has been received' },
                  { key: 'manager_approval', label: 'Manager Approval', icon: User, description: 'Pending review by our management team' },
                  { key: 'sales_discussion', label: 'Sales Discussion', icon: MessageSquare, description: 'Sales team is reviewing your bid' },
                  { key: 'quotation_sent', label: 'Quotation Sent', icon: FileText, description: 'Revised quote has been sent to you' },
                  { key: 'completed', label: 'Deal Confirmed', icon: Check, description: 'Your deal has been confirmed!' },
                ].map((step, index) => {
                  const currentStatus = bidTrackingData.bidProgressStatus || 'submitted';
                  const statusOrder = ['submitted', 'manager_approval', 'sales_discussion', 'quotation_sent', 'completed'];
                  const currentIndex = statusOrder.indexOf(currentStatus);
                  const stepIndex = statusOrder.indexOf(step.key);
                  const isCompleted = stepIndex < currentIndex;
                  const isCurrent = step.key === currentStatus;
                  const StepIcon = step.icon;
                  
                  return (
                    <div key={step.key} className="flex items-start gap-4">
                      <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                        isCompleted ? 'bg-green-500 text-white' :
                        isCurrent ? 'bg-blue-500 text-white ring-4 ring-blue-200' :
                        'bg-gray-200 text-gray-500'
                      }`}>
                        {isCompleted ? (
                          <Check className="w-5 h-5" />
                        ) : (
                          <span className="font-semibold">{index + 1}</span>
                        )}
                      </div>
                      <div className="flex-1 pb-4 border-b last:border-b-0">
                        <h4 className={`font-semibold ${isCurrent ? 'text-blue-700' : isCompleted ? 'text-green-700' : 'text-gray-500'}`}>
                          {step.label}
                        </h4>
                        <p className="text-sm text-gray-500">{step.description}</p>
                        {isCurrent && (
                          <Badge className="mt-2 bg-blue-100 text-blue-800">Current Status</Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Current Status Summary */}
              {bidTrackingData.bidProgressStatus === 'completed' ? (
                /* Deal Confirmed - Rich Summary for Completed Bids */
                (() => {
                  const acceptedRevision = bidTrackingData.revisions?.find((r: any) => r.status === 'accepted');
                  const dealAmount = acceptedRevision?.revisedAmount || bidTrackingData.estimatedValue;
                  const dealCurrency = acceptedRevision?.currency || 'USD';
                  
                  return (
                    <div className="rounded-xl p-5 border-2 border-green-300 bg-gradient-to-br from-green-50 to-emerald-50">
                      {/* Celebration Header */}
                      <div className="text-center mb-4">
                        <div className="inline-flex items-center justify-center w-14 h-14 bg-green-100 rounded-full mb-2">
                          <Check className="w-8 h-8 text-green-600" />
                        </div>
                        <h3 className="text-lg font-bold text-green-800">Deal Confirmed!</h3>
                        <p className="text-sm text-green-600">Your high volume bid has been successfully processed</p>
                      </div>
                      
                      {/* Deal Details */}
                      <div className="bg-white rounded-lg p-4 border border-green-200 space-y-3">
                        {/* Final Amount */}
                        {dealAmount && (
                          <div className="flex items-center justify-between py-2 border-b border-gray-100">
                            <span className="text-gray-600 flex items-center gap-2">
                              <DollarSign className="w-4 h-4" />
                              Final Deal Value
                            </span>
                            <span className="text-xl font-bold text-green-600">
                              {dealCurrency} {parseFloat(dealAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        )}
                        
                        {/* Completion Date */}
                        {bidTrackingData.bidProgressUpdatedAt && (
                          <div className="flex items-center justify-between py-2">
                            <span className="text-gray-600 flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              Completed On
                            </span>
                            <span className="font-medium text-gray-800">
                              {format(new Date(bidTrackingData.bidProgressUpdatedAt), 'MMM dd, yyyy HH:mm')}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {/* Next Steps */}
                      <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-sm text-blue-800 font-medium">What's Next?</p>
                        <p className="text-xs text-blue-600 mt-1">
                          Our sales team will contact you shortly to finalize the order details and arrange delivery.
                        </p>
                      </div>
                    </div>
                  );
                })()
              ) : (
                <div className={`rounded-lg p-4 border ${
                  bidTrackingData.bidProgressStatus === 'quotation_sent'
                  ? 'bg-purple-50 border-purple-200'
                  : 'bg-blue-50 border-blue-200'
                }`}>
                  <p className={`text-sm font-medium ${
                    bidTrackingData.bidProgressStatus === 'quotation_sent'
                    ? 'text-purple-800'
                    : 'text-blue-800'
                  }`}>
                    {bidTrackingData.bidProgressStatus === 'submitted' && 'Your bid has been submitted and is awaiting review.'}
                    {bidTrackingData.bidProgressStatus === 'manager_approval' && 'Your bid is under review by our management team.'}
                    {bidTrackingData.bidProgressStatus === 'sales_discussion' && 'Our sales team is reviewing your bid for discussion.'}
                    {bidTrackingData.bidProgressStatus === 'quotation_sent' && 'A revised quotation has been sent. Please check your quotes below.'}
                    {!bidTrackingData.bidProgressStatus && 'Your bid is being processed.'}
                  </p>
                  {bidTrackingData.bidProgressUpdatedAt && (
                    <p className={`text-xs mt-1 ${
                      bidTrackingData.bidProgressStatus === 'quotation_sent'
                      ? 'text-purple-600'
                      : 'text-blue-600'
                    }`}>
                      Last updated: {format(new Date(bidTrackingData.bidProgressUpdatedAt), 'MMM dd, yyyy HH:mm')}
                    </p>
                  )}
                </div>
              )}

              {/* Revised Quotes */}
              {bidTrackingData.revisions && bidTrackingData.revisions.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <DollarSign className="w-4 h-4 mr-2" />
                    Revised Quotes
                  </h4>
                  <div className="space-y-3">
                    {bidTrackingData.revisions.map((revision: any) => (
                      <div key={revision.id} className={`p-4 rounded-lg border ${
                        revision.status === 'pending' ? 'bg-yellow-50 border-yellow-200' :
                        revision.status === 'accepted' ? 'bg-green-50 border-green-200' :
                        'bg-gray-50 border-gray-200'
                      }`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-lg text-green-700">
                            {revision.currency || 'USD'} {parseFloat(revision.revisedAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </span>
                          <Badge className={
                            revision.status === 'accepted' ? 'bg-green-100 text-green-800' :
                            revision.status === 'rejected' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }>
                            {revision.status === 'pending' ? 'Awaiting Response' : revision.status}
                          </Badge>
                        </div>
                        {revision.notes && (
                          <p className="text-sm text-gray-600 mb-2">{revision.notes}</p>
                        )}
                        <p className="text-xs text-gray-400">
                          Received {formatDistanceToNow(new Date(revision.submittedAt))} ago
                        </p>
                        
                        {/* Accept/Reject buttons for pending revisions */}
                        {revision.status === 'pending' && (
                          <div className="mt-4 flex gap-2">
                            <Button
                              className="flex-1 bg-green-600 hover:bg-green-700"
                              onClick={() => respondToBidRevisionMutation.mutate({ 
                                revisionId: revision.id, 
                                status: 'accepted' 
                              })}
                              disabled={respondToBidRevisionMutation.isPending}
                              data-testid={`btn-accept-revision-${revision.id}`}
                            >
                              {respondToBidRevisionMutation.isPending ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              ) : (
                                <Check className="w-4 h-4 mr-2" />
                              )}
                              Accept Quote
                            </Button>
                            <Button
                              variant="outline"
                              className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                              onClick={() => respondToBidRevisionMutation.mutate({ 
                                revisionId: revision.id, 
                                status: 'rejected' 
                              })}
                              disabled={respondToBidRevisionMutation.isPending}
                              data-testid={`btn-reject-revision-${revision.id}`}
                            >
                              Reject Quote
                            </Button>
                          </div>
                        )}
                        
                        {/* Show response if already responded */}
                        {revision.status !== 'pending' && revision.respondedAt && (
                          <div className={`mt-2 p-2 rounded text-sm ${
                            revision.status === 'accepted' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {revision.status === 'accepted' ? 'You accepted this quote' : 'You rejected this quote'}
                            {revision.responseNotes && (
                              <p className="mt-1 text-xs">{revision.responseNotes}</p>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="py-8 text-center text-gray-500">
              <p>Unable to load tracking information.</p>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBidTrackingDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}