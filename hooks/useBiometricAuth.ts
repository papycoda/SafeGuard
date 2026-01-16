import { useState, useEffect, useCallback } from 'react';
import * as LocalAuthentication from 'expo-local-authentication';
import { SecureStorageService } from '@/services/secureStorageService';
import logger from '@/services/secureLogger';

interface BiometricAuthState {
  isAvailable: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  biometricType: LocalAuthentication.AuthenticationType | null;
}

interface BiometricAuthOptions {
  promptMessage?: string;
  fallbackLabel?: string;
  cancelLabel?: string;
  requireAuthentication?: boolean;
}

const DEFAULT_OPTIONS: BiometricAuthOptions = {
  promptMessage: 'Authenticate to access SafeGuard',
  fallbackLabel: 'Use passcode',
  cancelLabel: 'Cancel',
  requireAuthentication: true,
};

export function useBiometricAuth(options: BiometricAuthOptions = DEFAULT_OPTIONS) {
  const [state, setState] = useState<BiometricAuthState>({
    isAvailable: false,
    isAuthenticated: false,
    isLoading: true,
    error: null,
    biometricType: null,
  });

  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Check biometric availability
  useEffect(() => {
    checkAvailability();
  }, []);

  // Check authentication status periodically
  useEffect(() => {
    const checkAuthStatus = async () => {
      const isAuth = await SecureStorageService.authenticateUser();
      setState(prev => ({ ...prev, isAuthenticated: isAuth }));
    };

    checkAuthStatus();

    // Re-check every 30 seconds
    const interval = setInterval(checkAuthStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const checkAvailability = async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      setState(prev => ({
        ...prev,
        isAvailable: hasHardware && isEnrolled,
        biometricType: supportedTypes.length > 0 ? supportedTypes[0] : null,
        isLoading: false,
      }));

      logger.info('Biometric availability checked', {
        hasHardware,
        isEnrolled,
        supportedTypes,
      });
    } catch (error) {
      logger.error('Error checking biometric availability', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Could not check biometric availability',
      }));
    }
  };

  const authenticate = useCallback(async (): Promise<boolean> => {
    if (!state.isAvailable) {
      logger.warn('Biometric authentication not available');
      return false;
    }

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: opts.promptMessage,
        fallbackLabel: opts.fallbackLabel,
        cancelLabel: opts.cancelLabel,
        disableDeviceFallback: false,
      });

      if (result.success) {
        await SecureStorageService.updateLastAuthTime();
        setState(prev => ({
          ...prev,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        }));
        logger.info('Biometric authentication successful');
        return true;
      } else {
        setState(prev => ({
          ...prev,
          isAuthenticated: false,
          isLoading: false,
          error: result.error === 'user_cancel' ? 'Authentication cancelled' : 'Authentication failed',
        }));
        logger.warn('Biometric authentication failed', { error: result.error });
        return false;
      }
    } catch (error) {
      logger.error('Error during biometric authentication', error);
      setState(prev => ({
        ...prev,
        isAuthenticated: false,
        isLoading: false,
        error: 'Authentication error occurred',
      }));
      return false;
    }
  }, [state.isAvailable, opts]);

  const requireAuth = useCallback(async (): Promise<boolean> => {
    // Check if still within timeout window
    const isAuth = await SecureStorageService.authenticateUser();
    if (isAuth) {
      setState(prev => ({ ...prev, isAuthenticated: true }));
      return true;
    }

    // Require re-authentication
    if (opts.requireAuthentication) {
      return await authenticate();
    }

    return false;
  }, [authenticate, opts.requireAuthentication]);

  const setSessionTimeout = useCallback(async (timeoutMs: number) => {
    await SecureStorageService.setSessionTimeout(timeoutMs);
    logger.info('Session timeout updated', { timeoutMs });
  }, []);

  const lockSession = useCallback(async () => {
    setState(prev => ({ ...prev, isAuthenticated: false }));
    logger.info('Session locked manually');
  }, []);

  const getBiometricLabel = useCallback((): string => {
    switch (state.biometricType) {
      case LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION:
        return 'Face ID';
      case LocalAuthentication.AuthenticationType.FINGERPRINT:
        return 'Fingerprint';
      case LocalAuthentication.AuthenticationType.IRIS:
        return 'Iris';
      default:
        return 'Biometric';
    }
  }, [state.biometricType]);

  return {
    ...state,
    authenticate,
    requireAuth,
    setSessionTimeout,
    lockSession,
    biometricLabel: getBiometricLabel(),
  };
}
