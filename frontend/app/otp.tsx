import React, { useState, useRef, useEffect } from 'react';
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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/authStore';
import SpinrConfig from '../config/spinr.config';

const OTP_LENGTH = 6;

export default function OTPScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ phone: string; dev_otp?: string }>();
  const { verifyOTP, sendOTP, isLoading, error, clearError } = useAuthStore();

  const [code, setCode] = useState('');
  const [resendTimer, setResendTimer] = useState(30);
  const inputRef = useRef<TextInput>(null);

  const phone = params.phone || '';
  const devOTP = params.dev_otp || '';

  // Countdown timer for resend
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  // Auto-submit when code is complete
  useEffect(() => {
    if (code.length === OTP_LENGTH) {
      handleVerify();
    }
  }, [code]);

  const handleCodeChange = (text: string) => {
    const cleaned = text.replace(/\D/g, '').substring(0, OTP_LENGTH);
    setCode(cleaned);
    clearError();
  };

  const handleVerify = async () => {
    if (code.length !== OTP_LENGTH) return;

    Keyboard.dismiss();
    clearError();

    try {
      const result = await verifyOTP(phone, code);
      
      if (result.is_new_user) {
        // New user - go to profile creation
        router.replace('/profile');
      } else {
        // Existing user - go to home
        router.replace('/home');
      }
    } catch (err: any) {
      setCode('');
      // Error is already set in store
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;

    try {
      await sendOTP(phone);
      setResendTimer(30);
      setCode('');
      Alert.alert('Code Sent', 'A new verification code has been sent.');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to resend code');
    }
  };

  const handleBack = () => {
    router.back();
  };

  // Format phone for display
  const formatPhone = (p: string) => {
    if (!p) return '';
    const cleaned = p.replace(/\D/g, '');
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    }
    return p;
  };

  // Render OTP boxes
  const renderOTPBoxes = () => {
    const boxes = [];
    for (let i = 0; i < OTP_LENGTH; i++) {
      const isFilled = i < code.length;
      const isActive = i === code.length;
      
      boxes.push(
        <View
          key={i}
          style={[
            styles.otpBox,
            isFilled && styles.otpBoxFilled,
            isActive && styles.otpBoxActive,
            error && code.length === OTP_LENGTH && styles.otpBoxError,
          ]}
        >
          <Text style={[
            styles.otpText,
            error && code.length === OTP_LENGTH && styles.otpTextError,
          ]}>
            {code[i] || ''}
          </Text>
        </View>
      );
    }
    return boxes;
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.content}>
            {/* Back Button */}
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <Ionicons name="arrow-back" size={24} color={SpinrConfig.theme.colors.text} />
            </TouchableOpacity>

            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Enter verification code</Text>
              <Text style={styles.subtitle}>
                We sent a code to{' '}
                <Text style={styles.phoneText}>{formatPhone(phone)}</Text>
              </Text>
            </View>

            {/* DEV OTP Display (Remove in production) */}
            {devOTP && (
              <View style={styles.devOtpContainer}>
                <Text style={styles.devOtpLabel}>🔧 Dev OTP:</Text>
                <Text style={styles.devOtpCode}>{devOTP}</Text>
              </View>
            )}

            {/* OTP Input */}
            <TouchableOpacity
              style={styles.otpContainer}
              onPress={() => inputRef.current?.focus()}
              activeOpacity={1}
            >
              {renderOTPBoxes()}
            </TouchableOpacity>

            {/* Hidden Input */}
            <TextInput
              ref={inputRef}
              style={styles.hiddenInput}
              value={code}
              onChangeText={handleCodeChange}
              keyboardType="number-pad"
              maxLength={OTP_LENGTH}
              autoFocus
            />

            {/* Error Message */}
            {error && (
              <Text style={styles.errorText}>{error}</Text>
            )}

            {/* Resend */}
            <View style={styles.resendContainer}>
              {resendTimer > 0 ? (
                <Text style={styles.resendText}>
                  Resend code in <Text style={styles.timerText}>{resendTimer}s</Text>
                </Text>
              ) : (
                <TouchableOpacity onPress={handleResend}>
                  <Text style={styles.resendLink}>Resend code</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Spacer */}
            <View style={styles.spacer} />

            {/* Verify Button */}
            <TouchableOpacity
              style={[
                styles.button,
                code.length !== OTP_LENGTH && styles.buttonDisabled,
              ]}
              onPress={handleVerify}
              disabled={code.length !== OTP_LENGTH || isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.buttonText}>Verify</Text>
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
    backgroundColor: SpinrConfig.theme.colors.background,
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
    marginTop: 20,
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: SpinrConfig.theme.colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSans_400Regular',
    color: SpinrConfig.theme.colors.textSecondary,
    lineHeight: 24,
  },
  phoneText: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: SpinrConfig.theme.colors.text,
  },
  devOtpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    padding: 12,
    marginBottom: 24,
  },
  devOtpLabel: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_500Medium',
    color: '#92400E',
    marginRight: 8,
  },
  devOtpCode: {
    fontSize: 18,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: '#92400E',
    letterSpacing: 4,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  otpBox: {
    width: 48,
    height: 56,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: SpinrConfig.theme.colors.border,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  otpBoxFilled: {
    borderColor: SpinrConfig.theme.colors.primary,
    backgroundColor: '#FEF2F2',
  },
  otpBoxActive: {
    borderColor: SpinrConfig.theme.colors.primary,
  },
  otpBoxError: {
    borderColor: SpinrConfig.theme.colors.error,
    backgroundColor: '#FEF2F2',
  },
  otpText: {
    fontSize: 24,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: SpinrConfig.theme.colors.text,
  },
  otpTextError: {
    color: SpinrConfig.theme.colors.error,
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    height: 0,
    width: 0,
  },
  errorText: {
    color: SpinrConfig.theme.colors.error,
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_500Medium',
    textAlign: 'center',
    marginBottom: 16,
  },
  resendContainer: {
    alignItems: 'center',
  },
  resendText: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_400Regular',
    color: SpinrConfig.theme.colors.textSecondary,
  },
  timerText: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: SpinrConfig.theme.colors.text,
  },
  resendLink: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: SpinrConfig.theme.colors.primary,
  },
  spacer: {
    flex: 1,
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: SpinrConfig.theme.colors.primary,
    borderRadius: SpinrConfig.theme.borderRadius,
    height: 56,
    marginBottom: 24,
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
