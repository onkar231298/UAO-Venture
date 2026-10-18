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

    // Use cached display data until the server verifies the customer's session.
    const storedCustomer = localStorage.getItem('customer_user_data');
    if (storedCustomer) {
      try {
        setCustomer(JSON.parse(storedCustomer));
      } catch (error) {
        console.error('Error parsing stored customer data:', error);
        localStorage.removeItem('customer_user_data');
      }
    }

    fetch('/api/auth/customer-session', { credentials: 'include' })
      .then(async (response) => {
        if (!active) return;
        if (!response.ok) {
          // Don't let a late response from the initial session check erase a
          // login that completed while that request was still in flight.
          if (localStorage.getItem('customer_user_data') === storedCustomer) {
            setCustomer(null);
            localStorage.removeItem('customer_user_data');
          }
          return;
        }
        const result = await response.json();
        if (!active) return;
        setCustomer(result.user);
        localStorage.setItem('customer_user_data', JSON.stringify(result.user));
      })
      .catch((error) => {
        // Keep the cached name visible during a temporary network failure. All
        // customer data writes and reads are still authorized by the server.
        console.error('Could not verify customer session:', error);
      });

    return () => {
      active = false;
    };
  }, []);

  const loginCustomer = (userData: CustomerUser) => {
    setCustomer(userData);
    localStorage.setItem('customer_user_data', JSON.stringify(userData));
  };

  const logoutCustomer = () => {
    setCustomer(null);
    localStorage.removeItem('customer_user_data');
    void fetch('/api/logout', { credentials: 'include' }).catch((error) => {
      console.error('Could not end customer server session:', error);
    });
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