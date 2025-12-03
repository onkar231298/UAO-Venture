import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Inquiry } from "@shared/schema";
import { User, Package, DollarSign, Calendar, CheckCircle, XCircle, FileEdit, History, UserPlus } from "lucide-react";
import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface HighVolumeBidDetailsDialogProps {
  inquiry: Inquiry;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function HighVolumeBidDetailsDialog({ inquiry, open, onOpenChange }: HighVolumeBidDetailsDialogProps) {
  const [approvalNotes, setApprovalNotes] = useState("");
  const [revisedPrice, setRevisedPrice] = useState("");
  const [showApprovalForm, setShowApprovalForm] = useState(false);
  const [showRevisedQuoteForm, setShowRevisedQuoteForm] = useState(false);
  const [selectedSalesRep, setSelectedSalesRep] = useState<string>("");
  const queryClient = useQueryClient();
  const { toast} = useToast();

  // Fetch sales reps for assignment dropdown
  const { data: salesReps = [] } = useQuery<any[]>({
    queryKey: ['/api/crm/sales-reps'],
    enabled: open,
  });

  // Fetch bid revisions for negotiation history
  const { data: bidRevisions = [] } = useQuery({
    queryKey: ['/api/bid-revisions', inquiry?.id],
    enabled: Boolean(inquiry?.id && open),
    queryFn: async () => {
      const response = await fetch(`/api/bid-revisions/${inquiry.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch bid revisions');
      }
      return response.json();
    },
  });

  // Fetch quotations for this inquiry to show accepted pricing
  const { data: quotationsData } = useQuery({
    queryKey: ['/api/quotations', inquiry?.customerId],
    enabled: Boolean(inquiry?.customerId && open),
    queryFn: async () => {
      const response = await fetch(`/api/customer/quotations/${inquiry.customerId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch quotations');
      }
      return response.json();
    },
  });

  // Find the accepted quotation for this inquiry
  const acceptedQuotation = quotationsData?.quotations?.find(
    (q: any) => q.inquiryId === inquiry?.id && q.status === 'accepted'
  );

  const reviseQuoteMutation = useMutation({
    mutationFn: async () => {
      // Create a quotation for the bid with revised price
      // Calculate total amount: unitPrice * quantity
      const unitPrice = parseFloat(revisedPrice);
      const quantity = parseFloat(inquiry.quantity || "0");
      const totalPrice = (unitPrice * quantity).toFixed(2);
      
      const quotationData = {
        inquiryId: inquiry.id,
        customerId: inquiry.customerId,
        productId: inquiry.productId, // Add for schema validation and backward compatibility
        quantity: inquiry.quantity, // Add to main quotation data (duplicates first item)
        unit: inquiry.unit, // Add to main quotation data (duplicates first item)
        unitPrice: revisedPrice, // Add to main quotation data (duplicates first item)
        totalAmount: totalPrice, // Total amount for the quotation
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days validity
        terms: `Revised Quote for High Volume Bid\n\nOriginal Bid Amount: $${inquiry.targetPrice}/kg\nRevised Unit Price: $${revisedPrice}/kg\nQuantity: ${inquiry.quantity} ${inquiry.unit}\nTotal Amount: $${totalPrice}\n\n${approvalNotes || 'No additional notes'}`,
        notes: approvalNotes || 'Revised quote for high volume bid',
        status: 'sent',
        createdBy: 'admin_001', // Will be overridden by server with actual user ID
        // Add quotation items array with the single item (line-level details)
        items: [{
          productId: inquiry.productId,
          quantity: inquiry.quantity,
          unit: inquiry.unit,
          unitPrice: revisedPrice, // Per kg price
          totalPrice: totalPrice, // Calculated: price per kg × quantity
          specifications: inquiry.message || '' // Use the bid message as specifications
        }]
      };

      return await apiRequest('/api/quotations', {
        method: "POST",
        body: JSON.stringify(quotationData),
      });
    },
    onSuccess: () => {
      toast({
        title: "Revised Quote Sent",
        description: "Revised quotation has been created and sent to customer",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/inquiries'] });
      queryClient.invalidateQueries({ queryKey: ['/api/quotations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/high-volume-bids'] });
      onOpenChange(false);
      setShowRevisedQuoteForm(false);
      setRevisedPrice("");
      setApprovalNotes("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create revised quote",
        variant: "destructive",
      });
    },
  });

  const approveMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest(`/api/admin/high-volume-bids/${inquiry.id}/approve`, {
        method: "POST",
        body: JSON.stringify({ 
          approvalNotes,
          assignedSalesRep: selectedSalesRep || undefined
        }),
      });
    },
    onSuccess: () => {
      const assignedRep = salesReps.find((r: any) => r.id === selectedSalesRep);
      toast({
        title: "Bid Approved & Lead Created",
        description: assignedRep 
          ? `Lead assigned to ${assignedRep.firstName} ${assignedRep.lastName}`
          : "High volume bid has been approved and CRM lead created",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/inquiries'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/high-volume-bids'] });
      queryClient.invalidateQueries({ queryKey: ['/api/crm/leads'] });
      onOpenChange(false);
      setShowApprovalForm(false);
      setApprovalNotes("");
      setSelectedSalesRep("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to approve bid",
        variant: "destructive",
      });
    },
  });


  const getBidStatusBadge = (status: string) => {
    const statusColors = {
      pending: 'bg-yellow-100 text-yellow-800',
      rev_proposed: 'bg-blue-100 text-blue-800',
      customer_accepted: 'bg-emerald-100 text-emerald-800',
      customer_rejected: 'bg-orange-100 text-orange-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      converted: 'bg-purple-100 text-purple-800',
      in_discussion: 'bg-blue-100 text-blue-800'
    };
    
    const statusLabels = {
      pending: 'Pending Review',
      rev_proposed: 'Revised Quote Sent',
      customer_accepted: 'Customer Accepted',
      customer_rejected: 'Customer Rejected',
      approved: 'Approved',
      rejected: 'Rejected',
      converted: 'Converted to Lead',
      in_discussion: 'In Discussion'
    };
    
    return (
      <Badge className={statusColors[status as keyof typeof statusColors] || statusColors.pending}>
        {statusLabels[status as keyof typeof statusLabels] || status}
      </Badge>
    );
  };

  const formatDate = (dateString: string | Date | null | undefined) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-3xl lg:max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <span className="text-base sm:text-lg">High Volume Bid Details - BID-{inquiry.id}</span>
            <div className="flex items-center space-x-2">
              {getBidStatusBadge(inquiry.bidStatus || 'pending')}
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg flex items-center">
                <User className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-3">
                  <div>
                    <p className="text-xs sm:text-sm text-gray-500">Contact Name</p>
                    <p className="font-medium text-sm sm:text-base">{inquiry.contactName || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-500">Company</p>
                    <p className="font-medium text-sm sm:text-base">{inquiry.companyName || 'N/A'}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs sm:text-sm text-gray-500">Email</p>
                    <p className="font-medium text-sm sm:text-base truncate">{inquiry.emailAddress || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-500">Phone</p>
                    <p className="font-medium text-sm sm:text-base">{inquiry.phoneNumber || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Product & Bid Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg flex items-center">
                <Package className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                Product & Bid Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-3">
                  <div>
                    <p className="text-xs sm:text-sm text-gray-500">Product</p>
                    <p className="font-medium text-sm sm:text-base">{(inquiry as any).productName || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-500">Quantity Requested</p>
                    <p className="font-medium text-base sm:text-lg">{inquiry.quantity} {inquiry.unit}</p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-500">Expected Delivery</p>
                    <p className="font-medium text-sm sm:text-base">{formatDate(inquiry.expectedDelivery)}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs sm:text-sm text-gray-500">Bid Value (Target Price)</p>
                    <p className="font-bold text-xl sm:text-2xl text-green-600">${inquiry.targetPrice || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-500">Submitted On</p>
                    <p className="font-medium text-sm sm:text-base">{formatDate(inquiry.createdAt)}</p>
                  </div>
                  {inquiry.approvedAt && (
                    <div>
                      <p className="text-xs sm:text-sm text-gray-500">Approval Date</p>
                      <p className="font-medium text-sm sm:text-base">{formatDate(inquiry.approvedAt)}</p>
                    </div>
                  )}
                </div>
              </div>
              
              {inquiry.message && (
                <div>
                  <p className="text-sm text-gray-500 mb-2">Customer Message</p>
                  <div className="bg-gray-50 p-3 rounded border">
                    <p className="text-sm">{inquiry.message}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Negotiation History */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg flex items-center">
                <History className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                Negotiation History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {bidRevisions && (bidRevisions as any[]).length > 0 ? (
                <div className="space-y-3">
                  {(bidRevisions as any[]).map((revision: any, index: number) => (
                    <div 
                      key={revision.id} 
                      className="border rounded-lg p-3 sm:p-4 bg-gray-50"
                      data-testid={`revision-${revision.id}`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-semibold text-base sm:text-lg text-green-600">
                              {revision.currency || 'USD'} {parseFloat(revision.revisedAmount).toFixed(2)}
                            </span>
                            <Badge className={
                              revision.status === 'accepted' ? 'bg-emerald-100 text-emerald-800' :
                              revision.status === 'rejected' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }>
                              {revision.status === 'accepted' ? 'Accepted' : 
                               revision.status === 'rejected' ? 'Rejected' : 
                               'Pending Customer Response'}
                            </Badge>
                          </div>
                          <p className="text-xs sm:text-sm text-gray-600">
                            Submitted {formatDate(revision.submittedAt)}
                          </p>
                        </div>
                      </div>
                      
                      {revision.notes && (
                        <div className="mb-2">
                          <p className="text-xs text-gray-500 mb-1">Admin Notes:</p>
                          <p className="text-sm bg-white p-2 rounded border">{revision.notes}</p>
                        </div>
                      )}
                      
                      {revision.respondedAt && (
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-xs text-gray-500 mb-1">
                            Customer Response ({formatDate(revision.respondedAt)}):
                          </p>
                          <p className="text-sm bg-white p-2 rounded border">
                            {revision.responseNotes || 'No notes provided'}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">
                  No negotiation history available
                </p>
              )}
            </CardContent>
          </Card>

          {/* Approval Notes (if exists) */}
          {inquiry.approvalNotes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Approval Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-blue-50 p-3 rounded border border-blue-200">
                  <p className="text-sm">{inquiry.approvalNotes}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Accepted Quotation Details - Show prominently when customer accepts */}
          {acceptedQuotation && inquiry.bidStatus === 'customer_accepted' && (
            <Card className="border-2 border-emerald-300 bg-gradient-to-br from-emerald-50 to-green-50">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                  <CardTitle className="text-lg text-emerald-800">Customer Accepted Quotation</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Price Comparison */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <p className="text-xs text-gray-500 mb-1">Original Bid Price</p>
                    <p className="text-xl font-semibold text-gray-700">
                      ${parseFloat(inquiry.targetPrice || "0").toFixed(2)}/{inquiry.unit}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Customer's target price</p>
                  </div>
                  <div className="bg-emerald-100 p-4 rounded-lg border-2 border-emerald-300">
                    <p className="text-xs text-emerald-700 mb-1">✓ Accepted Price</p>
                    <p className="text-xl font-bold text-emerald-800">
                      ${parseFloat(acceptedQuotation.unitPrice || acceptedQuotation.totalAmount).toFixed(2)}/{inquiry.unit}
                    </p>
                    <p className="text-xs text-emerald-700 mt-1">Your revised quotation</p>
                  </div>
                </div>

                {/* Order Details */}
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Quantity</p>
                      <p className="text-base font-semibold text-gray-900">
                        {acceptedQuotation.quantity} {acceptedQuotation.unit}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Total Amount</p>
                      <p className="text-base font-bold text-emerald-700">
                        ${parseFloat(acceptedQuotation.totalAmount || "0").toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Quotation Info */}
                <div className="text-xs text-gray-600">
                  <p><strong>Quotation ID:</strong> {acceptedQuotation.quotationId}</p>
                  {acceptedQuotation.validUntil && (
                    <p><strong>Valid Until:</strong> {new Date(acceptedQuotation.validUntil).toLocaleDateString()}</p>
                  )}
                </div>

                {/* Call to Action */}
                <div className="bg-emerald-600 text-white p-3 rounded-lg text-center">
                  <p className="text-sm font-medium">🎉 Customer approved! Ready to convert to CRM lead below.</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Admin Actions */}
          {/* Show admin actions for pending, customer_accepted, and customer_rejected states */}
          {(inquiry.bidStatus === 'pending' || inquiry.bidStatus === 'customer_accepted' || inquiry.bidStatus === 'customer_rejected') && (
            <Card className={`border-2 ${
              inquiry.bidStatus === 'customer_accepted' ? 'border-green-200 bg-green-50' :
              inquiry.bidStatus === 'customer_rejected' ? 'border-orange-200 bg-orange-50' :
              'border-blue-200 bg-blue-50'
            }`}>
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">
                  {inquiry.bidStatus === 'customer_accepted' ? 'Customer Accepted - Ready to Convert' :
                   inquiry.bidStatus === 'customer_rejected' ? 'Customer Rejected - Revise Offer' :
                   'Admin Decision Required'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {inquiry.bidStatus === 'customer_accepted' && (
                  <p className="text-sm text-green-700 mb-2">
                    ✅ Customer has accepted the revised price. You can now approve and convert this to a CRM lead.
                  </p>
                )}
                {inquiry.bidStatus === 'customer_rejected' && (
                  <p className="text-sm text-orange-700 mb-2">
                    ⚠️ Customer rejected the revised price. You can submit a new revised quote.
                  </p>
                )}
                
                {!showApprovalForm && !showRevisedQuoteForm && (
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                    {inquiry.bidStatus === 'customer_accepted' && (
                      <Button 
                        onClick={() => setShowApprovalForm(true)}
                        className="bg-green-600 hover:bg-green-700 min-h-[44px] w-full sm:w-auto"
                        data-testid="button-convert-to-lead"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Approve & Convert to Lead
                      </Button>
                    )}
                    {(inquiry.bidStatus === 'pending' || inquiry.bidStatus === 'customer_rejected') && (
                      <>
                        {inquiry.bidStatus === 'pending' && (
                          <Button 
                            onClick={() => setShowApprovalForm(true)}
                            className="bg-green-600 hover:bg-green-700 min-h-[44px] w-full sm:w-auto"
                            data-testid="button-approve-bid"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Approve Bid & Create Lead
                          </Button>
                        )}
                        <Button 
                          onClick={() => setShowRevisedQuoteForm(true)}
                          className="bg-blue-600 hover:bg-blue-700 min-h-[44px] w-full sm:w-auto"
                          data-testid="button-revised-quote"
                        >
                          <FileEdit className="w-4 h-4 mr-2" />
                          {inquiry.bidStatus === 'customer_rejected' ? 'Submit New Revised Quote' : 'Give Revised Quote'}
                        </Button>
                      </>
                    )}
                  </div>
                )}

                {/* Approval Form */}
                {showApprovalForm && (
                  <div className="space-y-4 p-3 sm:p-4 bg-white rounded border border-green-300">
                    <h4 className="font-semibold text-sm sm:text-base text-green-700">Approve Bid & Create CRM Lead</h4>
                    
                    {/* Salesperson Assignment */}
                    <div>
                      <Label htmlFor="salesRepAssign" className="text-sm flex items-center gap-1">
                        <UserPlus className="w-4 h-4" />
                        Assign to Sales Representative
                      </Label>
                      <Select value={selectedSalesRep} onValueChange={setSelectedSalesRep}>
                        <SelectTrigger id="salesRepAssign" className="mt-1" data-testid="select-sales-rep">
                          <SelectValue placeholder="Select a salesperson to assign..." />
                        </SelectTrigger>
                        <SelectContent>
                          {salesReps.map((rep: any) => (
                            <SelectItem key={rep.id} value={rep.id}>
                              {rep.firstName} {rep.lastName} ({rep.email})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-gray-500 mt-1">
                        Select the salesperson who will handle this high volume deal
                      </p>
                    </div>
                    
                    <div>
                      <Label htmlFor="approvalNotes" className="text-sm">Approval Notes (Optional)</Label>
                      <Textarea
                        id="approvalNotes"
                        value={approvalNotes}
                        onChange={(e) => setApprovalNotes(e.target.value)}
                        placeholder="Add any notes about this approval..."
                        rows={3}
                        className="text-sm"
                        data-testid="input-approval-notes"
                      />
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button 
                        onClick={() => approveMutation.mutate()}
                        disabled={approveMutation.isPending || !selectedSalesRep}
                        className="bg-green-600 hover:bg-green-700 min-h-[44px] w-full sm:w-auto"
                        data-testid="button-confirm-approve"
                      >
                        {approveMutation.isPending ? "Approving..." : "Confirm Approval & Assign"}
                      </Button>
                      <Button 
                        onClick={() => {
                          setShowApprovalForm(false);
                          setApprovalNotes("");
                          setSelectedSalesRep("");
                        }}
                        variant="outline"
                        className="min-h-[44px] w-full sm:w-auto"
                        data-testid="button-cancel-approve"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                {/* Revised Quote Form */}
                {showRevisedQuoteForm && (
                  <div className="space-y-4 p-3 sm:p-4 bg-white rounded border border-blue-300">
                    <h4 className="font-semibold text-sm sm:text-base text-blue-700">Give Revised Quote</h4>
                    <p className="text-xs sm:text-sm text-gray-600">
                      Customer bid: ${inquiry.targetPrice}. Provide your revised price below.
                    </p>
                    <div>
                      <Label htmlFor="revisedPrice" className="text-sm">Revised Price ($)</Label>
                      <Input
                        id="revisedPrice"
                        type="number"
                        step="0.01"
                        value={revisedPrice}
                        onChange={(e) => setRevisedPrice(e.target.value)}
                        placeholder="Enter revised price..."
                        className="text-sm min-h-[44px]"
                        data-testid="input-revised-price"
                      />
                    </div>
                    <div>
                      <Label htmlFor="revisedNotes" className="text-sm">Notes to Customer</Label>
                      <Textarea
                        id="revisedNotes"
                        value={approvalNotes}
                        onChange={(e) => setApprovalNotes(e.target.value)}
                        placeholder="Add notes about the revised quote..."
                        rows={3}
                        className="text-sm"
                        data-testid="input-revised-notes"
                      />
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button 
                        onClick={() => reviseQuoteMutation.mutate()}
                        disabled={!revisedPrice || reviseQuoteMutation.isPending}
                        className="bg-blue-600 hover:bg-blue-700 min-h-[44px] w-full sm:w-auto"
                        data-testid="button-confirm-revised-quote"
                      >
                        {reviseQuoteMutation.isPending ? "Sending..." : "Send Revised Quote"}
                      </Button>
                      <Button 
                        onClick={() => {
                          setShowRevisedQuoteForm(false);
                          setRevisedPrice("");
                          setApprovalNotes("");
                        }}
                        variant="outline"
                        className="min-h-[44px] w-full sm:w-auto"
                        data-testid="button-cancel-revised-quote"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Waiting for Customer Response */}
          {inquiry.bidStatus === 'rev_proposed' && (
            <Card className="border-2 border-blue-200 bg-blue-50">
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-5 h-5 text-blue-600" />
                  <p className="font-medium">
                    Waiting for customer response on revised price
                  </p>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  A revised quote has been sent to the customer. The bid will be ready for conversion once the customer accepts the offer.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Approved/Rejected Status Info */}
          {(inquiry.bidStatus === 'approved' || inquiry.bidStatus === 'rejected' || inquiry.bidStatus === 'converted') && (
            <Card className={inquiry.bidStatus === 'approved' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  {inquiry.bidStatus === 'approved' ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                  <p className="font-medium">
                    This bid has been {inquiry.bidStatus}
                    {inquiry.approvedAt && ` on ${formatDate(inquiry.approvedAt)}`}
                  </p>
                </div>
                {inquiry.crmLeadId && (
                  <p className="text-sm text-gray-600 mt-2">
                    CRM Lead ID: {inquiry.crmLeadId}
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
