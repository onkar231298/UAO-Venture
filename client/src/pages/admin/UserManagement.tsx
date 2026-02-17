import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Users, UserCheck, UserPlus, Building, Globe, Mail, Phone, Calendar, Download, Search, Edit, Trash2, Power, Key, Eye, EyeOff, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { User } from "@shared/schema";
import { STAFF_DEPARTMENTS, STAFF_ROLES, ALL_STAFF_ROLES } from "@shared/schema";

interface CustomerFilters {
  search: string;
  country: string;
  industryType: string;
  accountStatus: string;
  page: number;
  limit: number;
}

interface StaffFilters {
  search: string;
  department: string;
  role: string;
  isActive: string;
  page: number;
  limit: number;
}

const addStaffSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  department: z.string().min(1, "Department is required"),
  role: z.string().min(1, "Role is required"),
  phoneNumber: z.string().optional(),
});

const editStaffSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Please enter a valid email address"),
  department: z.string().min(1, "Department is required"),
  role: z.string().min(1, "Role is required"),
  phoneNumber: z.string().optional(),
});

const resetPasswordSchema = z.object({
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(8, "Please confirm password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type AddStaffFormData = z.infer<typeof addStaffSchema>;
type EditStaffFormData = z.infer<typeof editStaffSchema>;
type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

const DEPARTMENT_LABELS: Record<string, string> = {
  sales: "Sales",
  purchase: "Purchase",
  inventory: "Inventory",
  logistics: "Logistics",
  accounts: "Accounts & Finance",
  marketing: "Marketing",
  admin: "Administration",
  quality: "Quality",
};

const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  sales_manager: "Sales Manager",
  sales_executive: "Sales Executive",
  purchase_manager: "Purchase Manager",
  purchase_executive: "Purchase Executive",
  inventory_manager: "Inventory Manager",
  inventory_executive: "Inventory Executive",
  logistics_manager: "Logistics Manager",
  logistics_executive: "Logistics Executive",
  accounts_manager: "Accounts Manager",
  accounts_executive: "Accounts Executive",
  seo_manager: "SEO Manager",
  website_manager: "Website Manager",
  quality_manager: "Quality Manager",
  quality_executive: "Quality Executive",
};

export default function UserManagement() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("staff");
  const [selectedCustomer, setSelectedCustomer] = useState<User | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [customerFilters, setCustomerFilters] = useState<CustomerFilters>({
    search: "",
    country: "",
    industryType: "",
    accountStatus: "",
    page: 1,
    limit: 20,
  });

  const [staffFilters, setStaffFilters] = useState<StaffFilters>({
    search: "",
    department: "",
    role: "",
    isActive: "",
    page: 1,
    limit: 50,
  });

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<User | null>(null);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const addForm = useForm<AddStaffFormData>({
    resolver: zodResolver(addStaffSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      department: "",
      role: "",
      phoneNumber: "",
    },
  });

  const editForm = useForm<EditStaffFormData>({
    resolver: zodResolver(editStaffSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      department: "",
      role: "",
      phoneNumber: "",
    },
  });

  const resetPasswordForm = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  const { data: staffData, isLoading: staffLoading } = useQuery({
    queryKey: ['/api/admin/staff', staffFilters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(staffFilters).forEach(([key, value]) => {
        if (value) params.append(key, value.toString());
      });
      const response = await apiRequest(`/api/admin/staff?${params}`);
      if (!response.ok) throw new Error('Failed to fetch staff');
      return response.json();
    },
  });

  const { data: customersData, isLoading: customersLoading } = useQuery({
    queryKey: ['/api/admin/customers', customerFilters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(customerFilters).forEach(([key, value]) => {
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

  const createStaffMutation = useMutation({
    mutationFn: async (data: AddStaffFormData) => {
      const response = await apiRequest('/api/admin/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create staff');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/staff'] });
      toast({ title: "Success", description: "Staff member created successfully" });
      setIsAddDialogOpen(false);
      addForm.reset();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateStaffMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: EditStaffFormData }) => {
      const response = await apiRequest(`/api/admin/staff/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update staff');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/staff'] });
      toast({ title: "Success", description: "Staff member updated successfully" });
      setIsEditDialogOpen(false);
      setSelectedStaff(null);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest(`/api/admin/staff/${id}/toggle-status`, {
        method: 'PATCH',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to toggle status');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/staff'] });
      toast({ title: "Success", description: "Status updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async ({ id, newPassword }: { id: string; newPassword: string }) => {
      const response = await apiRequest(`/api/admin/staff/${id}/reset-password`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to reset password');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Password reset successfully" });
      setIsResetPasswordDialogOpen(false);
      resetPasswordForm.reset();
      setSelectedStaff(null);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteStaffMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest(`/api/admin/staff/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete staff');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/staff'] });
      toast({ title: "Success", description: "Staff member deleted successfully" });
      setIsDeleteDialogOpen(false);
      setSelectedStaff(null);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleStaffSearch = (value: string) => {
    setStaffFilters(prev => ({ ...prev, search: value, page: 1 }));
  };

  const handleStaffFilterChange = (key: keyof StaffFilters, value: string) => {
    const filterValue = value === "all" ? "" : value;
    setStaffFilters(prev => ({ ...prev, [key]: filterValue, page: 1 }));
  };

  const handleCustomerSearch = (value: string) => {
    setCustomerFilters(prev => ({ ...prev, search: value, page: 1 }));
  };

  const handleCustomerFilterChange = (key: keyof CustomerFilters, value: string) => {
    const filterValue = value === "all" ? "" : value;
    setCustomerFilters(prev => ({ ...prev, [key]: filterValue, page: 1 }));
  };

  const openEditDialog = (staff: User) => {
    setSelectedStaff(staff);
    editForm.reset({
      firstName: staff.firstName || "",
      lastName: staff.lastName || "",
      email: staff.email || "",
      department: staff.department || "",
      role: staff.role || "",
      phoneNumber: staff.phoneNumber || "",
    });
    setIsEditDialogOpen(true);
  };

  const openResetPasswordDialog = (staff: User) => {
    setSelectedStaff(staff);
    resetPasswordForm.reset();
    setShowNewPassword(false);
    setIsResetPasswordDialogOpen(true);
  };

  const openDeleteDialog = (staff: User) => {
    setSelectedStaff(staff);
    setIsDeleteDialogOpen(true);
  };

  const exportCustomers = async () => {
    try {
      const params = new URLSearchParams();
      Object.entries(customerFilters).forEach(([key, value]) => {
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
        toast({ title: "Export Successful", description: "Customer data exported." });
      }
    } catch (error) {
      toast({ title: "Export Failed", description: "Failed to export data.", variant: "destructive" });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      active: "default",
      pending: "secondary",
      suspended: "destructive",
    } as const;
    return <Badge variant={variants[status as keyof typeof variants] || "secondary"}>{status}</Badge>;
  };

  const getAvailableRoles = (department: string) => {
    if (!department) return [];
    return STAFF_ROLES[department as keyof typeof STAFF_ROLES] || [];
  };

  const selectedDepartmentAdd = addForm.watch("department");
  const selectedDepartmentEdit = editForm.watch("department");

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
          <TabsTrigger value="staff" className="flex items-center gap-2" data-testid="tab-staff">
            <UserCheck className="w-4 h-4" />
            Staff Users
          </TabsTrigger>
          <TabsTrigger value="customers" className="flex items-center gap-2" data-testid="tab-customers">
            <Users className="w-4 h-4" />
            Customer Users
          </TabsTrigger>
        </TabsList>

        <TabsContent value="staff" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <UserCheck className="w-5 h-5" />
                    Staff User Management
                  </CardTitle>
                  <CardDescription>Manage internal staff accounts and permissions</CardDescription>
                </div>
                <Button onClick={() => { addForm.reset(); setIsAddDialogOpen(true); }} className="flex items-center gap-2" data-testid="btn-add-staff">
                  <UserPlus className="w-4 h-4" />
                  Add Staff Member
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search staff..."
                      value={staffFilters.search}
                      onChange={(e) => handleStaffSearch(e.target.value)}
                      className="pl-10"
                      data-testid="input-search-staff"
                    />
                  </div>
                </div>
                <Select value={staffFilters.department || "all"} onValueChange={(value) => handleStaffFilterChange('department', value)}>
                  <SelectTrigger className="w-[160px]" data-testid="select-department">
                    <SelectValue placeholder="Department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {STAFF_DEPARTMENTS.map(dept => (
                      <SelectItem key={dept} value={dept}>{DEPARTMENT_LABELS[dept]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={staffFilters.role || "all"} onValueChange={(value) => handleStaffFilterChange('role', value)}>
                  <SelectTrigger className="w-[180px]" data-testid="select-role">
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    {ALL_STAFF_ROLES.map(role => (
                      <SelectItem key={role} value={role}>{ROLE_LABELS[role]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={staffFilters.isActive || "all"} onValueChange={(value) => handleStaffFilterChange('isActive', value)}>
                  <SelectTrigger className="w-[120px]" data-testid="select-status">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="true">Active</SelectItem>
                    <SelectItem value="false">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Total Staff</p>
                        <p className="text-2xl font-bold">{staffData?.total || 0}</p>
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
                          {staffData?.staff?.filter((s: User) => s.isActive).length || 0}
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
                        <p className="text-sm text-gray-600">Managers</p>
                        <p className="text-2xl font-bold text-purple-600">
                          {staffData?.staff?.filter((s: User) => s.role?.includes('manager')).length || 0}
                        </p>
                      </div>
                      <UserCheck className="w-8 h-8 text-purple-600" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Executives</p>
                        <p className="text-2xl font-bold text-orange-600">
                          {staffData?.staff?.filter((s: User) => s.role?.includes('executive')).length || 0}
                        </p>
                      </div>
                      <Users className="w-8 h-8 text-orange-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {staffLoading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                          <p className="mt-2 text-gray-500">Loading staff...</p>
                        </TableCell>
                      </TableRow>
                    ) : staffData?.staff?.length > 0 ? (
                      staffData.staff.map((staff: User) => (
                        <TableRow key={staff.id} data-testid={`row-staff-${staff.id}`}>
                          <TableCell>
                            <div className="font-medium">{staff.firstName} {staff.lastName}</div>
                            {staff.phoneNumber && (
                              <div className="text-sm text-gray-500 flex items-center gap-1">
                                <Phone className="w-3 h-3" />{staff.phoneNumber}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm">
                              <Mail className="w-3 h-3 text-gray-400" />{staff.email}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{DEPARTMENT_LABELS[staff.department || ''] || staff.department}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{ROLE_LABELS[staff.role || ''] || staff.role}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={staff.isActive ? "default" : "destructive"}>
                              {staff.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {staff.createdAt ? new Date(staff.createdAt).toLocaleDateString() : "N/A"}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button variant="ghost" size="icon" onClick={() => openEditDialog(staff)} title="Edit" data-testid={`btn-edit-${staff.id}`}>
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => openResetPasswordDialog(staff)} title="Reset Password" data-testid={`btn-reset-${staff.id}`}>
                                <Key className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => toggleStatusMutation.mutate(staff.id)} title={staff.isActive ? "Deactivate" : "Activate"} data-testid={`btn-toggle-${staff.id}`}>
                                <Power className={`w-4 h-4 ${staff.isActive ? 'text-green-600' : 'text-red-600'}`} />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => openDeleteDialog(staff)} title="Delete" className="text-red-600 hover:text-red-700" data-testid={`btn-delete-${staff.id}`}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                          <UserCheck className="w-12 h-12 mx-auto mb-2 opacity-30" />
                          <p>No staff members found</p>
                          <p className="text-sm">Add your first staff member to get started</p>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {staffData?.total > staffFilters.limit && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    Showing {((staffFilters.page - 1) * staffFilters.limit) + 1} to {Math.min(staffFilters.page * staffFilters.limit, staffData.total)} of {staffData.total} staff
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={staffFilters.page === 1} onClick={() => setStaffFilters(prev => ({ ...prev, page: prev.page - 1 }))}>Previous</Button>
                    <Button variant="outline" size="sm" disabled={staffFilters.page * staffFilters.limit >= staffData.total} onClick={() => setStaffFilters(prev => ({ ...prev, page: prev.page + 1 }))}>Next</Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customers" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Customer Management
                  </CardTitle>
                  <CardDescription>View and manage B2B customer accounts</CardDescription>
                </div>
                <Button onClick={exportCustomers} variant="outline" className="flex items-center gap-2" data-testid="btn-export-customers">
                  <Download className="w-4 h-4" />
                  Export CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input placeholder="Search customers..." value={customerFilters.search} onChange={(e) => handleCustomerSearch(e.target.value)} className="pl-10" data-testid="input-search-customers" />
                  </div>
                </div>
                <Select value={customerFilters.country || "all"} onValueChange={(value) => handleCustomerFilterChange('country', value)}>
                  <SelectTrigger className="w-[160px]"><SelectValue placeholder="Country" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Countries</SelectItem>
                    <SelectItem value="United States">United States</SelectItem>
                    <SelectItem value="Canada">Canada</SelectItem>
                    <SelectItem value="United Kingdom">United Kingdom</SelectItem>
                    <SelectItem value="Germany">Germany</SelectItem>
                    <SelectItem value="India">India</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={customerFilters.accountStatus || "all"} onValueChange={(value) => handleCustomerFilterChange('accountStatus', value)}>
                  <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-600">Total Customers</p><p className="text-2xl font-bold">{customersData?.total || 0}</p></div><Users className="w-8 h-8 text-blue-600" /></div></CardContent></Card>
                <Card><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-600">Active</p><p className="text-2xl font-bold text-green-600">{customersData?.customers?.filter((c: User) => c.accountStatus === 'active').length || 0}</p></div><UserCheck className="w-8 h-8 text-green-600" /></div></CardContent></Card>
                <Card><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-600">Pending</p><p className="text-2xl font-bold text-yellow-600">{customersData?.customers?.filter((c: User) => c.accountStatus === 'pending').length || 0}</p></div><Calendar className="w-8 h-8 text-yellow-600" /></div></CardContent></Card>
                <Card><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-600">This Month</p><p className="text-2xl font-bold text-blue-600">{customersData?.customers?.filter((c: User) => { if (!c.createdAt) return false; const created = new Date(c.createdAt); const now = new Date(); return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear(); }).length || 0}</p></div><Users className="w-8 h-8 text-blue-600" /></div></CardContent></Card>
              </div>

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
                    {customersLoading ? (
                      <TableRow><TableCell colSpan={7} className="text-center py-8">Loading customers...</TableCell></TableRow>
                    ) : customersData?.customers?.length > 0 ? (
                      customersData.customers.map((customer: User) => (
                        <TableRow key={customer.id}>
                          <TableCell><div><div className="font-medium">{customer.firstName} {customer.lastName}</div><div className="text-sm text-gray-500 flex items-center gap-1"><Mail className="w-3 h-3" />{customer.email}</div></div></TableCell>
                          <TableCell><div className="flex items-center gap-1"><Building className="w-4 h-4 text-gray-400" />{customer.companyName || "N/A"}</div></TableCell>
                          <TableCell><div className="flex items-center gap-1"><Globe className="w-4 h-4 text-gray-400" />{customer.country || "N/A"}</div></TableCell>
                          <TableCell>{customer.industryType || "N/A"}</TableCell>
                          <TableCell>{getStatusBadge(customer.accountStatus || 'active')}</TableCell>
                          <TableCell>{customer.createdAt ? new Date(customer.createdAt).toLocaleDateString() : "N/A"}</TableCell>
                          <TableCell>
                            <Dialog>
                              <Button variant="outline" size="sm" onClick={() => { setSelectedCustomer(customer); setShowPassword(false); }}>View Details</Button>
                              <DialogContent className="max-w-2xl">
                                <DialogHeader><DialogTitle>Customer Details</DialogTitle><DialogDescription>View and manage customer information</DialogDescription></DialogHeader>
                                {customerDetails && (
                                  <div className="space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                      <div><Label className="text-sm font-medium text-gray-500">Full Name</Label><p className="text-sm">{customerDetails.firstName} {customerDetails.lastName}</p></div>
                                      <div><Label className="text-sm font-medium text-gray-500">Email</Label><p className="text-sm">{customerDetails.email}</p></div>
                                      <div><Label className="text-sm font-medium text-gray-500">Phone</Label><p className="text-sm">{customerDetails.phoneNumber || "N/A"}</p></div>
                                      <div><Label className="text-sm font-medium text-gray-500">Company</Label><p className="text-sm">{customerDetails.companyName || "N/A"}</p></div>
                                      <div><Label className="text-sm font-medium text-gray-500">Country</Label><p className="text-sm">{customerDetails.country || "N/A"}</p></div>
                                      <div><Label className="text-sm font-medium text-gray-500">Industry</Label><p className="text-sm">{customerDetails.industryType || "N/A"}</p></div>
                                      <div><Label className="text-sm font-medium text-gray-500">Status</Label><div className="mt-1">{getStatusBadge(customerDetails.accountStatus || 'active')}</div></div>
                                      <div><Label className="text-sm font-medium text-gray-500">Registered</Label><p className="text-sm">{customerDetails.createdAt ? new Date(customerDetails.createdAt).toLocaleDateString() : "N/A"}</p></div>
                                    </div>
                                  </div>
                                )}
                              </DialogContent>
                            </Dialog>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow><TableCell colSpan={7} className="text-center py-8 text-gray-500">No customers found</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {customersData?.total > customerFilters.limit && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">Showing {((customerFilters.page - 1) * customerFilters.limit) + 1} to {Math.min(customerFilters.page * customerFilters.limit, customersData.total)} of {customersData.total} customers</p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={customerFilters.page === 1} onClick={() => setCustomerFilters(prev => ({ ...prev, page: prev.page - 1 }))}>Previous</Button>
                    <Button variant="outline" size="sm" disabled={customerFilters.page * customerFilters.limit >= customersData.total} onClick={() => setCustomerFilters(prev => ({ ...prev, page: prev.page + 1 }))}>Next</Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Staff Member</DialogTitle>
            <DialogDescription>Create a new staff account for your team</DialogDescription>
          </DialogHeader>
          <Form {...addForm}>
            <form onSubmit={addForm.handleSubmit((data) => createStaffMutation.mutate(data))} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={addForm.control} name="firstName" render={({ field }) => (
                  <FormItem><FormLabel>First Name</FormLabel><FormControl><Input {...field} data-testid="input-add-firstname" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={addForm.control} name="lastName" render={({ field }) => (
                  <FormItem><FormLabel>Last Name</FormLabel><FormControl><Input {...field} data-testid="input-add-lastname" /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <FormField control={addForm.control} name="email" render={({ field }) => (
                <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} data-testid="input-add-email" /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={addForm.control} name="password" render={({ field }) => (
                <FormItem><FormLabel>Password</FormLabel><FormControl><Input type="password" {...field} data-testid="input-add-password" /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={addForm.control} name="department" render={({ field }) => (
                <FormItem>
                  <FormLabel>Department</FormLabel>
                  <Select onValueChange={(value) => { field.onChange(value); addForm.setValue('role', ''); }} value={field.value}>
                    <FormControl><SelectTrigger data-testid="select-add-department"><SelectValue placeholder="Select department" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {STAFF_DEPARTMENTS.map(dept => (<SelectItem key={dept} value={dept}>{DEPARTMENT_LABELS[dept]}</SelectItem>))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={addForm.control} name="role" render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={!selectedDepartmentAdd}>
                    <FormControl><SelectTrigger data-testid="select-add-role"><SelectValue placeholder={selectedDepartmentAdd ? "Select role" : "Select department first"} /></SelectTrigger></FormControl>
                    <SelectContent>
                      {getAvailableRoles(selectedDepartmentAdd).map(role => (<SelectItem key={role} value={role}>{ROLE_LABELS[role]}</SelectItem>))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={addForm.control} name="phoneNumber" render={({ field }) => (
                <FormItem><FormLabel>Phone Number (Optional)</FormLabel><FormControl><Input {...field} data-testid="input-add-phone" /></FormControl><FormMessage /></FormItem>
              )} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createStaffMutation.isPending} data-testid="btn-submit-add">
                  {createStaffMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Create Staff
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Staff Member</DialogTitle>
            <DialogDescription>Update staff account information</DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit((data) => selectedStaff && updateStaffMutation.mutate({ id: selectedStaff.id, data }))} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={editForm.control} name="firstName" render={({ field }) => (
                  <FormItem><FormLabel>First Name</FormLabel><FormControl><Input {...field} data-testid="input-edit-firstname" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={editForm.control} name="lastName" render={({ field }) => (
                  <FormItem><FormLabel>Last Name</FormLabel><FormControl><Input {...field} data-testid="input-edit-lastname" /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <FormField control={editForm.control} name="email" render={({ field }) => (
                <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} data-testid="input-edit-email" /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={editForm.control} name="department" render={({ field }) => (
                <FormItem>
                  <FormLabel>Department</FormLabel>
                  <Select onValueChange={(value) => { field.onChange(value); editForm.setValue('role', ''); }} value={field.value}>
                    <FormControl><SelectTrigger data-testid="select-edit-department"><SelectValue placeholder="Select department" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {STAFF_DEPARTMENTS.map(dept => (<SelectItem key={dept} value={dept}>{DEPARTMENT_LABELS[dept]}</SelectItem>))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={editForm.control} name="role" render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={!selectedDepartmentEdit}>
                    <FormControl><SelectTrigger data-testid="select-edit-role"><SelectValue placeholder={selectedDepartmentEdit ? "Select role" : "Select department first"} /></SelectTrigger></FormControl>
                    <SelectContent>
                      {getAvailableRoles(selectedDepartmentEdit).map(role => (<SelectItem key={role} value={role}>{ROLE_LABELS[role]}</SelectItem>))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={editForm.control} name="phoneNumber" render={({ field }) => (
                <FormItem><FormLabel>Phone Number (Optional)</FormLabel><FormControl><Input {...field} data-testid="input-edit-phone" /></FormControl><FormMessage /></FormItem>
              )} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={updateStaffMutation.isPending} data-testid="btn-submit-edit">
                  {updateStaffMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Update Staff
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={isResetPasswordDialogOpen} onOpenChange={setIsResetPasswordDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>Set a new password for {selectedStaff?.firstName} {selectedStaff?.lastName}</DialogDescription>
          </DialogHeader>
          <Form {...resetPasswordForm}>
            <form onSubmit={resetPasswordForm.handleSubmit((data) => selectedStaff && resetPasswordMutation.mutate({ id: selectedStaff.id, newPassword: data.newPassword }))} className="space-y-4">
              <FormField control={resetPasswordForm.control} name="newPassword" render={({ field }) => (
                <FormItem>
                  <FormLabel>New Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input type={showNewPassword ? "text" : "password"} {...field} data-testid="input-new-password" />
                      <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0" onClick={() => setShowNewPassword(!showNewPassword)}>
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={resetPasswordForm.control} name="confirmPassword" render={({ field }) => (
                <FormItem><FormLabel>Confirm Password</FormLabel><FormControl><Input type="password" {...field} data-testid="input-confirm-password" /></FormControl><FormMessage /></FormItem>
              )} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsResetPasswordDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={resetPasswordMutation.isPending} data-testid="btn-submit-reset">
                  {resetPasswordMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Reset Password
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Staff Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedStaff?.firstName} {selectedStaff?.lastName}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => selectedStaff && deleteStaffMutation.mutate(selectedStaff.id)} className="bg-red-600 hover:bg-red-700" data-testid="btn-confirm-delete">
              {deleteStaffMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
