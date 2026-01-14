import AsyncStorage from '@react-native-async-storage/async-storage';

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
};

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
    const data = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (data) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
    }
    return DEFAULT_SETTINGS;
  } catch (error) {
    console.error('Error loading settings:', error);
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(settings: Partial<AppSettings>): Promise<void> {
  try {
    const current = await getSettings();
    const updated = { ...current, ...settings };
    await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
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
