import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useRideStore } from '../store/rideStore';
import SpinrConfig from '../config/spinr.config';

export default function RideOptionsScreen() {
  const router = useRouter();
  const { pickup, dropoff, estimates, selectedVehicle, fetchEstimates, selectVehicle, isLoading } = useRideStore();
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (pickup && dropoff) {
      fetchEstimates();
    }
  }, [pickup, dropoff]);

  useEffect(() => {
    if (estimates.length > 0 && !selectedVehicle) {
      selectVehicle(estimates[0].vehicle_type);
    }
  }, [estimates]);

  const handleSelect = (index: number) => {
    setSelectedIndex(index);
    selectVehicle(estimates[index].vehicle_type);
  };

  const handleConfirm = () => {
    router.push('/payment-confirm');
  };

  const getVehicleIcon = (icon: string) => {
    switch (icon) {
      case 'car-sport':
        return 'car-sport';
      case 'car-outline':
        return 'car';
      default:
        return 'car';
    }
  };

  const selectedEstimate = estimates[selectedIndex];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Choose a ride</Text>
        <View style={{ width: 44 }} />
      </View>

      {/* Route Summary */}
      <View style={styles.routeSummary}>
        <View style={styles.routePoint}>
          <View style={[styles.routeDot, { backgroundColor: '#10B981' }]} />
          <Text style={styles.routeText} numberOfLines={1}>{pickup?.address}</Text>
        </View>
        <View style={styles.routeDivider} />
        <View style={styles.routePoint}>
          <View style={[styles.routeDot, { backgroundColor: SpinrConfig.theme.colors.primary }]} />
          <Text style={styles.routeText} numberOfLines={1}>{dropoff?.address}</Text>
        </View>
      </View>

      {/* Vehicle Options */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={SpinrConfig.theme.colors.primary} />
          <Text style={styles.loadingText}>Finding best rides...</Text>
        </View>
      ) : (
        <ScrollView style={styles.optionsList} showsVerticalScrollIndicator={false}>
          {estimates.map((estimate, index) => (
            <TouchableOpacity
              key={estimate.vehicle_type.id}
              style={[
                styles.optionCard,
                selectedIndex === index && styles.optionCardSelected,
              ]}
              onPress={() => handleSelect(index)}
              activeOpacity={0.7}
            >
              <View style={styles.optionLeft}>
                <View style={[
                  styles.vehicleIconContainer,
                  selectedIndex === index && styles.vehicleIconSelected,
                ]}>
                  <Ionicons
                    name={getVehicleIcon(estimate.vehicle_type.icon) as any}
                    size={28}
                    color={selectedIndex === index ? '#FFFFFF' : SpinrConfig.theme.colors.primary}
                  />
                </View>
                <View style={styles.optionInfo}>
                  <Text style={styles.optionName}>{estimate.vehicle_type.name}</Text>
                  <Text style={styles.optionDesc}>
                    {estimate.duration_minutes} min • {estimate.vehicle_type.capacity} seats
                  </Text>
                </View>
              </View>
              <View style={styles.optionRight}>
                <Text style={styles.optionPrice}>${estimate.total_fare.toFixed(2)}</Text>
                {selectedIndex === index && (
                  <View style={styles.checkmark}>
                    <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))}

          {/* Fare Breakdown */}
          {selectedEstimate && (
            <View style={styles.fareBreakdown}>
              <Text style={styles.breakdownTitle}>Fare Details</Text>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Base fare</Text>
                <Text style={styles.breakdownValue}>${selectedEstimate.base_fare.toFixed(2)}</Text>
              </View>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Distance ({selectedEstimate.distance_km} km)</Text>
                <Text style={styles.breakdownValue}>${selectedEstimate.distance_fare.toFixed(2)}</Text>
              </View>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Time ({selectedEstimate.duration_minutes} min)</Text>
                <Text style={styles.breakdownValue}>${selectedEstimate.time_fare.toFixed(2)}</Text>
              </View>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Booking fee</Text>
                <Text style={styles.breakdownValue}>${selectedEstimate.booking_fee.toFixed(2)}</Text>
              </View>
              <View style={[styles.breakdownRow, styles.breakdownTotal]}>
                <Text style={styles.breakdownTotalLabel}>Total</Text>
                <Text style={styles.breakdownTotalValue}>${selectedEstimate.total_fare.toFixed(2)}</Text>
              </View>
            </View>
          )}
        </ScrollView>
      )}

      {/* Confirm Button */}
      {!isLoading && estimates.length > 0 && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.confirmButton}
            onPress={handleConfirm}
            activeOpacity={0.8}
          >
            <Text style={styles.confirmButtonText}>Confirm {selectedEstimate?.vehicle_type.name}</Text>
            <Text style={styles.confirmButtonPrice}>${selectedEstimate?.total_fare.toFixed(2)}</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: '#1A1A1A',
  },
  routeSummary: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#F9F9F9',
  },
  routePoint: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  routeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
  },
  routeDivider: {
    width: 2,
    height: 20,
    backgroundColor: '#E0E0E0',
    marginLeft: 4,
    marginVertical: 4,
  },
  routeText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_500Medium',
    color: '#1A1A1A',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_400Regular',
    color: '#666',
  },
  optionsList: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    marginBottom: 12,
    backgroundColor: '#F9F9F9',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionCardSelected: {
    backgroundColor: '#FFF5F5',
    borderColor: SpinrConfig.theme.colors.primary,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  vehicleIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFF0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  vehicleIconSelected: {
    backgroundColor: SpinrConfig.theme.colors.primary,
  },
  optionInfo: {
    flex: 1,
  },
  optionName: {
    fontSize: 17,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  optionDesc: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_400Regular',
    color: '#666',
  },
  optionRight: {
    alignItems: 'flex-end',
  },
  optionPrice: {
    fontSize: 18,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: '#1A1A1A',
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: SpinrConfig.theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  fareBreakdown: {
    backgroundColor: '#F9F9F9',
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
    marginBottom: 20,
  },
  breakdownTitle: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  breakdownLabel: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_400Regular',
    color: '#666',
  },
  breakdownValue: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_500Medium',
    color: '#1A1A1A',
  },
  breakdownTotal: {
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    marginTop: 8,
    paddingTop: 12,
  },
  breakdownTotalLabel: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: '#1A1A1A',
  },
  breakdownTotalValue: {
    fontSize: 18,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: SpinrConfig.theme.colors.primary,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: SpinrConfig.theme.colors.primary,
    borderRadius: 28,
    paddingVertical: 18,
    paddingHorizontal: 24,
  },
  confirmButtonText: {
    fontSize: 17,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: '#FFFFFF',
  },
  confirmButtonPrice: {
    fontSize: 17,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: '#FFFFFF',
  },
});
