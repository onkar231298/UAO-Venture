import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Building, User, DollarSign, Calendar, Phone, Mail, MapPin, FileText, UserPlus, Package, MessageSquare, History, CheckCircle, XCircle, Clock, Loader2, Send, ArrowRight, ChevronDown, ChevronUp, Inbox, Reply, Paperclip, Eye, Plus, X, Upload, RefreshCw, Download, ShoppingCart, Truck, Ship } from "lucide-react";
import { type LeadWithDetails, type Product } from "@shared/schema";
import ActivityTimeline from "./ActivityTimeline";
import { format, formatDistanceToNow } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import RichTextEditor from "./RichTextEditor";
import EmailViewDialog from "./EmailViewDialog";
import { ClickToCall, SendSmsButton, Dialer } from "./crm/Dialer";

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
    priceType: "ex_warehouse",
    message: "",
    shippingAddress: "",
    city: "",
    state: "",
    postalCode: "",
    country: "United States",
  });
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [showSendQuoteDialog, setShowSendQuoteDialog] = useState(false);
  const [selectedQuoteToSend, setSelectedQuoteToSend] = useState<any>(null);
  const [selectedThreadForQuote, setSelectedThreadForQuote] = useState<string>("");
  const [quoteEmailSubject, setQuoteEmailSubject] = useState("");
  const [quoteEmailBody, setQuoteEmailBody] = useState("");
  const [quoteEmailTo, setQuoteEmailTo] = useState<string[]>([]);
  const [quoteEmailCc, setQuoteEmailCc] = useState<string[]>([]);
  const [showConvertToSODialog, setShowConvertToSODialog] = useState(false);
  const [selectedQuoteForSO, setSelectedQuoteForSO] = useState<any>(null);
  const [showSendSODialog, setShowSendSODialog] = useState(false);
  const [selectedSOToSend, setSelectedSOToSend] = useState<any>(null);
  const [soEmailSubject, setSOEmailSubject] = useState("");
  const [soEmailBody, setSOEmailBody] = useState("");
  const [soEmailTo, setSOEmailTo] = useState<string[]>([]);
  const [soEmailCc, setSOEmailCc] = useState<string[]>([]);
  const [selectedThreadForSO, setSelectedThreadForSO] = useState<string>("");
  const [soFormData, setSOFormData] = useState({
    paymentTermsAdvancePercent: "",
    paymentTermsCreditDays: "0",
    expectedDeliveryDate: "",
    shippingAddress: "",
    shippingCity: "",
    shippingState: "",
    shippingPostalCode: "",
    shippingCountry: "",
    shippingMethod: "",
    billingAddress: "",
    billingCity: "",
    billingState: "",
    billingPostalCode: "",
    billingCountry: "",
    portOfLoading: "",
    portOfDischarge: "",
    batchNumber: "",
    creditPeriod: "",
    internalNotes: "",
  });
  const [quoteFormData, setQuoteFormData] = useState({
    productId: 0,
    quantity: "",
    unit: "kg",
    unitPrice: "",
    priceType: "ex_warehouse",
    currency: "USD",
    validDays: "30",
    leadTime: "",
    paymentTerms: "",
    terms: "",
    notes: "",
    discountPercent: "0",
    includeGst: false,
    gstNumber: "",
    gstPercentage: "18",
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const productIds = lead?.productsInterested || [];
  const { data: products = [], isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ['/api/admin/products/bulk', { ids: productIds.join(',') }],
    enabled: productIds.length > 0 && open && !!lead,
  });
  
  // Fetch all products when productsInterested is empty (for quotation/sample forms)
  const { data: allProductsData } = useQuery<{ products: Product[] }>({
    queryKey: ['/api/products', { limit: 500 }],
    enabled: productIds.length === 0 && open && !!lead,
  });
  
  // Use specific products if available, otherwise fall back to all products
  const availableProducts = productIds.length > 0 ? products : (allProductsData?.products || []);
  
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

  // Fetch all company contacts for this lead
  const { data: companyContacts = [] } = useQuery<any[]>({
    queryKey: ['/api/crm/leads', lead?.id, 'company-contacts'],
    queryFn: async () => {
      if (!lead?.id) return [];
      const response = await fetch(`/api/crm/leads/${lead.id}/company-contacts`);
      if (!response.ok) throw new Error('Failed to fetch company contacts');
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
    const phone = lead?.contactPerson?.phone 
      ? `${lead.contactPerson.countryCode || ''}${lead.contactPerson.phone}` 
      : "";
    // Pre-select product from productsInterested if available
    // If productsInterested is empty but lead has productName, try to find matching product
    let defaultProductId = selectedProductId || 0;
    if (!defaultProductId && productIds.length > 0 && availableProducts.length > 0) {
      defaultProductId = availableProducts[0].id;
    } else if (!defaultProductId && lead?.productName && availableProducts.length > 0) {
      const matchedProduct = availableProducts.find(p => p.name === lead.productName);
      defaultProductId = matchedProduct?.id || 0;
    }
    setSampleFormData({
      contactName: lead?.contactPerson?.contactName || "",
      companyName: lead?.company?.companyName || "",
      phoneNumber: phone,
      emailAddress: lead?.contactPerson?.email || "",
      productId: defaultProductId,
      sampleSize: "50g",
      purpose: "",
      expectedOrderQuantity: lead?.requiredQuantity?.toString() || "",
      priceType: "ex_warehouse",
      message: "",
      shippingAddress: lead?.company?.address || "",
      city: lead?.company?.city || "",
      state: lead?.company?.state || "",
      postalCode: lead?.company?.postalCode || "",
      country: lead?.company?.country || "United States",
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
      priceType: "ex_warehouse",
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

  // Quotation creation mutation
  const createQuotationMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest(`/api/crm/leads/${lead?.id}/quotations`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/crm/leads', lead?.id, 'quotations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/crm/leads', lead?.id, 'activities'] });
      setShowQuoteForm(false);
      resetQuoteFormData();
      toast({
        title: "Quotation Created",
        description: "The quotation has been created successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create quotation",
        variant: "destructive",
      });
    },
  });

  // Convert quotation to sales order mutation
  const convertToSOMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('/api/sales-orders/convert-from-quotation', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return response;
    },
    onSuccess: (result: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/crm/leads', lead?.id, 'quotations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/crm/leads', lead?.id, 'activities'] });
      queryClient.invalidateQueries({ queryKey: ['/api/sales-orders'] });
      setShowConvertToSODialog(false);
      setSelectedQuoteForSO(null);
      resetSOFormData();
      
      const soNumber = result?.soNumber || 'New Order';
      toast({
        title: "Sales Order Created",
        description: `Sales Order ${soNumber} has been created successfully.`,
      });
      
      // Offer to send the SO to customer
      if (result && result.id) {
        setSelectedSOToSend(result);
        initializeSendSOForm(result);
        setShowSendSODialog(true);
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to convert quotation to sales order",
        variant: "destructive",
      });
    },
  });

  // Send Sales Order to customer mutation
  const sendSalesOrderMutation = useMutation({
    mutationFn: async (data: { salesOrderId: number; emailThreadId?: number; subject: string; body: string; to?: string[]; cc?: string[] }) => {
      return apiRequest(`/api/sales-orders/${data.salesOrderId}/send`, {
        method: 'POST',
        body: JSON.stringify({
          emailThreadId: data.emailThreadId,
          subject: data.subject,
          body: data.body,
          to: data.to,
          cc: data.cc,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/crm/leads', lead?.id, 'activities'] });
      queryClient.invalidateQueries({ queryKey: ['/api/email/threads', lead?.id] });
      queryClient.invalidateQueries({ queryKey: ['/api/sales-orders'] });
      setShowSendSODialog(false);
      setSelectedSOToSend(null);
      setSOEmailSubject("");
      setSOEmailBody("");
      setSelectedThreadForSO("");
      toast({
        title: "Sales Order Sent",
        description: "The sales order has been sent to the customer.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send sales order",
        variant: "destructive",
      });
    },
  });

  const initializeSendSOForm = (salesOrder: any) => {
    const companyName = lead?.company?.companyName || lead?.companyName || 'Valued Customer';
    const customerEmail = salesOrder.customerEmail || lead?.contactPerson?.email || lead?.company?.primaryEmail || '';
    
    setSOEmailSubject(`Sales Order ${salesOrder.soNumber} - ${companyName}`);
    setSOEmailTo(customerEmail ? [customerEmail] : []);
    setSOEmailCc([]);
    setSOEmailBody(`<p>Dear ${lead?.contactName || companyName},</p>

<p>Please find attached your Sales Order <strong>${salesOrder.soNumber}</strong> for your recent order.</p>

<p><strong>Order Details:</strong></p>
<ul>
<li>Order Number: ${salesOrder.soNumber}</li>
<li>Total Amount: ${salesOrder.currency || 'USD'} ${parseFloat(salesOrder.totalAmount || 0).toLocaleString()}</li>
<li>Expected Delivery: ${salesOrder.expectedDeliveryDate ? format(new Date(salesOrder.expectedDeliveryDate), 'MMMM d, yyyy') : 'To be confirmed'}</li>
</ul>

<p><strong>Payment Terms:</strong></p>
<ul>
<li>Advance Payment: ${salesOrder.paymentTermsAdvancePercent || 0}%</li>
<li>Credit Days: ${salesOrder.paymentTermsCreditDays || 30} days</li>
</ul>

<p>Please review the order details and let us know if you have any questions.</p>

<p>Best regards,<br/>The BFI Organic Team</p>`);
    setSelectedThreadForSO("");
  };

  const handleSendSO = () => {
    if (!selectedSOToSend) return;
    
    // Validate recipients
    if (soEmailTo.length === 0) {
      toast({
        title: "Missing Recipient",
        description: "Please enter at least one email recipient",
        variant: "destructive",
      });
      return;
    }
    
    // If "new_thread" is selected, don't send emailThreadId (starts new conversation)
    const emailThreadId = selectedThreadForSO && selectedThreadForSO !== "new_thread" 
      ? parseInt(selectedThreadForSO) 
      : undefined;
    
    sendSalesOrderMutation.mutate({
      salesOrderId: selectedSOToSend.id,
      emailThreadId,
      subject: soEmailSubject,
      body: soEmailBody,
      to: soEmailTo,
      cc: soEmailCc.length > 0 ? soEmailCc : undefined,
    });
  };

  // Handle sending SO from quotation card - fetch SO details first
  const handleSendSOFromQuote = async (salesOrderId: number) => {
    try {
      const response = await fetch(`/api/sales-orders/${salesOrderId}`);
      if (!response.ok) throw new Error('Failed to fetch sales order');
      const so = await response.json();
      setSelectedSOToSend(so);
      initializeSendSOForm(so);
      setShowSendSODialog(true);
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not load sales order details",
        variant: "destructive",
      });
    }
  };

  const initializeSOForm = (quote: any) => {
    // Pre-fill from company address if available
    const company = lead?.company;
    setSOFormData({
      paymentTermsAdvancePercent: "",
      paymentTermsCreditDays: "30",
      expectedDeliveryDate: "",
      shippingAddress: company?.address || "",
      shippingCity: company?.city || "",
      shippingState: company?.state || "",
      shippingPostalCode: company?.postalCode || "",
      shippingCountry: company?.country || "",
      shippingMethod: "",
      internalNotes: "",
    });
    setSelectedQuoteForSO(quote);
    setShowConvertToSODialog(true);
  };

  const resetSOFormData = () => {
    setSOFormData({
      paymentTermsAdvancePercent: "",
      paymentTermsCreditDays: "0",
      expectedDeliveryDate: "",
      shippingAddress: "",
      shippingCity: "",
      shippingState: "",
      shippingPostalCode: "",
      shippingCountry: "",
      shippingMethod: "",
      billingAddress: "",
      billingCity: "",
      billingState: "",
      billingPostalCode: "",
      billingCountry: "",
      portOfLoading: "",
      portOfDischarge: "",
      batchNumber: "",
      creditPeriod: "",
      internalNotes: "",
    });
  };

  const handleConvertToSO = () => {
    if (!selectedQuoteForSO) return;
    
    convertToSOMutation.mutate({
      quotationId: selectedQuoteForSO.id,
      ...soFormData,
    });
  };

  const initializeQuoteForm = (selectedProductId?: number) => {
    // Pre-select product from productsInterested if available
    // If productsInterested is empty but lead has productName, try to find matching product
    let product = selectedProductId 
      ? availableProducts.find(p => p.id === selectedProductId)
      : null;
    
    if (!product && productIds.length > 0 && availableProducts.length > 0) {
      // Use first product from productsInterested
      product = availableProducts[0];
    } else if (!product && lead?.productName && availableProducts.length > 0) {
      // Try to find product by name match (for company-converted leads)
      product = availableProducts.find(p => p.name === lead.productName) || null;
    }
    
    setQuoteFormData({
      productId: product?.id || 0,
      quantity: lead?.requiredQuantity?.toString() || "",
      unit: lead?.unit || "kg",
      unitPrice: "",
      priceType: "ex_warehouse",
      currency: lead?.currency || "USD",
      validDays: "30",
      leadTime: product?.leadTime || "",
      paymentTerms: "30 days net",
      terms: `Delivery: Ex-works
Validity: 30 days from quotation date
Quality: As per specifications
Packaging: Standard export packaging`,
      notes: "",
      discountPercent: "0",
      includeGst: false,
      gstNumber: "",
      gstPercentage: "18",
    });
    setShowQuoteForm(true);
  };

  const resetQuoteFormData = () => {
    setQuoteFormData({
      productId: 0,
      quantity: "",
      unit: "kg",
      unitPrice: "",
      priceType: "ex_warehouse",
      currency: "USD",
      validDays: "30",
      leadTime: "",
      paymentTerms: "",
      terms: "",
      notes: "",
      discountPercent: "0",
      includeGst: false,
      gstNumber: "",
      gstPercentage: "18",
    });
  };

  const handleQuoteFormSubmit = () => {
    if (!quoteFormData.productId) {
      toast({
        title: "Product Required",
        description: "Please select a product for the quotation.",
        variant: "destructive",
      });
      return;
    }
    
    if (!quoteFormData.quantity || !quoteFormData.unitPrice) {
      toast({
        title: "Missing Information",
        description: "Please enter quantity and unit price.",
        variant: "destructive",
      });
      return;
    }
    
    const quantity = parseFloat(quoteFormData.quantity);
    const unitPrice = parseFloat(quoteFormData.unitPrice);
    const subtotal = quantity * unitPrice;
    
    const discountPercent = parseFloat(quoteFormData.discountPercent) || 0;
    const discountAmount = (subtotal * discountPercent) / 100;
    
    let gstAmount = 0;
    if (quoteFormData.includeGst) {
      const gstPercent = parseFloat(quoteFormData.gstPercentage) || 0;
      gstAmount = ((subtotal - discountAmount) * gstPercent) / 100;
    }
    
    const totalAmount = subtotal - discountAmount + gstAmount;
    
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + parseInt(quoteFormData.validDays || "30"));
    
    const product = products.find(p => p.id === quoteFormData.productId);
    
    createQuotationMutation.mutate({
      productId: quoteFormData.productId,
      productName: product?.name,
      quantity: quoteFormData.quantity,
      unit: quoteFormData.unit,
      unitPrice: quoteFormData.unitPrice,
      totalAmount: totalAmount.toFixed(2),
      subtotal: subtotal.toFixed(2),
      discountPercent: quoteFormData.discountPercent,
      discountAmount: discountAmount.toFixed(2),
      includeGst: quoteFormData.includeGst,
      gstNumber: quoteFormData.includeGst ? quoteFormData.gstNumber : null,
      gstPercentage: quoteFormData.includeGst ? quoteFormData.gstPercentage : null,
      gstAmount: quoteFormData.includeGst ? gstAmount.toFixed(2) : null,
      priceType: quoteFormData.priceType,
      currency: quoteFormData.currency,
      validUntil: validUntil,
      leadTime: quoteFormData.leadTime || null,
      paymentTerms: quoteFormData.paymentTerms || null,
      terms: quoteFormData.terms,
      notes: quoteFormData.notes,
      status: "draft",
      items: [{
        productId: quoteFormData.productId,
        quantity: quoteFormData.quantity,
        unit: quoteFormData.unit,
        unitPrice: quoteFormData.unitPrice,
        totalPrice: subtotal.toFixed(2),
        specifications: quoteFormData.notes || null,
      }],
    });
  };

  // Send quotation via email mutation
  const sendQuotationMutation = useMutation({
    mutationFn: async (data: { 
      quotationId: number; 
      subject: string; 
      body: string; 
      to: string[]; 
      cc?: string[]; 
      threadId?: string 
    }) => {
      const response = await fetch(`/api/crm/leads/${lead?.id}/quotations/${data.quotationId}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email: data.to[0],
          to: data.to,
          cc: data.cc,
          subject: data.subject,
          body: data.body,
          threadId: data.threadId,
          attachPdf: true,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to send quotation');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/crm/leads', lead?.id, 'quotations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/crm/leads', lead?.id, 'activities'] });
      queryClient.invalidateQueries({ queryKey: ['/api/crm/leads', lead?.id, 'emails'] });
      queryClient.invalidateQueries({ queryKey: ['/api/email/threads', lead?.id] });
      setShowSendQuoteDialog(false);
      setSelectedQuoteToSend(null);
      setQuoteEmailSubject("");
      setQuoteEmailBody("");
      setQuoteEmailTo([]);
      setQuoteEmailCc([]);
      setSelectedThreadForQuote("");
      toast({
        title: "Quotation Sent",
        description: "The quotation has been sent to the customer via email.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send quotation",
        variant: "destructive",
      });
    },
  });

  // Initialize quotation email form with default content
  const initializeQuotationEmailForm = (quote: any) => {
    const companyName = lead?.company?.companyName || lead?.companyName || 'Valued Customer';
    const customerEmail = lead?.contactPerson?.email || lead?.company?.primaryEmail || '';
    const contactName = lead?.contactName || lead?.contactPerson?.name || companyName;
    
    // Get product names
    let productName = 'your inquiry';
    if (lead?.productsInterested && lead.productsInterested.length > 0 && availableProducts.length > 0) {
      const productNames = lead.productsInterested
        .map((pid: number) => availableProducts.find((p: any) => p.id === pid)?.name)
        .filter(Boolean);
      if (productNames.length > 0) {
        productName = productNames.join(', ');
      }
    }
    
    setQuoteEmailSubject(`Quotation ${quote.quotationId} - ${productName}`);
    setQuoteEmailTo(customerEmail ? [customerEmail] : []);
    setQuoteEmailCc([]);
    setQuoteEmailBody(`<p>Dear ${contactName},</p>

<p>Greetings from Bright Fame Organic!</p>

<p>Thank you for your interest in <strong>${productName}</strong>. We are pleased to send you the quotation as requested.</p>

<p><strong>Quotation Details:</strong></p>
<ul>
<li>Quotation Number: ${quote.quotationId}</li>
<li>Total Amount: ${quote.currency || 'USD'} ${parseFloat(quote.totalAmount || 0).toLocaleString()}</li>
<li>Valid Until: ${quote.validUntil ? format(new Date(quote.validUntil), 'MMMM d, yyyy') : 'As mentioned in quotation'}</li>
</ul>

<p>Please find the quotation attached to this email for your reference.</p>

<p>If you have any queries or require further clarification, please feel free to reply to this email or reach out to us directly.</p>

<p>We look forward to hearing from you.</p>`);
  };

  const handleSendQuotation = (quote: any) => {
    if (!emailConfig) {
      toast({
        title: "Email Not Configured",
        description: "Please configure your email settings before sending quotations.",
        variant: "destructive",
      });
      return;
    }
    const customerEmail = lead?.contactPerson?.email;
    if (!customerEmail) {
      toast({
        title: "No Email Address",
        description: "This lead doesn't have a contact email address configured.",
        variant: "destructive",
      });
      return;
    }
    // Initialize form and show the send dialog
    setSelectedQuoteToSend(quote);
    initializeQuotationEmailForm(quote);
    setSelectedThreadForQuote("");
    setShowSendQuoteDialog(true);
  };

  const confirmSendQuotation = () => {
    if (!selectedQuoteToSend) return;
    
    if (quoteEmailTo.length === 0) {
      toast({
        title: "No Recipient",
        description: "Please add at least one recipient email address.",
        variant: "destructive",
      });
      return;
    }
    
    // If "new_thread" is selected, don't send a threadId (start a new thread)
    const threadId = selectedThreadForQuote && selectedThreadForQuote !== "new_thread" ? selectedThreadForQuote : undefined;
    
    sendQuotationMutation.mutate({
      quotationId: selectedQuoteToSend.id,
      subject: quoteEmailSubject,
      body: quoteEmailBody,
      to: quoteEmailTo,
      cc: quoteEmailCc.length > 0 ? quoteEmailCc : undefined,
      threadId,
    });
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
            <div className="flex flex-wrap items-center gap-2">
              <Badge className={`text-xs ${getPriorityColor(lead.priority || "warm")}`}>
                {lead.priority || "warm"}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {lead.currentStage ? formatStageName(lead.currentStage) : 'N/A'}
              </Badge>
              {lead.contactPerson?.phone && (
                <Dialer
                  leadId={lead.id}
                  companyId={lead.companyId || undefined}
                  contactName={lead.contactPerson?.contactName}
                  phoneNumber={`${lead.contactPerson.countryCode || ''}${lead.contactPerson.phone}`}
                />
              )}
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
                    <div className="font-medium flex items-center gap-2">
                      {lead.contactPerson?.phone ? (
                        <>
                          <ClickToCall
                            phoneNumber={`${lead.contactPerson.countryCode || ''}${lead.contactPerson.phone}`}
                            contactName={lead.contactPerson.contactName}
                            leadId={lead.id}
                            companyId={lead.companyId || undefined}
                          />
                          <SendSmsButton
                            phoneNumber={`${lead.contactPerson.countryCode || ''}${lead.contactPerson.phone}`}
                            contactName={lead.contactPerson.contactName}
                            leadId={lead.id}
                            companyId={lead.companyId || undefined}
                          />
                        </>
                      ) : (
                        <span className="text-muted-foreground">N/A</span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* All Company Contacts */}
            {companyContacts.length > 0 && (
              <Card>
                <CardContent className="p-4 sm:p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <UserPlus className="h-4 w-4" />
                    All Company Contacts ({companyContacts.length})
                  </h3>
                  <div className="space-y-4">
                    {companyContacts.map((contact: any) => (
                      <div 
                        key={contact.id} 
                        className={`p-3 rounded-lg border ${contact.isPrimary ? 'bg-blue-50 border-blue-200' : 'bg-gray-50'}`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-medium">
                              {contact.contactName}
                              {contact.isPrimary && (
                                <Badge variant="secondary" className="ml-2 text-xs">Primary</Badge>
                              )}
                            </p>
                            {contact.designation && (
                              <p className="text-sm text-gray-500">{contact.designation}</p>
                            )}
                          </div>
                          {contact.role && (
                            <Badge variant="outline" className="capitalize text-xs">{contact.role.replace('_', ' ')}</Badge>
                          )}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                          {contact.email && (
                            <div className="flex items-center gap-2">
                              <Mail className="h-3 w-3 text-gray-400" />
                              <a href={`mailto:${contact.email}`} className="text-blue-600 hover:underline">
                                {contact.email}
                              </a>
                            </div>
                          )}
                          {contact.phone && (
                            <div className="flex items-center gap-2">
                              <ClickToCall
                                phoneNumber={`${contact.countryCode || ''}${contact.phone}`}
                                contactName={contact.contactName}
                                leadId={lead.id}
                                companyId={lead.companyId || undefined}
                              />
                              <SendSmsButton
                                phoneNumber={`${contact.countryCode || ''}${contact.phone}`}
                                contactName={contact.contactName}
                                leadId={lead.id}
                                companyId={lead.companyId || undefined}
                              />
                            </div>
                          )}
                          {contact.whatsapp && (
                            <div className="flex items-center gap-2">
                              <Phone className="h-3 w-3 text-green-500" />
                              <span className="text-gray-600">WhatsApp: {contact.whatsapp}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

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
            ) : productIds.length === 0 && !lead?.productName ? (
              <Card>
                <CardContent className="p-4 sm:p-6">
                  <p className="text-gray-500">No products associated with this lead</p>
                </CardContent>
              </Card>
            ) : productIds.length === 0 && lead?.productName ? (
              <Card>
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-md bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <Package className="h-8 w-8 text-gray-400" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-lg" data-testid="product-name-manual">
                        {lead.productName}
                      </h4>
                      {lead.productDescription && (
                        <p className="text-sm text-gray-600 mt-1" data-testid="product-description-manual">
                          {lead.productDescription}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-3 mt-3">
                        {lead.requiredQuantity && (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700">
                            Quantity: {lead.requiredQuantity} {lead.unit || 'kg'}
                          </Badge>
                        )}
                        <Badge variant="secondary">
                          Product Enquiry
                        </Badge>
                      </div>
                    </div>
                  </div>
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
                              {availableProducts.length > 0 ? (
                                availableProducts.map((product) => (
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
                        
                        <div>
                          <Label htmlFor="price-type">Price Type / Incoterms</Label>
                          <Select
                            value={sampleFormData.priceType}
                            onValueChange={(value) => setSampleFormData({...sampleFormData, priceType: value})}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ex_warehouse">Ex-Warehouse</SelectItem>
                              <SelectItem value="ex_works">Ex-Works</SelectItem>
                              <SelectItem value="fob">FOB (Free on Board)</SelectItem>
                              <SelectItem value="cif">CIF (Cost, Insurance & Freight)</SelectItem>
                              <SelectItem value="cfr">CFR (Cost & Freight)</SelectItem>
                              <SelectItem value="dap">DAP (Delivered at Place)</SelectItem>
                              <SelectItem value="ddp">DDP (Delivered Duty Paid)</SelectItem>
                              <SelectItem value="cpt">CPT (Carriage Paid To)</SelectItem>
                              <SelectItem value="cip">CIP (Carriage & Insurance Paid)</SelectItem>
                            </SelectContent>
                          </Select>
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
                    onClick={() => initializeQuoteForm()}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Create Quote
                  </Button>
                </div>

                {/* Quote Creation Form */}
                {showQuoteForm && (
                  <Card className="mb-4 border-2 border-green-200 bg-green-50">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="font-medium flex items-center gap-2 text-green-800">
                          <FileText className="h-4 w-4" />
                          New Quotation
                        </h4>
                        <Button variant="ghost" size="sm" onClick={() => setShowQuoteForm(false)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Product Selection */}
                        <div className="md:col-span-2">
                          <Label htmlFor="quote-product">Product *</Label>
                          <Select
                            value={quoteFormData.productId.toString()}
                            onValueChange={(value) => setQuoteFormData({...quoteFormData, productId: parseInt(value)})}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select a product" />
                            </SelectTrigger>
                            <SelectContent>
                              {availableProducts.length > 0 ? (
                                availableProducts.map((product) => (
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
                        
                        {/* Quantity and Price */}
                        <div>
                          <Label htmlFor="quote-quantity">Quantity *</Label>
                          <Input
                            id="quote-quantity"
                            type="number"
                            value={quoteFormData.quantity}
                            onChange={(e) => setQuoteFormData({...quoteFormData, quantity: e.target.value})}
                            placeholder="e.g., 500"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="quote-unit">Unit</Label>
                          <Select
                            value={quoteFormData.unit}
                            onValueChange={(value) => setQuoteFormData({...quoteFormData, unit: value})}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="kg">Kilograms (kg)</SelectItem>
                              <SelectItem value="mt">Metric Tons (MT)</SelectItem>
                              <SelectItem value="lb">Pounds (lb)</SelectItem>
                              <SelectItem value="units">Units</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label htmlFor="quote-price">Unit Price *</Label>
                          <Input
                            id="quote-price"
                            type="number"
                            step="0.01"
                            value={quoteFormData.unitPrice}
                            onChange={(e) => setQuoteFormData({...quoteFormData, unitPrice: e.target.value})}
                            placeholder="Price per unit"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="quote-currency">Currency</Label>
                          <Select
                            value={quoteFormData.currency}
                            onValueChange={(value) => setQuoteFormData({...quoteFormData, currency: value})}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="USD">USD - US Dollar</SelectItem>
                              <SelectItem value="EUR">EUR - Euro</SelectItem>
                              <SelectItem value="GBP">GBP - British Pound</SelectItem>
                              <SelectItem value="INR">INR - Indian Rupee</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label htmlFor="quote-price-type">Price Type / Incoterms</Label>
                          <Select
                            value={quoteFormData.priceType}
                            onValueChange={(value) => setQuoteFormData({...quoteFormData, priceType: value})}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ex_warehouse">Ex-Warehouse</SelectItem>
                              <SelectItem value="ex_works">Ex-Works</SelectItem>
                              <SelectItem value="fob">FOB (Free on Board)</SelectItem>
                              <SelectItem value="cif">CIF (Cost, Insurance & Freight)</SelectItem>
                              <SelectItem value="cfr">CFR (Cost & Freight)</SelectItem>
                              <SelectItem value="dap">DAP (Delivered at Place)</SelectItem>
                              <SelectItem value="ddp">DDP (Delivered Duty Paid)</SelectItem>
                              <SelectItem value="cpt">CPT (Carriage Paid To)</SelectItem>
                              <SelectItem value="cip">CIP (Carriage & Insurance Paid)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label htmlFor="quote-validity">Valid For (Days)</Label>
                          <Select
                            value={quoteFormData.validDays}
                            onValueChange={(value) => setQuoteFormData({...quoteFormData, validDays: value})}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="7">7 Days</SelectItem>
                              <SelectItem value="14">14 Days</SelectItem>
                              <SelectItem value="30">30 Days</SelectItem>
                              <SelectItem value="60">60 Days</SelectItem>
                              <SelectItem value="90">90 Days</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        {/* Lead Time */}
                        <div>
                          <Label htmlFor="quote-lead-time">Production Lead Time</Label>
                          <Input
                            id="quote-lead-time"
                            value={quoteFormData.leadTime}
                            onChange={(e) => setQuoteFormData({...quoteFormData, leadTime: e.target.value})}
                            placeholder="e.g., 5-7 days, 2-3 weeks"
                            data-testid="input-quote-lead-time"
                          />
                        </div>
                        
                        {/* Payment Terms */}
                        <div>
                          <Label htmlFor="quote-payment-terms">Payment Terms</Label>
                          <Input
                            id="quote-payment-terms"
                            value={quoteFormData.paymentTerms}
                            onChange={(e) => setQuoteFormData({...quoteFormData, paymentTerms: e.target.value})}
                            placeholder="e.g., 30 days net, 50% advance"
                            data-testid="input-quote-payment-terms"
                          />
                        </div>
                        
                        {/* Discount */}
                        <div>
                          <Label htmlFor="quote-discount">Discount (%)</Label>
                          <Input
                            id="quote-discount"
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            value={quoteFormData.discountPercent}
                            onChange={(e) => setQuoteFormData({...quoteFormData, discountPercent: e.target.value})}
                            placeholder="0"
                          />
                        </div>
                        
                        {/* GST Toggle */}
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            id="include-gst"
                            checked={quoteFormData.includeGst}
                            onChange={(e) => setQuoteFormData({...quoteFormData, includeGst: e.target.checked})}
                            className="w-4 h-4"
                          />
                          <Label htmlFor="include-gst">Include GST</Label>
                        </div>
                        
                        {/* GST Details */}
                        {quoteFormData.includeGst && (
                          <>
                            <div>
                              <Label htmlFor="gst-number">GST Number</Label>
                              <Input
                                id="gst-number"
                                value={quoteFormData.gstNumber}
                                onChange={(e) => setQuoteFormData({...quoteFormData, gstNumber: e.target.value})}
                                placeholder="Enter GST number"
                              />
                            </div>
                            <div>
                              <Label htmlFor="gst-percentage">GST Rate (%)</Label>
                              <Select
                                value={quoteFormData.gstPercentage}
                                onValueChange={(value) => setQuoteFormData({...quoteFormData, gstPercentage: value})}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="5">5%</SelectItem>
                                  <SelectItem value="12">12%</SelectItem>
                                  <SelectItem value="18">18%</SelectItem>
                                  <SelectItem value="28">28%</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </>
                        )}
                        
                        {/* Calculated Total with Breakdown */}
                        {quoteFormData.quantity && quoteFormData.unitPrice && (
                          <div className="md:col-span-2 bg-gray-50 p-4 rounded-lg border">
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span>Subtotal:</span>
                                <span>{quoteFormData.currency} {(parseFloat(quoteFormData.quantity) * parseFloat(quoteFormData.unitPrice)).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                              </div>
                              {parseFloat(quoteFormData.discountPercent) > 0 && (
                                <div className="flex justify-between text-red-600">
                                  <span>Discount ({quoteFormData.discountPercent}%):</span>
                                  <span>-{quoteFormData.currency} {((parseFloat(quoteFormData.quantity) * parseFloat(quoteFormData.unitPrice) * parseFloat(quoteFormData.discountPercent)) / 100).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                                </div>
                              )}
                              {quoteFormData.includeGst && (
                                <div className="flex justify-between text-blue-600">
                                  <span>GST ({quoteFormData.gstPercentage}%):</span>
                                  <span>+{quoteFormData.currency} {(((parseFloat(quoteFormData.quantity) * parseFloat(quoteFormData.unitPrice) * (1 - parseFloat(quoteFormData.discountPercent) / 100)) * parseFloat(quoteFormData.gstPercentage)) / 100).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                                </div>
                              )}
                              <div className="flex justify-between items-center pt-2 border-t font-bold">
                                <span>Total:</span>
                                <span className="text-xl text-green-700">
                                  {quoteFormData.currency} {(() => {
                                    const subtotal = parseFloat(quoteFormData.quantity) * parseFloat(quoteFormData.unitPrice);
                                    const discount = (subtotal * parseFloat(quoteFormData.discountPercent || "0")) / 100;
                                    const afterDiscount = subtotal - discount;
                                    const gst = quoteFormData.includeGst ? (afterDiscount * parseFloat(quoteFormData.gstPercentage || "0")) / 100 : 0;
                                    return (afterDiscount + gst).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
                                  })()}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        <div className="md:col-span-2">
                          <Label htmlFor="quote-terms">Terms & Conditions</Label>
                          <Textarea
                            id="quote-terms"
                            value={quoteFormData.terms}
                            onChange={(e) => setQuoteFormData({...quoteFormData, terms: e.target.value})}
                            placeholder="Payment terms, delivery conditions..."
                            rows={2}
                          />
                        </div>
                        
                        <div className="md:col-span-2">
                          <Label htmlFor="quote-notes">Internal Notes</Label>
                          <Textarea
                            id="quote-notes"
                            value={quoteFormData.notes}
                            onChange={(e) => setQuoteFormData({...quoteFormData, notes: e.target.value})}
                            placeholder="Notes (not visible to customer)..."
                            rows={2}
                          />
                        </div>
                      </div>
                      
                      <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
                        <Button variant="outline" onClick={() => setShowQuoteForm(false)}>
                          Cancel
                        </Button>
                        <Button 
                          onClick={handleQuoteFormSubmit}
                          disabled={createQuotationMutation.isPending}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          {createQuotationMutation.isPending ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Creating...
                            </>
                          ) : (
                            <>
                              <FileText className="h-4 w-4 mr-2" />
                              Create Quotation
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

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
                            <div className="flex gap-2 mt-2 flex-wrap">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => window.open(`/api/quotations/${quote.id}/pdf`, '_blank')}
                                data-testid="button-download-quotation-pdf"
                              >
                                <Download className="h-3 w-3 mr-1" />
                                Download PDF
                              </Button>
                              {quote.status === 'draft' ? (
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  className="bg-green-50 hover:bg-green-100 border-green-300"
                                  onClick={() => handleSendQuotation(quote)}
                                  disabled={sendQuotationMutation.isPending}
                                  data-testid="button-send-quotation"
                                >
                                  {sendQuotationMutation.isPending ? (
                                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                  ) : (
                                    <Send className="h-3 w-3 mr-1" />
                                  )}
                                  Send to Customer
                                </Button>
                              ) : quote.status === 'sent' ? (
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  className="bg-blue-50 hover:bg-blue-100 border-blue-300"
                                  onClick={() => handleSendQuotation(quote)}
                                  disabled={sendQuotationMutation.isPending}
                                  data-testid="button-resend-quotation"
                                >
                                  {sendQuotationMutation.isPending ? (
                                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                  ) : (
                                    <Send className="h-3 w-3 mr-1" />
                                  )}
                                  Resend Quote
                                </Button>
                              ) : null}
                              {(quote.status === 'accepted' || quote.status === 'sent') && !quote.salesOrderId && (
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  className="bg-purple-50 hover:bg-purple-100 border-purple-300 text-purple-700"
                                  onClick={() => initializeSOForm(quote)}
                                  disabled={convertToSOMutation.isPending}
                                  data-testid="button-convert-to-so"
                                >
                                  {convertToSOMutation.isPending ? (
                                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                  ) : (
                                    <ShoppingCart className="h-3 w-3 mr-1" />
                                  )}
                                  Create Sales Order
                                </Button>
                              )}
                              {quote.salesOrderId && (
                                <div className="flex items-center gap-2">
                                  <Badge className="bg-purple-100 text-purple-800 border border-purple-200">
                                    <ShoppingCart className="h-3 w-3 mr-1" />
                                    SO Created
                                  </Badge>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="bg-purple-50 hover:bg-purple-100 border-purple-300 text-purple-700"
                                    onClick={() => window.open(`/api/sales-orders/${quote.salesOrderId}/pdf`, '_blank')}
                                    data-testid="button-download-so-pdf"
                                  >
                                    <Download className="h-3 w-3 mr-1" />
                                    SO PDF
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="bg-blue-50 hover:bg-blue-100 border-blue-300 text-blue-700"
                                    onClick={() => handleSendSOFromQuote(quote.salesOrderId)}
                                    data-testid="button-send-so-from-quote"
                                  >
                                    <Send className="h-3 w-3 mr-1" />
                                    Send SO
                                  </Button>
                                </div>
                              )}
                            </div>
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
                              {thread.source === 'company' && (
                                <Badge className="text-xs bg-purple-100 text-purple-700 border-0">
                                  Company Email
                                </Badge>
                              )}
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

        {/* Send Quotation Dialog with Custom Email Composer */}
        {showSendQuoteDialog && selectedQuoteToSend && (
          <Dialog open={showSendQuoteDialog} onOpenChange={setShowSendQuoteDialog}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Send className="h-5 w-5 text-green-600" />
                  Send Quotation to Customer
                </DialogTitle>
                <DialogDescription>
                  Compose an email to send Quotation {selectedQuoteToSend.quotationId} to the customer
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="p-3 bg-green-50 rounded-lg border border-green-100">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium text-green-900">{selectedQuoteToSend.quotationId}</div>
                      <div className="text-sm text-green-700">
                        {selectedQuoteToSend.currency || 'USD'} {parseFloat(selectedQuoteToSend.totalAmount || 0).toLocaleString()}
                      </div>
                    </div>
                    <Badge className="bg-green-100 text-green-800">
                      PDF will be attached
                    </Badge>
                  </div>
                </div>

                <div>
                  <Label htmlFor="quote-thread">Email Thread</Label>
                  <Select
                    value={selectedThreadForQuote}
                    onValueChange={(value) => {
                      setSelectedThreadForQuote(value);
                      if (value && value !== "new_thread") {
                        const thread = emailThreads?.find((t: any) => t.id.toString() === value);
                        if (thread) {
                          const lastMessage = thread.messages?.[thread.messages.length - 1];
                          if (lastMessage) {
                            const ourEmail = emailConfig?.companyEmail?.toLowerCase();
                            if (lastMessage.direction === 'outbound') {
                              const toEmails = (lastMessage.toEmails || []).filter((e: string) => e && e.toLowerCase() !== ourEmail);
                              if (toEmails.length > 0) setQuoteEmailTo(toEmails);
                            } else {
                              if (lastMessage.fromEmail) setQuoteEmailTo([lastMessage.fromEmail]);
                            }
                            const ccEmails = (lastMessage.ccEmails || []).filter((e: string) => e && e.toLowerCase() !== ourEmail);
                            setQuoteEmailCc(ccEmails);
                          }
                          setQuoteEmailSubject(`Re: ${thread.subject || 'Quotation'}`);
                        }
                      } else {
                        const customerEmail = lead?.contactPerson?.email || lead?.company?.primaryEmail || '';
                        setQuoteEmailTo(customerEmail ? [customerEmail] : []);
                        setQuoteEmailCc([]);
                        initializeQuotationEmailForm(selectedQuoteToSend);
                      }
                    }}
                  >
                    <SelectTrigger data-testid="select-quote-thread">
                      <SelectValue placeholder="Start new thread or select existing..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new_thread">
                        <div className="flex items-center gap-2">
                          <Plus className="h-4 w-4" />
                          Start New Thread
                        </div>
                      </SelectItem>
                      {emailThreads?.map((thread: any) => (
                        <SelectItem key={thread.id} value={thread.id.toString()}>
                          <div className="flex flex-col">
                            <span className="font-medium text-sm truncate max-w-[300px]">
                              {thread.subject || 'No subject'}
                            </span>
                            <span className="text-xs text-gray-500">
                              {format(new Date(thread.lastMessageDate || thread.createdAt), 'MMM d, yyyy')}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="quote-email-to">To *</Label>
                    <Input
                      id="quote-email-to"
                      value={quoteEmailTo.join(', ')}
                      onChange={(e) => setQuoteEmailTo(e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                      placeholder="recipient@example.com"
                      data-testid="input-quote-email-to"
                    />
                  </div>
                  <div>
                    <Label htmlFor="quote-email-cc">CC</Label>
                    <Input
                      id="quote-email-cc"
                      value={quoteEmailCc.join(', ')}
                      onChange={(e) => setQuoteEmailCc(e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                      placeholder="cc@example.com"
                      data-testid="input-quote-email-cc"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="quote-subject">Subject</Label>
                  <Input
                    id="quote-subject"
                    value={quoteEmailSubject}
                    onChange={(e) => setQuoteEmailSubject(e.target.value)}
                    placeholder="Enter email subject"
                    disabled={selectedThreadForQuote && selectedThreadForQuote !== "new_thread"}
                    className={selectedThreadForQuote && selectedThreadForQuote !== "new_thread" ? "bg-gray-100" : ""}
                    data-testid="input-quote-subject"
                  />
                  {selectedThreadForQuote && selectedThreadForQuote !== "new_thread" && (
                    <p className="text-xs text-gray-500 mt-1">Subject is auto-set when replying to a thread</p>
                  )}
                </div>

                <div>
                  <Label>Message</Label>
                  <RichTextEditor
                    content={quoteEmailBody}
                    onChange={setQuoteEmailBody}
                    placeholder="Write your email here... Use the toolbar above for formatting."
                    minHeight="200px"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    The Quotation PDF will be automatically attached to this email
                  </p>
                </div>

                <div className="flex gap-2 justify-end pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowSendQuoteDialog(false);
                      setSelectedQuoteToSend(null);
                      setQuoteEmailSubject("");
                      setQuoteEmailBody("");
                      setQuoteEmailTo([]);
                      setQuoteEmailCc([]);
                      setSelectedThreadForQuote("");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={confirmSendQuotation}
                    disabled={sendQuotationMutation.isPending || quoteEmailTo.length === 0}
                    className="bg-green-600 hover:bg-green-700"
                    data-testid="button-confirm-send-quotation"
                  >
                    {sendQuotationMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4 mr-2" />
                    )}
                    Send Quotation
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Convert to Sales Order Dialog */}
        {showConvertToSODialog && selectedQuoteForSO && (
          <Dialog open={showConvertToSODialog} onOpenChange={setShowConvertToSODialog}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-purple-600" />
                  Create Sales Order
                </DialogTitle>
                <DialogDescription>
                  Convert quotation to a sales order
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="p-3 bg-purple-50 rounded-lg border border-purple-100">
                  <div className="text-sm">
                    <strong>From Quotation:</strong> {selectedQuoteForSO.quotationId || selectedQuoteForSO.quotationNumber}
                  </div>
                  <div className="text-sm">
                    <strong>Amount:</strong> {selectedQuoteForSO.currency || 'USD'} {parseFloat(selectedQuoteForSO.totalAmount || 0).toLocaleString()}
                  </div>
                  <div className="text-sm">
                    <strong>Company:</strong> {lead?.company?.companyName}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="advance-percent">Advance Payment (%)</Label>
                    <Input
                      id="advance-percent"
                      type="number"
                      placeholder="e.g. 30"
                      value={soFormData.paymentTermsAdvancePercent}
                      onChange={(e) => setSOFormData({...soFormData, paymentTermsAdvancePercent: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="credit-days">Credit Days</Label>
                    <Input
                      id="credit-days"
                      type="number"
                      placeholder="e.g. 30"
                      value={soFormData.paymentTermsCreditDays}
                      onChange={(e) => setSOFormData({...soFormData, paymentTermsCreditDays: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="expected-delivery">Expected Delivery Date</Label>
                  <Input
                    id="expected-delivery"
                    type="date"
                    value={soFormData.expectedDeliveryDate}
                    onChange={(e) => setSOFormData({...soFormData, expectedDeliveryDate: e.target.value})}
                  />
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Truck className="h-4 w-4" />
                    Shipping Address
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="shipping-address">Address</Label>
                      <Textarea
                        id="shipping-address"
                        placeholder="Street address"
                        value={soFormData.shippingAddress}
                        onChange={(e) => setSOFormData({...soFormData, shippingAddress: e.target.value})}
                        rows={2}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="shipping-city">City</Label>
                        <Input
                          id="shipping-city"
                          placeholder="City"
                          value={soFormData.shippingCity}
                          onChange={(e) => setSOFormData({...soFormData, shippingCity: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="shipping-state">State/Province</Label>
                        <Input
                          id="shipping-state"
                          placeholder="State"
                          value={soFormData.shippingState}
                          onChange={(e) => setSOFormData({...soFormData, shippingState: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="shipping-postal">Postal Code</Label>
                        <Input
                          id="shipping-postal"
                          placeholder="Postal code"
                          value={soFormData.shippingPostalCode}
                          onChange={(e) => setSOFormData({...soFormData, shippingPostalCode: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="shipping-country">Country</Label>
                        <Input
                          id="shipping-country"
                          placeholder="Country"
                          value={soFormData.shippingCountry}
                          onChange={(e) => setSOFormData({...soFormData, shippingCountry: e.target.value})}
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="shipping-method">Shipping Method</Label>
                      <Select
                        value={soFormData.shippingMethod}
                        onValueChange={(value) => setSOFormData({...soFormData, shippingMethod: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select shipping method" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ex_works">Ex Works (EXW)</SelectItem>
                          <SelectItem value="fob">Free on Board (FOB)</SelectItem>
                          <SelectItem value="cif">Cost, Insurance & Freight (CIF)</SelectItem>
                          <SelectItem value="dap">Delivered at Place (DAP)</SelectItem>
                          <SelectItem value="ddp">Delivered Duty Paid (DDP)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Billing Address
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="billing-address">Address</Label>
                      <Textarea
                        id="billing-address"
                        placeholder="Street address"
                        value={soFormData.billingAddress}
                        onChange={(e) => setSOFormData({...soFormData, billingAddress: e.target.value})}
                        rows={2}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="billing-city">City</Label>
                        <Input
                          id="billing-city"
                          placeholder="City"
                          value={soFormData.billingCity}
                          onChange={(e) => setSOFormData({...soFormData, billingCity: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="billing-state">State/Province</Label>
                        <Input
                          id="billing-state"
                          placeholder="State"
                          value={soFormData.billingState}
                          onChange={(e) => setSOFormData({...soFormData, billingState: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="billing-postal">Postal Code</Label>
                        <Input
                          id="billing-postal"
                          placeholder="Postal code"
                          value={soFormData.billingPostalCode}
                          onChange={(e) => setSOFormData({...soFormData, billingPostalCode: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="billing-country">Country</Label>
                        <Input
                          id="billing-country"
                          placeholder="Country"
                          value={soFormData.billingCountry}
                          onChange={(e) => setSOFormData({...soFormData, billingCountry: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Ship className="h-4 w-4" />
                    Port Details
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="port-of-loading">Port of Loading</Label>
                      <Input
                        id="port-of-loading"
                        placeholder="e.g. Mumbai Port"
                        value={soFormData.portOfLoading}
                        onChange={(e) => setSOFormData({...soFormData, portOfLoading: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="port-of-discharge">Port of Discharge</Label>
                      <Input
                        id="port-of-discharge"
                        placeholder="e.g. Rotterdam Port"
                        value={soFormData.portOfDischarge}
                        onChange={(e) => setSOFormData({...soFormData, portOfDischarge: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Product Details
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="batch-number">Batch Number</Label>
                      <Input
                        id="batch-number"
                        placeholder="e.g. BATCH-2025-001"
                        value={soFormData.batchNumber}
                        onChange={(e) => setSOFormData({...soFormData, batchNumber: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="credit-period">Credit Period / Payment Terms</Label>
                      <Input
                        id="credit-period"
                        placeholder="e.g. Against BL, After Delivery, 30 Days"
                        value={soFormData.creditPeriod}
                        onChange={(e) => setSOFormData({...soFormData, creditPeriod: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="internal-notes">Internal Notes</Label>
                  <Textarea
                    id="internal-notes"
                    placeholder="Notes for internal reference (not visible to customer)"
                    value={soFormData.internalNotes}
                    onChange={(e) => setSOFormData({...soFormData, internalNotes: e.target.value})}
                    rows={2}
                  />
                </div>

                <div className="flex gap-2 justify-end pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowConvertToSODialog(false);
                      setSelectedQuoteForSO(null);
                      resetSOFormData();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleConvertToSO}
                    disabled={convertToSOMutation.isPending}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    {convertToSOMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <ShoppingCart className="h-4 w-4 mr-2" />
                    )}
                    Create Sales Order
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Send Sales Order Email Dialog */}
        {showSendSODialog && selectedSOToSend && (
          <Dialog open={showSendSODialog} onOpenChange={setShowSendSODialog}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Send className="h-5 w-5 text-purple-600" />
                  Send Sales Order to Customer
                </DialogTitle>
                <DialogDescription>
                  Compose an email to send Sales Order {selectedSOToSend.soNumber} to the customer
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="p-3 bg-purple-50 rounded-lg border border-purple-100">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium text-purple-900">{selectedSOToSend.soNumber}</div>
                      <div className="text-sm text-purple-700">
                        {selectedSOToSend.currency || 'USD'} {parseFloat(selectedSOToSend.totalAmount || 0).toLocaleString()}
                      </div>
                    </div>
                    <Badge className="bg-purple-100 text-purple-800">
                      PDF will be attached
                    </Badge>
                  </div>
                </div>

                <div>
                  <Label htmlFor="so-thread">Email Thread</Label>
                  <Select
                    value={selectedThreadForSO}
                    onValueChange={(value) => {
                      setSelectedThreadForSO(value);
                      // Auto-populate recipients when selecting a thread
                      if (value && value !== "new_thread") {
                        const thread = emailThreads?.find((t: any) => t.id.toString() === value);
                        if (thread) {
                          const lastMessage = thread.messages?.[thread.messages.length - 1];
                          if (lastMessage) {
                            const ourEmail = emailConfig?.companyEmail?.toLowerCase();
                            if (lastMessage.direction === 'outbound') {
                              const toEmails = (lastMessage.toEmails || []).filter((e: string) => e && e.toLowerCase() !== ourEmail);
                              if (toEmails.length > 0) setSOEmailTo(toEmails);
                            } else {
                              if (lastMessage.fromEmail) setSOEmailTo([lastMessage.fromEmail]);
                            }
                            const ccEmails = (lastMessage.ccEmails || []).filter((e: string) => e && e.toLowerCase() !== ourEmail);
                            setSOEmailCc(ccEmails);
                          }
                          // Auto-set subject with Re: prefix for replies
                          setSOEmailSubject(`Re: ${thread.subject || 'Sales Order'}`);
                        }
                      } else {
                        // Reset for new thread
                        const customerEmail = selectedSOToSend?.customerEmail || lead?.contactPerson?.email || lead?.company?.primaryEmail || '';
                        setSOEmailTo(customerEmail ? [customerEmail] : []);
                        setSOEmailCc([]);
                        const companyName = lead?.company?.companyName || lead?.companyName || 'Valued Customer';
                        setSOEmailSubject(`Sales Order ${selectedSOToSend?.soNumber} - ${companyName}`);
                      }
                    }}
                  >
                    <SelectTrigger data-testid="select-so-thread">
                      <SelectValue placeholder="Select thread or start new" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new_thread">
                        <span className="flex items-center gap-2">
                          <Plus className="h-4 w-4" />
                          Start New Email Thread
                        </span>
                      </SelectItem>
                      {emailThreads?.filter((thread: any) => thread.gmailThreadId || thread.threadId).map((thread: any) => (
                        <SelectItem key={thread.id} value={thread.id.toString()}>
                          {thread.subject || 'No Subject'} - {thread.customerEmail}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">
                    {selectedThreadForSO && selectedThreadForSO !== "new_thread" 
                      ? "The sales order PDF will be sent as a reply to this thread"
                      : "A new email conversation will be started with the customer"}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="so-email-to">To</Label>
                    <Input
                      id="so-email-to"
                      value={soEmailTo.join(', ')}
                      onChange={(e) => setSOEmailTo(e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                      placeholder="recipient@example.com"
                      data-testid="input-so-email-to"
                    />
                  </div>
                  <div>
                    <Label htmlFor="so-email-cc">CC (optional)</Label>
                    <Input
                      id="so-email-cc"
                      value={soEmailCc.join(', ')}
                      onChange={(e) => setSOEmailCc(e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                      placeholder="cc@example.com"
                      data-testid="input-so-email-cc"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="so-subject">Subject</Label>
                  <Input
                    id="so-subject"
                    value={soEmailSubject}
                    onChange={(e) => setSOEmailSubject(e.target.value)}
                    placeholder="Enter email subject"
                    disabled={selectedThreadForSO && selectedThreadForSO !== "new_thread"}
                    className={selectedThreadForSO && selectedThreadForSO !== "new_thread" ? "bg-gray-100" : ""}
                  />
                  {selectedThreadForSO && selectedThreadForSO !== "new_thread" && (
                    <p className="text-xs text-gray-500 mt-1">Subject is auto-set when replying to a thread</p>
                  )}
                </div>

                <div>
                  <Label>Message</Label>
                  <RichTextEditor
                    content={soEmailBody}
                    onChange={setSOEmailBody}
                    placeholder="Write your email here... Use the toolbar above for formatting."
                    minHeight="200px"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    The Sales Order PDF will be automatically attached to this email
                  </p>
                </div>

                <div className="flex gap-2 justify-end pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowSendSODialog(false);
                      setSelectedSOToSend(null);
                      setSOEmailSubject("");
                      setSOEmailBody("");
                      setSOEmailTo([]);
                      setSOEmailCc([]);
                      setSelectedThreadForSO("");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowSendSODialog(false);
                      toast({
                        title: "Sales Order Created",
                        description: "You can send it later from the Sales Orders page.",
                      });
                    }}
                  >
                    Send Later
                  </Button>
                  <Button
                    onClick={handleSendSO}
                    disabled={sendSalesOrderMutation.isPending}
                    className="bg-purple-600 hover:bg-purple-700"
                    data-testid="button-send-so"
                  >
                    {sendSalesOrderMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4 mr-2" />
                    )}
                    Send Sales Order
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  );
}
