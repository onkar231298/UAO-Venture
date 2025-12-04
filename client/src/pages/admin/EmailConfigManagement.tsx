import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mail, Plus, Trash2, Edit2, User, Building, Loader2, CheckCircle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface EmailConfig {
  id: number;
  userId: string;
  companyEmail: string;
  displayName: string | null;
  isPrimary: boolean;
  isActive: boolean;
  serviceType: string;
  createdAt: string;
}

interface UserOption {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  role: string;
}

export default function EmailConfigManagement() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<EmailConfig | null>(null);
  const [formData, setFormData] = useState({
    userId: "",
    companyEmail: "",
    displayName: "",
    isPrimary: true,
    isActive: true,
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: emailConfigs = [], isLoading } = useQuery<EmailConfig[]>({
    queryKey: ['/api/admin/email-configs'],
  });

  const { data: users = [] } = useQuery<UserOption[]>({
    queryKey: ['/api/admin/users'],
    select: (data: any) => {
      if (Array.isArray(data)) {
        return data.filter((u: any) => 
          u.role === 'admin' || u.role === 'super_admin' || u.role === 'sales_manager' || u.role === 'sales_executive'
        );
      }
      if (data?.users && Array.isArray(data.users)) {
        return data.users.filter((u: any) => 
          u.role === 'admin' || u.role === 'super_admin' || u.role === 'sales_manager' || u.role === 'sales_executive'
        );
      }
      return [];
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('/api/admin/email-configs', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/email-configs'] });
      setIsDialogOpen(false);
      resetForm();
      toast({
        title: "Email Configuration Created",
        description: "The email configuration has been added successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create email configuration",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return apiRequest(`/api/admin/email-configs/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/email-configs'] });
      setIsDialogOpen(false);
      setEditingConfig(null);
      resetForm();
      toast({
        title: "Email Configuration Updated",
        description: "The email configuration has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update email configuration",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/admin/email-configs/${id}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/email-configs'] });
      toast({
        title: "Email Configuration Deleted",
        description: "The email configuration has been removed.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete email configuration",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      userId: "",
      companyEmail: "",
      displayName: "",
      isPrimary: true,
      isActive: true,
    });
  };

  const handleEdit = (config: EmailConfig) => {
    setEditingConfig(config);
    setFormData({
      userId: config.userId,
      companyEmail: config.companyEmail,
      displayName: config.displayName || "",
      isPrimary: config.isPrimary,
      isActive: config.isActive,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.userId || !formData.companyEmail) {
      toast({
        title: "Validation Error",
        description: "Please select a user and enter a company email.",
        variant: "destructive",
      });
      return;
    }

    if (editingConfig) {
      updateMutation.mutate({ id: editingConfig.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const getUserDisplayName = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      if (user.firstName || user.lastName) {
        return `${user.firstName || ''} ${user.lastName || ''}`.trim();
      }
      return user.username;
    }
    return userId;
  };

  const getUserRole = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user?.role || 'Unknown';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Email Configuration
              </CardTitle>
              <CardDescription className="mt-1">
                Manage company email addresses for sales team members. Users with configured emails can send and receive emails from the Lead Management system.
              </CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              setEditingConfig(null);
              resetForm();
            }
          }}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-email-config">
                <Plus className="h-4 w-4 mr-2" />
                Add Email Configuration
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingConfig ? 'Edit Email Configuration' : 'Add Email Configuration'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="userId">Select User</Label>
                  <Select
                    value={formData.userId}
                    onValueChange={(value) => setFormData({ ...formData, userId: value })}
                  >
                    <SelectTrigger data-testid="select-user">
                      <SelectValue placeholder="Select a user" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <span>{user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.username}</span>
                            <Badge variant="outline" className="text-xs ml-2">
                              {user.role?.replace('_', ' ')}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="companyEmail">Company Email</Label>
                  <Input
                    id="companyEmail"
                    type="email"
                    value={formData.companyEmail}
                    onChange={(e) => setFormData({ ...formData, companyEmail: e.target.value })}
                    placeholder="sales@company.com"
                    data-testid="input-company-email"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    This is the company email address the user will use to send emails.
                  </p>
                </div>

                <div>
                  <Label htmlFor="displayName">Display Name (optional)</Label>
                  <Input
                    id="displayName"
                    value={formData.displayName}
                    onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                    placeholder="John Smith - BFI Organic"
                    data-testid="input-display-name"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    The name that appears in the "From" field of sent emails.
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Switch
                      id="isPrimary"
                      checked={formData.isPrimary}
                      onCheckedChange={(checked) => setFormData({ ...formData, isPrimary: checked })}
                    />
                    <Label htmlFor="isPrimary">Primary Email</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      id="isActive"
                      checked={formData.isActive}
                      onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                    />
                    <Label htmlFor="isActive">Active</Label>
                  </div>
                </div>

                <div className="flex gap-2 justify-end pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setIsDialogOpen(false);
                      setEditingConfig(null);
                      resetForm();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createMutation.isPending || updateMutation.isPending}
                    data-testid="button-save-email-config"
                  >
                    {(createMutation.isPending || updateMutation.isPending) ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      editingConfig ? 'Update' : 'Create'
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-500">Loading configurations...</span>
            </div>
          ) : emailConfigs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Mail className="h-12 w-12 mx-auto mb-2 opacity-30" />
              <p>No email configurations yet</p>
              <p className="text-sm">Add email configurations to allow users to send emails from Lead Management</p>
            </div>
          ) : (
            <div className="space-y-3">
              {emailConfigs.map((config) => (
                <div 
                  key={config.id} 
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  data-testid={`email-config-${config.id}`}
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-blue-100 rounded-full">
                      <Mail className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{getUserDisplayName(config.userId)}</p>
                        <Badge variant="outline" className="text-xs">
                          {getUserRole(config.userId)}
                        </Badge>
                        {config.isPrimary && (
                          <Badge className="bg-green-100 text-green-800 text-xs">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Primary
                          </Badge>
                        )}
                        {!config.isActive && (
                          <Badge variant="secondary" className="text-xs">
                            Inactive
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{config.companyEmail}</p>
                      {config.displayName && (
                        <p className="text-xs text-gray-500">Display: {config.displayName}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleEdit(config)}
                      data-testid={`button-edit-config-${config.id}`}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this email configuration?')) {
                          deleteMutation.mutate(config.id);
                        }
                      }}
                      data-testid={`button-delete-config-${config.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Gmail Integration Setup</CardTitle>
          <CardDescription>
            Instructions for setting up Gmail API integration for automated email sending and reply tracking.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-800 mb-2">Current Status: Manual Recording</h4>
            <p className="text-sm text-blue-700">
              Emails are currently recorded in the system but not automatically sent via Gmail. 
              To enable automatic email sending and reply tracking, complete the Gmail API setup below.
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium">Setup Steps:</h4>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
              <li>Go to Google Cloud Console and create a new project</li>
              <li>Enable the Gmail API for your project</li>
              <li>Create OAuth 2.0 credentials or Service Account</li>
              <li>Configure Domain-wide Delegation for G-Suite accounts</li>
              <li>Add the Client ID and Secret to your Replit Secrets</li>
              <li>Test the connection by sending a test email</li>
            </ol>
          </div>

          <div className="p-4 bg-gray-50 border rounded-lg">
            <h4 className="font-medium mb-2">Required Secrets:</h4>
            <ul className="text-sm space-y-1 text-gray-600">
              <li><code className="bg-gray-200 px-1 rounded">GMAIL_CLIENT_ID</code> - OAuth Client ID</li>
              <li><code className="bg-gray-200 px-1 rounded">GMAIL_CLIENT_SECRET</code> - OAuth Client Secret</li>
              <li><code className="bg-gray-200 px-1 rounded">GMAIL_SERVICE_ACCOUNT_KEY</code> - For service account auth (optional)</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
