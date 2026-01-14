import * as Location from 'expo-location';

export interface LocationData {
  latitude: number;
  longitude: number;
  timestamp: number;
  accuracy?: number;
}

export interface LocationAddress {
  street?: string;
  city?: string;
  region?: string;
  country?: string;
  postalCode?: string;
}

export async function requestLocationPermission(): Promise<boolean> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  return status === 'granted';
}

export async function getCurrentLocation(): Promise<LocationData | null> {
  try {
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });
    
    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      timestamp: location.timestamp,
      accuracy: location.coords.accuracy || undefined,
    };
  } catch (error) {
    console.error('Error getting location:', error);
    return null;
  }
}

export async function reverseGeocode(latitude: number, longitude: number): Promise<LocationAddress | null> {
  try {
    const results = await Location.reverseGeocodeAsync({ latitude, longitude });
    if (results.length > 0) {
      const result = results[0];
      return {
        street: result.street || undefined,
        city: result.city || undefined,
        region: result.region || undefined,
        country: result.country || undefined,
        postalCode: result.postalCode || undefined,
      };
    }
    return null;
  } catch (error) {
    console.error('Error reverse geocoding:', error);
    return null;
  }
}

export function formatLocationString(location: LocationData): string {
  return `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`;
}

export function getGoogleMapsUrl(latitude: number, longitude: number): string {
  return `https://www.google.com/maps?q=${latitude},${longitude}`;
}
