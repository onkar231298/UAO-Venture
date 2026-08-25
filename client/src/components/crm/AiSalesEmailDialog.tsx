import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Check, Globe2, Loader2, Mail, RefreshCw, Send, Sparkles } from "lucide-react";

export type AiEmailMode = "cold" | "reply" | "follow_up";
interface AiEmailMessage { fromEmail?: string | null; toEmails?: string[] | null; ccEmails?: string[] | null; bccEmails?: string[] | null; }
export interface AiEmailThread { id: number; subject: string | null; participantEmails?: string[] | null; lastMessageAt?: string | null; messageCount?: number; messages?: AiEmailMessage[]; }
interface AiContact { id: number; name: string; email: string; designation?: string | null; role?: string | null; isPrimary?: boolean; }
interface AiProduct { id: number; name: string; }
interface ContextResponse { company: { id: number; name: string; website?: string | null; primaryEmail?: string | null }; contacts: AiContact[]; products: AiProduct[]; }
interface DraftResponse { subject: string; bodyText: string; recommendedProducts: AiProduct[]; selectedProductIds: number[]; sourceSummary?: string[]; website?: { status?: string; url?: string; message?: string; pages?: number }; websiteProductMatches?: Array<{ productId: number; productName: string; evidence: string }>; }
export interface AiSalesEmailDialogProps {
  companyId: number;
  companyName?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialMode?: AiEmailMode;
  initialRecipientEmail?: string;
  initialContactId?: number;
  initialThreadId?: number;
}

const labels: Record<AiEmailMode, string> = { cold: "Cold outreach", reply: "Reply", follow_up: "Follow-up" };
const escapeHtml = (text: string) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;").replace(/\n/g, "<br />");

