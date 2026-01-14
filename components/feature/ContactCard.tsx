import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '@/constants/theme';
import { EmergencyContact } from '@/services/storageService';

interface ContactCardProps {
  contact: EmergencyContact;
  onDelete: (id: string) => void;
}

export function ContactCard({ contact, onDelete }: ContactCardProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <MaterialIcons name="person" size={24} color={colors.primary} />
      </View>
      
      <View style={styles.content}>
        <Text style={styles.name}>{contact.name}</Text>
        <Text style={styles.phone}>{contact.phone}</Text>
        {contact.relationship && (
          <Text style={styles.relationship}>{contact.relationship}</Text>
        )}
      </View>
      
      <Pressable
        onPress={() => onDelete(contact.id)}
        style={({ pressed }) => [styles.deleteButton, pressed && styles.deleteButtonPressed]}
        hitSlop={8}
      >
        <MaterialIcons name="delete" size={20} color={colors.danger} />
      </Pressable>
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
    marginBottom: spacing.sm,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  content: {
    flex: 1,
  },
  name: {
    ...typography.subheading,
    fontSize: 16,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  phone: {
    ...typography.body,
    fontSize: 14,
    color: colors.textSecondary,
    fontFamily: 'monospace',
  },
  relationship: {
    ...typography.caption,
    color: colors.textSubtle,
    marginTop: 2,
  },
  deleteButton: {
    padding: spacing.sm,
  },
  deleteButtonPressed: {
    opacity: 0.6,
  },
});
