import { useState, useEffect, createContext, useContext } from 'react';

interface CustomerUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  companyName: string;
  phoneNumber: string;
  streetAddress?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country: string;
  industryType: string;
  accountStatus: string;
  createdAt: string;
  updatedAt: string;
}

interface CustomerAuthContextType {
  customer: CustomerUser | null;
  isCustomerAuthenticated: boolean;
  loginCustomer: (userData: CustomerUser) => void;
  logoutCustomer: () => void;
}

const CustomerAuthContext = createContext<CustomerAuthContextType | undefined>(undefined);

export function CustomerAuthProvider({ children }: { children: React.ReactNode }) {
  const [customer, setCustomer] = useState<CustomerUser | null>(null);

  useEffect(() => {
    let active = true;

    const verifyCustomerSession = async () => {
      try {
        const response = await fetch('/api/auth/customer-session', { credentials: 'include' });
        if (!active) return;
        if (!response.ok) {
          setCustomer(null);
          return;
        }
        const result = await response.json();
        if (!active) return;
        setCustomer(result.user);
      } catch (error) {
        // Keep the last verified session state during a temporary network failure.
        console.error('Could not verify customer session:', error);
      }
    };

    const verifyWhenVisible = () => {
      if (document.visibilityState === 'visible') void verifyCustomerSession();
    };

    // The server session is the source of truth; never hydrate customer identity
    // from browser storage where it could overlap with a later staff login.
    try {
      localStorage.removeItem('customer_user_data');
    } catch {
      // Local storage is optional; authenticated state always comes from the server.
    }
    void verifyCustomerSession();
    window.addEventListener('focus', verifyCustomerSession);
    document.addEventListener('visibilitychange', verifyWhenVisible);

    return () => {
      active = false;
      window.removeEventListener('focus', verifyCustomerSession);
      document.removeEventListener('visibilitychange', verifyWhenVisible);
    };
  }, []);

  const loginCustomer = (userData: CustomerUser) => {
    setCustomer(userData);
  };

  const logoutCustomer = () => {
    setCustomer(null);
    try {
      localStorage.removeItem('customer_user_data');
    } catch {
      // Continue with server logout even if local storage is unavailable.
    }
    window.location.href = '/api/logout';
  };

  return (
    <CustomerAuthContext.Provider 
      value={{ 
        customer, 
        isCustomerAuthenticated: !!customer, 
        loginCustomer, 
        logoutCustomer 
      }}
    >
      {children}
    </CustomerAuthContext.Provider>
  );
}

export function useCustomerAuth() {
  const context = useContext(CustomerAuthContext);
  if (context === undefined) {
    throw new Error('useCustomerAuth must be used within a CustomerAuthProvider');
  }
  return context;
}