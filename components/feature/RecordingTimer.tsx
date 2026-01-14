import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '@/constants/theme';
import { formatDuration } from '@/services/recordingService';

interface RecordingTimerProps {
  duration: number;
  maxDuration: number;
}

export function RecordingTimer({ duration, maxDuration }: RecordingTimerProps) {
  const progress = (duration / maxDuration) * 100;
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.recordingIndicator}>
          <View style={styles.recordingDot} />
          <Text style={styles.recordingText}>RECORDING</Text>
        </View>
        <Text style={styles.timer}>{formatDuration(duration)}</Text>
      </View>
      
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${progress}%` }]} />
      </View>
      
      <View style={styles.footer}>
        <MaterialIcons name="videocam" size={16} color={colors.textSubtle} />
        <Text style={styles.maxDuration}>Max: {formatDuration(maxDuration)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.danger,
    marginRight: spacing.sm,
  },
  recordingText: {
    ...typography.label,
    fontSize: 12,
    fontWeight: '700',
    color: colors.danger,
    letterSpacing: 1,
  },
  timer: {
    ...typography.heading,
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
    fontFamily: 'monospace',
  },
  progressBar: {
    height: 6,
    backgroundColor: colors.surfaceLight,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  maxDuration: {
    ...typography.caption,
    color: colors.textSubtle,
    marginLeft: spacing.xs,
  },
});
