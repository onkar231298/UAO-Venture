import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mail, Phone, RefreshCw, Calendar, Clock } from "lucide-react";
import { format } from "date-fns";

interface CompanyActivity {
  id: number;
  companyId: number;
  activityType: string;
  subject: string;
  description: string | null;
  createdBy: string;
  createdAt: string;
}

interface CompanyActivityTimelineProps {
  companyId: number;
  filter?: 'email' | 'call' | null;
  onClearFilter?: () => void;
}

export function CompanyActivityTimeline({ companyId, filter, onClearFilter }: CompanyActivityTimelineProps) {
  const { data: activities, isLoading } = useQuery<CompanyActivity[]>({
    queryKey: ['/api/crm/companies', companyId, 'activities'],
    queryFn: async () => {
      const response = await fetch(`/api/crm/companies/${companyId}/activities`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch activities');
      return response.json();
    },
  });

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'email':
        return <Mail className="h-4 w-4 text-blue-600" />;
      case 'call':
        return <Phone className="h-4 w-4 text-green-600" />;
      case 'stage_change':
        return <RefreshCw className="h-4 w-4 text-purple-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const filteredActivities = filter 
    ? activities?.filter(a => a.activityType === filter) 
    : activities;

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

  if (!filteredActivities || filteredActivities.length === 0) {
    return (
      <Card>
        <CardContent className="pt-4">
          {filter && onClearFilter && (
            <div className="flex items-center justify-between mb-4 pb-2 border-b">
              <Badge variant="outline" className={filter === 'email' ? 'bg-blue-50 text-blue-700' : 'bg-green-50 text-green-700'}>
                {filter === 'email' ? 'Email History' : 'Call History'}
              </Badge>
              <Button variant="ghost" size="sm" onClick={onClearFilter}>
                Show All
              </Button>
            </div>
          )}
          <div className="text-center py-6 text-muted-foreground">
            <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No {filter ? `${filter} ` : ''}activities recorded yet</p>
            <p className="text-sm">Click email or phone to log activities</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-4">
        {filter && onClearFilter && (
          <div className="flex items-center justify-between mb-4 pb-2 border-b">
            <Badge variant="outline" className={filter === 'email' ? 'bg-blue-50 text-blue-700' : 'bg-green-50 text-green-700'}>
              {filter === 'email' ? 'Email History' : 'Call History'}
            </Badge>
            <Button variant="ghost" size="sm" onClick={onClearFilter}>
              Show All
            </Button>
          </div>
        )}
        <div className="space-y-4">
          {filteredActivities.map((activity) => (
            <div key={activity.id} className="flex gap-3 border-b last:border-b-0 pb-3 last:pb-0">
              <div className="flex-shrink-0 mt-1">
                {getActivityIcon(activity.activityType)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{activity.subject}</p>
                {activity.description && (
                  <p className="text-sm text-gray-600">{activity.description}</p>
                )}
                <p className="text-xs text-gray-400 mt-1">
                  {format(new Date(activity.createdAt), 'MMM d, yyyy h:mm a')}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
