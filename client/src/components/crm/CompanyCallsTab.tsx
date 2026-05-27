import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Phone, RefreshCw, Plus, Mail } from "lucide-react";
import { format } from "date-fns";
import { SalesLogDialog } from "./SalesLogDialog";

interface CompanyActivity {
  id: number;
  companyId: number;
  activityType: string;
  subject: string;
  description: string | null;
  createdBy: string;
  createdAt: string;
}

interface SalesLogEntry {
  id: number;
  logId: string;
  activityType: string;
  callType: string | null;
  callOutcome: string | null;
  contactPersonName: string | null;
  productsDiscussed: string[] | null;
  interestLevel: string | null;
  buyerResponse: string | null;
  discussionSummary: string | null;
  logDate: string;
  logTime: string;
  createdAt: string;
}

interface CompanyCallsTabProps {
  companyId: number;
  companyName?: string;
}

const activityLabel: Record<string, string> = {
  cold_call: "Cold Call", warm_call: "Warm Call",
  cold_email: "Cold Email", warm_email: "Warm Email",
  enquiry_email: "Enquiry Email", reply_email: "Reply Email",
};

const interestColor: Record<string, string> = {
  hot: "bg-red-100 text-red-700", warm: "bg-orange-100 text-orange-700", cold: "bg-blue-100 text-blue-700",
};

export function CompanyCallsTab({ companyId, companyName = "Company" }: CompanyCallsTabProps) {
  const [logDialogOpen, setLogDialogOpen] = useState(false);
  const [logDialogType, setLogDialogType] = useState<"call" | "email">("call");

  const { data: myLogs = [], isLoading, refetch } = useQuery<SalesLogEntry[]>({
    queryKey: ["/api/sales-logs/my", { companyId }],
    queryFn: async () => {
      const res = await fetch(`/api/sales-logs/my?companyId=${companyId}`, { credentials: "include" });
      if (!res.ok) return [];
      const all = await res.json();
      return all;
    },
  });

  const openLog = (type: "call" | "email") => {
    setLogDialogType(type);
    setLogDialogOpen(true);
  };

  const isCallEntry = (a: SalesLogEntry) => ["cold_call", "warm_call"].includes(a.activityType);

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
    <>
      <Card>
        <CardContent className="pt-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Calls & Emails
              {myLogs.length > 0 && (
                <Badge variant="secondary" className="text-xs">{myLogs.length}</Badge>
              )}
            </h3>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => openLog("email")}>
                <Mail className="h-4 w-4 mr-1" />
                + Log Email
              </Button>
              <Button size="sm" onClick={() => openLog("call")}>
                <Plus className="h-4 w-4 mr-1" />
                + Log Call
              </Button>
            </div>
          </div>

          {myLogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Phone className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No activity logged yet</p>
              <p className="text-sm mt-1">Use the buttons above to log a call or email.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {myLogs.map((log) => (
                <div key={log.id} className="flex items-start gap-3 p-3 border rounded-lg hover:bg-gray-50">
                  <div className={`p-2 rounded-full ${isCallEntry(log) ? "bg-green-100" : "bg-blue-100"}`}>
                    {isCallEntry(log)
                      ? <Phone className="h-4 w-4 text-green-600" />
                      : <Mail className="h-4 w-4 text-blue-600" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-sm">{activityLabel[log.activityType] || log.activityType}</p>
                      {log.callOutcome === "done" && <Badge className="text-[10px] bg-green-100 text-green-700 px-1.5">Connected ✓</Badge>}
                      {log.callOutcome === "not_connected" && <Badge className="text-[10px] bg-orange-100 text-orange-700 px-1.5">Not Connected</Badge>}
                      {log.interestLevel && (
                        <Badge className={`text-[10px] px-1.5 ${interestColor[log.interestLevel]}`}>
                          {log.interestLevel === "hot" ? "🔥" : log.interestLevel === "warm" ? "🌤" : "❄️"} {log.interestLevel}
                        </Badge>
                      )}
                    </div>
                    {log.contactPersonName && (
                      <p className="text-xs text-gray-600 mt-0.5">Contact: {log.contactPersonName}</p>
                    )}
                    {log.productsDiscussed?.length ? (
                      <p className="text-xs text-gray-600">Products: {log.productsDiscussed.join(", ")}</p>
                    ) : null}
                    {log.buyerResponse && (
                      <p className="text-xs text-gray-600">Response: {log.buyerResponse}</p>
                    )}
                    {log.discussionSummary && (
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{log.discussionSummary}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      {log.logDate ? format(new Date(log.logDate), "MMM d, yyyy") : ""} {log.logTime}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <SalesLogDialog
        open={logDialogOpen}
        onOpenChange={(open) => {
          setLogDialogOpen(open);
          if (!open) refetch();
        }}
        companyId={companyId}
        companyName={companyName}
        defaultType={logDialogType}
      />
    </>
  );
}
