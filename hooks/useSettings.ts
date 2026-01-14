import { useState, useEffect } from 'react';
import { getSettings, saveSettings, AppSettings, EmergencyContact, addEmergencyContact, removeEmergencyContact } from '@/services/storageService';

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const data = await getSettings();
      setSettings(data);
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateSettings = async (updates: Partial<AppSettings>) => {
    try {
      await saveSettings(updates);
      setSettings(prev => prev ? { ...prev, ...updates } : null);
    } catch (error) {
      console.error('Error updating settings:', error);
      throw error;
    }
  };

  const addContact = async (contact: Omit<EmergencyContact, 'id'>) => {
    try {
      const newContact = await addEmergencyContact(contact);
      await loadSettings();
      return newContact;
    } catch (error) {
      console.error('Error adding contact:', error);
      throw error;
    }
  };

  const removeContact = async (contactId: string) => {
    try {
      await removeEmergencyContact(contactId);
      await loadSettings();
    } catch (error) {
      console.error('Error removing contact:', error);
      throw error;
    }
  };

  return {
    settings,
    isLoading,
    updateSettings,
    addContact,
    removeContact,
    refreshSettings: loadSettings,
  };
}
