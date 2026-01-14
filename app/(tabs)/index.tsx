import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraView } from 'expo-camera';
import { MaterialIcons } from '@expo/vector-icons';
import { useAlert } from '@/template';
import { colors, spacing, typography } from '@/constants/theme';
import { EmergencyButton, LocationDisplay, RecordingTimer } from '@/components';
import { useRecording } from '@/hooks/useRecording';
import { useLocation } from '@/hooks/useLocation';
import { useSettings } from '@/hooks/useSettings';
import { requestCameraPermission, requestMicrophonePermission } from '@/services/recordingService';
import { sendSMSAlert, simulateSMSSent } from '@/services/alertService';

export default function EmergencyScreen() {
  const insets = useSafeAreaInsets();
  const { showAlert } = useAlert();
  const [emergencyType, setEmergencyType] = useState<'pulled_over' | 'danger'>('pulled_over');
  const [hasPermissions, setHasPermissions] = useState(false);
  const [screenOff, setScreenOff] = useState(false);

  const { isRecording, duration, cameraRef, startRecording, stopRecording } = useRecording();
  const { location, isLoading: locationLoading, refreshLocation } = useLocation();
  const { settings } = useSettings();

  useEffect(() => {
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    const camera = await requestCameraPermission();
    const mic = await requestMicrophonePermission();
    setHasPermissions(camera && mic);

    if (!camera || !mic) {
      showAlert('Permissions Required', 'Camera and microphone access needed for emergency recording');
    }
  };

  const handleEmergencyPress = async () => {
    if (!hasPermissions) {
      await requestPermissions();
      return;
    }

    if (isRecording) {
      const videoUri = await stopRecording();
      setScreenOff(false);
      
      if (videoUri && settings?.emergencyContacts.length) {
        const result = simulateSMSSent(settings.emergencyContacts);
        showAlert(
          'Recording Saved',
          `Emergency alert sent to ${settings.emergencyContacts.length} contact(s)`
        );
      } else {
        showAlert('Recording Saved', 'Add emergency contacts in Settings to send alerts');
      }
    } else {
      const maxDuration = settings?.recordingDuration || 300;
      
      showAlert(
        'Start Emergency Recording?',
        `This will record video for up to ${Math.floor(maxDuration / 60)} minutes and alert your emergency contacts.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Start',
            style: 'destructive',
            onPress: async () => {
              try {
                await startRecording(maxDuration);
                if (settings?.screenOffRecording) {
                  setScreenOff(true);
                }
              } catch (error) {
                showAlert('Error', 'Could not start recording');
              }
            },
          },
        ]
      );
    }
  };

  if (screenOff && isRecording) {
    return (
      <View style={[styles.screenOffContainer, { paddingTop: insets.top }]}>
        <MaterialIcons name="lock" size={48} color={colors.textSubtle} />
        <Text style={styles.screenOffText}>Screen Off Mode</Text>
        <Text style={styles.screenOffSubtext}>Recording in progress...</Text>
        <Pressable onPress={() => setScreenOff(false)} style={styles.unlockButton}>
          <Text style={styles.unlockText}>Tap to view</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + spacing.md }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <MaterialIcons name="shield" size={32} color={colors.primary} />
          <Text style={styles.title}>SafeGuard</Text>
        </View>

        <Text style={styles.subtitle}>
          {isRecording ? 'Recording Active' : 'Ready for Emergency'}
        </Text>

        <View style={styles.emergencySection}>
          <View style={styles.typeSelector}>
            <Pressable
              onPress={() => setEmergencyType('pulled_over')}
              style={[
                styles.typeButton,
                emergencyType === 'pulled_over' && styles.typeButtonActive,
              ]}
            >
              <MaterialIcons
                name="local-police"
                size={20}
                color={emergencyType === 'pulled_over' ? colors.textPrimary : colors.textSecondary}
              />
              <Text
                style={[
                  styles.typeText,
                  emergencyType === 'pulled_over' && styles.typeTextActive,
                ]}
              >
                Pulled Over
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setEmergencyType('danger')}
              style={[
                styles.typeButton,
                emergencyType === 'danger' && styles.typeButtonActive,
              ]}
            >
              <MaterialIcons
                name="warning"
                size={20}
                color={emergencyType === 'danger' ? colors.textPrimary : colors.textSecondary}
              />
              <Text
                style={[
                  styles.typeText,
                  emergencyType === 'danger' && styles.typeTextActive,
                ]}
              >
                Danger
              </Text>
            </Pressable>
          </View>

          <EmergencyButton
            onPress={handleEmergencyPress}
            isActive={isRecording}
            type={emergencyType}
          />

          <Text style={styles.hint}>
            {isRecording ? 'Tap again to stop recording' : 'Tap to start emergency recording'}
          </Text>
        </View>

        {isRecording && settings && (
          <View style={styles.statusSection}>
            <RecordingTimer duration={duration} maxDuration={settings.recordingDuration} />
          </View>
        )}

        <View style={styles.infoSection}>
          <LocationDisplay
            location={location}
            isLoading={locationLoading}
            onRefresh={refreshLocation}
          />

          <View style={styles.contactsInfo}>
            <MaterialIcons name="contacts" size={20} color={colors.textSecondary} />
            <Text style={styles.contactsText}>
              {settings?.emergencyContacts.length || 0} emergency contact(s) configured
            </Text>
          </View>
        </View>

        {hasPermissions && (
          <View style={styles.cameraContainer}>
            <CameraView ref={cameraRef} style={styles.camera} facing="back" />
            <View style={styles.cameraOverlay}>
              <MaterialIcons name="videocam" size={24} color={colors.textPrimary} />
              <Text style={styles.cameraText}>Camera Ready</Text>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.title,
    color: colors.textPrimary,
    marginLeft: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  emergencySection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  typeSelector: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 4,
    marginBottom: spacing.lg,
    width: '100%',
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
  },
  typeButtonActive: {
    backgroundColor: colors.primary,
  },
  typeText: {
    ...typography.label,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
  },
  typeTextActive: {
    color: colors.textPrimary,
  },
  hint: {
    ...typography.body,
    color: colors.textSubtle,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
  statusSection: {
    marginBottom: spacing.lg,
  },
  infoSection: {
    marginBottom: spacing.lg,
  },
  contactsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  contactsText: {
    ...typography.body,
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
  },
  cameraContainer: {
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.overlayDark,
    padding: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraText: {
    ...typography.label,
    color: colors.textPrimary,
    marginLeft: spacing.sm,
  },
  screenOffContainer: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  screenOffText: {
    ...typography.heading,
    color: colors.textPrimary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  screenOffSubtext: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },
  unlockButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: 12,
  },
  unlockText: {
    ...typography.label,
    color: colors.textPrimary,
  },
});
