import { Camera } from 'expo-camera';
import * as FileSystem from 'expo-file-system';

export interface RecordingSession {
  id: string;
  startTime: number;
  duration: number;
  videoUri?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
}

export async function requestCameraPermission(): Promise<boolean> {
  const { status } = await Camera.requestCameraPermissionsAsync();
  return status === 'granted';
}

export async function requestMicrophonePermission(): Promise<boolean> {
  const { status } = await Camera.requestMicrophonePermissionsAsync();
  return status === 'granted';
}

export function createRecordingSession(): RecordingSession {
  return {
    id: `emergency_${Date.now()}`,
    startTime: Date.now(),
    duration: 0,
  };
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export async function saveRecording(uri: string, sessionId: string): Promise<string> {
  try {
    const directory = `${FileSystem.documentDirectory}emergency_recordings/`;
    await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
    
    const fileName = `${sessionId}.mp4`;
    const newUri = `${directory}${fileName}`;
    
    await FileSystem.copyAsync({
      from: uri,
      to: newUri,
    });
    
    return newUri;
  } catch (error) {
    console.error('Error saving recording:', error);
    throw error;
  }
}

export async function getRecordingsList(): Promise<string[]> {
  try {
    const directory = `${FileSystem.documentDirectory}emergency_recordings/`;
    const exists = await FileSystem.getInfoAsync(directory);
    
    if (!exists.exists) {
      return [];
    }
    
    const files = await FileSystem.readDirectoryAsync(directory);
    return files.filter(file => file.endsWith('.mp4'));
  } catch (error) {
    console.error('Error getting recordings:', error);
    return [];
  }
}
