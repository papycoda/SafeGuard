import React from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '@/constants/theme';
import { EmergencyNumber } from '@/services/emergencyServicesService';

interface EmergencyServicesCardProps {
  emergencyNumber: EmergencyNumber | null;
  isLoading: boolean;
  onCallEmergency: () => void;
  onRefresh: () => void;
}

export function EmergencyServicesCard({
  emergencyNumber,
  isLoading,
  onCallEmergency,
  onRefresh,
}: EmergencyServicesCardProps) {
  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={styles.loadingText}>Loading emergency services...</Text>
      </View>
    );
  }

  if (!emergencyNumber) {
    return (
      <View style={styles.container}>
        <MaterialIcons name="phone" size={20} color={colors.textSubtle} />
        <Text style={styles.noDataText}>Emergency services unavailable</Text>
        <Pressable onPress={onRefresh} style={styles.refreshButton}>
          <MaterialIcons name="refresh" size={16} color={colors.primary} />
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <MaterialIcons name="local-hospital" size={20} color={colors.danger} />
          <Text style={styles.countryName}>{emergencyNumber.country_name}</Text>
        </View>
        <Pressable onPress={onRefresh} style={styles.refreshButton}>
          <MaterialIcons name="refresh" size={16} color={colors.textSubtle} />
        </Pressable>
      </View>

      <Pressable onPress={onCallEmergency} style={styles.callButton}>
        <MaterialIcons name="phone" size={24} color={colors.textPrimary} />
        <View style={styles.callInfo}>
          <Text style={styles.callLabel}>Emergency</Text>
          <Text style={styles.callNumber}>{emergencyNumber.emergency_number}</Text>
        </View>
        <MaterialIcons name="chevron-right" size={24} color={colors.textSubtle} />
      </Pressable>

      {emergencyNumber.notes && (
        <Text style={styles.notes}>{emergencyNumber.notes}</Text>
      )}
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
    marginBottom: spacing.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countryName: {
    ...typography.subheading,
    fontSize: 16,
    color: colors.textPrimary,
    marginLeft: spacing.sm,
  },
  refreshButton: {
    padding: spacing.xs,
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  callInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  callLabel: {
    ...typography.caption,
    color: colors.textPrimary,
    opacity: 0.8,
  },
  callNumber: {
    ...typography.heading,
    fontSize: 20,
    color: colors.textPrimary,
  },
  notes: {
    ...typography.caption,
    color: colors.textSubtle,
    marginTop: spacing.sm,
    fontStyle: 'italic',
  },
  loadingText: {
    ...typography.body,
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
  },
  noDataText: {
    ...typography.body,
    fontSize: 14,
    color: colors.textSubtle,
    marginLeft: spacing.sm,
    flex: 1,
  },
});
