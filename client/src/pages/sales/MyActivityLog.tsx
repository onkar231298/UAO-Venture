import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { SalesLayout } from "@/components/layouts/SalesLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RefreshCw, Phone, Mail, Search, ClipboardList } from "lucide-react";
import { format } from "date-fns";

interface SalesLogEntry {
  id: number;
  logId: string;
  userId: string;
  userName: string;
  companyId: number;
  companyName: string;
  activityType: string;
  callType: string | null;
  callOutcome: string | null;
  contactPersonName: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  productsDiscussed: string[] | null;
  discussionSummary: string | null;
  buyerRequirement: string | null;
  interestLevel: string | null;
  buyerResponse: string | null;
  logDate: string;
  logTime: string;
  createdAt: string;
}

const activityLabel: Record<string, string> = {
  cold_call: "Cold Call",
  warm_call: "Warm Call",
  cold_email: "Cold Email",
  warm_email: "Warm Email",
  enquiry_email: "Enquiry Email",
  reply_email: "Reply Email",
};

const interestColor: Record<string, string> = {
  hot: "bg-red-100 text-red-700 border border-red-300",
  warm: "bg-orange-100 text-orange-700 border border-orange-300",
  cold: "bg-blue-100 text-blue-700 border border-blue-300",
};

export default function MyActivityLog() {
  const today = new Date().toISOString().slice(0, 10);
  const [dateFrom, setDateFrom] = useState(today);
  const [dateTo, setDateTo] = useState(today);
  const [typeFilter, setTypeFilter] = useState("all");
  const [search, setSearch] = useState("");

  const { data: logs = [], isLoading, refetch } = useQuery<SalesLogEntry[]>({
    queryKey: ["/api/sales-logs/my", { dateFrom, dateTo, type: typeFilter }],
    queryFn: async () => {
      const params = new URLSearchParams({ dateFrom, dateTo });
      if (typeFilter !== "all") params.set("type", typeFilter);
      const res = await fetch(`/api/sales-logs/my?${params}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch logs");
      return res.json();
    },
  });

  const filtered = logs.filter(l => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      l.companyName?.toLowerCase().includes(s) ||
      l.contactPersonName?.toLowerCase().includes(s) ||
      l.productsDiscussed?.some(p => p.toLowerCase().includes(s))
    );
  });

  const callCount = filtered.filter(l => ["cold_call", "warm_call"].includes(l.activityType)).length;
  const emailCount = filtered.filter(l => ["cold_email", "warm_email", "enquiry_email", "reply_email"].includes(l.activityType)).length;
  const hotCount = filtered.filter(l => l.interestLevel === "hot").length;

  return (
    <SalesLayout title="My Activity Log" subtitle="Your logged calls and emails">
      <div className="space-y-6">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Total Entries", value: filtered.length, color: "text-gray-700" },
            { label: "Calls Logged", value: callCount, color: "text-green-700" },
            { label: "Emails Logged", value: emailCount, color: "text-blue-700" },
          ].map(s => (
            <Card key={s.label}>
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 items-end">
              <div>
                <Label className="text-xs">From</Label>
                <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">To</Label>
                <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">Activity Type</Label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="cold_call">Cold Call</SelectItem>
                    <SelectItem value="warm_call">Warm Call</SelectItem>
                    <SelectItem value="cold_email">Cold Email</SelectItem>
                    <SelectItem value="warm_email">Warm Email</SelectItem>
                    <SelectItem value="enquiry_email">Enquiry Email</SelectItem>
                    <SelectItem value="reply_email">Reply Email</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="pl-7" />
                </div>
                <Button variant="outline" size="icon" onClick={() => refetch()}><RefreshCw className="h-4 w-4" /></Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ClipboardList className="h-4 w-4" />
              {filtered.length} {filtered.length === 1 ? "entry" : "entries"}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12"><RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <ClipboardList className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p>No activity logged yet for this period.</p>
                <p className="text-sm mt-1">Use the "+ Log Call" / "+ Log Email" buttons in company details to add entries.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Activity</TableHead>
                      <TableHead>Outcome</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Products</TableHead>
                      <TableHead>Interest</TableHead>
                      <TableHead>Buyer Response</TableHead>
                      <TableHead>Requirement</TableHead>
                      <TableHead>Summary</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map(log => {
                      const isCall = ["cold_call", "warm_call"].includes(log.activityType);
                      return (
                        <TableRow key={log.id}>
                          <TableCell className="text-xs whitespace-nowrap">
                            {log.logDate && format(new Date(log.logDate), "dd MMM yy")}<br />
                            <span className="text-muted-foreground">{log.logTime}</span>
                          </TableCell>
                          <TableCell className="text-sm font-medium">{log.companyName}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="gap-1 text-xs">
                              {isCall ? <Phone className="h-3 w-3" /> : <Mail className="h-3 w-3" />}
                              {activityLabel[log.activityType] || log.activityType}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs">
                            {log.callOutcome === "done" ? <span className="text-green-700">Done ✓</span> :
                             log.callOutcome === "not_connected" ? <span className="text-orange-600">Not Connected</span> : "—"}
                          </TableCell>
                          <TableCell className="text-xs">
                            {log.contactPersonName || "—"}
                            {log.contactPhone && <p className="text-muted-foreground">{log.contactPhone}</p>}
                          </TableCell>
                          <TableCell className="text-xs max-w-[120px]">
                            {log.productsDiscussed?.length ? (
                              <div className="flex flex-wrap gap-1">
                                {log.productsDiscussed.slice(0, 2).map(p => (
                                  <Badge key={p} variant="secondary" className="text-[10px] px-1">{p}</Badge>
                                ))}
                                {log.productsDiscussed.length > 2 && (
                                  <Badge variant="secondary" className="text-[10px] px-1">+{log.productsDiscussed.length - 2}</Badge>
                                )}
                              </div>
                            ) : "—"}
                          </TableCell>
                          <TableCell>
                            {log.interestLevel ? (
                              <Badge className={`text-xs ${interestColor[log.interestLevel] || ""}`}>
                                {log.interestLevel === "hot" ? "🔥" : log.interestLevel === "warm" ? "🌤" : "❄️"} {log.interestLevel}
                              </Badge>
                            ) : "—"}
                          </TableCell>
                          <TableCell className="text-xs max-w-[140px] truncate">{log.buyerResponse || "—"}</TableCell>
                          <TableCell className="text-xs max-w-[120px] truncate">{log.buyerRequirement || "—"}</TableCell>
                          <TableCell className="text-xs max-w-[200px]">
                            {log.discussionSummary ? <span className="line-clamp-2">{log.discussionSummary}</span> : "—"}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </SalesLayout>
  );
}
