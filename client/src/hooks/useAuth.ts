import { useQuery } from "@tanstack/react-query";
import { useCallback } from "react";

export function useAuth() {
  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/auth/user"],
    queryFn: async () => {
      const response = await fetch("/api/auth/user", { credentials: "include" });
      if (response.status === 401 || response.status === 403) return null;
      if (!response.ok) {
        const message = (await response.text()) || response.statusText;
        throw new Error(`${response.status}: ${message}`);
      }
      return response.json();
    },
    retry: false,
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });

  const logout = useCallback(() => {
    // Navigate to logout endpoint which will destroy session and redirect to login
    window.location.href = '/api/logout';
  }, []);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    logout,
  };
}
