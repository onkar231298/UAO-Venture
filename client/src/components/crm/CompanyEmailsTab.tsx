import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Mail, Plus, RefreshCw, X, Send, Eye, Reply } from "lucide-react";
import { format } from "date-fns";
import RichTextEditor from "@/components/RichTextEditor";
import EmailViewDialog from "@/components/EmailViewDialog";

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

interface CompanyEmailsTabProps {
  companyId: number;
  companyEmail: string | null;
}

export function CompanyEmailsTab({ companyId, companyEmail }: CompanyEmailsTabProps) {
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

      <EmailViewDialog
        email={selectedEmail as any}
        open={showEmailView}
        onOpenChange={setShowEmailView}
        onReply={handleReplyFromView as any}
      />

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
