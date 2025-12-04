import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Building, User, DollarSign, Calendar, Phone, Mail, MapPin, FileText, UserPlus, Package, MessageSquare, History, CheckCircle, XCircle, Clock, Loader2, Send, ArrowRight, ChevronDown, ChevronUp } from "lucide-react";
import { type LeadWithDetails, type Product } from "@shared/schema";
import ActivityTimeline from "./ActivityTimeline";
import { format, formatDistanceToNow } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface LeadDetailDialogProps {
  lead: LeadWithDetails | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  salesReps?: any[];
  onAssign?: (leadId: number, assignedTo: string) => void;
  canAssignLeads?: boolean;
}

export default function LeadDetailDialog({ lead, open, onOpenChange, salesReps = [], onAssign, canAssignLeads = false }: LeadDetailDialogProps) {
  const [selectedAssignee, setSelectedAssignee] = useState(lead?.assignedSalesRep || "");
  const [revisedAmount, setRevisedAmount] = useState("");
  const [revisedCurrency, setRevisedCurrency] = useState("USD");
  const [revisedMessage, setRevisedMessage] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const productIds = lead?.productsInterested || [];
  const { data: products = [], isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ['/api/admin/products/bulk', { ids: productIds.join(',') }],
    enabled: productIds.length > 0 && open && !!lead,
  });
  
  // Fetch original inquiry/bid data for leads from inquiries
  const isFromInquiry = lead?.leadSource === 'high_volume_bid' || lead?.leadSource === 'product_inquiry';
  const { data: inquiryData, isLoading: inquiryLoading } = useQuery<{
    inquiry: any;
    quotations: any[];
    bidRevisions: any[];
  }>({
    queryKey: ['/api/crm/leads/original-inquiry', lead?.id],
    queryFn: async () => {
      if (!lead?.id) return null;
      const response = await fetch(`/api/crm/leads/${lead.id}/original-inquiry`);
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error('Failed to fetch inquiry details');
      }
      return response.json();
    },
    enabled: isFromInquiry && open && !!lead?.id,
  });

  // Mutation to update bid progress status
  const updateStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      return apiRequest(`/api/crm/leads/${lead?.id}/high-volume-bid/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/crm/leads/original-inquiry', lead?.id] });
      queryClient.invalidateQueries({ queryKey: ['/api/crm/leads'] });
      queryClient.invalidateQueries({ queryKey: ['/api/customer/high-volume-bids'] });
      toast({
        title: "Status Updated",
        description: "Bid progress status has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update status",
        variant: "destructive",
      });
    },
  });

  // Mutation to send revised quote
  const sendRevisedQuoteMutation = useMutation({
    mutationFn: async (data: { messageType: string; message: string; revisedAmount?: string; currency?: string }) => {
      return apiRequest(`/api/crm/leads/${lead?.id}/high-volume-bid/message`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/crm/leads/original-inquiry', lead?.id] });
      queryClient.invalidateQueries({ queryKey: ['/api/crm/leads'] });
      queryClient.invalidateQueries({ queryKey: ['/api/customer/high-volume-bids'] });
      setRevisedAmount("");
      setRevisedMessage("");
      toast({
        title: "Revised Quote Sent",
        description: "Your revised quote has been sent and status updated to 'Quotation Sent'.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send revised quote",
        variant: "destructive",
      });
    },
  });

  const handleSendRevisedQuote = () => {
    if (!revisedAmount || !revisedMessage) {
      toast({
        title: "Validation Error",
        description: "Please enter both amount and message.",
        variant: "destructive",
      });
      return;
    }
    sendRevisedQuoteMutation.mutate({
      messageType: 'revised_quote',
      message: revisedMessage,
      revisedAmount,
      currency: revisedCurrency,
    });
  };

  const getProgressStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'submitted': 'Bid Submitted',
      'manager_approval': 'Manager Approval',
      'sales_discussion': 'Sales Discussion',
      'quotation_sent': 'Quotation Sent',
      'completed': 'Completed',
    };
    return labels[status] || status;
  };

  const getProgressStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'submitted': 'bg-gray-500',
      'manager_approval': 'bg-yellow-500',
      'sales_discussion': 'bg-blue-500',
      'quotation_sent': 'bg-purple-500',
      'completed': 'bg-green-500',
    };
    return colors[status] || 'bg-gray-500';
  };
  
  if (!lead) return null;

  const handleAssignmentChange = (value: string) => {
    setSelectedAssignee(value);
    if (onAssign) {
      onAssign(lead.id, value);
    }
  };

  const formatCurrency = (amount: number | string | null) => {
    if (!amount) return "$0";
    const num = typeof amount === "string" ? parseFloat(amount) : amount;
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(num);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "hot": return "bg-red-500 text-white";
      case "warm": return "bg-orange-500 text-white";
      case "cold": return "bg-blue-500 text-white";
      default: return "bg-gray-500 text-white";
    }
  };

  const formatStageName = (stage: string) => {
    return stage.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div className="flex-1">
              <DialogTitle className="text-lg sm:text-2xl">
                {lead.company?.companyName || "Unknown Company"}
              </DialogTitle>
              <DialogDescription className="text-sm">
                {lead.leadId} • Created {lead.createdAt ? format(new Date(lead.createdAt), 'MMM d, yyyy') : 'N/A'}
              </DialogDescription>
              {/* Prominent Lead Source Badge */}
              {lead.leadSource === 'high_volume_bid' && (
                <div className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 bg-blue-100 border-2 border-blue-300 rounded-md">
                  <DollarSign className="w-4 h-4 text-blue-700" />
                  <span className="text-sm font-semibold text-blue-800">High Volume Bid</span>
                </div>
              )}
              {lead.leadSource === 'product_inquiry' && (
                <div className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 bg-green-100 border-2 border-green-300 rounded-md">
                  <Package className="w-4 h-4 text-green-700" />
                  <span className="text-sm font-semibold text-green-800">Regular Enquiry</span>
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge className={`text-xs ${getPriorityColor(lead.priority || "warm")}`}>
                {lead.priority || "warm"}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {lead.currentStage ? formatStageName(lead.currentStage) : 'N/A'}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className={`grid w-full h-auto ${isFromInquiry ? 'grid-cols-4' : 'grid-cols-3'}`}>
            <TabsTrigger value="overview" className="text-xs sm:text-sm py-2">Overview</TabsTrigger>
            <TabsTrigger value="activity" className="text-xs sm:text-sm py-2">Activity</TabsTrigger>
            <TabsTrigger value="products" className="text-xs sm:text-sm py-2">Products</TabsTrigger>
            {isFromInquiry && (
              <TabsTrigger value="bid-details" className="text-xs sm:text-sm py-2">
                {lead.leadSource === 'high_volume_bid' ? 'Bid Details' : 'Inquiry Details'}
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Company Information */}
            <Card>
              <CardContent className="p-4 sm:p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Company Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Company Name</p>
                    <p className="font-medium">{lead.company?.companyName || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Industry</p>
                    <p className="font-medium">{lead.company?.industryType || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Website</p>
                    <p className="font-medium text-blue-600">
                      {lead.company?.website ? (
                        <a href={lead.company.website} target="_blank" rel="noopener noreferrer">
                          {lead.company.website}
                        </a>
                      ) : "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Industry</p>
                    <p className="font-medium">{lead.company?.industryType || "N/A"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardContent className="p-4 sm:p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Primary Contact
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Contact Name</p>
                    <p className="font-medium">{lead.contactPerson?.contactName || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Designation</p>
                    <p className="font-medium">{lead.contactPerson?.designation || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium">
                      {lead.contactPerson?.email ? (
                        <a href={`mailto:${lead.contactPerson.email}`} className="text-blue-600">
                          {lead.contactPerson.email}
                        </a>
                      ) : "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="font-medium">
                      {lead.contactPerson?.phone ? (
                        <a href={`tel:${lead.contactPerson.countryCode}${lead.contactPerson.phone}`} className="text-blue-600">
                          {lead.contactPerson.countryCode && !lead.contactPerson.countryCode.startsWith('+') ? '+' : ''}{lead.contactPerson.countryCode} {lead.contactPerson.phone}
                        </a>
                      ) : "N/A"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Deal Information */}
            <Card>
              <CardContent className="p-4 sm:p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Deal Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Expected Order Value</p>
                    <p className="font-medium text-lg">{formatCurrency(lead.expectedOrderValue)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Buying Timeline</p>
                    <p className="font-medium">{lead.buyingTimeline || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Lead Source</p>
                    <p className="font-medium">{lead.leadSource || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Days in Current Stage</p>
                    <p className="font-medium">{lead.daysInCurrentStage || 0} days</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Sales Team & Assignment */}
            <Card>
              <CardContent className="p-4 sm:p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Sales Team & Assignment
                </h3>
                <div className="space-y-4">
                  {/* Current Assignment */}
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Currently Assigned To</p>
                    {lead.salesRep ? (
                      <p className="font-medium">
                        {lead.salesRep.firstName} {lead.salesRep.lastName}
                      </p>
                    ) : (
                      <p className="text-gray-400 italic">Unassigned</p>
                    )}
                  </div>
                  
                  {/* Assignment Dropdown (Only for admins/managers) */}
                  {canAssignLeads && salesReps.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-500 mb-2">Change Assignment</p>
                      <div className="flex gap-2 items-center">
                        <Select value={selectedAssignee} onValueChange={handleAssignmentChange}>
                          <SelectTrigger className="w-full" data-testid="select-assign-lead">
                            <SelectValue placeholder="Select sales rep..." />
                          </SelectTrigger>
                          <SelectContent>
                            {salesReps.map((rep: any) => (
                              <SelectItem key={rep.id} value={rep.id}>
                                {rep.firstName} {rep.lastName} ({rep.email})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Select a sales representative to assign this lead
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Special Requirements */}
            {lead.specialRequirements && (
              <Card>
                <CardContent className="p-4 sm:p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Special Requirements
                  </h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{lead.specialRequirements}</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            <ActivityTimeline leadId={lead.id} />
          </TabsContent>

          <TabsContent value="products" className="space-y-4">
            {productsLoading ? (
              <Card>
                <CardContent className="p-4 sm:p-6">
                  <p className="text-gray-500">Loading products...</p>
                </CardContent>
              </Card>
            ) : productIds.length === 0 ? (
              <Card>
                <CardContent className="p-4 sm:p-6">
                  <p className="text-gray-500">No products associated with this lead</p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Product Cards */}
                <div className="grid gap-4">
                  {products.map((product) => (
                    <Card key={product.id} data-testid={`product-card-${product.id}`}>
                      <CardContent className="p-4 sm:p-6">
                        <div className="flex flex-col sm:flex-row gap-4">
                          {/* Product Image */}
                          {product.mainImage && (
                            <div className="w-full sm:w-24 h-32 sm:h-24 rounded-md overflow-hidden flex-shrink-0 bg-gray-100">
                              <img 
                                src={product.mainImage} 
                                alt={product.name}
                                className="w-full h-full object-cover"
                                data-testid={`product-image-${product.id}`}
                              />
                            </div>
                          )}
                          
                          {/* Product Details */}
                          <div className="flex-1">
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                              <div>
                                <h4 className="font-semibold text-base sm:text-lg" data-testid={`product-name-${product.id}`}>
                                  {product.name}
                                </h4>
                                <p className="text-xs sm:text-sm text-gray-500" data-testid={`product-id-${product.id}`}>
                                  SKU: {product.productId}
                                </p>
                              </div>
                              <Badge variant="outline" className="text-xs w-fit" data-testid={`product-status-${product.id}`}>
                                {product.status || 'Active'}
                              </Badge>
                            </div>

                            {/* Product Info Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                              {lead.requiredQuantity && (
                                <div>
                                  <p className="text-xs text-gray-500">Required Quantity</p>
                                  <p className="font-medium" data-testid={`product-quantity-${product.id}`}>
                                    {lead.requiredQuantity} {lead.unit || 'units'}
                                  </p>
                                </div>
                              )}
                              
                              {product.moq && (
                                <div>
                                  <p className="text-xs text-gray-500">MOQ</p>
                                  <p className="font-medium">{product.moq}</p>
                                </div>
                              )}
                              
                              {product.packingSize && (
                                <div>
                                  <p className="text-xs text-gray-500">Packing Size</p>
                                  <p className="font-medium">{product.packingSize}</p>
                                </div>
                              )}
                              
                              {product.leadTime && (
                                <div>
                                  <p className="text-xs text-gray-500">Lead Time</p>
                                  <p className="font-medium">{product.leadTime}</p>
                                </div>
                              )}
                            </div>

                            {/* Product Description */}
                            {product.description && (
                              <div className="mt-3">
                                <p className="text-sm text-gray-600 line-clamp-2">
                                  {product.description}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Deal Summary */}
                <Card>
                  <CardContent className="p-4 sm:p-6">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Deal Summary
                    </h3>
                    <div className="space-y-3">
                      {lead.requiredQuantity && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Total Quantity</span>
                          <span className="font-medium" data-testid="deal-total-quantity">
                            {lead.requiredQuantity} {lead.unit || 'units'}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between items-center border-t pt-3">
                        <span className="font-semibold">Expected Order Value</span>
                        <span className="font-bold text-lg" data-testid="deal-expected-value">
                          {formatCurrency(lead.expectedOrderValue)}
                        </span>
                      </div>
                      {!lead.expectedOrderValue && (
                        <p className="text-sm text-gray-500 italic">
                          Price pending - quotation in progress
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Special Requirements */}
                {lead.specialRequirements && (
                  <Card>
                    <CardContent className="p-4 sm:p-6">
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Additional Details
                      </h3>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap" data-testid="product-special-requirements">
                        {lead.specialRequirements}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>

          {/* Bid/Inquiry Details Tab */}
          {isFromInquiry && (
            <TabsContent value="bid-details" className="space-y-4">
              {inquiryLoading ? (
                <Card>
                  <CardContent className="p-6 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                    <span className="ml-2 text-gray-500">Loading inquiry details...</span>
                  </CardContent>
                </Card>
              ) : inquiryData?.inquiry ? (
                <>
                  {/* Original Inquiry/Bid Information */}
                  <Card className={lead.leadSource === 'high_volume_bid' ? 'border-2 border-blue-200' : 'border-2 border-green-200'}>
                    <CardContent className="p-4 sm:p-6">
                      <h3 className="font-semibold mb-4 flex items-center gap-2">
                        {lead.leadSource === 'high_volume_bid' ? (
                          <>
                            <DollarSign className="h-4 w-4 text-blue-600" />
                            <span className="text-blue-800">Original High Volume Bid</span>
                          </>
                        ) : (
                          <>
                            <Package className="h-4 w-4 text-green-600" />
                            <span className="text-green-800">Original Inquiry</span>
                          </>
                        )}
                        <Badge className="ml-2" variant="outline">
                          {inquiryData.inquiry.inquiryId}
                        </Badge>
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Product</p>
                          <p className="font-medium">{inquiryData.inquiry.productName || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Quantity</p>
                          <p className="font-medium">{inquiryData.inquiry.quantity} {inquiryData.inquiry.unit}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Target Price</p>
                          <p className="font-medium text-lg">${inquiryData.inquiry.targetPrice || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Submitted</p>
                          <p className="font-medium">
                            {inquiryData.inquiry.createdAt 
                              ? formatDistanceToNow(new Date(inquiryData.inquiry.createdAt), { addSuffix: true })
                              : 'N/A'}
                          </p>
                        </div>
                      </div>
                      
                      {/* Original Message */}
                      {inquiryData.inquiry.message && (
                        <div className="mt-4 p-3 bg-gray-50 rounded border">
                          <p className="text-xs text-gray-500 mb-1">Customer Message:</p>
                          <p className="text-sm">{inquiryData.inquiry.message}</p>
                        </div>
                      )}
                      
                      {/* Customer Notes */}
                      {inquiryData.inquiry.notes && (
                        <div className="mt-3 p-3 bg-yellow-50 rounded border border-yellow-200">
                          <p className="text-xs text-yellow-700 mb-1">Customer Notes:</p>
                          <p className="text-sm">{inquiryData.inquiry.notes}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Discussion Notes */}
                  {inquiryData.inquiry.discussionNotes && (
                    <Card>
                      <CardContent className="p-4 sm:p-6">
                        <h3 className="font-semibold mb-4 flex items-center gap-2">
                          <MessageSquare className="h-4 w-4" />
                          Discussion Notes
                        </h3>
                        <div className="p-3 bg-purple-50 rounded border border-purple-200">
                          <p className="text-sm whitespace-pre-wrap">{inquiryData.inquiry.discussionNotes}</p>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* High Volume Bid Workflow Management */}
                  {lead.leadSource === 'high_volume_bid' && (
                    <Card className="border-2 border-blue-300 bg-blue-50/30">
                      <CardContent className="p-4 sm:p-6">
                        <h3 className="font-semibold mb-4 flex items-center gap-2 text-blue-800">
                          <ArrowRight className="h-4 w-4" />
                          High Volume Bid Workflow
                        </h3>
                        
                        {/* Current Progress Status */}
                        <div className="mb-4">
                          <p className="text-sm text-gray-600 mb-2">Current Progress:</p>
                          <div className="flex flex-wrap gap-2 mb-3">
                            {['submitted', 'manager_approval', 'sales_discussion', 'quotation_sent', 'completed'].map((status, index) => {
                              const currentStatus = inquiryData.inquiry.bidProgressStatus || 'submitted';
                              const statusOrder = ['submitted', 'manager_approval', 'sales_discussion', 'quotation_sent', 'completed'];
                              const currentIndex = statusOrder.indexOf(currentStatus);
                              const isCompleted = index < currentIndex;
                              const isCurrent = status === currentStatus;
                              
                              return (
                                <div 
                                  key={status}
                                  className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium ${
                                    isCompleted ? 'bg-green-100 text-green-800' :
                                    isCurrent ? 'bg-blue-500 text-white ring-2 ring-blue-300' :
                                    'bg-gray-100 text-gray-500'
                                  }`}
                                >
                                  {isCompleted && <CheckCircle className="w-3 h-3" />}
                                  {getProgressStatusLabel(status)}
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Action Buttons Based on Current Stage */}
                        <div className="border-t pt-4 space-y-4">
                          <p className="text-sm font-medium text-gray-700">Available Actions:</p>
                          
                          {/* Action: Accept Bid - Available until quotation_sent */}
                          {['submitted', 'manager_approval', 'sales_discussion'].includes(inquiryData.inquiry.bidProgressStatus || 'submitted') && (
                            <Button
                              variant="default"
                              className="w-full bg-green-600 hover:bg-green-700"
                              onClick={() => {
                                updateStatusMutation.mutate('completed');
                                toast({
                                  title: "Bid Accepted",
                                  description: "The bid has been accepted and marked as completed.",
                                });
                              }}
                              disabled={updateStatusMutation.isPending}
                              data-testid="btn-accept-bid"
                            >
                              {updateStatusMutation.isPending ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              ) : (
                                <CheckCircle className="w-4 h-4 mr-2" />
                              )}
                              Accept Bid
                            </Button>
                          )}

                          {/* Send Revised Quote Form - Always visible when not completed */}
                          {(inquiryData.inquiry.bidProgressStatus || 'submitted') !== 'completed' && (
                            <div className="space-y-3 p-4 bg-white rounded-lg border">
                              <h4 className="font-medium text-gray-800 flex items-center gap-2">
                                <Send className="w-4 h-4 text-blue-600" />
                                Send Revised Quote
                              </h4>
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <Label htmlFor="revised-amount">Amount *</Label>
                                  <Input
                                    id="revised-amount"
                                    type="number"
                                    step="0.01"
                                    placeholder="Enter amount"
                                    value={revisedAmount}
                                    onChange={(e) => setRevisedAmount(e.target.value)}
                                    data-testid="input-revised-amount"
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="revised-currency">Currency</Label>
                                  <Select value={revisedCurrency} onValueChange={setRevisedCurrency}>
                                    <SelectTrigger data-testid="select-revised-currency">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="USD">USD</SelectItem>
                                      <SelectItem value="EUR">EUR</SelectItem>
                                      <SelectItem value="GBP">GBP</SelectItem>
                                      <SelectItem value="INR">INR</SelectItem>
                                      <SelectItem value="AUD">AUD</SelectItem>
                                      <SelectItem value="CAD">CAD</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                              <div>
                                <Label htmlFor="revised-message">Message to Customer *</Label>
                                <Textarea
                                  id="revised-message"
                                  placeholder="Enter your message to the customer..."
                                  value={revisedMessage}
                                  onChange={(e) => setRevisedMessage(e.target.value)}
                                  rows={3}
                                  data-testid="textarea-revised-message"
                                />
                              </div>
                              <Button
                                className="w-full"
                                onClick={handleSendRevisedQuote}
                                disabled={sendRevisedQuoteMutation.isPending || !revisedAmount || !revisedMessage}
                                data-testid="btn-send-revised-quote"
                              >
                                {sendRevisedQuoteMutation.isPending ? (
                                  <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Sending...
                                  </>
                                ) : (
                                  <>
                                    <Send className="w-4 h-4 mr-2" />
                                    Send Revised Quote
                                  </>
                                )}
                              </Button>
                              <p className="text-xs text-gray-500 text-center">
                                Sending a revised quote will update status to "Quotation Sent"
                              </p>
                            </div>
                          )}

                          {/* Completed State */}
                          {(inquiryData.inquiry.bidProgressStatus) === 'completed' && (
                            <div className="p-4 bg-green-50 rounded-lg border border-green-200 text-center">
                              <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                              <p className="font-medium text-green-800">Bid Workflow Completed</p>
                              <p className="text-sm text-green-600">This bid has been processed successfully.</p>
                            </div>
                          )}

                          {/* Manual Status Update (Advanced) */}
                          <div className="pt-3 border-t">
                            <details className="text-sm">
                              <summary className="cursor-pointer text-gray-500 hover:text-gray-700">
                                Advanced: Manual Status Update
                              </summary>
                              <div className="mt-2 flex gap-2">
                                <Select 
                                  value={inquiryData.inquiry.bidProgressStatus || 'submitted'}
                                  onValueChange={(value) => updateStatusMutation.mutate(value)}
                                >
                                  <SelectTrigger className="flex-1" data-testid="select-bid-status">
                                    <SelectValue placeholder="Select status..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="submitted">Bid Submitted</SelectItem>
                                    <SelectItem value="manager_approval">Manager Approval</SelectItem>
                                    <SelectItem value="sales_discussion">Sales Discussion</SelectItem>
                                    <SelectItem value="quotation_sent">Quotation Sent</SelectItem>
                                    <SelectItem value="completed">Completed</SelectItem>
                                  </SelectContent>
                                </Select>
                                {updateStatusMutation.isPending && (
                                  <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                                )}
                              </div>
                            </details>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Negotiation History (for high volume bids) */}
                  {lead.leadSource === 'high_volume_bid' && inquiryData.bidRevisions && inquiryData.bidRevisions.length > 0 && (
                    <Card>
                      <CardContent className="p-4 sm:p-6">
                        <h3 className="font-semibold mb-4 flex items-center gap-2">
                          <History className="h-4 w-4" />
                          Negotiation History
                        </h3>
                        <div className="space-y-3">
                          {inquiryData.bidRevisions.map((revision: any, index: number) => (
                            <div key={revision.id} className="border rounded-lg p-4 bg-gray-50">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-semibold text-lg text-green-600">
                                  {revision.currency || 'USD'} {parseFloat(revision.revisedAmount).toFixed(2)}
                                </span>
                                <Badge className={
                                  revision.status === 'accepted' ? 'bg-emerald-100 text-emerald-800' :
                                  revision.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                  'bg-yellow-100 text-yellow-800'
                                }>
                                  {revision.status === 'accepted' ? (
                                    <><CheckCircle className="w-3 h-3 mr-1" /> Accepted</>
                                  ) : revision.status === 'rejected' ? (
                                    <><XCircle className="w-3 h-3 mr-1" /> Rejected</>
                                  ) : (
                                    <><Clock className="w-3 h-3 mr-1" /> Pending</>
                                  )}
                                </Badge>
                              </div>
                              <p className="text-xs text-gray-500">
                                Submitted {revision.submittedAt 
                                  ? formatDistanceToNow(new Date(revision.submittedAt), { addSuffix: true })
                                  : 'N/A'}
                              </p>
                              {revision.notes && (
                                <div className="mt-2 p-2 bg-white rounded border">
                                  <p className="text-xs text-gray-500">Notes:</p>
                                  <p className="text-sm">{revision.notes}</p>
                                </div>
                              )}
                              {revision.respondedAt && revision.responseNotes && (
                                <div className="mt-2 p-2 bg-blue-50 rounded border border-blue-200">
                                  <p className="text-xs text-blue-600">Customer Response:</p>
                                  <p className="text-sm">{revision.responseNotes}</p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Quotations */}
                  {inquiryData.quotations && inquiryData.quotations.length > 0 && (
                    <Card>
                      <CardContent className="p-4 sm:p-6">
                        <h3 className="font-semibold mb-4 flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Quotations
                        </h3>
                        <div className="space-y-3">
                          {inquiryData.quotations.map((quotation: any) => (
                            <div key={quotation.id} className="border rounded-lg p-4">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium">{quotation.quotationId}</span>
                                <Badge className={
                                  quotation.status === 'accepted' ? 'bg-green-100 text-green-800' :
                                  quotation.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                  quotation.status === 'expired' ? 'bg-gray-100 text-gray-800' :
                                  'bg-blue-100 text-blue-800'
                                }>
                                  {quotation.status}
                                </Badge>
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>
                                  <span className="text-gray-500">Total Amount:</span>
                                  <span className="font-semibold ml-1">${parseFloat(quotation.totalAmount || 0).toFixed(2)}</span>
                                </div>
                                {quotation.validUntil && (
                                  <div>
                                    <span className="text-gray-500">Valid Until:</span>
                                    <span className="ml-1">{format(new Date(quotation.validUntil), 'MMM d, yyyy')}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Approval Notes */}
                  {inquiryData.inquiry.approvalNotes && (
                    <Card>
                      <CardContent className="p-4 sm:p-6">
                        <h3 className="font-semibold mb-4 flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          Approval Notes
                        </h3>
                        <div className="p-3 bg-green-50 rounded border border-green-200">
                          <p className="text-sm whitespace-pre-wrap">{inquiryData.inquiry.approvalNotes}</p>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </>
              ) : (
                <Card>
                  <CardContent className="p-6 text-center text-gray-500">
                    No original inquiry data found for this lead.
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          )}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
