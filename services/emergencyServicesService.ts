import { getSupabaseClient } from '@/template';
import * as Linking from 'expo-linking';

export interface EmergencyNumber {
  id: string;
  country_code: string;
  country_name: string;
  emergency_number: string;
  police_number: string | null;
  ambulance_number: string | null;
  fire_number: string | null;
  notes: string | null;
}

export async function getEmergencyNumberByCountry(
  countryCode: string
): Promise<EmergencyNumber | null> {
  try {
    const supabase = getSupabaseClient();
    
    const { data, error } = await supabase
      .from('emergency_numbers')
      .select('*')
      .eq('country_code', countryCode.toUpperCase())
      .single();

    if (error) {
      console.error('Error fetching emergency number:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error getting emergency number:', error);
    return null;
  }
}

export async function getAllEmergencyNumbers(): Promise<EmergencyNumber[]> {
  try {
    const supabase = getSupabaseClient();
    
    const { data, error } = await supabase
      .from('emergency_numbers')
      .select('*')
      .order('country_name');

    if (error) {
      console.error('Error fetching emergency numbers:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error getting emergency numbers:', error);
    return [];
  }
}

export async function getLocalEmergencyNumber(
  latitude: number,
  longitude: number
): Promise<EmergencyNumber | null> {
  try {
    const countryCode = await getCountryCodeFromLocation(latitude, longitude);
    if (!countryCode) {
      return getFallbackEmergencyNumber();
    }

    const emergencyNumber = await getEmergencyNumberByCountry(countryCode);
    return emergencyNumber || getFallbackEmergencyNumber();
  } catch (error) {
    console.error('Error getting local emergency number:', error);
    return getFallbackEmergencyNumber();
  }
}

async function getCountryCodeFromLocation(
  latitude: number,
  longitude: number
): Promise<string | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=3`
    );
    
    if (!response.ok) return null;
    
    const data = await response.json();
    return data.address?.country_code?.toUpperCase() || null;
  } catch (error) {
    console.error('Error getting country code:', error);
    return null;
  }
}

function getFallbackEmergencyNumber(): EmergencyNumber {
  return {
    id: 'fallback',
    country_code: 'US',
    country_name: 'Default',
    emergency_number: '911',
    police_number: '911',
    ambulance_number: '911',
    fire_number: '911',
    notes: 'Fallback emergency number',
  };
}

export async function callEmergencyNumber(phoneNumber: string): Promise<boolean> {
  try {
    const url = `tel:${phoneNumber}`;
    const canOpen = await Linking.canOpenURL(url);
    
    if (!canOpen) {
      console.error('Cannot open phone dialer');
      return false;
    }

    await Linking.openURL(url);
    return true;
  } catch (error) {
    console.error('Error calling emergency number:', error);
    return false;
  }
}

export function formatEmergencyDisplay(emergency: EmergencyNumber): string {
  const numbers = [];
  
  if (emergency.emergency_number) {
    numbers.push(`Emergency: ${emergency.emergency_number}`);
  }
  if (emergency.police_number && emergency.police_number !== emergency.emergency_number) {
    numbers.push(`Police: ${emergency.police_number}`);
  }
  if (emergency.ambulance_number && emergency.ambulance_number !== emergency.emergency_number) {
    numbers.push(`Ambulance: ${emergency.ambulance_number}`);
  }
  if (emergency.fire_number && emergency.fire_number !== emergency.emergency_number) {
    numbers.push(`Fire: ${emergency.fire_number}`);
  }
  
  return numbers.join(' | ');
}
