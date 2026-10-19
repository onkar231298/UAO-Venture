import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2, Save, FileText, Mail, Settings2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import EmailConfigManagement from "./EmailConfigManagement";
import PortalAppearanceSettings from "@/components/portal/PortalAppearanceSettings";
import QuotationTermsManagement from "@/pages/crm/QuotationTermsManagement";
import QuotationPdfTemplateManagement from "./QuotationPdfTemplateManagement";

interface DocumentNumberSetting {
  id: number;
  documentType: string;
  prefix: string;
  separator: string;
  includeYear: boolean;
  yearFormat: string;
  includeMonth: boolean;
  sequenceLength: number;
  currentSequence: number;
  resetPeriod: string;
  sampleFormat: string;
  lastResetDate: string | null;
  createdAt: string;
  updatedAt: string;
}

function DocumentNumberSettings() {
  const { toast } = useToast();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<DocumentNumberSetting>>({});

  const { data: settings = [], isLoading, refetch } = useQuery<DocumentNumberSetting[]>({
    queryKey: ['/api/admin/document-number-settings'],
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<DocumentNumberSetting> }) => {
      return apiRequest(`/api/admin/document-number-settings/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({ title: "Settings Updated", description: "Document numbering settings saved successfully." });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/document-number-settings'] });
      setEditingId(null);
      setEditForm({});
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update settings.", variant: "destructive" });
    },
  });

  const handleEdit = (setting: DocumentNumberSetting) => {
    setEditingId(setting.id);
    setEditForm({
      prefix: setting.prefix,
      separator: setting.separator,
      includeYear: setting.includeYear,
      yearFormat: setting.yearFormat,
      includeMonth: setting.includeMonth,
      sequenceLength: setting.sequenceLength,
      resetPeriod: setting.resetPeriod,
    });
  };

  const handleSave = (id: number) => {
    updateMutation.mutate({ id, data: editForm });
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditForm({});
  };

  const generatePreview = (setting: DocumentNumberSetting) => {
    const s = editingId === setting.id ? editForm : setting;
    const year = new Date().getFullYear();
    const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
    const sequence = '1'.padStart(s.sequenceLength || 4, '0');
    
    let format = s.prefix || 'DOC';
    const sep = s.separator || '-';
    if (s.includeYear) {
      format += sep + (s.yearFormat === 'YY' ? year.toString().slice(-2) : year.toString());
    }
    if (s.includeMonth) {
      format += sep + month;
    }
    format += sep + sequence;
    
    return format;
  };

  const getDocumentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'sales_order': 'Sales Order',
      'quotation': 'Quotation',
      'purchase_order': 'Purchase Order',
      'invoice': 'Invoice',
    };
    return labels[type] || type;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Document Numbering</h3>
          <p className="text-sm text-muted-foreground">Configure automatic numbering formats for different document types</p>
        </div>
      </div>

      {settings.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No document number settings found. Default formats will be used.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {settings.map((setting) => (
            <Card key={setting.id} data-testid={`card-document-setting-${setting.id}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-primary" />
                    <div>
                      <CardTitle className="text-base">{getDocumentTypeLabel(setting.documentType)}</CardTitle>
                      <CardDescription>Current sequence: {setting.currentSequence}</CardDescription>
                    </div>
                  </div>
                  <Badge variant="outline" className="font-mono text-sm">
                    {generatePreview(setting)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {editingId === setting.id ? (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor={`prefix-${setting.id}`}>Prefix</Label>
                      <Input
                        id={`prefix-${setting.id}`}
                        data-testid={`input-prefix-${setting.id}`}
                        value={editForm.prefix || ''}
                        onChange={(e) => setEditForm({ ...editForm, prefix: e.target.value })}
                        placeholder="SO"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`separator-${setting.id}`}>Separator</Label>
                      <Select
                        value={editForm.separator || '-'}
                        onValueChange={(value) => setEditForm({ ...editForm, separator: value })}
                      >
                        <SelectTrigger data-testid={`select-separator-${setting.id}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="-">Hyphen (-)</SelectItem>
                          <SelectItem value="/">Slash (/)</SelectItem>
                          <SelectItem value="_">Underscore (_)</SelectItem>
                          <SelectItem value=".">Dot (.)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`sequenceLength-${setting.id}`}>Sequence Length</Label>
                      <Select
                        value={editForm.sequenceLength?.toString() || '4'}
                        onValueChange={(value) => setEditForm({ ...editForm, sequenceLength: parseInt(value) })}
                      >
                        <SelectTrigger data-testid={`select-sequence-length-${setting.id}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="3">3 digits (001)</SelectItem>
                          <SelectItem value="4">4 digits (0001)</SelectItem>
                          <SelectItem value="5">5 digits (00001)</SelectItem>
                          <SelectItem value="6">6 digits (000001)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id={`includeYear-${setting.id}`}
                        data-testid={`switch-include-year-${setting.id}`}
                        checked={editForm.includeYear || false}
                        onCheckedChange={(checked) => setEditForm({ ...editForm, includeYear: checked })}
                      />
                      <Label htmlFor={`includeYear-${setting.id}`}>Include Year</Label>
                    </div>
                    {editForm.includeYear && (
                      <div className="space-y-2">
                        <Label htmlFor={`yearFormat-${setting.id}`}>Year Format</Label>
                        <Select
                          value={editForm.yearFormat || 'YYYY'}
                          onValueChange={(value) => setEditForm({ ...editForm, yearFormat: value })}
                        >
                          <SelectTrigger data-testid={`select-year-format-${setting.id}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="YYYY">Full Year (2024)</SelectItem>
                            <SelectItem value="YY">Short Year (24)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    <div className="flex items-center space-x-2">
                      <Switch
                        id={`includeMonth-${setting.id}`}
                        data-testid={`switch-include-month-${setting.id}`}
                        checked={editForm.includeMonth || false}
                        onCheckedChange={(checked) => setEditForm({ ...editForm, includeMonth: checked })}
                      />
                      <Label htmlFor={`includeMonth-${setting.id}`}>Include Month</Label>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`resetPeriod-${setting.id}`}>Reset Period</Label>
                      <Select
                        value={editForm.resetPeriod || 'never'}
                        onValueChange={(value) => setEditForm({ ...editForm, resetPeriod: value })}
                      >
                        <SelectTrigger data-testid={`select-reset-period-${setting.id}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="never">Never</SelectItem>
                          <SelectItem value="yearly">Yearly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="sm:col-span-2 lg:col-span-3 flex gap-2 justify-end pt-4">
                      <Button
                        variant="outline"
                        onClick={handleCancel}
                        data-testid={`button-cancel-${setting.id}`}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={() => handleSave(setting.id)}
                        disabled={updateMutation.isPending}
                        data-testid={`button-save-${setting.id}`}
                      >
                        {updateMutation.isPending ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4 mr-2" />
                        )}
                        Save Changes
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Prefix:</span>{' '}
                        <span className="font-medium">{setting.prefix}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Year:</span>{' '}
                        <span className="font-medium">{setting.includeYear ? setting.yearFormat : 'No'}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Month:</span>{' '}
                        <span className="font-medium">{setting.includeMonth ? 'Yes' : 'No'}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Reset:</span>{' '}
                        <span className="font-medium capitalize">{setting.resetPeriod}</span>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(setting)}
                      data-testid={`button-edit-${setting.id}`}
                    >
                      Edit
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SystemSettings({ canManagePdfTemplates = false }: { canManagePdfTemplates?: boolean }) {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">System Settings</h2>
        <p className="text-muted-foreground">Configure system settings, workspace appearance, and reusable templates</p>
      </div>

      <Tabs defaultValue="email" className="w-full">
        <TabsList className="flex h-auto w-full max-w-2xl flex-wrap justify-start gap-1">
          <TabsTrigger value="appearance" data-testid="tab-appearance">Appearance</TabsTrigger>
          <TabsTrigger value="email" className="flex items-center gap-2" data-testid="tab-email">
            <Mail className="h-4 w-4" />
            Email Configuration
          </TabsTrigger>
          <TabsTrigger value="documents" className="flex items-center gap-2" data-testid="tab-documents">
            <FileText className="h-4 w-4" />
            Document Numbers
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2" data-testid="tab-template-management">
            <FileText className="h-4 w-4" />
            Template Management
          </TabsTrigger>
        </TabsList>

        <TabsContent value="appearance" className="mt-6">
          <PortalAppearanceSettings />
        </TabsContent>
        <TabsContent value="email" className="mt-6">
          <EmailConfigManagement />
        </TabsContent>

        <TabsContent value="documents" className="mt-6">
          <DocumentNumberSettings />
        </TabsContent>

        <TabsContent value="templates" className="mt-6">
          {selectedTemplate === "quotation-terms" ? (
            <div className="space-y-4">
              <Button
                variant="outline"
                onClick={() => setSelectedTemplate(null)}
                data-testid="button-back-to-template-management"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Template Management
              </Button>
              <QuotationTermsManagement />
            </div>
          ) : selectedTemplate === "quotation-pdf-format" ? (
            <div className="space-y-4">
              <Button
                variant="outline"
                onClick={() => setSelectedTemplate(null)}
                data-testid="button-back-to-template-management"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Template Management
              </Button>
              {canManagePdfTemplates
                ? <QuotationPdfTemplateManagement />
                : <p className="text-sm text-destructive">Only a super admin can manage quotation PDF formats.</p>}
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold tracking-tight">Template Management</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Keep reusable business templates organized here. More template types can be added to this library as they are introduced.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <Card data-testid="template-card-quotation-terms">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      Quotation Terms &amp; Conditions
                    </CardTitle>
                    <CardDescription>
                      Review, version, and manage the terms used for future quotation PDFs.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      onClick={() => setSelectedTemplate("quotation-terms")}
                      data-testid="button-manage-quotation-terms-template"
                    >
                      Manage template
                    </Button>
                  </CardContent>
                </Card>
                {canManagePdfTemplates && (
                  <Card data-testid="template-card-quotation-pdf-format">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        Quotation PDF Format
                      </CardTitle>
                      <CardDescription>
                        Create versioned layouts, preview changes, and activate a format for new quotations.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button
                        onClick={() => setSelectedTemplate("quotation-pdf-format")}
                        data-testid="button-manage-quotation-pdf-format"
                      >
                        Manage format
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
