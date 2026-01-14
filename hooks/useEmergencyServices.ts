import { useState, useEffect, useCallback } from 'react';
import {
  EmergencyNumber,
  getLocalEmergencyNumber,
  callEmergencyNumber,
  formatEmergencyDisplay,
} from '@/services/emergencyServicesService';
import { LocationData } from '@/services/locationService';

export function useEmergencyServices(location?: LocationData) {
  const [emergencyNumber, setEmergencyNumber] = useState<EmergencyNumber | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadEmergencyNumber = useCallback(async () => {
    if (!location) {
      setEmergencyNumber(null);
      return;
    }

    setIsLoading(true);
    try {
      const number = await getLocalEmergencyNumber(
        location.latitude,
        location.longitude
      );
      setEmergencyNumber(number);
    } catch (error) {
      console.error('Error loading emergency number:', error);
    } finally {
      setIsLoading(false);
    }
  }, [location]);

  useEffect(() => {
    loadEmergencyNumber();
  }, [loadEmergencyNumber]);

  const callEmergency = useCallback(async () => {
    if (!emergencyNumber?.emergency_number) return false;
    return await callEmergencyNumber(emergencyNumber.emergency_number);
  }, [emergencyNumber]);

  const callPolice = useCallback(async () => {
    if (!emergencyNumber?.police_number) return false;
    return await callEmergencyNumber(emergencyNumber.police_number);
  }, [emergencyNumber]);

  const callAmbulance = useCallback(async () => {
    if (!emergencyNumber?.ambulance_number) return false;
    return await callEmergencyNumber(emergencyNumber.ambulance_number);
  }, [emergencyNumber]);

  const displayText = emergencyNumber ? formatEmergencyDisplay(emergencyNumber) : null;

  return {
    emergencyNumber,
    isLoading,
    displayText,
    callEmergency,
    callPolice,
    callAmbulance,
    refresh: loadEmergencyNumber,
  };
}
