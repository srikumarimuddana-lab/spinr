import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { useFonts, PlusJakartaSans_400Regular, PlusJakartaSans_500Medium, PlusJakartaSans_600SemiBold, PlusJakartaSans_700Bold } from '@expo-google-fonts/plus-jakarta-sans';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuthStore } from '../store/authStore';
import SpinrConfig from '../config/spinr.config';

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
  });

  const { initialize, isInitialized } = useAuthStore();
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        console.log('Starting initialization...');
        await initialize();
        console.log('Initialization complete');
      } catch (err: any) {
        console.log('Init error:', err);
        setInitError(err.message || 'Failed to initialize');
      }
    };
    init();
  }, []);

  // Handle font loading error
  if (fontError) {
    console.log('Font error:', fontError);
  }

  // Show loading while fonts load or auth initializes
  if (!fontsLoaded || !isInitialized) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>Spinr</Text>
        </View>
        <ActivityIndicator size="large" color={SpinrConfig.theme.colors.primary} />
        {initError && <Text style={styles.errorText}>{initError}</Text>}
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="otp" />
        <Stack.Screen name="profile" />
        <Stack.Screen name="home" />
      </Stack>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: SpinrConfig.theme.colors.primary,
  },
  logoContainer: {
    marginBottom: 24,
  },
  logoText: {
    fontSize: 48,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  errorText: {
    color: '#FFFFFF',
    marginTop: 16,
    fontSize: 14,
  },
});
