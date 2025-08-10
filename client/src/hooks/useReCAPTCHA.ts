import { useGoogleReCaptcha } from "react-google-recaptcha-v3";
import { useCallback } from "react";
import { apiRequest } from "@/lib/queryClient";

export interface ReCAPTCHAResult {
  success: boolean;
  score?: number;
  message: string;
  errors?: string[];
}

export function useReCAPTCHA() {
  const { executeRecaptcha } = useGoogleReCaptcha();

  const verifyRecaptcha = useCallback(async (action = "registration"): Promise<ReCAPTCHAResult> => {
    if (!executeRecaptcha) {
      return {
        success: false,
        message: "reCAPTCHA not initialized"
      };
    }

    try {
      // Execute reCAPTCHA and get token
      const token = await executeRecaptcha(action);
      
      if (!token) {
        return {
          success: false,
          message: "Failed to generate reCAPTCHA token"
        };
      }

      // Verify token with backend
      const response = await apiRequest('/api/verify-recaptcha', {
        method: 'POST',
        body: JSON.stringify({ token }),
      });

      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          score: data.score,
          message: data.message
        };
      } else {
        const errorData = await response.json();
        return {
          success: false,
          score: errorData.score,
          message: errorData.message,
          errors: errorData.errors
        };
      }
    } catch (error) {
      console.error("reCAPTCHA verification error:", error);
      return {
        success: false,
        message: "Network error during reCAPTCHA verification"
      };
    }
  }, [executeRecaptcha]);

  return {
    verifyRecaptcha,
    isReady: !!executeRecaptcha
  };
}