import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { detectUserCurrency } from '@/lib/currencyUtils';

interface CurrencyContextType {
  currency: string;
  isLoading: boolean;
  setCurrency: (currency: string) => void;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

interface CurrencyProviderProps {
  children: ReactNode;
}

export function CurrencyProvider({ children }: CurrencyProviderProps) {
  const [currency, setCurrency] = useState<string>('USD');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const detectCurrency = async () => {
      try {
        // Set a timeout for currency detection to prevent long loading
        const timeout = new Promise<string>((_, reject) => 
          setTimeout(() => reject(new Error('Currency detection timeout')), 3000)
        );
        
        const detectedCurrency = await Promise.race([
          detectUserCurrency(),
          timeout
        ]);
        
        setCurrency(detectedCurrency);
        console.log(`🌐 Global currency context set to: ${detectedCurrency}`);
      } catch (error) {
        console.warn('Currency detection failed, defaulting to USD:', error);
        setCurrency('USD');
      } finally {
        setIsLoading(false);
      }
    };

    detectCurrency();
  }, []);

  return (
    <CurrencyContext.Provider value={{ currency, isLoading, setCurrency }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}