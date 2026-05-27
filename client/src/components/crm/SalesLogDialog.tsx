import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Phone, Mail, X, Loader2 } from "lucide-react";

interface Contact {
  id: number;
  contactName: string;
  phone: string | null;
  email: string | null;
  designation: string | null;
}

interface SalesLogDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: number;
  companyName: string;
  defaultType?: "call" | "email";
}

const CALL_TYPES = [
  { value: "cold_call", label: "Cold Call" },
  { value: "warm_call", label: "Warm Call" },
];
const EMAIL_TYPES = [
  { value: "cold_email", label: "Cold Email" },
  { value: "warm_email", label: "Warm Email" },
  { value: "enquiry_email", label: "Enquiry Email" },
  { value: "reply_email", label: "Reply Email" },
];
const CALL_SUB_TYPES = [
  { value: "introduction", label: "Introduction" },
  { value: "pitch", label: "Pitch" },
  { value: "follow_up", label: "Follow-up" },
  { value: "inquiry", label: "Inquiry" },
  { value: "negotiation", label: "Negotiation" },
];
const CALL_OUTCOMES = [
  "Connected",
  "Not Connected",
  "Voicemail",
  "No Answer",
  "Busy",
  "Wrong Number",
  "Call Back Later",
  "Not Interested",
];
const EMAIL_OUTCOMES = [
  "Sent",
  "Replied",
  "No Reply Yet",
  "Bounced",
  "Auto-Reply",
  "Opt-Out",
  "Forwarded Internally",
];
const BUYER_RESPONSES = [
  "Have Buyer",
  "Not Interested",
  "Send Email",
  "Matched Target Price",
  "Not Connected",
  "Purchasing Team in China",
  "Will Check Internally",
  "Request Sample",
  "Price Too High",
];

const initialForm = (defaultType: "call" | "email") => ({
  logCall: defaultType === "call",
  logEmail: defaultType === "email",
  callType: defaultType === "call" ? "cold_call" : "",
  callSubType: "",
  callOutcome: "",
  callOutcomeCustom: "",
  emailType: defaultType === "email" ? "cold_email" : "",
  emailOutcome: "",
  emailOutcomeCustom: "",
  contactPersonName: "",
  contactPhone: "",
  contactEmail: "",
  selectedContactId: "",
  productsDiscussed: [] as string[],
  productInput: "",
  discussionSummary: "",
  buyerRequirement: "",
  interestLevel: "",
  buyerResponse: "",
  customBuyerResponse: "",
});

