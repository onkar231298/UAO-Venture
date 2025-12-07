import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Phone, Clock, PlayCircle, PhoneOutgoing, PhoneIncoming, PhoneMissed, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface CallLog {
  id: number;
  plivoCallUuid: string | null;
  leadId: number | null;
  companyId: number | null;
  contactId: number | null;
  callerUserId: string | null;
  callerPhone: string | null;
  recipientPhone: string;
  recipientName: string | null;
  direction: string;
  status: string;
  initiatedAt: string;
  answeredAt: string | null;
  endedAt: string | null;
  durationSeconds: number;
  recordingUrl: string | null;
  recordingDuration: number | null;
  recordingStatus: string | null;
  notes: string | null;
  outcome: string | null;
  createdAt: string;
}

interface CallHistoryProps {
  leadId?: number;
  companyId?: number;
  limit?: number;
}

const statusColors: Record<string, string> = {
  completed: "bg-green-100 text-green-700 border-green-200",
  answered: "bg-green-100 text-green-700 border-green-200",
  ringing: "bg-yellow-100 text-yellow-700 border-yellow-200",
  initiating: "bg-blue-100 text-blue-700 border-blue-200",
  failed: "bg-red-100 text-red-700 border-red-200",
  ended: "bg-gray-100 text-gray-700 border-gray-200",
  "no-answer": "bg-orange-100 text-orange-700 border-orange-200",
};

const formatDuration = (seconds: number): string => {
  if (!seconds || seconds === 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

export default function CallHistory({ leadId, companyId, limit = 10 }: CallHistoryProps) {
  const queryParams = new URLSearchParams();
  if (leadId) queryParams.append("leadId", leadId.toString());
  if (companyId) queryParams.append("companyId", companyId.toString());
  if (limit) queryParams.append("limit", limit.toString());

  const { data: callLogs = [], isLoading } = useQuery<CallLog[]>({
    queryKey: ["/api/call-logs", { leadId, companyId, limit }],
    queryFn: async () => {
      const response = await fetch(`/api/call-logs?${queryParams.toString()}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch call logs");
      return response.json();
    },
    enabled: Boolean(leadId || companyId),
  });

  const getDirectionIcon = (direction: string, status: string) => {
    if (status === "failed" || status === "no-answer") {
      return <PhoneMissed className="h-4 w-4 text-red-500" />;
    }
    if (direction === "incoming") {
      return <PhoneIncoming className="h-4 w-4 text-blue-500" />;
    }
    return <PhoneOutgoing className="h-4 w-4 text-green-500" />;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Phone className="h-4 w-4" />
            Call History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-6 text-sm text-gray-500">
            Loading call history...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (callLogs.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Phone className="h-4 w-4" />
            Call History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-6 text-gray-500">
            <Phone className="h-10 w-10 mb-2 opacity-30" />
            <p className="text-sm">No calls recorded yet</p>
            <p className="text-xs">Click the call button to initiate a call</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Phone className="h-4 w-4" />
          Call History
          <Badge variant="outline" className="ml-1">{callLogs.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {callLogs.map((call) => (
          <div
            key={call.id}
            className="p-3 border rounded-lg hover:bg-gray-50 transition-colors"
            data-testid={`call-log-${call.id}`}
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-full bg-gray-100">
                {getDirectionIcon(call.direction, call.status)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <h4 className="font-medium text-sm text-gray-900">
                      {call.direction === "outgoing" ? "Outbound call" : "Inbound call"} to{" "}
                      {call.recipientName || call.recipientPhone}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge
                        variant="outline"
                        className={`text-xs ${statusColors[call.status] || statusColors.ended}`}
                      >
                        {call.status}
                      </Badge>
                      {call.durationSeconds > 0 && (
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDuration(call.durationSeconds)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-gray-500">
                      {format(new Date(call.initiatedAt), "MMM d, yyyy")}
                    </p>
                    <p className="text-xs text-gray-400">
                      {format(new Date(call.initiatedAt), "h:mm a")}
                    </p>
                  </div>
                </div>

                {call.notes && (
                  <p className="text-sm text-gray-600 mt-2">{call.notes}</p>
                )}

                {call.outcome && (
                  <div className="mt-2 p-2 bg-gray-50 rounded text-sm text-gray-700">
                    <span className="font-medium">Outcome: </span>
                    {call.outcome}
                  </div>
                )}

                {call.recordingUrl && (
                  <div className="mt-2 p-2 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2 mb-1">
                      <PlayCircle className="h-4 w-4 text-green-600" />
                      <span className="text-xs font-medium text-green-800">Call Recording</span>
                      {call.recordingDuration && (
                        <span className="text-xs text-green-600">
                          ({formatDuration(call.recordingDuration)})
                        </span>
                      )}
                    </div>
                    <audio
                      controls
                      className="w-full h-8"
                      src={call.recordingUrl}
                      data-testid={`audio-call-${call.id}`}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
