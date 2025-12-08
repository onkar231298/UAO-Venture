import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Loader2, Search, Filter, ShoppingCart, Building, Calendar, DollarSign, User, ChevronRight, Package, FileText, Eye, Truck, Clock, CheckCircle } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

const SO_STATUSES = [
  { id: "draft", label: "Draft", color: "bg-gray-100 text-gray-800" },
  { id: "pending_approval", label: "Pending Approval", color: "bg-yellow-100 text-yellow-800" },
  { id: "confirmed", label: "Confirmed", color: "bg-blue-100 text-blue-800" },
  { id: "in_production", label: "In Production", color: "bg-indigo-100 text-indigo-800" },
  { id: "ready_to_ship", label: "Ready to Ship", color: "bg-cyan-100 text-cyan-800" },
  { id: "partially_shipped", label: "Partially Shipped", color: "bg-orange-100 text-orange-800" },
  { id: "shipped", label: "Shipped", color: "bg-purple-100 text-purple-800" },
  { id: "delivered", label: "Delivered", color: "bg-green-100 text-green-800" },
  { id: "cancelled", label: "Cancelled", color: "bg-red-100 text-red-800" },
  { id: "on_hold", label: "On Hold", color: "bg-slate-100 text-slate-800" },
];

export default function SalesOrdersPage() {
  const { user } = useAuth() as { user: any };
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);

  const { data: ordersData, isLoading } = useQuery<{ orders: any[]; total: number }>({
    queryKey: ["/api/sales-orders", { status: statusFilter !== "all" ? statusFilter : undefined, search: searchTerm || undefined }],
  });

  const orders = ordersData?.orders || [];

  const getStatusBadge = (status: string) => {
    const statusInfo = SO_STATUSES.find(s => s.id === status);
    return statusInfo || { label: status, color: "bg-gray-100 text-gray-800" };
  };

  const formatCurrency = (amount: number | string | null, currency: string = "USD") => {
    if (!amount) return `${currency} 0.00`;
    const num = typeof amount === "string" ? parseFloat(amount) : amount;
    return `${currency} ${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const handleViewOrder = (order: any) => {
    setSelectedOrder(order);
    setShowDetailDialog(true);
  };

  const filteredOrders = orders.filter((order: any) => {
    const matchesSearch = !searchTerm || 
      order.soNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.company?.companyName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
          <ShoppingCart className="h-7 w-7 text-purple-600" />
          Sales Orders
        </h1>
        <p className="text-sm sm:text-base text-gray-600">
          Manage and track all sales orders from quotation to delivery
        </p>
      </div>

      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search by SO number or company..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            data-testid="input-search-so"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[200px]" data-testid="select-status-filter">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {SO_STATUSES.map(status => (
              <SelectItem key={status.id} value={status.id}>{status.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Total Orders</p>
                <p className="text-xl font-bold text-gray-900">{orders.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Pending</p>
                <p className="text-xl font-bold text-gray-900">
                  {orders.filter((o: any) => o.status === "pending_approval" || o.status === "draft").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Package className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">In Production</p>
                <p className="text-xl font-bold text-gray-900">
                  {orders.filter((o: any) => o.status === "in_production" || o.status === "confirmed").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Delivered</p>
                <p className="text-xl font-bold text-gray-900">
                  {orders.filter((o: any) => o.status === "delivered").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {filteredOrders.length === 0 ? (
        <Card>
          <CardContent className="p-6 sm:p-12 text-center">
            <ShoppingCart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No sales orders found</h3>
            <p className="text-sm sm:text-base text-gray-600">
              {searchTerm || statusFilter !== "all" 
                ? "Try adjusting your search or filter criteria" 
                : "Sales orders will appear here when quotations are converted"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SO Number</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead className="hidden md:table-cell">Items</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden md:table-cell">Date</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order: any) => {
                    const statusInfo = getStatusBadge(order.status);
                    return (
                      <TableRow 
                        key={order.id} 
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => handleViewOrder(order)}
                        data-testid={`row-so-${order.id}`}
                      >
                        <TableCell>
                          <div className="font-medium text-purple-700">{order.soNumber}</div>
                          {order.quotation?.quotationId && (
                            <div className="text-xs text-gray-500">From: {order.quotation.quotationId}</div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Building className="h-4 w-4 text-gray-400" />
                            <span className="truncate max-w-[150px]">{order.company?.companyName || "N/A"}</span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Badge variant="outline">{order.itemCount || order.items?.length || 0} items</Badge>
                        </TableCell>
                        <TableCell>
                          <span className="font-semibold text-green-700">
                            {formatCurrency(order.totalAmount, order.currency)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="text-sm text-gray-500">
                            {order.createdAt && format(new Date(order.createdAt), "MMM d, yyyy")}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewOrder(order);
                            }}
                            data-testid={`button-view-so-${order.id}`}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-3xl max-h-[90vh] overflow-y-auto" data-testid="dialog-so-detail">
          {selectedOrder && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <ShoppingCart className="h-5 w-5 text-purple-600" />
                  {selectedOrder.soNumber}
                </DialogTitle>
                <DialogDescription>
                  Created {selectedOrder.createdAt && formatDistanceToNow(new Date(selectedOrder.createdAt), { addSuffix: true })}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6">
                <div className="flex flex-wrap gap-2">
                  <Badge className={getStatusBadge(selectedOrder.status).color}>
                    {getStatusBadge(selectedOrder.status).label}
                  </Badge>
                  {selectedOrder.quotation?.quotationId && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      {selectedOrder.quotation.quotationId}
                    </Badge>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <Building className="h-4 w-4" />
                        Customer
                      </h4>
                      <div className="space-y-2 text-sm">
                        <p className="font-medium">{selectedOrder.company?.companyName}</p>
                        {selectedOrder.contactPerson && (
                          <p className="text-gray-600">
                            Contact: {selectedOrder.contactPerson.contactName}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Payment Terms
                      </h4>
                      <div className="space-y-2 text-sm">
                        <p>
                          <span className="text-gray-600">Advance:</span>{" "}
                          <span className="font-medium">{selectedOrder.paymentTermsAdvancePercent || 0}%</span>
                        </p>
                        <p>
                          <span className="text-gray-600">Credit Days:</span>{" "}
                          <span className="font-medium">{selectedOrder.paymentTermsCreditDays || 30} days</span>
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      Order Items
                    </h4>
                    <div className="space-y-2">
                      {selectedOrder.items?.map((item: any, index: number) => (
                        <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded border">
                          <div>
                            <p className="font-medium">{item.productName}</p>
                            <p className="text-sm text-gray-600">
                              {item.quantity} {item.unit} @ {formatCurrency(item.unitPrice, selectedOrder.currency)} per {item.unit}
                            </p>
                          </div>
                          <p className="font-semibold text-green-700">
                            {formatCurrency(item.totalPrice, selectedOrder.currency)}
                          </p>
                        </div>
                      )) || (
                        <p className="text-gray-500 text-sm">No items loaded</p>
                      )}
                    </div>
                    <div className="mt-4 pt-4 border-t flex justify-between items-center">
                      <span className="font-semibold">Total Amount:</span>
                      <span className="text-xl font-bold text-green-700">
                        {formatCurrency(selectedOrder.totalAmount, selectedOrder.currency)}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {selectedOrder.shippingAddress && (
                  <Card>
                    <CardContent className="p-4">
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <Truck className="h-4 w-4" />
                        Shipping Address
                      </h4>
                      <div className="text-sm text-gray-700">
                        <p>{selectedOrder.shippingAddress}</p>
                        <p>{[selectedOrder.shippingCity, selectedOrder.shippingState, selectedOrder.shippingPostalCode].filter(Boolean).join(", ")}</p>
                        <p>{selectedOrder.shippingCountry}</p>
                        {selectedOrder.shippingMethod && (
                          <p className="mt-2">
                            <span className="text-gray-600">Method:</span> {selectedOrder.shippingMethod.toUpperCase().replace(/_/g, " ")}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {selectedOrder.expectedDeliveryDate && (
                  <div className="flex items-center gap-2 text-sm bg-blue-50 p-3 rounded border border-blue-200">
                    <Calendar className="h-4 w-4 text-blue-600" />
                    <span className="text-blue-800">
                      Expected Delivery: {format(new Date(selectedOrder.expectedDeliveryDate), "MMMM d, yyyy")}
                    </span>
                  </div>
                )}

                {selectedOrder.internalNotes && (
                  <div className="p-3 bg-yellow-50 rounded border border-yellow-200">
                    <h4 className="text-sm font-semibold text-yellow-800 mb-1">Internal Notes</h4>
                    <p className="text-sm text-gray-700">{selectedOrder.internalNotes}</p>
                  </div>
                )}
              </div>

              <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0 mt-4">
                <Button variant="outline" onClick={() => setShowDetailDialog(false)}>
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
