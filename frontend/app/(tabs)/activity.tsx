import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import SpinrConfig from '../../config/spinr.config';

export default function ActivityScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Activity</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Empty State */}
        <View style={styles.emptyState}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="car-outline" size={48} color="#CCC" />
          </View>
          <Text style={styles.emptyTitle}>No rides yet</Text>
          <Text style={styles.emptyText}>
            Your ride history will appear here once{"\n"}you complete your first trip.
          </Text>
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
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  title: {
    fontSize: 24,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: '#1A1A1A',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyState: {
    alignItems: 'center',
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_400Regular',
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
});
