import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { SalesLayout } from "@/components/layouts/SalesLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  FileText, ShoppingCart, DollarSign, TrendingUp, 
  Eye, Activity, RefreshCw, Download, Building2, User, Mail, Package
} from "lucide-react";
import { format } from "date-fns";

interface SalesMetrics {
  weekly: {
    quotationsCount: number;
    quotationsValue: number;
    salesOrdersCount: number;
    salesOrdersValue: number;
  };
  total: {
    quotationsCount: number;
    quotationsValue: number;
    salesOrdersCount: number;
    salesOrdersValue: number;
  };
  isAdmin: boolean;
}

interface Quotation {
  id: number;
  quotationId: string;
  customerId: string | null;
  totalAmount: string | null;
  currency: string;
  status: string;
  createdAt: string;
  validUntil: string | null;
  leadId: number | null;
  productName: string | null;
  productId: string | null;
  sentAt: string | null;
}

interface SalesOrder {
  id: number;
  soNumber: string;
  companyId: number | null;
  companyName: string | null;
  leadId: number | null;
  grandTotal: string | null;
  currency: string;
  status: string;
  createdAt: string;
  expectedDeliveryDate: string | null;
}

export default function MySalesAndQuotations() {
  const [selectedTab, setSelectedTab] = useState("quotations");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);
  const [selectedSalesOrder, setSelectedSalesOrder] = useState<SalesOrder | null>(null);
  const [showQuotationDetail, setShowQuotationDetail] = useState(false);
  const [showSalesOrderDetail, setShowSalesOrderDetail] = useState(false);
  const [showQuotationActivity, setShowQuotationActivity] = useState(false);
  const [showSalesOrderActivity, setShowSalesOrderActivity] = useState(false);

  const { data: metrics, isLoading: metricsLoading } = useQuery<SalesMetrics>({
    queryKey: ['/api/sales-metrics'],
  });

  const { data: quotationsData, isLoading: quotationsLoading, refetch: refetchQuotations } = useQuery<{ quotations: Quotation[]; total: number }>({
    queryKey: ['/api/quotations', statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      const response = await fetch(`/api/quotations?${params}`, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch quotations');
      return response.json();
    },
  });

  const { data: salesOrdersData, isLoading: salesOrdersLoading, refetch: refetchSalesOrders } = useQuery<{ orders: SalesOrder[]; total: number }>({
    queryKey: ['/api/sales-orders', statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      const response = await fetch(`/api/sales-orders?${params}`, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch sales orders');
      return response.json();
    },
  });

  const formatCurrency = (amount: string | null, currency: string = 'INR') => {
    if (!amount) return '-';
    const num = parseFloat(amount);
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-800',
      sent: 'bg-blue-100 text-blue-800',
      accepted: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      expired: 'bg-orange-100 text-orange-800',
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-green-100 text-green-800',
      processing: 'bg-blue-100 text-blue-800',
      shipped: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return (
      <Badge className={statusColors[status] || 'bg-gray-100 text-gray-800'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const handleDownloadQuotationPdf = async (quotationId: number) => {
    try {
      const response = await fetch(`/api/quotations/${quotationId}/pdf`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to download PDF');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `quotation-${quotationId}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download PDF:', error);
    }
  };

  const handleDownloadSalesOrderPdf = async (soId: number) => {
    try {
      const response = await fetch(`/api/sales-orders/${soId}/pdf`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to download PDF');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sales-order-${soId}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download PDF:', error);
    }
  };

  return (
    <SalesLayout title="My Sales & Quotations" subtitle={metrics?.isAdmin ? 'View all quotations and sales orders' : 'View your quotations and sales orders'}>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div></div>
          <Button 
            variant="outline" 
            onClick={() => {
              refetchQuotations();
              refetchSalesOrders();
            }}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Weekly Quotations</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics?.weekly.quotationsCount || 0}</div>
              <p className="text-xs text-muted-foreground">
                {formatCurrency(metrics?.weekly.quotationsValue?.toString() || '0')} value
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Weekly Sales Orders</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics?.weekly.salesOrdersCount || 0}</div>
              <p className="text-xs text-muted-foreground">
                {formatCurrency(metrics?.weekly.salesOrdersValue?.toString() || '0')} value
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Quotations</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics?.total.quotationsCount || 0}</div>
              <p className="text-xs text-muted-foreground">
                {formatCurrency(metrics?.total.quotationsValue?.toString() || '0')} lifetime
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sales Orders</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics?.total.salesOrdersCount || 0}</div>
              <p className="text-xs text-muted-foreground">
                {formatCurrency(metrics?.total.salesOrdersValue?.toString() || '0')} lifetime
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Documents</CardTitle>
              <div className="flex items-center gap-4">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="accepted">Accepted</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="shipped">Shipped</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={selectedTab} onValueChange={setSelectedTab}>
              <TabsList className="grid w-full grid-cols-2 max-w-md">
                <TabsTrigger value="quotations" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Quotations ({quotationsData?.total || 0})
                </TabsTrigger>
                <TabsTrigger value="sales-orders" className="flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4" />
                  Sales Orders ({salesOrdersData?.total || 0})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="quotations" className="mt-4">
                {quotationsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : quotationsData?.quotations?.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No quotations found</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b text-left">
                          <th className="pb-3 font-medium">Quotation ID</th>
                          <th className="pb-3 font-medium">Product</th>
                          <th className="pb-3 font-medium">Amount</th>
                          <th className="pb-3 font-medium">Status</th>
                          <th className="pb-3 font-medium">Created</th>
                          <th className="pb-3 font-medium">Valid Until</th>
                          <th className="pb-3 font-medium text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {quotationsData?.quotations?.map((quotation) => (
                          <tr key={quotation.id} className="border-b hover:bg-muted/50">
                            <td className="py-3 font-medium">{quotation.quotationId}</td>
                            <td className="py-3">
                              <div className="flex items-center gap-2">
                                <Package className="h-4 w-4 text-muted-foreground" />
                                <span className="truncate max-w-[200px]">{quotation.productName || '-'}</span>
                              </div>
                            </td>
                            <td className="py-3">{formatCurrency(quotation.totalAmount, quotation.currency)}</td>
                            <td className="py-3">{getStatusBadge(quotation.status)}</td>
                            <td className="py-3">{format(new Date(quotation.createdAt), 'MMM d, yyyy')}</td>
                            <td className="py-3">
                              {quotation.validUntil ? format(new Date(quotation.validUntil), 'MMM d, yyyy') : '-'}
                            </td>
                            <td className="py-3">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedQuotation(quotation);
                                    setShowQuotationDetail(true);
                                  }}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedQuotation(quotation);
                                    setShowQuotationActivity(true);
                                  }}
                                >
                                  <Activity className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDownloadQuotationPdf(quotation.id)}
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="sales-orders" className="mt-4">
                {salesOrdersLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : salesOrdersData?.orders?.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No sales orders found</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b text-left">
                          <th className="pb-3 font-medium">SO Number</th>
                          <th className="pb-3 font-medium">Company</th>
                          <th className="pb-3 font-medium">Amount</th>
                          <th className="pb-3 font-medium">Status</th>
                          <th className="pb-3 font-medium">Created</th>
                          <th className="pb-3 font-medium">Delivery Date</th>
                          <th className="pb-3 font-medium text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {salesOrdersData?.orders?.map((order) => (
                          <tr key={order.id} className="border-b hover:bg-muted/50">
                            <td className="py-3 font-medium">{order.soNumber}</td>
                            <td className="py-3">
                              <div className="flex items-center gap-2">
                                <Building2 className="h-4 w-4 text-muted-foreground" />
                                <span className="truncate max-w-[200px]">{order.companyName || '-'}</span>
                              </div>
                            </td>
                            <td className="py-3">{formatCurrency(order.grandTotal, order.currency)}</td>
                            <td className="py-3">{getStatusBadge(order.status)}</td>
                            <td className="py-3">{format(new Date(order.createdAt), 'MMM d, yyyy')}</td>
                            <td className="py-3">
                              {order.expectedDeliveryDate 
                                ? format(new Date(order.expectedDeliveryDate), 'MMM d, yyyy') 
                                : '-'}
                            </td>
                            <td className="py-3">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedSalesOrder(order);
                                    setShowSalesOrderDetail(true);
                                  }}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedSalesOrder(order);
                                    setShowSalesOrderActivity(true);
                                  }}
                                >
                                  <Activity className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDownloadSalesOrderPdf(order.id)}
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <QuotationDetailDialog 
        quotation={selectedQuotation}
        open={showQuotationDetail}
        onClose={() => setShowQuotationDetail(false)}
      />

      <SalesOrderDetailDialog
        salesOrder={selectedSalesOrder}
        open={showSalesOrderDetail}
        onClose={() => setShowSalesOrderDetail(false)}
      />

      <QuotationActivityDialog
        quotation={selectedQuotation}
        open={showQuotationActivity}
        onClose={() => setShowQuotationActivity(false)}
      />

      <SalesOrderActivityDialog
        salesOrder={selectedSalesOrder}
        open={showSalesOrderActivity}
        onClose={() => setShowSalesOrderActivity(false)}
      />
    </SalesLayout>
  );
}

