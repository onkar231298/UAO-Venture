import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import RichTextEditor from "@/components/RichTextEditor";
import {
  Mail,
  Send,
  Users,
  CheckSquare,
  Square,
  Search,
  Calendar,
  Clock,
  FileText,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle,
} from "lucide-react";

interface Company {
  id: number;
  name: string;
  email: string;
  contactName: string | null;
}

interface EmailTemplate {
  id: number;
  name: string;
  subject: string;
  htmlContent: string;
  textContent: string | null;
  description: string | null;
  variables: string[];
}

interface EmailCampaign {
  id: number;
  name: string;
  subject: string;
  status: string;
  totalRecipients: number;
  sentCount: number;
  deliveredCount: number;
  openedCount: number;
  bouncedCount: number;
  failedCount: number;
  createdAt: string;
  sentAt: string | null;
}

interface BulkEmailComposerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preSelectedCompanyIds?: number[];
}

export function BulkEmailComposer({ open, onOpenChange, preSelectedCompanyIds = [] }: BulkEmailComposerProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'compose' | 'campaigns'>('compose');
  const [selectedCompanyIds, setSelectedCompanyIds] = useState<number[]>(preSelectedCompanyIds);
  const [searchTerm, setSearchTerm] = useState("");
  const [campaignName, setCampaignName] = useState("");
  const [subject, setSubject] = useState("");
  const [htmlContent, setHtmlContent] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");

  useEffect(() => {
    if (preSelectedCompanyIds.length > 0) {
      setSelectedCompanyIds(preSelectedCompanyIds);
    }
  }, [preSelectedCompanyIds]);

  const { data: companies = [], isLoading: isLoadingCompanies } = useQuery<Company[]>({
    queryKey: ['/api/email-campaigns/companies'],
    enabled: open,
  });

  const { data: templates = [] } = useQuery<EmailTemplate[]>({
    queryKey: ['/api/email-templates'],
    enabled: open,
  });

  const { data: campaigns = [], refetch: refetchCampaigns } = useQuery<EmailCampaign[]>({
    queryKey: ['/api/email-campaigns'],
    enabled: open && activeTab === 'campaigns',
  });

  const sendCampaignMutation = useMutation({
    mutationFn: async (data: {
      name: string;
      subject: string;
      htmlContent: string;
      textContent?: string;
      companyIds: number[];
      scheduledAt?: string;
    }) => {
      return apiRequest('/api/email-campaigns', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: (result: any) => {
      toast({
        title: "Campaign Sent!",
        description: `${result.sent || 0} emails sent successfully. ${result.failed || 0} failed.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/email-campaigns'] });
      resetForm();
      setActiveTab('campaigns');
    },
    onError: (error: any) => {
      toast({
        title: "Failed to send campaign",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setCampaignName("");
    setSubject("");
    setHtmlContent("");
    setSelectedCompanyIds([]);
    setSelectedTemplateId("");
    setScheduleDate("");
    setScheduleTime("");
  };

  const filteredCompanies = companies.filter((company) =>
    company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.contactName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const companiesWithEmail = filteredCompanies.filter((c) => c.email);

  const handleSelectAll = () => {
    if (selectedCompanyIds.length === companiesWithEmail.length) {
      setSelectedCompanyIds([]);
    } else {
      setSelectedCompanyIds(companiesWithEmail.map((c) => c.id));
    }
  };

  const handleToggleCompany = (companyId: number) => {
    if (selectedCompanyIds.includes(companyId)) {
      setSelectedCompanyIds(selectedCompanyIds.filter((id) => id !== companyId));
    } else {
      setSelectedCompanyIds([...selectedCompanyIds, companyId]);
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const template = templates.find((t) => t.id.toString() === templateId);
    if (template) {
      setSubject(template.subject);
      setHtmlContent(template.htmlContent);
    }
  };

  const handleSendCampaign = () => {
    if (!campaignName.trim()) {
      toast({ title: "Please enter a campaign name", variant: "destructive" });
      return;
    }
    if (!subject.trim()) {
      toast({ title: "Please enter an email subject", variant: "destructive" });
      return;
    }
    if (!htmlContent.trim()) {
      toast({ title: "Please enter email content", variant: "destructive" });
      return;
    }
    if (selectedCompanyIds.length === 0) {
      toast({ title: "Please select at least one company", variant: "destructive" });
      return;
    }

    let scheduledAt: string | undefined;
    if (scheduleDate && scheduleTime) {
      scheduledAt = new Date(`${scheduleDate}T${scheduleTime}`).toISOString();
    }

    sendCampaignMutation.mutate({
      name: campaignName,
      subject,
      htmlContent,
      companyIds: selectedCompanyIds,
      scheduledAt,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return <Badge className="bg-green-100 text-green-700"><CheckCircle className="h-3 w-3 mr-1" />Sent</Badge>;
      case 'sending':
        return <Badge className="bg-blue-100 text-blue-700"><RefreshCw className="h-3 w-3 mr-1 animate-spin" />Sending</Badge>;
      case 'scheduled':
        return <Badge className="bg-yellow-100 text-yellow-700"><Clock className="h-3 w-3 mr-1" />Scheduled</Badge>;
      case 'draft':
        return <Badge className="bg-gray-100 text-gray-700"><FileText className="h-3 w-3 mr-1" />Draft</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-700"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Bulk Email Campaign
          </DialogTitle>
          <DialogDescription>
            Send emails to multiple companies at once
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'compose' | 'campaigns')} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="compose">
              <Send className="h-4 w-4 mr-2" />
              Compose Email
            </TabsTrigger>
            <TabsTrigger value="campaigns">
              <FileText className="h-4 w-4 mr-2" />
              Past Campaigns
            </TabsTrigger>
          </TabsList>

          <TabsContent value="compose" className="flex-1 overflow-auto mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Select Recipients ({selectedCompanyIds.length} selected)
                  </Label>
                  <div className="relative mb-2">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search companies..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSelectAll}
                    >
                      {selectedCompanyIds.length === companiesWithEmail.length ? (
                        <>
                          <CheckSquare className="h-4 w-4 mr-1" />
                          Deselect All
                        </>
                      ) : (
                        <>
                          <Square className="h-4 w-4 mr-1" />
                          Select All ({companiesWithEmail.length})
                        </>
                      )}
                    </Button>
                  </div>
                  <ScrollArea className="h-[200px] border rounded-md p-2">
                    {isLoadingCompanies ? (
                      <div className="flex items-center justify-center h-full">
                        <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
                      </div>
                    ) : companiesWithEmail.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No companies with email addresses found</p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {companiesWithEmail.map((company) => (
                          <div
                            key={company.id}
                            className={`flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-gray-50 ${
                              selectedCompanyIds.includes(company.id) ? 'bg-green-50' : ''
                            }`}
                            onClick={() => handleToggleCompany(company.id)}
                          >
                            <Checkbox
                              checked={selectedCompanyIds.includes(company.id)}
                              onCheckedChange={() => handleToggleCompany(company.id)}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{company.name}</p>
                              <p className="text-xs text-muted-foreground truncate">{company.email}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </div>

                <div>
                  <Label htmlFor="template">Use Template (Optional)</Label>
                  <Select value={selectedTemplateId} onValueChange={handleTemplateSelect}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a template..." />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map((template) => (
                        <SelectItem key={template.id} value={template.id.toString()}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div>
                  <Label className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Schedule (Optional)
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="date"
                      value={scheduleDate}
                      onChange={(e) => setScheduleDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                    />
                    <Input
                      type="time"
                      value={scheduleTime}
                      onChange={(e) => setScheduleTime(e.target.value)}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Leave empty to send immediately
                  </p>
                </div>

                <div className="bg-blue-50 p-3 rounded-lg text-sm">
                  <p className="font-medium text-blue-800 mb-1">Available Variables:</p>
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="outline" className="text-xs">{"{{contact_name}}"}</Badge>
                    <Badge variant="outline" className="text-xs">{"{{company_name}}"}</Badge>
                    <Badge variant="outline" className="text-xs">{"{{email}}"}</Badge>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="campaignName">Campaign Name *</Label>
                  <Input
                    id="campaignName"
                    placeholder="e.g., January Newsletter"
                    value={campaignName}
                    onChange={(e) => setCampaignName(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="subject">Email Subject *</Label>
                  <Input
                    id="subject"
                    placeholder="e.g., Special Offer for {{company_name}}"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                  />
                </div>

                <div>
                  <Label>Email Content *</Label>
                  <div className="border rounded-md">
                    <RichTextEditor
                      content={htmlContent}
                      onChange={setHtmlContent}
                      placeholder="Write your email content here..."
                    />
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="mt-6">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSendCampaign}
                disabled={sendCampaignMutation.isPending || selectedCompanyIds.length === 0}
              >
                {sendCampaignMutation.isPending ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    {scheduleDate && scheduleTime ? 'Schedule Campaign' : `Send to ${selectedCompanyIds.length} Companies`}
                  </>
                )}
              </Button>
            </DialogFooter>
          </TabsContent>

          <TabsContent value="campaigns" className="flex-1 overflow-auto mt-4">
            <div className="flex justify-end mb-4">
              <Button variant="outline" size="sm" onClick={() => refetchCampaigns()}>
                <RefreshCw className="h-4 w-4 mr-1" />
                Refresh
              </Button>
            </div>

            {campaigns.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No campaigns yet</p>
                <p className="text-sm">Create your first email campaign to get started</p>
              </div>
            ) : (
              <div className="space-y-3">
                {campaigns.map((campaign) => (
                  <Card key={campaign.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium">{campaign.name}</h4>
                            {getStatusBadge(campaign.status)}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{campaign.subject}</p>
                          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                            <span>Recipients: {campaign.totalRecipients}</span>
                            <span className="text-green-600">Sent: {campaign.sentCount}</span>
                            <span className="text-blue-600">Delivered: {campaign.deliveredCount}</span>
                            <span className="text-purple-600">Opened: {campaign.openedCount}</span>
                            {campaign.bouncedCount > 0 && (
                              <span className="text-red-600">Bounced: {campaign.bouncedCount}</span>
                            )}
                            {campaign.failedCount > 0 && (
                              <span className="text-red-600">Failed: {campaign.failedCount}</span>
                            )}
                          </div>
                        </div>
                        <div className="text-right text-xs text-muted-foreground">
                          {campaign.sentAt ? (
                            <p>Sent: {new Date(campaign.sentAt).toLocaleDateString()}</p>
                          ) : (
                            <p>Created: {new Date(campaign.createdAt).toLocaleDateString()}</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
