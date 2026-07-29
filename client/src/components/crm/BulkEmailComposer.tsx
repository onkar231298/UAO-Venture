import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
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
import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import Highlight from '@tiptap/extension-highlight';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import FontFamily from '@tiptap/extension-font-family';
import Image from '@tiptap/extension-image';
import { Extension } from '@tiptap/core';

// Custom FontSize extension
const FontSize = Extension.create({
  name: 'fontSize',
  addOptions() {
    return {
      types: ['textStyle'],
    };
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: element => element.style.fontSize?.replace(/['"]+/g, ''),
            renderHTML: attributes => {
              if (!attributes.fontSize) {
                return {};
              }
              return {
                style: `font-size: ${attributes.fontSize}`,
              };
            },
          },
        },
      },
    ];
  },
  addCommands() {
    return {
      setFontSize: (fontSize: string) => ({ chain }: any) => {
        return chain().setMark('textStyle', { fontSize }).run();
      },
      unsetFontSize: () => ({ chain }: any) => {
        return chain().setMark('textStyle', { fontSize: null }).removeEmptyTextStyle().run();
      },
    };
  },
});
import { Table, TableRow, TableCell, TableHeader } from '@tiptap/extension-table';
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
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Link as LinkIcon,
  Image as ImageIcon,
  Code,
  Eye,
  Code2,
  Upload,
  X,
  Trash2,
  Move,
  Maximize2,
  Minimize2,
  Palette,
  Type,
  Highlighter,
  Copy,
  ClipboardPaste,
  Paperclip,
  File,
  Table2,
  Plus,
  Minus,
  Rows,
  Columns,
} from "lucide-react";

interface CompanyContact {
  id: number;
  name: string | null;
  email: string;
}

interface Company {
  id: number;
  name: string;
  email: string;
  contactName: string | null;
  contacts?: CompanyContact[];
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

interface UploadedImage {
  id: string;
  url: string;
  name: string;
  size: number;
}

interface EmailAttachment {
  content: string; // Base64 encoded
  filename: string;
  type: string; // MIME type
}

interface BulkEmailComposerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preSelectedCompanyIds?: number[];
}

const fontSizes = [
  { label: 'Small', value: '12px' },
  { label: 'Normal', value: '14px' },
  { label: 'Medium', value: '16px' },
  { label: 'Large', value: '18px' },
  { label: 'XL', value: '24px' },
  { label: 'XXL', value: '32px' },
];

const colors = [
  '#000000', '#333333', '#666666', '#999999', '#CCCCCC',
  '#EF4444', '#F97316', '#EAB308', '#22C55E', '#14B8A6',
  '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899', '#F43F5E',
];

