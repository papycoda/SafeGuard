import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '@/constants/theme';
import { LocationData, formatLocationString } from '@/services/locationService';

interface LocationDisplayProps {
  location: LocationData | null;
  isLoading: boolean;
  onRefresh: () => void;
}

export function LocationDisplay({ location, isLoading, onRefresh }: LocationDisplayProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <MaterialIcons name="location-on" size={20} color={colors.primary} />
        <Text style={styles.title}>Current Location</Text>
      </View>
      
      <View style={styles.content}>
        {isLoading ? (
          <Text style={styles.locationText}>Getting location...</Text>
        ) : location ? (
          <Text style={styles.locationText}>{formatLocationString(location)}</Text>
        ) : (
          <Text style={styles.locationText}>Location unavailable</Text>
        )}
        
        <Pressable onPress={onRefresh} style={styles.refreshButton} hitSlop={8}>
          <MaterialIcons name="refresh" size={20} color={colors.textSecondary} />
        </Pressable>
      </View>
      
      {location && (
        <Text style={styles.accuracy}>
          Accuracy: ±{location.accuracy?.toFixed(0) || '?'}m
        </Text>
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
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.label,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  locationText: {
    ...typography.body,
    color: colors.textPrimary,
    flex: 1,
    fontFamily: 'monospace',
  },
  refreshButton: {
    padding: spacing.sm,
  },
  accuracy: {
    ...typography.caption,
    color: colors.textSubtle,
    marginTop: spacing.xs,
  },
});
