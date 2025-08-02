import { useEffect } from 'react';
import { useAuth } from './useAuth';
import { apiRequest } from '@/lib/queryClient';
import { detectUserCurrency } from '@/lib/currencyUtils';

export function useLocationSync() {
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    // Only sync location if user doesn't have location data saved
    if (user.country && user.currency) return;

    const syncUserLocation = async () => {
      try {
        // Detect currency based on location
        const detectedCurrency = await detectUserCurrency();
        
        // Get user's timezone
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        
        // Try to get geolocation if user permits
        const getLocation = (): Promise<{ latitude: number; longitude: number; country?: string }> => {
          return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
              reject(new Error('Geolocation not supported'));
              return;
            }

            navigator.geolocation.getCurrentPosition(
              (position) => {
                resolve({
                  latitude: position.coords.latitude,
                  longitude: position.coords.longitude
                });
              },
              (error) => {
                console.warn('Geolocation permission denied, using currency detection only');
                resolve({ latitude: 0, longitude: 0 });
              },
              { timeout: 10000, enableHighAccuracy: false }
            );
          });
        };

        const location = await getLocation();
        
        // Determine country from currency (basic mapping)
        const currencyToCountry: Record<string, string> = {
          'USD': 'United States',
          'EUR': 'European Union',
          'INR': 'India',
          'GBP': 'United Kingdom',
          'CAD': 'Canada',
          'AUD': 'Australia',
          'JPY': 'Japan',
          'CNY': 'China'
        };

        const country = currencyToCountry[detectedCurrency] || 'Unknown';

        // Save location data to backend
        await apiRequest('/api/user/location', {
          method: 'POST',
          body: JSON.stringify({
            country,
            currency: detectedCurrency,
            timezone,
            latitude: location.latitude || null,
            longitude: location.longitude || null,
          }),
          headers: {
            'Content-Type': 'application/json',
          },
        });

        console.log('User location synced successfully');
      } catch (error) {
        console.warn('Failed to sync user location:', error);
      }
    };

    // Delay the sync to ensure user is fully authenticated
    const timeoutId = setTimeout(syncUserLocation, 2000);
    
    return () => clearTimeout(timeoutId);
  }, [isAuthenticated, user]);
}