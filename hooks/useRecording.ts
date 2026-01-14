import { useState, useRef } from 'react';
import { CameraView } from 'expo-camera';
import { createRecordingSession, RecordingSession, saveRecording } from '@/services/recordingService';

export function useRecording() {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentSession, setCurrentSession] = useState<RecordingSession | null>(null);
  
  const cameraRef = useRef<CameraView>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const recordingRef = useRef<any>(null);

  const startRecording = async (maxDuration: number) => {
    try {
      if (!cameraRef.current) {
        throw new Error('Camera not ready');
      }

      const session = createRecordingSession();
      setCurrentSession(session);
      setIsRecording(true);
      setDuration(0);

      recordingRef.current = await cameraRef.current.recordAsync({
        maxDuration: maxDuration,
      });

      timerRef.current = setInterval(() => {
        setDuration(prev => {
          const newDuration = prev + 1;
          if (newDuration >= maxDuration) {
            stopRecording();
          }
          return newDuration;
        });
      }, 1000);

    } catch (error) {
      console.error('Error starting recording:', error);
      setIsRecording(false);
      throw error;
    }
  };

  const stopRecording = async (): Promise<string | null> => {
    try {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      if (cameraRef.current && isRecording) {
        cameraRef.current.stopRecording();
      }

      setIsRecording(false);

      if (recordingRef.current && currentSession) {
        const savedUri = await saveRecording(recordingRef.current.uri, currentSession.id);
        recordingRef.current = null;
        setCurrentSession(null);
        setDuration(0);
        return savedUri;
      }

      return null;
    } catch (error) {
      console.error('Error stopping recording:', error);
      setIsRecording(false);
      return null;
    }
  };

  return {
    isRecording,
    duration,
    currentSession,
    cameraRef,
    startRecording,
    stopRecording,
  };
}
