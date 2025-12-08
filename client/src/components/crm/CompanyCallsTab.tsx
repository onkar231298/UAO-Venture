import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Phone, RefreshCw, CheckCircle, PhoneMissed } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

interface CompanyCallsTabProps {
  companyId: number;
}

export function CompanyCallsTab({ companyId }: CompanyCallsTabProps) {
  const { toast } = useToast();
  const { data: callActivities = [], isLoading } = useQuery<CompanyActivity[]>({
    queryKey: ['/api/crm/companies', companyId, 'calls'],
    queryFn: async () => {
      const response = await fetch(`/api/crm/companies/${companyId}/calls`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch calls');
      return response.json();
    },
  });

  const logCallMutation = useMutation({
    mutationFn: async (data: { subject: string; description: string }) => {
      return apiRequest(`/api/crm/companies/${companyId}/activities`, {
        method: 'POST',
        body: JSON.stringify({
          activityType: 'call',
          subject: data.subject,
          description: data.description,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/crm/companies', companyId, 'calls'] });
      queryClient.invalidateQueries({ queryKey: ['/api/crm/companies', companyId, 'activities'] });
      toast({
        title: "Call Logged",
        description: "Call activity has been recorded",
      });
    },
  });

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
    <Card>
      <CardContent className="pt-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold flex items-center gap-2">
            <Phone className="h-4 w-4" />
            Call History
          </h3>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Phone className="h-4 w-4 mr-1" />
                Log Call
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => logCallMutation.mutate({ 
                subject: 'Call completed', 
                description: 'Successfully connected with contact' 
              })}>
                <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                Call Completed
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => logCallMutation.mutate({ 
                subject: 'No answer', 
                description: 'Call attempted but no answer' 
              })}>
                <PhoneMissed className="h-4 w-4 mr-2 text-orange-600" />
                No Answer
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => logCallMutation.mutate({ 
                subject: 'Left voicemail', 
                description: 'Left voicemail message' 
              })}>
                <Phone className="h-4 w-4 mr-2 text-blue-600" />
                Left Voicemail
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {callActivities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Phone className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">No call history yet</p>
            <p className="text-sm mt-1">Use the "Log Call" button to record calls</p>
          </div>
        ) : (
          <div className="space-y-3">
            {callActivities.map((call) => (
              <div key={call.id} className="flex items-start gap-3 p-3 border rounded-lg hover:bg-gray-50">
                <div className="p-2 rounded-full bg-green-100">
                  <Phone className="h-4 w-4 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{call.subject}</p>
                  {call.description && (
                    <p className="text-sm text-gray-600">{call.description}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    {format(new Date(call.createdAt), 'MMM d, yyyy h:mm a')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
