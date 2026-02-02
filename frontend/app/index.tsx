import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../store/authStore';
import SpinrConfig from '../config/spinr.config';

export default function SplashScreen() {
  const router = useRouter();
  const { user, isInitialized, token } = useAuthStore();
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    // Start animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    if (!isInitialized) return;

    // Navigate after animation
    const timer = setTimeout(() => {
      if (!token) {
        // Not logged in -> Login
        router.replace('/login');
      } else if (user && !user.profile_complete) {
        // Logged in but profile incomplete -> Profile
        router.replace('/profile');
      } else if (user && user.profile_complete) {
        // Fully logged in -> Home
        router.replace('/home');
      } else {
        // Fallback
        router.replace('/login');
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [isInitialized, token, user]);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Text style={styles.logo}>Spinr</Text>
        <Text style={styles.tagline}>Let's get moving</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SpinrConfig.theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
  },
  logo: {
    fontSize: 56,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: '#FFFFFF',
    letterSpacing: -1,
  },
  tagline: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSans_400Regular',
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 8,
  },
});
