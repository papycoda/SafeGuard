import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, FlatList, Pressable, Share } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useAlert } from '@/template';
import { colors, spacing, typography, borderRadius } from '@/constants/theme';
import { EmergencyRecording, getMyRecordings, deleteRecording, getShareableMessage } from '@/services/cloudBackupService';
import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';

export default function RecordingsScreen() {
  const insets = useSafeAreaInsets();
  const { showAlert } = useAlert();
  const [recordings, setRecordings] = useState<EmergencyRecording[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadRecordings = useCallback(async () => {
    setIsLoading(true);
    const data = await getMyRecordings();
    setRecordings(data);
    setIsLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadRecordings();
    }, [loadRecordings])
  );

  const handleShare = async (recording: EmergencyRecording) => {
    try {
      const message = getShareableMessage(recording);
      await Share.share({
        message,
        title: 'Emergency Recording',
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleDelete = (recording: EmergencyRecording) => {
    showAlert('Delete Recording?', 'This action cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const success = await deleteRecording(recording.id);
          if (success) {
            showAlert('Deleted', 'Recording has been deleted');
            loadRecordings();
          } else {
            showAlert('Error', 'Could not delete recording');
          }
        },
      },
    ]);
  };

  const renderRecording = ({ item }: { item: EmergencyRecording }) => {
    const date = new Date(item.created_at);
    const type = item.emergency_type === 'pulled_over' ? 'Pulled Over' : 'Danger';
    const duration = `${Math.floor(item.duration_seconds / 60)}m ${item.duration_seconds % 60}s`;

    return (
      <View style={styles.recordingCard}>
        <View style={styles.recordingHeader}>
          <View style={styles.typeContainer}>
            <MaterialIcons
              name={item.emergency_type === 'pulled_over' ? 'local-police' : 'warning'}
              size={20}
              color={colors.danger}
            />
            <Text style={styles.typeText}>{type}</Text>
          </View>
          <Text style={styles.durationText}>{duration}</Text>
        </View>

        <Text style={styles.dateText}>{date.toLocaleString()}</Text>

        {item.location_latitude && item.location_longitude && (
          <View style={styles.locationRow}>
            <MaterialIcons name="place" size={16} color={colors.textSubtle} />
            <Text style={styles.locationText}>
              {item.location_address || `${item.location_latitude.toFixed(4)}, ${item.location_longitude.toFixed(4)}`}
            </Text>
          </View>
        )}

        <View style={styles.actions}>
          <Pressable onPress={() => handleShare(item)} style={styles.actionButton}>
            <MaterialIcons name="share" size={20} color={colors.primary} />
            <Text style={styles.actionText}>Share</Text>
          </Pressable>

          <Pressable onPress={() => handleDelete(item)} style={styles.actionButton}>
            <MaterialIcons name="delete" size={20} color={colors.danger} />
            <Text style={[styles.actionText, { color: colors.danger }]}>Delete</Text>
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <Text style={styles.title}>My Recordings</Text>
        <Pressable onPress={loadRecordings} disabled={isLoading}>
          <MaterialIcons
            name="refresh"
            size={24}
            color={isLoading ? colors.textSubtle : colors.textSecondary}
          />
        </Pressable>
      </View>

      {recordings.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialIcons name="videocam-off" size={64} color={colors.textSubtle} />
          <Text style={styles.emptyTitle}>No Recordings Yet</Text>
          <Text style={styles.emptyText}>
            Emergency recordings will appear here after you use the emergency recording feature.
          </Text>
        </View>
      ) : (
        <FlatList
          data={recordings}
          renderItem={renderRecording}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    ...typography.title,
    color: colors.textPrimary,
  },
  listContent: {
    padding: spacing.md,
  },
  recordingCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  recordingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  typeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeText: {
    ...typography.subheading,
    fontSize: 16,
    color: colors.textPrimary,
    marginLeft: spacing.sm,
  },
  durationText: {
    ...typography.label,
    color: colors.textSecondary,
  },
  dateText: {
    ...typography.body,
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  locationText: {
    ...typography.caption,
    color: colors.textSubtle,
    marginLeft: spacing.xs,
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.sm,
  },
  actionText: {
    ...typography.label,
    fontSize: 13,
    color: colors.primary,
    marginLeft: spacing.xs,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  emptyTitle: {
    ...typography.heading,
    color: colors.textPrimary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSubtle,
    textAlign: 'center',
  },
});
