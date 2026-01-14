import { getSupabaseClient } from '@/template';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';

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
    const supabase = getSupabaseClient();
    
    const timestamp = Date.now();
    const fileName = `${emergencyType}_${timestamp}.mp4`;
    const filePath = `recordings/${fileName}`;

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
      console.error('Upload error:', uploadError);
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
      console.error('Database error:', dbError);
      return null;
    }

    return {
      url: videoUrl,
      path: filePath,
      recordingId: recordingData.id,
    };
  } catch (error) {
    console.error('Error uploading video:', error);
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
      console.error('Error fetching recordings:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error getting recordings:', error);
    return [];
  }
}

export async function deleteRecording(recordingId: string): Promise<boolean> {
  try {
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
      console.error('Error deleting recording:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error deleting recording:', error);
    return false;
  }
}

export async function shareRecording(
  recordingId: string,
  sharedWith: string[]
): Promise<boolean> {
  try {
    const supabase = getSupabaseClient();
    
    const { error } = await supabase
      .from('emergency_recordings')
      .update({ shared_with: sharedWith })
      .eq('id', recordingId);

    if (error) {
      console.error('Error sharing recording:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error sharing recording:', error);
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
