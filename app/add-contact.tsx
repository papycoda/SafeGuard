import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAlert } from '@/template';
import { colors, spacing } from '@/constants/theme';
import { Button, Input } from '@/components';
import { useSettings } from '@/hooks/useSettings';

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

    if (!name.trim()) {
      newErrors.name = 'Name is required';
      isValid = false;
    }

    if (!phone.trim()) {
      newErrors.phone = 'Phone number is required';
      isValid = false;
    } else if (!/^\+?[\d\s-()]+$/.test(phone)) {
      newErrors.phone = 'Invalid phone number format';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      await addContact({
        name: name.trim(),
        phone: phone.trim(),
        relationship: relationship.trim() || undefined,
      });

      showAlert('Contact Added', `${name} has been added to emergency contacts`);
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
