import { GoogleReCaptchaProvider } from "react-google-recaptcha-v3";
import { ReactNode, useState, useEffect } from "react";

interface ReCAPTCHAProviderProps {
  children: ReactNode;
}

export default function ReCAPTCHAProvider({ children }: ReCAPTCHAProviderProps) {
  // For development, we'll pass the key directly from server-side environment
  const [siteKey, setSiteKey] = useState<string | null>(null);
  
  useEffect(() => {
    // Fetch the site key from the server
    fetch('/api/recaptcha-site-key')
      .then(res => res.json())
      .then(data => setSiteKey(data.siteKey))
      .catch(err => console.error('Failed to fetch reCAPTCHA site key:', err));
  }, []);
  
  if (!siteKey) {
    return <>{children}</>;
  }

  return (
    <GoogleReCaptchaProvider
      reCaptchaKey={siteKey}
      language="en"
      useRecaptchaNet={false}
      useEnterprise={false}
      scriptProps={{
        async: false,
        defer: false,
        appendTo: "head",
        nonce: undefined,
      }}
    >
      {children}
    </GoogleReCaptchaProvider>
  );
}