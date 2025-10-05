import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Clock, User, ArrowRight, MessageSquare, Phone, Mail, FileText, CheckCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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

interface ActivityTimelineProps {
  leadId: number;
}

export default function ActivityTimeline({ leadId }: ActivityTimelineProps) {
  const { data: activities = [], isLoading } = useQuery<Activity[]>({
    queryKey: [`/api/crm/leads/${leadId}/activities`],
  });

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

  return (
    <div className="space-y-3">
      {activities.map((activity, index) => (
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
      ))}
    </div>
  );
}
