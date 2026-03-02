import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/api';

interface Driver {
    id: string;
    phone: string;
    fullName: string;
    vehicleInfo: string | null;
    earnings: number;
    rating: number;
    isActive: boolean;
}

interface AuthState {
    isLoggedIn: boolean;
    phone: string | null;
    driver: Driver | null;
    login: (phone: string) => Promise<{ success: boolean; error?: string }>;
    logout: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set: any) => ({
            isLoggedIn: false,
            phone: null,
            driver: null,
            login: async (phone: string) => {
                try {
                    const response = await fetch(`${API_BASE_URL}/api/drivers/login`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ phone }),
                    });

                    if (response.ok) {
                        const driver = await response.json();
                        set({ isLoggedIn: true, phone, driver });
                        return { success: true };
                    } else {
                        const error = await response.json();
                        return { success: false, error: error.detail || 'Login failed' };
                    }
                } catch (e) {
                    return { success: false, error: 'Network error. Please try again.' };
                }
            },
            logout: () => set({ isLoggedIn: false, phone: null, driver: null }),
        }),
        {
            name: 'auth-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
