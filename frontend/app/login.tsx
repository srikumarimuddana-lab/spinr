import React, { useState, useRef } from 'react';
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
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/authStore';
import SpinrConfig from '../config/spinr.config';

// Format phone number as (XXX) XXX-XXXX
const formatPhoneNumber = (text: string): string => {
  const cleaned = text.replace(/\D/g, '');
  const limited = cleaned.substring(0, 10);
  
  if (limited.length === 0) return '';
  if (limited.length <= 3) return `(${limited}`;
  if (limited.length <= 6) return `(${limited.slice(0, 3)}) ${limited.slice(3)}`;
  return `(${limited.slice(0, 3)}) ${limited.slice(3, 6)}-${limited.slice(6)}`;
};

export default function LoginScreen() {
  const router = useRouter();
  const { sendOTP, isLoading, error, clearError } = useAuthStore();
  
  const [phoneDisplay, setPhoneDisplay] = useState('');
  const [rawPhone, setRawPhone] = useState('');
  const inputRef = useRef<TextInput>(null);

  const handlePhoneChange = (text: string) => {
    const cleaned = text.replace(/\D/g, '').substring(0, 10);
    setRawPhone(cleaned);
    setPhoneDisplay(formatPhoneNumber(text));
  };

  const handleSendCode = async () => {
    if (rawPhone.length !== 10) {
      Alert.alert('Invalid Phone', 'Please enter a valid 10-digit phone number');
      return;
    }

    Keyboard.dismiss();
    clearError();

    try {
      const fullPhone = `+1${rawPhone}`;
      const result = await sendOTP(fullPhone);
      
      // Navigate to OTP screen with phone number
      router.push({
        pathname: '/otp',
        params: { 
          phone: fullPhone,
          dev_otp: result.dev_otp || '' 
        },
      });
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to send verification code');
    }
  };

  const isValidPhone = rawPhone.length === 10;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.content}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Let's get moving.</Text>
              <Text style={styles.subtitle}>
                Enter your phone number to continue
              </Text>
            </View>

            {/* Phone Input */}
            <View style={styles.inputContainer}>
              <View style={styles.countryCode}>
                <Text style={styles.flag}>🇨🇦</Text>
                <Text style={styles.countryText}>+1</Text>
              </View>
              <TextInput
                ref={inputRef}
                style={styles.phoneInput}
                value={phoneDisplay}
                onChangeText={handlePhoneChange}
                placeholder="(306) 555-0199"
                placeholderTextColor={SpinrConfig.theme.colors.textSecondary}
                keyboardType="phone-pad"
                maxLength={14}
                autoFocus
              />
            </View>

            {error && (
              <Text style={styles.errorText}>{error}</Text>
            )}

            {/* Spacer */}
            <View style={styles.spacer} />

            {/* Send Code Button */}
            <TouchableOpacity
              style={[
                styles.button,
                !isValidPhone && styles.buttonDisabled,
              ]}
              onPress={handleSendCode}
              disabled={!isValidPhone || isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.buttonText}>Send Code</Text>
                  <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
                </>
              )}
            </TouchableOpacity>

            {/* Terms */}
            <Text style={styles.terms}>
              By continuing, you agree to our{' '}
              <Text style={styles.link}>Terms of Service</Text>
              {' '}and{' '}
              <Text style={styles.link}>Privacy Policy</Text>
            </Text>
          </View>
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
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  header: {
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: SpinrConfig.theme.colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSans_400Regular',
    color: SpinrConfig.theme.colors.textSecondary,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: SpinrConfig.theme.borderRadius,
    borderWidth: 1,
    borderColor: SpinrConfig.theme.colors.border,
    paddingHorizontal: 16,
    height: 60,
  },
  countryCode: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 12,
    borderRightWidth: 1,
    borderRightColor: SpinrConfig.theme.colors.border,
    marginRight: 12,
  },
  flag: {
    fontSize: 24,
    marginRight: 8,
  },
  countryText: {
    fontSize: 18,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: SpinrConfig.theme.colors.text,
  },
  phoneInput: {
    flex: 1,
    fontSize: 18,
    fontFamily: 'PlusJakartaSans_500Medium',
    color: SpinrConfig.theme.colors.text,
  },
  errorText: {
    color: SpinrConfig.theme.colors.error,
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_400Regular',
    marginTop: 8,
  },
  spacer: {
    flex: 1,
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
  terms: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_400Regular',
    color: SpinrConfig.theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: 24,
    marginBottom: 16,
    lineHeight: 18,
  },
  link: {
    color: SpinrConfig.theme.colors.primary,
  },
});
