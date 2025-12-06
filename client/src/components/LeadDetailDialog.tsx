import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Building, User, DollarSign, Calendar, Phone, Mail, MapPin, FileText, UserPlus, Package, MessageSquare, History, CheckCircle, XCircle, Clock, Loader2, Send, ArrowRight, ChevronDown, ChevronUp, Inbox, Reply, Paperclip, Eye, Plus, X, Upload, RefreshCw } from "lucide-react";
import { type LeadWithDetails, type Product } from "@shared/schema";
import ActivityTimeline from "./ActivityTimeline";
import { format, formatDistanceToNow } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import RichTextEditor from "./RichTextEditor";
import EmailViewDialog from "./EmailViewDialog";

interface LeadDetailDialogProps {
  lead: LeadWithDetails | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  salesReps?: any[];
  onAssign?: (leadId: number, assignedTo: string) => void;
  canAssignLeads?: boolean;
}

interface EmailAttachment {
  file: File;
  name: string;
  size: number;
  uploading?: boolean;
  uploadedUrl?: string;
}

export default function LeadDetailDialog({ lead, open, onOpenChange, salesReps = [], onAssign, canAssignLeads = false }: LeadDetailDialogProps) {
  const [selectedAssignee, setSelectedAssignee] = useState(lead?.assignedSalesRep || "");
  const [revisedAmount, setRevisedAmount] = useState("");
  const [revisedCurrency, setRevisedCurrency] = useState("USD");
  const [revisedMessage, setRevisedMessage] = useState("");
  const [emailTo, setEmailTo] = useState<string[]>([]);
  const [emailCc, setEmailCc] = useState<string[]>([]);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [showComposeEmail, setShowComposeEmail] = useState(false);
  const [isNewThread, setIsNewThread] = useState(true);
  const [replyToThreadId, setReplyToThreadId] = useState<number | null>(null);
  const [selectedEmail, setSelectedEmail] = useState<any | null>(null);
  const [showEmailView, setShowEmailView] = useState(false);
  const [selectedThread, setSelectedThread] = useState<any | null>(null);
  const [showThreadView, setShowThreadView] = useState(false);
  const [attachments, setAttachments] = useState<EmailAttachment[]>([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [hasAutoSynced, setHasAutoSynced] = useState(false);
  const [showSampleRequestForm, setShowSampleRequestForm] = useState(false);
  const [sampleFormData, setSampleFormData] = useState({
    contactName: "",
    companyName: "",
    phoneNumber: "",
    emailAddress: "",
    productId: 0,
    sampleSize: "50g",
    purpose: "",
    expectedOrderQuantity: "",
    message: "",
    shippingAddress: "",
    city: "",
    state: "",
    postalCode: "",
    country: "United States",
  });
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const productIds = lead?.productsInterested || [];
  const { data: products = [], isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ['/api/admin/products/bulk', { ids: productIds.join(',') }],
    enabled: productIds.length > 0 && open && !!lead,
  });
  
  // Fetch original inquiry/bid data for leads from inquiries
  const isFromInquiry = lead?.leadSource === 'high_volume_bid' || lead?.leadSource === 'product_inquiry';
  const { data: inquiryData, isLoading: inquiryLoading } = useQuery<{
    inquiry: any;
    quotations: any[];
    bidRevisions: any[];
  }>({
    queryKey: ['/api/crm/leads/original-inquiry', lead?.id],
    queryFn: async () => {
      if (!lead?.id) return null;
      const response = await fetch(`/api/crm/leads/${lead.id}/original-inquiry`);
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error('Failed to fetch inquiry details');
      }
      return response.json();
    },
    enabled: isFromInquiry && open && !!lead?.id,
  });

  // Mutation to update bid progress status
  const updateStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      return apiRequest(`/api/crm/leads/${lead?.id}/high-volume-bid/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/crm/leads/original-inquiry', lead?.id] });
      queryClient.invalidateQueries({ queryKey: ['/api/crm/leads'] });
      queryClient.invalidateQueries({ queryKey: ['/api/customer/high-volume-bids'] });
      toast({
        title: "Status Updated",
        description: "Bid progress status has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update status",
        variant: "destructive",
      });
    },
  });

  // Mutation to send revised quote
  const sendRevisedQuoteMutation = useMutation({
    mutationFn: async (data: { messageType: string; message: string; revisedAmount?: string; currency?: string }) => {
      return apiRequest(`/api/crm/leads/${lead?.id}/high-volume-bid/message`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/crm/leads/original-inquiry', lead?.id] });
      queryClient.invalidateQueries({ queryKey: ['/api/crm/leads'] });
      queryClient.invalidateQueries({ queryKey: ['/api/customer/high-volume-bids'] });
      setRevisedAmount("");
      setRevisedMessage("");
      toast({
        title: "Revised Quote Sent",
        description: "Your revised quote has been sent and status updated to 'Quotation Sent'.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send revised quote",
        variant: "destructive",
      });
    },
  });

  const handleSendRevisedQuote = () => {
    if (!revisedAmount || !revisedMessage) {
      toast({
        title: "Validation Error",
        description: "Please enter both amount and message.",
        variant: "destructive",
      });
      return;
    }
    sendRevisedQuoteMutation.mutate({
      messageType: 'revised_quote',
      message: revisedMessage,
      revisedAmount,
      currency: revisedCurrency,
    });
  };

  // Fetch email threads for the lead
  const { data: emailThreads = [], isLoading: emailsLoading } = useQuery<any[]>({
    queryKey: ['/api/crm/leads', lead?.id, 'emails'],
    queryFn: async () => {
      if (!lead?.id) return [];
      const response = await fetch(`/api/crm/leads/${lead.id}/emails`);
      if (!response.ok) throw new Error('Failed to fetch emails');
      return response.json();
    },
    enabled: open && !!lead?.id,
  });

  // Fetch sample requests for the lead
  const { data: sampleRequestsData, isLoading: samplesLoading } = useQuery<{ requests: any[]; total: number }>({
    queryKey: ['/api/crm/leads', lead?.id, 'sample-requests'],
    queryFn: async () => {
      if (!lead?.id) return { requests: [], total: 0 };
      const response = await fetch(`/api/crm/leads/${lead.id}/sample-requests`);
      if (!response.ok) throw new Error('Failed to fetch sample requests');
      return response.json();
    },
    enabled: open && !!lead?.id,
  });

  // Fetch quotations for the lead
  const { data: quotationsData, isLoading: quotationsLoading } = useQuery<{ quotations: any[]; total: number }>({
    queryKey: ['/api/crm/leads', lead?.id, 'quotations'],
    queryFn: async () => {
      if (!lead?.id) return { quotations: [], total: 0 };
      const response = await fetch(`/api/crm/leads/${lead.id}/quotations`);
      if (!response.ok) throw new Error('Failed to fetch quotations');
      return response.json();
    },
    enabled: open && !!lead?.id,
  });

  // Fetch user's email config
  const { data: emailConfig } = useQuery<any>({
    queryKey: ['/api/email/config'],
    enabled: open,
  });

  // Send email mutation
  const sendEmailMutation = useMutation({
    mutationFn: async (data: { 
      to: string[]; 
      cc?: string[]; 
      subject: string; 
      bodyHtml: string;
      threadId?: number;
      isReply?: boolean;
      attachments?: Array<{ fileName: string; fileUrl: string; fileSize: number }>;
    }) => {
      return apiRequest(`/api/crm/leads/${lead?.id}/emails/send`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/crm/leads', lead?.id, 'emails'] });
      queryClient.invalidateQueries({ queryKey: ['/api/crm/leads', lead?.id, 'activities'] });
      resetEmailForm();
      toast({
        title: "Email Sent",
        description: "Your email has been sent successfully via Gmail.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send email",
        variant: "destructive",
      });
    },
  });

  const resetEmailForm = () => {
    setEmailTo([]);
    setEmailCc([]);
    setEmailSubject("");
    setEmailBody("");
    setShowComposeEmail(false);
    setIsNewThread(true);
    setReplyToThreadId(null);
    setAttachments([]);
  };

  const handleSendEmail = async () => {
    if (emailTo.length === 0 || !emailSubject || !emailBody) {
      toast({
        title: "Missing Information",
        description: "Please fill in recipient, subject, and message.",
        variant: "destructive",
      });
      return;
    }

    // Upload attachments first if any
    const uploadedAttachments: Array<{ fileName: string; fileUrl: string; fileSize: number }> = [];
    for (const att of attachments) {
      if (att.uploadedUrl) {
        uploadedAttachments.push({
          fileName: att.name,
          fileUrl: att.uploadedUrl,
          fileSize: att.size,
        });
      }
    }

    sendEmailMutation.mutate({
      to: emailTo,
      cc: emailCc.length > 0 ? emailCc : undefined,
      subject: emailSubject,
      bodyHtml: emailBody,
      threadId: !isNewThread && replyToThreadId ? replyToThreadId : undefined,
      isReply: !isNewThread && !!replyToThreadId,
      attachments: uploadedAttachments.length > 0 ? uploadedAttachments : undefined,
    });
  };

  const initializeComposeEmail = (threadId?: number, replySubject?: string, replyToEmails?: string[], replyCcEmails?: string[]) => {
    // Pre-fill recipients - use reply recipients if provided, otherwise use lead contact email
    if (replyToEmails && replyToEmails.length > 0) {
      setEmailTo(replyToEmails);
    } else if (lead?.contactPerson?.email) {
      setEmailTo([lead.contactPerson.email]);
    } else {
      setEmailTo([]);
    }
    
    // Pre-fill CC if provided
    if (replyCcEmails && replyCcEmails.length > 0) {
      setEmailCc(replyCcEmails);
    } else {
      setEmailCc([]);
    }
    
    if (threadId && replySubject) {
      setIsNewThread(false);
      setReplyToThreadId(threadId);
      setEmailSubject(replySubject.startsWith('Re:') ? replySubject : `Re: ${replySubject}`);
    } else {
      setIsNewThread(true);
      setReplyToThreadId(null);
      setEmailSubject("");
    }
    
    setEmailBody("");
    setAttachments([]);
    setShowComposeEmail(true);
  };

  const handleReplyToEmail = (email: any) => {
    const thread = emailThreads.find((t: any) => 
      t.messages?.some((m: any) => m.id === email.id)
    );
    
    // Get the email config to know our company email
    const ourEmail = emailConfig?.companyEmail?.toLowerCase();
    
    // Build reply recipients:
    // - If we sent the email (outbound), reply to the original recipients
    // - If we received the email (inbound), reply to the sender
    let replyTo: string[] = [];
    let replyCc: string[] = [];
    
    if (email.direction === 'outbound') {
      // We sent this email, reply to the same recipients
      replyTo = (email.toEmails || []).filter((e: string) => e && e.toLowerCase() !== ourEmail);
    } else {
      // We received this email, reply to the sender
      replyTo = email.fromEmail ? [email.fromEmail] : [];
    }
    
    // Include original CC recipients (excluding our email)
    replyCc = (email.ccEmails || []).filter((e: string) => e && e.toLowerCase() !== ourEmail);
    
    // If no recipients found, fall back to lead contact email
    if (replyTo.length === 0 && lead?.contactPerson?.email) {
      replyTo = [lead.contactPerson.email];
    }
    
    initializeComposeEmail(thread?.id, email.subject, replyTo, replyCc);
  };

  // Sync emails from Gmail mutation
  const syncEmailsMutation = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/crm/leads/${lead?.id}/emails/sync`, {
        method: 'POST',
      });
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/crm/leads', lead?.id, 'emails'] });
      queryClient.invalidateQueries({ queryKey: ['/api/crm/leads', lead?.id, 'activities'] });
      setLastSyncTime(new Date());
      const newMessages = data?.newMessages || 0;
      if (newMessages > 0) {
        toast({
          title: "New Emails Found",
          description: `${newMessages} new email${newMessages > 1 ? 's' : ''} synced from Gmail`,
        });
      } else {
        toast({
          title: "Sync Complete",
          description: "No new replies found",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Sync Failed",
        description: error.message || "Failed to sync emails from Gmail",
        variant: "destructive",
      });
    },
  });

  // Mutation to mark emails as read
  const markEmailsReadMutation = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/crm/leads/${lead?.id}/emails/mark-read`, {
        method: 'POST',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/crm/leads'] });
    },
  });

  // Auto-sync emails when switching to email tab (once per dialog open)
  useEffect(() => {
    if (activeTab === 'emails' && emailConfig?.isConnected && !hasAutoSynced && lead?.id && emailThreads.length > 0) {
      setHasAutoSynced(true);
      syncEmailsMutation.mutate();
    }
    // Mark emails as read when viewing the email tab
    if (activeTab === 'emails' && lead?.id) {
      markEmailsReadMutation.mutate();
    }
  }, [activeTab, emailConfig?.isConnected, hasAutoSynced, lead?.id, emailThreads.length]);

  // Reset auto-sync flag when dialog closes
  useEffect(() => {
    if (!open) {
      setHasAutoSynced(false);
      setLastSyncTime(null);
    }
  }, [open]);

  // Sample Request creation mutation
  const createSampleRequestMutation = useMutation({
    mutationFn: async (data: typeof sampleFormData) => {
      return apiRequest(`/api/crm/leads/${lead?.id}/sample-requests`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/crm/leads', lead?.id, 'sample-requests'] });
      queryClient.invalidateQueries({ queryKey: ['/api/crm/leads', lead?.id, 'activities'] });
      setShowSampleRequestForm(false);
      resetSampleFormData();
      toast({
        title: "Sample Request Created",
        description: "The sample request has been created successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create sample request",
        variant: "destructive",
      });
    },
  });

  // Initialize sample form with lead data
  const initializeSampleForm = (selectedProductId?: number) => {
    setSampleFormData({
      contactName: lead?.contactPerson || "",
      companyName: lead?.companyName || "",
      phoneNumber: lead?.phoneNumber || "",
      emailAddress: lead?.email || "",
      productId: selectedProductId || (products.length === 1 ? products[0].id : 0),
      sampleSize: "50g",
      purpose: "",
      expectedOrderQuantity: lead?.requiredQuantity?.toString() || "",
      message: "",
      shippingAddress: lead?.address || "",
      city: lead?.city || "",
      state: lead?.region || "",
      postalCode: lead?.postalCode || "",
      country: lead?.country || "United States",
    });
    setShowSampleRequestForm(true);
  };

  const resetSampleFormData = () => {
    setSampleFormData({
      contactName: "",
      companyName: "",
      phoneNumber: "",
      emailAddress: "",
      productId: 0,
      sampleSize: "50g",
      purpose: "",
      expectedOrderQuantity: "",
      message: "",
      shippingAddress: "",
      city: "",
      state: "",
      postalCode: "",
      country: "United States",
    });
  };

  const handleSampleFormSubmit = () => {
    const requiredFields = ['contactName', 'companyName', 'phoneNumber', 'emailAddress', 'purpose', 'shippingAddress', 'city', 'state', 'postalCode', 'country'];
    const missingFields = requiredFields.filter(field => !sampleFormData[field as keyof typeof sampleFormData]);
    
    if (missingFields.length > 0) {
      toast({
        title: "Missing Required Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }
    
    if (!sampleFormData.productId) {
      toast({
        title: "Product Required",
        description: "Please select a product for the sample request.",
        variant: "destructive",
      });
      return;
    }
    
    createSampleRequestMutation.mutate(sampleFormData);
  };

  const uploadAttachment = async (file: File): Promise<string | null> => {
    try {
      // Upload file through server (avoids CORS issues with direct GCS upload)
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/email-attachments/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Upload failed');
      }
      
      const result = await response.json();
      return result.fileUrl;
    } catch (error) {
      console.error('Error uploading attachment:', error);
      return null;
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newAttachments: EmailAttachment[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 25 * 1024 * 1024) { // 25MB limit
        toast({
          title: "File Too Large",
          description: `${file.name} exceeds 25MB limit.`,
          variant: "destructive",
        });
        continue;
      }
      newAttachments.push({
        file,
        name: file.name,
        size: file.size,
        uploading: true,
      });
    }
    
    // Add files with uploading state
    setAttachments([...attachments, ...newAttachments]);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    // Upload each file
    for (let i = 0; i < newAttachments.length; i++) {
      const att = newAttachments[i];
      const uploadedUrl = await uploadAttachment(att.file);
      
      setAttachments(prev => {
        const updated = [...prev];
        const attIndex = updated.findIndex(a => a.file === att.file && a.name === att.name);
        if (attIndex !== -1) {
          if (uploadedUrl) {
            updated[attIndex] = { ...updated[attIndex], uploading: false, uploadedUrl };
          } else {
            // Remove failed upload
            updated.splice(attIndex, 1);
            toast({
              title: "Upload Failed",
              description: `Failed to upload ${att.name}`,
              variant: "destructive",
            });
          }
        }
        return updated;
      });
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getProgressStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'submitted': 'Bid Submitted',
      'manager_approval': 'Manager Approval',
      'sales_discussion': 'Sales Discussion',
      'quotation_sent': 'Quotation Sent',
      'completed': 'Completed',
    };
    return labels[status] || status;
  };

  const getProgressStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'submitted': 'bg-gray-500',
      'manager_approval': 'bg-yellow-500',
      'sales_discussion': 'bg-blue-500',
      'quotation_sent': 'bg-purple-500',
      'completed': 'bg-green-500',
    };
    return colors[status] || 'bg-gray-500';
  };
  
  if (!lead) return null;

  const handleAssignmentChange = (value: string) => {
    setSelectedAssignee(value);
    if (onAssign) {
      onAssign(lead.id, value);
    }
  };

  const formatCurrency = (amount: number | string | null) => {
    if (!amount) return "$0";
    const num = typeof amount === "string" ? parseFloat(amount) : amount;
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(num);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "hot": return "bg-red-500 text-white";
      case "warm": return "bg-orange-500 text-white";
      case "cold": return "bg-blue-500 text-white";
      default: return "bg-gray-500 text-white";
    }
  };

  const formatStageName = (stage: string) => {
    return stage.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div className="flex-1">
              <DialogTitle className="text-lg sm:text-2xl">
                {lead.company?.companyName || "Unknown Company"}
              </DialogTitle>
              <DialogDescription className="text-sm">
                {lead.leadId} • Created {lead.createdAt ? format(new Date(lead.createdAt), 'MMM d, yyyy') : 'N/A'}
              </DialogDescription>
              {/* Prominent Lead Source Badge */}
              {lead.leadSource === 'high_volume_bid' && (
                <div className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 bg-blue-100 border-2 border-blue-300 rounded-md">
                  <DollarSign className="w-4 h-4 text-blue-700" />
                  <span className="text-sm font-semibold text-blue-800">High Volume Bid</span>
                </div>
              )}
              {lead.leadSource === 'product_inquiry' && (
                <div className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 bg-green-100 border-2 border-green-300 rounded-md">
                  <Package className="w-4 h-4 text-green-700" />
                  <span className="text-sm font-semibold text-green-800">Regular Enquiry</span>
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge className={`text-xs ${getPriorityColor(lead.priority || "warm")}`}>
                {lead.priority || "warm"}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {lead.currentStage ? formatStageName(lead.currentStage) : 'N/A'}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className={`grid w-full h-auto ${isFromInquiry ? 'grid-cols-7' : 'grid-cols-6'}`}>
            <TabsTrigger value="overview" className="text-xs sm:text-sm py-2">Overview</TabsTrigger>
            <TabsTrigger value="activity" className="text-xs sm:text-sm py-2">Activity</TabsTrigger>
            <TabsTrigger value="products" className="text-xs sm:text-sm py-2">Products</TabsTrigger>
            <TabsTrigger value="samples" className="text-xs sm:text-sm py-2">
              <Package className="h-3 w-3 mr-1" />
              Samples
            </TabsTrigger>
            <TabsTrigger value="quotes" className="text-xs sm:text-sm py-2">
              <FileText className="h-3 w-3 mr-1" />
              Quotes
            </TabsTrigger>
            <TabsTrigger value="emails" className="text-xs sm:text-sm py-2">
              <Mail className="h-3 w-3 mr-1" />
              Emails
            </TabsTrigger>
            {isFromInquiry && (
              <TabsTrigger value="bid-details" className="text-xs sm:text-sm py-2">
                {lead.leadSource === 'high_volume_bid' ? 'Bid Details' : 'Inquiry Details'}
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Company Information */}
            <Card>
              <CardContent className="p-4 sm:p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Company Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Company Name</p>
                    <p className="font-medium">{lead.company?.companyName || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Industry</p>
                    <p className="font-medium">{lead.company?.industryType || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Website</p>
                    <p className="font-medium text-blue-600">
                      {lead.company?.website ? (
                        <a href={lead.company.website} target="_blank" rel="noopener noreferrer">
                          {lead.company.website}
                        </a>
                      ) : "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Industry</p>
                    <p className="font-medium">{lead.company?.industryType || "N/A"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardContent className="p-4 sm:p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Primary Contact
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Contact Name</p>
                    <p className="font-medium">{lead.contactPerson?.contactName || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Designation</p>
                    <p className="font-medium">{lead.contactPerson?.designation || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium">
                      {lead.contactPerson?.email ? (
                        <a href={`mailto:${lead.contactPerson.email}`} className="text-blue-600">
                          {lead.contactPerson.email}
                        </a>
                      ) : "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="font-medium">
                      {lead.contactPerson?.phone ? (
                        <a href={`tel:${lead.contactPerson.countryCode}${lead.contactPerson.phone}`} className="text-blue-600">
                          {lead.contactPerson.countryCode && !lead.contactPerson.countryCode.startsWith('+') ? '+' : ''}{lead.contactPerson.countryCode} {lead.contactPerson.phone}
                        </a>
                      ) : "N/A"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Deal Information */}
            <Card>
              <CardContent className="p-4 sm:p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Deal Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Expected Order Value</p>
                    <p className="font-medium text-lg">{formatCurrency(lead.expectedOrderValue)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Buying Timeline</p>
                    <p className="font-medium">{lead.buyingTimeline || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Lead Source</p>
                    <p className="font-medium">{lead.leadSource || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Days in Current Stage</p>
                    <p className="font-medium">{lead.daysInCurrentStage || 0} days</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Sales Team & Assignment */}
            <Card>
              <CardContent className="p-4 sm:p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Sales Team & Assignment
                </h3>
                <div className="space-y-4">
                  {/* Current Assignment */}
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Currently Assigned To</p>
                    {lead.salesRep ? (
                      <p className="font-medium">
                        {lead.salesRep.firstName} {lead.salesRep.lastName}
                      </p>
                    ) : (
                      <p className="text-gray-400 italic">Unassigned</p>
                    )}
                  </div>
                  
                  {/* Assignment Dropdown (Only for admins/managers) */}
                  {canAssignLeads && salesReps.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-500 mb-2">Change Assignment</p>
                      <div className="flex gap-2 items-center">
                        <Select value={selectedAssignee} onValueChange={handleAssignmentChange}>
                          <SelectTrigger className="w-full" data-testid="select-assign-lead">
                            <SelectValue placeholder="Select sales rep..." />
                          </SelectTrigger>
                          <SelectContent>
                            {salesReps.map((rep: any) => (
                              <SelectItem key={rep.id} value={rep.id}>
                                {rep.firstName} {rep.lastName} ({rep.email})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Select a sales representative to assign this lead
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Special Requirements */}
            {lead.specialRequirements && (
              <Card>
                <CardContent className="p-4 sm:p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Special Requirements
                  </h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{lead.specialRequirements}</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            <ActivityTimeline 
              leadId={lead.id} 
              onViewEmail={() => setActiveTab("email")} 
            />
          </TabsContent>

          <TabsContent value="products" className="space-y-4">
            {productsLoading ? (
              <Card>
                <CardContent className="p-4 sm:p-6">
                  <p className="text-gray-500">Loading products...</p>
                </CardContent>
              </Card>
            ) : productIds.length === 0 ? (
              <Card>
                <CardContent className="p-4 sm:p-6">
                  <p className="text-gray-500">No products associated with this lead</p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Product Cards */}
                <div className="grid gap-4">
                  {products.map((product) => (
                    <Card key={product.id} data-testid={`product-card-${product.id}`}>
                      <CardContent className="p-4 sm:p-6">
                        <div className="flex flex-col sm:flex-row gap-4">
                          {/* Product Image */}
                          {product.mainImage && (
                            <div className="w-full sm:w-24 h-32 sm:h-24 rounded-md overflow-hidden flex-shrink-0 bg-gray-100">
                              <img 
                                src={product.mainImage} 
                                alt={product.name}
                                className="w-full h-full object-cover"
                                data-testid={`product-image-${product.id}`}
                              />
                            </div>
                          )}
                          
                          {/* Product Details */}
                          <div className="flex-1">
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                              <div>
                                <h4 className="font-semibold text-base sm:text-lg" data-testid={`product-name-${product.id}`}>
                                  {product.name}
                                </h4>
                                <p className="text-xs sm:text-sm text-gray-500" data-testid={`product-id-${product.id}`}>
                                  SKU: {product.productId}
                                </p>
                              </div>
                              <Badge variant="outline" className="text-xs w-fit" data-testid={`product-status-${product.id}`}>
                                {product.status || 'Active'}
                              </Badge>
                            </div>

                            {/* Product Info Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                              {lead.requiredQuantity && (
                                <div>
                                  <p className="text-xs text-gray-500">Required Quantity</p>
                                  <p className="font-medium" data-testid={`product-quantity-${product.id}`}>
                                    {lead.requiredQuantity} {lead.unit || 'units'}
                                  </p>
                                </div>
                              )}
                              
                              {product.moq && (
                                <div>
                                  <p className="text-xs text-gray-500">MOQ</p>
                                  <p className="font-medium">{product.moq}</p>
                                </div>
                              )}
                              
                              {product.packingSize && (
                                <div>
                                  <p className="text-xs text-gray-500">Packing Size</p>
                                  <p className="font-medium">{product.packingSize}</p>
                                </div>
                              )}
                              
                              {product.leadTime && (
                                <div>
                                  <p className="text-xs text-gray-500">Lead Time</p>
                                  <p className="font-medium">{product.leadTime}</p>
                                </div>
                              )}
                            </div>

                            {/* Product Description */}
                            {product.description && (
                              <div className="mt-3">
                                <p className="text-sm text-gray-600 line-clamp-2">
                                  {product.description}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Deal Summary */}
                <Card>
                  <CardContent className="p-4 sm:p-6">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Deal Summary
                    </h3>
                    <div className="space-y-3">
                      {lead.requiredQuantity && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Total Quantity</span>
                          <span className="font-medium" data-testid="deal-total-quantity">
                            {lead.requiredQuantity} {lead.unit || 'units'}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between items-center border-t pt-3">
                        <span className="font-semibold">Expected Order Value</span>
                        <span className="font-bold text-lg" data-testid="deal-expected-value">
                          {formatCurrency(lead.expectedOrderValue)}
                        </span>
                      </div>
                      {!lead.expectedOrderValue && (
                        <p className="text-sm text-gray-500 italic">
                          Price pending - quotation in progress
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Special Requirements */}
                {lead.specialRequirements && (
                  <Card>
                    <CardContent className="p-4 sm:p-6">
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Additional Details
                      </h3>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap" data-testid="product-special-requirements">
                        {lead.specialRequirements}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>

          {/* Samples Tab */}
          <TabsContent value="samples" className="space-y-4">
            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Sample Requests
                  </h3>
                  <Button 
                    size="sm" 
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    data-testid="button-create-sample-request"
                    onClick={() => initializeSampleForm()}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Create Sample Request
                  </Button>
                </div>

                {/* Sample Request Form */}
                {showSampleRequestForm && (
                  <Card className="mb-4 border-2 border-blue-200 bg-blue-50">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="font-medium flex items-center gap-2 text-blue-800">
                          <Package className="h-4 w-4" />
                          New Sample Request
                        </h4>
                        <Button variant="ghost" size="sm" onClick={() => setShowSampleRequestForm(false)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Product Selection */}
                        <div className="md:col-span-2">
                          <Label htmlFor="sample-product">Product *</Label>
                          <Select
                            value={sampleFormData.productId.toString()}
                            onValueChange={(value) => setSampleFormData({...sampleFormData, productId: parseInt(value)})}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select a product" />
                            </SelectTrigger>
                            <SelectContent>
                              {products.length > 0 ? (
                                products.map((product) => (
                                  <SelectItem key={product.id} value={product.id.toString()}>
                                    {product.name} ({product.productId})
                                  </SelectItem>
                                ))
                              ) : (
                                <SelectItem value="0" disabled>No products available</SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        {/* Sample Details */}
                        <div>
                          <Label htmlFor="sample-size">Sample Size</Label>
                          <Select
                            value={sampleFormData.sampleSize}
                            onValueChange={(value) => setSampleFormData({...sampleFormData, sampleSize: value})}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="25g">25 grams (Small)</SelectItem>
                              <SelectItem value="50g">50 grams (Standard)</SelectItem>
                              <SelectItem value="100g">100 grams (Large)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label htmlFor="sample-purpose">Purpose *</Label>
                          <Select
                            value={sampleFormData.purpose}
                            onValueChange={(value) => setSampleFormData({...sampleFormData, purpose: value})}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select purpose" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="testing">Quality Testing</SelectItem>
                              <SelectItem value="analysis">Lab Analysis</SelectItem>
                              <SelectItem value="product_development">Product Development</SelectItem>
                              <SelectItem value="evaluation">Product Evaluation</SelectItem>
                              <SelectItem value="bulk_order">Bulk Order Consideration</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label htmlFor="expected-qty">Expected Order Quantity</Label>
                          <Input
                            id="expected-qty"
                            value={sampleFormData.expectedOrderQuantity}
                            onChange={(e) => setSampleFormData({...sampleFormData, expectedOrderQuantity: e.target.value})}
                            placeholder="e.g., 500 kg"
                          />
                        </div>
                        
                        {/* Contact Information */}
                        <div className="md:col-span-2 border-t pt-4 mt-2">
                          <h5 className="font-medium mb-3">Contact Information</h5>
                        </div>
                        
                        <div>
                          <Label htmlFor="contact-name">Contact Name *</Label>
                          <Input
                            id="contact-name"
                            value={sampleFormData.contactName}
                            onChange={(e) => setSampleFormData({...sampleFormData, contactName: e.target.value})}
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="company-name">Company Name *</Label>
                          <Input
                            id="company-name"
                            value={sampleFormData.companyName}
                            onChange={(e) => setSampleFormData({...sampleFormData, companyName: e.target.value})}
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="phone">Phone Number *</Label>
                          <Input
                            id="phone"
                            value={sampleFormData.phoneNumber}
                            onChange={(e) => setSampleFormData({...sampleFormData, phoneNumber: e.target.value})}
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="email">Email Address *</Label>
                          <Input
                            id="email"
                            type="email"
                            value={sampleFormData.emailAddress}
                            onChange={(e) => setSampleFormData({...sampleFormData, emailAddress: e.target.value})}
                          />
                        </div>
                        
                        {/* Shipping Details */}
                        <div className="md:col-span-2 border-t pt-4 mt-2">
                          <h5 className="font-medium mb-3">Shipping Address</h5>
                        </div>
                        
                        <div className="md:col-span-2">
                          <Label htmlFor="shipping-address">Street Address *</Label>
                          <Input
                            id="shipping-address"
                            value={sampleFormData.shippingAddress}
                            onChange={(e) => setSampleFormData({...sampleFormData, shippingAddress: e.target.value})}
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="city">City *</Label>
                          <Input
                            id="city"
                            value={sampleFormData.city}
                            onChange={(e) => setSampleFormData({...sampleFormData, city: e.target.value})}
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="state">State/Province *</Label>
                          <Input
                            id="state"
                            value={sampleFormData.state}
                            onChange={(e) => setSampleFormData({...sampleFormData, state: e.target.value})}
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="postal-code">Postal Code *</Label>
                          <Input
                            id="postal-code"
                            value={sampleFormData.postalCode}
                            onChange={(e) => setSampleFormData({...sampleFormData, postalCode: e.target.value})}
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="country">Country *</Label>
                          <Input
                            id="country"
                            value={sampleFormData.country}
                            onChange={(e) => setSampleFormData({...sampleFormData, country: e.target.value})}
                          />
                        </div>
                        
                        <div className="md:col-span-2">
                          <Label htmlFor="message">Additional Notes</Label>
                          <Textarea
                            id="message"
                            value={sampleFormData.message}
                            onChange={(e) => setSampleFormData({...sampleFormData, message: e.target.value})}
                            placeholder="Any special requirements or notes..."
                            rows={3}
                          />
                        </div>
                      </div>
                      
                      <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
                        <Button variant="outline" onClick={() => setShowSampleRequestForm(false)}>
                          Cancel
                        </Button>
                        <Button 
                          onClick={handleSampleFormSubmit}
                          disabled={createSampleRequestMutation.isPending}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          {createSampleRequestMutation.isPending ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Creating...
                            </>
                          ) : (
                            <>
                              <Package className="h-4 w-4 mr-2" />
                              Create Sample Request
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {samplesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                    <span className="ml-2 text-gray-500">Loading sample requests...</span>
                  </div>
                ) : sampleRequestsData?.requests && sampleRequestsData.requests.length > 0 ? (
                  <div className="space-y-3">
                    {sampleRequestsData.requests.map((sample: any) => (
                      <div key={sample.id} className="border rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-sm">{sample.requestId}</span>
                              <Badge variant={sample.status === 'pending' ? 'secondary' : sample.status === 'approved' ? 'default' : sample.status === 'shipped' ? 'outline' : 'destructive'}>
                                {sample.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600">
                              {sample.productName || 'Unknown Product'} - {sample.sampleSize}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              Purpose: {sample.purpose}
                            </p>
                          </div>
                          <div className="text-right text-xs text-gray-500">
                            {sample.createdAt && format(new Date(sample.createdAt), 'MMM d, yyyy')}
                          </div>
                        </div>
                        {sample.trackingNumber && (
                          <div className="mt-2 text-sm">
                            <span className="text-gray-500">Tracking:</span>{' '}
                            <span className="font-medium">{sample.trackingNumber}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Package className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>No sample requests yet</p>
                    <p className="text-sm">Click "Create Sample Request" to add one</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Quotes Tab */}
          <TabsContent value="quotes" className="space-y-4">
            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Quotations
                  </h3>
                  <Button 
                    size="sm" 
                    className="bg-green-600 hover:bg-green-700 text-white"
                    data-testid="button-create-quotation"
                    onClick={() => {
                      toast({
                        title: "Coming Soon",
                        description: "Quotation creation form will be available soon.",
                      });
                    }}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Create Quote
                  </Button>
                </div>

                {quotationsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-green-600" />
                    <span className="ml-2 text-gray-500">Loading quotations...</span>
                  </div>
                ) : quotationsData?.quotations && quotationsData.quotations.length > 0 ? (
                  <div className="space-y-3">
                    {quotationsData.quotations.map((quote: any) => (
                      <div key={quote.id} className="border rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-sm">{quote.quotationId}</span>
                              <Badge variant={
                                quote.status === 'draft' ? 'secondary' : 
                                quote.status === 'sent' ? 'default' : 
                                quote.status === 'accepted' ? 'outline' : 
                                quote.status === 'rejected' ? 'destructive' : 'secondary'
                              }>
                                {quote.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600">
                              {quote.productName || 'Multiple Products'}
                            </p>
                            <p className="text-lg font-semibold text-green-700 mt-1">
                              {quote.currency || 'USD'} {parseFloat(quote.totalAmount || 0).toLocaleString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-gray-500">
                              {quote.createdAt && format(new Date(quote.createdAt), 'MMM d, yyyy')}
                            </div>
                            {quote.validUntil && (
                              <div className="text-xs text-gray-500 mt-1">
                                Valid until: {format(new Date(quote.validUntil), 'MMM d, yyyy')}
                              </div>
                            )}
                            {quote.status === 'draft' && (
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="mt-2"
                                onClick={() => {
                                  toast({
                                    title: "Coming Soon",
                                    description: "Send quotation feature will be available soon.",
                                  });
                                }}
                                data-testid="button-send-quotation"
                              >
                                <Send className="h-3 w-3 mr-1" />
                                Send to Customer
                              </Button>
                            )}
                            {quote.sentAt && (
                              <div className="text-xs text-green-600 mt-1">
                                Sent: {format(new Date(quote.sentAt), 'MMM d, yyyy h:mm a')}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>No quotations yet</p>
                    <p className="text-sm">Click "Create Quote" to add one</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Emails Tab */}
          <TabsContent value="emails" className="space-y-4">
            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Inbox className="h-4 w-4" />
                    Email Communication
                  </h3>
                  <Button 
                    size="sm" 
                    onClick={() => {
                      setIsNewThread(true);
                      setReplyToThreadId(null);
                      initializeComposeEmail();
                    }}
                    disabled={!emailConfig}
                    className="bg-green-600 hover:bg-green-700 text-white"
                    data-testid="button-compose-email"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Start New Thread
                  </Button>
                </div>

                {!emailConfig && (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md mb-4">
                    <p className="text-sm text-yellow-800">
                      Email sending is not configured for your account. Please contact an administrator to set up your company email.
                    </p>
                  </div>
                )}

                {showComposeEmail && (
                  <Card className="mb-4 border-2 border-blue-200">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-medium flex items-center gap-2">
                          {isNewThread ? (
                            <>
                              <Plus className="h-4 w-4 text-blue-600" />
                              New Email Thread
                            </>
                          ) : (
                            <>
                              <Reply className="h-4 w-4 text-blue-600" />
                              Reply to Thread
                            </>
                          )}
                        </h4>
                        {emailThreads.length > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setIsNewThread(!isNewThread);
                              if (isNewThread) {
                                // Switching to reply mode - use the first thread
                                const firstThread = emailThreads[0] as any;
                                if (firstThread?.messages?.[0]) {
                                  const lastMessage = firstThread.messages[firstThread.messages.length - 1];
                                  setReplyToThreadId(firstThread.id);
                                  setEmailSubject(`Re: ${firstThread.subject || lastMessage.subject}`);
                                  
                                  // Auto-populate recipients from the last message
                                  const ourEmail = emailConfig?.companyEmail?.toLowerCase();
                                  if (lastMessage.direction === 'outbound') {
                                    // We sent the last email, reply to same recipients
                                    const toEmails = (lastMessage.toEmails || []).filter((e: string) => e && e.toLowerCase() !== ourEmail);
                                    if (toEmails.length > 0) setEmailTo(toEmails);
                                  } else {
                                    // We received the last email, reply to sender
                                    if (lastMessage.fromEmail) setEmailTo([lastMessage.fromEmail]);
                                  }
                                  // Include CC recipients
                                  const ccEmails = (lastMessage.ccEmails || []).filter((e: string) => e && e.toLowerCase() !== ourEmail);
                                  setEmailCc(ccEmails);
                                }
                              } else {
                                // Switching to new thread mode - clear recipients
                                setReplyToThreadId(null);
                                setEmailSubject("");
                                if (lead?.contactPerson?.email) {
                                  setEmailTo([lead.contactPerson.email]);
                                } else {
                                  setEmailTo([]);
                                }
                                setEmailCc([]);
                              }
                            }}
                            data-testid="button-toggle-thread"
                          >
                            {isNewThread ? "Reply to existing thread" : "Start new thread"}
                          </Button>
                        )}
                      </div>
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <Label htmlFor="email-to">To</Label>
                            <Input
                              id="email-to"
                              value={emailTo.join(', ')}
                              onChange={(e) => setEmailTo(e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                              placeholder="recipient@example.com"
                              data-testid="input-email-to"
                            />
                          </div>
                          <div>
                            <Label htmlFor="email-cc">CC (optional)</Label>
                            <Input
                              id="email-cc"
                              value={emailCc.join(', ')}
                              onChange={(e) => setEmailCc(e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                              placeholder="cc@example.com"
                              data-testid="input-email-cc"
                            />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="email-subject">Subject</Label>
                          <Input
                            id="email-subject"
                            value={emailSubject}
                            onChange={(e) => setEmailSubject(e.target.value)}
                            placeholder="Email subject"
                            data-testid="input-email-subject"
                          />
                        </div>
                        <div>
                          <Label>Message</Label>
                          <RichTextEditor
                            content={emailBody}
                            onChange={setEmailBody}
                            placeholder="Write your email here... Use the toolbar above for formatting."
                            minHeight="180px"
                            onImageDrop={async (file) => {
                              const imageUrl = await uploadAttachment(file);
                              return imageUrl;
                            }}
                          />
                        </div>

                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <input
                              ref={fileInputRef}
                              type="file"
                              multiple
                              onChange={handleFileSelect}
                              className="hidden"
                              id="email-attachments"
                              data-testid="input-email-attachments"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => fileInputRef.current?.click()}
                              data-testid="button-attach-file"
                            >
                              <Paperclip className="h-4 w-4 mr-1" />
                              Attach Files
                            </Button>
                            <span className="text-xs text-gray-500">Max 25MB per file</span>
                          </div>

                          {attachments.length > 0 && (
                            <div className="flex flex-wrap gap-2 p-2 bg-gray-50 rounded-md">
                              {attachments.map((att, index) => (
                                <div
                                  key={index}
                                  className={`flex items-center gap-2 px-2 py-1 bg-white border rounded-md text-sm ${att.uploading ? 'opacity-60' : ''}`}
                                  data-testid={`attachment-item-${index}`}
                                >
                                  {att.uploading ? (
                                    <Loader2 className="h-3 w-3 text-blue-500 animate-spin" />
                                  ) : att.uploadedUrl ? (
                                    <CheckCircle className="h-3 w-3 text-green-500" />
                                  ) : (
                                    <Paperclip className="h-3 w-3 text-gray-400" />
                                  )}
                                  <span className="max-w-[150px] truncate">{att.name}</span>
                                  <span className="text-xs text-gray-500">({formatFileSize(att.size)})</span>
                                  <button
                                    type="button"
                                    onClick={() => removeAttachment(index)}
                                    className="text-gray-400 hover:text-red-500"
                                    data-testid={`button-remove-attachment-${index}`}
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2 justify-end pt-2 border-t">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={resetEmailForm}
                            data-testid="button-cancel-email"
                          >
                            Cancel
                          </Button>
                          <Button 
                            size="sm" 
                            onClick={handleSendEmail}
                            disabled={sendEmailMutation.isPending || attachments.some(a => a.uploading)}
                            data-testid="button-send-email"
                          >
                            {sendEmailMutation.isPending ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                Sending...
                              </>
                            ) : (
                              <>
                                <Send className="h-4 w-4 mr-1" />
                                Send Email
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Email History Header with Sync Button */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-medium text-gray-600">Email History</h4>
                    {lastSyncTime && (
                      <span className="text-xs text-gray-400">
                        Last synced: {formatDistanceToNow(lastSyncTime, { addSuffix: true })}
                      </span>
                    )}
                  </div>
                  {emailConfig?.isConnected && emailThreads.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => syncEmailsMutation.mutate()}
                      disabled={syncEmailsMutation.isPending}
                      className="bg-green-50 border-green-200 hover:bg-green-100 text-green-700"
                      data-testid="button-sync-emails"
                    >
                      {syncEmailsMutation.isPending ? (
                        <>
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          Checking for replies...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-3 w-3 mr-1" />
                          Check for New Replies
                        </>
                      )}
                    </Button>
                  )}
                </div>

                {/* Email Threads - Visual Legend */}
                {emailThreads.length > 1 && (
                  <div className="flex items-center gap-4 text-xs text-gray-500 mb-2 px-2">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-green-500"></span> Active
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-orange-500"></span> Needs Reply
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-gray-400"></span> Idle (72h+)
                    </span>
                  </div>
                )}

                {/* Email Messages */}
                <div className="space-y-4">
                  {emailsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                      <span className="ml-2 text-gray-500">Loading emails...</span>
                    </div>
                  ) : emailThreads.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Mail className="h-12 w-12 mx-auto mb-2 opacity-30" />
                      <p>No emails yet</p>
                      <p className="text-sm">Start a conversation by composing an email</p>
                    </div>
                  ) : (
                    emailThreads.map((thread: any, threadIndex: number) => {
                      // Sort messages chronologically (oldest first)
                      const sortedMessages = [...(thread.messages || [])].sort((a: any, b: any) => {
                        const dateA = new Date(a.sentAt || a.receivedAt || 0).getTime();
                        const dateB = new Date(b.sentAt || b.receivedAt || 0).getTime();
                        return dateA - dateB;
                      });
                      
                      // Determine thread age/status for coloring
                      const lastMessage = sortedMessages[sortedMessages.length - 1];
                      const lastMessageDate = lastMessage ? new Date(lastMessage.sentAt || lastMessage.receivedAt || 0) : new Date(thread.createdAt || 0);
                      const hoursSinceLastMessage = (Date.now() - lastMessageDate.getTime()) / (1000 * 60 * 60);
                      const hasInboundMessages = sortedMessages.some((m: any) => m.direction === 'inbound');
                      
                      // Color palette for thread distinction
                      const threadColors = [
                        { border: 'border-l-blue-500', bg: 'bg-blue-50', headerBg: 'bg-blue-100', badge: 'bg-blue-100 text-blue-700' },
                        { border: 'border-l-purple-500', bg: 'bg-purple-50', headerBg: 'bg-purple-100', badge: 'bg-purple-100 text-purple-700' },
                        { border: 'border-l-emerald-500', bg: 'bg-emerald-50', headerBg: 'bg-emerald-100', badge: 'bg-emerald-100 text-emerald-700' },
                        { border: 'border-l-amber-500', bg: 'bg-amber-50', headerBg: 'bg-amber-100', badge: 'bg-amber-100 text-amber-700' },
                        { border: 'border-l-rose-500', bg: 'bg-rose-50', headerBg: 'bg-rose-100', badge: 'bg-rose-100 text-rose-700' },
                        { border: 'border-l-cyan-500', bg: 'bg-cyan-50', headerBg: 'bg-cyan-100', badge: 'bg-cyan-100 text-cyan-700' },
                        { border: 'border-l-indigo-500', bg: 'bg-indigo-50', headerBg: 'bg-indigo-100', badge: 'bg-indigo-100 text-indigo-700' },
                        { border: 'border-l-teal-500', bg: 'bg-teal-50', headerBg: 'bg-teal-100', badge: 'bg-teal-100 text-teal-700' },
                      ];
                      const colorScheme = threadColors[threadIndex % threadColors.length];
                      
                      // Determine status label
                      let statusLabel = 'Active';
                      let statusColor = 'bg-green-100 text-green-700';
                      if (hoursSinceLastMessage > 72) {
                        statusLabel = 'Idle';
                        statusColor = 'bg-gray-100 text-gray-600';
                      } else if (hasInboundMessages && lastMessage?.direction === 'inbound') {
                        statusLabel = 'Needs Reply';
                        statusColor = 'bg-orange-100 text-orange-700';
                      }
                      
                      return (
                        <div 
                          key={thread.id} 
                          className={`border rounded-lg overflow-hidden border-l-4 ${colorScheme.border} shadow-sm hover:shadow-md transition-shadow`} 
                          data-testid={`email-thread-${thread.id}`}
                        >
                          {/* Thread Header with Color Coding */}
                          <div className={`${colorScheme.headerBg} px-4 py-3 flex justify-between items-center border-b`}>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${colorScheme.badge}`}>
                                {threadIndex + 1}
                              </span>
                              <Mail className="h-4 w-4 text-gray-600" />
                              <span className="font-medium text-sm">{thread.subject || 'No Subject'}</span>
                              <Badge className={`text-xs ${colorScheme.badge} border-0`}>
                                {sortedMessages.length} {sortedMessages.length === 1 ? 'message' : 'messages'}
                              </Badge>
                              <Badge className={`text-xs ${statusColor} border-0`}>
                                {statusLabel}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500">
                                Last: {format(lastMessageDate, 'MMM d, h:mm a')}
                              </span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedThread({ ...thread, messages: sortedMessages });
                                  setShowThreadView(true);
                                }}
                                data-testid={`button-view-thread-${thread.id}`}
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                View Thread
                              </Button>
                            </div>
                          </div>
                          
                          {/* Thread Messages */}
                          <div className="divide-y">
                            {sortedMessages.map((email: any) => (
                              <div 
                                key={email.id} 
                                className={`p-4 ${
                                  email.direction === 'outbound' 
                                    ? 'bg-blue-50' 
                                    : 'bg-white'
                                }`}
                                data-testid={`email-message-${email.id}`}
                              >
                                <div className="flex justify-between items-start mb-2">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    {email.direction === 'outbound' ? (
                                      <Send className="h-4 w-4 text-blue-600" />
                                    ) : (
                                      <Reply className="h-4 w-4 text-gray-600" />
                                    )}
                                    <span className="font-medium text-sm">
                                      {email.direction === 'outbound' ? 'Sent' : 'Received'}
                                    </span>
                                    <Badge variant={email.direction === 'outbound' ? 'default' : 'secondary'} className="text-xs">
                                      {email.fromEmail}
                                    </Badge>
                                  </div>
                                  <span className="text-xs text-gray-500 whitespace-nowrap">
                                    {email.sentAt 
                                      ? format(new Date(email.sentAt), 'MMM d, yyyy h:mm a')
                                      : email.receivedAt 
                                        ? format(new Date(email.receivedAt), 'MMM d, yyyy h:mm a')
                                        : 'N/A'}
                                  </span>
                                </div>
                                <p className="font-medium text-sm mb-1">{email.subject}</p>
                                {email.toEmails?.length > 0 && (
                                  <p className="text-xs text-gray-500 mb-2">
                                    To: {email.toEmails.join(', ')}
                                  </p>
                                )}
                                <div 
                                  className="text-sm text-gray-700 line-clamp-3"
                                  dangerouslySetInnerHTML={{ 
                                    __html: email.bodyText || email.bodyHtml?.replace(/<[^>]*>/g, '') || '' 
                                  }}
                                />
                                
                                <div className="flex gap-2 mt-3 pt-2 border-t border-gray-200">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedEmail(email);
                                      setShowEmailView(true);
                                    }}
                                    data-testid={`button-view-email-${email.id}`}
                                  >
                                    <Eye className="h-3 w-3 mr-1" />
                                    View Complete Email
                                  </Button>
                                  {emailConfig && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleReplyToEmail(email)}
                                      data-testid={`button-reply-email-${email.id}`}
                                    >
                                      <Reply className="h-3 w-3 mr-1" />
                                      Reply
                                    </Button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <EmailViewDialog
            email={selectedEmail}
            open={showEmailView}
            onOpenChange={setShowEmailView}
            onReply={(email) => handleReplyToEmail(email)}
          />

          {/* Thread View Dialog */}
          <Dialog open={showThreadView} onOpenChange={setShowThreadView}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Email Thread: {selectedThread?.subject || 'No Subject'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                {selectedThread?.messages?.map((email: any, index: number) => (
                  <div 
                    key={email.id}
                    className={`p-4 rounded-lg border ${
                      email.direction === 'outbound' 
                        ? 'bg-blue-50 border-blue-200' 
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="text-xs">
                          #{index + 1}
                        </Badge>
                        {email.direction === 'outbound' ? (
                          <Send className="h-4 w-4 text-blue-600" />
                        ) : (
                          <Reply className="h-4 w-4 text-gray-600" />
                        )}
                        <span className="font-medium">
                          {email.direction === 'outbound' ? 'Sent' : 'Received'}
                        </span>
                        <Badge variant={email.direction === 'outbound' ? 'default' : 'secondary'}>
                          {email.fromEmail}
                        </Badge>
                      </div>
                      <span className="text-sm text-gray-500">
                        {email.sentAt 
                          ? format(new Date(email.sentAt), 'MMM d, yyyy h:mm a')
                          : email.receivedAt 
                            ? format(new Date(email.receivedAt), 'MMM d, yyyy h:mm a')
                            : 'N/A'}
                      </span>
                    </div>
                    
                    <div className="mb-2">
                      <p className="text-sm"><strong>Subject:</strong> {email.subject}</p>
                      {email.toEmails?.length > 0 && (
                        <p className="text-sm text-gray-600">
                          <strong>To:</strong> {email.toEmails.join(', ')}
                        </p>
                      )}
                      {email.ccEmails?.length > 0 && (
                        <p className="text-sm text-gray-600">
                          <strong>CC:</strong> {email.ccEmails.join(', ')}
                        </p>
                      )}
                    </div>
                    
                    <div 
                      className="prose prose-sm max-w-none mt-3 pt-3 border-t"
                      dangerouslySetInnerHTML={{ __html: email.bodyHtml || email.bodyText || '' }}
                    />
                    
                    {emailConfig && (
                      <div className="mt-3 pt-2 border-t">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setShowThreadView(false);
                            handleReplyToEmail(email);
                          }}
                        >
                          <Reply className="h-3 w-3 mr-1" />
                          Reply to this message
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="flex justify-end mt-4">
                <Button variant="outline" onClick={() => setShowThreadView(false)}>
                  Close
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Bid/Inquiry Details Tab */}
          {isFromInquiry && (
            <TabsContent value="bid-details" className="space-y-4">
              {inquiryLoading ? (
                <Card>
                  <CardContent className="p-6 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                    <span className="ml-2 text-gray-500">Loading inquiry details...</span>
                  </CardContent>
                </Card>
              ) : inquiryData?.inquiry ? (
                <>
                  {/* Original Inquiry/Bid Information */}
                  <Card className={lead.leadSource === 'high_volume_bid' ? 'border-2 border-blue-200' : 'border-2 border-green-200'}>
                    <CardContent className="p-4 sm:p-6">
                      <h3 className="font-semibold mb-4 flex items-center gap-2">
                        {lead.leadSource === 'high_volume_bid' ? (
                          <>
                            <DollarSign className="h-4 w-4 text-blue-600" />
                            <span className="text-blue-800">Original High Volume Bid</span>
                          </>
                        ) : (
                          <>
                            <Package className="h-4 w-4 text-green-600" />
                            <span className="text-green-800">Original Inquiry</span>
                          </>
                        )}
                        <Badge className="ml-2" variant="outline">
                          {inquiryData.inquiry.inquiryId}
                        </Badge>
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Product</p>
                          <p className="font-medium">{inquiryData.inquiry.productName || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Quantity</p>
                          <p className="font-medium">{inquiryData.inquiry.quantity} {inquiryData.inquiry.unit}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Target Price</p>
                          <p className="font-medium text-lg">${inquiryData.inquiry.targetPrice || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Submitted</p>
                          <p className="font-medium">
                            {inquiryData.inquiry.createdAt 
                              ? formatDistanceToNow(new Date(inquiryData.inquiry.createdAt), { addSuffix: true })
                              : 'N/A'}
                          </p>
                        </div>
                      </div>
                      
                      {/* Original Message */}
                      {inquiryData.inquiry.message && (
                        <div className="mt-4 p-3 bg-gray-50 rounded border">
                          <p className="text-xs text-gray-500 mb-1">Customer Message:</p>
                          <p className="text-sm">{inquiryData.inquiry.message}</p>
                        </div>
                      )}
                      
                      {/* Customer Notes */}
                      {inquiryData.inquiry.notes && (
                        <div className="mt-3 p-3 bg-yellow-50 rounded border border-yellow-200">
                          <p className="text-xs text-yellow-700 mb-1">Customer Notes:</p>
                          <p className="text-sm">{inquiryData.inquiry.notes}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Discussion Notes */}
                  {inquiryData.inquiry.discussionNotes && (
                    <Card>
                      <CardContent className="p-4 sm:p-6">
                        <h3 className="font-semibold mb-4 flex items-center gap-2">
                          <MessageSquare className="h-4 w-4" />
                          Discussion Notes
                        </h3>
                        <div className="p-3 bg-purple-50 rounded border border-purple-200">
                          <p className="text-sm whitespace-pre-wrap">{inquiryData.inquiry.discussionNotes}</p>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* High Volume Bid Workflow Management */}
                  {lead.leadSource === 'high_volume_bid' && (
                    <Card className="border-2 border-blue-300 bg-blue-50/30">
                      <CardContent className="p-4 sm:p-6">
                        <h3 className="font-semibold mb-4 flex items-center gap-2 text-blue-800">
                          <ArrowRight className="h-4 w-4" />
                          High Volume Bid Workflow
                        </h3>
                        
                        {/* Current Progress Status */}
                        <div className="mb-4">
                          <p className="text-sm text-gray-600 mb-2">Current Progress:</p>
                          <div className="flex flex-wrap gap-2 mb-3">
                            {['submitted', 'manager_approval', 'sales_discussion', 'quotation_sent', 'completed'].map((status, index) => {
                              const currentStatus = inquiryData.inquiry.bidProgressStatus || 'submitted';
                              const statusOrder = ['submitted', 'manager_approval', 'sales_discussion', 'quotation_sent', 'completed'];
                              const currentIndex = statusOrder.indexOf(currentStatus);
                              const isCompleted = index < currentIndex;
                              const isCurrent = status === currentStatus;
                              
                              return (
                                <div 
                                  key={status}
                                  className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium ${
                                    isCompleted ? 'bg-green-100 text-green-800' :
                                    isCurrent ? 'bg-blue-500 text-white ring-2 ring-blue-300' :
                                    'bg-gray-100 text-gray-500'
                                  }`}
                                >
                                  {isCompleted && <CheckCircle className="w-3 h-3" />}
                                  {getProgressStatusLabel(status)}
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Action Buttons Based on Current Stage */}
                        <div className="border-t pt-4 space-y-4">
                          <p className="text-sm font-medium text-gray-700">Available Actions:</p>
                          
                          {/* Action: Accept Bid - Available until quotation_sent */}
                          {['submitted', 'manager_approval', 'sales_discussion'].includes(inquiryData.inquiry.bidProgressStatus || 'submitted') && (
                            <Button
                              variant="default"
                              className="w-full bg-green-600 hover:bg-green-700"
                              onClick={() => {
                                updateStatusMutation.mutate('completed');
                                toast({
                                  title: "Bid Accepted",
                                  description: "The bid has been accepted and marked as completed.",
                                });
                              }}
                              disabled={updateStatusMutation.isPending}
                              data-testid="btn-accept-bid"
                            >
                              {updateStatusMutation.isPending ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              ) : (
                                <CheckCircle className="w-4 h-4 mr-2" />
                              )}
                              Accept Bid
                            </Button>
                          )}

                          {/* Send Revised Quote Form - Always visible when not completed */}
                          {(inquiryData.inquiry.bidProgressStatus || 'submitted') !== 'completed' && (
                            <div className="space-y-3 p-4 bg-white rounded-lg border">
                              <h4 className="font-medium text-gray-800 flex items-center gap-2">
                                <Send className="w-4 h-4 text-blue-600" />
                                Send Revised Quote
                              </h4>
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <Label htmlFor="revised-amount">Amount *</Label>
                                  <Input
                                    id="revised-amount"
                                    type="number"
                                    step="0.01"
                                    placeholder="Enter amount"
                                    value={revisedAmount}
                                    onChange={(e) => setRevisedAmount(e.target.value)}
                                    data-testid="input-revised-amount"
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="revised-currency">Currency</Label>
                                  <Select value={revisedCurrency} onValueChange={setRevisedCurrency}>
                                    <SelectTrigger data-testid="select-revised-currency">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="USD">USD</SelectItem>
                                      <SelectItem value="EUR">EUR</SelectItem>
                                      <SelectItem value="GBP">GBP</SelectItem>
                                      <SelectItem value="INR">INR</SelectItem>
                                      <SelectItem value="AUD">AUD</SelectItem>
                                      <SelectItem value="CAD">CAD</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                              <div>
                                <Label htmlFor="revised-message">Message to Customer *</Label>
                                <Textarea
                                  id="revised-message"
                                  placeholder="Enter your message to the customer..."
                                  value={revisedMessage}
                                  onChange={(e) => setRevisedMessage(e.target.value)}
                                  rows={3}
                                  data-testid="textarea-revised-message"
                                />
                              </div>
                              <Button
                                className="w-full"
                                onClick={handleSendRevisedQuote}
                                disabled={sendRevisedQuoteMutation.isPending || !revisedAmount || !revisedMessage}
                                data-testid="btn-send-revised-quote"
                              >
                                {sendRevisedQuoteMutation.isPending ? (
                                  <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Sending...
                                  </>
                                ) : (
                                  <>
                                    <Send className="w-4 h-4 mr-2" />
                                    Send Revised Quote
                                  </>
                                )}
                              </Button>
                              <p className="text-xs text-gray-500 text-center">
                                Sending a revised quote will update status to "Quotation Sent"
                              </p>
                            </div>
                          )}

                          {/* Quotation Sent State - Waiting for Customer Response */}
                          {(inquiryData.inquiry.bidProgressStatus) === 'quotation_sent' && (
                            <div className="space-y-4">
                              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                                <div className="flex items-center gap-2 mb-2">
                                  <Clock className="w-5 h-5 text-purple-600" />
                                  <p className="font-medium text-purple-800">Awaiting Customer Response</p>
                                </div>
                                <p className="text-sm text-purple-600">A revised quotation has been sent. Waiting for the customer to accept or reject.</p>
                              </div>
                              
                              {/* Option to send another revised quote if customer rejects */}
                              <div className="border rounded-lg p-4 bg-gray-50">
                                <p className="text-sm font-medium text-gray-700 mb-3">Send Another Revised Quote (if customer rejects):</p>
                                <div className="grid grid-cols-2 gap-2 mb-2">
                                  <div>
                                    <Label htmlFor="revised-amount-alt">Amount *</Label>
                                    <Input
                                      id="revised-amount-alt"
                                      type="number"
                                      placeholder="Enter amount"
                                      value={revisedAmount}
                                      onChange={(e) => setRevisedAmount(e.target.value)}
                                      data-testid="input-revised-amount-alt"
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="revised-currency-alt">Currency</Label>
                                    <Select value={revisedCurrency} onValueChange={setRevisedCurrency}>
                                      <SelectTrigger id="revised-currency-alt" data-testid="select-revised-currency-alt">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="USD">USD</SelectItem>
                                        <SelectItem value="EUR">EUR</SelectItem>
                                        <SelectItem value="GBP">GBP</SelectItem>
                                        <SelectItem value="INR">INR</SelectItem>
                                        <SelectItem value="AUD">AUD</SelectItem>
                                        <SelectItem value="CAD">CAD</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                                <div className="mb-2">
                                  <Label htmlFor="revised-message-alt">Message to Customer *</Label>
                                  <Textarea
                                    id="revised-message-alt"
                                    placeholder="Enter your message to the customer..."
                                    value={revisedMessage}
                                    onChange={(e) => setRevisedMessage(e.target.value)}
                                    rows={2}
                                    data-testid="textarea-revised-message-alt"
                                  />
                                </div>
                                <Button
                                  className="w-full"
                                  variant="outline"
                                  onClick={handleSendRevisedQuote}
                                  disabled={sendRevisedQuoteMutation.isPending || !revisedAmount || !revisedMessage}
                                  data-testid="btn-send-another-quote"
                                >
                                  {sendRevisedQuoteMutation.isPending ? (
                                    <>
                                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                      Sending...
                                    </>
                                  ) : (
                                    <>
                                      <Send className="w-4 h-4 mr-2" />
                                      Send Another Quote
                                    </>
                                  )}
                                </Button>
                              </div>
                            </div>
                          )}

                          {/* Completed State - Deal Won Summary */}
                          {(inquiryData.inquiry.bidProgressStatus) === 'completed' && (() => {
                            // Find the accepted revision with null safety
                            const revisions = inquiryData?.bidRevisions || [];
                            const acceptedRevision = revisions.find((r: any) => r.status === 'accepted');
                            const totalRevisions = revisions.length;
                            const dealAmount = acceptedRevision?.revisedAmount || inquiryData?.inquiry?.estimatedValue || lead?.expectedOrderValue;
                            const dealCurrency = acceptedRevision?.currency || 'USD';
                            const acceptedAt = acceptedRevision?.respondedAt || inquiryData?.inquiry?.bidProgressUpdatedAt;
                            
                            return (
                              <div className="p-5 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border-2 border-green-300 shadow-sm">
                                {/* Header with celebration */}
                                <div className="text-center mb-4">
                                  <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-3">
                                    <CheckCircle className="w-10 h-10 text-green-600" />
                                  </div>
                                  <h3 className="text-xl font-bold text-green-800">Deal Won!</h3>
                                  <p className="text-sm text-green-600">This high volume bid has been successfully completed</p>
                                </div>
                                
                                {/* Deal Summary */}
                                <div className="bg-white rounded-lg p-4 mb-4 border border-green-200">
                                  <h4 className="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wide">Deal Summary</h4>
                                  
                                  {/* Final Amount */}
                                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                                    <span className="text-gray-600 flex items-center gap-2">
                                      <DollarSign className="w-4 h-4" />
                                      Final Deal Value
                                    </span>
                                    <span className="text-2xl font-bold text-green-600">
                                      {dealCurrency} {dealAmount ? parseFloat(dealAmount).toLocaleString(undefined, { minimumFractionDigits: 2 }) : 'N/A'}
                                    </span>
                                  </div>
                                  
                                  {/* Customer Info */}
                                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                                    <span className="text-gray-600 flex items-center gap-2">
                                      <User className="w-4 h-4" />
                                      Customer
                                    </span>
                                    <span className="font-medium text-gray-800">
                                      {lead.customerName || inquiryData.inquiry.customerName || 'N/A'}
                                    </span>
                                  </div>
                                  
                                  {/* Company */}
                                  {(lead.companyName || inquiryData.inquiry.companyName) && (
                                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                                      <span className="text-gray-600 flex items-center gap-2">
                                        <Building className="w-4 h-4" />
                                        Company
                                      </span>
                                      <span className="font-medium text-gray-800">
                                        {lead.companyName || inquiryData.inquiry.companyName}
                                      </span>
                                    </div>
                                  )}
                                  
                                  {/* Negotiation Rounds */}
                                  {totalRevisions > 0 && (
                                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                                      <span className="text-gray-600 flex items-center gap-2">
                                        <MessageSquare className="w-4 h-4" />
                                        Negotiation Rounds
                                      </span>
                                      <Badge className="bg-blue-100 text-blue-800">
                                        {totalRevisions} {totalRevisions === 1 ? 'revision' : 'revisions'}
                                      </Badge>
                                    </div>
                                  )}
                                  
                                  {/* Completion Date */}
                                  <div className="flex items-center justify-between py-2">
                                    <span className="text-gray-600 flex items-center gap-2">
                                      <Calendar className="w-4 h-4" />
                                      Deal Closed
                                    </span>
                                    <span className="font-medium text-gray-800">
                                      {acceptedAt ? format(new Date(acceptedAt), 'MMM dd, yyyy HH:mm') : 'N/A'}
                                    </span>
                                  </div>
                                </div>
                                
                                {/* Status Badge */}
                                <div className="flex justify-center">
                                  <Badge className="bg-green-600 text-white px-4 py-1.5 text-sm">
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    {acceptedRevision ? 'Customer Accepted Quote' : 'Bid Accepted by Sales'}
                                  </Badge>
                                </div>
                              </div>
                            );
                          })()}

                          {/* Manual Status Update (Advanced) */}
                          <div className="pt-3 border-t">
                            <details className="text-sm">
                              <summary className="cursor-pointer text-gray-500 hover:text-gray-700">
                                Advanced: Manual Status Update
                              </summary>
                              <div className="mt-2 flex gap-2">
                                <Select 
                                  value={inquiryData.inquiry.bidProgressStatus || 'submitted'}
                                  onValueChange={(value) => updateStatusMutation.mutate(value)}
                                >
                                  <SelectTrigger className="flex-1" data-testid="select-bid-status">
                                    <SelectValue placeholder="Select status..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="submitted">Bid Submitted</SelectItem>
                                    <SelectItem value="manager_approval">Manager Approval</SelectItem>
                                    <SelectItem value="sales_discussion">Sales Discussion</SelectItem>
                                    <SelectItem value="quotation_sent">Quotation Sent</SelectItem>
                                    <SelectItem value="completed">Completed</SelectItem>
                                  </SelectContent>
                                </Select>
                                {updateStatusMutation.isPending && (
                                  <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                                )}
                              </div>
                            </details>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Negotiation History (for high volume bids) */}
                  {lead.leadSource === 'high_volume_bid' && inquiryData.bidRevisions && inquiryData.bidRevisions.length > 0 && (
                    <Card>
                      <CardContent className="p-4 sm:p-6">
                        <h3 className="font-semibold mb-4 flex items-center gap-2">
                          <History className="h-4 w-4" />
                          Negotiation History
                        </h3>
                        <div className="space-y-3">
                          {inquiryData.bidRevisions.map((revision: any, index: number) => (
                            <div key={revision.id} className="border rounded-lg p-4 bg-gray-50">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-semibold text-lg text-green-600">
                                  {revision.currency || 'USD'} {parseFloat(revision.revisedAmount).toFixed(2)}
                                </span>
                                <Badge className={
                                  revision.status === 'accepted' ? 'bg-emerald-100 text-emerald-800' :
                                  revision.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                  'bg-yellow-100 text-yellow-800'
                                }>
                                  {revision.status === 'accepted' ? (
                                    <><CheckCircle className="w-3 h-3 mr-1" /> Accepted</>
                                  ) : revision.status === 'rejected' ? (
                                    <><XCircle className="w-3 h-3 mr-1" /> Rejected</>
                                  ) : (
                                    <><Clock className="w-3 h-3 mr-1" /> Pending</>
                                  )}
                                </Badge>
                              </div>
                              <p className="text-xs text-gray-500">
                                Submitted {revision.submittedAt 
                                  ? formatDistanceToNow(new Date(revision.submittedAt), { addSuffix: true })
                                  : 'N/A'}
                              </p>
                              {revision.notes && (
                                <div className="mt-2 p-2 bg-white rounded border">
                                  <p className="text-xs text-gray-500">Notes:</p>
                                  <p className="text-sm">{revision.notes}</p>
                                </div>
                              )}
                              {revision.respondedAt && revision.responseNotes && (
                                <div className="mt-2 p-2 bg-blue-50 rounded border border-blue-200">
                                  <p className="text-xs text-blue-600">Customer Response:</p>
                                  <p className="text-sm">{revision.responseNotes}</p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Quotations */}
                  {inquiryData.quotations && inquiryData.quotations.length > 0 && (
                    <Card>
                      <CardContent className="p-4 sm:p-6">
                        <h3 className="font-semibold mb-4 flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Quotations
                        </h3>
                        <div className="space-y-3">
                          {inquiryData.quotations.map((quotation: any) => (
                            <div key={quotation.id} className="border rounded-lg p-4">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium">{quotation.quotationId}</span>
                                <Badge className={
                                  quotation.status === 'accepted' ? 'bg-green-100 text-green-800' :
                                  quotation.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                  quotation.status === 'expired' ? 'bg-gray-100 text-gray-800' :
                                  'bg-blue-100 text-blue-800'
                                }>
                                  {quotation.status}
                                </Badge>
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>
                                  <span className="text-gray-500">Total Amount:</span>
                                  <span className="font-semibold ml-1">${parseFloat(quotation.totalAmount || 0).toFixed(2)}</span>
                                </div>
                                {quotation.validUntil && (
                                  <div>
                                    <span className="text-gray-500">Valid Until:</span>
                                    <span className="ml-1">{format(new Date(quotation.validUntil), 'MMM d, yyyy')}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Approval Notes */}
                  {inquiryData.inquiry.approvalNotes && (
                    <Card>
                      <CardContent className="p-4 sm:p-6">
                        <h3 className="font-semibold mb-4 flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          Approval Notes
                        </h3>
                        <div className="p-3 bg-green-50 rounded border border-green-200">
                          <p className="text-sm whitespace-pre-wrap">{inquiryData.inquiry.approvalNotes}</p>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </>
              ) : (
                <Card>
                  <CardContent className="p-6 text-center text-gray-500">
                    No original inquiry data found for this lead.
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          )}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
