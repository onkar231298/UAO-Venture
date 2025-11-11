import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, CheckCircle, XCircle, MessageSquare, Calendar, DollarSign, Package, User, Building, FileText, CheckCheck, RefreshCw } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";
import HighVolumeBidDetailsDialog from "@/components/HighVolumeBidDetailsDialog";

export default function HighVolumeBidsPage() {
  const { user } = useAuth() as { user: any };
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedInquiry, setSelectedInquiry] = useState<any>(null);
  const [approvalNotes, setApprovalNotes] = useState("");
  const [discussionNotes, setDiscussionNotes] = useState("");
  const [revisedPrice, setRevisedPrice] = useState("");
  const [revisedCurrency, setRevisedCurrency] = useState("USD");
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [showDiscussionDialog, setShowDiscussionDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "approved">("all");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data: bidsData, isLoading } = useQuery({
    queryKey: ["/api/admin/high-volume-bids", filterStatus !== "all" ? { bidStatus: filterStatus } : {}],
  });

  const highVolumeBids = (bidsData as any)?.bids || [];
  
  const filteredBids = highVolumeBids.filter((bid: any) => {
    if (filterStatus === "all") return true;
    if (filterStatus === "pending") return bid.bidStatus === 'pending';
    if (filterStatus === "approved") return bid.bidStatus === 'approved';
    return true;
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ["/api/admin/high-volume-bids"] });
    toast({
      title: "Data Refreshed",
      description: "High volume bids data has been updated",
    });
    setIsRefreshing(false);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/high-volume-bids"] });
    }, 300000);

    return () => clearInterval(interval);
  }, [queryClient]);

  const approveMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: number; notes: string }) => {
      return await apiRequest(`/api/admin/high-volume-bids/${id}/approve`, {
        method: "POST",
        body: JSON.stringify({ approvalNotes: notes }),
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/high-volume-bids"] });
      toast({
        title: "Bid Approved",
        description: "High volume bid has been approved and a CRM lead has been created successfully.",
      });
      setShowApprovalDialog(false);
      setApprovalNotes("");
    },
    onError: (error: any) => {
      toast({
        title: "Approval Failed",
        description: error.message || "Failed to approve bid",
        variant: "destructive",
      });
    },
  });


  const updateDiscussionMutation = useMutation({
    mutationFn: async ({ id, notes, revisedPrice, currency }: { id: number; notes: string; revisedPrice?: string; currency?: string }) => {
      return await apiRequest(`/api/inquiries/${id}/discussion-notes`, {
        method: "PATCH",
        body: JSON.stringify({ notes, revisedPrice, currency }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inquiries"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/high-volume-bids"] });
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      toast({
        title: "Discussion Notes Updated",
        description: "Discussion notes have been saved successfully.",
      });
      setShowDiscussionDialog(false);
      setDiscussionNotes("");
      setRevisedPrice("");
      setRevisedCurrency("USD");
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update discussion notes",
        variant: "destructive",
      });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'responded': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-emerald-100 text-emerald-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'urgent': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'normal': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'low': return 'text-gray-600 bg-gray-50 border-gray-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const handleApprove = (inquiry: any) => {
    setSelectedInquiry(inquiry);
    setApprovalNotes(inquiry.approvalNotes || "");
    setShowApprovalDialog(true);
  };

  const handleDiscussion = (inquiry: any) => {
    setSelectedInquiry(inquiry);
    setDiscussionNotes(inquiry.discussionNotes || "");
    setShowDiscussionDialog(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">High Volume Bids</h1>
          <p className="text-sm sm:text-base text-gray-600">
            Manage large orders requiring special pricing and manager approval
          </p>
        </div>
        <Button
          onClick={handleRefresh}
          disabled={isRefreshing}
          variant="outline"
          className="flex items-center gap-2 min-h-[44px] w-full sm:w-auto"
          data-testid="button-refresh-bids"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Filter Tabs */}
      <Tabs value={filterStatus} onValueChange={(v) => setFilterStatus(v as any)} className="mb-6">
        <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <TabsList className="inline-flex w-auto min-w-full sm:min-w-0">
            <TabsTrigger value="all" data-testid="tab-all" className="whitespace-nowrap">
              All Bids ({highVolumeBids.length})
            </TabsTrigger>
            <TabsTrigger value="pending" data-testid="tab-pending" className="whitespace-nowrap">
              Pending Approval ({highVolumeBids.filter((b: any) => b.bidStatus === 'pending').length})
            </TabsTrigger>
            <TabsTrigger value="approved" data-testid="tab-approved" className="whitespace-nowrap">
              Approved ({highVolumeBids.filter((b: any) => b.bidStatus === 'approved').length})
            </TabsTrigger>
          </TabsList>
        </div>
      </Tabs>

      {/* Bids List */}
      {filteredBids.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No high volume bids</h3>
            <p className="text-gray-600">
              {filterStatus === "pending" ? "No bids pending approval" : "No high volume bids found"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredBids.map((bid: any) => (
            <Card key={bid.id} className="hover:shadow-md transition-shadow" data-testid={`bid-card-${bid.id}`}>
              <CardContent className="p-4 sm:p-6">
                <div className="mb-4">
                  <div className="flex-1">
                    <div className="mb-3">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">{bid.inquiryId}</h3>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className={getStatusColor(bid.status)}>
                          {bid.status || 'pending'}
                        </Badge>
                        <Badge className={`${getUrgencyColor(bid.urgency)} border`}>
                          {bid.urgency || 'normal'}
                        </Badge>
                        {bid.bidStatus === 'approved' && (
                          <Badge className="bg-green-100 text-green-800 border border-green-200">
                            <CheckCheck className="w-3 h-3 mr-1" />
                            Approved
                          </Badge>
                        )}
                        {bid.bidStatus === 'rejected' && (
                          <Badge className="bg-red-100 text-red-800 border border-red-200">
                            <XCircle className="w-3 h-3 mr-1" />
                            Rejected
                          </Badge>
                        )}
                        {bid.bidStatus === 'in_discussion' && (
                          <Badge className="bg-purple-100 text-purple-800 border border-purple-200">
                            <MessageSquare className="w-3 h-3 mr-1" />
                            In Discussion
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <User className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{bid.contactName}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Building className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{bid.companyName}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Package className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{bid.productName}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-4 p-3 sm:p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Quantity</p>
                    <p className="font-semibold text-gray-900 text-sm sm:text-base">{bid.quantity} {bid.unit}</p>
                  </div>
                  {bid.targetPrice && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Target Price</p>
                      <p className="font-semibold text-gray-900 text-sm sm:text-base">${bid.targetPrice}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Requested</p>
                    <p className="text-xs sm:text-sm text-gray-700">
                      {formatDistanceToNow(new Date(bid.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>

                {bid.message && (
                  <div className="mb-4 p-3 bg-blue-50 rounded border border-blue-100">
                    <p className="text-sm text-gray-700">{bid.message}</p>
                  </div>
                )}

                {bid.discussionNotes && (
                  <div className="mb-4 p-3 bg-purple-50 rounded border border-purple-100">
                    <p className="text-xs text-purple-600 font-medium mb-1">Discussion Notes:</p>
                    <p className="text-sm text-gray-700">{bid.discussionNotes}</p>
                  </div>
                )}

                {bid.approvalNotes && (
                  <div className="mb-4 p-3 bg-green-50 rounded border border-green-100">
                    <p className="text-xs text-green-600 font-medium mb-1">Approval Notes:</p>
                    <p className="text-sm text-gray-700">{bid.approvalNotes}</p>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  {bid.bidStatus === 'pending' && (
                    <Button
                      onClick={() => handleApprove(bid)}
                      className="bg-green-600 hover:bg-green-700 min-h-[44px]"
                      data-testid={`button-approve-${bid.id}`}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve Bid
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => handleDiscussion(bid)}
                    className="min-h-[44px]"
                    data-testid={`button-discussion-${bid.id}`}
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    <span className="truncate">{bid.discussionNotes ? "Update Discussion" : "Add Discussion Notes"}</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedInquiry(bid);
                      setShowDetailsDialog(true);
                    }}
                    className="min-h-[44px]"
                    data-testid={`button-view-${bid.id}`}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    View Full Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Approval Dialog */}
      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[500px]" data-testid="dialog-approval">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Approve High Volume Bid</DialogTitle>
            <DialogDescription className="text-sm">
              {selectedInquiry?.inquiryId} - {selectedInquiry?.companyName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="approval-notes" className="text-sm font-medium">Approval Notes</Label>
              <Textarea
                id="approval-notes"
                placeholder="Add notes about this approval (pricing agreed, special terms, etc.)"
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                rows={4}
                className="mt-2 text-sm"
                data-testid="input-approval-notes"
              />
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowApprovalDialog(false)}
              className="w-full sm:w-auto min-h-[44px]"
            >
              Cancel
            </Button>
            <Button
              onClick={() => approveMutation.mutate({ id: selectedInquiry.id, notes: approvalNotes })}
              disabled={approveMutation.isPending}
              className="bg-green-600 hover:bg-green-700 w-full sm:w-auto min-h-[44px]"
              data-testid="button-confirm-approve"
            >
              {approveMutation.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Approving...</>
              ) : (
                <><CheckCircle className="w-4 h-4 mr-2" /> Approve</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Discussion Notes Dialog */}
      <Dialog open={showDiscussionDialog} onOpenChange={setShowDiscussionDialog}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[500px]" data-testid="dialog-discussion">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Discussion Notes</DialogTitle>
            <DialogDescription className="text-sm">
              {selectedInquiry?.inquiryId} - {selectedInquiry?.companyName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="discussion-notes" className="text-sm font-medium">Notes</Label>
              <Textarea
                id="discussion-notes"
                placeholder="Record discussions with customer about pricing, quantities, delivery terms, etc."
                value={discussionNotes}
                onChange={(e) => setDiscussionNotes(e.target.value)}
                rows={6}
                className="mt-2 text-sm"
                data-testid="input-discussion-notes"
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="revised-price" className="text-sm font-medium">Revised Price (Optional)</Label>
                <Input
                  id="revised-price"
                  type="number"
                  step="0.01"
                  placeholder="Enter revised price"
                  value={revisedPrice}
                  onChange={(e) => setRevisedPrice(e.target.value)}
                  className="mt-2 min-h-[44px] text-base"
                  data-testid="input-revised-price"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  This will update the expected order value in the lead
                </p>
              </div>
              
              <div>
                <Label htmlFor="revised-currency" className="text-sm font-medium">Currency</Label>
                <Select value={revisedCurrency} onValueChange={setRevisedCurrency}>
                  <SelectTrigger id="revised-currency" className="mt-2 min-h-[44px]" data-testid="select-revised-currency">
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
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowDiscussionDialog(false)}
              className="w-full sm:w-auto min-h-[44px]"
            >
              Cancel
            </Button>
            <Button
              onClick={() => updateDiscussionMutation.mutate({ 
                id: selectedInquiry.id, 
                notes: discussionNotes,
                revisedPrice: revisedPrice || undefined,
                currency: revisedCurrency
              })}
              disabled={updateDiscussionMutation.isPending}
              className="w-full sm:w-auto min-h-[44px]"
              data-testid="button-save-discussion"
            >
              {updateDiscussionMutation.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
              ) : (
                <>Save Notes</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Full Details Dialog */}
      {selectedInquiry && (
        <HighVolumeBidDetailsDialog
          inquiry={selectedInquiry}
          open={showDetailsDialog}
          onOpenChange={setShowDetailsDialog}
        />
      )}
    </div>
  );
}