export function BulkEmailComposer({ open, onOpenChange, preSelectedCompanyIds = [] }: BulkEmailComposerProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'compose' | 'campaigns'>('compose');
  const [selectedCompanyIds, setSelectedCompanyIds] = useState<number[]>(preSelectedCompanyIds);
  const [searchTerm, setSearchTerm] = useState("");
  const [campaignName, setCampaignName] = useState("");
  const [subject, setSubject] = useState("");
  const [htmlContent, setHtmlContent] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [editorMode, setEditorMode] = useState<'visual' | 'html' | 'preview'>('visual');
  const [rawHtml, setRawHtml] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(true);
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);
  const [emailAttachments, setEmailAttachments] = useState<EmailAttachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const attachmentInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      Color,
      FontFamily,
      FontSize,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: 'Start writing your email content here...' }),
      Image.configure({
        inline: true,
        allowBase64: true,
        HTMLAttributes: {
          class: 'email-image',
        },
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'email-table',
          style: 'border-collapse: collapse; width: 100%; margin: 10px 0;',
        },
      }),
      TableRow.configure({
        HTMLAttributes: {
          style: 'border: 1px solid #ddd;',
        },
      }),
      TableHeader.configure({
        HTMLAttributes: {
          style: 'border: 1px solid #ddd; background-color: #f5f5f5; padding: 8px; text-align: left; font-weight: bold;',
        },
      }),
      TableCell.configure({
        HTMLAttributes: {
          style: 'border: 1px solid #ddd; padding: 8px;',
        },
      }),
    ],
    content: htmlContent,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      setHtmlContent(html);
      setRawHtml(html);
    },
  });

  useEffect(() => {
    if (editor && htmlContent !== editor.getHTML()) {
      editor.commands.setContent(htmlContent);
    }
  }, [editor, htmlContent]);

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
      replyTo?: string;
      attachments?: EmailAttachment[];
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
    setRawHtml("");
    setSelectedCompanyIds([]);
    setSelectedTemplateId("");
    setScheduleDate("");
    setScheduleTime("");
    setUploadedImages([]);
    setEmailAttachments([]);
    editor?.commands.clearContent();
  };

  const filteredCompanies = companies.filter((company) =>
    company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.contactName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.contacts?.some(c => c.email?.toLowerCase().includes(searchTerm.toLowerCase()) || c.name?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const companiesWithEmail = filteredCompanies.filter((c) => c.email || (c.contacts && c.contacts.length > 0));
  
  // Calculate total recipients including all contacts for selected companies
  const getTotalRecipients = () => {
    let count = 0;
    for (const companyId of selectedCompanyIds) {
      const company = companies.find(c => c.id === companyId);
      if (company) {
        // Count primary email
        if (company.email) count++;
        // Count additional contacts (excluding duplicates of primary)
        if (company.contacts) {
          for (const contact of company.contacts) {
            if (contact.email && contact.email.toLowerCase() !== company.email?.toLowerCase()) {
              count++;
            }
          }
        }
      }
    }
    return count;
  };
  
  const getCompanyEmailCount = (company: Company) => {
    let count = company.email ? 1 : 0;
    if (company.contacts) {
      for (const contact of company.contacts) {
        if (contact.email && contact.email.toLowerCase() !== company.email?.toLowerCase()) {
          count++;
        }
      }
    }
    return count;
  };

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
      setRawHtml(template.htmlContent);
      editor?.commands.setContent(template.htmlContent);
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
      replyTo: user?.email || undefined,
      attachments: emailAttachments.length > 0 ? emailAttachments : undefined,
    });
  };

  const handleAttachmentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const maxSize = 10 * 1024 * 1024; // 10MB per file
    const maxTotal = 25 * 1024 * 1024; // 25MB total (SendGrid limit is 30MB but leave buffer)
    
    // Check individual file sizes first
    const validFiles: globalThis.File[] = [];
    for (const file of files) {
      if (file.size > maxSize) {
        toast({
          title: "File too large",
          description: `${file.name} exceeds 10MB limit`,
          variant: "destructive",
        });
        continue;
      }
      validFiles.push(file);
    }
    
    if (validFiles.length === 0) {
      if (e.target) e.target.value = '';
      return;
    }
    
    // Calculate existing attachments size (base64 length * 0.75 ≈ original binary size)
    const existingSize = emailAttachments.reduce((sum, att) => sum + (att.content.length * 0.75), 0);
    const newFilesTotalSize = validFiles.reduce((sum, f) => sum + f.size, 0);
    
    if (existingSize + newFilesTotalSize > maxTotal) {
      toast({
        title: "Total size limit exceeded",
        description: `Total attachments cannot exceed 25MB. Current: ${Math.round(existingSize / 1024 / 1024)}MB, new: ${Math.round(newFilesTotalSize / 1024 / 1024)}MB`,
        variant: "destructive",
      });
      if (e.target) e.target.value = '';
      return;
    }
    
    // Process valid files and check running total as we add each
    let runningSize = existingSize;
    for (const file of validFiles) {
      if (runningSize + file.size > maxTotal) {
        toast({
          title: "Size limit reached",
          description: `Cannot add ${file.name} - would exceed 25MB total limit`,
          variant: "destructive",
        });
        continue;
      }
      
      runningSize += file.size;
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        setEmailAttachments(prev => {
          // Double-check we're not adding duplicates
          if (prev.some(a => a.filename === file.name)) {
            return prev;
          }
          return [...prev, {
            content: base64,
            filename: file.name,
            type: file.type || 'application/octet-stream',
          }];
        });
      };
      reader.readAsDataURL(file);
    }
    
    // Reset input
    if (e.target) {
      e.target.value = '';
    }
  };

  const removeAttachment = (filename: string) => {
    setEmailAttachments(prev => prev.filter(att => att.filename !== filename));
  };

  const handleApplyHtml = () => {
    setHtmlContent(rawHtml);
    editor?.commands.setContent(rawHtml);
    setEditorMode('visual');
    toast({ title: "HTML applied successfully" });
  };

  const handlePasteHtml = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setRawHtml(text);
      toast({ title: "HTML pasted from clipboard" });
    } catch (err) {
      toast({ title: "Failed to read clipboard", variant: "destructive" });
    }
  };

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files).filter(file => 
      file.type.startsWith('image/')
    );

    if (files.length > 0) {
      handleImageUpload(files);
    }
  }, []);

  const handleImageUpload = async (files: File[]) => {
    toast({
      title: "Image Warning",
      description: "Embedded images may not display in some email clients (like Gmail). For best results, use hosted image URLs instead.",
      variant: "destructive",
      duration: 8000,
    });
    
    for (const file of files) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        const newImage: UploadedImage = {
          id: `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          url: base64,
          name: file.name,
          size: file.size,
        };
        setUploadedImages(prev => [...prev, newImage]);
        
        if (editor) {
          editor.chain().focus().setImage({ src: base64 }).run();
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      handleImageUpload(files);
    }
  };

  const insertImage = (image: UploadedImage) => {
    if (editor) {
      editor.chain().focus().setImage({ src: image.url }).run();
    }
  };

  const removeUploadedImage = (imageId: string) => {
    setUploadedImages(prev => prev.filter(img => img.id !== imageId));
  };

  const setLink = () => {
    const url = window.prompt('Enter URL:');
    if (url) {
      editor?.chain().focus().setLink({ href: url }).run();
    }
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

  const ToolbarButton = ({ 
    onClick, 
    isActive, 
    children, 
    tooltip 
  }: { 
    onClick: () => void; 
    isActive?: boolean; 
    children: React.ReactNode;
    tooltip: string;
  }) => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant={isActive ? "secondary" : "ghost"}
            size="sm"
            onClick={onClick}
            className={`h-8 w-8 p-0 ${isActive ? 'bg-gray-200' : ''}`}
          >
            {children}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  const dialogClass = isFullscreen 
    ? "max-w-[98vw] w-[98vw] h-[95vh] max-h-[95vh]" 
    : "max-w-5xl max-h-[90vh]";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`${dialogClass} overflow-hidden flex flex-col p-0`}>
        <DialogHeader className="p-4 pb-2 border-b flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <Mail className="h-6 w-6 text-primary" />
                Bulk Email Campaign
              </DialogTitle>
              <DialogDescription>
                Create and send professional email campaigns to multiple companies
              </DialogDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'compose' | 'campaigns')} className="flex-1 flex flex-col overflow-hidden">
          <div className="px-4 pt-2 flex-shrink-0">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="compose">
                <Send className="h-4 w-4 mr-2" />
                Compose Email
              </TabsTrigger>
              <TabsTrigger value="campaigns">
                <FileText className="h-4 w-4 mr-2" />
                Past Campaigns
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="compose" className="flex-1 overflow-hidden mt-0 p-4">
            <div className="flex h-full gap-4">
              <div className="w-72 flex-shrink-0 flex flex-col gap-4 overflow-auto">
                <Card className="flex-shrink-0">
                  <CardContent className="p-3">
                    <Label className="text-sm font-medium mb-2 flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Recipients ({selectedCompanyIds.length} companies, {getTotalRecipients()} emails)
                    </Label>
                    {preSelectedCompanyIds.length > 0 ? (
                      <div className="bg-green-50 border border-green-200 rounded-md p-3">
                        <div className="flex items-center gap-2 text-green-700 mb-2">
                          <CheckCircle className="h-4 w-4" />
                          <span className="font-medium text-sm">{selectedCompanyIds.length} companies, {getTotalRecipients()} emails</span>
                        </div>
                        <ScrollArea className="h-40">
                          <div className="space-y-2">
                            {companies.filter(c => selectedCompanyIds.includes(c.id)).map((company) => {
                              const emailCount = getCompanyEmailCount(company);
                              const additionalContacts = company.contacts?.filter(c => c.email && c.email.toLowerCase() !== company.email?.toLowerCase()) || [];
                              return (
                                <div key={company.id} className="text-xs bg-white rounded px-2 py-1.5 border border-green-100">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1">
                                      <p className="font-medium truncate">{company.name}</p>
                                      {emailCount > 1 && (
                                        <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4">
                                          {emailCount} emails
                                        </Badge>
                                      )}
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-5 w-5 p-0"
                                      onClick={() => setSelectedCompanyIds(selectedCompanyIds.filter(id => id !== company.id))}
                                    >
                                      <X className="h-3 w-3" />
                                    </Button>
                                  </div>
                                  <p className="text-muted-foreground truncate">{company.email} (primary)</p>
                                  {additionalContacts.map((contact) => (
                                    <p key={contact.id} className="text-muted-foreground truncate">
                                      {contact.email} {contact.name ? `(${contact.name})` : ''}
                                    </p>
                                  ))}
                                </div>
                              );
                            })}
                          </div>
                        </ScrollArea>
                      </div>
                    ) : (
                      <>
                        <div className="relative mb-2">
                          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
                          <Input
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-7 h-8 text-sm"
                          />
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleSelectAll}
                          className="w-full mb-2 h-7 text-xs"
                        >
                          {selectedCompanyIds.length === companiesWithEmail.length ? (
                            <><CheckSquare className="h-3 w-3 mr-1" />Deselect All</>
                          ) : (
                            <><Square className="h-3 w-3 mr-1" />Select All ({companiesWithEmail.length})</>
                          )}
                        </Button>
                        <ScrollArea className="h-40 border rounded-md">
                          {isLoadingCompanies ? (
                            <div className="flex items-center justify-center h-full">
                              <RefreshCw className="h-4 w-4 animate-spin text-gray-400" />
                            </div>
                          ) : companiesWithEmail.length === 0 ? (
                            <div className="text-center py-4 text-muted-foreground text-xs">
                              <AlertCircle className="h-6 w-6 mx-auto mb-1 opacity-50" />
                              <p>No companies found</p>
                            </div>
                          ) : (
                            <div className="p-1 space-y-0.5">
                              {companiesWithEmail.map((company) => {
                                const emailCount = getCompanyEmailCount(company);
                                return (
                                  <div
                                    key={company.id}
                                    className={`flex items-center gap-2 p-1.5 rounded cursor-pointer hover:bg-gray-50 text-xs ${
                                      selectedCompanyIds.includes(company.id) ? 'bg-green-50' : ''
                                    }`}
                                    onClick={() => handleToggleCompany(company.id)}
                                  >
                                    <Checkbox
                                      checked={selectedCompanyIds.includes(company.id)}
                                      className="h-3 w-3"
                                    />
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-1">
                                        <p className="font-medium truncate">{company.name}</p>
                                        {emailCount > 1 && (
                                          <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4">
                                            {emailCount} emails
                                          </Badge>
                                        )}
                                      </div>
                                      <p className="text-muted-foreground truncate">{company.email}</p>
                                      {company.contacts && company.contacts.length > 0 && (
                                        <div className="text-muted-foreground text-[10px] mt-0.5">
                                          +{company.contacts.filter(c => c.email && c.email.toLowerCase() !== company.email?.toLowerCase()).length} more contacts
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </ScrollArea>
                      </>
                    )}
                  </CardContent>
                </Card>

                <Card className="flex-shrink-0">
                  <CardContent className="p-3 space-y-3">
                    <div>
                      <Label htmlFor="template" className="text-xs">Template</Label>
                      <Select value={selectedTemplateId} onValueChange={handleTemplateSelect}>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Choose template..." />
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
                      <Label className="text-xs flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Schedule (Optional)
                      </Label>
                      <div className="grid grid-cols-2 gap-1 mt-1">
                        <Input
                          type="date"
                          value={scheduleDate}
                          onChange={(e) => setScheduleDate(e.target.value)}
                          min={new Date().toISOString().split('T')[0]}
                          className="h-7 text-xs"
                        />
                        <Input
                          type="time"
                          value={scheduleTime}
                          onChange={(e) => setScheduleTime(e.target.value)}
                          className="h-7 text-xs"
                        />
                      </div>
                    </div>

                    <div className="bg-blue-50 p-2 rounded text-xs">
                      <p className="font-medium text-blue-800 mb-1">Variables:</p>
                      <div className="flex flex-wrap gap-1">
                        <Badge variant="outline" className="text-[10px]">{"{{contact_name}}"}</Badge>
                        <Badge variant="outline" className="text-[10px]">{"{{company_name}}"}</Badge>
                        <Badge variant="outline" className="text-[10px]">{"{{email}}"}</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="flex-shrink-0">
                  <CardContent className="p-3">
                    <Label className="text-xs flex items-center gap-1 mb-2">
                      <ImageIcon className="h-3 w-3" />
                      Image Gallery
                    </Label>
                    <div
                      ref={dropZoneRef}
                      onDragEnter={handleDragEnter}
                      onDragLeave={handleDragLeave}
                      onDragOver={handleDragOver}
                      onDrop={handleDrop}
                      className={`border-2 border-dashed rounded-md p-3 text-center cursor-pointer transition-colors ${
                        isDragging ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="h-5 w-5 mx-auto mb-1 text-gray-400" />
                      <p className="text-xs text-muted-foreground">
                        Drop images here or click to upload
                      </p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleFileInputChange}
                        className="hidden"
                      />
                    </div>
                    <p className="text-[10px] text-amber-600 mt-1">
                      Note: For best results, use hosted image URLs. Embedded images may not display in Gmail.
                    </p>
                    {uploadedImages.length > 0 && (
                      <ScrollArea className="h-24 mt-2">
                        <div className="grid grid-cols-3 gap-1">
                          {uploadedImages.map((image) => (
                            <div key={image.id} className="relative group">
                              <img
                                src={image.url}
                                alt={image.name}
                                className="w-full h-16 object-cover rounded cursor-pointer border"
                                onClick={() => insertImage(image)}
                              />
                              <Button
                                variant="destructive"
                                size="sm"
                                className="absolute top-0.5 right-0.5 h-4 w-4 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => { e.stopPropagation(); removeUploadedImage(image.id); }}
                              >
                                <X className="h-2 w-2" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    )}
                  </CardContent>
                </Card>

                <Card className="flex-shrink-0">
                  <CardContent className="p-3">
                    <Label className="text-xs flex items-center gap-1 mb-2">
                      <Paperclip className="h-3 w-3" />
                      Attachments
                    </Label>
                    <div
                      className="border-2 border-dashed rounded-md p-3 text-center cursor-pointer transition-colors border-gray-200 hover:border-gray-300"
                      onClick={() => attachmentInputRef.current?.click()}
                    >
                      <File className="h-5 w-5 mx-auto mb-1 text-gray-400" />
                      <p className="text-xs text-muted-foreground">
                        Click to add files (PDF, DOC, etc.)
                      </p>
                      <p className="text-[10px] text-gray-400">Max 10MB per file, 25MB total</p>
                      <input
                        ref={attachmentInputRef}
                        type="file"
                        multiple
                        onChange={handleAttachmentUpload}
                        className="hidden"
                      />
                    </div>
                    {emailAttachments.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {emailAttachments.map((att) => (
                          <div key={att.filename} className="flex items-center justify-between bg-gray-50 rounded p-1.5 text-xs">
                            <div className="flex items-center gap-1 truncate">
                              <File className="h-3 w-3 text-gray-500 flex-shrink-0" />
                              <span className="truncate">{att.filename}</span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-5 w-5 p-0"
                              onClick={() => removeAttachment(att.filename)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <div className="flex gap-3 mb-3 flex-shrink-0">
                  <div className="flex-1">
                    <Label htmlFor="campaignName" className="text-xs">Campaign Name *</Label>
                    <Input
                      id="campaignName"
                      placeholder="e.g., January Newsletter"
                      value={campaignName}
                      onChange={(e) => setCampaignName(e.target.value)}
                      className="h-9"
                    />
                  </div>
                  <div className="flex-1">
                    <Label htmlFor="subject" className="text-xs">Email Subject *</Label>
                    <Input
                      id="subject"
                      placeholder="e.g., Special Offer for {{company_name}}"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="h-9"
                    />
                  </div>
                </div>

                <div className="flex-1 flex flex-col min-h-0 border rounded-lg overflow-hidden">
                  <div className="border-b bg-gray-50 p-1.5 flex items-center gap-1 flex-wrap flex-shrink-0">
                    <div className="flex items-center gap-0.5 border-r pr-1 mr-1">
                      <ToolbarButton
                        onClick={() => setEditorMode('visual')}
                        isActive={editorMode === 'visual'}
                        tooltip="Visual Editor"
                      >
                        <Type className="h-4 w-4" />
                      </ToolbarButton>
                      <ToolbarButton
                        onClick={() => { setEditorMode('html'); setRawHtml(htmlContent); }}
                        isActive={editorMode === 'html'}
                        tooltip="HTML Source"
                      >
                        <Code2 className="h-4 w-4" />
                      </ToolbarButton>
                      <ToolbarButton
                        onClick={() => setEditorMode('preview')}
                        isActive={editorMode === 'preview'}
                        tooltip="Preview"
                      >
                        <Eye className="h-4 w-4" />
                      </ToolbarButton>
                    </div>

                    {editorMode === 'visual' && editor && (
                      <>
                        <div className="flex items-center gap-0.5 border-r pr-1 mr-1">
                          <ToolbarButton onClick={() => editor.chain().focus().undo().run()} tooltip="Undo">
                            <Undo className="h-4 w-4" />
                          </ToolbarButton>
                          <ToolbarButton onClick={() => editor.chain().focus().redo().run()} tooltip="Redo">
                            <Redo className="h-4 w-4" />
                          </ToolbarButton>
                        </div>

                        <div className="flex items-center gap-0.5 border-r pr-1 mr-1">
                          <ToolbarButton
                            onClick={() => editor.chain().focus().toggleBold().run()}
                            isActive={editor.isActive('bold')}
                            tooltip="Bold"
                          >
                            <Bold className="h-4 w-4" />
                          </ToolbarButton>
                          <ToolbarButton
                            onClick={() => editor.chain().focus().toggleItalic().run()}
                            isActive={editor.isActive('italic')}
                            tooltip="Italic"
                          >
                            <Italic className="h-4 w-4" />
                          </ToolbarButton>
                          <ToolbarButton
                            onClick={() => editor.chain().focus().toggleUnderline().run()}
                            isActive={editor.isActive('underline')}
                            tooltip="Underline"
                          >
                            <UnderlineIcon className="h-4 w-4" />
                          </ToolbarButton>
                          <ToolbarButton
                            onClick={() => editor.chain().focus().toggleStrike().run()}
                            isActive={editor.isActive('strike')}
                            tooltip="Strikethrough"
                          >
                            <Strikethrough className="h-4 w-4" />
                          </ToolbarButton>
                        </div>

                        <div className="flex items-center gap-0.5 border-r pr-1 mr-1 relative">
                          <ToolbarButton
                            onClick={() => setShowColorPicker(!showColorPicker)}
                            tooltip="Text Color"
                          >
                            <Palette className="h-4 w-4" />
                          </ToolbarButton>
                          {showColorPicker && (
                            <div className="absolute top-full left-0 mt-1 p-2 bg-white border rounded-md shadow-lg z-50 grid grid-cols-5 gap-1">
                              {colors.map((color) => (
                                <button
                                  key={color}
                                  className="w-6 h-6 rounded border"
                                  style={{ backgroundColor: color }}
                                  onClick={() => {
                                    editor.chain().focus().setColor(color).run();
                                    setShowColorPicker(false);
                                  }}
                                />
                              ))}
                            </div>
                          )}
                          <ToolbarButton
                            onClick={() => setShowHighlightPicker(!showHighlightPicker)}
                            tooltip="Highlight"
                          >
                            <Highlighter className="h-4 w-4" />
                          </ToolbarButton>
                          {showHighlightPicker && (
                            <div className="absolute top-full left-0 mt-1 p-2 bg-white border rounded-md shadow-lg z-50 grid grid-cols-5 gap-1">
                              {['#FEF08A', '#BBF7D0', '#BAE6FD', '#DDD6FE', '#FECDD3'].map((color) => (
                                <button
                                  key={color}
                                  className="w-6 h-6 rounded border"
                                  style={{ backgroundColor: color }}
                                  onClick={() => {
                                    editor.chain().focus().toggleHighlight({ color }).run();
                                    setShowHighlightPicker(false);
                                  }}
                                />
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Font Size Selector */}
                        <div className="flex items-center gap-0.5 border-r pr-1 mr-1">
                          <select
                            className="h-7 px-1 text-xs border rounded bg-white hover:bg-gray-50 cursor-pointer"
                            onChange={(e) => {
                              if (e.target.value) {
                                editor.chain().focus().setMark('textStyle', { fontSize: e.target.value }).run();
                              }
                            }}
                            value=""
                          >
                            <option value="" disabled>Size</option>
                            <option value="10px">10</option>
                            <option value="12px">12</option>
                            <option value="14px">14</option>
                            <option value="16px">16</option>
                            <option value="18px">18</option>
                            <option value="20px">20</option>
                            <option value="24px">24</option>
                            <option value="28px">28</option>
                            <option value="32px">32</option>
                            <option value="36px">36</option>
                            <option value="48px">48</option>
                            <option value="64px">64</option>
                          </select>
                        </div>

                        {/* Font Family Selector */}
                        <div className="flex items-center gap-0.5 border-r pr-1 mr-1">
                          <select
                            className="h-7 px-1 text-xs border rounded bg-white hover:bg-gray-50 cursor-pointer max-w-[100px]"
                            onChange={(e) => {
                              if (e.target.value) {
                                editor.chain().focus().setFontFamily(e.target.value).run();
                              }
                            }}
                            value=""
                          >
                            <option value="" disabled>Font</option>
                            <option value="Arial" style={{ fontFamily: 'Arial' }}>Arial</option>
                            <option value="Times New Roman" style={{ fontFamily: 'Times New Roman' }}>Times New Roman</option>
                            <option value="Georgia" style={{ fontFamily: 'Georgia' }}>Georgia</option>
                            <option value="Verdana" style={{ fontFamily: 'Verdana' }}>Verdana</option>
                            <option value="Courier New" style={{ fontFamily: 'Courier New' }}>Courier New</option>
                            <option value="Trebuchet MS" style={{ fontFamily: 'Trebuchet MS' }}>Trebuchet MS</option>
                            <option value="Tahoma" style={{ fontFamily: 'Tahoma' }}>Tahoma</option>
                            <option value="Palatino Linotype" style={{ fontFamily: 'Palatino Linotype' }}>Palatino</option>
                            <option value="Lucida Sans" style={{ fontFamily: 'Lucida Sans' }}>Lucida Sans</option>
                            <option value="Impact" style={{ fontFamily: 'Impact' }}>Impact</option>
                          </select>
                        </div>

                        <div className="flex items-center gap-0.5 border-r pr-1 mr-1">
                          <ToolbarButton
                            onClick={() => editor.chain().focus().setTextAlign('left').run()}
                            isActive={editor.isActive({ textAlign: 'left' })}
                            tooltip="Align Left"
                          >
                            <AlignLeft className="h-4 w-4" />
                          </ToolbarButton>
                          <ToolbarButton
                            onClick={() => editor.chain().focus().setTextAlign('center').run()}
                            isActive={editor.isActive({ textAlign: 'center' })}
                            tooltip="Align Center"
                          >
                            <AlignCenter className="h-4 w-4" />
                          </ToolbarButton>
                          <ToolbarButton
                            onClick={() => editor.chain().focus().setTextAlign('right').run()}
                            isActive={editor.isActive({ textAlign: 'right' })}
                            tooltip="Align Right"
                          >
                            <AlignRight className="h-4 w-4" />
                          </ToolbarButton>
                          <ToolbarButton
                            onClick={() => editor.chain().focus().setTextAlign('justify').run()}
                            isActive={editor.isActive({ textAlign: 'justify' })}
                            tooltip="Justify"
                          >
                            <AlignJustify className="h-4 w-4" />
                          </ToolbarButton>
                        </div>

                        <div className="flex items-center gap-0.5 border-r pr-1 mr-1">
                          <ToolbarButton
                            onClick={() => editor.chain().focus().toggleBulletList().run()}
                            isActive={editor.isActive('bulletList')}
                            tooltip="Bullet List"
                          >
                            <List className="h-4 w-4" />
                          </ToolbarButton>
                          <ToolbarButton
                            onClick={() => editor.chain().focus().toggleOrderedList().run()}
                            isActive={editor.isActive('orderedList')}
                            tooltip="Numbered List"
                          >
                            <ListOrdered className="h-4 w-4" />
                          </ToolbarButton>
                          <ToolbarButton
                            onClick={() => editor.chain().focus().toggleBlockquote().run()}
                            isActive={editor.isActive('blockquote')}
                            tooltip="Quote"
                          >
                            <Quote className="h-4 w-4" />
                          </ToolbarButton>
                        </div>

                        <div className="flex items-center gap-0.5 border-r pr-1 mr-1">
                          <ToolbarButton onClick={setLink} isActive={editor.isActive('link')} tooltip="Add Link">
                            <LinkIcon className="h-4 w-4" />
                          </ToolbarButton>
                          <ToolbarButton
                            onClick={() => fileInputRef.current?.click()}
                            tooltip="Insert Image"
                          >
                            <ImageIcon className="h-4 w-4" />
                          </ToolbarButton>
                        </div>

                        <div className="flex items-center gap-0.5">
                          <ToolbarButton
                            onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
                            isActive={editor.isActive('table')}
                            tooltip="Insert Table"
                          >
                            <Table2 className="h-4 w-4" />
                          </ToolbarButton>
                          {editor.isActive('table') && (
                            <>
                              <ToolbarButton
                                onClick={() => editor.chain().focus().addColumnAfter().run()}
                                tooltip="Add Column"
                              >
                                <Columns className="h-4 w-4" />
                              </ToolbarButton>
                              <ToolbarButton
                                onClick={() => editor.chain().focus().addRowAfter().run()}
                                tooltip="Add Row"
                              >
                                <Rows className="h-4 w-4" />
                              </ToolbarButton>
                              <ToolbarButton
                                onClick={() => editor.chain().focus().deleteTable().run()}
                                tooltip="Delete Table"
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </ToolbarButton>
                            </>
                          )}
                        </div>
                      </>
                    )}

                    {editorMode === 'html' && (
                      <div className="flex items-center gap-1 ml-auto">
                        <Button variant="outline" size="sm" className="h-7 text-xs" onClick={handlePasteHtml}>
                          <ClipboardPaste className="h-3 w-3 mr-1" />
                          Paste HTML
                        </Button>
                        <Button variant="default" size="sm" className="h-7 text-xs" onClick={handleApplyHtml}>
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Apply HTML
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 overflow-auto">
                    {editorMode === 'visual' && (
                      <div
                        className="h-full"
                        onDragEnter={handleDragEnter}
                        onDragLeave={handleDragLeave}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                      >
                        <EditorContent 
                          editor={editor} 
                          className="h-full prose prose-sm max-w-none p-4 focus:outline-none [&_.ProseMirror]:h-full [&_.ProseMirror]:min-h-[300px] [&_.ProseMirror]:outline-none [&_.ProseMirror_p.is-editor-empty:first-child::before]:text-gray-400 [&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left [&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none [&_.email-image]:max-w-full [&_.email-image]:h-auto [&_.email-image]:rounded [&_.email-image]:my-2"
                        />
                        {isDragging && (
                          <div className="absolute inset-0 bg-primary/10 border-2 border-dashed border-primary flex items-center justify-center pointer-events-none z-10">
                            <div className="bg-white p-4 rounded-lg shadow-lg text-center">
                              <Upload className="h-8 w-8 mx-auto mb-2 text-primary" />
                              <p className="text-sm font-medium">Drop image here</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {editorMode === 'html' && (
                      <div className="h-full p-2">
                        <Textarea
                          value={rawHtml}
                          onChange={(e) => setRawHtml(e.target.value)}
                          placeholder="Paste or write your HTML code here..."
                          className="h-full min-h-[400px] font-mono text-sm resize-none"
                        />
                      </div>
                    )}

                    {editorMode === 'preview' && (
                      <div className="h-full p-4 bg-gray-50">
                        <div className="bg-white border rounded-lg p-6 max-w-2xl mx-auto shadow-sm">
                          <div className="border-b pb-3 mb-4">
                            <p className="text-sm text-gray-500">Subject: <span className="text-gray-900 font-medium">{subject || '(No subject)'}</span></p>
                          </div>
                          <div 
                            className="prose prose-sm max-w-none"
                            dangerouslySetInnerHTML={{ __html: htmlContent || '<p class="text-gray-400">No content yet...</p>' }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between mt-3 pt-3 border-t flex-shrink-0">
                  <div className="text-sm text-muted-foreground">
                    {selectedCompanyIds.length} recipient{selectedCompanyIds.length !== 1 ? 's' : ''} selected
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSendCampaign}
                      disabled={sendCampaignMutation.isPending || selectedCompanyIds.length === 0}
                      className="min-w-[180px]"
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
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="campaigns" className="flex-1 overflow-auto mt-0 p-4">
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
