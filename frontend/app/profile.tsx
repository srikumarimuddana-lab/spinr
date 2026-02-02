import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/authStore';
import SpinrConfig from '../config/spinr.config';

export default function ProfileScreen() {
  const router = useRouter();
  const { createProfile, isLoading, user } = useAuthStore();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateEmail = (email: string): boolean => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validate = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    if (!lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(email)) {
      newErrors.email = 'Please enter a valid email';
    }
    if (!city) {
      newErrors.city = 'Please select a city';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    Keyboard.dismiss();

    try {
      await createProfile({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim().toLowerCase(),
        city,
      });

      router.replace('/home');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to create profile');
    }
  };

  const selectCity = (selectedCity: string) => {
    setCity(selectedCity);
    setShowCityPicker(false);
    setErrors({ ...errors, city: '' });
  };

  const isFormValid = firstName.trim() && lastName.trim() && email.trim() && city;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.iconContainer}>
                <Ionicons name="person" size={32} color={SpinrConfig.theme.colors.primary} />
              </View>
              <Text style={styles.title}>Tell us about yourself</Text>
              <Text style={styles.subtitle}>
                We need a few details to complete your profile
              </Text>
            </View>

            {/* Form */}
            <View style={styles.form}>
              {/* First Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>First Name</Text>
                <TextInput
                  style={[
                    styles.input,
                    errors.firstName && styles.inputError,
                  ]}
                  value={firstName}
                  onChangeText={(text) => {
                    setFirstName(text);
                    setErrors({ ...errors, firstName: '' });
                  }}
                  placeholder="John"
                  placeholderTextColor={SpinrConfig.theme.colors.textSecondary}
                  autoCapitalize="words"
                />
                {errors.firstName && (
                  <Text style={styles.errorText}>{errors.firstName}</Text>
                )}
              </View>

              {/* Last Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Last Name</Text>
                <TextInput
                  style={[
                    styles.input,
                    errors.lastName && styles.inputError,
                  ]}
                  value={lastName}
                  onChangeText={(text) => {
                    setLastName(text);
                    setErrors({ ...errors, lastName: '' });
                  }}
                  placeholder="Doe"
                  placeholderTextColor={SpinrConfig.theme.colors.textSecondary}
                  autoCapitalize="words"
                />
                {errors.lastName && (
                  <Text style={styles.errorText}>{errors.lastName}</Text>
                )}
              </View>

              {/* Email */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={[
                    styles.input,
                    errors.email && styles.inputError,
                  ]}
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    setErrors({ ...errors, email: '' });
                  }}
                  placeholder="john@example.com"
                  placeholderTextColor={SpinrConfig.theme.colors.textSecondary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {errors.email && (
                  <Text style={styles.errorText}>{errors.email}</Text>
                )}
                <Text style={styles.helperText}>
                  We'll send ride receipts to this email
                </Text>
              </View>

              {/* City */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>City</Text>
                <TouchableOpacity
                  style={[
                    styles.input,
                    styles.citySelector,
                    errors.city && styles.inputError,
                  ]}
                  onPress={() => setShowCityPicker(!showCityPicker)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.citySelectorText,
                      !city && styles.placeholder,
                    ]}
                  >
                    {city || 'Select your city'}
                  </Text>
                  <Ionicons
                    name={showCityPicker ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color={SpinrConfig.theme.colors.textSecondary}
                  />
                </TouchableOpacity>
                {errors.city && (
                  <Text style={styles.errorText}>{errors.city}</Text>
                )}

                {/* City Dropdown */}
                {showCityPicker && (
                  <View style={styles.cityDropdown}>
                    {SpinrConfig.cities.map((c) => (
                      <TouchableOpacity
                        key={c.value}
                        style={[
                          styles.cityOption,
                          city === c.value && styles.cityOptionSelected,
                        ]}
                        onPress={() => selectCity(c.value)}
                      >
                        <Text
                          style={[
                            styles.cityOptionText,
                            city === c.value && styles.cityOptionTextSelected,
                          ]}
                        >
                          {c.label}
                        </Text>
                        {city === c.value && (
                          <Ionicons
                            name="checkmark"
                            size={20}
                            color={SpinrConfig.theme.colors.primary}
                          />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[
                styles.button,
                !isFormValid && styles.buttonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={!isFormValid || isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.buttonText}>Complete Profile</Text>
                  <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SpinrConfig.theme.colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: SpinrConfig.theme.colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSans_400Regular',
    color: SpinrConfig.theme.colors.textSecondary,
    textAlign: 'center',
  },
  form: {
    marginBottom: 32,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: SpinrConfig.theme.colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderRadius: SpinrConfig.theme.borderRadius,
    borderWidth: 1,
    borderColor: SpinrConfig.theme.colors.border,
    paddingHorizontal: 16,
    height: 56,
    fontSize: 16,
    fontFamily: 'PlusJakartaSans_500Medium',
    color: SpinrConfig.theme.colors.text,
  },
  inputError: {
    borderColor: SpinrConfig.theme.colors.error,
  },
  errorText: {
    color: SpinrConfig.theme.colors.error,
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_400Regular',
    marginTop: 4,
  },
  helperText: {
    color: SpinrConfig.theme.colors.textSecondary,
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_400Regular',
    marginTop: 4,
  },
  citySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  citySelectorText: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSans_500Medium',
    color: SpinrConfig.theme.colors.text,
  },
  placeholder: {
    color: SpinrConfig.theme.colors.textSecondary,
  },
  cityDropdown: {
    marginTop: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: SpinrConfig.theme.colors.border,
    overflow: 'hidden',
  },
  cityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: SpinrConfig.theme.colors.border,
  },
  cityOptionSelected: {
    backgroundColor: '#FEF2F2',
  },
  cityOptionText: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSans_500Medium',
    color: SpinrConfig.theme.colors.text,
  },
  cityOptionTextSelected: {
    color: SpinrConfig.theme.colors.primary,
    fontFamily: 'PlusJakartaSans_600SemiBold',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: SpinrConfig.theme.colors.primary,
    borderRadius: SpinrConfig.theme.borderRadius,
    height: 56,
    gap: 8,
  },
  buttonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  buttonText: {
    fontSize: 18,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: '#FFFFFF',
  },
});
