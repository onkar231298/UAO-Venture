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
      .then(res => {
        if (!res.ok) {
          throw new Error(`Failed to fetch site key: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        console.log('reCAPTCHA site key loaded:', data.siteKey ? 'Success' : 'Failed');
        setSiteKey(data.siteKey);
      })
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
        async: true,
        defer: true,
        appendTo: "head",
      }}
    >
      {children}
    </GoogleReCaptchaProvider>
  );
}