import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useAlert } from '@/template';
import { colors, spacing, typography, borderRadius } from '@/constants/theme';
import { ContactCard } from '@/components';
import { useSettings } from '@/hooks/useSettings';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { showAlert } = useAlert();
  const { settings, updateSettings, removeContact } = useSettings();

  const [localDuration, setLocalDuration] = useState(settings?.recordingDuration || 300);

  const handleDurationChange = (minutes: number) => {
    const seconds = minutes * 60;
    setLocalDuration(seconds);
    updateSettings({ recordingDuration: seconds });
  };

  const handleDeleteContact = (contactId: string) => {
    showAlert('Delete Contact?', 'This contact will be removed from emergency alerts.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => removeContact(contactId),
      },
    ]);
  };

  const durationOptions = [
    { label: '1 min', value: 1 },
    { label: '3 min', value: 3 },
    { label: '5 min', value: 5 },
    { label: '10 min', value: 10 },
    { label: '15 min', value: 15 },
  ];

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + spacing.md }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Settings</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Emergency Contacts</Text>
          
          {settings?.emergencyContacts.map(contact => (
            <ContactCard key={contact.id} contact={contact} onDelete={handleDeleteContact} />
          ))}

          <Pressable
            onPress={() => router.push('/add-contact')}
            style={styles.addButton}
          >
            <MaterialIcons name="add" size={24} color={colors.primary} />
            <Text style={styles.addButtonText}>Add Emergency Contact</Text>
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recording Duration</Text>
          <View style={styles.durationOptions}>
            {durationOptions.map(option => (
              <Pressable
                key={option.value}
                onPress={() => handleDurationChange(option.value)}
                style={[
                  styles.durationButton,
                  localDuration === option.value * 60 && styles.durationButtonActive,
                ]}
              >
                <Text
                  style={[
                    styles.durationText,
                    localDuration === option.value * 60 && styles.durationTextActive,
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recording Options</Text>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Voice Activation</Text>
              <Text style={styles.settingDescription}>
                Use voice commands to trigger recording
              </Text>
            </View>
            <Switch
              value={settings?.voiceActivation}
              onValueChange={value => updateSettings({ voiceActivation: value })}
              trackColor={{ false: colors.border, true: colors.primaryLight }}
              thumbColor={settings?.voiceActivation ? colors.primary : colors.textSubtle}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Screen Off Recording</Text>
              <Text style={styles.settingDescription}>
                Turn screen off while recording for privacy
              </Text>
            </View>
            <Switch
              value={settings?.screenOffRecording}
              onValueChange={value => updateSettings({ screenOffRecording: value })}
              trackColor={{ false: colors.border, true: colors.primaryLight }}
              thumbColor={settings?.screenOffRecording ? colors.primary : colors.textSubtle}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Include Location</Text>
              <Text style={styles.settingDescription}>
                Share GPS location with emergency contacts
              </Text>
            </View>
            <Switch
              value={settings?.includeLocation}
              onValueChange={value => updateSettings({ includeLocation: value })}
              trackColor={{ false: colors.border, true: colors.primaryLight }}
              thumbColor={settings?.includeLocation ? colors.primary : colors.textSubtle}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trigger Phrases</Text>
          {settings?.triggerPhrases.map((phrase, index) => (
            <View key={index} style={styles.phraseItem}>
              <MaterialIcons name="mic" size={20} color={colors.textSecondary} />
              <Text style={styles.phraseText}>{phrase}</Text>
            </View>
          ))}
        </View>

        <View style={styles.infoBox}>
          <MaterialIcons name="info" size={20} color={colors.warning} />
          <Text style={styles.infoText}>
            Emergency recordings are stored locally on your device. Make sure you have sufficient storage space.
          </Text>
        </View>
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
  title: {
    ...typography.title,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.subheading,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: 'dashed',
  },
  addButtonText: {
    ...typography.label,
    color: colors.primary,
    marginLeft: spacing.sm,
  },
  durationOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  durationButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    minWidth: 70,
    alignItems: 'center',
  },
  durationButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  durationText: {
    ...typography.label,
    color: colors.textSecondary,
  },
  durationTextActive: {
    color: colors.textPrimary,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  settingInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  settingLabel: {
    ...typography.subheading,
    fontSize: 16,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  settingDescription: {
    ...typography.body,
    fontSize: 13,
    color: colors.textSubtle,
  },
  phraseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  phraseText: {
    ...typography.body,
    color: colors.textPrimary,
    marginLeft: spacing.sm,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoText: {
    ...typography.body,
    fontSize: 13,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
    flex: 1,
  },
});