export function AiSalesEmailDialog({ companyId, companyName, open, onOpenChange, initialMode = "cold", initialRecipientEmail = "", initialContactId, initialThreadId }: AiSalesEmailDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<AiEmailMode>(initialMode);
  const [recipientEmail, setRecipientEmail] = useState(initialRecipientEmail);
  const [threadId, setThreadId] = useState<string>(initialThreadId ? String(initialThreadId) : "");
  const [manualProductIds, setManualProductIds] = useState<number[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [instruction, setInstruction] = useState("");
  const [subject, setSubject] = useState("");
  const [bodyText, setBodyText] = useState("");
  const [draft, setDraft] = useState<DraftResponse | null>(null);
  const [followUpAt, setFollowUpAt] = useState("");

  const { data: context, isLoading: contextLoading, isError: contextError } = useQuery<ContextResponse>({
    queryKey: ["/api/crm/companies", companyId, "ai-context"],
    queryFn: async () => (await apiRequest(`/api/crm/companies/${companyId}/emails/ai-context`)).json(),
    enabled: open,
  });
  const { data: threads = [], isLoading: threadsLoading } = useQuery<AiEmailThread[]>({
    queryKey: ["/api/crm/companies", companyId, "emails"],
    queryFn: async () => (await apiRequest(`/api/crm/companies/${companyId}/emails`)).json(),
    enabled: open && mode !== "cold",
  });
  useEffect(() => {
    if (!open) return;
    setMode(initialMode);
    setRecipientEmail(initialRecipientEmail); setThreadId(initialThreadId ? String(initialThreadId) : "");
    setDraft(null); setSubject(""); setBodyText(""); setManualProductIds([]); setProductSearch(""); setInstruction(""); setFollowUpAt("");
  }, [open, initialMode, initialRecipientEmail, initialContactId, initialThreadId]);
  const selectedContact = context?.contacts.find(c => c.email.toLowerCase() === recipientEmail.toLowerCase());
  const selectedThread = threads.find(thread => String(thread.id) === threadId);
  const recipientOptions = useMemo(() => {
    if (!context) return [];
    const all = [
      ...(context.company.primaryEmail ? [{ email: context.company.primaryEmail, name: `${context.company.name} primary email`, contactId: undefined as number | undefined }] : []),
      ...context.contacts.map(contact => ({ email: contact.email, name: contact.name, contactId: contact.id })),
    ];
    const unique = Array.from(new Map(all.map(option => [option.email.trim().toLowerCase(), option])).values());
    if (mode === "cold" || !selectedThread) return unique;
    const threadEmails = new Set<string>();
    const add = (value?: string | null) => { if (value) threadEmails.add(value.trim().toLowerCase()); };
    for (const email of selectedThread.participantEmails || []) add(email);
    for (const message of selectedThread.messages || []) {
      add(message.fromEmail);
      for (const email of message.toEmails || []) add(email);
      for (const email of message.ccEmails || []) add(email);
      for (const email of message.bccEmails || []) add(email);
    }
    return unique.filter(option => threadEmails.has(option.email.trim().toLowerCase()));
  }, [context, mode, selectedThread]);
  useEffect(() => {
    if (!open || mode === "cold" || !selectedThread) return;
    const currentIsCompatible = recipientOptions.some(option => option.email.toLowerCase() === recipientEmail.toLowerCase());
    if (!currentIsCompatible) setRecipientEmail(recipientOptions.length === 1 ? recipientOptions[0].email : "");
  }, [open, mode, selectedThread, recipientOptions, recipientEmail]);
  const visibleProducts = useMemo(() => {
    const search = productSearch.trim().toLowerCase();
    return (context?.products || []).filter(product =>
      manualProductIds.includes(product.id) || (!!search && product.name.toLowerCase().includes(search))
    );
  }, [context, manualProductIds, productSearch]);
  const toggleProduct = (id: number) => {
    setManualProductIds(ids => ids.includes(id) ? ids.filter(productId => productId !== id) : [...ids, id].slice(0, 3));
    if (draft) {
      setDraft(null);
      setSubject("");
      setBodyText("");
    }
  };
  const generateMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest(`/api/crm/companies/${companyId}/emails/ai-draft`, { method: "POST", body: JSON.stringify({
        mode, contactId: selectedContact?.id, recipientEmail: recipientEmail || undefined,
        threadId: threadId ? Number(threadId) : undefined,
        productIds: manualProductIds.length ? manualProductIds : undefined,
        instruction: instruction || undefined,
      })});
      return response.json() as Promise<DraftResponse>;
    },
    onSuccess: (result) => { setDraft(result); setSubject(result.subject || ""); setBodyText(result.bodyText || ""); },
  });
  const sendMutation = useMutation({
    mutationFn: async () => {
      const sent = await apiRequest(`/api/crm/companies/${companyId}/emails/ai-send`, { method: "POST", body: JSON.stringify({
        to: recipientEmail, subject, bodyHtml: escapeHtml(bodyText), bodyText,
        productIds: draft?.recommendedProducts?.map(product => product.id) || [],
        threadId: threadId ? Number(threadId) : undefined,
        isReply: mode !== "cold",
      })});
      const result = await sent.json() as { warning?: string; reminderWarning?: string };
      if (followUpAt) {
        try {
          await apiRequest(`/api/crm/companies/${companyId}/tasks`, {
            method: "POST",
            body: JSON.stringify({
              taskType: "follow_up",
              title: `Follow up on email: ${subject}`.slice(0, 255),
              description: `Follow up with ${recipientEmail} after the reviewed one-to-one email.`,
              dueDate: new Date(followUpAt).toISOString(),
              priority: "medium",
              status: "pending",
            }),
          });
        } catch {
          result.reminderWarning = "The email was sent, but the follow-up reminder could not be created.";
        }
      }
      return result;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm/companies", companyId, "emails"] });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/companies", companyId, "activities"] });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/companies", companyId, "tasks"] });
      const warning = result.warning || result.reminderWarning;
      toast({ title: warning ? "Email sent with a warning" : "Email sent", description: warning || (followUpAt ? "Your reviewed email was sent and the follow-up reminder was scheduled." : "Your reviewed email was sent successfully.") });
      onOpenChange(false);
    },
    onError: (error: Error) => toast({ title: "Could not send email", description: error.message, variant: "destructive" }),
  });
  const canGenerate = !!recipientEmail && (mode === "cold" || !!threadId) && !generateMutation.isPending;
  const canSend = !!recipientEmail && !!subject.trim() && !!bodyText.trim() && (mode === "cold" || !!threadId) && !sendMutation.isPending;
  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-amber-600" /> AI sales email</DialogTitle>
        <DialogDescription>{companyName || context?.company.name || "Company"} · research aide, always review before sending</DialogDescription>
      </DialogHeader>
      {contextLoading ? <div className="py-12 text-center text-muted-foreground"><Loader2 className="mx-auto mb-3 h-6 w-6 animate-spin" /><p>Gathering company context…</p></div> :
       contextError ? <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800">Company context could not be loaded. Close and try again.</div> :
       <div className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-3">
          {(Object.keys(labels) as AiEmailMode[]).map(value => <Button key={value} type="button" variant={mode === value ? "default" : "outline"} className="justify-start" onClick={() => { setMode(value); setDraft(null); }}><Mail className="mr-2 h-4 w-4" />{labels[value]}</Button>)}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium">Contact
            <select value={recipientEmail} onChange={e => setRecipientEmail(e.target.value)} className="mt-1 flex h-10 w-full rounded-md border bg-background px-3 text-sm">
              <option value="">Choose a contact</option>{recipientOptions.map(option => <option key={option.email} value={option.email}>{option.name}</option>)}
            </select>
          </label>
          <label className="text-sm font-medium">Recipient email
            <Input className="mt-1 bg-muted/40" value={recipientEmail} readOnly placeholder="Choose a company contact" type="email" />
          </label>
        </div>
        {mode !== "cold" && <label className="text-sm font-medium">Thread <span className="text-red-600">*</span>
          <select value={threadId} onChange={e => { setThreadId(e.target.value); setDraft(null); }} className="mt-1 flex h-10 w-full rounded-md border bg-background px-3 text-sm">
            <option value="">Choose a thread</option>{threads.map(t => <option key={t.id} value={t.id}>{t.subject || "No subject"} · {t.messageCount || t.messages?.length || 0} messages</option>)}
          </select>{threadsLoading && <span className="text-xs text-muted-foreground">Loading threads…</span>}{selectedThread && !recipientOptions.length && <span className="block text-xs text-red-700">No active company contact matches this thread.</span>}
        </label>}
         <div className="rounded-lg border bg-amber-50/50 p-3">
           <div className="flex items-center gap-2 text-sm font-medium"><Globe2 className="h-4 w-4 text-amber-700" /> Company product matching <span className="text-xs font-normal text-muted-foreground">automatic</span></div>
           <p className="mt-1 text-xs text-muted-foreground">Leave this empty to use only exact product variants found on the prospect website. A manual Bright Fame catalog selection overrides automatic matching and will be named in the email.</p>
           <Input value={productSearch} onChange={e => setProductSearch(e.target.value)} placeholder="Optional: search Bright Fame catalog…" className="mt-2 bg-background" />
            <div className="mt-2 flex max-h-24 flex-wrap gap-2 overflow-y-auto">{visibleProducts.length ? visibleProducts.map(p => <button type="button" key={p.id} disabled={!manualProductIds.includes(p.id) && manualProductIds.length >= 3} onClick={() => toggleProduct(p.id)} className={`rounded-full border px-2.5 py-1 text-xs disabled:cursor-not-allowed disabled:opacity-40 ${manualProductIds.includes(p.id) ? "border-amber-700 bg-amber-100 text-amber-900" : "bg-background"}`}>{manualProductIds.includes(p.id) && <Check className="mr-1 inline h-3 w-3" />}{p.name}</button>) : <span className="text-xs text-muted-foreground">{productSearch.trim() ? "No matching Bright Fame products." : "No manual product override selected."}</span>}</div>
            <p className="mt-2 text-xs text-muted-foreground">{manualProductIds.length}/3 manual products selected</p>
        </div>
        <label className="text-sm font-medium">Brief instruction <span className="font-normal text-muted-foreground">(optional)</span><Textarea value={instruction} onChange={e => setInstruction(e.target.value)} className="mt-1" rows={2} placeholder={mode === "cold" ? "Add any special emphasis for this long-form outreach…" : "Add any specific point to address in this conversation…"} /></label>
        <div className="flex items-center justify-between border-t pt-4"><div className="text-xs text-muted-foreground">{selectedContact ? `Writing to ${selectedContact.name}` : "Select a recipient, then generate a draft."}</div><Button onClick={() => generateMutation.mutate()} disabled={!canGenerate}><RefreshCw className={`mr-2 h-4 w-4 ${generateMutation.isPending ? "animate-spin" : ""}`} />{draft ? "Regenerate" : "Generate draft"}</Button></div>
         {generateMutation.isError && <p className="text-sm text-red-700">{(generateMutation.error as Error)?.message || "Draft generation failed. Check the recipient and try again."}</p>}
        {draft && <div className="space-y-4 rounded-lg border border-slate-200 bg-slate-50/70 p-4">
          <div className="flex flex-wrap items-center gap-2"><Badge variant="secondary">Draft ready for review</Badge>{draft.recommendedProducts?.map(p => <Badge key={p.id} variant="outline">Included: {p.name}</Badge>)}</div>
           {draft.sourceSummary?.length ? <div className="flex flex-wrap gap-1.5">{draft.sourceSummary.map(source => <Badge key={source} variant="outline" className="font-normal">{source}</Badge>)}</div> : null}
          {draft.website?.message && <p className="text-xs text-amber-800">{draft.website.message}</p>}
           {draft.websiteProductMatches?.length ? <div className="space-y-1 text-xs text-emerald-800"><p className="font-medium">Exact Bright Fame catalog variants matched on the prospect website:</p>{draft.websiteProductMatches.map(match => <p key={match.productId}><span className="font-medium">{match.productName}</span> — “…{match.evidence.slice(0, 180)}…”</p>)}</div> : draft.website?.status === "fetched" ? <p className="text-xs text-amber-800">No exact spice or herb product variant was found on the scanned website pages. The AI will not add a product unless you select one manually.</p> : null}
          <label className="text-sm font-medium">Subject<Input value={subject} onChange={e => setSubject(e.target.value)} className="mt-1 bg-background" /></label>
          <label className="text-sm font-medium">Message<Textarea value={bodyText} onChange={e => setBodyText(e.target.value)} className="mt-1 min-h-[220px] bg-background font-mono text-sm leading-6" /></label>
           <label className="text-sm font-medium">Follow-up reminder <span className="font-normal text-muted-foreground">(optional)</span><Input type="datetime-local" value={followUpAt} min={new Date().toISOString().slice(0, 16)} onChange={e => setFollowUpAt(e.target.value)} className="mt-1 max-w-xs bg-background" /></label>
          <div className="flex flex-col-reverse gap-2 border-t pt-3 sm:flex-row sm:justify-end"><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button onClick={() => sendMutation.mutate()} disabled={!canSend}><Send className="mr-2 h-4 w-4" />{sendMutation.isPending ? "Sending…" : "Review complete · Send"}</Button></div>
        </div>}
       </div>}
    </DialogContent>
  </Dialog>;
}