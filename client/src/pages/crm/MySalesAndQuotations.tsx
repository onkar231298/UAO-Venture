import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { SalesLayout } from "@/components/layouts/SalesLayout";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  FileText, ShoppingCart, DollarSign, TrendingUp, 
  Eye, Activity, RefreshCw, Download, Building2, User, Mail, Package, Pencil,
  Search, Calendar, Phone, MapPin, FileCheck, Clock, Hash, Send, Trash2
} from "lucide-react";
import { format } from "date-fns";
import QuotationForm from "@/components/QuotationForm";
import QuotationToSalesOrderButton from "@/components/crm/QuotationToSalesOrderButton";
import QuotationDocumentsPanel from "@/components/crm/QuotationDocumentsPanel";
import type { Inquiry } from "@shared/schema";

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
  inquiryId?: number | null;
  customerId: string | null;
  customerCompanyName: string | null;
  totalAmount: string | null;
  currency: string;
  status: string;
  createdAt: string;
  validUntil: string | null;
  leadId: number | null;
  leadDisplayId: string | null;
  productName: string | null;
  productId: string | null;
  sentAt: string | null;
  salesOrderId?: number | null;
}

interface SalesOrder {
  id: number;
  soNumber: string;
  companyId: number | null;
  companyName: string | null;
  customerCompanyName: string | null;
  leadId: number | null;
  leadDisplayId: string | null;
  grandTotal: string | null;
  currency: string;
  status: string;
  createdAt: string;
  expectedDeliveryDate: string | null;
}

