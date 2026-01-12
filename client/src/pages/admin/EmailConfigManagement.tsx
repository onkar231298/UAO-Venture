import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mail, Plus, Trash2, Edit2, User, Building, Loader2, CheckCircle, Link2, Unlink, ExternalLink, Upload, Image, X, Pen, AlertTriangle, Info } from "lucide-react";
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
  isConnected: boolean;
  signatureImageUrl: string | null;
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
  const [signatureDialogOpen, setSignatureDialogOpen] = useState(false);
  const [selectedConfigForSignature, setSelectedConfigForSignature] = useState<EmailConfig | null>(null);
  const [uploadingSignature, setUploadingSignature] = useState(false);
  const signatureInputRef = useRef<HTMLInputElement>(null);
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

  const { data: users = [], isLoading: isLoadingUsers } = useQuery<UserOption[]>({
    queryKey: ['/api/admin/users'],
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

  const connectGmailMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/admin/email-configs/${id}/connect`, {
        method: 'GET',
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to start Gmail connection');
      }
      return response.json();
    },
    onSuccess: (data: any) => {
      console.log('Connect Gmail response:', data);
      if (data.authUrl) {
        window.location.href = data.authUrl;
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to start Gmail connection",
        variant: "destructive",
      });
    },
  });

  const disconnectGmailMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/admin/email-configs/${id}/disconnect`, {
        method: 'POST',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/email-configs'] });
      toast({
        title: "Gmail Disconnected",
        description: "Gmail has been disconnected from this email configuration.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to disconnect Gmail",
        variant: "destructive",
      });
    },
  });

  const removeSignatureMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/admin/email-configs/${id}/signature`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/email-configs'] });
      setSignatureDialogOpen(false);
      setSelectedConfigForSignature(null);
      toast({
        title: "Signature Removed",
        description: "Digital signature has been removed from this email configuration.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove signature",
        variant: "destructive",
      });
    },
  });

  const validateImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
    return new Promise((resolve, reject) => {
      const img = document.createElement('img');
      const objectUrl = URL.createObjectURL(file);
      
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        resolve({ width: img.width, height: img.height });
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Failed to load image'));
      };
      
      img.src = objectUrl;
    });
  };

  const handleSignatureUpload = async (event: React.ChangeEvent<HTMLInputElement>, configId: number) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File",
        description: "Please upload an image file (PNG, JPG, or GIF)",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB for signatures to allow banner-style images)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Signature image must be less than 5MB",
        variant: "destructive",
      });
      return;
    }

    // Validate image dimensions (allow larger banner-style signatures)
    try {
      const dimensions = await validateImageDimensions(file);
      const maxWidth = 1200;
      const maxHeight = 800;
      
      if (dimensions.width > maxWidth || dimensions.height > maxHeight) {
        toast({
          title: "Image Too Large",
          description: `Signature image must be max ${maxWidth}x${maxHeight}px. Your image is ${dimensions.width}x${dimensions.height}px.`,
          variant: "destructive",
        });
        if (signatureInputRef.current) {
          signatureInputRef.current.value = '';
        }
        return;
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to validate image dimensions",
        variant: "destructive",
      });
      return;
    }

    setUploadingSignature(true);

    try {
      // Get upload URL
      const uploadUrlResponse = await fetch(`/api/admin/email-configs/${configId}/signature-upload-url`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!uploadUrlResponse.ok) {
        throw new Error('Failed to get upload URL');
      }

      const { uploadURL } = await uploadUrlResponse.json();

      // Upload the file
      const uploadResponse = await fetch(uploadURL, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload signature');
      }

      // Update the email config with the full upload URL (server will normalize)
      const updateResponse = await apiRequest(`/api/admin/email-configs/${configId}/signature`, {
        method: 'PUT',
        body: JSON.stringify({ signatureImageUrl: uploadURL }),
      });

      queryClient.invalidateQueries({ queryKey: ['/api/admin/email-configs'] });
      setSignatureDialogOpen(false);
      setSelectedConfigForSignature(null);

      toast({
        title: "Signature Uploaded",
        description: "Digital signature has been added successfully.",
      });
    } catch (error) {
      console.error('Error uploading signature:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload signature image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploadingSignature(false);
      if (signatureInputRef.current) {
        signatureInputRef.current.value = '';
      }
    }
  };

  const openSignatureDialog = (config: EmailConfig) => {
    setSelectedConfigForSignature(config);
    setSignatureDialogOpen(true);
  };

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
      <Alert className="border-blue-200 bg-blue-50">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertTitle className="text-blue-800">Important: Gmail Connection Process</AlertTitle>
        <AlertDescription className="text-blue-700">
          <p className="mb-2">
            Each sales agent must connect their <strong>own Gmail account</strong> to send emails. 
            As an admin, you can only set up the email configuration (assign email address to user).
          </p>
          <p className="mb-2">
            <strong>Process:</strong>
          </p>
          <ol className="list-decimal list-inside space-y-1 ml-2">
            <li>Create email configuration here (assign email to sales agent)</li>
            <li>Sales agent logs into CRM with their account</li>
            <li>Sales agent goes to <strong>Sales Dashboard → Email Settings</strong></li>
            <li>Sales agent clicks "Connect Your Gmail Account" and authenticates with their own Gmail</li>
          </ol>
          <p className="mt-2 text-sm">
            This ensures emails are sent from the agent's Gmail and appear in their Sent folder.
          </p>
        </AlertDescription>
      </Alert>

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
                      {isLoadingUsers ? (
                        <div className="flex items-center justify-center py-2">
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          <span className="text-sm">Loading users...</span>
                        </div>
                      ) : users.length === 0 ? (
                        <div className="py-2 text-center text-sm text-gray-500">
                          No eligible users found
                        </div>
                      ) : (
                        users.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              <span>{user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.username}</span>
                              <Badge variant="outline" className="text-xs ml-2">
                                {user.role?.replace('_', ' ')}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))
                      )}
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
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg hover:bg-gray-50 gap-4"
                  data-testid={`email-config-${config.id}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-full ${config.isConnected ? 'bg-green-100' : 'bg-blue-100'}`}>
                      <Mail className={`h-5 w-5 ${config.isConnected ? 'text-green-600' : 'text-blue-600'}`} />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
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
                      <div className="mt-1 flex flex-wrap gap-1">
                        {config.isConnected ? (
                          <Badge className="bg-green-100 text-green-800 text-xs">
                            <Link2 className="h-3 w-3 mr-1" />
                            Gmail Connected
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="text-xs">
                            <Unlink className="h-3 w-3 mr-1" />
                            Gmail Not Connected
                          </Badge>
                        )}
                        {config.signatureImageUrl ? (
                          <Badge className="bg-purple-100 text-purple-800 text-xs">
                            <Pen className="h-3 w-3 mr-1" />
                            Signature Added
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs text-gray-500">
                            <Pen className="h-3 w-3 mr-1" />
                            No Signature
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {config.isConnected ? (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                        onClick={() => {
                          if (confirm('Are you sure you want to disconnect Gmail from this email configuration?')) {
                            disconnectGmailMutation.mutate(config.id);
                          }
                        }}
                        disabled={disconnectGmailMutation.isPending}
                        data-testid={`button-disconnect-gmail-${config.id}`}
                      >
                        {disconnectGmailMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Unlink className="h-4 w-4 mr-1" />
                            Disconnect
                          </>
                        )}
                      </Button>
                    ) : (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-green-600 hover:text-green-700 hover:bg-green-50"
                        onClick={() => connectGmailMutation.mutate(config.id)}
                        disabled={connectGmailMutation.isPending}
                        data-testid={`button-connect-gmail-${config.id}`}
                      >
                        {connectGmailMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <ExternalLink className="h-4 w-4 mr-1" />
                            Connect Gmail
                          </>
                        )}
                      </Button>
                    )}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                      onClick={() => openSignatureDialog(config)}
                      data-testid={`button-signature-config-${config.id}`}
                    >
                      <Pen className="h-4 w-4 mr-1" />
                      Signature
                    </Button>
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

      {/* Digital Signature Dialog */}
      <Dialog open={signatureDialogOpen} onOpenChange={(open) => {
        setSignatureDialogOpen(open);
        if (!open) {
          setSelectedConfigForSignature(null);
        }
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pen className="h-5 w-5" />
              Digital Signature
            </DialogTitle>
          </DialogHeader>
          
          {selectedConfigForSignature && (
            <div className="space-y-6">
              <div className="text-sm text-gray-600">
                <p><strong>Email:</strong> {selectedConfigForSignature.companyEmail}</p>
                <p><strong>User:</strong> {getUserDisplayName(selectedConfigForSignature.userId)}</p>
              </div>

              {/* Current Signature Preview */}
              {selectedConfigForSignature.signatureImageUrl && (
                <div className="space-y-2">
                  <Label>Current Signature</Label>
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <img 
                      src={selectedConfigForSignature.signatureImageUrl}
                      alt="Email Signature"
                      className="max-w-[300px] max-h-[150px] object-contain"
                      data-testid="signature-preview"
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => {
                      if (confirm('Are you sure you want to remove this signature?')) {
                        removeSignatureMutation.mutate(selectedConfigForSignature.id);
                      }
                    }}
                    disabled={removeSignatureMutation.isPending}
                    data-testid="button-remove-signature"
                  >
                    {removeSignatureMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <X className="h-4 w-4 mr-2" />
                    )}
                    Remove Signature
                  </Button>
                </div>
              )}

              {/* Upload New Signature */}
              <div className="space-y-3">
                <Label>
                  {selectedConfigForSignature.signatureImageUrl ? 'Replace Signature' : 'Upload Signature'}
                </Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-purple-400 transition-colors">
                  <input
                    ref={signatureInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleSignatureUpload(e, selectedConfigForSignature.id)}
                    data-testid="input-signature-file"
                  />
                  <div className="space-y-2">
                    <Image className="h-10 w-10 mx-auto text-gray-400" />
                    <Button
                      variant="outline"
                      onClick={() => signatureInputRef.current?.click()}
                      disabled={uploadingSignature}
                      data-testid="button-upload-signature"
                    >
                      {uploadingSignature ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Choose Image
                        </>
                      )}
                    </Button>
                    <p className="text-xs text-gray-500">
                      PNG, JPG, or GIF. Max 5MB.
                    </p>
                  </div>
                </div>
                <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                  <h5 className="font-medium text-purple-800 text-sm mb-1">Supported Dimensions</h5>
                  <p className="text-xs text-purple-700">
                    <strong>Max Width:</strong> 1200px<br />
                    <strong>Max Height:</strong> 800px
                  </p>
                  <p className="text-xs text-purple-600 mt-1">
                    This signature will be automatically appended to all emails sent from this account.
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
