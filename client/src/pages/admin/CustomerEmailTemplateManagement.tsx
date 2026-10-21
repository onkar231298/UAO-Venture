import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowLeft, Eye, Loader2, Mail, Save } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface CustomerEmailTemplate {
  id: number;
  templateKey: string;
  name: string;
  category: string;
  status: "active" | "draft";
  subject: string;
  htmlContent: string;
  textContent: string;
  description: string | null;
  variables: string[];
  updatedAt: string;
}

type TemplateForm = Pick<
  CustomerEmailTemplate,
  "name" | "status" | "subject" | "htmlContent" | "textContent" | "description" | "variables"
>;

interface RenderedPreview {
  subject: string;
  html: string;
  text: string;
}

const TEMPLATE_QUERY_KEY = ["/api/admin/customer-email-templates"];

export default function CustomerEmailTemplateManagement() {
  const { toast } = useToast();
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [form, setForm] = useState<TemplateForm | null>(null);
  const [preview, setPreview] = useState<RenderedPreview | null>(null);

  const { data, isLoading, isError } = useQuery<{ templates: CustomerEmailTemplate[] }>({
    queryKey: TEMPLATE_QUERY_KEY,
    queryFn: async () => {
      const response = await apiRequest("/api/admin/customer-email-templates");
      return response.json();
    },
  });
  const templates = data?.templates || [];
  const selectedTemplate = templates.find((template) => template.templateKey === selectedKey) || null;

  useEffect(() => {
    if (selectedTemplate) {
      setForm({
        name: selectedTemplate.name,
        status: selectedTemplate.status,
        subject: selectedTemplate.subject,
        htmlContent: selectedTemplate.htmlContent,
        textContent: selectedTemplate.textContent,
        description: selectedTemplate.description || "",
        variables: selectedTemplate.variables || [],
      });
      setPreview(null);
    }
  }, [selectedTemplate]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!selectedKey || !form) throw new Error("Choose a template first");
      const response = await apiRequest(`/api/admin/customer-email-templates/${selectedKey}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: form.name,
          status: form.status,
          subject: form.subject,
          htmlContent: form.htmlContent,
          textContent: form.textContent,
          description: form.description,
        }),
      });
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Template saved", description: "The customer email template has been updated." });
      queryClient.invalidateQueries({ queryKey: TEMPLATE_QUERY_KEY });
    },
    onError: (error: Error) => {
      toast({ title: "Could not save template", description: error.message, variant: "destructive" });
    },
  });

  const previewMutation = useMutation({
    mutationFn: async () => {
      if (!selectedKey || !form) throw new Error("Choose a template first");
      const response = await apiRequest(`/api/admin/customer-email-templates/${selectedKey}/preview`, {
        method: "POST",
        body: JSON.stringify({
          subject: form.subject,
          htmlContent: form.htmlContent,
          textContent: form.textContent,
          variables: form.variables,
        }),
      });
      return response.json() as Promise<RenderedPreview>;
    },
    onSuccess: setPreview,
    onError: (error: Error) => {
      toast({ title: "Could not preview template", description: error.message, variant: "destructive" });
    },
  });

  const setField = <K extends keyof TemplateForm>(key: K, value: TemplateForm[K]) => {
    setForm((previous) => previous ? { ...previous, [key]: value } : previous);
    setPreview(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-10">
        <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-destructive">
          Could not load customer email templates. Refresh the page and try again.
        </CardContent>
      </Card>
    );
  }

  if (selectedTemplate && form) {
    const isAccountTemplate = selectedTemplate.category === "customer_account";
    return (
      <div className="space-y-5">
        <Button variant="outline" onClick={() => { setSelectedKey(null); setForm(null); setPreview(null); }}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to templates
        </Button>

        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-xl font-semibold">{selectedTemplate.name}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{form.description || selectedTemplate.description}</p>
          </div>
          <Badge variant={form.status === "active" ? "default" : "secondary"}>
            {form.status === "active" ? "Active" : "Draft"}
          </Badge>
        </div>

        {isAccountTemplate ? (
          <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950 dark:bg-amber-950/30 dark:text-amber-100">
            If you switch off this custom template, the built-in Atlas default will still be used so account emails continue working.
          </div>
        ) : (
          <div className="rounded-md border bg-muted/30 p-3 text-sm text-muted-foreground">
            This template is not connected to an email-send flow. Activating it will not send emails.
          </div>
        )}

        <Card>
          <CardContent className="grid gap-5 p-5">
            <div className="grid gap-2">
              <Label htmlFor="customer-email-template-name">Template name</Label>
              <Input
                id="customer-email-template-name"
                value={form.name}
                onChange={(event) => setField("name", event.target.value)}
                maxLength={255}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="customer-email-template-subject">Email subject</Label>
              <Input
                id="customer-email-template-subject"
                value={form.subject}
                onChange={(event) => setField("subject", event.target.value)}
                maxLength={500}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="customer-email-template-html">HTML email body</Label>
              <Textarea
                id="customer-email-template-html"
                value={form.htmlContent}
                onChange={(event) => setField("htmlContent", event.target.value)}
                rows={16}
                className="font-mono text-xs"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="customer-email-template-text">Plain-text email body</Label>
              <Textarea
                id="customer-email-template-text"
                value={form.textContent}
                onChange={(event) => setField("textContent", event.target.value)}
                rows={9}
              />
            </div>
            <div className="grid gap-2">
              <Label>Supported merge fields</Label>
              <div className="flex flex-wrap gap-2">
                {form.variables.map((variable) => (
                  <Badge key={variable} variant="outline" className="font-mono">
                    {`{{${variable}}}`}
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">Only the fields listed here are substituted into the email.</p>
            </div>
            <div className="grid gap-2 sm:max-w-xs">
              <Label htmlFor="customer-email-template-status">Template status</Label>
              <Select value={form.status} onValueChange={(value: "active" | "draft") => setField("status", value)}>
                <SelectTrigger id="customer-email-template-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="draft">Draft / inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-wrap justify-end gap-2 border-t pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => previewMutation.mutate()}
                disabled={previewMutation.isPending}
              >
                {previewMutation.isPending
                  ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  : <Eye className="mr-2 h-4 w-4" />}
                Preview with sample data
              </Button>
              <Button
                type="button"
                onClick={() => updateMutation.mutate()}
                disabled={updateMutation.isPending || !form.name.trim() || !form.subject.trim() || !form.htmlContent.trim()}
              >
                {updateMutation.isPending
                  ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  : <Save className="mr-2 h-4 w-4" />}
                Save changes
              </Button>
            </div>
          </CardContent>
        </Card>

        {preview && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base"><Eye className="h-4 w-4" />Email preview</CardTitle>
              <CardDescription><strong>Subject:</strong> {preview.subject}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <iframe
                title={`${selectedTemplate.name} email preview`}
                sandbox=""
                srcDoc={preview.html}
                className="h-[520px] w-full rounded-md border bg-white"
              />
              <details>
                <summary className="cursor-pointer text-sm font-medium">View plain-text version</summary>
                <pre className="mt-2 whitespace-pre-wrap rounded-md border bg-muted/30 p-4 text-sm">{preview.text}</pre>
              </details>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-xl font-semibold">Customer Email Templates</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage account emails separately from bulk marketing campaigns.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {templates.map((template) => (
          <Card key={template.templateKey}>
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  {template.name}
                </CardTitle>
                <Badge variant={template.status === "active" ? "default" : "secondary"}>
                  {template.status === "active" ? "Active" : "Draft"}
                </Badge>
              </div>
              <CardDescription>{template.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" onClick={() => setSelectedKey(template.templateKey)}>
                Manage template
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
