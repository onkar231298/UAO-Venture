import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Mail, Send, Reply, Paperclip, Download, Calendar, User } from "lucide-react";
import { format } from "date-fns";

interface EmailMessage {
  id: number;
  direction: 'inbound' | 'outbound';
  fromEmail: string;
  fromName?: string;
  toEmails: string[];
  ccEmails?: string[];
  subject: string;
  bodyHtml?: string;
  bodyText?: string;
  sentAt?: string;
  receivedAt?: string;
  status?: string;
  attachments?: Array<{
    id: number;
    fileName: string;
    fileSize: number;
    fileUrl?: string;
  }>;
}

interface EmailViewDialogProps {
  email: EmailMessage | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReply?: (email: EmailMessage) => void;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export default function EmailViewDialog({ email, open, onOpenChange, onReply }: EmailViewDialogProps) {
  if (!email) return null;

  const emailDate = email.direction === 'outbound' 
    ? email.sentAt 
    : email.receivedAt;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-2">
            {email.direction === 'outbound' ? (
              <Send className="h-5 w-5 text-blue-600" />
            ) : (
              <Reply className="h-5 w-5 text-green-600" />
            )}
            <DialogTitle className="text-xl">{email.subject}</DialogTitle>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-auto">
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div className="flex items-start gap-2">
                  <User className="h-4 w-4 mt-0.5 text-gray-500" />
                  <div>
                    <span className="text-gray-600">From:</span>
                    <p className="font-medium">
                      {email.fromName ? `${email.fromName} <${email.fromEmail}>` : email.fromEmail}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-2">
                  <Calendar className="h-4 w-4 mt-0.5 text-gray-500" />
                  <div>
                    <span className="text-gray-600">Date:</span>
                    <p className="font-medium">
                      {emailDate ? format(new Date(emailDate), 'MMMM d, yyyy h:mm a') : 'N/A'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-2">
                  <Mail className="h-4 w-4 mt-0.5 text-gray-500" />
                  <div>
                    <span className="text-gray-600">To:</span>
                    <p className="font-medium">{email.toEmails?.join(', ') || 'N/A'}</p>
                  </div>
                </div>

                {email.ccEmails && email.ccEmails.length > 0 && (
                  <div className="flex items-start gap-2">
                    <Mail className="h-4 w-4 mt-0.5 text-gray-500" />
                    <div>
                      <span className="text-gray-600">CC:</span>
                      <p className="font-medium">{email.ccEmails.join(', ')}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 mt-3">
                <Badge 
                  variant={email.direction === 'outbound' ? 'default' : 'secondary'}
                >
                  {email.direction === 'outbound' ? 'Sent' : 'Received'}
                </Badge>
                {email.status && (
                  <Badge 
                    variant={email.status === 'sent' ? 'default' : email.status === 'failed' ? 'destructive' : 'secondary'}
                  >
                    {email.status}
                  </Badge>
                )}
              </div>
            </div>

            {email.attachments && email.attachments.length > 0 && (
              <div className="border rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Paperclip className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium">
                    Attachments ({email.attachments.length})
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {email.attachments.map((attachment) => (
                    <a
                      key={attachment.id}
                      href={attachment.fileUrl || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                      data-testid={`attachment-${attachment.id}`}
                    >
                      <Paperclip className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">{attachment.fileName}</span>
                      <span className="text-xs text-gray-500">
                        ({formatFileSize(attachment.fileSize)})
                      </span>
                      <Download className="h-4 w-4 text-gray-400" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            <Separator />

            <div 
              className="prose prose-sm max-w-none email-content"
              dangerouslySetInnerHTML={{ 
                __html: email.bodyHtml || email.bodyText?.replace(/\n/g, '<br>') || '' 
              }}
              data-testid="email-body-content"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {onReply && (
            <Button onClick={() => {
              onReply(email);
              onOpenChange(false);
            }} data-testid="button-reply-email">
              <Reply className="h-4 w-4 mr-1" />
              Reply
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
