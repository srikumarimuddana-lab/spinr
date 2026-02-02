import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const API_URL = Constants.expoConfig?.extra?.backendUrl || process.env.EXPO_PUBLIC_BACKEND_URL || '';

// Platform-safe secure storage
const storage = {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    }
    return SecureStore.getItemAsync(key);
  },
  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
      return;
    }
    return SecureStore.setItemAsync(key, value);
  },
  async deleteItem(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key);
      return;
    }
    return SecureStore.deleteItemAsync(key);
  },
};

interface User {
  id: string;
  phone: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  city?: string;
  role: string;
  created_at: string;
  profile_complete: boolean;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  
  // Actions
  initialize: () => Promise<void>;
  sendOTP: (phone: string) => Promise<{ success: boolean; dev_otp?: string }>;
  verifyOTP: (phone: string, code: string) => Promise<{ is_new_user: boolean }>;
  createProfile: (data: { first_name: string; last_name: string; email: string; city: string }) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isLoading: false,
  isInitialized: false,
  error: null,

  initialize: async () => {
    try {
      set({ isLoading: true });
      
      // Get token from secure storage
      const token = await storage.getItem('auth_token');
      
      if (token) {
        // Set token in axios headers
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        // Fetch user profile
        const response = await api.get('/auth/me');
        set({ 
          user: response.data, 
          token,
          isInitialized: true,
          isLoading: false 
        });
      } else {
        set({ isInitialized: true, isLoading: false });
      }
    } catch (error: any) {
      console.log('Auth initialization error:', error.message);
      // Token might be invalid, clear it
      await storage.deleteItem('auth_token');
      set({ 
        user: null, 
        token: null, 
        isInitialized: true, 
        isLoading: false 
      });
    }
  },

  sendOTP: async (phone: string) => {
    try {
      set({ isLoading: true, error: null });
      
      const response = await api.post('/auth/send-otp', { phone });
      
      set({ isLoading: false });
      return { 
        success: response.data.success, 
        dev_otp: response.data.dev_otp 
      };
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Failed to send OTP';
      set({ isLoading: false, error: message });
      throw new Error(message);
    }
  },

  verifyOTP: async (phone: string, code: string) => {
    try {
      set({ isLoading: true, error: null });
      
      const response = await api.post('/auth/verify-otp', { phone, code });
      const { token, user, is_new_user } = response.data;
      
      // Store token securely
      await storage.setItem('auth_token', token);
      
      // Set token in axios headers
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      set({ 
        user, 
        token, 
        isLoading: false 
      });
      
      return { is_new_user };
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Invalid verification code';
      set({ isLoading: false, error: message });
      throw new Error(message);
    }
  },

  createProfile: async (data) => {
    try {
      set({ isLoading: true, error: null });
      
      const response = await api.post('/users/profile', data);
      
      set({ 
        user: response.data, 
        isLoading: false 
      });
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Failed to create profile';
      set({ isLoading: false, error: message });
      throw new Error(message);
    }
  },

  logout: async () => {
    try {
      await SecureStore.deleteItemAsync('auth_token');
      delete api.defaults.headers.common['Authorization'];
      set({ user: null, token: null });
    } catch (error) {
      console.log('Logout error:', error);
    }
  },

  clearError: () => set({ error: null }),
}));
