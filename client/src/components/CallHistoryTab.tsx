import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Phone, PhoneOff, PhoneIncoming, PhoneOutgoing, Play, Pause, Clock, User, Loader2 } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

interface CallHistoryTabProps {
  leadId?: number;
  companyId?: number;
}

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
  initiatedAt: string | null;
  answeredAt: string | null;
  endedAt: string | null;
  durationSeconds: number;
  recordingUrl: string | null;
  recordingDuration: number | null;
  recordingStatus: string | null;
  notes: string | null;
  outcome: string | null;
  createdAt: string | null;
}

const STATUS_COLORS: Record<string, string> = {
  'completed': 'bg-green-100 text-green-800',
  'in-progress': 'bg-blue-100 text-blue-800',
  'ringing': 'bg-yellow-100 text-yellow-800',
  'initiated': 'bg-gray-100 text-gray-800',
  'failed': 'bg-red-100 text-red-800',
  'busy': 'bg-orange-100 text-orange-800',
  'no-answer': 'bg-gray-100 text-gray-600',
};

const OUTCOME_LABELS: Record<string, string> = {
  'connected': 'Connected',
  'voicemail': 'Left Voicemail',
  'no-answer': 'No Answer',
  'busy': 'Busy',
  'wrong-number': 'Wrong Number',
  'follow-up-needed': 'Follow-up Needed',
  'not-interested': 'Not Interested',
  'callback-requested': 'Callback Requested',
};

export default function CallHistoryTab({ leadId, companyId }: CallHistoryTabProps) {
  const [playingCallId, setPlayingCallId] = useState<number | null>(null);
  const [audioElements, setAudioElements] = useState<Record<number, HTMLAudioElement>>({});

  const endpoint = leadId 
    ? `/api/leads/${leadId}/calls`
    : companyId 
      ? `/api/crm/companies/${companyId}/call-logs`
      : null;

  const { data: calls = [], isLoading } = useQuery<CallLog[]>({
    queryKey: [endpoint],
    enabled: !!endpoint,
  });

  const formatDuration = (seconds: number) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };

  const togglePlayRecording = (call: CallLog) => {
    if (!call.recordingUrl) return;

    if (playingCallId === call.id) {
      audioElements[call.id]?.pause();
      setPlayingCallId(null);
    } else {
      if (playingCallId && audioElements[playingCallId]) {
        audioElements[playingCallId].pause();
      }

      let audio = audioElements[call.id];
      if (!audio) {
        audio = new Audio(call.recordingUrl);
        audio.onended = () => setPlayingCallId(null);
        setAudioElements(prev => ({ ...prev, [call.id]: audio }));
      }
      audio.play();
      setPlayingCallId(call.id);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-500">Loading call history...</span>
        </CardContent>
      </Card>
    );
  }

  if (calls.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-gray-500">
          <Phone className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="font-medium">No calls yet</p>
          <p className="text-sm">Call history will appear here after making calls.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {calls.map((call) => (
        <Card key={call.id} className="hover:shadow-sm transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-full ${call.direction === 'outgoing' ? 'bg-blue-100' : 'bg-green-100'}`}>
                  {call.direction === 'outgoing' ? (
                    <PhoneOutgoing className="h-4 w-4 text-blue-600" />
                  ) : (
                    <PhoneIncoming className="h-4 w-4 text-green-600" />
                  )}
                </div>
                
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{call.recipientName || 'Unknown'}</span>
                    <Badge className={STATUS_COLORS[call.status] || 'bg-gray-100'}>
                      {call.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-500">{call.recipientPhone}</p>
                  
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                    {call.initiatedAt && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {format(new Date(call.initiatedAt), 'MMM d, yyyy h:mm a')}
                      </span>
                    )}
                    {call.durationSeconds > 0 && (
                      <span>Duration: {formatDuration(call.durationSeconds)}</span>
                    )}
                  </div>

                  {call.outcome && (
                    <div className="mt-2">
                      <Badge variant="outline" className="text-xs">
                        {OUTCOME_LABELS[call.outcome] || call.outcome}
                      </Badge>
                    </div>
                  )}

                  {call.notes && (
                    <p className="mt-2 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                      {call.notes}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {call.recordingUrl && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => togglePlayRecording(call)}
                    data-testid={`button-play-recording-${call.id}`}
                  >
                    {playingCallId === call.id ? (
                      <>
                        <Pause className="h-4 w-4 mr-1" />
                        Pause
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-1" />
                        Play
                      </>
                    )}
                    {call.recordingDuration && (
                      <span className="ml-1 text-xs text-gray-500">
                        ({formatDuration(call.recordingDuration)})
                      </span>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
