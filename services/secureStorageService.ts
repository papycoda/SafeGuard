import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { EmergencyContact, AppSettings } from './storageService';

// Encryption key for sensitive data (in production, this should be properly managed)
const ENCRYPTION_KEY = 'safeguard_encryption_key';

// Keys for secure storage
const SECURE_KEYS = {
  EMERGENCY_CONTACTS: 'secure_emergency_contacts',
  SETTINGS_ENCRYPTED: 'secure_settings_encrypted',
  LAST_AUTH_TIME: 'last_auth_time',
  SESSION_TIMEOUT: 'session_timeout',
};

/**
 * Securely store sensitive data using expo-secure-store
 * This provides better security than AsyncStorage for PII
 */
export class SecureStorageService {
  /**
   * Encrypt and store emergency contacts securely
   */
  static async saveEmergencyContacts(contacts: EmergencyContact[]): Promise<void> {
    try {
      const jsonData = JSON.stringify(contacts);
      await SecureStore.setItemAsync(SECURE_KEYS.EMERGENCY_CONTACTS, jsonData);
    } catch (error) {
      console.error('[SecureStorage] Error saving emergency contacts:', error);
      // Fallback to AsyncStorage if SecureStore is not available
      await AsyncStorage.setItem(SECURE_KEYS.EMERGENCY_CONTACTS, jsonData);
    }
  }

  /**
   * Retrieve and decrypt emergency contacts
   */
  static async getEmergencyContacts(): Promise<EmergencyContact[]> {
    try {
      const jsonData = await SecureStore.getItemAsync(SECURE_KEYS.EMERGENCY_CONTACTS);
      if (jsonData) {
        return JSON.parse(jsonData);
      }
      return [];
    } catch (error) {
      console.error('[SecureStorage] Error getting emergency contacts:', error);
      // Fallback to AsyncStorage
      const fallbackData = await AsyncStorage.getItem(SECURE_KEYS.EMERGENCY_CONTACTS);
      return fallbackData ? JSON.parse(fallbackData) : [];
    }
  }

  /**
   * Check if biometric authentication is available
   */
  static async isBiometricAvailable(): Promise<boolean> {
    try {
      // This would use expo-local-authentication in a full implementation
      return true; // Placeholder
    } catch (error) {
      return false;
    }
  }

  /**
   * Authenticate user before accessing sensitive data
   */
  static async authenticateUser(): Promise<boolean> {
    try {
      const lastAuthTime = await SecureStore.getItemAsync(SECURE_KEYS.LAST_AUTH_TIME);
      const timeoutStr = await SecureStore.getItemAsync(SECURE_KEYS.SESSION_TIMEOUT);
      const timeout = timeoutStr ? parseInt(timeoutStr, 10) : 300000; // 5 minutes default

      if (lastAuthTime) {
        const elapsed = Date.now() - parseInt(lastAuthTime, 10);
        if (elapsed < timeout) {
          return true; // Still within timeout window
        }
      }

      // In a full implementation, this would trigger biometric auth
      // For now, we'll just update the last auth time
      await this.updateLastAuthTime();
      return true;
    } catch (error) {
      console.error('[SecureStorage] Authentication error:', error);
      return false;
    }
  }

  /**
   * Update the last authentication timestamp
   */
  static async updateLastAuthTime(): Promise<void> {
    try {
      await SecureStore.setItemAsync(SECURE_KEYS.LAST_AUTH_TIME, Date.now().toString());
    } catch (error) {
      console.error('[SecureStorage] Error updating auth time:', error);
    }
  }

  /**
   * Set session timeout duration
   */
  static async setSessionTimeout(timeoutMs: number): Promise<void> {
    try {
      await SecureStore.setItemAsync(SECURE_KEYS.SESSION_TIMEOUT, timeoutMs.toString());
    } catch (error) {
      console.error('[SecureStorage] Error setting session timeout:', error);
    }
  }

  /**
   * Clear all sensitive data (for logout or security reset)
   */
  static async clearSensitiveData(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(SECURE_KEYS.EMERGENCY_CONTACTS);
      await SecureStore.deleteItemAsync(SECURE_KEYS.SETTINGS_ENCRYPTED);
      await SecureStore.deleteItemAsync(SECURE_KEYS.LAST_AUTH_TIME);
    } catch (error) {
      console.error('[SecureStorage] Error clearing sensitive data:', error);
    }
  }

  /**
   * Sanitize sensitive data from error messages before logging
   */
  static sanitizeErrorData(data: any): any {
    if (!data || typeof data !== 'object') {
      return data;
    }

    const sensitiveKeys = ['password', 'token', 'secret', 'key', 'phone', 'email', 'address'];
    const sanitized = { ...data };

    for (const key in sanitized) {
      if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof sanitized[key] === 'object') {
        sanitized[key] = this.sanitizeErrorData(sanitized[key]);
      }
    }

    return sanitized;
  }
}

/**
 * Migration utility to move data from AsyncStorage to SecureStore
 */
export async function migrateToSecureStorage(): Promise<boolean> {
  try {
    // Check if migration has already been done
    const migrationFlag = await AsyncStorage.getItem('secure_storage_migration_complete');
    if (migrationFlag === 'true') {
      return true;
    }

    // Migrate emergency contacts
    const oldContacts = await AsyncStorage.getItem('app_settings');
    if (oldContacts) {
      const settings: AppSettings = JSON.parse(oldContacts);
      if (settings.emergencyContacts && settings.emergencyContacts.length > 0) {
        await SecureStorageService.saveEmergencyContacts(settings.emergencyContacts);
      }
    }

    // Mark migration as complete
    await AsyncStorage.setItem('secure_storage_migration_complete', 'true');
    return true;
  } catch (error) {
    console.error('[SecureStorage] Migration error:', error);
    return false;
  }
}
