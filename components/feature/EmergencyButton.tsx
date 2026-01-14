import React from 'react';
import { Pressable, Text, StyleSheet, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '@/constants/theme';
import Animated, { useAnimatedStyle, withRepeat, withSequence, withTiming } from 'react-native-reanimated';

interface EmergencyButtonProps {
  onPress: () => void;
  isActive: boolean;
  type: 'pulled_over' | 'danger';
}

export function EmergencyButton({ onPress, isActive, type }: EmergencyButtonProps) {
  const pulseStyle = useAnimatedStyle(() => {
    if (!isActive) return {};
    
    return {
      transform: [{
        scale: withRepeat(
          withSequence(
            withTiming(1.05, { duration: 600 }),
            withTiming(1, { duration: 600 })
          ),
          -1,
          false
        ),
      }],
    };
  });

  const title = type === 'pulled_over' ? "I'm Being\nPulled Over" : "I'm In\nDanger";
  const icon = type === 'pulled_over' ? 'local-police' : 'warning';

  return (
    <Animated.View style={[styles.container, pulseStyle]}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.button,
          isActive && styles.buttonActive,
          pressed && styles.buttonPressed,
        ]}
      >
        <View style={styles.iconContainer}>
          <MaterialIcons name={icon} size={64} color={colors.textPrimary} />
        </View>
        <Text style={styles.title}>{title}</Text>
        {isActive && (
          <View style={styles.recordingIndicator}>
            <View style={styles.recordingDot} />
            <Text style={styles.recordingText}>RECORDING</Text>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    aspectRatio: 1,
    maxWidth: 300,
  },
  button: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    borderWidth: 4,
    borderColor: colors.primaryDark,
  },
  buttonActive: {
    backgroundColor: colors.danger,
    borderColor: '#991b1b',
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.95 }],
  },
  iconContainer: {
    marginBottom: spacing.md,
  },
  title: {
    ...typography.heading,
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    lineHeight: 30,
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.textPrimary,
    marginRight: spacing.sm,
  },
  recordingText: {
    ...typography.label,
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: 1,
  },
});
