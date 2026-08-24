import { MessageCircle } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";

export function InternalChatLauncher() {
  const { user, isAuthenticated } = useAuth();
  const [location] = useLocation();
  const role = (user as any)?.role || "";
  const isStaff = isAuthenticated && role && role !== "customer";

  const { data } = useQuery<{ count: number }>({
    queryKey: ["/api/chat/unread-count"],
    enabled: !!isStaff,
    refetchInterval: 10000,
    refetchOnWindowFocus: true,
  });

  if (!isStaff || location === "/chat") return null;

  const unreadCount = data?.count || 0;

  return (
    <Link href="/chat">
      <button
        type="button"
        className="fixed bottom-5 right-5 z-50 h-14 w-14 rounded-full bg-emerald-600 text-white shadow-lg hover:bg-emerald-700 hover:shadow-xl transition-all flex items-center justify-center"
        aria-label={unreadCount ? `Internal Chat, ${unreadCount} unread messages` : "Open Internal Chat"}
        title="Internal Chat"
      >
        <MessageCircle className="h-6 w-6" />
        {unreadCount > 0 && (
          <Badge className="absolute -top-1 -right-1 h-6 min-w-6 px-1 bg-red-500 text-white border-2 border-white justify-center">
            {unreadCount > 99 ? "99+" : unreadCount}
          </Badge>
        )}
      </button>
    </Link>
  );
}