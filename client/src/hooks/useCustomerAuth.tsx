import { useState, useEffect, createContext, useContext } from 'react';
import type { ReactNode } from 'react';

interface CustomerUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  companyName: string;
  phoneNumber: string;
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

export function CustomerAuthProvider({ children }: { children: ReactNode }) {
  const [customer, setCustomer] = useState<CustomerUser | null>(null);

  useEffect(() => {
    // Check for stored customer data on mount
    const storedCustomer = localStorage.getItem('customer_user_data');
    if (storedCustomer) {
      try {
        setCustomer(JSON.parse(storedCustomer));
      } catch (error) {
        console.error('Error parsing stored customer data:', error);
        localStorage.removeItem('customer_user_data');
      }
    }
  }, []);

  const loginCustomer = (userData: CustomerUser) => {
    setCustomer(userData);
    localStorage.setItem('customer_user_data', JSON.stringify(userData));
  };

  const logoutCustomer = () => {
    setCustomer(null);
    localStorage.removeItem('customer_user_data');
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