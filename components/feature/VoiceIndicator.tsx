import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '@/constants/theme';
import Animated, { useAnimatedStyle, withRepeat, withSequence, withTiming } from 'react-native-reanimated';

interface VoiceIndicatorProps {
  isListening: boolean;
  lastTranscript?: string;
}

export function VoiceIndicator({ isListening, lastTranscript }: VoiceIndicatorProps) {
  const pulseStyle = useAnimatedStyle(() => {
    if (!isListening) return { opacity: 0.5 };
    
    return {
      opacity: withRepeat(
        withSequence(
          withTiming(1, { duration: 800 }),
          withTiming(0.5, { duration: 800 })
        ),
        -1,
        false
      ),
    };
  });

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.iconContainer, pulseStyle]}>
        <MaterialIcons
          name="mic"
          size={16}
          color={isListening ? colors.success : colors.textSubtle}
        />
      </Animated.View>
      <View style={styles.textContainer}>
        <Text style={styles.statusText}>
          {isListening ? 'Voice commands active' : 'Voice commands inactive'}
        </Text>
        {lastTranscript && isListening && (
          <Text style={styles.transcriptText} numberOfLines={1}>
            "{lastTranscript}"
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  statusText: {
    ...typography.label,
    fontSize: 13,
    color: colors.textSecondary,
  },
  transcriptText: {
    ...typography.caption,
    color: colors.textSubtle,
    marginTop: 2,
    fontStyle: 'italic',
  },
});
