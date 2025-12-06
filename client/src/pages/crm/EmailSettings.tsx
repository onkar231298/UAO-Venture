import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Mail, CheckCircle, XCircle, Link2, Unlink, AlertTriangle, RefreshCw, Info } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

interface EmailStatus {
  hasConfig: boolean;
  connected: boolean;
  email?: string;
  gmailAddress?: string;
  tokensValid?: boolean;
  error?: string;
}

export default function EmailSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [location] = useLocation();
  const [isConnecting, setIsConnecting] = useState(false);

  const { data: emailStatus, isLoading, refetch } = useQuery<EmailStatus>({
    queryKey: ['/api/email/status'],
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    
    if (params.get('success') === 'gmail_connected') {
      toast({
        title: "Gmail Connected!",
        description: "Your Gmail account has been successfully connected. You can now send emails from the CRM.",
      });
      window.history.replaceState({}, '', '/crm/email-settings');
      queryClient.invalidateQueries({ queryKey: ['/api/email/status'] });
    }
    
    if (params.get('error')) {
      const errorCode = params.get('error');
      const expectedEmail = params.get('expected');
      const gotEmail = params.get('got');
      let errorMessage = "Failed to connect Gmail. Please try again.";
      
      switch (errorCode) {
        case 'gmail_oauth_denied':
          errorMessage = "Gmail connection was denied. Please approve access to connect your Gmail.";
          break;
        case 'gmail_oauth_no_code':
          errorMessage = "No authorization code received from Gmail.";
          break;
        case 'gmail_oauth_session_expired':
          errorMessage = "Session expired. Please try connecting again.";
          break;
        case 'gmail_oauth_no_token':
          errorMessage = "Failed to get access token from Gmail.";
          break;
        case 'gmail_oauth_failed':
          errorMessage = "Gmail connection failed. Please try again.";
          break;
        case 'gmail_email_mismatch':
          errorMessage = `Email mismatch! You tried to connect "${gotEmail}" but your configured email is "${expectedEmail}". Please log in with the correct Gmail account.`;
          break;
        case 'gmail_oauth_verification_failed':
          errorMessage = "Failed to verify Gmail account. Please try connecting again.";
          break;
      }
      
      toast({
        title: "Connection Failed",
        description: errorMessage,
        variant: "destructive",
      });
      window.history.replaceState({}, '', '/crm/email-settings');
    }
  }, [location, toast, queryClient]);

  const connectGmailMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/email/connect', {
        method: 'GET',
        credentials: 'include',
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to start Gmail connection');
      }
      return response.json();
    },
    onSuccess: (data: any) => {
      if (data.authUrl) {
        setIsConnecting(true);
        window.location.href = data.authUrl;
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to start Gmail connection",
        variant: "destructive",
      });
    },
  });

  const disconnectGmailMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/email/disconnect', {
        method: 'POST',
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to disconnect Gmail');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/email/status'] });
      toast({
        title: "Gmail Disconnected",
        description: "Your Gmail account has been disconnected.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to disconnect Gmail",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="container max-w-2xl mx-auto py-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl mx-auto py-8 px-4" data-testid="email-settings-page">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Email Settings</h1>
        <p className="text-muted-foreground">
          Connect your Gmail account to send emails from the CRM
        </p>
      </div>

      {!emailStatus?.hasConfig ? (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>No Email Configuration</AlertTitle>
          <AlertDescription>
            Your email address has not been configured yet. Please contact your administrator 
            to set up your company email address, then return here to connect your Gmail.
          </AlertDescription>
        </Alert>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Gmail Connection
            </CardTitle>
            <CardDescription>
              Connect your Gmail account to send and receive emails through the CRM
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div className="space-y-1">
                <p className="font-medium">Email Address</p>
                <p className="text-muted-foreground">{emailStatus.email}</p>
              </div>
              {emailStatus.connected ? (
                <Badge className="bg-green-100 text-green-800 border-green-300">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Connected
                </Badge>
              ) : (
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                  <XCircle className="h-3 w-3 mr-1" />
                  Not Connected
                </Badge>
              )}
            </div>

            {emailStatus.connected && emailStatus.gmailAddress && (
              <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-green-800">Connected Gmail Account</p>
                  <p className="text-green-700">{emailStatus.gmailAddress}</p>
                </div>
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
            )}

            {emailStatus.error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Connection Issue</AlertTitle>
                <AlertDescription>{emailStatus.error}</AlertDescription>
              </Alert>
            )}

            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Important</AlertTitle>
              <AlertDescription>
                <ul className="list-disc list-inside space-y-1 mt-2">
                  <li>You must connect <strong>your own Gmail account</strong> to send emails</li>
                  <li>Emails you send will appear in your Gmail Sent folder</li>
                  <li>Make sure to log into the Gmail account that matches your configured email address</li>
                  <li>You may need to grant access permissions when connecting</li>
                </ul>
              </AlertDescription>
            </Alert>

            <div className="flex gap-3">
              {emailStatus.connected ? (
                <>
                  <Button
                    variant="outline"
                    onClick={() => refetch()}
                    disabled={isLoading}
                    data-testid="button-refresh-status"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh Status
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => disconnectGmailMutation.mutate()}
                    disabled={disconnectGmailMutation.isPending}
                    data-testid="button-disconnect-gmail"
                  >
                    {disconnectGmailMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Unlink className="h-4 w-4 mr-2" />
                    )}
                    Disconnect Gmail
                  </Button>
                </>
              ) : (
                <Button
                  onClick={() => connectGmailMutation.mutate()}
                  disabled={connectGmailMutation.isPending || isConnecting}
                  className="w-full"
                  data-testid="button-connect-gmail"
                >
                  {(connectGmailMutation.isPending || isConnecting) ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Link2 className="h-4 w-4 mr-2" />
                  )}
                  Connect Your Gmail Account
                </Button>
              )}
            </div>

            {!emailStatus.connected && (
              <p className="text-sm text-muted-foreground text-center">
                Clicking "Connect Your Gmail Account" will redirect you to Google to authorize access.
                Make sure to log in with your account: <strong>{emailStatus.email}</strong>
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
