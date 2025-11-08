import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Inquiry } from "@shared/schema";
import { User, Package, DollarSign, Calendar, CheckCircle, XCircle, FileEdit } from "lucide-react";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
  const [showRejectionForm, setShowRejectionForm] = useState(false);
  const [showRevisedQuoteForm, setShowRevisedQuoteForm] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const reviseQuoteMutation = useMutation({
    mutationFn: async () => {
      // Create a quotation for the bid with revised price
      const quotationData = {
        inquiryId: inquiry.id,
        customerId: inquiry.customerId,
        totalAmount: parseFloat(revisedPrice),
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days validity
        terms: `Revised Quote for High Volume Bid\n\nOriginal Bid Amount: $${inquiry.targetPrice}\nRevised Amount: $${revisedPrice}\n\n${approvalNotes || 'No additional notes'}`,
        notes: approvalNotes || 'Revised quote for high volume bid',
        status: 'sent'
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
        body: JSON.stringify({ approvalNotes }),
      });
    },
    onSuccess: () => {
      toast({
        title: "Bid Approved",
        description: "High volume bid has been approved and CRM lead created",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/inquiries'] });
      onOpenChange(false);
      setShowApprovalForm(false);
      setApprovalNotes("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to approve bid",
        variant: "destructive",
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest(`/api/admin/high-volume-bids/${inquiry.id}/reject`, {
        method: "POST",
        body: JSON.stringify({ approvalNotes }),
      });
    },
    onSuccess: () => {
      toast({
        title: "Bid Rejected",
        description: "High volume bid has been rejected",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/inquiries'] });
      onOpenChange(false);
      setShowRejectionForm(false);
      setApprovalNotes("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to reject bid",
        variant: "destructive",
      });
    },
  });

  const getBidStatusBadge = (status: string) => {
    const statusColors = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      in_discussion: 'bg-blue-100 text-blue-800'
    };
    
    return (
      <Badge className={statusColors[status as keyof typeof statusColors] || statusColors.pending}>
        {status}
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
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>High Volume Bid Details - BID-{inquiry.id}</span>
            <div className="flex items-center space-x-2">
              {getBidStatusBadge(inquiry.bidStatus || 'pending')}
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <User className="w-5 h-5 mr-2" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500">Contact Name</p>
                    <p className="font-medium">{inquiry.contactName || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Company</p>
                    <p className="font-medium">{inquiry.companyName || 'N/A'}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium">{inquiry.emailAddress || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="font-medium">{inquiry.phoneNumber || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Product & Bid Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Package className="w-5 h-5 mr-2" />
                Product & Bid Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500">Product</p>
                    <p className="font-medium">{(inquiry as any).productName || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Quantity Requested</p>
                    <p className="font-medium text-lg">{inquiry.quantity} {inquiry.unit}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Expected Delivery</p>
                    <p className="font-medium">{formatDate(inquiry.expectedDelivery)}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500">Bid Value (Target Price)</p>
                    <p className="font-bold text-2xl text-green-600">${inquiry.targetPrice || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Submitted On</p>
                    <p className="font-medium">{formatDate(inquiry.createdAt)}</p>
                  </div>
                  {inquiry.approvedAt && (
                    <div>
                      <p className="text-sm text-gray-500">Approval Date</p>
                      <p className="font-medium">{formatDate(inquiry.approvedAt)}</p>
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

          {/* Admin Actions */}
          {inquiry.bidStatus === 'pending' && (
            <Card className="border-2 border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-lg">Admin Decision Required</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!showApprovalForm && !showRejectionForm && !showRevisedQuoteForm && (
                  <div className="flex flex-wrap gap-3">
                    <Button 
                      onClick={() => setShowApprovalForm(true)}
                      className="bg-green-600 hover:bg-green-700"
                      data-testid="button-approve-bid"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve Bid & Create Lead
                    </Button>
                    <Button 
                      onClick={() => setShowRevisedQuoteForm(true)}
                      className="bg-blue-600 hover:bg-blue-700"
                      data-testid="button-revised-quote"
                    >
                      <FileEdit className="w-4 h-4 mr-2" />
                      Give Revised Quote
                    </Button>
                    <Button 
                      onClick={() => setShowRejectionForm(true)}
                      variant="destructive"
                      data-testid="button-reject-bid"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject Bid
                    </Button>
                  </div>
                )}

                {/* Approval Form */}
                {showApprovalForm && (
                  <div className="space-y-4 p-4 bg-white rounded border border-green-300">
                    <h4 className="font-semibold text-green-700">Approve Bid & Create CRM Lead</h4>
                    <div>
                      <Label htmlFor="approvalNotes">Approval Notes (Optional)</Label>
                      <Textarea
                        id="approvalNotes"
                        value={approvalNotes}
                        onChange={(e) => setApprovalNotes(e.target.value)}
                        placeholder="Add any notes about this approval..."
                        rows={3}
                        data-testid="input-approval-notes"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => approveMutation.mutate()}
                        disabled={approveMutation.isPending}
                        className="bg-green-600 hover:bg-green-700"
                        data-testid="button-confirm-approve"
                      >
                        {approveMutation.isPending ? "Approving..." : "Confirm Approval"}
                      </Button>
                      <Button 
                        onClick={() => {
                          setShowApprovalForm(false);
                          setApprovalNotes("");
                        }}
                        variant="outline"
                        data-testid="button-cancel-approve"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                {/* Rejection Form */}
                {showRejectionForm && (
                  <div className="space-y-4 p-4 bg-white rounded border border-red-300">
                    <h4 className="font-semibold text-red-700">Reject Bid</h4>
                    <div>
                      <Label htmlFor="rejectionNotes">Rejection Reason (Optional)</Label>
                      <Textarea
                        id="rejectionNotes"
                        value={approvalNotes}
                        onChange={(e) => setApprovalNotes(e.target.value)}
                        placeholder="Add reason for rejection..."
                        rows={3}
                        data-testid="input-rejection-notes"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => rejectMutation.mutate()}
                        disabled={rejectMutation.isPending}
                        variant="destructive"
                        data-testid="button-confirm-reject"
                      >
                        {rejectMutation.isPending ? "Rejecting..." : "Confirm Rejection"}
                      </Button>
                      <Button 
                        onClick={() => {
                          setShowRejectionForm(false);
                          setApprovalNotes("");
                        }}
                        variant="outline"
                        data-testid="button-cancel-reject"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                {/* Revised Quote Form */}
                {showRevisedQuoteForm && (
                  <div className="space-y-4 p-4 bg-white rounded border border-blue-300">
                    <h4 className="font-semibold text-blue-700">Give Revised Quote</h4>
                    <p className="text-sm text-gray-600">
                      Customer bid: ${inquiry.targetPrice}. Provide your revised price below.
                    </p>
                    <div>
                      <Label htmlFor="revisedPrice">Revised Price ($)</Label>
                      <Input
                        id="revisedPrice"
                        type="number"
                        step="0.01"
                        value={revisedPrice}
                        onChange={(e) => setRevisedPrice(e.target.value)}
                        placeholder="Enter revised price..."
                        data-testid="input-revised-price"
                      />
                    </div>
                    <div>
                      <Label htmlFor="revisedNotes">Notes to Customer</Label>
                      <Textarea
                        id="revisedNotes"
                        value={approvalNotes}
                        onChange={(e) => setApprovalNotes(e.target.value)}
                        placeholder="Add notes about the revised quote..."
                        rows={3}
                        data-testid="input-revised-notes"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => reviseQuoteMutation.mutate()}
                        disabled={!revisedPrice || reviseQuoteMutation.isPending}
                        className="bg-blue-600 hover:bg-blue-700"
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

          {/* Approved/Rejected Status Info */}
          {inquiry.bidStatus !== 'pending' && (
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
