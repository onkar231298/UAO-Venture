import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Users, UserCheck, Building, Globe, Mail, Phone, Calendar, Download, Search, Filter, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { User } from "@shared/schema";

interface CustomerFilters {
  search: string;
  country: string;
  industryType: string;
  accountStatus: string;
  page: number;
  limit: number;
}

export default function UserManagement() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("customers");
  const [selectedCustomer, setSelectedCustomer] = useState<User | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [filters, setFilters] = useState<CustomerFilters>({
    search: "",
    country: "",
    industryType: "",
    accountStatus: "",
    page: 1,
    limit: 20,
  });

  const { data: customersData, isLoading, refetch } = useQuery({
    queryKey: ['/api/admin/customers', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value.toString());
      });
      
      const response = await apiRequest(`/api/admin/customers?${params}`);
      if (!response.ok) throw new Error('Failed to fetch customers');
      return response.json();
    },
  });

  const { data: customerDetails } = useQuery({
    queryKey: ['/api/admin/customers', selectedCustomer?.id],
    queryFn: async () => {
      if (!selectedCustomer?.id) return null;
      const response = await apiRequest(`/api/admin/customers/${selectedCustomer.id}`);
      if (!response.ok) throw new Error('Failed to fetch customer details');
      return response.json();
    },
    enabled: !!selectedCustomer?.id,
  });

  const handleSearch = (value: string) => {
    setFilters(prev => ({ ...prev, search: value, page: 1 }));
  };

  const handleFilterChange = (key: keyof CustomerFilters, value: string) => {
    // Convert "all" back to empty string for filtering
    const filterValue = value === "all" ? "" : value;
    setFilters(prev => ({ ...prev, [key]: filterValue, page: 1 }));
  };

  const exportCustomers = async () => {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value && key !== 'page' && key !== 'limit') {
          params.append(key, value.toString());
        }
      });
      
      const response = await apiRequest(`/api/admin/customers/export?${params}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `customers-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast({
          title: "Export Successful",
          description: "Customer data has been exported successfully.",
        });
      }
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export customer data.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      active: "default",
      pending: "secondary",
      suspended: "destructive",
    } as const;
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || "secondary"}>
        {status}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-gray-600">Manage staff and customer accounts</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
          <TabsTrigger value="staff" className="flex items-center gap-2">
            <UserCheck className="w-4 h-4" />
            Staff Users
          </TabsTrigger>
          <TabsTrigger value="customers" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Customer Users
          </TabsTrigger>
        </TabsList>

        <TabsContent value="staff" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Staff User Management</CardTitle>
              <CardDescription>
                Manage internal staff accounts and permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <UserCheck className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Staff user management coming soon...</p>
                <p className="text-sm">This section will include role-based access control for internal team members.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customers" className="space-y-6">
          {/* Customer Management */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Customer Management
                  </CardTitle>
                  <CardDescription>
                    View and manage B2B customer accounts
                  </CardDescription>
                </div>
                <Button onClick={exportCustomers} variant="outline" className="flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Export CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filters */}
              <div className="flex flex-wrap gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search customers..."
                      value={filters.search}
                      onChange={(e) => handleSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={filters.country || "all"} onValueChange={(value) => handleFilterChange('country', value)}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Country" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Countries</SelectItem>
                    <SelectItem value="United States">United States</SelectItem>
                    <SelectItem value="Canada">Canada</SelectItem>
                    <SelectItem value="United Kingdom">United Kingdom</SelectItem>
                    <SelectItem value="Germany">Germany</SelectItem>
                    <SelectItem value="India">India</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filters.accountStatus || "all"} onValueChange={(value) => handleFilterChange('accountStatus', value)}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Customer Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Total Customers</p>
                        <p className="text-2xl font-bold">{customersData?.total || 0}</p>
                      </div>
                      <Users className="w-8 h-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Active</p>
                        <p className="text-2xl font-bold text-green-600">
                          {customersData?.customers?.filter((c: User) => c.accountStatus === 'active').length || 0}
                        </p>
                      </div>
                      <UserCheck className="w-8 h-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Pending</p>
                        <p className="text-2xl font-bold text-yellow-600">
                          {customersData?.customers?.filter((c: User) => c.accountStatus === 'pending').length || 0}
                        </p>
                      </div>
                      <Calendar className="w-8 h-8 text-yellow-600" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">This Month</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {customersData?.customers?.filter((c: User) => {
                            if (!c.createdAt) return false;
                            const created = new Date(c.createdAt);
                            const now = new Date();
                            return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
                          }).length || 0}
                        </p>
                      </div>
                      <Users className="w-8 h-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Customer Table */}
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Country</TableHead>
                      <TableHead>Industry</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Registered</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          Loading customers...
                        </TableCell>
                      </TableRow>
                    ) : customersData?.customers?.length > 0 ? (
                      customersData.customers.map((customer: User) => (
                        <TableRow key={customer.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">
                                {customer.firstName} {customer.lastName}
                              </div>
                              <div className="text-sm text-gray-500 flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                {customer.email}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Building className="w-4 h-4 text-gray-400" />
                              {customer.companyName || "N/A"}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Globe className="w-4 h-4 text-gray-400" />
                              {customer.country || "N/A"}
                            </div>
                          </TableCell>
                          <TableCell>{customer.industryType || "N/A"}</TableCell>
                          <TableCell>{getStatusBadge(customer.accountStatus || 'active')}</TableCell>
                          <TableCell>
                            {customer.createdAt ? new Date(customer.createdAt).toLocaleDateString() : "N/A"}
                          </TableCell>
                          <TableCell>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => {
                                    setSelectedCustomer(customer);
                                    setShowPassword(false); // Reset password visibility when switching customers
                                  }}
                                >
                                  View Details
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                  <DialogTitle>Customer Details</DialogTitle>
                                  <DialogDescription>
                                    View and manage customer information
                                  </DialogDescription>
                                </DialogHeader>
                                {customerDetails && (
                                  <div className="space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <Label className="text-sm font-medium text-gray-500">Full Name</Label>
                                        <p className="text-sm">{customerDetails.firstName} {customerDetails.lastName}</p>
                                      </div>
                                      <div>
                                        <Label className="text-sm font-medium text-gray-500">Email</Label>
                                        <p className="text-sm">{customerDetails.email}</p>
                                      </div>
                                      <div>
                                        <Label className="text-sm font-medium text-gray-500">Phone</Label>
                                        <p className="text-sm">{customerDetails.phoneNumber || "N/A"}</p>
                                      </div>
                                      <div>
                                        <Label className="text-sm font-medium text-gray-500">Company</Label>
                                        <p className="text-sm">{customerDetails.companyName || "N/A"}</p>
                                      </div>
                                      <div>
                                        <Label className="text-sm font-medium text-gray-500">Country</Label>
                                        <p className="text-sm">{customerDetails.country || "N/A"}</p>
                                      </div>
                                      <div>
                                        <Label className="text-sm font-medium text-gray-500">Industry</Label>
                                        <p className="text-sm">{customerDetails.industryType || "N/A"}</p>
                                      </div>
                                      <div>
                                        <Label className="text-sm font-medium text-gray-500">Status</Label>
                                        <div className="mt-1">{getStatusBadge(customerDetails.accountStatus || 'active')}</div>
                                      </div>
                                      <div>
                                        <Label className="text-sm font-medium text-gray-500">Registered</Label>
                                        <p className="text-sm">
                                          {customerDetails.createdAt ? new Date(customerDetails.createdAt).toLocaleDateString() : "N/A"}
                                        </p>
                                      </div>
                                      <div>
                                        <Label className="text-sm font-medium text-gray-500">Password</Label>
                                        <div className="flex items-center gap-2 mt-1">
                                          <Input
                                            type={showPassword ? "text" : "password"}
                                            value={customerDetails.password ? (showPassword ? customerDetails.password : "••••••••••••••••") : "No password set"}
                                            readOnly
                                            className="flex-1 text-sm"
                                            placeholder={customerDetails.password ? "" : "Password not available"}
                                          />
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="px-2"
                                          >
                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                          </Button>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </DialogContent>
                            </Dialog>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                          No customers found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {customersData?.total > filters.limit && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    Showing {((filters.page - 1) * filters.limit) + 1} to{" "}
                    {Math.min(filters.page * filters.limit, customersData.total)} of{" "}
                    {customersData.total} customers
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={filters.page === 1}
                      onClick={() => setFilters(prev => ({ ...prev, page: prev.page - 1 }))}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={filters.page * filters.limit >= customersData.total}
                      onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}