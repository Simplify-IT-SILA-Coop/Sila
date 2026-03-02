import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AppTheme, COLORS } from '../theme';

import LoginScreen from '../screens/LoginScreen';
import DashboardScreen from '../screens/DashboardScreen';
import ScannerScreen from '../screens/ScannerScreen';
import ParcelPickupScreen from '../screens/ParcelPickupScreen';
import DeliverySuccessScreen from '../screens/DeliverySuccessScreen';
import MapScreen from '../screens/MapScreen';
import ProfileScreen from '../screens/ProfileScreen';

import { useAuthStore } from '../store/useAuthStore';

export type RootStackParamList = {
    Login: undefined;
    Dashboard: undefined;
    Scanner: undefined;
    ParcelPickup: undefined;
    DeliverySuccess: undefined;
    Map: undefined;
    Profile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
    const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        const checkHydration = () => {
            if (useAuthStore.persist.hasHydrated()) {
                console.log('Auth: Hydration confirmed');
                setIsReady(true);
            } else {
                const unsub = useAuthStore.persist.onFinishHydration(() => {
                    console.log('Auth: Hydration finished via callback');
                    setIsReady(true);
                });
                return unsub;
            }
        };

        const unsubHydration = checkHydration();

        const safetyTimer = setTimeout(() => {
            if (!isReady) {
                console.log('Auth: Safety timeout triggered');
                setIsReady(true);
            }
        }, 2000);

        return () => {
            if (unsubHydration) unsubHydration();
            clearTimeout(safetyTimer);
        };
    }, []);

    if (!isReady) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    return (
        <NavigationContainer theme={AppTheme}>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                {!isLoggedIn ? (
                    <Stack.Screen name="Login" component={LoginScreen} />
                ) : (
                    <>
                        <Stack.Screen name="Dashboard" component={DashboardScreen} />
                        <Stack.Screen name="Scanner" component={ScannerScreen} />
                        <Stack.Screen name="ParcelPickup" component={ParcelPickupScreen} />
                        <Stack.Screen name="DeliverySuccess" component={DeliverySuccessScreen} />
                        <Stack.Screen name="Map" component={MapScreen} />
                        <Stack.Screen name="Profile" component={ProfileScreen} />
                    </>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
}
