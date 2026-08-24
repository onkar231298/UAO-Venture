import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useInfiniteQuery, useMutation, useQuery } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";
import {
  ArrowLeft,
  Check,
  ChevronLeft,
  Loader2,
  LogOut,
  MessageCircle,
  MessageSquarePlus,
  MoreVertical,
  Search,
  Send,
  Settings,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface StaffProfile {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  profileImageUrl: string | null;
  role: string | null;
  department: string | null;
  memberRole?: string;
}

interface ChatMessage {
  id: number;
  conversationId: number;
  senderId: string;
  body: string;
  createdAt: string;
  sender: StaffProfile;
}

interface ConversationSummary {
  id: number;
  type: "direct" | "group";
  name: string | null;
  department: string | null;
  ownerId: string | null;
  lastMessageAt: string | null;
  memberRole: string;
  lastReadMessageId: number;
  members: StaffProfile[];
  lastMessage: Omit<ChatMessage, "sender" | "conversationId"> | null;
  unreadCount: number;
}

interface MessagesResponse {
  messages: ChatMessage[];
  hasMore: boolean;
}

function displayName(profile?: Partial<StaffProfile> | null) {
  if (!profile) return "Staff member";
  const fullName = [profile.firstName, profile.lastName].filter(Boolean).join(" ").trim();
  return fullName || profile.email || "Staff member";
}

function initials(profile?: Partial<StaffProfile> | null) {
  const first = profile?.firstName?.[0] || "";
  const last = profile?.lastName?.[0] || "";
  const fallback = profile?.email?.[0] || "U";
  return `${first}${last}`.toUpperCase() || fallback.toUpperCase();
}

function roleLabel(role?: string | null) {
  return (role || "staff").replace(/_/g, " ");
}

function errorMessage(error: unknown, fallback: string) {
  const message = error instanceof Error ? error.message : "";
  const jsonStart = message.indexOf("{");
  if (jsonStart >= 0) {
    try {
      return JSON.parse(message.slice(jsonStart)).message || fallback;
    } catch {
      // Keep the readable fallback below.
    }
  }
  return message || fallback;
}

function Avatar({
  profile,
  size = "md",
}: {
  profile?: Partial<StaffProfile> | null;
  size?: "sm" | "md" | "lg";
}) {
  const classes = size === "sm" ? "h-8 w-8 text-xs" : size === "lg" ? "h-12 w-12 text-base" : "h-10 w-10 text-sm";
  if (profile?.profileImageUrl) {
    return (
      <img
        src={profile.profileImageUrl}
        alt={displayName(profile)}
        className={`${classes} rounded-full object-cover flex-shrink-0`}
      />
    );
  }
  return (
    <div className={`${classes} rounded-full bg-emerald-100 text-emerald-800 font-semibold flex items-center justify-center flex-shrink-0`}>
      {initials(profile)}
    </div>
  );
}

export default function InternalChat() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const currentUser = user as any;
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);
  const [conversationSearch, setConversationSearch] = useState("");
  const [debouncedConversationSearch, setDebouncedConversationSearch] = useState("");
  const [messageSearch, setMessageSearch] = useState("");
  const [draft, setDraft] = useState("");
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [newChatMode, setNewChatMode] = useState<"direct" | "group">("direct");
  const [staffSearch, setStaffSearch] = useState("");
  const [groupName, setGroupName] = useState("");
  const [selectedGroupMembers, setSelectedGroupMembers] = useState<Set<string>>(new Set());
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [groupRename, setGroupRename] = useState("");
  const [addMemberId, setAddMemberId] = useState("");
  const messagesPaneRef = useRef<HTMLDivElement>(null);
  const lastNewestMessageId = useRef<number | null>(null);

  const isStaff = !!currentUser && currentUser.role !== "customer";
  const backPath = currentUser?.role?.includes("sales")
    ? "/sales"
    : currentUser?.role?.includes("quality")
      ? "/quality/dashboard"
      : currentUser?.role === "admin" || currentUser?.role === "super_admin"
        ? "/admin"
        : "/staff";

  useEffect(() => {
    const timeout = window.setTimeout(
      () => setDebouncedConversationSearch(conversationSearch.trim()),
      250,
    );
    return () => window.clearTimeout(timeout);
  }, [conversationSearch]);

  const conversationsQuery = useInfiniteQuery<ConversationSummary[]>({
    queryKey: ["chat-conversations", debouncedConversationSearch],
    enabled: isAuthenticated && isStaff,
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams({
        limit: "50",
        offset: String(pageParam),
      });
      if (debouncedConversationSearch) {
        params.set("search", debouncedConversationSearch);
      }
      const response = await fetch(`/api/chat/conversations?${params.toString()}`, {
        credentials: "include",
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.message || "Failed to load conversations");
      }
      return response.json();
    },
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length === 50
        ? allPages.reduce((total, page) => total + page.length, 0)
        : undefined,
    refetchInterval: 8000,
    refetchOnWindowFocus: true,
  });

  const conversations = useMemo(() => {
    const seen = new Set<number>();
    return (conversationsQuery.data?.pages || [])
      .flatMap((page) => page)
      .filter((conversation) => {
        if (seen.has(conversation.id)) return false;
        seen.add(conversation.id);
        return true;
      });
  }, [conversationsQuery.data]);
  const conversationsLoading = conversationsQuery.isLoading;
  const conversationsError = conversationsQuery.isError;

  const { data: staffDirectory = [], isLoading: staffLoading } = useQuery<StaffProfile[]>({
    queryKey: ["/api/chat/staff", { search: staffSearch }],
    enabled: isAuthenticated && isStaff && (newChatOpen || settingsOpen),
    staleTime: 15000,
  });

  const selectedConversation =
    conversations.find((conversation) => conversation.id === selectedConversationId) || null;

  useEffect(() => {
    if (!selectedConversationId && conversations.length > 0 && window.innerWidth >= 768) {
      setSelectedConversationId(conversations[0].id);
    }
    if (
      selectedConversationId &&
      conversations.length > 0 &&
      !debouncedConversationSearch &&
      !conversations.some((conversation) => conversation.id === selectedConversationId)
    ) {
      setSelectedConversationId(null);
    }
  }, [conversations, selectedConversationId, debouncedConversationSearch]);

  useEffect(() => {
    if (selectedConversation) {
      setGroupRename(selectedConversation.name || "");
      setAddMemberId("");
    }
  }, [selectedConversation?.id, selectedConversation?.name]);

  const messagesQuery = useInfiniteQuery<MessagesResponse>({
    queryKey: ["chat-messages", selectedConversationId, messageSearch],
    enabled: !!selectedConversationId,
    initialPageParam: undefined as number | undefined,
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams({ limit: "50" });
      if (pageParam) params.set("beforeId", String(pageParam));
      if (messageSearch.trim()) params.set("search", messageSearch.trim());
      const response = await fetch(
        `/api/chat/conversations/${selectedConversationId}/messages?${params.toString()}`,
        { credentials: "include" },
      );
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.message || "Failed to load messages");
      }
      return response.json();
    },
    getNextPageParam: (lastPage) =>
      lastPage.hasMore && lastPage.messages.length > 0
        ? lastPage.messages[0].id
        : undefined,
    refetchInterval: messageSearch ? false : 4000,
    refetchOnWindowFocus: true,
  });

  const messages = useMemo(
    () =>
      (messagesQuery.data?.pages || [])
        .slice()
        .reverse()
        .flatMap((page) => page.messages),
    [messagesQuery.data],
  );

  const newestMessageId = messages[messages.length - 1]?.id || null;

  const markReadMutation = useMutation({
    mutationFn: async (conversationId: number) => {
      const response = await apiRequest(`/api/chat/conversations/${conversationId}/read`, {
        method: "POST",
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat-conversations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/chat/unread-count"] });
    },
  });

  useEffect(() => {
    if (selectedConversation?.unreadCount && newestMessageId) {
      markReadMutation.mutate(selectedConversation.id);
    }
    // Mark only when a new selected conversation/message state arrives.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedConversation?.id, selectedConversation?.unreadCount, newestMessageId]);

  useEffect(() => {
    if (!newestMessageId || newestMessageId === lastNewestMessageId.current) return;
    const changedConversation = lastNewestMessageId.current === null;
    lastNewestMessageId.current = newestMessageId;
    requestAnimationFrame(() => {
      const pane = messagesPaneRef.current;
      if (!pane) return;
      if (changedConversation || pane.scrollHeight - pane.scrollTop - pane.clientHeight < 220) {
        pane.scrollTop = pane.scrollHeight;
      }
    });
  }, [newestMessageId, selectedConversationId]);

  useEffect(() => {
    lastNewestMessageId.current = null;
    setDraft("");
    setMessageSearch("");
  }, [selectedConversationId]);

  const sendMessageMutation = useMutation({
    mutationFn: async (body: string) => {
      const response = await apiRequest(
        `/api/chat/conversations/${selectedConversationId}/messages`,
        {
          method: "POST",
          body: JSON.stringify({ body }),
        },
      );
      return response.json();
    },
    onSuccess: () => {
      setDraft("");
      queryClient.invalidateQueries({ queryKey: ["chat-messages", selectedConversationId] });
      queryClient.invalidateQueries({ queryKey: ["chat-conversations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/chat/unread-count"] });
    },
    onError: (error) => {
      toast({
        title: "Message not sent",
        description: errorMessage(error, "Please try again."),
        variant: "destructive",
      });
    },
  });

  const createDirectMutation = useMutation({
    mutationFn: async (recipientId: string) => {
      const response = await apiRequest("/api/chat/direct", {
        method: "POST",
        body: JSON.stringify({ recipientId }),
      });
      return response.json();
    },
    onSuccess: (conversation) => {
      setNewChatOpen(false);
      setStaffSearch("");
      setSelectedConversationId(conversation.id);
      queryClient.invalidateQueries({ queryKey: ["chat-conversations"] });
    },
    onError: (error) => {
      toast({
        title: "Could not start chat",
        description: errorMessage(error, "Please try again."),
        variant: "destructive",
      });
    },
  });

  const createGroupMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("/api/chat/groups", {
        method: "POST",
        body: JSON.stringify({
          name: groupName,
          memberIds: Array.from(selectedGroupMembers),
        }),
      });
      return response.json();
    },
    onSuccess: (conversation) => {
      setNewChatOpen(false);
      setGroupName("");
      setSelectedGroupMembers(new Set());
      setStaffSearch("");
      setSelectedConversationId(conversation.id);
      queryClient.invalidateQueries({ queryKey: ["chat-conversations"] });
      toast({ title: "Group created" });
    },
    onError: (error) => {
      toast({
        title: "Could not create group",
        description: errorMessage(error, "Please check the group details."),
        variant: "destructive",
      });
    },
  });

  const refreshConversation = () => {
    queryClient.invalidateQueries({ queryKey: ["chat-conversations"] });
    queryClient.invalidateQueries({ queryKey: ["/api/chat/unread-count"] });
  };

  const renameGroupMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest(`/api/chat/conversations/${selectedConversationId}`, {
        method: "PATCH",
        body: JSON.stringify({ name: groupRename }),
      });
      return response.json();
    },
    onSuccess: () => {
      refreshConversation();
      toast({ title: "Group renamed" });
    },
    onError: (error) =>
      toast({
        title: "Could not rename group",
        description: errorMessage(error, "Please try again."),
        variant: "destructive",
      }),
  });

  const addMemberMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest(
        `/api/chat/conversations/${selectedConversationId}/members`,
        {
          method: "POST",
          body: JSON.stringify({ userId: addMemberId }),
        },
      );
      return response.json();
    },
    onSuccess: () => {
      setAddMemberId("");
      refreshConversation();
      toast({ title: "Member added" });
    },
    onError: (error) =>
      toast({
        title: "Could not add member",
        description: errorMessage(error, "Please try again."),
        variant: "destructive",
      }),
  });

  const removeMemberMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiRequest(
        `/api/chat/conversations/${selectedConversationId}/members/${encodeURIComponent(userId)}`,
        { method: "DELETE" },
      );
      return response.json();
    },
    onSuccess: () => {
      refreshConversation();
      toast({ title: "Member removed" });
    },
    onError: (error) =>
      toast({
        title: "Could not remove member",
        description: errorMessage(error, "Please try again."),
        variant: "destructive",
      }),
  });

  const transferOwnerMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiRequest(
        `/api/chat/conversations/${selectedConversationId}/transfer-owner`,
        {
          method: "POST",
          body: JSON.stringify({ userId }),
        },
      );
      return response.json();
    },
    onSuccess: () => {
      refreshConversation();
      toast({ title: "Group ownership transferred" });
    },
    onError: (error) =>
      toast({
        title: "Could not transfer ownership",
        description: errorMessage(error, "Please try again."),
        variant: "destructive",
      }),
  });

  const leaveGroupMutation = useMutation({
    mutationFn: async () =>
      apiRequest(`/api/chat/conversations/${selectedConversationId}/leave`, { method: "POST" }),
    onSuccess: () => {
      setSettingsOpen(false);
      setSelectedConversationId(null);
      refreshConversation();
      toast({ title: "You left the group" });
    },
    onError: (error) =>
      toast({
        title: "Could not leave group",
        description: errorMessage(error, "Please try again."),
        variant: "destructive",
      }),
  });

  const closeGroupMutation = useMutation({
    mutationFn: async () =>
      apiRequest(`/api/chat/conversations/${selectedConversationId}/close`, { method: "POST" }),
    onSuccess: () => {
      setSettingsOpen(false);
      setSelectedConversationId(null);
      refreshConversation();
      toast({ title: "Group closed" });
    },
    onError: (error) =>
      toast({
        title: "Could not close group",
        description: errorMessage(error, "Please try again."),
        variant: "destructive",
      }),
  });

  const filteredConversations = conversations;

  const counterpart =
    selectedConversation?.members.find((member) => member.id !== currentUser?.id) || null;
  const conversationTitle =
    selectedConversation?.type === "group"
      ? selectedConversation.name || "Group chat"
      : displayName(counterpart);
  const canManageGroup =
    selectedConversation?.type === "group" &&
    (selectedConversation.ownerId === currentUser?.id ||
      currentUser?.role === "admin" ||
      currentUser?.role === "super_admin");
  const availableMembers = staffDirectory.filter(
    (staff) => !selectedConversation?.members.some((member) => member.id === staff.id),
  );

  const handleSend = (event: FormEvent) => {
    event.preventDefault();
    const body = draft.trim();
    if (!body || sendMessageMutation.isPending || !selectedConversationId) return;
    sendMessageMutation.mutate(body);
  };

  const toggleGroupMember = (userId: string) => {
    setSelectedGroupMembers((current) => {
      const next = new Set(current);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!isAuthenticated || !isStaff) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <Card className="max-w-md p-8 text-center space-y-4">
          <MessageCircle className="h-12 w-12 mx-auto text-slate-400" />
          <h1 className="text-xl font-semibold">Staff access required</h1>
          <p className="text-sm text-slate-600">Internal Chat is available only to active team members.</p>
          <Button onClick={() => navigate("/login")}>Go to login</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 p-0 md:p-4">
      <div className="mx-auto max-w-[1500px]">
        <div className="h-16 px-4 md:px-1 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <Link href={backPath}>
              <Button variant="ghost" size="icon" aria-label="Back to dashboard">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="h-10 w-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
              <MessageCircle className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h1 className="font-semibold text-slate-900 truncate">Internal Chat</h1>
              <p className="text-xs text-slate-500 truncate">Private team communication</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => (window.location.href = "/api/logout")}>
            <LogOut className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Log out</span>
          </Button>
        </div>

        <Card className="h-[calc(100vh-4rem)] md:h-[calc(100vh-6rem)] overflow-hidden rounded-none md:rounded-xl border-0 md:border shadow-none md:shadow-sm">
          <div className="h-full flex">
            <aside
              className={`w-full md:w-[350px] border-r bg-white flex-col ${
                selectedConversationId ? "hidden md:flex" : "flex"
              }`}
            >
              <div className="p-4 border-b space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-semibold text-slate-900">Messages</h2>
                    <p className="text-xs text-slate-500">{conversations.length} conversations</p>
                  </div>
                  <Button
                    size="icon"
                    className="rounded-full bg-emerald-600 hover:bg-emerald-700"
                    onClick={() => setNewChatOpen(true)}
                    aria-label="Start a new chat"
                  >
                    <MessageSquarePlus className="h-5 w-5" />
                  </Button>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    value={conversationSearch}
                    onChange={(event) => setConversationSearch(event.target.value)}
                    placeholder="Search conversations"
                    className="pl-9 bg-slate-50"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                {conversationsLoading ? (
                  <div className="h-40 flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
                  </div>
                ) : conversationsError ? (
                  <div className="p-6 text-center text-sm text-red-600">
                    Conversations could not be loaded. Please refresh the page.
                  </div>
                ) : filteredConversations.length === 0 ? (
                  <div className="p-8 text-center">
                    <MessageCircle className="h-10 w-10 mx-auto text-slate-300 mb-3" />
                    <p className="font-medium text-slate-700">
                      {conversationSearch ? "No conversations found" : "No conversations yet"}
                    </p>
                    <p className="text-sm text-slate-500 mt-1">
                      Start a private chat or create a team group.
                    </p>
                    {!conversationSearch && (
                      <Button className="mt-4" variant="outline" onClick={() => setNewChatOpen(true)}>
                        Start a chat
                      </Button>
                    )}
                  </div>
                ) : (
                  <>
                  {filteredConversations.map((conversation) => {
                    const other = conversation.members.find((member) => member.id !== currentUser.id);
                    const title =
                      conversation.type === "group"
                        ? conversation.name || "Group chat"
                        : displayName(other);
                    return (
                      <button
                        key={conversation.id}
                        type="button"
                        onClick={() => setSelectedConversationId(conversation.id)}
                        className={`w-full p-4 flex gap-3 text-left border-b transition-colors ${
                          selectedConversationId === conversation.id
                            ? "bg-emerald-50"
                            : "hover:bg-slate-50"
                        }`}
                      >
                        {conversation.type === "group" ? (
                          <div className="h-10 w-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center flex-shrink-0">
                            <Users className="h-5 w-5" />
                          </div>
                        ) : (
                          <Avatar profile={other} />
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-medium text-sm text-slate-900 truncate">{title}</p>
                            {conversation.lastMessage?.createdAt && (
                              <span className="text-[11px] text-slate-400 whitespace-nowrap">
                                {formatDistanceToNow(new Date(conversation.lastMessage.createdAt), {
                                  addSuffix: false,
                                })}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <p
                              className={`text-xs truncate flex-1 ${
                                conversation.unreadCount ? "font-medium text-slate-800" : "text-slate-500"
                              }`}
                            >
                              {conversation.lastMessage?.body || "No messages yet"}
                            </p>
                            {conversation.unreadCount > 0 && (
                              <Badge className="bg-emerald-600 text-white h-5 min-w-5 px-1.5 justify-center">
                                {conversation.unreadCount > 99 ? "99+" : conversation.unreadCount}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                  {conversationsQuery.hasNextPage && (
                    <div className="p-4 text-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => conversationsQuery.fetchNextPage()}
                        disabled={conversationsQuery.isFetchingNextPage}
                      >
                        {conversationsQuery.isFetchingNextPage && (
                          <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                        )}
                        Load more conversations
                      </Button>
                    </div>
                  )}
                  </>
                )}
              </div>
            </aside>

            <section
              className={`flex-1 min-w-0 bg-slate-50 flex-col ${
                selectedConversationId ? "flex" : "hidden md:flex"
              }`}
            >
              {!selectedConversation ? (
                <div className="flex-1 flex items-center justify-center p-8 text-center">
                  <div>
                    <div className="h-20 w-20 rounded-3xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-5">
                      <MessageCircle className="h-10 w-10" />
                    </div>
                    <h2 className="text-xl font-semibold text-slate-800">Select a conversation</h2>
                    <p className="text-sm text-slate-500 mt-2 max-w-sm">
                      Choose a colleague or group from the left to view your team messages.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="h-16 px-3 md:px-5 bg-white border-b flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="md:hidden"
                      onClick={() => setSelectedConversationId(null)}
                      aria-label="Back to conversations"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </Button>
                    {selectedConversation.type === "group" ? (
                      <div className="h-10 w-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center">
                        <Users className="h-5 w-5" />
                      </div>
                    ) : (
                      <Avatar profile={counterpart} />
                    )}
                    <div className="flex-1 min-w-0">
                      <h2 className="font-semibold text-slate-900 truncate">{conversationTitle}</h2>
                      <p className="text-xs text-slate-500 truncate">
                        {selectedConversation.type === "group"
                          ? `${selectedConversation.members.length} members`
                          : `${roleLabel(counterpart?.role)} · ${counterpart?.department || "team"}`}
                      </p>
                    </div>
                    <div className="relative hidden sm:block w-48">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                      <Input
                        value={messageSearch}
                        onChange={(event) => setMessageSearch(event.target.value)}
                        placeholder="Search messages"
                        className="h-9 pl-8 text-xs"
                      />
                    </div>
                    {selectedConversation.type === "group" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSettingsOpen(true)}
                        aria-label="Group settings"
                      >
                        <MoreVertical className="h-5 w-5" />
                      </Button>
                    )}
                  </div>

                  <div className="sm:hidden px-3 py-2 bg-white border-b">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        value={messageSearch}
                        onChange={(event) => setMessageSearch(event.target.value)}
                        placeholder="Search messages"
                        className="h-9 pl-9 text-xs"
                      />
                    </div>
                  </div>

                  <div ref={messagesPaneRef} className="flex-1 overflow-y-auto px-3 md:px-6 py-4">
                    {messagesQuery.hasNextPage && (
                      <div className="text-center mb-5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => messagesQuery.fetchNextPage()}
                          disabled={messagesQuery.isFetchingNextPage}
                        >
                          {messagesQuery.isFetchingNextPage && (
                            <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                          )}
                          Load older messages
                        </Button>
                      </div>
                    )}

                    {messagesQuery.isLoading ? (
                      <div className="h-full flex items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-center">
                        <div>
                          <MessageCircle className="h-10 w-10 mx-auto text-slate-300 mb-3" />
                          <p className="font-medium text-slate-700">
                            {messageSearch ? "No matching messages" : "Start the conversation"}
                          </p>
                          <p className="text-sm text-slate-500 mt-1">
                            {messageSearch
                              ? "Try another search phrase."
                              : "Send a message to your teammate."}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {messages.map((message, index) => {
                          const mine = message.senderId === currentUser.id;
                          const previous = messages[index - 1];
                          const showSender =
                            !mine &&
                            (selectedConversation.type === "group" ||
                              !previous ||
                              previous.senderId !== message.senderId);
                          const showDate =
                            !previous ||
                            format(new Date(previous.createdAt), "yyyy-MM-dd") !==
                              format(new Date(message.createdAt), "yyyy-MM-dd");
                          return (
                            <div key={message.id}>
                              {showDate && (
                                <div className="flex items-center gap-3 my-5">
                                  <Separator className="flex-1" />
                                  <span className="text-[11px] text-slate-400">
                                    {format(new Date(message.createdAt), "MMM d, yyyy")}
                                  </span>
                                  <Separator className="flex-1" />
                                </div>
                              )}
                              <div className={`flex ${mine ? "justify-end" : "justify-start"} gap-2`}>
                                {!mine && selectedConversation.type === "group" && (
                                  <Avatar profile={message.sender} size="sm" />
                                )}
                                <div className={`max-w-[82%] md:max-w-[68%] ${mine ? "items-end" : "items-start"} flex flex-col`}>
                                  {showSender && selectedConversation.type === "group" && (
                                    <span className="text-[11px] text-slate-500 mb-1 ml-1">
                                      {displayName(message.sender)}
                                    </span>
                                  )}
                                  <div
                                    className={`rounded-2xl px-3.5 py-2.5 shadow-sm ${
                                      mine
                                        ? "bg-emerald-600 text-white rounded-br-md"
                                        : "bg-white text-slate-800 border rounded-bl-md"
                                    }`}
                                  >
                                    <p className="text-sm whitespace-pre-wrap break-words">{message.body}</p>
                                    <p className={`text-[10px] mt-1 text-right ${mine ? "text-emerald-100" : "text-slate-400"}`}>
                                      {format(new Date(message.createdAt), "h:mm a")}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <form onSubmit={handleSend} className="p-3 md:p-4 bg-white border-t">
                    <div className="flex items-end gap-2">
                      <textarea
                        value={draft}
                        onChange={(event) => setDraft(event.target.value.slice(0, 5000))}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" && !event.shiftKey) {
                            event.preventDefault();
                            handleSend(event as any);
                          }
                        }}
                        rows={1}
                        placeholder="Write a message…"
                        className="flex-1 min-h-11 max-h-32 resize-y rounded-xl border border-input bg-background px-3 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      />
                      <Button
                        type="submit"
                        size="icon"
                        className="h-11 w-11 rounded-xl bg-emerald-600 hover:bg-emerald-700"
                        disabled={!draft.trim() || sendMessageMutation.isPending}
                      >
                        {sendMessageMutation.isPending ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <Send className="h-5 w-5" />
                        )}
                      </Button>
                    </div>
                    <div className="mt-1.5 flex justify-between text-[10px] text-slate-400 px-1">
                      <span>Enter to send · Shift+Enter for a new line</span>
                      <span>{draft.length}/5000</span>
                    </div>
                  </form>
                </>
              )}
            </section>
          </div>
        </Card>
      </div>

      <Dialog open={newChatOpen} onOpenChange={setNewChatOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Start a new chat</DialogTitle>
            <DialogDescription>Message one teammate or create a private group.</DialogDescription>
          </DialogHeader>
          <div className="flex rounded-lg bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setNewChatMode("direct")}
              className={`flex-1 rounded-md py-2 text-sm font-medium ${
                newChatMode === "direct" ? "bg-white shadow-sm" : "text-slate-500"
              }`}
            >
              Direct message
            </button>
            <button
              type="button"
              onClick={() => setNewChatMode("group")}
              className={`flex-1 rounded-md py-2 text-sm font-medium ${
                newChatMode === "group" ? "bg-white shadow-sm" : "text-slate-500"
              }`}
            >
              Group chat
            </button>
          </div>

          {newChatMode === "group" && (
            <Input
              value={groupName}
              onChange={(event) => setGroupName(event.target.value)}
              placeholder="Group name"
              maxLength={160}
            />
          )}

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              value={staffSearch}
              onChange={(event) => setStaffSearch(event.target.value)}
              placeholder="Search by name, email or department"
              className="pl-9"
            />
          </div>

          <div className="h-72 overflow-y-auto border rounded-lg divide-y">
            {staffLoading ? (
              <div className="h-full flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
              </div>
            ) : staffDirectory.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-slate-500">
                No active staff found
              </div>
            ) : (
              staffDirectory.map((staff) => {
                const selected = selectedGroupMembers.has(staff.id);
                return (
                  <button
                    key={staff.id}
                    type="button"
                    onClick={() =>
                      newChatMode === "direct"
                        ? createDirectMutation.mutate(staff.id)
                        : toggleGroupMember(staff.id)
                    }
                    disabled={createDirectMutation.isPending}
                    className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 text-left"
                  >
                    <Avatar profile={staff} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{displayName(staff)}</p>
                      <p className="text-xs text-slate-500 truncate">
                        {roleLabel(staff.role)} · {staff.department || "team"}
                      </p>
                    </div>
                    {newChatMode === "group" && (
                      <div
                        className={`h-6 w-6 rounded-full border flex items-center justify-center ${
                          selected ? "bg-emerald-600 border-emerald-600 text-white" : "border-slate-300"
                        }`}
                      >
                        {selected && <Check className="h-4 w-4" />}
                      </div>
                    )}
                  </button>
                );
              })
            )}
          </div>

          {newChatMode === "group" && (
            <DialogFooter>
              <Button variant="outline" onClick={() => setNewChatOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => createGroupMutation.mutate()}
                disabled={
                  groupName.trim().length < 2 ||
                  selectedGroupMembers.size === 0 ||
                  createGroupMutation.isPending
                }
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {createGroupMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create group ({selectedGroupMembers.size})
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Group details</DialogTitle>
            <DialogDescription>
              {canManageGroup ? "Manage the group name, members and ownership." : "View members or leave this group."}
            </DialogDescription>
          </DialogHeader>

          {canManageGroup && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Group name</label>
              <div className="flex gap-2">
                <Input
                  value={groupRename}
                  onChange={(event) => setGroupRename(event.target.value)}
                  maxLength={160}
                />
                <Button
                  variant="outline"
                  onClick={() => renameGroupMutation.mutate()}
                  disabled={groupRename.trim().length < 2 || renameGroupMutation.isPending}
                >
                  Save
                </Button>
              </div>
            </div>
          )}

          {canManageGroup && availableMembers.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Add a member</label>
              <div className="flex gap-2">
                <select
                  value={addMemberId}
                  onChange={(event) => setAddMemberId(event.target.value)}
                  className="flex-1 h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">Choose active staff</option>
                  {availableMembers.map((staff) => (
                    <option key={staff.id} value={staff.id}>
                      {displayName(staff)} — {staff.department || roleLabel(staff.role)}
                    </option>
                  ))}
                </select>
                <Button
                  variant="outline"
                  onClick={() => addMemberMutation.mutate()}
                  disabled={!addMemberId || addMemberMutation.isPending}
                >
                  <UserPlus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <h3 className="text-sm font-medium">Members ({selectedConversation?.members.length || 0})</h3>
            <div className="border rounded-lg divide-y">
              {selectedConversation?.members.map((member) => {
                const isOwner = selectedConversation.ownerId === member.id;
                return (
                  <div key={member.id} className="p-3 flex items-center gap-3">
                    <Avatar profile={member} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{displayName(member)}</p>
                      <p className="text-xs text-slate-500 truncate">
                        {isOwner ? "Group owner" : roleLabel(member.role)}
                      </p>
                    </div>
                    {isOwner && <Badge variant="secondary">Owner</Badge>}
                    {canManageGroup && !isOwner && (
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => transferOwnerMutation.mutate(member.id)}
                          disabled={transferOwnerMutation.isPending}
                        >
                          Make owner
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-600"
                          onClick={() => removeMemberMutation.mutate(member.id)}
                          disabled={removeMemberMutation.isPending}
                          aria-label={`Remove ${displayName(member)}`}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <Separator />
          <div className="flex flex-col sm:flex-row gap-2 justify-between">
            {selectedConversation?.ownerId !== currentUser.id && (
              <Button
                variant="outline"
                className="text-red-600"
                onClick={() => leaveGroupMutation.mutate()}
                disabled={leaveGroupMutation.isPending}
              >
                Leave group
              </Button>
            )}
            {canManageGroup && (
              <Button
                variant="destructive"
                className="sm:ml-auto"
                onClick={() => {
                  if (window.confirm("Close this group? Members will no longer be able to open or message it.")) {
                    closeGroupMutation.mutate();
                  }
                }}
                disabled={closeGroupMutation.isPending}
              >
                Close group
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}