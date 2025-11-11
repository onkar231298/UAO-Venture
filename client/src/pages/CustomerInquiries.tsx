import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MessageSquare, Calendar, Package, Eye, Clock, CheckCircle, XCircle, DollarSign } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useCustomerAuth } from "@/hooks/useCustomerAuth";
import { useLocation } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export default function CustomerInquiries() {
  const { customer, isCustomerAuthenticated } = useCustomerAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [responseNotes, setResponseNotes] = useState<Record<number, string>>({});
  const [respondingTo, setRespondingTo] = useState<number | null>(null);

  const { data: inquiries, isLoading } = useQuery({
    queryKey: [`/api/customer/inquiries/${customer?.id}`],
    enabled: !!customer?.id,
  });

  // Fetch pending bid revisions for this customer's high volume bids
  const { data: pendingRevisions } = useQuery({
    queryKey: ['/api/customer/pending-revisions', customer?.id],
    enabled: !!customer?.id && !!inquiries,
    queryFn: async () => {
      // Get all customer's high volume bids with rev_proposed status
      const highVolumeBids = ((inquiries as any)?.inquiries || []).filter(
        (inq: any) => inq.inquiryType === 'high_volume_bid' && inq.bidStatus === 'rev_proposed'
      );
      
      if (highVolumeBids.length === 0) return [];
      
      // Fetch revisions for each bid
      const revisionsPromises = highVolumeBids.map((bid: any) =>
        fetch(`/api/bid-revisions/${bid.id}`).then(r => r.json())
      );
      
      const allRevisions = await Promise.all(revisionsPromises);
      
      // Filter to only pending revisions and add inquiry details
      return allRevisions.flatMap((revisions: any, index: number) => 
        (revisions as any[])
          .filter((rev: any) => rev.status === 'pending')
          .map((rev: any) => ({
            ...rev,
            inquiry: highVolumeBids[index]
          }))
      );
    }
  });

  const respondMutation = useMutation({
    mutationFn: async ({ revisionId, decision, notes }: { revisionId: number; decision: 'accept' | 'reject'; notes: string }) => {
      return apiRequest(`/api/bid-revisions/${revisionId}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision, responseNotes: notes })
      });
    },
    onSuccess: (_, variables) => {
      toast({
        title: variables.decision === 'accept' ? 'Offer Accepted' : 'Offer Rejected',
        description: `You have ${variables.decision}ed the revised price offer.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/customer/pending-revisions'] });
      queryClient.invalidateQueries({ queryKey: [`/api/customer/inquiries/${customer?.id}`] });
      setResponseNotes({});
      setRespondingTo(null);
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to submit response. Please try again.',
        variant: 'destructive',
      });
    }
  });

  if (!isCustomerAuthenticated || !customer) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-8">
          <Card className="max-w-md mx-auto">
            <CardHeader className="text-center">
              <CardTitle>Customer Access Required</CardTitle>
              <CardDescription>Please log in to view your inquiries</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button onClick={() => setLocation('/login')} className="min-h-[44px]" data-testid="button-go-to-login">
                Go to Login
              </Button>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'responded': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4 sm:mb-6">
            <MessageSquare className="w-6 h-6 text-blue-600" />
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">My Inquiries</h1>
          </div>

          {/* Pending Price Offers Section */}
          {pendingRevisions && (pendingRevisions as any[]).length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                <DollarSign className="w-5 h-5 text-green-600" />
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Pending Price Offers</h2>
                <Badge className="bg-green-100 text-green-800">{(pendingRevisions as any[]).length}</Badge>
              </div>
              <div className="space-y-4">
                {(pendingRevisions as any[]).map((revision: any) => (
                  <Card key={revision.id} className="border-2 border-green-200 bg-green-50">
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex flex-col sm:flex-row items-start justify-between gap-4 mb-4">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-1">{revision.inquiry.productName}</h3>
                          <p className="text-sm text-gray-600 mb-2">Inquiry ID: {revision.inquiry.inquiryId}</p>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
                            <div>
                              <p className="text-xs text-gray-500 uppercase tracking-wider">Your Bid</p>
                              <p className="font-medium">${parseFloat(revision.inquiry.targetPrice).toFixed(2)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 uppercase tracking-wider">Our Offer</p>
                              <p className="font-bold text-green-600 text-lg">
                                {revision.currency || 'USD'} {parseFloat(revision.revisedAmount).toFixed(2)}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 uppercase tracking-wider">Quantity</p>
                              <p className="font-medium">{revision.inquiry.quantity} {revision.inquiry.unit}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {revision.notes && (
                        <div className="mb-4 p-3 bg-white rounded border">
                          <p className="text-xs text-gray-500 mb-1">Message from our team:</p>
                          <p className="text-sm">{revision.notes}</p>
                        </div>
                      )}

                      {respondingTo === revision.id ? (
                        <div className="space-y-3 p-4 bg-white rounded border">
                          <div>
                            <Label htmlFor={`notes-${revision.id}`} className="text-sm">Your Response (Optional)</Label>
                            <Textarea
                              id={`notes-${revision.id}`}
                              value={responseNotes[revision.id] || ''}
                              onChange={(e) => setResponseNotes({ ...responseNotes, [revision.id]: e.target.value })}
                              placeholder="Add any notes about your decision..."
                              rows={3}
                              className="text-sm"
                              data-testid={`textarea-response-notes-${revision.id}`}
                            />
                          </div>
                          <div className="flex flex-col sm:flex-row gap-2">
                            <Button
                              onClick={() => respondMutation.mutate({ 
                                revisionId: revision.id, 
                                decision: 'accept', 
                                notes: responseNotes[revision.id] || '' 
                              })}
                              disabled={respondMutation.isPending}
                              className="bg-green-600 hover:bg-green-700 min-h-[44px]"
                              data-testid={`button-confirm-accept-${revision.id}`}
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              {respondMutation.isPending ? 'Submitting...' : 'Confirm Accept'}
                            </Button>
                            <Button
                              onClick={() => respondMutation.mutate({ 
                                revisionId: revision.id, 
                                decision: 'reject', 
                                notes: responseNotes[revision.id] || '' 
                              })}
                              disabled={respondMutation.isPending}
                              variant="destructive"
                              className="min-h-[44px]"
                              data-testid={`button-confirm-reject-${revision.id}`}
                            >
                              <XCircle className="w-4 h-4 mr-2" />
                              {respondMutation.isPending ? 'Submitting...' : 'Confirm Reject'}
                            </Button>
                            <Button
                              onClick={() => {
                                setRespondingTo(null);
                                setResponseNotes({ ...responseNotes, [revision.id]: '' });
                              }}
                              variant="outline"
                              className="min-h-[44px]"
                              data-testid={`button-cancel-response-${revision.id}`}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col sm:flex-row gap-2">
                          <Button
                            onClick={() => setRespondingTo(revision.id)}
                            className="bg-green-600 hover:bg-green-700 min-h-[44px]"
                            data-testid={`button-accept-offer-${revision.id}`}
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Accept Offer
                          </Button>
                          <Button
                            onClick={() => setRespondingTo(revision.id)}
                            variant="destructive"
                            className="min-h-[44px]"
                            data-testid={`button-reject-offer-${revision.id}`}
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Reject Offer
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {isLoading || !inquiries ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : !inquiries || !(inquiries as any).inquiries || (Array.isArray((inquiries as any).inquiries) && (inquiries as any).inquiries.length === 0) ? (
            <Card>
              <CardContent className="py-12 text-center">
                <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No inquiries yet</h3>
                <p className="text-sm sm:text-base text-gray-600 mb-4">
                  You haven't submitted any product inquiries yet.
                </p>
                <Button onClick={() => setLocation('/products')} className="min-h-[44px]" data-testid="button-browse-products">
                  Browse Products
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {(Array.isArray((inquiries as any).inquiries) ? (inquiries as any).inquiries : []).map((inquiry: any) => (
                <Card key={inquiry.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row items-start justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3 w-full sm:w-auto">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Package className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
                            {inquiry.productName || 'Product Inquiry'}
                          </h3>
                          <p className="text-sm text-gray-600 truncate">
                            Inquiry ID: {inquiry.inquiryId}
                          </p>
                        </div>
                      </div>
                      <Badge className={`${getStatusColor(inquiry.status || 'pending')} shrink-0`}>
                        {inquiry.status || 'pending'}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4">
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider">Quantity</p>
                        <p className="font-medium text-sm sm:text-base">{inquiry.quantity} {inquiry.unit}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider">Urgency</p>
                        <p className="font-medium text-sm sm:text-base capitalize">{inquiry.urgency || 'normal'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider">Submitted</p>
                        <p className="font-medium text-sm sm:text-base">
                          {inquiry.createdAt ? formatDistanceToNow(new Date(inquiry.createdAt), { addSuffix: true }) : 'Recently'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Actions</p>
                        <Button variant="outline" size="sm" className="min-h-[44px] w-full sm:w-auto" data-testid={`button-view-inquiry-${inquiry.id}`}>
                          <Eye className="w-3 h-3 mr-1" />
                          View
                        </Button>
                      </div>
                    </div>

                    {inquiry.message && (
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-sm text-gray-700 break-words">{inquiry.message}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}