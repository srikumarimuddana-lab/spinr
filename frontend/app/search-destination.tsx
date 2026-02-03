import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useRideStore } from '../../store/rideStore';
import { useAuthStore } from '../../store/authStore';
import SpinrConfig from '../../config/spinr.config';

// Mock places for demo (in production, use Google Places API)
const MOCK_PLACES = [
  { id: '1', name: 'Midtown Plaza', address: '201 1st Ave S, Saskatoon, SK', lat: 52.1332, lng: -106.6700 },
  { id: '2', name: 'University of Saskatchewan', address: '105 Administration Pl, Saskatoon, SK', lat: 52.1332, lng: -106.6280 },
  { id: '3', name: 'Saskatoon City Hospital', address: '701 Queen St, Saskatoon, SK', lat: 52.1225, lng: -106.6561 },
  { id: '4', name: 'TCU Place', address: '35 22nd St E, Saskatoon, SK', lat: 52.1285, lng: -106.6665 },
  { id: '5', name: 'River Landing', address: '102 Spadina Cres E, Saskatoon, SK', lat: 52.1244, lng: -106.6644 },
  { id: '6', name: 'Lawson Heights Mall', address: '134 Primrose Dr, Saskatoon, SK', lat: 52.1567, lng: -106.6425 },
];

export default function SearchDestinationScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { pickup, dropoff, setPickup, setDropoff, savedAddresses, fetchSavedAddresses } = useRideStore();
  
  const [activeField, setActiveField] = useState<'pickup' | 'dropoff'>('dropoff');
  const [searchText, setSearchText] = useState('');
  const [filteredPlaces, setFilteredPlaces] = useState(MOCK_PLACES);

  useEffect(() => {
    fetchSavedAddresses();
    // Set default pickup to user's city center
    if (!pickup) {
      const defaultPickup = user?.city === 'Regina' 
        ? { address: 'Current Location', lat: 50.4452, lng: -104.6189 }
        : { address: 'Current Location', lat: 52.1332, lng: -106.6700 };
      setPickup(defaultPickup);
    }
  }, []);

  useEffect(() => {
    if (searchText.trim()) {
      const filtered = MOCK_PLACES.filter(
        (p) =>
          p.name.toLowerCase().includes(searchText.toLowerCase()) ||
          p.address.toLowerCase().includes(searchText.toLowerCase())
      );
      setFilteredPlaces(filtered);
    } else {
      setFilteredPlaces(MOCK_PLACES);
    }
  }, [searchText]);

  const handlePlaceSelect = (place: typeof MOCK_PLACES[0]) => {
    const location = {
      address: place.name + ', ' + place.address.split(',')[0],
      lat: place.lat,
      lng: place.lng,
    };

    if (activeField === 'pickup') {
      setPickup(location);
    } else {
      setDropoff(location);
    }

    // If both are set, navigate to ride options
    if ((activeField === 'pickup' && dropoff) || (activeField === 'dropoff' && pickup)) {
      router.push('/ride-options');
    }
  };

  const handleSavedAddressSelect = (addr: typeof savedAddresses[0]) => {
    const location = {
      address: addr.address,
      lat: addr.lat,
      lng: addr.lng,
    };

    if (activeField === 'pickup') {
      setPickup(location);
    } else {
      setDropoff(location);
    }

    if ((activeField === 'pickup' && dropoff) || (activeField === 'dropoff' && pickup)) {
      router.push('/ride-options');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Set destination</Text>
        <View style={{ width: 44 }} />
      </View>

      {/* Location Inputs */}
      <View style={styles.inputsContainer}>
        <View style={styles.inputRow}>
          <View style={[styles.dot, { backgroundColor: '#10B981' }]} />
          <TouchableOpacity
            style={[styles.input, activeField === 'pickup' && styles.inputActive]}
            onPress={() => setActiveField('pickup')}
          >
            <Text style={pickup ? styles.inputText : styles.inputPlaceholder} numberOfLines={1}>
              {pickup?.address || 'Pickup location'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.inputDivider} />

        <View style={styles.inputRow}>
          <View style={[styles.dot, { backgroundColor: SpinrConfig.theme.colors.primary }]} />
          <TouchableOpacity
            style={[styles.input, activeField === 'dropoff' && styles.inputActive]}
            onPress={() => setActiveField('dropoff')}
          >
            <Text style={dropoff ? styles.inputText : styles.inputPlaceholder} numberOfLines={1}>
              {dropoff?.address || 'Where to?'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#999" />
        <TextInput
          style={styles.searchInput}
          value={searchText}
          onChangeText={setSearchText}
          placeholder={`Search for ${activeField === 'pickup' ? 'pickup' : 'destination'}`}
          placeholderTextColor="#999"
          autoFocus
        />
        {searchText ? (
          <TouchableOpacity onPress={() => setSearchText('')}>
            <Ionicons name="close-circle" size={20} color="#999" />
          </TouchableOpacity>
        ) : null}
      </View>

      <ScrollView style={styles.resultsList} showsVerticalScrollIndicator={false}>
        {/* Saved Addresses */}
        {savedAddresses.length > 0 && !searchText && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Saved Places</Text>
            {savedAddresses.map((addr) => (
              <TouchableOpacity
                key={addr.id}
                style={styles.placeItem}
                onPress={() => handleSavedAddressSelect(addr)}
              >
                <View style={styles.placeIcon}>
                  <Ionicons
                    name={addr.icon === 'home' ? 'home' : addr.icon === 'briefcase' ? 'briefcase' : 'star'}
                    size={20}
                    color={SpinrConfig.theme.colors.primary}
                  />
                </View>
                <View style={styles.placeInfo}>
                  <Text style={styles.placeName}>{addr.name}</Text>
                  <Text style={styles.placeAddress} numberOfLines={1}>{addr.address}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Search Results */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {searchText ? 'Search Results' : 'Nearby Places'}
          </Text>
          {filteredPlaces.map((place) => (
            <TouchableOpacity
              key={place.id}
              style={styles.placeItem}
              onPress={() => handlePlaceSelect(place)}
            >
              <View style={styles.placeIcon}>
                <Ionicons name="location" size={20} color="#666" />
              </View>
              <View style={styles.placeInfo}>
                <Text style={styles.placeName}>{place.name}</Text>
                <Text style={styles.placeAddress} numberOfLines={1}>{place.address}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
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
  inputsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#F9F9F9',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 16,
  },
  inputDivider: {
    width: 2,
    height: 24,
    backgroundColor: '#E0E0E0',
    marginLeft: 5,
    marginVertical: 4,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  inputActive: {
    borderColor: SpinrConfig.theme.colors.primary,
  },
  inputText: {
    fontSize: 15,
    fontFamily: 'PlusJakartaSans_500Medium',
    color: '#1A1A1A',
  },
  inputPlaceholder: {
    fontSize: 15,
    fontFamily: 'PlusJakartaSans_400Regular',
    color: '#999',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginVertical: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 15,
    fontFamily: 'PlusJakartaSans_400Regular',
    color: '#1A1A1A',
  },
  resultsList: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: '#666',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  placeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  placeIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  placeInfo: {
    flex: 1,
  },
  placeName: {
    fontSize: 15,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  placeAddress: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_400Regular',
    color: '#666',
  },
});
