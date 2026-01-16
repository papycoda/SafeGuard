import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAlert } from '@/template';
import { colors, spacing } from '@/constants/theme';
import { Button, Input } from '@/components';
import { useSettings } from '@/hooks/useSettings';
import { ValidationService } from '@/services/validationService';

export default function AddContactScreen() {
  const router = useRouter();
  const { showAlert } = useAlert();
  const { addContact } = useSettings();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [relationship, setRelationship] = useState('');

  const [errors, setErrors] = useState({
    name: '',
    phone: '',
  });

  const validateForm = (): boolean => {
    const newErrors = { name: '', phone: '' };
    let isValid = true;

    // Validate name using ValidationService
    const nameResult = ValidationService.validateName(name);
    if (!nameResult.isValid) {
      newErrors.name = nameResult.error || 'Invalid name';
      isValid = false;
    }

    // Validate phone using ValidationService
    const phoneResult = ValidationService.validatePhoneNumber(phone);
    if (!phoneResult.isValid) {
      newErrors.phone = phoneResult.error || 'Invalid phone number';
      isValid = false;
    }

    // Validate relationship if provided
    if (relationship.trim()) {
      const relationshipResult = ValidationService.validateRelationship(relationship);
      if (!relationshipResult.isValid) {
        // Relationship validation failed, but it's optional so we don't block
        // However, we should sanitize it later
      }
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      // Get sanitized values from validation service
      const nameResult = ValidationService.validateName(name);
      const phoneResult = ValidationService.validatePhoneNumber(phone);
      const relationshipResult = ValidationService.validateRelationship(relationship);

      await addContact({
        name: nameResult.sanitizedValue || name.trim(),
        phone: phoneResult.sanitizedValue || phone.trim(),
        relationship: relationshipResult.sanitizedValue || relationship.trim() || undefined,
      });

      showAlert('Contact Added', `${nameResult.sanitizedValue || name} has been added to emergency contacts`);
      router.back();
    } catch (error) {
      showAlert('Error', 'Could not add contact. Please try again.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Input
          label="Name"
          value={name}
          onChangeText={setName}
          placeholder="John Doe"
          error={errors.name}
          autoCapitalize="words"
        />

        <Input
          label="Phone Number"
          value={phone}
          onChangeText={setPhone}
          placeholder="+1 (555) 123-4567"
          error={errors.phone}
          keyboardType="phone-pad"
        />

        <Input
          label="Relationship (Optional)"
          value={relationship}
          onChangeText={setRelationship}
          placeholder="Family, Friend, Lawyer, etc."
          autoCapitalize="words"
        />

        <Button onPress={handleSubmit} title="Add Contact" size="large" />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.md,
  },
});
