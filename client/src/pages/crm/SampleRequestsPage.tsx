import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Package, Search, Check, X, Truck, Eye, Filter, RefreshCw } from "lucide-react";
import { format } from "date-fns";

interface SampleRequest {
  id: number;
  requestId: string;
  customerId: string | null;
  productId: number | null;
  contactName: string;
  companyName: string;
  phoneNumber: string;
  emailAddress: string;
  sampleSize: string;
  purpose: string;
  expectedOrderQuantity: string | null;
  message: string | null;
  shippingAddress: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  status: string;
  assignedTo: string | null;
  createdAt: string;
  updatedAt: string;
  productName?: string;
  customerName?: string;
}

export default function SampleRequestsPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [selectedRequest, setSelectedRequest] = useState<SampleRequest | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showActionDialog, setShowActionDialog] = useState(false);
  const [actionType, setActionType] = useState<"approve" | "reject" | "ship" | "deliver" | null>(null);
  const [actionNotes, setActionNotes] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data: sampleRequests, isLoading } = useQuery<{ requests: SampleRequest[], total: number }>({
    queryKey: ['/api/sample-requests', { status: statusFilter !== 'all' ? statusFilter : undefined }],
  });

  useEffect(() => {
    const intervalId = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ['/api/sample-requests'] });
    }, 300000);

    return () => clearInterval(intervalId);
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['/api/sample-requests'] });
    toast({
      title: "Success",
      description: "Sample requests data has been updated",
    });
    setIsRefreshing(false);
  };

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, notes, trackingNumber }: { 
      id: number; 
      status: string; 
      notes?: string;
      trackingNumber?: string;
    }) => {
      const updateData: any = { status };
      if (notes) updateData.notes = notes;
      if (trackingNumber) updateData.trackingNumber = trackingNumber;
      
      return apiRequest(`/api/sample-requests/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sample-requests'] });
      toast({
        title: "Success",
        description: "Sample request status updated successfully",
      });
      setShowActionDialog(false);
      setSelectedRequest(null);
      setActionNotes("");
      setTrackingNumber("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update sample request",
        variant: "destructive",
      });
    },
  });

  const handleAction = (request: SampleRequest, action: "approve" | "reject" | "ship" | "deliver") => {
    setSelectedRequest(request);
    setActionType(action);
    setShowActionDialog(true);
  };

  const handleConfirmAction = () => {
    if (!selectedRequest || !actionType) return;

    let newStatus = "";
    if (actionType === "approve") newStatus = "approved";
    if (actionType === "reject") newStatus = "rejected";
    if (actionType === "ship") newStatus = "shipped";
    if (actionType === "deliver") newStatus = "completed";

    updateStatusMutation.mutate({
      id: selectedRequest.id,
      status: newStatus,
      notes: actionNotes,
      trackingNumber: actionType === "ship" ? trackingNumber : undefined,
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; label: string }> = {
      pending: { color: "bg-yellow-100 text-yellow-800", label: "Pending" },
      approved: { color: "bg-blue-100 text-blue-800", label: "Approved" },
      shipped: { color: "bg-purple-100 text-purple-800", label: "Shipped" },
      completed: { color: "bg-green-100 text-green-800", label: "Completed" },
      rejected: { color: "bg-red-100 text-red-800", label: "Rejected" },
    };

    const config = statusConfig[status] || statusConfig.pending;
    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    );
  };

  const filteredRequests = sampleRequests?.requests?.filter((request) => {
    const matchesSearch = searchQuery === "" || 
      request.contactName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.requestId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.emailAddress.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || request.status === statusFilter;

    let matchesDate = true;
    if (dateFilter !== "all") {
      const requestDate = new Date(request.createdAt);
      const today = new Date();
      const daysDiff = Math.floor((today.getTime() - requestDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (dateFilter === "today") matchesDate = daysDiff === 0;
      if (dateFilter === "week") matchesDate = daysDiff <= 7;
      if (dateFilter === "month") matchesDate = daysDiff <= 30;
    }

    return matchesSearch && matchesStatus && matchesDate;
  }) || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-1">Sample Requests Management</h2>
          <p className="text-sm text-gray-600">Manage and process customer sample requests</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            data-testid="button-refresh-samples"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Badge variant="outline" className="text-sm">
            {filteredRequests.length} Total
          </Badge>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Sample Requests
          </CardTitle>
          <CardDescription>View and manage all customer sample requests</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col lg:flex-row gap-4 mb-6 p-4 bg-orange-50 rounded-lg">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by customer, company, email, or request ID..."
                  className="pl-10 bg-white"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  data-testid="input-search-requests"
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32 bg-white" data-testid="select-status-filter">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="shipped">Shipped</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-32 bg-white" data-testid="select-date-filter">
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

          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="animate-pulse bg-gray-100 h-24 rounded"></div>
              ))}
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No sample requests found</h3>
              <p className="text-gray-600">
                {searchQuery || statusFilter !== "all" || dateFilter !== "all"
                  ? "Try adjusting your filters"
                  : "New sample requests will appear here"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-4 sm:mx-0" style={{ WebkitOverflowScrolling: 'touch' }}>
              <div className="inline-block min-w-full align-middle">
                <div className="overflow-hidden sm:rounded-lg">
                  <Table className="min-w-[800px]">
                    <TableHeader className="md:sticky md:top-0 md:z-10 md:bg-white md:dark:bg-gray-800">
                      <TableRow>
                        <TableHead>Request ID</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Sample Size</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRequests.map((request) => (
                        <TableRow key={request.id} data-testid={`row-request-${request.id}`}>
                          <TableCell className="font-semibold" data-testid={`text-request-id-${request.id}`}>
                            {request.requestId}
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium" data-testid={`text-customer-${request.id}`}>
                                {request.contactName}
                              </p>
                              <p className="text-xs text-gray-500">{request.purpose}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">{request.companyName}</span>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="text-sm">{request.emailAddress}</p>
                              <p className="text-xs text-gray-500">{request.phoneNumber}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">{request.sampleSize || "25g"}</span>
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(request.status)}
                          </TableCell>
                          <TableCell>
                            <span className="text-xs text-gray-500">
                              {format(new Date(request.createdAt), "MMM dd, yyyy")}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => {
                                  setSelectedRequest(request);
                                  setShowDetailsDialog(true);
                                }}
                                data-testid={`button-view-${request.id}`}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              {request.status === "pending" && (
                                <>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => handleAction(request, "approve")}
                                    className="text-green-600 hover:text-green-700"
                                    data-testid={`button-approve-${request.id}`}
                                  >
                                    <Check className="w-4 h-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => handleAction(request, "reject")}
                                    className="text-red-600 hover:text-red-700"
                                    data-testid={`button-reject-${request.id}`}
                                  >
                                    <X className="w-4 h-4" />
                                  </Button>
                                </>
                              )}
                              {request.status === "approved" && (
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleAction(request, "ship")}
                                  className="text-blue-600 hover:text-blue-700"
                                  data-testid={`button-ship-${request.id}`}
                                >
                                  <Truck className="w-4 h-4" />
                                </Button>
                              )}
                              {request.status === "shipped" && (
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleAction(request, "deliver")}
                                  className="text-green-600 hover:text-green-700"
                                  data-testid={`button-deliver-${request.id}`}
                                >
                                  <Check className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Sample Request Details</DialogTitle>
            <DialogDescription>Request ID: {selectedRequest?.requestId}</DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="font-semibold">Status:</span>
                {getStatusBadge(selectedRequest.status)}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-600">Customer Name</Label>
                  <p className="font-medium">{selectedRequest.contactName}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Company</Label>
                  <p className="font-medium">{selectedRequest.companyName}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Email</Label>
                  <p className="font-medium">{selectedRequest.emailAddress}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Phone</Label>
                  <p className="font-medium">{selectedRequest.phoneNumber}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Sample Size</Label>
                  <p className="font-medium">{selectedRequest.sampleSize || "25g"}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Purpose</Label>
                  <p className="font-medium">{selectedRequest.purpose}</p>
                </div>
                {selectedRequest.expectedOrderQuantity && (
                  <div className="col-span-2">
                    <Label className="text-gray-600">Expected Order Quantity</Label>
                    <p className="font-medium">{selectedRequest.expectedOrderQuantity}</p>
                  </div>
                )}
              </div>

              {selectedRequest.message && (
                <div>
                  <Label className="text-gray-600">Message</Label>
                  <p className="mt-1 p-3 bg-gray-50 rounded text-sm">{selectedRequest.message}</p>
                </div>
              )}

              <div>
                <Label className="text-gray-600 text-base font-semibold">Shipping Address</Label>
                <div className="mt-2 p-3 bg-gray-50 rounded">
                  <p>{selectedRequest.shippingAddress}</p>
                  <p>{selectedRequest.city}, {selectedRequest.state} {selectedRequest.postalCode}</p>
                  <p>{selectedRequest.country}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-600">Created At</Label>
                  <p className="font-medium">
                    {format(new Date(selectedRequest.createdAt), "PPpp")}
                  </p>
                </div>
                <div>
                  <Label className="text-gray-600">Last Updated</Label>
                  <p className="font-medium">
                    {format(new Date(selectedRequest.updatedAt), "PPpp")}
                  </p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Action Dialog */}
      <Dialog open={showActionDialog} onOpenChange={setShowActionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === "approve" && "Approve Sample Request"}
              {actionType === "reject" && "Reject Sample Request"}
              {actionType === "ship" && "Mark as Shipped"}
              {actionType === "deliver" && "Mark as Delivered"}
            </DialogTitle>
            <DialogDescription>
              Request ID: {selectedRequest?.requestId}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {actionType === "ship" && (
              <div>
                <Label htmlFor="tracking">Tracking Number</Label>
                <Input
                  id="tracking"
                  placeholder="Enter tracking number"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  data-testid="input-tracking-number"
                />
              </div>
            )}
            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add any notes or comments..."
                value={actionNotes}
                onChange={(e) => setActionNotes(e.target.value)}
                rows={3}
                data-testid="input-action-notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowActionDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmAction}
              disabled={updateStatusMutation.isPending || (actionType === "ship" && !trackingNumber)}
              data-testid="button-confirm-action"
            >
              {updateStatusMutation.isPending ? "Processing..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
