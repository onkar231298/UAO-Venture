import { useEffect, useRef, useCallback } from "react";
import { useAuth } from "./useAuth";

const HEARTBEAT_INTERVAL_MS = 2 * 60 * 1000;
const IDLE_TIMEOUT_MS = 3 * 60 * 1000;

export function useActivityHeartbeat() {
  const { user } = useAuth();
  const lastActivityRef = useRef(Date.now());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const sendHeartbeat = useCallback(async () => {
    if (!user?.id) return;
    if (Date.now() - lastActivityRef.current > IDLE_TIMEOUT_MS) return;

    try {
      await fetch("/api/activity/heartbeat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          page: window.location.pathname,
          action: "heartbeat",
        }),
      });
    } catch {
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    if (user.role === "customer" || user.userType === "customer") return;

    const updateActivity = () => {
      lastActivityRef.current = Date.now();
    };

    window.addEventListener("mousemove", updateActivity, { passive: true });
    window.addEventListener("keydown", updateActivity, { passive: true });
    window.addEventListener("click", updateActivity, { passive: true });
    window.addEventListener("scroll", updateActivity, { passive: true });
    window.addEventListener("touchstart", updateActivity, { passive: true });

    sendHeartbeat();

    intervalRef.current = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL_MS);

    return () => {
      window.removeEventListener("mousemove", updateActivity);
      window.removeEventListener("keydown", updateActivity);
      window.removeEventListener("click", updateActivity);
      window.removeEventListener("scroll", updateActivity);
      window.removeEventListener("touchstart", updateActivity);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [user?.id, user?.role, user?.userType, sendHeartbeat]);
}