export function SalesLogDialog({ open, onOpenChange, companyId, companyName, defaultType = "call" }: SalesLogDialogProps) {
  const { toast } = useToast();
  const [form, setForm] = useState(initialForm(defaultType));
  const [useCustomResponse, setUseCustomResponse] = useState(false);

  const { data: contacts = [] } = useQuery<Contact[]>({
    queryKey: ["/api/crm/companies", companyId, "contacts"],
    queryFn: async () => {
      const res = await fetch(`/api/crm/companies/${companyId}/contacts`, { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: open && !!companyId,
  });

  const f = (key: string, val: any) => setForm(prev => ({ ...prev, [key]: val }));

  const selectContact = (contactId: string) => {
    f("selectedContactId", contactId);
    if (contactId === "__none__") {
      f("contactPersonName", ""); f("contactPhone", ""); f("contactEmail", "");
      return;
    }
    const c = contacts.find(c => c.id === parseInt(contactId));
    if (c) {
      f("contactPersonName", c.contactName);
      f("contactPhone", c.phone || "");
      f("contactEmail", c.email || "");
    }
  };

  const addProduct = (name: string) => {
    const trimmed = name.trim();
    if (trimmed && !form.productsDiscussed.includes(trimmed)) {
      setForm(prev => ({ ...prev, productsDiscussed: [...prev.productsDiscussed, trimmed], productInput: "" }));
    } else {
      f("productInput", "");
    }
  };
  const removeProduct = (name: string) => f("productsDiscussed", form.productsDiscussed.filter(p => p !== name));

  const createMutation = useMutation({
    mutationFn: async (body: any) => {
      const res = await apiRequest("/api/sales-logs", { method: "POST", body: JSON.stringify(body) });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sales-logs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sales-logs/my"] });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/companies", companyId, "activities"] });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/companies", companyId, "notes"] });
      toast({ title: "Activity logged", description: "Entry saved successfully." });
      onOpenChange(false);
      setForm(initialForm(defaultType));
      setUseCustomResponse(false);
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const handleSubmit = () => {
    if (!form.logCall && !form.logEmail) {
      toast({ title: "Missing field", description: "Please tick at least Call or Email.", variant: "destructive" });
      return;
    }
    if (form.logCall && !form.callType) {
      toast({ title: "Missing field", description: "Please select a Call Type (Cold/Warm).", variant: "destructive" });
      return;
    }
    if (form.logEmail && !form.emailType) {
      toast({ title: "Missing field", description: "Please select an Email Type.", variant: "destructive" });
      return;
    }

    const activities: any[] = [];
    if (form.logCall) {
      activities.push({
        activityType: form.callType,
        callType: form.callSubType || null,
        callOutcome: form.callOutcome === "__custom__" ? (form.callOutcomeCustom || null) : (form.callOutcome || null),
      });
    }
    if (form.logEmail) {
      activities.push({
        activityType: form.emailType,
        callType: null,
        callOutcome: form.emailOutcome === "__custom__" ? (form.emailOutcomeCustom || null) : (form.emailOutcome || null),
      });
    }

    const finalResponse = useCustomResponse ? form.customBuyerResponse : form.buyerResponse;
    createMutation.mutate({
      companyId,
      activities,
      contactPersonName: form.contactPersonName || null,
      contactPhone: form.contactPhone || null,
      contactEmail: form.contactEmail || null,
      productsDiscussed: form.productsDiscussed.length > 0 ? form.productsDiscussed : null,
      discussionSummary: form.discussionSummary || null,
      buyerRequirement: form.buyerRequirement || null,
      interestLevel: form.interestLevel || null,
      buyerResponse: finalResponse || null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {defaultType === "call" ? <Phone className="h-5 w-5 text-green-600" /> : <Mail className="h-5 w-5 text-blue-600" />}
            Log Activity — {companyName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Channel checkboxes */}
          <div>
            <Label>Activity Channel(s) <span className="text-red-500">*</span></Label>
            <p className="text-xs text-muted-foreground mb-2">Tick both if you did a call AND an email for this company.</p>
            <div className="flex gap-4 mt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox checked={form.logCall} onCheckedChange={v => f("logCall", !!v)} />
                <Phone className="h-4 w-4 text-green-600" /> Call
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox checked={form.logEmail} onCheckedChange={v => f("logEmail", !!v)} />
                <Mail className="h-4 w-4 text-blue-600" /> Email
              </label>
            </div>
          </div>

          {/* Call section */}
          {form.logCall && (
            <div className="border rounded-md p-3 space-y-3 bg-green-50/40">
              <div className="text-sm font-semibold text-green-700 flex items-center gap-2"><Phone className="h-4 w-4" /> Call Details</div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Call Type</Label>
                  <Select value={form.callType} onValueChange={v => f("callType", v)}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Cold / Warm" /></SelectTrigger>
                    <SelectContent>
                      {CALL_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Sub-Type</Label>
                  <Select value={form.callSubType} onValueChange={v => f("callSubType", v)}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent>
                      {CALL_SUB_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Call Outcome</Label>
                <Select value={form.callOutcome} onValueChange={v => f("callOutcome", v)}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select outcome..." /></SelectTrigger>
                  <SelectContent>
                    {CALL_OUTCOMES.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                    <SelectItem value="__custom__">Other (custom)...</SelectItem>
                  </SelectContent>
                </Select>
                {form.callOutcome === "__custom__" && (
                  <Input className="mt-2" placeholder="Type custom outcome..." value={form.callOutcomeCustom} onChange={e => f("callOutcomeCustom", e.target.value)} />
                )}
              </div>
            </div>
          )}

          {/* Email section */}
          {form.logEmail && (
            <div className="border rounded-md p-3 space-y-3 bg-blue-50/40">
              <div className="text-sm font-semibold text-blue-700 flex items-center gap-2"><Mail className="h-4 w-4" /> Email Details</div>
              <div>
                <Label>Email Type</Label>
                <Select value={form.emailType} onValueChange={v => f("emailType", v)}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select email type..." /></SelectTrigger>
                  <SelectContent>
                    {EMAIL_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Email Outcome</Label>
                <Select value={form.emailOutcome} onValueChange={v => f("emailOutcome", v)}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select outcome..." /></SelectTrigger>
                  <SelectContent>
                    {EMAIL_OUTCOMES.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                    <SelectItem value="__custom__">Other (custom)...</SelectItem>
                  </SelectContent>
                </Select>
                {form.emailOutcome === "__custom__" && (
                  <Input className="mt-2" placeholder="Type custom outcome..." value={form.emailOutcomeCustom} onChange={e => f("emailOutcomeCustom", e.target.value)} />
                )}
              </div>
            </div>
          )}

          {/* Contact person */}
          <div>
            <Label>Contact Person</Label>
            <Select value={form.selectedContactId} onValueChange={selectContact}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder={contacts.length > 0 ? "Select from company contacts..." : "No saved contacts — type below"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">— None / Custom —</SelectItem>
                {contacts.map(c => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.contactName}{c.designation ? ` (${c.designation})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="grid grid-cols-3 gap-2 mt-2">
              <Input placeholder="Name" value={form.contactPersonName} onChange={e => f("contactPersonName", e.target.value)} />
              <Input placeholder="Phone" value={form.contactPhone} onChange={e => f("contactPhone", e.target.value)} />
              <Input placeholder="Email" value={form.contactEmail} onChange={e => f("contactEmail", e.target.value)} />
            </div>
          </div>

          {/* Products discussed — free text only */}
          <div>
            <Label>Products Discussed</Label>
            <div className="flex gap-2 mt-1">
              <Input
                placeholder="Type product name and press Enter or Add"
                value={form.productInput}
                onChange={e => f("productInput", e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addProduct(form.productInput); } }}
                className="flex-1"
              />
              <Button type="button" variant="outline" size="sm" onClick={() => addProduct(form.productInput)}>Add</Button>
            </div>
            {form.productsDiscussed.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {form.productsDiscussed.map(p => (
                  <Badge key={p} variant="secondary" className="gap-1">
                    {p}
                    <button onClick={() => removeProduct(p)}><X className="h-3 w-3" /></button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Interest level */}
          <div>
            <Label>Interest Level</Label>
            <div className="flex gap-2 mt-1">
              {["hot", "warm", "cold"].map(level => (
                <button
                  key={level}
                  type="button"
                  onClick={() => f("interestLevel", level === form.interestLevel ? "" : level)}
                  className={`flex-1 py-1.5 text-sm rounded-md border transition-colors capitalize ${
                    form.interestLevel === level
                      ? level === "hot" ? "bg-red-100 border-red-400 text-red-700" :
                        level === "warm" ? "bg-orange-100 border-orange-400 text-orange-700" :
                        "bg-blue-100 border-blue-400 text-blue-700"
                      : "border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  {level === "hot" ? "🔥" : level === "warm" ? "🌤" : "❄️"} {level.charAt(0).toUpperCase() + level.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Buyer response */}
          <div>
            <Label>Buyer Response</Label>
            <Select value={useCustomResponse ? "__custom__" : form.buyerResponse} onValueChange={v => {
              if (v === "__custom__") { setUseCustomResponse(true); }
              else { setUseCustomResponse(false); f("buyerResponse", v); }
            }}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Select response..." /></SelectTrigger>
              <SelectContent>
                {BUYER_RESPONSES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                <SelectItem value="__custom__">Other (custom)...</SelectItem>
              </SelectContent>
            </Select>
            {useCustomResponse && (
              <Input className="mt-2" placeholder="Type custom response..." value={form.customBuyerResponse} onChange={e => f("customBuyerResponse", e.target.value)} />
            )}
          </div>

          <div>
            <Label>Buyer Requirement</Label>
            <Input className="mt-1" placeholder="e.g. 3.99 USD, 180-185 INR, 25kg/month" value={form.buyerRequirement} onChange={e => f("buyerRequirement", e.target.value)} />
          </div>

          <div>
            <Label>Discussion Summary / Notes</Label>
            <Textarea className="mt-1" rows={3} placeholder="What was discussed, next steps, key points..." value={form.discussionSummary} onChange={e => f("discussionSummary", e.target.value)} />
            <p className="text-xs text-muted-foreground mt-1">This will also be saved as a company note automatically.</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={createMutation.isPending}>
            {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save Log Entry
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
