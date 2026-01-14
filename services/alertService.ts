import * as SMS from 'expo-sms';
import * as Linking from 'expo-linking';
import { EmergencyContact } from './storageService';
import { LocationData, getGoogleMapsUrl } from './locationService';

export interface EmergencyAlert {
  type: 'pulled_over' | 'danger';
  timestamp: number;
  location?: LocationData;
  videoUri?: string;
}

export async function checkSMSAvailability(): Promise<boolean> {
  return await SMS.isAvailableAsync();
}

export function createAlertMessage(alert: EmergencyAlert, contactName: string): string {
  const time = new Date(alert.timestamp).toLocaleTimeString();
  const type = alert.type === 'pulled_over' ? 'PULLED OVER' : 'DANGER';
  
  let message = `🚨 EMERGENCY ALERT 🚨\n\n`;
  message += `${contactName}, I activated emergency recording.\n\n`;
  message += `Type: ${type}\n`;
  message += `Time: ${time}\n`;
  
  if (alert.location) {
    const mapsUrl = getGoogleMapsUrl(alert.location.latitude, alert.location.longitude);
    message += `\nLocation:\n${mapsUrl}\n`;
  }
  
  message += `\nThis is an automated emergency message.`;
  
  return message;
}

export async function sendSMSAlert(
  contacts: EmergencyContact[],
  alert: EmergencyAlert
): Promise<{ success: boolean; error?: string }> {
  try {
    const isAvailable = await checkSMSAvailability();
    if (!isAvailable) {
      return { success: false, error: 'SMS not available on this device' };
    }
    
    const phoneNumbers = contacts.map(c => c.phone);
    const message = createAlertMessage(alert, 'Contact');
    
    await SMS.sendSMSAsync(phoneNumbers, message);
    
    return { success: true };
  } catch (error) {
    console.error('Error sending SMS:', error);
    return { success: false, error: 'Failed to send SMS' };
  }
}

export async function callEmergencyServices(countryCode: string = 'US'): Promise<void> {
  const emergencyNumbers: Record<string, string> = {
    US: '911',
    UK: '999',
    EU: '112',
    AU: '000',
  };
  
  const number = emergencyNumbers[countryCode] || '911';
  const url = `tel:${number}`;
  
  const canOpen = await Linking.canOpenURL(url);
  if (canOpen) {
    await Linking.openURL(url);
  }
}

export function simulateSMSSent(contacts: EmergencyContact[]): boolean {
  console.log(`[MOCK] SMS sent to ${contacts.length} contacts`);
  return true;
}
