import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mail, Plus, Trash2, Edit2, User, Building, Loader2, CheckCircle, Link2, Unlink, AlertTriangle, Info, Code2, Eye, Pen, Save } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import DOMPurify from "dompurify";

interface EmailConfig {
  id: number;
  userId: string;
  companyEmail: string;
  displayName: string | null;
  isPrimary: boolean;
  isActive: boolean;
  serviceType?: string;
  isConnected?: boolean;
  signatureImageUrl?: string | null;
  signatureHtml?: string | null;
}

interface UserOption {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  role: string;
}

const escapeHtml = (value: string) => value.replace(
  /[&<>"']/g,
  character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character] || character,
);

export default function EmailConfigManagement() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<EmailConfig | null>(null);
  const [signatureDialogOpen, setSignatureDialogOpen] = useState(false);
  const [selectedConfigForSignature, setSelectedConfigForSignature] = useState<EmailConfig | null>(null);
  const [signatureHtml, setSignatureHtml] = useState("");
  const [formData, setFormData] = useState({ userId: "", companyEmail: "", displayName: "", isPrimary: true, isActive: true });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: emailConfigs = [], isLoading } = useQuery<EmailConfig[]>({ queryKey: ['/api/admin/email-configs'] });
  const { data: users = [], isLoading: isLoadingUsers } = useQuery<UserOption[]>({ queryKey: ['/api/admin/users'] });
  const invalidateConfigs = () => queryClient.invalidateQueries({ queryKey: ['/api/admin/email-configs'] });

  const resetForm = () => setFormData({ userId: "", companyEmail: "", displayName: "", isPrimary: true, isActive: true });
  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingConfig(null);
    resetForm();
  };

  const createMutation = useMutation({
    mutationFn: (data: typeof formData) => apiRequest('/api/admin/email-configs', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      invalidateConfigs();
      closeDialog();
      toast({ title: "Titan mailbox assigned", description: "The mailbox assignment has been created. The staff member can now connect their own app password." });
    },
    onError: (error: Error) => toast({ title: "Error", description: error.message || "Failed to create mailbox assignment", variant: "destructive" }),
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: typeof formData }) => apiRequest(`/api/admin/email-configs/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    onSuccess: () => {
      invalidateConfigs();
      closeDialog();
      toast({ title: "Mailbox assignment updated", description: "The Titan mailbox assignment has been updated." });
    },
    onError: (error: Error) => toast({ title: "Error", description: error.message || "Failed to update mailbox assignment", variant: "destructive" }),
  });
  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/admin/email-configs/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      invalidateConfigs();
      toast({ title: "Mailbox assignment deleted", description: "The email configuration has been removed." });
    },
    onError: (error: Error) => toast({ title: "Error", description: error.message || "Failed to delete mailbox assignment", variant: "destructive" }),
  });
  const removeSignatureMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/admin/email-configs/${id}/signature`, { method: 'DELETE' }),
    onSuccess: () => {
      invalidateConfigs();
      setSignatureDialogOpen(false);
      setSelectedConfigForSignature(null);
      setSignatureHtml("");
      toast({ title: "Signature removed", description: "The email signature has been removed from this mailbox." });
    },
    onError: (error: Error) => toast({ title: "Error", description: error.message || "Failed to remove signature", variant: "destructive" }),
  });
  const saveSignatureMutation = useMutation({
    mutationFn: ({ id, html }: { id: number; html: string }) => apiRequest(`/api/admin/email-configs/${id}/signature-html`, {
      method: "PUT",
      body: JSON.stringify({ signatureHtml: html }),
    }),
    onSuccess: () => {
      invalidateConfigs();
      setSignatureDialogOpen(false);
      setSelectedConfigForSignature(null);
      setSignatureHtml("");
      toast({ title: "Signature saved", description: "The HTML signature will be added to email sent from this mailbox." });
    },
    onError: (error: Error) => toast({ title: "Error", description: error.message || "Failed to save HTML signature", variant: "destructive" }),
  });

  const getUser = (userId: string) => users.find((user) => user.id === userId);
  const getUserDisplayName = (userId: string) => {
    const user = getUser(userId);
    return user ? [user.firstName, user.lastName].filter(Boolean).join(" ") || user.username : userId;
  };
  const getUserRole = (userId: string) => getUser(userId)?.role?.replace("_", " ") || "Unknown";
  const handleEdit = (config: EmailConfig) => {
    setEditingConfig(config);
    setFormData({ userId: config.userId, companyEmail: config.companyEmail, displayName: config.displayName || "", isPrimary: config.isPrimary, isActive: config.isActive });
    setIsDialogOpen(true);
  };
  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!formData.userId || !formData.companyEmail) {
      toast({ title: "Validation error", description: "Select a staff member and enter their Titan mailbox.", variant: "destructive" });
      return;
    }
    if (editingConfig) updateMutation.mutate({ id: editingConfig.id, data: formData });
    else createMutation.mutate(formData);
  };

  const openSignatureEditor = (config: EmailConfig) => {
    setSelectedConfigForSignature(config);
    setSignatureHtml(config.signatureHtml || "");
    setSignatureDialogOpen(true);
  };

  const useStarterSignature = () => {
    if (!selectedConfigForSignature) return;
    const staffName = getUserDisplayName(selectedConfigForSignature.userId);
    const role = getUserRole(selectedConfigForSignature.userId);
    const mailbox = selectedConfigForSignature.companyEmail;
    setSignatureHtml(`<table role="presentation" cellpadding="0" cellspacing="0" style="font-family:Arial, sans-serif;color:#374151;font-size:14px;line-height:1.5">
  <tr>
    <td style="border-left:4px solid #15803d;padding-left:14px">
      <strong style="color:#166534;font-size:16px">${escapeHtml(staffName)}</strong><br>
      <span>${escapeHtml(role)}</span><br>
      <a href="mailto:${escapeHtml(mailbox)}" style="color:#15803d;text-decoration:none">${escapeHtml(mailbox)}</a><br>
      <span style="color:#6b7280">Atlas Ingredients</span>
    </td>
  </tr>
</table>`);
  };

  const previewSignatureHtml = DOMPurify.sanitize(signatureHtml, {
    FORBID_TAGS: ["script", "style", "iframe", "object", "embed", "form"],
    FORBID_ATTR: ["onerror", "onload", "onclick"],
  });
  const signaturePreviewDocument = `<!doctype html><html><head><meta charset="utf-8"></head><body style="margin:0;padding:16px;background:#ffffff">${previewSignatureHtml || '<p style="font-family:Arial,sans-serif;color:#9ca3af">Signature preview will appear here.</p>'}</body></html>`;

  return (
    <div className="space-y-6">
      <Alert className="border-blue-200 bg-blue-50">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertTitle className="text-blue-800">Titan mailbox connection process</AlertTitle>
        <AlertDescription className="text-blue-700">
          <p>Admins assign each staff member’s Titan mailbox and display name here. Staff members connect their own Titan app password from <strong>Sales Dashboard → Email Settings</strong>.</p>
          <p className="mt-2">App passwords are encrypted and never displayed after they are saved. Administrators do not enter, view, or manage staff app passwords.</p>
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2"><Mail className="h-5 w-5" /> Titan Mailbox Assignments</CardTitle>
              <CardDescription className="mt-1">Assign Titan mailboxes and display names. Connection credentials are supplied by each staff member.</CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={(open) => open ? setIsDialogOpen(true) : closeDialog()}>
              <DialogTrigger asChild>
                <Button data-testid="button-add-email-config"><Plus className="h-4 w-4 mr-2" /> Assign Titan Mailbox</Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader><DialogTitle>{editingConfig ? "Edit Titan Mailbox Assignment" : "Assign Titan Mailbox"}</DialogTitle></DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="userId">Staff member</Label>
                    <Select value={formData.userId} onValueChange={(userId) => setFormData({ ...formData, userId })}>
                      <SelectTrigger data-testid="select-user"><SelectValue placeholder="Select a staff member" /></SelectTrigger>
                      <SelectContent>
                        {isLoadingUsers ? <div className="flex items-center justify-center py-2"><Loader2 className="h-4 w-4 animate-spin mr-2" /><span className="text-sm">Loading users...</span></div> : users.map((user) => (
                          <SelectItem key={user.id} value={user.id}><div className="flex items-center gap-2"><User className="h-4 w-4" /><span>{[user.firstName, user.lastName].filter(Boolean).join(" ") || user.username}</span><Badge variant="outline" className="text-xs ml-2">{user.role.replace("_", " ")}</Badge></div></SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="companyEmail">Titan mailbox</Label>
                    <Input id="companyEmail" type="email" value={formData.companyEmail} onChange={(event) => setFormData({ ...formData, companyEmail: event.target.value })} placeholder="name@company.com" data-testid="input-company-email" />
                    <p className="text-xs text-muted-foreground mt-1">The Titan email address assigned to this staff member.</p>
                  </div>
                  <div>
                    <Label htmlFor="displayName">Display name (optional)</Label>
                    <Input id="displayName" value={formData.displayName} onChange={(event) => setFormData({ ...formData, displayName: event.target.value })} placeholder="Jane Smith - Company" data-testid="input-display-name" />
                    <p className="text-xs text-muted-foreground mt-1">Appears in the From field of sent email.</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2"><Switch id="isPrimary" checked={formData.isPrimary} onCheckedChange={(isPrimary) => setFormData({ ...formData, isPrimary })} /><Label htmlFor="isPrimary">Primary email</Label></div>
                    <div className="flex items-center gap-2"><Switch id="isActive" checked={formData.isActive} onCheckedChange={(isActive) => setFormData({ ...formData, isActive })} /><Label htmlFor="isActive">Active</Label></div>
                  </div>
                  <div className="flex gap-2 justify-end pt-4">
                    <Button type="button" variant="outline" onClick={closeDialog}>Cancel</Button>
                    <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-save-email-config">
                      {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}{editingConfig ? "Update" : "Assign"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /><span className="ml-2 text-gray-500">Loading mailbox assignments...</span></div>
          ) : emailConfigs.length === 0 ? (
            <div className="text-center py-8 text-gray-500"><Mail className="h-12 w-12 mx-auto mb-2 opacity-30" /><p>No Titan mailbox assignments yet</p><p className="text-sm">Assign a mailbox so staff can connect their own app password.</p></div>
          ) : (
            <div className="space-y-3">
              {emailConfigs.map((config) => (
                <div key={config.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg hover:bg-gray-50 gap-4" data-testid={`email-config-${config.id}`}>
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-full ${config.isConnected ? "bg-green-100" : "bg-blue-100"}`}><Mail className={`h-5 w-5 ${config.isConnected ? "text-green-600" : "text-blue-600"}`} /></div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium">{getUserDisplayName(config.userId)}</p><Badge variant="outline" className="text-xs">{getUserRole(config.userId)}</Badge>
                        {config.isPrimary && <Badge className="bg-green-100 text-green-800 text-xs"><CheckCircle className="h-3 w-3 mr-1" /> Primary</Badge>}
                        {!config.isActive && <Badge variant="secondary" className="text-xs">Inactive</Badge>}
                      </div>
                      <p className="text-sm text-gray-600">{config.companyEmail}</p>
                      {config.displayName && <p className="text-xs text-gray-500">Display: {config.displayName}</p>}
                      <div className="mt-1 flex flex-wrap gap-1">
                        <Badge variant="outline" className="text-xs"><Building className="h-3 w-3 mr-1" /> Titan</Badge>
                        {config.isConnected ? <Badge className="bg-green-100 text-green-800 text-xs"><Link2 className="h-3 w-3 mr-1" /> Connected</Badge> : <Badge variant="secondary" className="text-xs"><Unlink className="h-3 w-3 mr-1" /> Awaiting staff connection</Badge>}
                        {config.signatureHtml ? <Badge className="bg-purple-100 text-purple-800 text-xs"><Pen className="h-3 w-3 mr-1" /> HTML signature</Badge> : config.signatureImageUrl ? <Badge variant="outline" className="text-xs text-amber-700 border-amber-300"><Pen className="h-3 w-3 mr-1" /> Legacy image signature</Badge> : <Badge variant="outline" className="text-xs text-gray-500"><Pen className="h-3 w-3 mr-1" /> No signature</Badge>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="text-purple-600 hover:text-purple-700 hover:bg-purple-50" onClick={() => openSignatureEditor(config)} data-testid={`button-signature-config-${config.id}`}><Pen className="h-4 w-4 mr-1" /> Signature</Button>
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(config)} data-testid={`button-edit-config-${config.id}`}><Edit2 className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => { if (confirm("Are you sure you want to delete this mailbox assignment?")) deleteMutation.mutate(config.id); }} disabled={deleteMutation.isPending} data-testid={`button-delete-config-${config.id}`}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg">Titan setup for staff</CardTitle><CardDescription>Staff connect directly using a Titan app password; no Gmail OAuth or administrator credentials are required.</CardDescription></CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
            <li>Assign the staff member’s Titan mailbox and optional display name above.</li>
            <li>The staff member generates an app password in their Titan account.</li>
            <li>They open Email Settings and select Connect &amp; Test Titan.</li>
            <li>The CRM encrypts the app password and does not display it again.</li>
          </ol>
        </CardContent>
      </Card>

      <Dialog open={signatureDialogOpen} onOpenChange={(open) => {
        setSignatureDialogOpen(open);
        if (!open) {
          setSelectedConfigForSignature(null);
          setSignatureHtml("");
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Code2 className="h-5 w-5" /> HTML Email Signature</DialogTitle></DialogHeader>
          {selectedConfigForSignature && (
            <div className="space-y-6">
              <div className="text-sm text-gray-600"><p><strong>Email:</strong> {selectedConfigForSignature.companyEmail}</p><p><strong>Staff member:</strong> {getUserDisplayName(selectedConfigForSignature.userId)}</p></div>
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Email-compatible HTML only</AlertTitle>
                <AlertDescription>
                  Use tables and inline CSS. Scripts, forms, iframes, style blocks, external stylesheets, and unsafe URLs are removed automatically.
                </AlertDescription>
              </Alert>
              {selectedConfigForSignature.signatureImageUrl && !selectedConfigForSignature.signatureHtml && (
                <Alert className="border-amber-200 bg-amber-50">
                  <AlertTriangle className="h-4 w-4 text-amber-700" />
                  <AlertTitle className="text-amber-900">Legacy image signature</AlertTitle>
                  <AlertDescription className="text-amber-800">
                    Saving HTML below will replace the image for all new CRM email without deleting the stored image.
                  </AlertDescription>
                </Alert>
              )}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <Label htmlFor="signature-html">HTML and inline CSS</Label>
                    <Button type="button" variant="outline" size="sm" onClick={useStarterSignature}>
                      <Code2 className="h-4 w-4 mr-1" /> Use starter
                    </Button>
                  </div>
                  <Textarea
                    id="signature-html"
                    value={signatureHtml}
                    onChange={(event) => setSignatureHtml(event.target.value)}
                    className="min-h-[300px] font-mono text-xs"
                    placeholder="<table style=&quot;font-family:Arial,sans-serif&quot;>...</table>"
                    maxLength={30000}
                    data-testid="input-signature-html"
                  />
                  <p className="text-xs text-muted-foreground">{signatureHtml.length.toLocaleString()} / 30,000 characters</p>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><Eye className="h-4 w-4" /> Preview</Label>
                  <iframe
                    title="Email signature preview"
                    sandbox=""
                    srcDoc={signaturePreviewDocument}
                    className="w-full min-h-[300px] border rounded-md bg-white"
                    data-testid="signature-preview"
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">The saved signature is sanitized again on the server and automatically appended to company, lead, quotation, and sales-order email sent from this mailbox.</p>
              <div className="flex flex-wrap justify-between gap-2">
                <div>
                  {(selectedConfigForSignature.signatureHtml || selectedConfigForSignature.signatureImageUrl) && (
                    <Button variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => { if (confirm("Are you sure you want to remove this signature?")) removeSignatureMutation.mutate(selectedConfigForSignature.id); }} disabled={removeSignatureMutation.isPending} data-testid="button-remove-signature">
                      {removeSignatureMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />} Remove signature
                    </Button>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => setSignatureDialogOpen(false)}>Cancel</Button>
                  <Button
                    type="button"
                    onClick={() => saveSignatureMutation.mutate({ id: selectedConfigForSignature.id, html: signatureHtml })}
                    disabled={!signatureHtml.trim() || saveSignatureMutation.isPending}
                    data-testid="button-save-signature"
                  >
                    {saveSignatureMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />} Save signature
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}