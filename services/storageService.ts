import AsyncStorage from '@react-native-async-storage/async-storage';
import { SecureStorageService, migrateToSecureStorage } from './secureStorageService';

export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relationship?: string;
}

export interface AppSettings {
  recordingDuration: number;
  voiceActivation: boolean;
  triggerPhrases: string[];
  emergencyContacts: EmergencyContact[];
  includeLocation: boolean;
  screenOffRecording: boolean;
}

const STORAGE_KEYS = {
  SETTINGS: 'app_settings',
  RECORDINGS: 'recordings_history',
  MIGRATION_COMPLETE: 'secure_storage_migration_complete',
};

// Initialize secure storage migration on module load
let migrationInProgress = false;

const DEFAULT_SETTINGS: AppSettings = {
  recordingDuration: 300,
  voiceActivation: true,
  triggerPhrases: ["I'm being pulled over", "I'm in danger", "Emergency"],
  emergencyContacts: [],
  includeLocation: true,
  screenOffRecording: true,
};

export async function getSettings(): Promise<AppSettings> {
  try {
    // Ensure migration is complete
    if (!migrationInProgress) {
      migrationInProgress = true;
      await migrateToSecureStorage();
    }

    const data = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
    const settings: AppSettings = data
      ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) }
      : { ...DEFAULT_SETTINGS };

    // Get emergency contacts from secure storage
    const secureContacts = await SecureStorageService.getEmergencyContacts();
    return { ...settings, emergencyContacts: secureContacts };
  } catch (error) {
    console.error('Error loading settings:', error);
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(settings: Partial<AppSettings>): Promise<void> {
  try {
    const current = await getSettings();
    const updated = { ...current, ...settings };

    // Save emergency contacts to secure storage
    if (settings.emergencyContacts) {
      await SecureStorageService.saveEmergencyContacts(updated.emergencyContacts);
    }

    // Save other settings to AsyncStorage
    const { emergencyContacts, ...otherSettings } = updated;
    await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(otherSettings));
  } catch (error) {
    console.error('Error saving settings:', error);
    throw error;
  }
}

export async function addEmergencyContact(contact: Omit<EmergencyContact, 'id'>): Promise<EmergencyContact> {
  const settings = await getSettings();
  const newContact: EmergencyContact = {
    ...contact,
    id: `contact_${Date.now()}`,
  };
  
  const updatedContacts = [...settings.emergencyContacts, newContact];
  await saveSettings({ emergencyContacts: updatedContacts });
  
  return newContact;
}

export async function removeEmergencyContact(contactId: string): Promise<void> {
  const settings = await getSettings();
  const updatedContacts = settings.emergencyContacts.filter(c => c.id !== contactId);
  await saveSettings({ emergencyContacts: updatedContacts });
}

export async function updateEmergencyContact(contactId: string, updates: Partial<EmergencyContact>): Promise<void> {
  const settings = await getSettings();
  const updatedContacts = settings.emergencyContacts.map(c =>
    c.id === contactId ? { ...c, ...updates } : c
  );
  await saveSettings({ emergencyContacts: updatedContacts });
}
