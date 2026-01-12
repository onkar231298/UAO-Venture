import { useState, useRef } from "react";
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
import { Mail, Plus, RefreshCw, X, Send, Eye, Reply, Paperclip, Loader2, CheckCircle } from "lucide-react";
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

interface EmailAttachment {
  file: File;
  name: string;
  size: number;
  uploading?: boolean;
  uploadedUrl?: string;
}

interface CompanyEmailsTabProps {
  companyId: number;
  companyEmail: string | null;
}

export function CompanyEmailsTab({ companyId, companyEmail }: CompanyEmailsTabProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
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
  const [attachments, setAttachments] = useState<EmailAttachment[]>([]);

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
    mutationFn: async (data: { to: string; cc?: string; subject: string; bodyHtml: string; threadId?: number; isReply?: boolean; attachments?: Array<{ fileName: string; fileUrl: string; fileSize: number }> }) => {
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
          attachments: data.attachments,
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
      setAttachments([]);
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

    const uploadedAttachments = attachments
      .filter(att => att.uploadedUrl)
      .map(att => ({
        fileName: att.name,
        fileUrl: att.uploadedUrl!,
        fileSize: att.size,
      }));

    sendEmailMutation.mutate({
      to: emailTo,
      cc: emailCc,
      subject: emailSubject,
      bodyHtml: emailBody,
      threadId: replyToThread?.id,
      isReply: !!replyToThread,
      attachments: uploadedAttachments.length > 0 ? uploadedAttachments : undefined,
    });
  };

  const uploadAttachment = async (file: File): Promise<string | null> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/email-attachments/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Upload failed');
      }
      
      const data = await response.json();
      return data.url;
    } catch (error: any) {
      console.error('Attachment upload failed:', error);
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload attachment",
        variant: "destructive",
      });
      return null;
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newAttachments: EmailAttachment[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 25 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: `${file.name} exceeds 25MB limit`,
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
    
    setAttachments(prev => [...prev, ...newAttachments]);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    for (const att of newAttachments) {
      const uploadedUrl = await uploadAttachment(att.file);
      
      setAttachments(prev => {
        const updated = [...prev];
        const attIndex = updated.findIndex(a => a.file === att.file && a.name === att.name);
        if (attIndex !== -1) {
          if (uploadedUrl) {
            updated[attIndex] = { ...updated[attIndex], uploading: false, uploadedUrl };
          } else {
            updated.splice(attIndex, 1);
          }
        }
        return updated;
      });
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleReply = (thread: EmailThread) => {
    setReplyToThread(thread);
    setEmailTo(companyEmail || '');
    setEmailSubject(thread.subject?.startsWith('Re:') ? thread.subject : `Re: ${thread.subject || ''}`);
    setEmailBody('');
    setAttachments([]);
    setShowCompose(true);
  };

  const handleNewEmail = () => {
    setReplyToThread(null);
    setEmailTo(companyEmail || '');
    setEmailSubject('');
    setEmailBody('');
    setAttachments([]);
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
            <div>
              <div className="flex items-center gap-2 mb-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
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
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowCompose(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleSendEmail} 
                disabled={sendEmailMutation.isPending || attachments.some(a => a.uploading)}
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
