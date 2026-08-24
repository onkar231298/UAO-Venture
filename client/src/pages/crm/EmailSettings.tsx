import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Mail, CheckCircle, XCircle, Link2, Unlink, AlertTriangle, RefreshCw, Info } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface EmailStatus {
  serviceType?: string;
  configured?: boolean;
  connected?: boolean;
  emailAddress?: string;
  displayName?: string;
  lastSyncAt?: string;
  lastSyncError?: string;
}

export default function EmailSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [appPassword, setAppPassword] = useState("");
  const [isReconnecting, setIsReconnecting] = useState(false);

  const { data: emailStatus, isLoading, refetch, isFetching } = useQuery<EmailStatus>({
    queryKey: ['/api/email/status'],
  });

  const connectTitanMutation = useMutation({
    mutationFn: async (password: string) => {
      const response = await fetch('/api/email/connect', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appPassword: password }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || 'Unable to connect to Titan. Check your app password and try again.');
      }
      return data;
    },
    onSuccess: () => {
      setAppPassword("");
      setIsReconnecting(false);
      queryClient.invalidateQueries({ queryKey: ['/api/email/status'] });
      toast({
        title: "Titan Connected",
        description: "Your Titan mailbox has been connected and tested.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Titan Connection Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const disconnectTitanMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/email/disconnect', {
        method: 'POST',
        credentials: 'include',
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || 'Failed to disconnect Titan');
      }
      return data;
    },
    onSuccess: () => {
      setAppPassword("");
      setIsReconnecting(false);
      queryClient.invalidateQueries({ queryKey: ['/api/email/status'] });
      toast({
        title: "Titan Disconnected",
        description: "Your Titan mailbox has been disconnected.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const isConfigured = emailStatus?.configured === true;
  const isConnected = emailStatus?.connected === true;
  const showPasswordForm = !isConnected || isReconnecting;
  const mailbox = emailStatus?.emailAddress;

  const handleConnect = () => {
    if (!appPassword.trim()) {
      toast({
        title: "App password required",
        description: "Enter the Titan app password generated for your assigned mailbox.",
        variant: "destructive",
      });
      return;
    }
    connectTitanMutation.mutate(appPassword);
  };

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
        <p className="text-muted-foreground">Connect your assigned Titan mailbox to send and receive CRM email.</p>
      </div>

      {!isConfigured ? (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>No mailbox assigned</AlertTitle>
          <AlertDescription>
            Your Titan mailbox has not been assigned yet. Contact your administrator to assign your mailbox and display name.
          </AlertDescription>
        </Alert>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Titan Mail Connection
            </CardTitle>
            <CardDescription>Use a Titan app password to securely connect your assigned mailbox.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between gap-4 p-4 bg-muted/50 rounded-lg">
              <div className="space-y-1 min-w-0">
                <p className="font-medium">Assigned mailbox</p>
                <p className="text-muted-foreground break-all">{mailbox || "Not available"}</p>
                {emailStatus?.displayName && <p className="text-sm text-muted-foreground">Display name: {emailStatus.displayName}</p>}
              </div>
              {isConnected ? (
                <Badge className="bg-green-100 text-green-800 border-green-300 shrink-0">
                  <CheckCircle className="h-3 w-3 mr-1" /> Connected
                </Badge>
              ) : (
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-300 shrink-0">
                  <XCircle className="h-3 w-3 mr-1" /> Not connected
                </Badge>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">Provider: Titan</Badge>
              <Badge variant="outline">Connection: {isConnected ? "Connected" : "Not connected"}</Badge>
            </div>

            {emailStatus?.lastSyncAt && (
              <p className="text-sm text-muted-foreground">Last sync: {new Date(emailStatus.lastSyncAt).toLocaleString()}</p>
            )}
            {emailStatus?.lastSyncError && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Last sync issue</AlertTitle>
                <AlertDescription>{emailStatus.lastSyncError}</AlertDescription>
              </Alert>
            )}

            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>About your Titan app password</AlertTitle>
              <AlertDescription>
                Generate an app password in your Titan account, then enter it below. It is encrypted when saved and is never shown again—not even to you or an administrator.
              </AlertDescription>
            </Alert>

            {showPasswordForm && (
              <div className="space-y-2">
                <Label htmlFor="titan-app-password">Titan app password</Label>
                <Input
                  id="titan-app-password"
                  type="password"
                  autoComplete="new-password"
                  value={appPassword}
                  onChange={(event) => setAppPassword(event.target.value)}
                  placeholder="Enter your Titan app password"
                  data-testid="input-titan-app-password"
                />
                <p className="text-xs text-muted-foreground">This field is only shown while connecting or reconnecting. Your saved password is never displayed.</p>
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              {showPasswordForm ? (
                <>
                  <Button onClick={handleConnect} disabled={connectTitanMutation.isPending} data-testid="button-connect-titan">
                    {connectTitanMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Link2 className="h-4 w-4 mr-2" />}
                    {isReconnecting ? "Reconnect & Test Titan" : "Connect & Test Titan"}
                  </Button>
                  {isConnected && (
                    <Button variant="outline" onClick={() => { setIsReconnecting(false); setAppPassword(""); }}>
                      Cancel
                    </Button>
                  )}
                </>
              ) : (
                <Button variant="outline" onClick={() => setIsReconnecting(true)} data-testid="button-reconnect-titan">
                  <RefreshCw className="h-4 w-4 mr-2" /> Reconnect & Test
                </Button>
              )}
              <Button variant="outline" onClick={() => refetch()} disabled={isFetching} data-testid="button-refresh-status">
                <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`} /> Refresh status
              </Button>
              {isConnected && (
                <Button variant="destructive" onClick={() => disconnectTitanMutation.mutate()} disabled={disconnectTitanMutation.isPending} data-testid="button-disconnect-titan">
                  {disconnectTitanMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Unlink className="h-4 w-4 mr-2" />}
                  Disconnect Titan
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}