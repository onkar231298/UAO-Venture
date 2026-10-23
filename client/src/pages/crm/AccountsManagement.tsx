import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import RoleBasedRoute from "@/components/RoleBasedRoute";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  DollarSign, 
  FileText, 
  CreditCard, 
  TrendingUp,
  Search,
  Plus,
  Edit,
  Eye,
  Calendar,
  Download,
  Upload,
  AlertCircle,
  CheckCircle,
  Clock,
  PieChart,
  BarChart3
} from "lucide-react";

export default function AccountsManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("invoices");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  const { data: dashboardStats } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  const getPaymentStatusBadge = (status: string) => {
    const statusMap: Record<string, { variant: any; label: string; icon: any }> = {
      pending: { variant: "secondary", label: "Pending", icon: Clock },
      partial: { variant: "destructive", label: "Partial", icon: AlertCircle },
      paid: { variant: "default", label: "Paid", icon: CheckCircle },
      overdue: { variant: "destructive", label: "Overdue", icon: AlertCircle },
      cancelled: { variant: "outline", label: "Cancelled", icon: AlertCircle },
    };

    const config = statusMap[status] || { variant: "secondary", label: status, icon: Clock };
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="flex items-center space-x-1">
        <Icon className="w-3 h-3" />
        <span>{config.label}</span>
      </Badge>
    );
  };

  // Mock financial data for demonstration (in real app, this would come from API)
  const mockInvoices = [
    {
      id: 1,
      invoiceNumber: "INV-2024-001",
      customerId: "CUST-001",
      customerName: "NutriCorp Solutions",
      amount: 12450.00,
      status: "paid",
      dueDate: "2024-01-15",
      issueDate: "2024-01-01",
      items: [
        { product: "Organic Turmeric Powder", quantity: 500, rate: 24.90 }
      ]
    },
    {
      id: 2,
      invoiceNumber: "INV-2024-002",
      customerId: "CUST-002", 
      customerName: "GreenVitals Inc",
      amount: 8750.00,
      status: "pending",
      dueDate: "2024-02-15",
      issueDate: "2024-02-01",
      items: [
        { product: "Organic Ashwagandha Powder", quantity: 250, rate: 35.00 }
      ]
    },
    {
      id: 3,
      invoiceNumber: "INV-2024-003",
      customerId: "CUST-003",
      customerName: "OrganicPlus Solutions", 
      amount: 15600.00,
      status: "overdue",
      dueDate: "2024-01-30",
      issueDate: "2024-01-16",
      items: [
        { product: "Organic Moringa Powder", quantity: 400, rate: 39.00 }
      ]
    }
  ];

  const mockPayments = [
    {
      id: 1,
      paymentId: "PAY-2024-001",
      invoiceNumber: "INV-2024-001",
      amount: 12450.00,
      paymentDate: "2024-01-10",
      method: "Bank Transfer",
      status: "completed"
    },
    {
      id: 2,
      paymentId: "PAY-2024-002", 
      invoiceNumber: "INV-2024-002",
      amount: 4375.00,
      paymentDate: "2024-02-05",
      method: "Check",
      status: "partial"
    }
  ];

  const mockExpenses = [
    {
      id: 1,
      expenseId: "EXP-2024-001",
      description: "Raw material purchase - Turmeric",
      amount: 8500.00,
      category: "Raw Materials",
      date: "2024-01-15",
      vendor: "Organic Farms Ltd",
      status: "paid"
    },
    {
      id: 2,
      expenseId: "EXP-2024-002",
      description: "Packaging materials",
      amount: 2300.00,
      category: "Packaging",
      date: "2024-01-20",
      vendor: "PackageCorp",
      status: "pending"
    }
  ];

  return (
    <RoleBasedRoute allowedRoles={['super_admin', 'admin', 'accounts_manager', 'accounts_executive']}>
      <div className="min-h-screen bg-background">
        <Header />
        
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Accounts Management</h1>
            <p className="text-gray-600">Manage invoices, payments, expenses, and financial reports</p>
          </div>

          {/* Financial Stats Cards */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Revenue</p>
                    <p className="text-2xl font-bold text-green-600">$124,850</p>
                    <p className="text-xs text-green-600">+12.5% from last month</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Outstanding</p>
                    <p className="text-2xl font-bold text-orange-600">$24,350</p>
                    <p className="text-xs text-orange-600">3 overdue invoices</p>
                  </div>
                  <AlertCircle className="w-8 h-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">This Month</p>
                    <p className="text-2xl font-bold text-blue-600">$36,800</p>
                    <p className="text-xs text-blue-600">15 invoices sent</p>
                  </div>
                  <FileText className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Profit Margin</p>
                    <p className="text-2xl font-bold text-purple-600">28.5%</p>
                    <p className="text-xs text-purple-600">Above target</p>
                  </div>
                  <PieChart className="w-8 h-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-4">
                <div className="relative flex-1 min-w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search invoices, customers, transactions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                    <SelectItem value="partial">Partial</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="month"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-48"
                />
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Main Content Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="invoices">Invoices</TabsTrigger>
              <TabsTrigger value="payments">Payments</TabsTrigger>
              <TabsTrigger value="expenses">Expenses</TabsTrigger>
              <TabsTrigger value="ledger">Ledger</TabsTrigger>
              <TabsTrigger value="reports">Reports</TabsTrigger>
            </TabsList>

            {/* Invoices Tab */}
            <TabsContent value="invoices" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Sales Invoices</span>
                    <Button size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Generate Invoice
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockInvoices.map((invoice) => (
                      <div key={invoice.id} className="border rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            <span className="font-medium">{invoice.invoiceNumber}</span>
                            {getPaymentStatusBadge(invoice.status)}
                            {invoice.status === 'overdue' && (
                              <Badge variant="destructive" className="text-xs">
                                {Math.ceil((new Date().getTime() - new Date(invoice.dueDate).getTime()) / (1000 * 3600 * 24))} days overdue
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button variant="outline" size="sm">
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </Button>
                            <Button variant="outline" size="sm">
                              <Download className="w-4 h-4 mr-1" />
                              PDF
                            </Button>
                            {invoice.status === 'pending' && (
                              <Button size="sm">
                                <CreditCard className="w-4 h-4 mr-1" />
                                Record Payment
                              </Button>
                            )}
                          </div>
                        </div>
                        <div className="grid md:grid-cols-5 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Customer:</span>
                            <p className="font-medium">{invoice.customerName}</p>
                          </div>
                          <div>
                            <span className="text-gray-600">Amount:</span>
                            <p className="font-medium text-lg">${invoice.amount.toLocaleString()}</p>
                          </div>
                          <div>
                            <span className="text-gray-600">Issue Date:</span>
                            <p className="font-medium">{new Date(invoice.issueDate).toLocaleDateString()}</p>
                          </div>
                          <div>
                            <span className="text-gray-600">Due Date:</span>
                            <p className={`font-medium ${
                              new Date(invoice.dueDate) < new Date() && invoice.status !== 'paid' 
                                ? 'text-red-600' 
                                : 'text-gray-900'
                            }`}>
                              {new Date(invoice.dueDate).toLocaleDateString()}
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-600">Items:</span>
                            <p className="font-medium">{invoice.items.length} item(s)</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Payments Tab */}
            <TabsContent value="payments" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Payment Tracking</span>
                    <Button size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Record Payment
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockPayments.map((payment) => (
                      <div key={payment.id} className="border rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            <span className="font-medium">{payment.paymentId}</span>
                            {getPaymentStatusBadge(payment.status)}
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button variant="outline" size="sm">
                              <Eye className="w-4 h-4 mr-1" />
                              View Receipt
                            </Button>
                          </div>
                        </div>
                        <div className="grid md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Invoice:</span>
                            <p className="font-medium">{payment.invoiceNumber}</p>
                          </div>
                          <div>
                            <span className="text-gray-600">Amount:</span>
                            <p className="font-medium text-lg text-green-600">${payment.amount.toLocaleString()}</p>
                          </div>
                          <div>
                            <span className="text-gray-600">Payment Date:</span>
                            <p className="font-medium">{new Date(payment.paymentDate).toLocaleDateString()}</p>
                          </div>
                          <div>
                            <span className="text-gray-600">Method:</span>
                            <p className="font-medium">{payment.method}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Expenses Tab */}
            <TabsContent value="expenses" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Business Expenses</span>
                    <Button size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Expense
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockExpenses.map((expense) => (
                      <div key={expense.id} className="border rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            <span className="font-medium">{expense.expenseId}</span>
                            {getPaymentStatusBadge(expense.status)}
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button variant="outline" size="sm">
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </Button>
                            <Button variant="outline" size="sm">
                              <Edit className="w-4 h-4 mr-1" />
                              Edit
                            </Button>
                          </div>
                        </div>
                        <div className="grid md:grid-cols-5 gap-4 text-sm">
                          <div className="col-span-2">
                            <span className="text-gray-600">Description:</span>
                            <p className="font-medium">{expense.description}</p>
                          </div>
                          <div>
                            <span className="text-gray-600">Amount:</span>
                            <p className="font-medium text-lg text-red-600">-${expense.amount.toLocaleString()}</p>
                          </div>
                          <div>
                            <span className="text-gray-600">Category:</span>
                            <p className="font-medium">{expense.category}</p>
                          </div>
                          <div>
                            <span className="text-gray-600">Date:</span>
                            <p className="font-medium">{new Date(expense.date).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="mt-2 text-sm">
                          <span className="text-gray-600">Vendor:</span>
                          <span className="font-medium ml-1">{expense.vendor}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Ledger Tab */}
            <TabsContent value="ledger" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Customer & Vendor Ledger</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Account Ledgers</h3>
                    <p className="text-gray-600">View detailed transaction history for each customer and vendor</p>
                    
                    <div className="mt-6 grid md:grid-cols-2 gap-4 text-left">
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <h4 className="font-medium text-blue-900 mb-2">Customer Ledgers</h4>
                        <ul className="text-sm text-blue-800 space-y-1">
                          <li>• Invoice history</li>
                          <li>• Payment tracking</li>
                          <li>• Outstanding balances</li>
                          <li>• Credit terms</li>
                        </ul>
                      </div>
                      
                      <div className="p-4 bg-green-50 rounded-lg">
                        <h4 className="font-medium text-green-900 mb-2">Vendor Ledgers</h4>
                        <ul className="text-sm text-green-800 space-y-1">
                          <li>• Purchase history</li>
                          <li>• Payment records</li>
                          <li>• Outstanding payables</li>
                          <li>• Payment terms</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Reports Tab */}
            <TabsContent value="reports" className="mt-6">
              <div className="grid lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Financial Reports</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">Profit & Loss Statement</h4>
                            <p className="text-sm text-gray-600">Revenue, expenses, and profit analysis</p>
                          </div>
                          <Button variant="outline" size="sm">
                            <Download className="w-4 h-4 mr-1" />
                            Generate
                          </Button>
                        </div>
                      </div>
                      
                      <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">Balance Sheet</h4>
                            <p className="text-sm text-gray-600">Assets, liabilities, and equity overview</p>
                          </div>
                          <Button variant="outline" size="sm">
                            <Download className="w-4 h-4 mr-1" />
                            Generate
                          </Button>
                        </div>
                      </div>
                      
                      <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">Cash Flow Statement</h4>
                            <p className="text-sm text-gray-600">Cash inflows and outflows analysis</p>
                          </div>
                          <Button variant="outline" size="sm">
                            <Download className="w-4 h-4 mr-1" />
                            Generate
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Analytics & Insights</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Financial Analytics</h3>
                      <p className="text-gray-600 mb-4">Advanced insights and trend analysis</p>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="p-3 bg-green-50 rounded">
                          <p className="font-semibold text-green-900">Revenue Growth</p>
                          <p className="text-2xl font-bold text-green-600">+18.5%</p>
                        </div>
                        <div className="p-3 bg-blue-50 rounded">
                          <p className="font-semibold text-blue-900">Collection Rate</p>
                          <p className="text-2xl font-bold text-blue-600">94%</p>
                        </div>
                        <div className="p-3 bg-purple-50 rounded">
                          <p className="font-semibold text-purple-900">Avg. Payment Days</p>
                          <p className="text-2xl font-bold text-purple-600">28</p>
                        </div>
                        <div className="p-3 bg-orange-50 rounded">
                          <p className="font-semibold text-orange-900">Top Customer</p>
                          <p className="text-sm font-bold text-orange-600">NutriCorp</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </RoleBasedRoute>
  );
}
