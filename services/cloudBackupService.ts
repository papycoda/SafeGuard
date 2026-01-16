import { getSupabaseClient } from '@/template';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';
import { RateLimiter, ValidationService } from './validationService';
import logger from './secureLogger';

export interface EmergencyRecording {
  id: string;
  user_id: string | null;
  video_path: string;
  video_url: string;
  emergency_type: 'pulled_over' | 'danger';
  duration_seconds: number;
  location_latitude: number | null;
  location_longitude: number | null;
  location_address: string | null;
  shared_with: string[] | null;
  created_at: string;
  updated_at: string;
}

export async function uploadVideoToCloud(
  videoUri: string,
  emergencyType: 'pulled_over' | 'danger',
  durationSeconds: number,
  location?: { latitude: number; longitude: number; address?: string }
): Promise<{ url: string; path: string; recordingId: string } | null> {
  try {
    // Validate inputs
    if (!videoUri || typeof videoUri !== 'string') {
      logger.error('Invalid video URI', { videoUri });
      return null;
    }

    // Check rate limiting
    const rateLimitResult = await RateLimiter.checkLimit('video_upload');
    if (!rateLimitResult.allowed) {
      logger.warn('Rate limit exceeded for video uploads');
      throw new Error('Too many upload attempts. Please try again later.');
    }

    // Validate emergency type
    if (emergencyType !== 'pulled_over' && emergencyType !== 'danger') {
      logger.error('Invalid emergency type', { emergencyType });
      return null;
    }

    // Validate duration
    if (typeof durationSeconds !== 'number' || durationSeconds <= 0 || durationSeconds > 3600) {
      logger.error('Invalid duration', { durationSeconds });
      return null;
    }

    // Validate location if provided
    if (location) {
      const locationValidation = ValidationService.validateLocation(location);
      if (!locationValidation.isValid) {
        logger.error('Invalid location data', locationValidation.error);
        return null;
      }
    }

    const supabase = getSupabaseClient();
    const timestamp = Date.now();
    const fileName = `${emergencyType}_${timestamp}.mp4`;
    const filePath = `recordings/${fileName}`;

    logger.info('Starting video upload', { fileName, durationSeconds });

    const base64Data = await FileSystem.readAsStringAsync(videoUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const arrayBuffer = decode(base64Data);

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('emergency-videos')
      .upload(filePath, arrayBuffer, {
        contentType: 'video/mp4',
        upsert: false,
      });

    if (uploadError) {
      logger.error('Storage upload error', uploadError);
      return null;
    }

    const { data: publicUrlData } = supabase.storage
      .from('emergency-videos')
      .getPublicUrl(filePath);

    const videoUrl = publicUrlData.publicUrl;

    const { data: { user } } = await supabase.auth.getUser();

    const { data: recordingData, error: dbError } = await supabase
      .from('emergency_recordings')
      .insert({
        user_id: user?.id || null,
        video_path: filePath,
        video_url: videoUrl,
        emergency_type: emergencyType,
        duration_seconds: durationSeconds,
        location_latitude: location?.latitude || null,
        location_longitude: location?.longitude || null,
        location_address: location?.address || null,
      })
      .select()
      .single();

    if (dbError) {
      logger.error('Database insert error', dbError);
      return null;
    }

    logger.info('Video upload successful', { recordingId: recordingData.id });

    return {
      url: videoUrl,
      path: filePath,
      recordingId: recordingData.id,
    };
  } catch (error) {
    logger.error('Error uploading video', error);
    return null;
  }
}

export async function getMyRecordings(): Promise<EmergencyRecording[]> {
  try {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('emergency_recordings')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Error fetching recordings', error);
      return [];
    }

    logger.info('Recordings retrieved successfully', { count: data?.length || 0 });
    return data || [];
  } catch (error) {
    logger.error('Error getting recordings', error);
    return [];
  }
}

export async function deleteRecording(recordingId: string): Promise<boolean> {
  try {
    // Validate recording ID
    if (!recordingId || typeof recordingId !== 'string') {
      logger.error('Invalid recording ID', { recordingId });
      return false;
    }

    const supabase = getSupabaseClient();

    const { data: recording } = await supabase
      .from('emergency_recordings')
      .select('video_path')
      .eq('id', recordingId)
      .single();

    if (recording?.video_path) {
      await supabase.storage
        .from('emergency-videos')
        .remove([recording.video_path]);
    }

    const { error } = await supabase
      .from('emergency_recordings')
      .delete()
      .eq('id', recordingId);

    if (error) {
      logger.error('Error deleting recording', error);
      return false;
    }

    logger.info('Recording deleted successfully', { recordingId });
    return true;
  } catch (error) {
    logger.error('Error deleting recording', error);
    return false;
  }
}

export async function shareRecording(
  recordingId: string,
  sharedWith: string[]
): Promise<boolean> {
  try {
    // Validate inputs
    if (!recordingId || typeof recordingId !== 'string') {
      logger.error('Invalid recording ID', { recordingId });
      return false;
    }

    if (!Array.isArray(sharedWith)) {
      logger.error('Invalid sharedWith parameter', { sharedWith });
      return false;
    }

    const supabase = getSupabaseClient();

    const { error } = await supabase
      .from('emergency_recordings')
      .update({ shared_with: sharedWith })
      .eq('id', recordingId);

    if (error) {
      logger.error('Error sharing recording', error);
      return false;
    }

    logger.info('Recording shared successfully', { recordingId, shareCount: sharedWith.length });
    return true;
  } catch (error) {
    logger.error('Error sharing recording', error);
    return false;
  }
}

export function getShareableMessage(recording: EmergencyRecording): string {
  const type = recording.emergency_type === 'pulled_over' ? 'Traffic Stop' : 'Emergency';
  const date = new Date(recording.created_at).toLocaleString();
  
  let message = `🚨 ${type} Recording\n\n`;
  message += `Date: ${date}\n`;
  message += `Duration: ${Math.floor(recording.duration_seconds / 60)}m ${recording.duration_seconds % 60}s\n\n`;
  
  if (recording.location_latitude && recording.location_longitude) {
    message += `Location: https://www.google.com/maps?q=${recording.location_latitude},${recording.location_longitude}\n\n`;
  }
  
  message += `Video: ${recording.video_url}`;
  
  return message;
}
