import { useGoogleReCaptcha } from "react-google-recaptcha-v3";
import { useCallback } from "react";

export function useReCAPTCHA() {
  const { executeRecaptcha } = useGoogleReCaptcha();

  const executeReCaptcha = useCallback(async (action = "registration"): Promise<string | null> => {
    if (!executeRecaptcha) {
      console.log("reCAPTCHA not ready");
      return null;
    }

    try {
      const token = await executeRecaptcha(action);
      console.log("reCAPTCHA token generated successfully");
      return token;
    } catch (error) {
      console.error("reCAPTCHA execution error:", error);
      return null;
    }
  }, [executeRecaptcha]);

  return {
    executeReCaptcha,
    isReady: !!executeRecaptcha
  };
}