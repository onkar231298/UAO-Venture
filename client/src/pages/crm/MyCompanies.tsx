import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { SalesLayout } from "@/components/layouts/SalesLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Building2, Search, List, Kanban, RefreshCw, Phone, Mail, MapPin, 
  Globe, Calendar, ExternalLink, User, Clock, ChevronDown, Send, CheckCircle, PhoneMissed,
  Reply, X, Plus, Eye
} from "lucide-react";
import EmailViewDialog from "@/components/EmailViewDialog";
import { Textarea } from "@/components/ui/textarea";
import RichTextEditor from "@/components/RichTextEditor";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DndContext, DragEndEvent, DragOverlay, useSensor, useSensors, PointerSensor, useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { format } from "date-fns";
import { CompanyNotes } from "@/components/crm/CompanyNotes";

interface CompanyActivity {
  id: number;
  companyId: number;
  activityType: string;
  subject: string;
  description: string | null;
  createdBy: string;
  createdAt: string;
}

function CompanyActivityTimeline({ companyId, filter, onClearFilter }: { companyId: number; filter?: 'email' | 'call' | null; onClearFilter?: () => void }) {
  const { data: activities, isLoading } = useQuery<CompanyActivity[]>({
    queryKey: ['/api/crm/companies', companyId, 'activities'],
    queryFn: async () => {
      const response = await fetch(`/api/crm/companies/${companyId}/activities`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch activities');
      return response.json();
    },
  });

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'email':
        return <Mail className="h-4 w-4 text-blue-600" />;
      case 'call':
        return <Phone className="h-4 w-4 text-green-600" />;
      case 'stage_change':
        return <RefreshCw className="h-4 w-4 text-purple-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const filteredActivities = filter 
    ? activities?.filter(a => a.activityType === filter) 
    : activities;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center justify-center py-6">
            <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!filteredActivities || filteredActivities.length === 0) {
    return (
      <Card>
        <CardContent className="pt-4">
          {filter && onClearFilter && (
            <div className="flex items-center justify-between mb-4 pb-2 border-b">
              <Badge variant="outline" className={filter === 'email' ? 'bg-blue-50 text-blue-700' : 'bg-green-50 text-green-700'}>
                {filter === 'email' ? 'Email History' : 'Call History'}
              </Badge>
              <Button variant="ghost" size="sm" onClick={onClearFilter}>
                Show All
              </Button>
            </div>
          )}
          <div className="text-center py-6 text-muted-foreground">
            <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No {filter ? `${filter} ` : ''}activities recorded yet</p>
            <p className="text-sm">Click email or phone to log activities</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-4">
        {filter && onClearFilter && (
          <div className="flex items-center justify-between mb-4 pb-2 border-b">
            <Badge variant="outline" className={filter === 'email' ? 'bg-blue-50 text-blue-700' : 'bg-green-50 text-green-700'}>
              {filter === 'email' ? 'Email History' : 'Call History'}
            </Badge>
            <Button variant="ghost" size="sm" onClick={onClearFilter}>
              Show All
            </Button>
          </div>
        )}
        <div className="space-y-4">
          {filteredActivities.map((activity) => (
            <div key={activity.id} className="flex gap-3 border-b last:border-b-0 pb-3 last:pb-0">
              <div className="flex-shrink-0 mt-1">
                {getActivityIcon(activity.activityType)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{activity.subject}</p>
                {activity.description && (
                  <p className="text-sm text-gray-600">{activity.description}</p>
                )}
                <p className="text-xs text-gray-400 mt-1">
                  {format(new Date(activity.createdAt), 'MMM d, yyyy h:mm a')}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

interface EmailThread {
  id: number;
  subject: string | null;
  lastMessageAt: string | null;
  messageCount: number;
  messages: EmailMessage[];
}

interface EmailMessage {
  id: number;
  direction: string;
  fromEmail: string;
  toEmails: string[];
  subject: string | null;
  bodyHtml: string | null;
  bodyText: string | null;
  sentAt: string | null;
  receivedAt: string | null;
}

function CompanyEmailsTab({ companyId, companyEmail }: { companyId: number; companyEmail: string | null }) {
  const { toast } = useToast();
  const [showCompose, setShowCompose] = useState(false);
  const [emailTo, setEmailTo] = useState(companyEmail || '');
  const [emailCc, setEmailCc] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [replyToThread, setReplyToThread] = useState<EmailThread | null>(null);
  const [selectedEmail, setSelectedEmail] = useState<EmailMessage | null>(null);
  const [selectedThread, setSelectedThread] = useState<EmailThread | null>(null);
  const [showEmailView, setShowEmailView] = useState(false);
  const [showThreadView, setShowThreadView] = useState(false);

  const { data: emailThreads = [], isLoading, refetch } = useQuery<EmailThread[]>({
    queryKey: ['/api/crm/companies', companyId, 'emails'],
    queryFn: async () => {
      const response = await fetch(`/api/crm/companies/${companyId}/emails`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch emails');
      return response.json();
    },
  });

  const sendEmailMutation = useMutation({
    mutationFn: async (data: { to: string; cc?: string; subject: string; bodyHtml: string; threadId?: number; isReply?: boolean }) => {
      return apiRequest(`/api/crm/companies/${companyId}/emails/send`, {
        method: 'POST',
        body: JSON.stringify({
          to: data.to,
          cc: data.cc ? data.cc.split(',').map(e => e.trim()).filter(Boolean) : [],
          subject: data.subject,
          bodyHtml: data.bodyHtml,
          bodyText: data.bodyHtml.replace(/<[^>]*>/g, ''),
          threadId: data.threadId,
          isReply: data.isReply,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/crm/companies', companyId, 'emails'] });
      queryClient.invalidateQueries({ queryKey: ['/api/crm/companies', companyId, 'activities'] });
      toast({
        title: "Email Sent",
        description: "Your email has been sent successfully",
      });
      setShowCompose(false);
      setEmailTo(companyEmail || '');
      setEmailCc('');
      setEmailSubject('');
      setEmailBody('');
      setReplyToThread(null);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Send",
        description: error.message || "Could not send email. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSendEmail = () => {
    if (!emailTo || !emailSubject || !emailBody) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all required fields (To, Subject, Message)",
        variant: "destructive",
      });
      return;
    }

    sendEmailMutation.mutate({
      to: emailTo,
      cc: emailCc,
      subject: emailSubject,
      bodyHtml: emailBody,
      threadId: replyToThread?.id,
      isReply: !!replyToThread,
    });
  };

  const handleReply = (thread: EmailThread) => {
    setReplyToThread(thread);
    setEmailTo(companyEmail || '');
    setEmailSubject(thread.subject?.startsWith('Re:') ? thread.subject : `Re: ${thread.subject || ''}`);
    setEmailBody('');
    setShowCompose(true);
  };

  const handleNewEmail = () => {
    setReplyToThread(null);
    setEmailTo(companyEmail || '');
    setEmailSubject('');
    setEmailBody('');
    setShowCompose(true);
  };

  const handleViewEmail = (email: EmailMessage, closeThreadFirst: boolean = false) => {
    if (closeThreadFirst) {
      setShowThreadView(false);
    }
    setSelectedEmail(email);
    setShowEmailView(true);
  };

  const handleViewThread = (thread: EmailThread) => {
    setSelectedThread(thread);
    setShowThreadView(true);
  };

  const handleReplyFromView = (email: EmailMessage) => {
    setShowEmailView(false);
    setShowThreadView(false);
    const thread = emailThreads.find(t => t.messages.some(m => m.id === email.id));
    if (thread) {
      handleReply(thread);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center justify-center py-6">
            <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {showCompose ? (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg flex items-center gap-2">
                <Mail className="h-5 w-5" />
                {replyToThread ? 'Reply to Email' : 'Compose New Email'}
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowCompose(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-sm font-medium">To</label>
              <Input
                value={emailTo}
                onChange={(e) => setEmailTo(e.target.value)}
                placeholder="recipient@example.com"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">CC (optional)</label>
              <Input
                value={emailCc}
                onChange={(e) => setEmailCc(e.target.value)}
                placeholder="cc@example.com, another@example.com"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Subject</label>
              <Input
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                placeholder="Email subject"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Message</label>
              <div className="mt-1 border rounded-md">
                <RichTextEditor
                  content={emailBody}
                  onChange={setEmailBody}
                  placeholder="Type your message here..."
                  minHeight="150px"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowCompose(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleSendEmail} 
                disabled={sendEmailMutation.isPending}
              >
                {sendEmailMutation.isPending ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Email
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email History
              </h3>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{emailThreads.length} thread{emailThreads.length !== 1 ? 's' : ''}</Badge>
                <Button variant="outline" size="sm" onClick={handleNewEmail}>
                  <Plus className="h-4 w-4 mr-1" />
                  Compose
                </Button>
              </div>
            </div>

            {emailThreads.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Mail className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="font-medium">No email history yet</p>
                <p className="text-sm mt-1">Click Compose to send your first email</p>
              </div>
            ) : (
              <div className="space-y-4">
                {emailThreads.map((thread) => (
                  <div key={thread.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start mb-2">
                      <p 
                        className="font-medium text-sm cursor-pointer hover:text-primary hover:underline"
                        onClick={() => handleViewThread(thread)}
                      >
                        {thread.subject || 'No Subject'}
                      </p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {thread.messageCount} message{thread.messageCount !== 1 ? 's' : ''}
                        </Badge>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleViewThread(thread)}
                          title="View Thread"
                          data-testid={`btn-view-thread-${thread.id}`}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleReply(thread)} 
                          title="Reply"
                          data-testid={`btn-reply-thread-${thread.id}`}
                        >
                          <Reply className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    {thread.lastMessageAt && (
                      <p className="text-xs text-gray-500">
                        Last message: {format(new Date(thread.lastMessageAt), 'MMM d, yyyy h:mm a')}
                      </p>
                    )}
                    {thread.messages && thread.messages.length > 0 && (
                      <div className="mt-3 space-y-2 border-t pt-3">
                        {thread.messages.slice(0, 3).map((email) => (
                          <div 
                            key={email.id} 
                            className="text-sm flex items-start gap-2 cursor-pointer hover:bg-gray-100 rounded p-1 -m-1"
                            onClick={() => handleViewEmail(email)}
                            data-testid={`email-preview-${email.id}`}
                          >
                            <Badge 
                              variant={email.direction === 'outbound' ? 'default' : 'secondary'}
                              className="text-xs shrink-0"
                            >
                              {email.direction === 'outbound' ? 'Sent' : 'Received'}
                            </Badge>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-gray-600">{email.subject}</p>
                              <p className="text-xs text-gray-400">
                                {email.sentAt 
                                  ? format(new Date(email.sentAt), 'MMM d, h:mm a')
                                  : email.receivedAt 
                                    ? format(new Date(email.receivedAt), 'MMM d, h:mm a')
                                    : ''}
                              </p>
                            </div>
                          </div>
                        ))}
                        {thread.messages.length > 3 && (
                          <Button 
                            variant="link" 
                            size="sm" 
                            className="w-full text-xs text-gray-500"
                            onClick={() => handleViewThread(thread)}
                            data-testid={`btn-view-all-messages-${thread.id}`}
                          >
                            View all {thread.messages.length} messages
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Email View Dialog */}
      <EmailViewDialog
        email={selectedEmail as any}
        open={showEmailView}
        onOpenChange={setShowEmailView}
        onReply={handleReplyFromView as any}
      />

      {/* Thread View Dialog */}
      <Dialog open={showThreadView} onOpenChange={setShowThreadView}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email Thread: {selectedThread?.subject || 'No Subject'}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto space-y-4 mt-4">
            {selectedThread?.messages?.map((email, index) => (
              <div 
                key={email.id} 
                className={`border rounded-lg p-4 ${email.direction === 'outbound' ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge variant={email.direction === 'outbound' ? 'default' : 'secondary'}>
                      {email.direction === 'outbound' ? 'Sent' : 'Received'}
                    </Badge>
                    <span className="text-sm font-medium">{email.fromEmail}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">
                      {email.sentAt 
                        ? format(new Date(email.sentAt), 'MMM d, yyyy h:mm a')
                        : email.receivedAt 
                          ? format(new Date(email.receivedAt), 'MMM d, yyyy h:mm a')
                          : ''}
                    </span>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleViewEmail(email, true)}
                      title="View Full Email"
                      data-testid={`btn-view-email-${email.id}`}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {email.toEmails && email.toEmails.length > 0 && (
                  <p className="text-xs text-gray-500 mb-2">
                    To: {email.toEmails.join(', ')}
                  </p>
                )}
                <div className="text-sm mt-2">
                  {email.bodyHtml ? (
                    <div 
                      className="prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: email.bodyHtml.substring(0, 500) + (email.bodyHtml.length > 500 ? '...' : '') }}
                    />
                  ) : (
                    <p className="text-gray-600 whitespace-pre-wrap">
                      {email.bodyText?.substring(0, 500) || 'No content'}
                      {(email.bodyText?.length || 0) > 500 ? '...' : ''}
                    </p>
                  )}
                </div>
                {((email.bodyHtml?.length || 0) > 500 || (email.bodyText?.length || 0) > 500) && (
                  <Button
                    variant="link"
                    size="sm"
                    className="mt-2 p-0 h-auto"
                    onClick={() => handleViewEmail(email, true)}
                    data-testid={`btn-read-full-email-${email.id}`}
                  >
                    Read full email
                  </Button>
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowThreadView(false)} data-testid="btn-close-thread-dialog">
              Close
            </Button>
            {selectedThread && (
              <Button onClick={() => { setShowThreadView(false); handleReply(selectedThread); }} data-testid="btn-reply-from-thread-dialog">
                <Reply className="h-4 w-4 mr-2" />
                Reply
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CompanyCallsTab({ companyId }: { companyId: number }) {
  const { toast } = useToast();
  const { data: callActivities = [], isLoading } = useQuery<CompanyActivity[]>({
    queryKey: ['/api/crm/companies', companyId, 'calls'],
    queryFn: async () => {
      const response = await fetch(`/api/crm/companies/${companyId}/calls`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch calls');
      return response.json();
    },
  });

  const logCallMutation = useMutation({
    mutationFn: async (data: { subject: string; description: string }) => {
      return apiRequest(`/api/crm/companies/${companyId}/activities`, {
        method: 'POST',
        body: JSON.stringify({
          activityType: 'call',
          subject: data.subject,
          description: data.description,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/crm/companies', companyId, 'calls'] });
      queryClient.invalidateQueries({ queryKey: ['/api/crm/companies', companyId, 'activities'] });
      toast({
        title: "Call Logged",
        description: "Call activity has been recorded",
      });
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center justify-center py-6">
            <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold flex items-center gap-2">
            <Phone className="h-4 w-4" />
            Call History
          </h3>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Phone className="h-4 w-4 mr-1" />
                Log Call
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => logCallMutation.mutate({ 
                subject: 'Call completed', 
                description: 'Successfully connected with contact' 
              })}>
                <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                Call Completed
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => logCallMutation.mutate({ 
                subject: 'No answer', 
                description: 'Call attempted but no answer' 
              })}>
                <PhoneMissed className="h-4 w-4 mr-2 text-orange-600" />
                No Answer
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => logCallMutation.mutate({ 
                subject: 'Left voicemail', 
                description: 'Left voicemail message' 
              })}>
                <Phone className="h-4 w-4 mr-2 text-blue-600" />
                Left Voicemail
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {callActivities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Phone className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">No call history yet</p>
            <p className="text-sm mt-1">Use the "Log Call" button to record calls</p>
          </div>
        ) : (
          <div className="space-y-3">
            {callActivities.map((call) => (
              <div key={call.id} className="flex items-start gap-3 p-3 border rounded-lg hover:bg-gray-50">
                <div className="p-2 rounded-full bg-green-100">
                  <Phone className="h-4 w-4 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{call.subject}</p>
                  {call.description && (
                    <p className="text-sm text-gray-600">{call.description}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    {format(new Date(call.createdAt), 'MMM d, yyyy h:mm a')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface Company {
  id: number;
  companyName: string;
  primaryEmail: string | null;
  primaryPhone: string | null;
  addressCity: string | null;
  addressCountry: string | null;
  origin: string | null;
  status: string | null;
  companyStage: string | null;
  priority: string | null;
  assignedTo: string | null;
  createdAt: string;
  lastContactDate: string | null;
  nextFollowUpDate: string | null;
  website: string | null;
}

const COMPANY_STAGES = [
  { id: "new", label: "New", color: "bg-gray-100 text-gray-800" },
  { id: "contacted", label: "Contacted", color: "bg-blue-100 text-blue-800" },
  { id: "engaged", label: "Engaged", color: "bg-cyan-100 text-cyan-800" },
  { id: "qualified", label: "Qualified", color: "bg-purple-100 text-purple-800" },
  { id: "customer", label: "Customer", color: "bg-green-100 text-green-800" },
  { id: "churned", label: "Churned", color: "bg-red-100 text-red-800" },
];

const PRIORITY_COLORS: Record<string, string> = {
  hot: "bg-red-100 text-red-800",
  warm: "bg-orange-100 text-orange-800",
  cold: "bg-blue-100 text-blue-800",
  normal: "bg-gray-100 text-gray-800",
};

interface DroppableColumnProps {
  id: string;
  children: React.ReactNode;
}

function DroppableColumn({ id, children }: DroppableColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div 
      ref={setNodeRef} 
      className={`flex flex-col min-w-[280px] sm:min-w-[300px] shrink-0 h-full transition-colors ${isOver ? 'bg-blue-50' : ''}`}
    >
      {children}
    </div>
  );
}

interface DraggableCompanyCardProps {
  company: Company;
  onClick: (company: Company) => void;
}

function DraggableCompanyCard({ company, onClick }: DraggableCompanyCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: company.id.toString() });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const priorityColor = PRIORITY_COLORS[company.priority || "normal"] || PRIORITY_COLORS.normal;

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card 
        className="cursor-move hover:shadow-lg transition-shadow mb-2" 
        data-testid={`card-company-${company.id}`}
        onClick={(e) => {
          e.stopPropagation();
          onClick(company);
        }}
      >
        <CardHeader className="p-3 pb-2">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-sm font-semibold truncate">
                {company.companyName}
              </CardTitle>
              {company.origin === 'website' && (
                <Badge variant="outline" className="mt-1 text-xs bg-green-50 text-green-700 border-green-200">
                  Website
                </Badge>
              )}
            </div>
            <Badge className={`text-xs ${priorityColor}`}>
              {company.priority || "normal"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-3 pt-0 space-y-1.5">
          {company.primaryEmail && (
            <div className="flex items-center text-xs text-gray-600 truncate">
              <Mail className="h-3 w-3 mr-1.5 shrink-0" />
              <span className="truncate">{company.primaryEmail}</span>
            </div>
          )}
          {company.primaryPhone && (
            <div className="flex items-center text-xs text-gray-600">
              <Phone className="h-3 w-3 mr-1.5 shrink-0" />
              {company.primaryPhone}
            </div>
          )}
          {(company.addressCity || company.addressCountry) && (
            <div className="flex items-center text-xs text-gray-600">
              <MapPin className="h-3 w-3 mr-1.5 shrink-0" />
              {[company.addressCity, company.addressCountry].filter(Boolean).join(", ")}
            </div>
          )}
          {company.nextFollowUpDate && (
            <div className="flex items-center text-xs text-amber-600 font-medium mt-2">
              <Calendar className="h-3 w-3 mr-1.5 shrink-0" />
              Follow up: {format(new Date(company.nextFollowUpDate), 'MMM dd')}
            </div>
          )}
          <div className="pt-2">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs h-7 w-full"
              onClick={(e) => {
                e.stopPropagation();
                onClick(company);
              }}
            >
              View Details
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function MyCompanies() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [stageFilter, setStageFilter] = useState("all");
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [dialogTab, setDialogTab] = useState<string>("info");
  const [activityFilter, setActivityFilter] = useState<'email' | 'call' | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const { data: companiesData, isLoading, refetch } = useQuery<{ companies: Company[] }>({
    queryKey: ['/api/crm/companies', { assignedTo: user?.id }],
  });

  const myCompanies = (companiesData?.companies || []).filter(
    (company) => company.assignedTo === user?.id
  );

  const updateStageMutation = useMutation({
    mutationFn: async ({ companyId, stage }: { companyId: number; stage: string }) => {
      return apiRequest(`/api/crm/companies/${companyId}`, {
        method: 'PATCH',
        body: JSON.stringify({ companyStage: stage }),
      });
    },
    onMutate: async ({ companyId, stage }) => {
      await queryClient.cancelQueries({ queryKey: ['/api/crm/companies'] });
      const previousData = queryClient.getQueryData<{ companies: Company[] }>(['/api/crm/companies', { assignedTo: user?.id }]);
      
      if (previousData) {
        queryClient.setQueryData<{ companies: Company[] }>(
          ['/api/crm/companies', { assignedTo: user?.id }],
          {
            ...previousData,
            companies: previousData.companies.map(c => 
              c.id === companyId ? { ...c, companyStage: stage } : c
            ),
          }
        );
      }
      
      return { previousData };
    },
    onSuccess: () => {
      toast({ title: "Company stage updated" });
    },
    onError: (error: any, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['/api/crm/companies', { assignedTo: user?.id }], context.previousData);
      }
      toast({ title: "Failed to update stage", description: error.message || "Please try again", variant: "destructive" });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/crm/companies'] });
    },
  });

  // Activity logging mutation
  const logActivityMutation = useMutation({
    mutationFn: async ({ companyId, activityType, subject, description }: { 
      companyId: number; 
      activityType: string; 
      subject: string; 
      description: string;
    }) => {
      return apiRequest(`/api/crm/companies/${companyId}/activities`, {
        method: 'POST',
        body: JSON.stringify({ activityType, subject, description }),
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/crm/companies', variables.companyId, 'activities'] });
    },
  });

  // Handler for email action
  const handleEmailAction = (company: Company) => {
    if (company.primaryEmail) {
      logActivityMutation.mutate({
        companyId: company.id,
        activityType: 'email',
        subject: 'Email Sent',
        description: `Initiated email to ${company.primaryEmail}`,
      });
      window.open(`mailto:${company.primaryEmail}`, '_blank');
    }
  };

  // Handler for call action
  const handleCallAction = (company: Company) => {
    if (company.primaryPhone) {
      logActivityMutation.mutate({
        companyId: company.id,
        activityType: 'call',
        subject: 'Call Made',
        description: `Initiated call to ${company.primaryPhone}`,
      });
      window.open(`tel:${company.primaryPhone}`, '_blank');
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
    toast({ title: "Data refreshed" });
  };

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const companyId = parseInt(active.id.toString());
    const newStage = over.id.toString();

    const company = myCompanies.find(c => c.id === companyId);
    if (!company || company.companyStage === newStage) return;

    updateStageMutation.mutate({ companyId, stage: newStage });
  };

  const filteredCompanies = myCompanies.filter((company) => {
    const matchesSearch = company.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (company.primaryEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    const matchesPriority = priorityFilter === "all" || company.priority === priorityFilter;
    const matchesStage = stageFilter === "all" || company.companyStage === stageFilter;
    return matchesSearch && matchesPriority && matchesStage;
  });

  const getCompaniesByStage = (stageId: string) => {
    return filteredCompanies.filter((company) => (company.companyStage || "new") === stageId);
  };

  const activeCompany = activeId ? myCompanies.find(c => c.id.toString() === activeId) : null;

  const stats = {
    total: myCompanies.length,
    new: myCompanies.filter(c => c.companyStage === 'new').length,
    engaged: myCompanies.filter(c => c.companyStage === 'engaged' || c.companyStage === 'qualified').length,
    customers: myCompanies.filter(c => c.companyStage === 'customer').length,
  };

  if (isLoading) {
    return (
      <SalesLayout title="My Companies" subtitle="Manage companies assigned to you">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </SalesLayout>
    );
  }

  return (
    <SalesLayout title="My Companies" subtitle="Manage companies assigned to you">
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-end gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              data-testid="button-refresh"
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>

            <div className="flex rounded-md border">
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="rounded-r-none"
                data-testid="button-view-list"
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'kanban' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('kanban')}
                className="rounded-l-none"
                data-testid="button-view-kanban"
              >
                <Kanban className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Total Assigned</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-blue-600">{stats.new}</div>
            <p className="text-xs text-muted-foreground">New Companies</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-purple-600">{stats.engaged}</div>
            <p className="text-xs text-muted-foreground">Engaged/Qualified</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-green-600">{stats.customers}</div>
            <p className="text-xs text-muted-foreground">Customers</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search companies..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            data-testid="input-search"
          />
        </div>

        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-[150px]" data-testid="select-priority">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            <SelectItem value="hot">Hot</SelectItem>
            <SelectItem value="warm">Warm</SelectItem>
            <SelectItem value="cold">Cold</SelectItem>
            <SelectItem value="normal">Normal</SelectItem>
          </SelectContent>
        </Select>

        <Select value={stageFilter} onValueChange={setStageFilter}>
          <SelectTrigger className="w-[150px]" data-testid="select-stage">
            <SelectValue placeholder="Stage" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stages</SelectItem>
            {COMPANY_STAGES.map(stage => (
              <SelectItem key={stage.id} value={stage.id}>{stage.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {viewMode === 'kanban' ? (
        <DndContext
          sensors={sensors}
          collisionDetection={(args) => {
            const { droppableContainers, active } = args;
            const containers = Array.from(droppableContainers);
            for (const container of containers) {
              const rect = container[1].rect.current;
              if (rect) {
                const pointerX = args.pointerCoordinates?.x ?? 0;
                const pointerY = args.pointerCoordinates?.y ?? 0;
                if (
                  pointerX >= rect.left &&
                  pointerX <= rect.right &&
                  pointerY >= rect.top &&
                  pointerY <= rect.bottom
                ) {
                  return [{ id: container[0] }];
                }
              }
            }
            return [];
          }}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="relative">
            <div className="overflow-x-auto pb-4">
              <div className="flex gap-4 min-w-max">
                {COMPANY_STAGES.map((stage) => {
                  const stageCompanies = getCompaniesByStage(stage.id);
                  return (
                    <DroppableColumn key={stage.id} id={stage.id}>
                      <Card className="h-full min-h-[500px] flex flex-col">
                        <CardHeader className="p-3 border-b">
                          <div className="flex items-center justify-between">
                            <Badge className={stage.color}>{stage.label}</Badge>
                            <span className="text-sm text-muted-foreground">{stageCompanies.length}</span>
                          </div>
                        </CardHeader>
                        <CardContent className="p-2 flex-1 overflow-y-auto">
                          <SortableContext
                            items={stageCompanies.map(c => c.id.toString())}
                            strategy={verticalListSortingStrategy}
                          >
                            {stageCompanies.length === 0 ? (
                              <div className="text-center py-8 text-muted-foreground text-sm">
                                No companies
                              </div>
                            ) : (
                              stageCompanies.map((company) => (
                                <DraggableCompanyCard
                                  key={company.id}
                                  company={company}
                                  onClick={setSelectedCompany}
                                />
                              ))
                            )}
                          </SortableContext>
                        </CardContent>
                      </Card>
                    </DroppableColumn>
                  );
                })}
              </div>
            </div>
          </div>

          <DragOverlay>
            {activeCompany && (
              <Card className="cursor-move shadow-xl w-[280px]">
                <CardHeader className="p-3 pb-2">
                  <CardTitle className="text-sm font-semibold">{activeCompany.companyName}</CardTitle>
                </CardHeader>
              </Card>
            )}
          </DragOverlay>
        </DndContext>
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left p-3 font-medium">Company</th>
                  <th className="text-left p-3 font-medium">Contact</th>
                  <th className="text-left p-3 font-medium">Location</th>
                  <th className="text-left p-3 font-medium">Stage</th>
                  <th className="text-left p-3 font-medium">Priority</th>
                  <th className="text-left p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCompanies.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                      No companies found
                    </td>
                  </tr>
                ) : (
                  filteredCompanies.map((company) => {
                    const stageInfo = COMPANY_STAGES.find(s => s.id === company.companyStage) || COMPANY_STAGES[0];
                    return (
                      <tr 
                        key={company.id} 
                        className="border-b hover:bg-gray-50 cursor-pointer"
                        onClick={() => setSelectedCompany(company)}
                        data-testid={`row-company-${company.id}`}
                      >
                        <td className="p-3">
                          <div className="font-medium">{company.companyName}</div>
                          {company.origin === 'website' && (
                            <Badge variant="outline" className="text-xs bg-green-50 text-green-700 mt-1">
                              Website
                            </Badge>
                          )}
                        </td>
                        <td className="p-3">
                          <div className="text-sm">{company.primaryEmail || '-'}</div>
                          <div className="text-xs text-gray-500">{company.primaryPhone || '-'}</div>
                        </td>
                        <td className="p-3 text-sm">
                          {[company.addressCity, company.addressCountry].filter(Boolean).join(", ") || '-'}
                        </td>
                        <td className="p-3">
                          <Badge className={stageInfo.color}>{stageInfo.label}</Badge>
                        </td>
                        <td className="p-3">
                          <Badge className={PRIORITY_COLORS[company.priority || "normal"]}>
                            {company.priority || "normal"}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedCompany(company);
                            }}
                          >
                            View
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      <Dialog open={!!selectedCompany} onOpenChange={(open) => {
        if (!open) {
          setSelectedCompany(null);
          setDialogTab("info");
          setActivityFilter(null);
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              {selectedCompany?.companyName}
            </DialogTitle>
          </DialogHeader>

          {selectedCompany && (
            <Tabs value={dialogTab} onValueChange={setDialogTab} className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="info">Info</TabsTrigger>
                <TabsTrigger value="emails" className="flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  Emails
                </TabsTrigger>
                <TabsTrigger value="calls" className="flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  Calls
                </TabsTrigger>
                <TabsTrigger value="notes">Notes</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
              </TabsList>

              <TabsContent value="info" className="space-y-4 mt-4">
                {/* Company Information Section */}
                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Company Information
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Company Name</p>
                        <p className="font-medium">{selectedCompany.companyName}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Industry</p>
                        <p className="font-medium">N/A</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Website</p>
                        <p className="font-medium">
                          {selectedCompany.website ? (
                            <a href={selectedCompany.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                              {selectedCompany.website}
                            </a>
                          ) : "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Location</p>
                        <p className="font-medium">
                          {[selectedCompany.addressCity, selectedCompany.addressCountry].filter(Boolean).join(", ") || "N/A"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Primary Contact Section */}
                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Primary Contact
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Contact Name</p>
                        <p className="font-medium">N/A</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Designation</p>
                        <p className="font-medium">N/A</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <p className="font-medium">
                          {selectedCompany.primaryEmail ? (
                            <a 
                              href={`mailto:${selectedCompany.primaryEmail}`} 
                              className="text-blue-600 hover:underline"
                              onClick={(e) => {
                                e.preventDefault();
                                handleEmailAction(selectedCompany);
                              }}
                            >
                              {selectedCompany.primaryEmail}
                            </a>
                          ) : "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Phone</p>
                        <p className="font-medium">
                          {selectedCompany.primaryPhone ? (
                            <a 
                              href={`tel:${selectedCompany.primaryPhone}`} 
                              className="text-blue-600 hover:underline"
                              onClick={(e) => {
                                e.preventDefault();
                                handleCallAction(selectedCompany);
                              }}
                            >
                              {selectedCompany.primaryPhone}
                            </a>
                          ) : "N/A"}
                        </p>
                      </div>
                    </div>

                    {/* Quick Action Buttons */}
                    <div className="mt-4 pt-4 border-t flex gap-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" className="flex items-center gap-1">
                            <Mail className="h-4 w-4" />
                            Email
                            <ChevronDown className="h-3 w-3 ml-1" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem 
                            onClick={() => {
                              if (selectedCompany.primaryEmail) {
                                window.open(`mailto:${selectedCompany.primaryEmail}`, '_blank');
                                logActivityMutation.mutate({
                                  companyId: selectedCompany.id,
                                  activityType: 'email',
                                  subject: 'Opened email client',
                                  description: `Opened email to ${selectedCompany.primaryEmail}`,
                                });
                              }
                            }}
                            disabled={!selectedCompany.primaryEmail}
                          >
                            <Mail className="h-4 w-4 mr-2" />
                            Open Email Client
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => {
                              logActivityMutation.mutate({
                                companyId: selectedCompany.id,
                                activityType: 'email',
                                subject: 'Email sent',
                                description: `Sent email to company`,
                              });
                              toast({
                                title: "Activity Logged",
                                description: "Email activity has been recorded",
                              });
                            }}
                          >
                            <Send className="h-4 w-4 mr-2" />
                            Log Email Sent
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => {
                              setActivityFilter('email');
                              setDialogTab('activity');
                            }}
                          >
                            <Clock className="h-4 w-4 mr-2" />
                            View Email History
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" className="flex items-center gap-1">
                            <Phone className="h-4 w-4" />
                            Call
                            <ChevronDown className="h-3 w-3 ml-1" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem 
                            onClick={() => {
                              if (selectedCompany.primaryPhone) {
                                window.open(`tel:${selectedCompany.primaryPhone}`, '_blank');
                                logActivityMutation.mutate({
                                  companyId: selectedCompany.id,
                                  activityType: 'call',
                                  subject: 'Made phone call',
                                  description: `Called ${selectedCompany.primaryPhone}`,
                                });
                              }
                            }}
                            disabled={!selectedCompany.primaryPhone}
                          >
                            <Phone className="h-4 w-4 mr-2" />
                            Dial Number
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => {
                              logActivityMutation.mutate({
                                companyId: selectedCompany.id,
                                activityType: 'call',
                                subject: 'Phone call completed',
                                description: `Logged call with company`,
                              });
                              toast({
                                title: "Activity Logged",
                                description: "Call activity has been recorded",
                              });
                            }}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Log Call Completed
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => {
                              logActivityMutation.mutate({
                                companyId: selectedCompany.id,
                                activityType: 'call',
                                subject: 'No answer',
                                description: `Called but no answer`,
                              });
                              toast({
                                title: "Activity Logged",
                                description: "Call attempt recorded",
                              });
                            }}
                          >
                            <PhoneMissed className="h-4 w-4 mr-2" />
                            Log No Answer
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => {
                              setActivityFilter('call');
                              setDialogTab('activity');
                            }}
                          >
                            <Clock className="h-4 w-4 mr-2" />
                            View Call History
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>

                {/* Stage & Origin Section */}
                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Status Information
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Stage</p>
                        <div className="mt-1">
                          <Select 
                            value={selectedCompany.companyStage || 'new'}
                            onValueChange={(value) => {
                              updateStageMutation.mutate({ companyId: selectedCompany.id, stage: value });
                              setSelectedCompany({ ...selectedCompany, companyStage: value });
                            }}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {COMPANY_STAGES.map(stage => (
                                <SelectItem key={stage.id} value={stage.id}>
                                  {stage.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Origin</p>
                        <p className="font-medium mt-1">
                          {selectedCompany.origin === 'website' ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700">Website Registration</Badge>
                          ) : (
                            <Badge variant="outline">Manual Entry</Badge>
                          )}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="emails" className="mt-4">
                <CompanyEmailsTab companyId={selectedCompany.id} companyEmail={selectedCompany.primaryEmail} />
              </TabsContent>

              <TabsContent value="calls" className="mt-4">
                <CompanyCallsTab companyId={selectedCompany.id} />
              </TabsContent>

              <TabsContent value="notes" className="mt-4">
                <CompanyNotes 
                  companyId={selectedCompany.id} 
                  currentUserId={user?.id || ''} 
                />
              </TabsContent>

              <TabsContent value="activity" className="mt-4">
                <CompanyActivityTimeline 
                  companyId={selectedCompany.id} 
                  filter={activityFilter}
                  onClearFilter={() => setActivityFilter(null)}
                />
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
      </div>
    </SalesLayout>
  );
}
