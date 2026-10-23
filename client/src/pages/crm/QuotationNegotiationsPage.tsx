import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, DollarSign, MessageSquare, Calendar, User, Building, FileText, TrendingDown, TrendingUp, Package, UserPlus } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import QuotationToSalesOrderButton from "@/components/crm/QuotationToSalesOrderButton";
import { formatDistanceToNow } from "date-fns";

export default function QuotationNegotiationsPage() {
  const { user } = useAuth() as { user: any };
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedQuotation, setSelectedQuotation] = useState<any>(null);
  const [showReviseDialog, setShowReviseDialog] = useState(false);
  const [revisedPrice, setRevisedPrice] = useState("");
  const [revisionNotes, setRevisionNotes] = useState("");
  const [filterType, setFilterType] = useState<"all" | "pending" | "negotiating">("pending");

  const { data: quotationsData, isLoading } = useQuery({
    queryKey: ["/api/quotations"],
  });

  const allQuotations = (quotationsData as any)?.quotations || [];
  
  const quotationsWithCounterOffers = allQuotations.filter((q: any) => q.customerCounterPrice);
  const pendingCounterOffers = quotationsWithCounterOffers.filter((q: any) => q.status === 'pending');
  
  const filteredQuotations = filterType === "all" ? allQuotations : 
    filterType === "pending" ? pendingCounterOffers : quotationsWithCounterOffers;

  const reviseQuotationMutation = useMutation({
    mutationFn: async ({ id, price, notes }: { id: number; price: number; notes: string }) => {
      return await apiRequest(`/api/quotations/${id}/revise`, {
        method: "POST",
        body: JSON.stringify({ newPrice: price, notes }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quotations"] });
      toast({
        title: "Quotation Revised",
        description: "The revised quotation has been sent to the customer.",
      });
      setShowReviseDialog(false);
      setRevisedPrice("");
      setRevisionNotes("");
    },
    onError: (error: any) => {
      toast({
        title: "Revision Failed",
        description: error.message || "Failed to revise quotation",
        variant: "destructive",
      });
    },
  });

  const convertToLeadMutation = useMutation({
    mutationFn: async (quotationId: number) => {
      return await apiRequest(`/api/quotations/${quotationId}/convert-to-lead`, {
        method: "POST",
        body: JSON.stringify({}),
      });
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/quotations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/leads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sales/my-leads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sales/dashboard"] });
      toast({
        title: "Lead Created",
        description: `CRM lead ${data.lead.leadId} has been created successfully.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Conversion Failed",
        description: error.message || "Failed to convert quotation to lead",
        variant: "destructive",
      });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'sent': return 'bg-blue-100 text-blue-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'expired': return 'bg-red-100 text-red-800';
      case 'converted': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleRevise = (quotation: any) => {
    setSelectedQuotation(quotation);
    setRevisedPrice(quotation.customerCounterPrice || quotation.totalAmount);
    setRevisionNotes("");
    setShowReviseDialog(true);
  };

  const renderNegotiationHistory = (history: any[]) => {
    if (!history || history.length === 0) return null;

    return (
      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-gray-700">Negotiation History</h4>
        <div className="space-y-2">
          {history.map((entry: any, index: number) => (
            <div key={index} className={`p-3 rounded border ${
              entry.type === 'counter_offer' ? 'bg-amber-50 border-amber-200' : 'bg-blue-50 border-blue-200'
            }`}>
              <div className="flex items-center gap-2 mb-1">
                {entry.type === 'counter_offer' ? (
                  <>
                    <TrendingDown className="w-4 h-4 text-amber-600" />
                    <span className="text-xs font-semibold text-amber-800">Customer Counter-Offer</span>
                  </>
                ) : (
                  <>
                    <TrendingUp className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-semibold text-blue-800">Sales Revision</span>
                  </>
                )}
                <span className="text-xs text-gray-500 ml-auto">
                  {formatDistanceToNow(new Date(entry.createdAt), { addSuffix: true })}
                </span>
              </div>
              <p className="text-sm font-bold">
                Amount: ${entry.amount}
              </p>
              {entry.notes && (
                <p className="text-xs text-gray-700 mt-1">{entry.notes}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Quote Negotiations</h1>
        <p className="text-sm sm:text-base text-gray-600">
          Manage customer counter-offers and price negotiations
        </p>
      </div>

      {/* Filter Tabs */}
      <Tabs value={filterType} onValueChange={(v) => setFilterType(v as any)} className="mb-6">
        <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
          <TabsList className="inline-flex w-auto min-w-full sm:min-w-0">
            <TabsTrigger value="pending" data-testid="tab-pending" className="whitespace-nowrap">
              Pending Review ({pendingCounterOffers.length})
            </TabsTrigger>
            <TabsTrigger value="negotiating" data-testid="tab-negotiating" className="whitespace-nowrap">
              All Negotiations ({quotationsWithCounterOffers.length})
            </TabsTrigger>
            <TabsTrigger value="all" data-testid="tab-all" className="whitespace-nowrap">
              All Quotations ({allQuotations.length})
            </TabsTrigger>
          </TabsList>
        </div>
      </Tabs>

      {/* Quotations List */}
      {filteredQuotations.length === 0 ? (
        <Card>
          <CardContent className="p-6 sm:p-12 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No quotations</h3>
            <p className="text-sm sm:text-base text-gray-600">
              {filterType === "pending" ? "No counter-offers pending review" : "No quotations found"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredQuotations.map((quotation: any) => (
            <Card key={quotation.id} className="hover:shadow-md transition-shadow" data-testid={`quotation-card-${quotation.id}`}>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900">{quotation.quotationId}</h3>
                      <Badge className={getStatusColor(quotation.status)}>
                        {quotation.status}
                      </Badge>
                      {quotation.customerCounterPrice && (
                        <Badge className="bg-amber-100 text-amber-800 border border-amber-200">
                          Counter-Offer Pending
                        </Badge>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <User className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{quotation.customerCompanyName || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Package className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{quotation.productName}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="w-4 h-4 flex-shrink-0" />
                        <span>{formatDistanceToNow(new Date(quotation.createdAt), { addSuffix: true })}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Price Comparison */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4 p-3 sm:p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Your Quote</p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900 break-words">
                      {quotation.currency || 'USD'} {quotation.totalAmount}
                    </p>
                  </div>
                  {quotation.customerCounterPrice && (
                    <div>
                      <p className="text-xs text-amber-600 mb-1">Customer Counter-Offer</p>
                      <p className="text-xl sm:text-2xl font-bold text-amber-700 break-words">
                        {quotation.currency || 'USD'} {quotation.customerCounterPrice}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Difference: {quotation.currency || 'USD'} {
                          (parseFloat(quotation.totalAmount) - parseFloat(quotation.customerCounterPrice)).toFixed(2)
                        } ({
                          (((parseFloat(quotation.totalAmount) - parseFloat(quotation.customerCounterPrice)) / parseFloat(quotation.totalAmount)) * 100).toFixed(1)
                        }%)
                      </p>
                    </div>
                  )}
                </div>

                {/* Counter-Offer Notes */}
                {quotation.counterOfferNotes && (
                  <div className="mb-4 p-3 bg-amber-50 rounded border border-amber-100">
                    <p className="text-xs text-amber-600 font-medium mb-1">Customer's Explanation:</p>
                    <p className="text-sm text-gray-700">{quotation.counterOfferNotes}</p>
                  </div>
                )}

                {/* Negotiation History */}
                {quotation.negotiationHistory && quotation.negotiationHistory.length > 0 && (
                  <div className="mb-4">
                    {renderNegotiationHistory(quotation.negotiationHistory)}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 flex-wrap">
                  {quotation.customerCounterPrice && (
                    <Button
                      onClick={() => handleRevise(quotation)}
                      className="bg-blue-600 hover:bg-blue-700 min-h-[44px]"
                      data-testid={`button-revise-${quotation.id}`}
                    >
                      <DollarSign className="w-4 h-4 mr-2" />
                      <span className="text-sm sm:text-base">Revise Quotation</span>
                    </Button>
                  )}
                  {quotation.status === 'accepted' && !quotation.crmLeadId && (
                    <Button
                      onClick={() => convertToLeadMutation.mutate(quotation.id)}
                      disabled={convertToLeadMutation.isPending}
                      className="bg-green-600 hover:bg-green-700 min-h-[44px]"
                      data-testid={`button-convert-to-lead-${quotation.id}`}
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      <span className="text-sm sm:text-base">{convertToLeadMutation.isPending ? 'Converting...' : 'Convert to Lead'}</span>
                    </Button>
                  )}
                  {quotation.status === 'accepted' && quotation.crmLeadId && (
                    <Badge className="bg-green-100 text-green-800 border border-green-200">
                      Lead Created
                    </Badge>
                  )}
                  {quotation.status === 'accepted' && !quotation.salesOrderId && (
                    <QuotationToSalesOrderButton
                      quotationId={quotation.id}
                      quotationNumber={quotation.quotationId}
                    />
                  )}
                  <Button
                    variant="outline"
                    onClick={() => window.location.href = `/crm/quotations/${quotation.id}`}
                    className="min-h-[44px]"
                    data-testid={`button-view-${quotation.id}`}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    <span className="text-sm sm:text-base">View Full Details</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Revise Quotation Dialog */}
      <Dialog open={showReviseDialog} onOpenChange={setShowReviseDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-lg" data-testid="dialog-revise">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Revise Quotation</DialogTitle>
            <DialogDescription className="text-sm">
              {selectedQuotation?.quotationId} - {selectedQuotation?.customerCompanyName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 p-3 bg-gray-50 rounded">
              <div>
                <p className="text-xs text-gray-500">Original Quote</p>
                <p className="font-semibold break-words">${selectedQuotation?.totalAmount}</p>
              </div>
              <div>
                <p className="text-xs text-amber-600">Customer Counter-Offer</p>
                <p className="font-semibold text-amber-700 break-words">${selectedQuotation?.customerCounterPrice}</p>
              </div>
            </div>
            <div>
              <Label htmlFor="revised-price" className="text-sm">Revised Price *</Label>
              <Input
                id="revised-price"
                type="number"
                step="0.01"
                placeholder="Enter revised price"
                value={revisedPrice}
                onChange={(e) => setRevisedPrice(e.target.value)}
                className="min-h-[44px] text-base"
                data-testid="input-revised-price"
              />
              <p className="text-xs text-gray-500 mt-1">
                This will be sent back to the customer as your revised offer
              </p>
            </div>
            <div>
              <Label htmlFor="revision-notes" className="text-sm">Revision Notes</Label>
              <Textarea
                id="revision-notes"
                placeholder="Explain the revised price (e.g., best possible rate, added value, etc.)"
                value={revisionNotes}
                onChange={(e) => setRevisionNotes(e.target.value)}
                rows={4}
                className="text-base"
                data-testid="input-revision-notes"
              />
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowReviseDialog(false)} className="min-h-[44px] w-full sm:w-auto">
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!revisedPrice || parseFloat(revisedPrice) <= 0) {
                  toast({
                    title: "Invalid Price",
                    description: "Please enter a valid revised price",
                    variant: "destructive",
                  });
                  return;
                }
                reviseQuotationMutation.mutate({
                  id: selectedQuotation.id,
                  price: parseFloat(revisedPrice),
                  notes: revisionNotes
                });
              }}
              disabled={reviseQuotationMutation.isPending || !revisedPrice}
              className="bg-blue-600 hover:bg-blue-700 min-h-[44px] w-full sm:w-auto"
              data-testid="button-submit-revision"
            >
              {reviseQuotationMutation.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> <span>Sending...</span></>
              ) : (
                <span>Send Revised Quote</span>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
