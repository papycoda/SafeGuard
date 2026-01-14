import { useState, useEffect, useCallback } from 'react';
import {
  requestVoicePermission,
  checkVoicePermission,
  startVoiceRecognition,
  stopVoiceRecognition,
  useVoiceRecognition,
  setTriggerPhrases,
  VoiceRecognitionCallbacks,
} from '@/services/voiceRecognitionService';

interface UseVoiceCommandsProps {
  triggerPhrases: string[];
  enabled: boolean;
  onTriggerDetected: (phrase: string) => void;
  onError?: (error: string) => void;
}

export function useVoiceCommands({
  triggerPhrases,
  enabled,
  onTriggerDetected,
  onError,
}: UseVoiceCommandsProps) {
  const [isListening, setIsListening] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [lastTranscript, setLastTranscript] = useState('');

  const callbacks: VoiceRecognitionCallbacks = {
    onResult: (result) => {
      setLastTranscript(result.transcript);
    },
    onTriggerDetected: (phrase) => {
      console.log('Trigger detected:', phrase);
      onTriggerDetected(phrase);
    },
    onError: (error) => {
      console.error('Voice recognition error:', error);
      setIsListening(false);
      onError?.(error);
    },
    onStart: () => {
      setIsListening(true);
    },
    onEnd: () => {
      setIsListening(false);
      if (enabled && hasPermission) {
        setTimeout(() => startListening(), 1000);
      }
    },
  };

  useVoiceRecognition(triggerPhrases, callbacks);

  const checkPermissions = useCallback(async () => {
    const granted = await checkVoicePermission();
    setHasPermission(granted);
    return granted;
  }, []);

  const requestPermissions = useCallback(async () => {
    const granted = await requestVoicePermission();
    setHasPermission(granted);
    return granted;
  }, []);

  const startListening = useCallback(async () => {
    if (!enabled) return false;

    let granted = hasPermission;
    if (!granted) {
      granted = await requestPermissions();
    }

    if (!granted) {
      onError?.('Microphone permission required for voice commands');
      return false;
    }

    setTriggerPhrases(triggerPhrases);
    const started = await startVoiceRecognition(callbacks);
    return started;
  }, [enabled, hasPermission, triggerPhrases]);

  const stopListening = useCallback(async () => {
    await stopVoiceRecognition();
    setIsListening(false);
  }, []);

  useEffect(() => {
    checkPermissions();
  }, [checkPermissions]);

  useEffect(() => {
    if (enabled && hasPermission) {
      startListening();
    } else {
      stopListening();
    }

    return () => {
      stopListening();
    };
  }, [enabled, hasPermission]);

  return {
    isListening,
    hasPermission,
    lastTranscript,
    requestPermissions,
    startListening,
    stopListening,
  };
}
