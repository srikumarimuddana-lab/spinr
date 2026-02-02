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
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/authStore';
import SpinrConfig from '../config/spinr.config';

const OTP_LENGTH = 4;

export default function OTPScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ phone: string; dev_otp?: string }>();
  const { verifyOTP, sendOTP, isLoading, error, clearError } = useAuthStore();

  const [code, setCode] = useState('');
  const [resendTimer, setResendTimer] = useState(30);
  const inputRef = useRef<TextInput>(null);

  const phone = params.phone || '';
  const devOTP = params.dev_otp || '';

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

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
        router.replace('/profile-setup');
      } else {
        router.replace('/(tabs)');
      }
    } catch (err: any) {
      setCode('');
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;

    try {
      await sendOTP(phone);
      setResendTimer(30);
      setCode('');
    } catch (err: any) {
      // Error handled in store
    }
  };

  const formatPhone = (p: string) => {
    if (!p) return '';
    const cleaned = p.replace(/\D/g, '');
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return `+1 ${cleaned.slice(1, 4)} ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    }
    return p;
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

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
            error && code.length === 0 && styles.otpBoxError,
          ]}
        >
          <Text style={styles.otpText}>{code[i] || ''}</Text>
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
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
            </TouchableOpacity>

            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Enter code</Text>
              <Text style={styles.subtitle}>
                We've sent an SMS with an activation code to{"\n"}your phone{' '}
                <Text style={styles.phoneText}>{formatPhone(phone)}</Text>
              </Text>
            </View>

            {/* DEV OTP Display */}
            {devOTP && (
              <View style={styles.devOtpContainer}>
                <Text style={styles.devOtpLabel}>Dev OTP: </Text>
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
                  Resend code in <Text style={styles.timerText}>{formatTimer(resendTimer)}</Text>
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
                styles.verifyButton,
                code.length !== OTP_LENGTH && styles.verifyButtonDisabled,
              ]}
              onPress={handleVerify}
              disabled={code.length !== OTP_LENGTH || isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <View style={styles.verifyButtonContent}>
                  <Text style={styles.verifyButtonText}>Verify</Text>
                  <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
                </View>
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
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: 'PlusJakartaSans_400Regular',
    color: '#666666',
    lineHeight: 22,
  },
  phoneText: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: '#1A1A1A',
  },
  devOtpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF9E6',
    borderRadius: 12,
    padding: 12,
    marginBottom: 24,
  },
  devOtpLabel: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_500Medium',
    color: '#92400E',
  },
  devOtpCode: {
    fontSize: 18,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: '#92400E',
    letterSpacing: 4,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 24,
  },
  otpBox: {
    width: 64,
    height: 56,
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    backgroundColor: '#F8F8F8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  otpBoxFilled: {
    borderColor: SpinrConfig.theme.colors.primary,
    backgroundColor: '#FFF',
  },
  otpBoxActive: {
    borderColor: SpinrConfig.theme.colors.primary,
  },
  otpBoxError: {
    borderColor: '#DC2626',
  },
  otpText: {
    fontSize: 24,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: '#1A1A1A',
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    height: 0,
    width: 0,
  },
  errorText: {
    color: '#DC2626',
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
    color: '#666666',
  },
  timerText: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: '#1A1A1A',
  },
  resendLink: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: SpinrConfig.theme.colors.primary,
  },
  spacer: {
    flex: 1,
  },
  verifyButton: {
    backgroundColor: SpinrConfig.theme.colors.primary,
    borderRadius: 28,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  verifyButtonDisabled: {
    backgroundColor: '#FFAAAA',
  },
  verifyButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  verifyButtonText: {
    fontSize: 18,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: '#FFFFFF',
  },
});
