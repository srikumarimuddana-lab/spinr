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
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/authStore';
import SpinrConfig from '../config/spinr.config';

export default function LoginScreen() {
  const router = useRouter();
  const { sendOTP, isLoading, clearError } = useAuthStore();
  
  const [phone, setPhone] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const formatPhoneDisplay = (text: string): string => {
    const cleaned = text.replace(/\D/g, '').substring(0, 10);
    if (cleaned.length === 0) return '';
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 6) return `${cleaned.slice(0, 3)} ${cleaned.slice(3)}`;
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
  };

  const handlePhoneChange = (text: string) => {
    const cleaned = text.replace(/\D/g, '').substring(0, 10);
    setPhone(cleaned);
  };

  const handleContinue = async () => {
    if (phone.length !== 10) {
      Alert.alert('Invalid Phone', 'Please enter a valid 10-digit phone number');
      return;
    }

    Keyboard.dismiss();
    clearError();

    try {
      const fullPhone = `+1${phone}`;
      const result = await sendOTP(fullPhone);
      
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

  const isValidPhone = phone.length === 10;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.content}>
            {/* Back Button */}
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color={SpinrConfig.theme.colors.primary} />
            </TouchableOpacity>

            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Enter your mobile{"\n"}number</Text>
              <Text style={styles.subtitle}>
                Spinr needs this to create your account and{"\n"}secure your rides.
              </Text>
            </View>

            {/* Phone Input Section */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Mobile Number</Text>
              <View style={styles.phoneRow}>
                {/* Country Code Selector */}
                <View style={styles.countrySelector}>
                  <Text style={styles.flag}>🇨🇦</Text>
                  <Text style={styles.countryCode}>+1</Text>
                  <Ionicons name="chevron-down" size={16} color="#666" />
                </View>

                {/* Phone Input */}
                <View style={[styles.phoneInputContainer, isFocused && styles.phoneInputFocused]}>
                  <TextInput
                    ref={inputRef}
                    style={styles.phoneInput}
                    value={formatPhoneDisplay(phone)}
                    onChangeText={handlePhoneChange}
                    placeholder="306 000 0000"
                    placeholderTextColor="#999"
                    keyboardType="phone-pad"
                    maxLength={12}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                  />
                </View>
              </View>
            </View>

            {/* Spacer */}
            <View style={styles.spacer} />

            {/* Disclaimer */}
            <Text style={styles.disclaimer}>
              By continuing, you may receive an SMS for verification.{"\n"}Message and data rates may apply.
            </Text>

            {/* Continue Button */}
            <TouchableOpacity
              style={[
                styles.continueButton,
                !isValidPhone && styles.continueButtonDisabled,
              ]}
              onPress={handleContinue}
              disabled={!isValidPhone || isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.continueButtonText}>Continue</Text>
              )}
            </TouchableOpacity>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    marginTop: 8,
  },
  header: {
    marginTop: 24,
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: '#1A1A1A',
    lineHeight: 40,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: 'PlusJakartaSans_400Regular',
    color: '#666666',
    marginTop: 12,
    lineHeight: 22,
  },
  inputSection: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  phoneRow: {
    flexDirection: 'row',
    gap: 12,
  },
  countrySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 28,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 8,
  },
  flag: {
    fontSize: 20,
  },
  countryCode: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: '#1A1A1A',
  },
  phoneInputContainer: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    borderRadius: 28,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  phoneInputFocused: {
    borderColor: SpinrConfig.theme.colors.primary,
  },
  phoneInput: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSans_500Medium',
    color: '#1A1A1A',
    paddingVertical: 14,
  },
  spacer: {
    flex: 1,
  },
  disclaimer: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_400Regular',
    color: '#999999',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  continueButton: {
    backgroundColor: SpinrConfig.theme.colors.primary,
    borderRadius: 28,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  continueButtonDisabled: {
    backgroundColor: '#FFAAAA',
  },
  continueButtonText: {
    fontSize: 18,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: '#FFFFFF',
  },
});
