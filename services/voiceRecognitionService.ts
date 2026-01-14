import {
  requestPermissionsAsync,
  getPermissionsAsync,
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';

export interface VoiceRecognitionResult {
  transcript: string;
  isFinal: boolean;
  confidence?: number;
}

export interface VoiceRecognitionCallbacks {
  onResult?: (result: VoiceRecognitionResult) => void;
  onTriggerDetected?: (phrase: string) => void;
  onError?: (error: string) => void;
  onStart?: () => void;
  onEnd?: () => void;
}

let isListening = false;
let currentTriggerPhrases: string[] = [];

export async function requestVoicePermission(): Promise<boolean> {
  try {
    const { status } = await requestPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Error requesting voice permission:', error);
    return false;
  }
}

export async function checkVoicePermission(): Promise<boolean> {
  try {
    const { status } = await getPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Error checking voice permission:', error);
    return false;
  }
}

export function setTriggerPhrases(phrases: string[]): void {
  currentTriggerPhrases = phrases.map(p => p.toLowerCase());
}

export function checkForTrigger(transcript: string): string | null {
  const lowerTranscript = transcript.toLowerCase();
  
  for (const phrase of currentTriggerPhrases) {
    if (lowerTranscript.includes(phrase)) {
      return phrase;
    }
  }
  
  return null;
}

export async function startVoiceRecognition(callbacks: VoiceRecognitionCallbacks): Promise<boolean> {
  try {
    const hasPermission = await checkVoicePermission();
    if (!hasPermission) {
      callbacks.onError?.('Microphone permission not granted');
      return false;
    }

    if (isListening) {
      console.log('Voice recognition already running');
      return true;
    }

    const result = await ExpoSpeechRecognitionModule.start({
      lang: 'en-US',
      interimResults: true,
      maxAlternatives: 1,
      continuous: true,
      requiresOnDeviceRecognition: false,
    });

    if (result.status === 'started') {
      isListening = true;
      callbacks.onStart?.();
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error starting voice recognition:', error);
    callbacks.onError?.('Failed to start voice recognition');
    return false;
  }
}

export async function stopVoiceRecognition(): Promise<void> {
  try {
    if (!isListening) return;
    
    await ExpoSpeechRecognitionModule.stop();
    isListening = false;
  } catch (error) {
    console.error('Error stopping voice recognition:', error);
  }
}

export function getIsListening(): boolean {
  return isListening;
}

export function useVoiceRecognition(
  triggerPhrases: string[],
  callbacks: VoiceRecognitionCallbacks
) {
  useSpeechRecognitionEvent('result', (event) => {
    const transcript = event.results[0]?.transcript || '';
    const isFinal = event.isFinal;
    
    callbacks.onResult?.({
      transcript,
      isFinal,
      confidence: event.results[0]?.confidence,
    });

    const detectedPhrase = checkForTrigger(transcript);
    if (detectedPhrase && isFinal) {
      callbacks.onTriggerDetected?.(detectedPhrase);
    }
  });

  useSpeechRecognitionEvent('error', (event) => {
    callbacks.onError?.(event.error || 'Unknown error');
  });

  useSpeechRecognitionEvent('end', () => {
    isListening = false;
    callbacks.onEnd?.();
  });
}
