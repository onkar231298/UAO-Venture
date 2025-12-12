import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Clock, User, ArrowRight, MessageSquare, Phone, Mail, FileText, CheckCircle, Eye, Play, Pause, Volume2, RefreshCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Activity {
  id: number;
  leadId: number;
  activityType: string;
  activityDate: string;
  subject: string | null;
  description: string | null;
  outcome: string | null;
  duration: number | null;
  direction: string | null;
  fromStage: string | null;
  toStage: string | null;
  createdBy: string | null;
  createdAt: string;
}

interface CallLog {
  id: number;
  callUuid: string | null;
  recipientPhone: string;
  recipientName: string | null;
  direction: string;
  status: string;
  durationSeconds: number | null;
  recordingUrl: string | null;
  transcription: string | null;
  startedAt: string | null;
  createdAt: string;
}

interface ActivityTimelineProps {
  leadId: number;
  onViewEmail?: () => void;
}

export default function ActivityTimeline({ leadId, onViewEmail }: ActivityTimelineProps) {
  const { toast } = useToast();
  const [playingActivityId, setPlayingActivityId] = useState<number | null>(null);
  const [audioProgress, setAudioProgress] = useState<Record<number, number>>({});
  const [audioDuration, setAudioDuration] = useState<Record<number, number>>({});
  const audioRefs = useRef<Record<number, HTMLAudioElement>>({});
  const [isSyncing, setIsSyncing] = useState(false);

  const { data: activities = [], isLoading } = useQuery<Activity[]>({
    queryKey: [`/api/crm/leads/${leadId}/activities`],
  });

  const { data: callLogs = [] } = useQuery<CallLog[]>({
    queryKey: ["/api/crm/leads", leadId, "call-logs"],
    enabled: !!leadId,
  });

  const findRecordingForActivity = (activity: Activity): string | null => {
    if (activity.activityType !== 'call') return null;
    
    const activityDate = new Date(activity.activityDate);
    
    for (const log of callLogs) {
      if (!log.recordingUrl) continue;
      
      const logDate = new Date(log.startedAt || log.createdAt);
      const timeDiff = Math.abs(activityDate.getTime() - logDate.getTime());
      
      if (timeDiff < 5 * 60 * 1000) {
        return log.recordingUrl;
      }
    }
    
    if (activity.description?.includes('Recording available') || activity.outcome?.includes('Recording')) {
      const recentRecordingLog = callLogs.find(log => 
        log.recordingUrl && 
        Math.abs(new Date(log.createdAt).getTime() - activityDate.getTime()) < 24 * 60 * 60 * 1000
      );
      return recentRecordingLog?.recordingUrl || null;
    }
    
    return null;
  };

  const handleSyncCallLogs = async () => {
    setIsSyncing(true);
    try {
      await apiRequest("/api/voice/frejun/sync-call-logs", {
        method: "POST",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/leads", leadId, "call-logs"] });
      queryClient.invalidateQueries({ queryKey: [`/api/crm/leads/${leadId}/activities`] });
      toast({
        title: "Sync Complete",
        description: "Call recordings have been synced from Frejun",
      });
    } catch (error) {
      toast({
        title: "Sync Failed",
        description: "Could not sync call recordings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const togglePlayRecording = (activityId: number, recordingUrl: string) => {
    if (!audioRefs.current[activityId]) {
      const audio = new Audio(recordingUrl);
      audio.addEventListener('timeupdate', () => {
        setAudioProgress(prev => ({ ...prev, [activityId]: audio.currentTime }));
      });
      audio.addEventListener('loadedmetadata', () => {
        setAudioDuration(prev => ({ ...prev, [activityId]: audio.duration }));
      });
      audio.addEventListener('ended', () => {
        setPlayingActivityId(null);
        setAudioProgress(prev => ({ ...prev, [activityId]: 0 }));
      });
      audioRefs.current[activityId] = audio;
    }

    const audio = audioRefs.current[activityId];

    if (playingActivityId === activityId) {
      audio.pause();
      setPlayingActivityId(null);
    } else {
      if (playingActivityId && audioRefs.current[playingActivityId]) {
        audioRefs.current[playingActivityId].pause();
      }
      audio.play();
      setPlayingActivityId(activityId);
    }
  };

  const handleSeek = (activityId: number, value: number[]) => {
    const audio = audioRefs.current[activityId];
    if (audio) {
      audio.currentTime = value[0];
      setAudioProgress(prev => ({ ...prev, [activityId]: value[0] }));
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "stage_change":
        return <ArrowRight className="h-4 w-4" />;
      case "note":
        return <MessageSquare className="h-4 w-4" />;
      case "call":
        return <Phone className="h-4 w-4" />;
      case "email":
        return <Mail className="h-4 w-4" />;
      case "meeting":
        return <User className="h-4 w-4" />;
      case "task":
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case "stage_change":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "note":
        return "bg-gray-100 text-gray-700 border-gray-200";
      case "call":
        return "bg-green-100 text-green-700 border-green-200";
      case "email":
        return "bg-purple-100 text-purple-700 border-purple-200";
      case "meeting":
        return "bg-orange-100 text-orange-700 border-orange-200";
      case "task":
        return "bg-teal-100 text-teal-700 border-teal-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const formatStageChange = (activity: Activity) => {
    if (activity.fromStage && activity.toStage) {
      const formatStageName = (stage: string) => {
        return stage.split('_').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
      };
      return (
        <div className="flex items-center gap-2 text-sm">
          <Badge variant="outline" className="font-normal">
            {formatStageName(activity.fromStage)}
          </Badge>
          <ArrowRight className="h-3 w-3 text-gray-400" />
          <Badge variant="outline" className="font-normal">
            {formatStageName(activity.toStage)}
          </Badge>
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-gray-100 animate-pulse rounded-lg"></div>
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-gray-500">
          <Clock className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p>No activities yet</p>
        </CardContent>
      </Card>
    );
  }

  const hasCallActivities = activities.some(a => a.activityType === 'call');

  return (
    <div className="space-y-3">
      {hasCallActivities && (
        <div className="flex justify-end mb-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSyncCallLogs}
            disabled={isSyncing}
            data-testid="button-sync-call-logs"
          >
            <RefreshCw className={`h-3 w-3 mr-1 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Syncing...' : 'Sync Recordings'}
          </Button>
        </div>
      )}
      
      {activities.map((activity) => {
        const recordingUrl = findRecordingForActivity(activity);
        const isPlaying = playingActivityId === activity.id;
        const progress = audioProgress[activity.id] || 0;
        const duration = audioDuration[activity.id] || 0;
        
        return (
          <Card key={activity.id} className="border-l-4" style={{ borderLeftColor: getActivityColor(activity.activityType).includes('blue') ? '#3b82f6' : getActivityColor(activity.activityType).includes('green') ? '#10b981' : getActivityColor(activity.activityType).includes('purple') ? '#8b5cf6' : getActivityColor(activity.activityType).includes('orange') ? '#f97316' : getActivityColor(activity.activityType).includes('teal') ? '#14b8a6' : '#6b7280' }}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg border ${getActivityColor(activity.activityType)}`}>
                  {getActivityIcon(activity.activityType)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm text-gray-900">
                        {activity.subject || activity.activityType.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                      </h4>
                      
                      {activity.activityType === 'stage_change' && formatStageChange(activity)}
                      
                      {activity.description && (
                        <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                      )}
                      
                      {activity.outcome && (
                        <div className="mt-2 p-2 bg-gray-50 rounded text-sm text-gray-700">
                          <span className="font-medium">Outcome: </span>
                          {activity.outcome}
                        </div>
                      )}
                      
                      {activity.duration && (
                        <p className="text-xs text-gray-500 mt-1">
                          Duration: {activity.duration} minutes
                        </p>
                      )}
                      
                      {recordingUrl && (
                        <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                          <div className="flex items-center gap-2 mb-2">
                            <Volume2 className="h-4 w-4 text-green-600" />
                            <span className="text-sm font-medium text-green-700">Call Recording</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => togglePlayRecording(activity.id, recordingUrl)}
                              className="flex-shrink-0"
                              data-testid={`button-play-recording-${activity.id}`}
                            >
                              {isPlaying ? (
                                <Pause className="h-4 w-4" />
                              ) : (
                                <Play className="h-4 w-4" />
                              )}
                            </Button>
                            <div className="flex-1 flex items-center gap-2">
                              <span className="text-xs text-gray-500 w-10">{formatTime(progress)}</span>
                              <Slider
                                value={[progress]}
                                max={duration || 100}
                                step={1}
                                onValueChange={(value) => handleSeek(activity.id, value)}
                                className="flex-1"
                              />
                              <span className="text-xs text-gray-500 w-10">{formatTime(duration)}</span>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {activity.activityType === 'email' && 
                       activity.subject?.includes('received') && 
                       onViewEmail && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2"
                          onClick={onViewEmail}
                          data-testid={`button-view-email-activity-${activity.id}`}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View Full Email
                        </Button>
                      )}
                    </div>
                    
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-gray-500">
                        {format(new Date(activity.activityDate), 'MMM d, yyyy')}
                      </p>
                      <p className="text-xs text-gray-400">
                        {format(new Date(activity.activityDate), 'h:mm a')}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 mt-2">
                    <User className="h-3 w-3 text-gray-400" />
                    <span className="text-xs text-gray-500">
                      {activity.createdBy || 'System'}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