function QuotationDetailDialog({ quotation, open, onClose }: { quotation: Quotation | null; open: boolean; onClose: () => void }) {
  const { data: quotationDetails } = useQuery({
    queryKey: ['/api/quotations', quotation?.id],
    enabled: !!quotation?.id && open,
    queryFn: async () => {
      const response = await fetch(`/api/quotations/${quotation?.id}`, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch quotation details');
      return response.json();
    },
  });

  if (!quotation) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Quotation Details - {quotation.quotationId}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-4 p-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge className={quotation.status === 'accepted' ? 'bg-green-100 text-green-800' : 'bg-gray-100'}>
                  {quotation.status}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Amount</p>
                <p className="font-semibold">{quotation.totalAmount ? `₹${parseFloat(quotation.totalAmount).toLocaleString()}` : '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Created</p>
                <p>{format(new Date(quotation.createdAt), 'PPP')}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Valid Until</p>
                <p>{quotation.validUntil ? format(new Date(quotation.validUntil), 'PPP') : '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Product</p>
                <p>{quotation.productName || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Lead ID</p>
                <p>{quotation.leadId ? `#${quotation.leadId}` : '-'}</p>
              </div>
            </div>

            {quotationDetails?.items && quotationDetails.items.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Items</h4>
                <div className="border rounded-lg">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="p-2 text-left">Product</th>
                        <th className="p-2 text-right">Qty</th>
                        <th className="p-2 text-right">Unit Price</th>
                        <th className="p-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {quotationDetails.items.map((item: any, idx: number) => (
                        <tr key={idx} className="border-b last:border-0">
                          <td className="p-2">{item.productName || `Product ${item.productId}`}</td>
                          <td className="p-2 text-right">{item.quantity} {item.unit}</td>
                          <td className="p-2 text-right">₹{parseFloat(item.unitPrice || '0').toLocaleString()}</td>
                          <td className="p-2 text-right">₹{parseFloat(item.totalPrice || '0').toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

function SalesOrderDetailDialog({ salesOrder, open, onClose }: { salesOrder: SalesOrder | null; open: boolean; onClose: () => void }) {
  const { data: orderDetails } = useQuery({
    queryKey: ['/api/sales-orders', salesOrder?.id],
    enabled: !!salesOrder?.id && open,
    queryFn: async () => {
      const response = await fetch(`/api/sales-orders/${salesOrder?.id}`, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch sales order details');
      return response.json();
    },
  });

  if (!salesOrder) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Sales Order Details - {salesOrder.soNumber}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-4 p-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge className={salesOrder.status === 'delivered' ? 'bg-green-100 text-green-800' : 'bg-gray-100'}>
                  {salesOrder.status}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Amount</p>
                <p className="font-semibold">{salesOrder.grandTotal ? `₹${parseFloat(salesOrder.grandTotal).toLocaleString()}` : '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Company</p>
                <p>{salesOrder.companyName || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Created</p>
                <p>{format(new Date(salesOrder.createdAt), 'PPP')}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Expected Delivery</p>
                <p>{salesOrder.expectedDeliveryDate ? format(new Date(salesOrder.expectedDeliveryDate), 'PPP') : '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Lead ID</p>
                <p>{salesOrder.leadId ? `#${salesOrder.leadId}` : '-'}</p>
              </div>
            </div>

            {orderDetails?.items && orderDetails.items.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Items</h4>
                <div className="border rounded-lg">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="p-2 text-left">Product</th>
                        <th className="p-2 text-right">Qty</th>
                        <th className="p-2 text-right">Unit Price</th>
                        <th className="p-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orderDetails.items.map((item: any, idx: number) => (
                        <tr key={idx} className="border-b last:border-0">
                          <td className="p-2">{item.productName}</td>
                          <td className="p-2 text-right">{item.quantity} {item.unit}</td>
                          <td className="p-2 text-right">₹{parseFloat(item.unitPrice || '0').toLocaleString()}</td>
                          <td className="p-2 text-right">₹{parseFloat(item.totalPrice || '0').toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

function QuotationActivityDialog({ quotation, open, onClose }: { quotation: Quotation | null; open: boolean; onClose: () => void }) {
  const { data: activities } = useQuery({
    queryKey: ['/api/crm/leads', quotation?.leadId, 'activities'],
    enabled: !!quotation?.leadId && open,
    queryFn: async () => {
      const response = await fetch(`/api/crm/leads/${quotation?.leadId}/activities`, { credentials: 'include' });
      if (!response.ok) return [];
      return response.json();
    },
  });

  if (!quotation) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Activity - {quotation.quotationId}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-4 p-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Package className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Product:</span> {quotation.productName || 'N/A'}
              </div>
              {quotation.leadId && (
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Lead:</span> #{quotation.leadId}
                </div>
              )}
              {quotation.sentAt && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Sent:</span> {format(new Date(quotation.sentAt), 'PPP')}
                </div>
              )}
            </div>

            {activities && activities.length > 0 ? (
              <div>
                <h4 className="font-medium mb-2">Lead Activities</h4>
                <div className="space-y-2">
                  {activities.slice(0, 10).map((activity: any) => (
                    <div key={activity.id} className="border rounded p-2 text-sm">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline">{activity.activityType}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(activity.createdAt), 'MMM d, HH:mm')}
                        </span>
                      </div>
                      <p className="mt-1">{activity.subject}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-4">No activities found for this quotation</p>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

function SalesOrderActivityDialog({ salesOrder, open, onClose }: { salesOrder: SalesOrder | null; open: boolean; onClose: () => void }) {
  const { data: activities } = useQuery({
    queryKey: ['/api/sales-orders', salesOrder?.id, 'activities'],
    enabled: !!salesOrder?.id && open,
    queryFn: async () => {
      const response = await fetch(`/api/sales-orders/${salesOrder?.id}/activities`, { credentials: 'include' });
      if (!response.ok) return [];
      return response.json();
    },
  });

  const { data: history } = useQuery({
    queryKey: ['/api/sales-orders', salesOrder?.id, 'history'],
    enabled: !!salesOrder?.id && open,
    queryFn: async () => {
      const response = await fetch(`/api/sales-orders/${salesOrder?.id}/history`, { credentials: 'include' });
      if (!response.ok) return [];
      return response.json();
    },
  });

  if (!salesOrder) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Activity - {salesOrder.soNumber}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-4 p-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Company:</span> {salesOrder.companyName || 'N/A'}
              </div>
              {salesOrder.leadId && (
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Lead:</span> #{salesOrder.leadId}
                </div>
              )}
            </div>

            {history && history.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Status History</h4>
                <div className="space-y-2">
                  {history.map((h: any) => (
                    <div key={h.id} className="border rounded p-2 text-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{h.fromStatus || 'Created'}</Badge>
                          <span>→</span>
                          <Badge>{h.toStatus}</Badge>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(h.createdAt), 'MMM d, HH:mm')}
                        </span>
                      </div>
                      {h.notes && <p className="mt-1 text-muted-foreground">{h.notes}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activities && activities.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Activities</h4>
                <div className="space-y-2">
                  {activities.map((activity: any) => (
                    <div key={activity.id} className="border rounded p-2 text-sm">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline">{activity.activityType}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(activity.createdAt), 'MMM d, HH:mm')}
                        </span>
                      </div>
                      <p className="mt-1">{activity.title}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(!activities || activities.length === 0) && (!history || history.length === 0) && (
              <p className="text-center text-muted-foreground py-4">No activities found for this sales order</p>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
