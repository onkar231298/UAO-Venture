import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Search, Filter, Plus, MoreHorizontal, Users, Building2, UserCheck, UserX } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  userType: string;
  companyName?: string;
  phoneNumber?: string;
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

const CUSTOMER_ROLES = ['customer'];
const INTERNAL_ROLES = [
  'super_admin',
  'admin', 
  'sales_manager',
  'sales_executive',
  'purchase_manager',
  'purchase_executive',
  'inventory_manager',
  'inventory_executive',
  'logistics_manager',
  'logistics_executive',
  'accounts_manager',
  'accounts_executive',
  'seo_manager',
  'website_manager'
];

const ROLE_LABELS: Record<string, string> = {
  customer: 'Customer',
  super_admin: 'Super Admin',
  admin: 'Admin',
  sales_manager: 'Sales Manager',
  sales_executive: 'Sales Executive',
  purchase_manager: 'Purchase Manager',
  purchase_executive: 'Purchase Executive',
  inventory_manager: 'Inventory Manager',
  inventory_executive: 'Inventory Executive',
  logistics_manager: 'Logistics Manager',
  logistics_executive: 'Logistics Executive',
  accounts_manager: 'Accounts Manager',
  accounts_executive: 'Accounts Executive',
  seo_manager: 'SEO Manager',
  website_manager: 'Website Manager',
};

export default function UserManagement() {
  const { toast } = useToast();
  const [customers, setCustomers] = useState<User[]>([]);
  const [internalUsers, setInternalUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [activeTab, setActiveTab] = useState("customers");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Fetch customers
      const customersResponse = await fetch("/api/admin/users?userType=customer&limit=100");
      const customersData = await customersResponse.json();
      
      // Fetch internal users
      const internalResponse = await fetch("/api/admin/users?userType=internal&limit=100");
      const internalData = await internalResponse.json();
      
      if (customersResponse.ok) {
        setCustomers(customersData.users || []);
      }
      
      if (internalResponse.ok) {
        setInternalUsers(internalData.users || []);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: `User ${!currentStatus ? 'activated' : 'deactivated'} successfully`,
        });
        fetchUsers();
      } else {
        throw new Error("Failed to update user status");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update user status",
        variant: "destructive",
      });
    }
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "User role updated successfully",
        });
        fetchUsers();
      } else {
        throw new Error("Failed to update user role");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update user role",
        variant: "destructive",
      });
    }
  };

  const filterUsers = (users: User[]) => {
    return users.filter((user) => {
      const matchesSearch = searchTerm === "" || 
        user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.companyName && user.companyName.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesRole = selectedRole === "" || user.role === selectedRole;
      
      return matchesSearch && matchesRole;
    });
  };

  const UserTable = ({ users, userType }: { users: User[]; userType: string }) => {
    const filteredUsers = filterUsers(users);
    
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-80"
              />
            </div>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Roles</SelectItem>
                {(userType === "customer" ? CUSTOMER_ROLES : INTERNAL_ROLES).map((role) => (
                  <SelectItem key={role} value={role}>
                    {ROLE_LABELS[role]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="secondary">
              {filteredUsers.length} {userType === "customer" ? "customers" : "internal users"}
            </Badge>
          </div>
        </div>

        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                {userType === "customer" && <TableHead>Company</TableHead>}
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    {user.firstName} {user.lastName}
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {ROLE_LABELS[user.role] || user.role}
                    </Badge>
                  </TableCell>
                  {userType === "customer" && (
                    <TableCell>{user.companyName || "-"}</TableCell>
                  )}
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <Badge variant={user.isActive ? "default" : "secondary"}>
                        {user.isActive ? "Active" : "Inactive"}
                      </Badge>
                      {user.isVerified && (
                        <Badge variant="outline" className="text-green-600">
                          Verified
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {new Date(user.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {user.lastLoginAt 
                      ? new Date(user.lastLoginAt).toLocaleDateString()
                      : "Never"
                    }
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => toggleUserStatus(user.id, user.isActive)}
                        >
                          {user.isActive ? (
                            <>
                              <UserX className="mr-2 h-4 w-4" />
                              Deactivate
                            </>
                          ) : (
                            <>
                              <UserCheck className="mr-2 h-4 w-4" />
                              Activate
                            </>
                          )}
                        </DropdownMenuItem>
                        {userType === "internal" && (
                          <DropdownMenuItem
                            onClick={() => {
                              const newRole = prompt("Enter new role:", user.role);
                              if (newRole && INTERNAL_ROLES.includes(newRole)) {
                                updateUserRole(user.id, newRole);
                              }
                            }}
                          >
                            Change Role
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-lg font-medium">Loading users...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-gray-600 dark:text-gray-300">
            Manage customer accounts and internal users
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="customers" className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>Customers ({customers.length})</span>
          </TabsTrigger>
          <TabsTrigger value="internal" className="flex items-center space-x-2">
            <Building2 className="h-4 w-4" />
            <span>Internal Users ({internalUsers.length})</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="customers" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Customer Accounts</span>
              </CardTitle>
              <CardDescription>
                Registered customers who can place orders and submit inquiries
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UserTable users={customers} userType="customer" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="internal" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Building2 className="h-5 w-5" />
                <span>Internal Users</span>
              </CardTitle>
              <CardDescription>
                Company employees with access to admin functions and CRM features
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UserTable users={internalUsers} userType="internal" />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}