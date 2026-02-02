import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import SpinrConfig from '../../config/spinr.config';

const { width, height } = Dimensions.get('window');

export default function HomeScreen() {
  const { user } = useAuthStore();
  const [showPromo, setShowPromo] = useState(true);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'GOOD MORNING';
    if (hour < 17) return 'GOOD AFTERNOON';
    return 'GOOD EVENING';
  };

  return (
    <View style={styles.container}>
      {/* Map Placeholder */}
      <View style={styles.mapContainer}>
        {/* Header */}
        <SafeAreaView edges={['top']} style={styles.headerSafeArea}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.avatarContainer}>
                <Ionicons name="person" size={20} color="#666" />
              </View>
              <View style={styles.greetingContainer}>
                <Text style={styles.greetingText}>{getGreeting()}</Text>
                <Text style={styles.cityText}>{user?.city || 'Saskatchewan'}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.notificationButton}>
              <Ionicons name="notifications-outline" size={24} color="#1A1A1A" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>

        {/* Map Background */}
        <View style={styles.mapPlaceholder}>
          <View style={styles.mapOverlay}>
            <Ionicons name="location" size={40} color={SpinrConfig.theme.colors.primary} />
            <Text style={styles.mapText}>Map View</Text>
          </View>
          {/* Fake car markers */}
          <View style={[styles.carMarker, { top: '30%', left: '20%' }]}>
            <Ionicons name="car" size={16} color="#FFF" />
          </View>
          <View style={[styles.carMarker, { top: '50%', right: '25%' }]}>
            <Ionicons name="car" size={16} color="#FFF" />
          </View>
          <View style={[styles.carMarker, { top: '40%', left: '60%' }]}>
            <Ionicons name="car" size={16} color="#FFF" />
          </View>
        </View>

        {/* Current Location Button */}
        <TouchableOpacity style={styles.locationButton}>
          <Ionicons name="locate" size={24} color="#1A1A1A" />
        </TouchableOpacity>
      </View>

      {/* Bottom Sheet */}
      <View style={styles.bottomSheet}>
        <View style={styles.sheetHandle} />

        {/* Search Bar */}
        <TouchableOpacity style={styles.searchBar}>
          <Ionicons name="search" size={22} color={SpinrConfig.theme.colors.primary} />
          <Text style={styles.searchPlaceholder}>Where to?</Text>
        </TouchableOpacity>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickAction}>
            <View style={styles.quickActionIcon}>
              <Ionicons name="home" size={22} color={SpinrConfig.theme.colors.primary} />
            </View>
            <Text style={styles.quickActionText}>Home</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickAction}>
            <View style={styles.quickActionIcon}>
              <Ionicons name="briefcase" size={22} color={SpinrConfig.theme.colors.primary} />
            </View>
            <Text style={styles.quickActionText}>Work</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickAction}>
            <View style={styles.quickActionIcon}>
              <Ionicons name="star" size={22} color={SpinrConfig.theme.colors.primary} />
            </View>
            <Text style={styles.quickActionText}>Saved</Text>
          </TouchableOpacity>
        </View>

        {/* Promo Banner */}
        {showPromo && (
          <View style={styles.promoBanner}>
            <View style={styles.promoIconContainer}>
              <Ionicons name="megaphone" size={20} color={SpinrConfig.theme.colors.primary} />
            </View>
            <View style={styles.promoContent}>
              <Text style={styles.promoTitle}>Ride local. Support local.</Text>
              <Text style={styles.promoText}>
                We take 0% commission. 100% of{"\n"}your fare goes to your driver.
              </Text>
            </View>
            <TouchableOpacity onPress={() => setShowPromo(false)} style={styles.promoClose}>
              <Ionicons name="close" size={20} color="#666" />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E8E8E8',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  headerSafeArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#D4C4A8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  greetingContainer: {
    marginLeft: 12,
  },
  greetingText: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans_500Medium',
    color: '#666',
    letterSpacing: 1,
  },
  cityText: {
    fontSize: 18,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: '#1A1A1A',
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  mapPlaceholder: {
    flex: 1,
    backgroundColor: '#E0E7E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapOverlay: {
    alignItems: 'center',
    opacity: 0.5,
  },
  mapText: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_500Medium',
    color: '#666',
    marginTop: 8,
  },
  carMarker: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: SpinrConfig.theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationButton: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  bottomSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 28,
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 20,
  },
  searchPlaceholder: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSans_500Medium',
    color: '#999',
    marginLeft: 12,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  quickAction: {
    alignItems: 'center',
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFF0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_500Medium',
    color: '#1A1A1A',
  },
  promoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8F0',
    borderRadius: 16,
    padding: 16,
  },
  promoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFE8E8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  promoContent: {
    flex: 1,
    marginLeft: 12,
  },
  promoTitle: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  promoText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_400Regular',
    color: '#666',
    lineHeight: 18,
  },
  promoClose: {
    padding: 4,
  },
});
