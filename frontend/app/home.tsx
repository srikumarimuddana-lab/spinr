import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/authStore';
import SpinrConfig from '../config/spinr.config';

export default function HomeScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/login');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello,</Text>
          <Text style={styles.name}>
            {user?.first_name} {user?.last_name}
          </Text>
        </View>
        <TouchableOpacity style={styles.profileButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color={SpinrConfig.theme.colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Map Placeholder */}
      <View style={styles.mapPlaceholder}>
        <View style={styles.mapContent}>
          <View style={styles.locationPin}>
            <Ionicons name="location" size={48} color={SpinrConfig.theme.colors.primary} />
          </View>
          <Text style={styles.mapTitle}>Map Coming Soon</Text>
          <Text style={styles.mapSubtitle}>
            Your location: {user?.city}, Saskatchewan
          </Text>
        </View>
      </View>

      {/* Bottom Card */}
      <View style={styles.bottomCard}>
        <View style={styles.destinationInput}>
          <Ionicons name="search" size={20} color={SpinrConfig.theme.colors.textSecondary} />
          <Text style={styles.destinationPlaceholder}>Where to?</Text>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickAction}>
            <View style={styles.quickActionIcon}>
              <Ionicons name="home" size={20} color={SpinrConfig.theme.colors.primary} />
            </View>
            <View style={styles.quickActionText}>
              <Text style={styles.quickActionTitle}>Home</Text>
              <Text style={styles.quickActionSubtitle}>Add home address</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickAction}>
            <View style={styles.quickActionIcon}>
              <Ionicons name="briefcase" size={20} color={SpinrConfig.theme.colors.primary} />
            </View>
            <View style={styles.quickActionText}>
              <Text style={styles.quickActionTitle}>Work</Text>
              <Text style={styles.quickActionSubtitle}>Add work address</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* User Info Card */}
        <View style={styles.userInfoCard}>
          <View style={styles.userInfoHeader}>
            <Ionicons name="person-circle" size={24} color={SpinrConfig.theme.colors.primary} />
            <Text style={styles.userInfoTitle}>Your Profile</Text>
          </View>
          <View style={styles.userInfoRow}>
            <Text style={styles.userInfoLabel}>Phone</Text>
            <Text style={styles.userInfoValue}>{user?.phone}</Text>
          </View>
          <View style={styles.userInfoRow}>
            <Text style={styles.userInfoLabel}>Email</Text>
            <Text style={styles.userInfoValue}>{user?.email}</Text>
          </View>
          <View style={styles.userInfoRow}>
            <Text style={styles.userInfoLabel}>Role</Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>{user?.role?.toUpperCase()}</Text>
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: SpinrConfig.theme.colors.background,
  },
  greeting: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_400Regular',
    color: SpinrConfig.theme.colors.textSecondary,
  },
  name: {
    fontSize: 24,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: SpinrConfig.theme.colors.text,
  },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E5E7EB',
  },
  mapContent: {
    alignItems: 'center',
  },
  locationPin: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  mapTitle: {
    fontSize: 18,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: SpinrConfig.theme.colors.text,
    marginBottom: 4,
  },
  mapSubtitle: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_400Regular',
    color: SpinrConfig.theme.colors.textSecondary,
  },
  bottomCard: {
    backgroundColor: SpinrConfig.theme.colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  destinationInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: SpinrConfig.theme.borderRadius,
    paddingHorizontal: 16,
    height: 56,
    marginBottom: 20,
  },
  destinationPlaceholder: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSans_500Medium',
    color: SpinrConfig.theme.colors.textSecondary,
    marginLeft: 12,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  quickAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
  },
  quickActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  quickActionText: {
    flex: 1,
  },
  quickActionTitle: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: SpinrConfig.theme.colors.text,
  },
  quickActionSubtitle: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_400Regular',
    color: SpinrConfig.theme.colors.textSecondary,
  },
  userInfoCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: SpinrConfig.theme.borderRadius,
    padding: 16,
  },
  userInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: SpinrConfig.theme.colors.border,
  },
  userInfoTitle: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: SpinrConfig.theme.colors.text,
    marginLeft: 8,
  },
  userInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  userInfoLabel: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_400Regular',
    color: SpinrConfig.theme.colors.textSecondary,
  },
  userInfoValue: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_500Medium',
    color: SpinrConfig.theme.colors.text,
  },
  roleBadge: {
    backgroundColor: SpinrConfig.theme.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: '#FFFFFF',
  },
});
