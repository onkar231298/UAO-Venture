import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  { value: "cold_call", label: "Cold Call" },
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

export function SalesLogDialog({ open, onOpenChange, companyId, companyName, defaultType = "call" }: SalesLogDialogProps) {
  const { toast } = useToast();
  const isCall = defaultType === "call";

  const [form, setForm] = useState({
    activityType: isCall ? "cold_call" : "cold_email",
    callType: "",
    callOutcome: "",
    contactPersonName: "",
    contactPhone: "",
    contactEmail: "",
    productsDiscussed: [] as string[],
    productInput: "",
    discussionSummary: "",
    buyerRequirement: "",
    interestLevel: "",
    buyerResponse: "",
    customBuyerResponse: "",
  });

  const [useCustomResponse, setUseCustomResponse] = useState(false);

  const { data: contacts = [] } = useQuery<Contact[]>({
    queryKey: ["/api/crm/companies", companyId, "contacts"],
    queryFn: async () => {
      const res = await fetch(`/api/crm/companies/${companyId}/contacts`, { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: open,
  });

  const { data: productsData } = useQuery<{ products: Array<{ id: number; name: string }> }>({
    queryKey: ["/api/products", { limit: 200, status: "active" }],
    enabled: open,
  });
  const productList = productsData?.products || [];

  const f = (key: string, val: any) => setForm(prev => ({ ...prev, [key]: val }));

  const selectContact = (contactId: string) => {
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
    if (name && !form.productsDiscussed.includes(name)) {
      f("productsDiscussed", [...form.productsDiscussed, name]);
    }
    f("productInput", "");
  };

  const removeProduct = (name: string) => {
    f("productsDiscussed", form.productsDiscussed.filter(p => p !== name));
  };

  const createMutation = useMutation({
    mutationFn: async (body: any) => {
      const res = await apiRequest("/api/sales-logs", { method: "POST", body: JSON.stringify(body) });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sales-logs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/companies", companyId, "activities"] });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/companies", companyId, "notes"] });
      toast({ title: "Activity logged", description: "Entry saved successfully." });
      onOpenChange(false);
      setForm({
        activityType: isCall ? "cold_call" : "cold_email",
        callType: "", callOutcome: "", contactPersonName: "", contactPhone: "", contactEmail: "",
        productsDiscussed: [], productInput: "", discussionSummary: "", buyerRequirement: "",
        interestLevel: "", buyerResponse: "", customBuyerResponse: "",
      });
      setUseCustomResponse(false);
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const handleSubmit = () => {
    if (!form.activityType) {
      toast({ title: "Missing field", description: "Please select an activity type.", variant: "destructive" });
      return;
    }
    const isCallType = ["cold_call", "warm_call"].includes(form.activityType);
    const finalResponse = useCustomResponse ? form.customBuyerResponse : form.buyerResponse;
    createMutation.mutate({
      companyId,
      activityType: form.activityType,
      callType: isCallType ? form.callType || null : null,
      callOutcome: isCallType ? form.callOutcome || null : null,
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

  const activityIsCall = ["cold_call", "warm_call"].includes(form.activityType);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {defaultType === "call" ? <Phone className="h-5 w-5 text-green-600" /> : <Mail className="h-5 w-5 text-blue-600" />}
            Log {defaultType === "call" ? "Call" : "Email"} — {companyName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Activity type */}
          <div>
            <Label>Activity Type <span className="text-red-500">*</span></Label>
            <Select value={form.activityType} onValueChange={v => f("activityType", v)}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {defaultType === "call" ? (
                  <>
                    {CALL_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                    {EMAIL_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </>
                ) : (
                  <>
                    {EMAIL_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                    {CALL_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Call sub-type & outcome (only for call activities) */}
          {activityIsCall && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Call Type</Label>
                <Select value={form.callType} onValueChange={v => f("callType", v)}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>
                    {CALL_SUB_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Call Outcome</Label>
                <Select value={form.callOutcome} onValueChange={v => f("callOutcome", v)}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="done">Done ✓</SelectItem>
                    <SelectItem value="not_connected">Not Connected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Contact person */}
          <div>
            <Label>Contact Person</Label>
            <Select onValueChange={selectContact}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Select from company contacts..." /></SelectTrigger>
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

          {/* Products discussed */}
          <div>
            <Label>Products Discussed</Label>
            <div className="flex gap-2 mt-1">
              <Select value={form.productInput} onValueChange={v => { addProduct(v); }}>
                <SelectTrigger><SelectValue placeholder="Select product..." /></SelectTrigger>
                <SelectContent>
                  {productList.map(p => (
                    <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                placeholder="Or type product name"
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

          {/* Buyer requirement */}
          <div>
            <Label>Buyer Requirement</Label>
            <Input className="mt-1" placeholder="e.g. 3.99 USD, 180-185 INR, 25kg/month" value={form.buyerRequirement} onChange={e => f("buyerRequirement", e.target.value)} />
          </div>

          {/* Discussion summary */}
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
