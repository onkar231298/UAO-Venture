import React, { createContext, ReactNode, useContext } from "react";
import { useQuery, useMutation, UseMutationResult } from "@tanstack/react-query";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  userType: string;
  isAdmin: boolean;
}

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<User, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<any, Error, RegisterData>;
};

type LoginData = {
  email: string;
  password: string;
  captchaToken: string;
};

type RegisterData = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  companyName?: string;
  phoneNumber?: string;
  captchaToken: string;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<User | undefined, Error>({
    queryKey: ["/api/auth/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
  });

  const isAuthenticated = !!user;

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const res = await apiRequest("/api/login", { method: "POST", body: JSON.stringify(credentials), headers: { "Content-Type": "application/json" } });
      return await res.json();
    },
    onSuccess: (response: any) => {
      if (response.user) {
        queryClient.setQueryData(["/api/auth/user"], response.user);
        toast({
          title: "Login successful",
          description: response.message || "Welcome back!",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Login failed",
        description: error.message || "Invalid credentials",
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: RegisterData) => {
      const res = await apiRequest("/api/register", { method: "POST", body: JSON.stringify(credentials), headers: { "Content-Type": "application/json" } });
      return await res.json();
    },
    onSuccess: (response: any) => {
      toast({
        title: "Registration successful",
        description: response.message || "Account created successfully. Please check your email for verification.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Registration failed",
        description: error.message || "Registration failed",
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("/api/logout", { method: "POST" });
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/auth/user"], null);
      queryClient.clear();
      toast({
        title: "Logout successful",
        description: "You have been logged out successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Logout failed",
        description: error.message || "Logout failed",
        variant: "destructive",
      });
    },
  });

  return React.createElement(
    AuthContext.Provider,
    {
      value: {
        user: user ?? null,
        isLoading,
        isAuthenticated,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
      }
    },
    children
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}