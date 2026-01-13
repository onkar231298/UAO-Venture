import { useQuery } from "@tanstack/react-query";
import { useCallback } from "react";

export function useAuth() {
  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
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
