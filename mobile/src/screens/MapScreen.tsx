import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, Callout } from 'react-native-maps';
import { ChevronLeft, MapPin, Package, Navigation } from 'lucide-react-native';
import { COLORS, SIZES, FONTS } from '../theme';
import { useTaskStore, Task } from '../store/useTaskStore';

export default function MapScreen({ navigation }: any) {
    const { tasks } = useTaskStore();
    const [selectedTask, setSelectedTask] = useState<Task | null>(tasks[0] || null);

    // Fallback coordinates for Marrakech if not provided by backend
    const getCoordinates = (task: Task) => {
        // In a real app, these would come from the backend or a geocoding service
        return {
            latitude: 31.6295 + (task.id * 0.005),
            longitude: -7.9811 + (task.id * 0.005),
        };
    };

    useEffect(() => {
        if (!selectedTask && tasks.length > 0) {
            setSelectedTask(tasks[0]);
        }
    }, [tasks]);

    const initialRegion = {
        latitude: 31.6295,
        longitude: -7.9811,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
                    <ChevronLeft color={COLORS.text} size={24} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Task Locations</Text>
                <View style={styles.iconBtn} />
            </View>

            <View style={styles.mapContainer}>
                <MapView
                    style={styles.map}
                    initialRegion={initialRegion}
                    region={selectedTask ? {
                        ...getCoordinates(selectedTask),
                        latitudeDelta: 0.05,
                        longitudeDelta: 0.05
                    } : undefined}
                    showsUserLocation
                >
                    {tasks.map((task) => {
                        const coords = getCoordinates(task);
                        const isActive = selectedTask?.id === task.id;
                        return (
                            <Marker
                                key={task.id}
                                coordinate={coords}
                                onPress={() => setSelectedTask(task)}
                            >
                                <View style={[
                                    styles.markerContainer,
                                    isActive && styles.markerContainerActive
                                ]}>
                                    <MapPin
                                        color={isActive ? COLORS.white : COLORS.primary}
                                        size={18}
                                    />
                                </View>
                                <Callout>
                                    <View style={styles.callout}>
                                        <Text style={styles.calloutTitle}>{task.cityTo}</Text>
                                        <Text style={styles.calloutPrice}>{task.weightKg} kg</Text>
                                    </View>
                                </Callout>
                            </Marker>
                        );
                    })}
                </MapView>
            </View>

            <View style={styles.cardsWrapper}>
                <Text style={styles.cardsTitle}>Your Tasks ({tasks.length})</Text>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.cardsScroll}
                >
                    {tasks.map((task) => {
                        const isActive = selectedTask?.id === task.id;
                        return (
                            <TouchableOpacity
                                key={task.id}
                                style={[styles.card, isActive && styles.cardActive]}
                                onPress={() => setSelectedTask(task)}
                                activeOpacity={0.85}
                            >
                                <View style={styles.cardTop}>
                                    <View style={[styles.tag, isActive && styles.tagActive]}>
                                        <Text style={[styles.tagText, isActive && styles.tagTextActive]}>
                                            {task.status}
                                        </Text>
                                    </View>
                                    <Text style={[styles.cardPrice, isActive && styles.cardPriceActive]}>
                                        {task.weightKg}kg
                                    </Text>
                                </View>
                                <Text style={[styles.cardLocation, isActive && styles.cardLocationActive]} numberOfLines={1}>
                                    {task.cityTo}
                                </Text>
                                <View style={styles.cardRow}>
                                    <MapPin size={14} color={isActive ? COLORS.white : COLORS.textSecondary} />
                                    <Text style={[styles.cardSub, isActive && styles.cardSubActive]} numberOfLines={1}>
                                        {task.deliveryAddress}
                                    </Text>
                                </View>
                                <View style={styles.cardRow}>
                                    <Package size={14} color={isActive ? COLORS.white : COLORS.textSecondary} />
                                    <Text style={[styles.cardSub, isActive && styles.cardSubActive]}>
                                        {task.cityFrom} → {task.cityTo}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>

                {selectedTask && (
                    <TouchableOpacity
                        style={styles.acceptBtn}
                        onPress={() => navigation.navigate('Scanner', { taskId: selectedTask.id })}
                    >
                        <Navigation color={COLORS.white} size={20} style={{ marginRight: 8 }} />
                        <Text style={styles.acceptBtnText}>Process Task — {selectedTask.cityTo}</Text>
                    </TouchableOpacity>
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SIZES.padding,
        paddingVertical: 12,
    },
    headerTitle: {
        ...FONTS.h2,
        color: COLORS.text,
    },
    iconBtn: {
        padding: 8,
        width: 40,
    },
    mapContainer: {
        flex: 1,
    },
    map: {
        flex: 1,
    },
    markerContainer: {
        backgroundColor: COLORS.white,
        padding: 6,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: COLORS.primary,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    markerContainerActive: {
        backgroundColor: COLORS.primary,
    },
    callout: {
        padding: 8,
        minWidth: 120,
    },
    calloutTitle: {
        ...FONTS.body2,
        color: COLORS.text,
        fontWeight: '600',
        marginBottom: 2,
    },
    calloutPrice: {
        ...FONTS.small,
        color: COLORS.primary,
        fontWeight: '700',
    },
    cardsWrapper: {
        backgroundColor: COLORS.background,
        paddingTop: 16,
        paddingBottom: 24,
    },
    cardsTitle: {
        ...FONTS.body1,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: 12,
        paddingHorizontal: SIZES.padding,
    },
    cardsScroll: {
        paddingHorizontal: SIZES.padding,
        gap: 12,
        paddingRight: SIZES.padding + 8,
    },
    card: {
        backgroundColor: COLORS.white,
        borderRadius: SIZES.radiusL,
        padding: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
        width: 220,
    },
    cardActive: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    cardTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    tag: {
        backgroundColor: '#FFF4E5',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 4,
    },
    tagActive: {
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    tagText: {
        ...FONTS.small,
        color: COLORS.secondary,
        fontWeight: '700',
        fontSize: 9,
    },
    tagTextActive: {
        color: COLORS.white,
    },
    cardPrice: {
        ...FONTS.h3,
        color: COLORS.primary,
    },
    cardPriceActive: {
        color: COLORS.white,
    },
    cardLocation: {
        ...FONTS.body1,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 8,
    },
    cardLocationActive: {
        color: COLORS.white,
    },
    cardRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 4,
    },
    cardSub: {
        ...FONTS.small,
        color: COLORS.textSecondary,
        flex: 1,
    },
    cardSubActive: {
        color: 'rgba(255,255,255,0.8)',
    },
    acceptBtn: {
        backgroundColor: COLORS.primary,
        marginHorizontal: SIZES.padding,
        marginTop: 16,
        height: 54,
        borderRadius: SIZES.radius,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    acceptBtnText: {
        ...FONTS.h3,
        color: COLORS.white,
        fontSize: 14,
    },
});