export default function MySalesAndQuotations() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState("quotations");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);
  const [selectedSalesOrder, setSelectedSalesOrder] = useState<SalesOrder | null>(null);
  const [showQuotationDetail, setShowQuotationDetail] = useState(false);
  const [showSalesOrderDetail, setShowSalesOrderDetail] = useState(false);
  const [showQuotationActivity, setShowQuotationActivity] = useState(false);
  const [showSalesOrderActivity, setShowSalesOrderActivity] = useState(false);
  const [downloadingQuotationId, setDownloadingQuotationId] = useState<number | null>(null);
  const [editingQuotationId, setEditingQuotationId] = useState<number | null>(null);
  const [quotationToDelete, setQuotationToDelete] = useState<Quotation | null>(null);

  const publishQuotationMutation = useMutation({
    mutationFn: async (quotationId: number) => {
      const response = await fetch(`/api/quotations/${quotationId}/publish-to-customer`, {
        method: "PATCH",
        credentials: "include",
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.message || "Failed to publish quotation to the customer dashboard");
      }
      return result;
    },
    onSuccess: (quotation: Quotation) => {
      queryClient.invalidateQueries({ queryKey: ["/api/quotations"] });
      if (quotation.customerId) {
        queryClient.invalidateQueries({
          queryKey: [`/api/customer/quotations/${quotation.customerId}`],
        });
      }
      toast({
        title: "Quote published",
        description: "The customer can now view and download the quotation in their dashboard. No email was sent.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Could not publish quote",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteQuotationMutation = useMutation({
    mutationFn: async (quotationId: number) => {
      const response = await fetch(`/api/quotations/${quotationId}`, {
        method: "DELETE",
        credentials: "include",
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.message || "Failed to delete draft quotation");
      }
      return result as { id: number; quotationId: string };
    },
    onSuccess: (deletedQuotation) => {
      queryClient.invalidateQueries({ queryKey: ["/api/quotations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sales-metrics"] });
      setQuotationToDelete(null);
      toast({
        title: "Draft quotation deleted",
        description: `${deletedQuotation.quotationId} and its line items were permanently removed.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Could not delete draft quotation",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const { data: metrics, isLoading: metricsLoading } = useQuery<SalesMetrics>({
    queryKey: ['/api/sales-metrics'],
  });

  const { data: quotationsData, isLoading: quotationsLoading, refetch: refetchQuotations } = useQuery<{ quotations: Quotation[]; total: number }>({
    queryKey: ['/api/quotations', statusFilter, searchQuery, dateFrom, dateTo],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (searchQuery) params.append('search', searchQuery);
      if (dateFrom) params.append('dateFrom', dateFrom);
      if (dateTo) params.append('dateTo', dateTo);
      const response = await fetch(`/api/quotations?${params}`, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch quotations');
      return response.json();
    },
  });

  const { data: salesOrdersData, isLoading: salesOrdersLoading, refetch: refetchSalesOrders } = useQuery<{ orders: SalesOrder[]; total: number }>({
    queryKey: ['/api/sales-orders', statusFilter, searchQuery, dateFrom, dateTo],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (searchQuery) params.append('search', searchQuery);
      if (dateFrom) params.append('dateFrom', dateFrom);
      if (dateTo) params.append('dateTo', dateTo);
      const response = await fetch(`/api/sales-orders?${params}`, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch sales orders');
      return response.json();
    },
  });

  const clearFilters = () => {
    setStatusFilter("all");
    setSearchQuery("");
    setDateFrom("");
    setDateTo("");
  };

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
    setDownloadingQuotationId(quotationId);
    try {
      const response = await fetch(`/api/quotations/${quotationId}/pdf`, {
        credentials: 'include',
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || `PDF download failed (${response.status})`);
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `quotation-${quotationId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.setTimeout(() => window.URL.revokeObjectURL(url), 1000);
    } catch (error) {
      console.error('Failed to download PDF:', error);
      toast({
        title: "Could not download quotation PDF",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setDownloadingQuotationId(null);
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
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <CardTitle>Documents</CardTitle>
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  Clear Filters
                </Button>
              </div>
              <div className="flex flex-wrap items-end gap-3">
                <div className="flex-1 min-w-[200px]">
                  <Label className="text-xs text-muted-foreground mb-1 block">Search</Label>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder={selectedTab === "quotations" ? "Search by quotation number..." : "Search by SO number..."}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
                <div className="w-[160px]">
                  <Label className="text-xs text-muted-foreground mb-1 block">Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Statuses" />
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
                <div className="w-[140px]">
                  <Label className="text-xs text-muted-foreground mb-1 block">From Date</Label>
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                  />
                </div>
                <div className="w-[140px]">
                  <Label className="text-xs text-muted-foreground mb-1 block">To Date</Label>
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                  />
                </div>
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
                          <th className="pb-3 font-medium">Lead ID</th>
                          <th className="pb-3 font-medium">Company</th>
                          <th className="pb-3 font-medium">Product</th>
                          <th className="pb-3 font-medium">Amount</th>
                          <th className="pb-3 font-medium">Status</th>
                          <th className="pb-3 font-medium">Created</th>
                          <th className="pb-3 font-medium text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {quotationsData?.quotations?.map((quotation) => (
                          <tr key={quotation.id} className="border-b hover:bg-muted/50">
                            <td className="py-3 font-medium">{quotation.quotationId}</td>
                            <td className="py-3">
                              {quotation.leadDisplayId ? (
                                <Badge variant="outline" className="font-mono text-xs">
                                  {quotation.leadDisplayId}
                                </Badge>
                              ) : '-'}
                            </td>
                            <td className="py-3">
                              <div className="flex items-center gap-2">
                                <Building2 className="h-4 w-4 text-muted-foreground" />
                                <span className="truncate max-w-[150px]">{quotation.customerCompanyName || '-'}</span>
                              </div>
                            </td>
                            <td className="py-3">
                              <div className="flex items-center gap-2">
                                <Package className="h-4 w-4 text-muted-foreground" />
                                <span className="truncate max-w-[150px]">{quotation.productName || '-'}</span>
                              </div>
                            </td>
                            <td className="py-3">{formatCurrency(quotation.totalAmount, quotation.currency)}</td>
                            <td className="py-3">{getStatusBadge(quotation.status)}</td>
                            <td className="py-3">{format(new Date(quotation.createdAt), 'MMM d, yyyy')}</td>
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
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDownloadQuotationPdf(quotation.id)}
                                  disabled={downloadingQuotationId === quotation.id}
                                  data-testid={`button-download-quotation-pdf-${quotation.id}`}
                                  title={quotation.status === "draft" ? "Download draft PDF for review before sending" : "Download quotation PDF"}
                                >
                                  <Download className="mr-1 h-4 w-4" />
                                  {downloadingQuotationId === quotation.id
                                    ? "Preparing PDF..."
                                    : quotation.status === "draft"
                                      ? "Download Draft PDF"
                                      : "Download PDF"}
                                </Button>
                                {["sent", "accepted"].includes(quotation.status) && !quotation.salesOrderId && (
                                  <QuotationToSalesOrderButton
                                    quotationId={quotation.id}
                                    quotationNumber={quotation.quotationId}
                                    onConverted={() => setSelectedTab("sales-orders")}
                                  />
                                )}
                                {quotation.status === "draft" && quotation.inquiryId && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setEditingQuotationId(quotation.id)}
                                    data-testid={`button-edit-quotation-${quotation.id}`}
                                  >
                                    <Pencil className="mr-1 h-4 w-4" />
                                    Edit Quote
                                  </Button>
                                )}
                                {quotation.status === "draft" && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => publishQuotationMutation.mutate(quotation.id)}
                                    disabled={publishQuotationMutation.isPending}
                                    data-testid={`button-publish-quotation-${quotation.id}`}
                                    title="Make this quotation available in the customer dashboard"
                                  >
                                    <Send className="mr-1 h-4 w-4" />
                                    Send to customer
                                  </Button>
                                )}
                                {["draft", "sent"].includes(quotation.status) && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    disabled
                                    title="Email delivery is not connected yet. Use Send to customer to publish the quote in the portal."
                                    data-testid={`button-email-quotation-coming-soon-${quotation.id}`}
                                  >
                                    <Mail className="mr-1 h-4 w-4" />
                                    Email customer (soon)
                                  </Button>
                                )}
                                {quotation.status === "draft" && !quotation.sentAt && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-destructive hover:text-destructive"
                                    onClick={() => setQuotationToDelete(quotation)}
                                    disabled={deleteQuotationMutation.isPending}
                                    data-testid={`button-delete-quotation-${quotation.id}`}
                                    aria-label={`Delete draft quotation ${quotation.quotationId}`}
                                    title="Permanently delete this unsent draft"
                                  >
                                    <Trash2 className="mr-1 h-4 w-4" />
                                    Delete
                                  </Button>
                                )}
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
                          <th className="pb-3 font-medium">Lead ID</th>
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
                              {order.leadDisplayId ? (
                                <Badge variant="outline" className="font-mono text-xs">
                                  {order.leadDisplayId}
                                </Badge>
                              ) : '-'}
                            </td>
                            <td className="py-3">
                              <div className="flex items-center gap-2">
                                <Building2 className="h-4 w-4 text-muted-foreground" />
                                <span className="truncate max-w-[150px]">{order.customerCompanyName || order.companyName || '-'}</span>
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

      <QuotationEditDialog
        quotationId={editingQuotationId}
        open={editingQuotationId !== null}
        onClose={() => setEditingQuotationId(null)}
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

      <AlertDialog
        open={quotationToDelete !== null}
        onOpenChange={(open) => {
          if (!open) setQuotationToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete draft quotation?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes <strong>{quotationToDelete?.quotationId}</strong> and its quotation line items.
              This cannot be undone. Only unsent drafts can be deleted; sent or accepted quotations are protected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteQuotationMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (quotationToDelete) deleteQuotationMutation.mutate(quotationToDelete.id);
              }}
              disabled={deleteQuotationMutation.isPending}
              data-testid="button-confirm-delete-quotation"
            >
              {deleteQuotationMutation.isPending ? "Deleting..." : "Delete draft"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SalesLayout>
  );
}

export function QuotationEditDialog({
  quotationId,
  open,
  onClose
}: {
  quotationId: number | null;
  open: boolean;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: quotation, isLoading, isError } = useQuery({
    queryKey: ["/api/quotations", quotationId],
    enabled: open && quotationId !== null,
    queryFn: async () => {
      const response = await fetch(`/api/quotations/${quotationId}`, { credentials: "include" });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.message || "Failed to load quotation");
      return result;
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/quotations/${quotationId}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.message || "Failed to save quotation changes");
      return result;
    },
    onSuccess: (updatedQuotation) => {
      toast({
        title: "Draft updated",
        description: `${updatedQuotation.quotationId} has been saved. Download its PDF to review the latest version.`
      });
      queryClient.invalidateQueries({ queryKey: ["/api/quotations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sales-metrics"] });
      onClose();
    },
    onError: (error: Error) => {
      toast({ title: "Could not update quotation", description: error.message, variant: "destructive" });
    }
  });

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => { if (!nextOpen) onClose(); }}>
      <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Edit Draft Quotation{quotation?.quotationId ? ` — ${quotation.quotationId}` : ""}
          </DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-6 w-6 animate-spin" />
          </div>
        ) : isError ? (
          <p className="py-6 text-sm text-destructive">Could not load this quotation. Close the dialog and try again.</p>
        ) : quotation?.inquiry ? (
          <QuotationForm
            key={quotationId}
            inquiry={quotation.inquiry as Inquiry}
            initialQuotation={quotation}
            isEditing
            onSubmit={(data) => updateMutation.mutate(data)}
            isLoading={updateMutation.isPending}
          />
        ) : (
          <p className="py-6 text-sm text-muted-foreground">
            This quotation is not linked to a product enquiry, so it cannot be edited from this screen.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}

function QuotationDetailDialog({ quotation, open, onClose }: { quotation: Quotation | null; open: boolean; onClose: () => void }) {
  const { data: quotationDetails, isLoading } = useQuery({
    queryKey: ['/api/quotations', quotation?.id],
    enabled: !!quotation?.id && open,
    queryFn: async () => {
      const response = await fetch(`/api/quotations/${quotation?.id}`, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch quotation details');
      return response.json();
    },
  });

  if (!quotation) return null;

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

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Quotation Details - {quotation.quotationId}
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh]">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <div className="space-y-6 p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Status</p>
                  <Badge className={
                    quotation.status === 'accepted' ? 'bg-green-100 text-green-800' : 
                    quotation.status === 'rejected' ? 'bg-red-100 text-red-800' :
                    quotation.status === 'sent' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }>
                    {quotation.status.charAt(0).toUpperCase() + quotation.status.slice(1)}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Amount</p>
                  <p className="text-lg font-bold text-green-600">{formatCurrency(quotation.totalAmount, quotation.currency)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Lead ID</p>
                  <p className="font-medium">{quotation.leadId ? `#${quotation.leadId}` : '-'}</p>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Dates & Timeline
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-muted/30 rounded-lg p-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Created</p>
                    <p className="text-sm font-medium">{format(new Date(quotation.createdAt), 'MMM d, yyyy')}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Valid Until</p>
                    <p className="text-sm font-medium">{quotation.validUntil ? format(new Date(quotation.validUntil), 'MMM d, yyyy') : '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Sent At</p>
                    <p className="text-sm font-medium">{quotation.sentAt ? format(new Date(quotation.sentAt), 'MMM d, yyyy HH:mm') : 'Not sent'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Currency</p>
                    <p className="text-sm font-medium">{quotation.currency || 'INR'}</p>
                  </div>
                </div>
              </div>

              {quotationDetails?.customerName && (
                <>
                  <Separator />
                  <div>
                    <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Customer Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/30 rounded-lg p-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Customer Name</p>
                        <p className="text-sm font-medium">{quotationDetails.customerName || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Company</p>
                        <p className="text-sm font-medium">{quotationDetails.companyName || '-'}</p>
                      </div>
                      {quotationDetails.customerEmail && (
                        <div>
                          <p className="text-xs text-muted-foreground">Email</p>
                          <p className="text-sm font-medium flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {quotationDetails.customerEmail}
                          </p>
                        </div>
                      )}
                      {quotationDetails.customerPhone && (
                        <div>
                          <p className="text-xs text-muted-foreground">Phone</p>
                          <p className="text-sm font-medium flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {quotationDetails.customerPhone}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

              {quotationDetails?.items && quotationDetails.items.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      Items ({quotationDetails.items.length})
                    </h4>
                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b bg-muted/50">
                            <th className="p-3 text-left">Product</th>
                            <th className="p-3 text-right">Qty</th>
                            <th className="p-3 text-right">Unit Price</th>
                            <th className="p-3 text-right">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {quotationDetails.items.map((item: any, idx: number) => (
                            <tr key={idx} className="border-b last:border-0">
                              <td className="p-3">{item.productName || `Product ${item.productId}`}</td>
                              <td className="p-3 text-right">{item.quantity} {item.unit}</td>
                              <td className="p-3 text-right">{formatCurrency(item.unitPrice, quotation.currency)}</td>
                              <td className="p-3 text-right font-medium">{formatCurrency(item.totalPrice, quotation.currency)}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-muted/30">
                          <tr>
                            <td colSpan={3} className="p-3 text-right font-semibold">Total:</td>
                            <td className="p-3 text-right font-bold text-green-600">{formatCurrency(quotation.totalAmount, quotation.currency)}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                </>
              )}

              {(quotationDetails?.terms || quotationDetails?.notes) && (
                <>
                  <Separator />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {quotationDetails.terms && (
                      <div>
                        <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                          <FileCheck className="h-4 w-4" />
                          Terms & Conditions
                        </h4>
                        <div className="bg-muted/30 rounded-lg p-3 text-sm whitespace-pre-wrap">
                          {quotationDetails.terms}
                        </div>
                      </div>
                    )}
                    {quotationDetails.notes && (
                      <div>
                        <h4 className="text-sm font-semibold mb-2">Notes</h4>
                        <div className="bg-muted/30 rounded-lg p-3 text-sm whitespace-pre-wrap">
                          {quotationDetails.notes}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

              {quotationDetails?.termsTemplateVersion && (
                <>
                  <Separator />
                  <div className="rounded-lg border bg-muted/20 p-3">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">General Terms &amp; Conditions</p>
                    <p className="mt-1 text-sm font-medium">
                      Version {quotationDetails.termsTemplateVersion}
                      {quotationDetails.termsTemplateId ? ` · template #${quotationDetails.termsTemplateId}` : ""}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      This quotation retains the exact terms text saved when it was issued.
                    </p>
                  </div>
                </>
              )}

              {quotationDetails?.termsAcceptances?.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h4 className="mb-3 text-sm font-semibold flex items-center gap-2">
                      <FileCheck className="h-4 w-4" />
                      Terms Acceptance Audit
                    </h4>
                    <div className="space-y-2">
                      {quotationDetails.termsAcceptances.map((acceptance: any) => (
                        <div key={acceptance.id} className="rounded-lg border bg-muted/30 p-3 text-sm">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="font-medium">
                              {acceptance.customerCompanyName || "Customer"} accepted
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(acceptance.acceptedAt).toLocaleString()}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Method: {acceptance.acceptanceMethod.replace(/_/g, " ")}
                            {" · "}Terms version: {acceptance.termsTemplateVersion || "No version attached"}
                          </p>
                          {acceptance.supportingEvidence && (
                            <p className="mt-2 break-words text-xs">{acceptance.supportingEvidence}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <Separator />
              <QuotationDocumentsPanel
                quotationId={quotation.id}
                quotationStatus={quotation.status}
                mode="staff"
              />
              {["sent", "accepted"].includes(quotation.status) && !quotation.salesOrderId && (
                <div className="flex justify-end">
                  <QuotationToSalesOrderButton
                    quotationId={quotation.id}
                    quotationNumber={quotation.quotationId}
                    onConverted={onClose}
                  />
                </div>
              )}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

function SalesOrderDetailDialog({ salesOrder, open, onClose }: { salesOrder: SalesOrder | null; open: boolean; onClose: () => void }) {
  const { data: orderDetails, isLoading } = useQuery({
    queryKey: ['/api/sales-orders', salesOrder?.id],
    enabled: !!salesOrder?.id && open,
    queryFn: async () => {
      const response = await fetch(`/api/sales-orders/${salesOrder?.id}`, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch sales order details');
      return response.json();
    },
  });

  if (!salesOrder) return null;

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

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'shipped': return 'bg-purple-100 text-purple-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'confirmed': return 'bg-teal-100 text-teal-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Sales Order Details - {salesOrder.soNumber}
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh]">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <div className="space-y-6 p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Status</p>
                  <Badge className={getStatusBadgeColor(salesOrder.status)}>
                    {salesOrder.status.charAt(0).toUpperCase() + salesOrder.status.slice(1)}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Grand Total</p>
                  <p className="text-lg font-bold text-green-600">{formatCurrency(salesOrder.grandTotal, salesOrder.currency)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Lead ID</p>
                  <p className="font-medium">{salesOrder.leadId ? `#${salesOrder.leadId}` : '-'}</p>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Company & Customer
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/30 rounded-lg p-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Company</p>
                    <p className="text-sm font-medium">{salesOrder.companyName || '-'}</p>
                  </div>
                  {orderDetails?.customerName && (
                    <div>
                      <p className="text-xs text-muted-foreground">Contact Person</p>
                      <p className="text-sm font-medium">{orderDetails.customerName}</p>
                    </div>
                  )}
                  {orderDetails?.customerEmail && (
                    <div>
                      <p className="text-xs text-muted-foreground">Email</p>
                      <p className="text-sm font-medium flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {orderDetails.customerEmail}
                      </p>
                    </div>
                  )}
                  {orderDetails?.customerPhone && (
                    <div>
                      <p className="text-xs text-muted-foreground">Phone</p>
                      <p className="text-sm font-medium flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {orderDetails.customerPhone}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Dates & Timeline
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-muted/30 rounded-lg p-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Created</p>
                    <p className="text-sm font-medium">{format(new Date(salesOrder.createdAt), 'MMM d, yyyy')}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Expected Delivery</p>
                    <p className="text-sm font-medium">{salesOrder.expectedDeliveryDate ? format(new Date(salesOrder.expectedDeliveryDate), 'MMM d, yyyy') : '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Currency</p>
                    <p className="text-sm font-medium">{salesOrder.currency || 'INR'}</p>
                  </div>
                  {orderDetails?.paymentTerms && (
                    <div>
                      <p className="text-xs text-muted-foreground">Payment Terms</p>
                      <p className="text-sm font-medium">{orderDetails.paymentTerms}</p>
                    </div>
                  )}
                </div>
              </div>

              {orderDetails?.shippingAddress && (
                <>
                  <Separator />
                  <div>
                    <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Shipping Address
                    </h4>
                    <div className="bg-muted/30 rounded-lg p-3 text-sm">
                      {orderDetails.shippingAddress}
                    </div>
                  </div>
                </>
              )}

              {orderDetails?.items && orderDetails.items.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      Items ({orderDetails.items.length})
                    </h4>
                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b bg-muted/50">
                            <th className="p-3 text-left">Product</th>
                            <th className="p-3 text-right">Qty</th>
                            <th className="p-3 text-right">Unit Price</th>
                            <th className="p-3 text-right">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {orderDetails.items.map((item: any, idx: number) => (
                            <tr key={idx} className="border-b last:border-0">
                              <td className="p-3">{item.productName}</td>
                              <td className="p-3 text-right">{item.quantity} {item.unit}</td>
                              <td className="p-3 text-right">{formatCurrency(item.unitPrice, salesOrder.currency)}</td>
                              <td className="p-3 text-right font-medium">{formatCurrency(item.totalPrice, salesOrder.currency)}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-muted/30">
                          <tr>
                            <td colSpan={3} className="p-3 text-right font-semibold">Grand Total:</td>
                            <td className="p-3 text-right font-bold text-green-600">{formatCurrency(salesOrder.grandTotal, salesOrder.currency)}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                </>
              )}

              {(orderDetails?.terms || orderDetails?.notes) && (
                <>
                  <Separator />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {orderDetails.terms && (
                      <div>
                        <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                          <FileCheck className="h-4 w-4" />
                          Terms & Conditions
                        </h4>
                        <div className="bg-muted/30 rounded-lg p-3 text-sm whitespace-pre-wrap">
                          {orderDetails.terms}
                        </div>
                      </div>
                    )}
                    {orderDetails.notes && (
                      <div>
                        <h4 className="text-sm font-semibold mb-2">Notes</h4>
                        <div className="bg-muted/30 rounded-lg p-3 text-sm whitespace-pre-wrap">
                          {orderDetails.notes}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
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
