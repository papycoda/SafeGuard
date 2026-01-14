import { useState, useEffect } from 'react';
import { getCurrentLocation, LocationData, requestLocationPermission } from '@/services/locationService';

export function useLocation() {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [hasPermission, setHasPermission] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkPermission();
  }, []);

  const checkPermission = async () => {
    const granted = await requestLocationPermission();
    setHasPermission(granted);
    if (granted) {
      fetchLocation();
    }
  };

  const fetchLocation = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const loc = await getCurrentLocation();
      if (loc) {
        setLocation(loc);
      } else {
        setError('Could not get location');
      }
    } catch (err) {
      setError('Location error');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    location,
    hasPermission,
    isLoading,
    error,
    refreshLocation: fetchLocation,
  };
}
