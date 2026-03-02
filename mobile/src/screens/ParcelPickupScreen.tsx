import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, CheckCircle2, ChevronRight, Package, Banknote } from 'lucide-react-native';
import { COLORS, SIZES, FONTS } from '../theme';
import { useTaskStore } from '../store/useTaskStore';

export default function ParcelPickupScreen({ navigation, route }: any) {
    const { taskId } = route.params || {};
    const { tasks } = useTaskStore();

    const task = tasks.find(t => t.id === taskId);

    if (!task) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
                        <ChevronLeft color={COLORS.text} size={24} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Not Found</Text>
                </View>
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>Task details not found.</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
                    <ChevronLeft color={COLORS.text} size={24} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Parcel Details</Text>
                <View style={styles.iconBtn}>
                    <CheckCircle2 color={task.status === 'PICKED' ? COLORS.secondary : COLORS.textSecondary} size={24} />
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.imageContainer}>
                    <View style={styles.imagePlaceholder}>
                        <Package color={COLORS.border} size={64} />
                    </View>
                    <View style={styles.verifiedBadge}>
                        <CheckCircle2 color={COLORS.white} size={14} style={{ marginRight: 4 }} />
                        <Text style={styles.verifiedText}>TASK #{task.id}</Text>
                    </View>
                </View>

                <View style={styles.senderHeader}>
                    <View>
                        <Text style={styles.senderName}>Client Order</Text>
                        <Text style={styles.senderRole}>STATUS: {task.status}</Text>
                    </View>
                    <View style={styles.premiumBadge}>
                        <Text style={styles.premiumText}>{task.fragile ? 'FRAGILE' : 'STANDARD'}</Text>
                    </View>
                </View>

                <View style={styles.detailsContainer}>
                    <View style={styles.detailRow}>
                        <View style={styles.detailIconContainer}>
                            <Text style={styles.detailIconText}>📍</Text>
                        </View>
                        <Text style={styles.detailLabel}>From</Text>
                        <Text style={styles.detailValue}>{task.cityFrom}</Text>
                    </View>
                    <View style={styles.subDetailRow}>
                        <Text style={styles.subDetailValue}>{task.pickupAddress}</Text>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.detailRow}>
                        <View style={styles.detailIconContainer}>
                            <Text style={styles.detailIconText}>🎯</Text>
                        </View>
                        <Text style={styles.detailLabel}>Destination</Text>
                        <Text style={styles.detailValue}>{task.cityTo}</Text>
                    </View>
                    <View style={styles.subDetailRow}>
                        <Text style={styles.subDetailValue}>{task.deliveryAddress}</Text>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.detailRow}>
                        <View style={styles.detailIconContainer}>
                            <Package color={COLORS.textSecondary} size={16} />
                        </View>
                        <Text style={styles.detailLabel}>Weight</Text>
                        <Text style={styles.detailValue}>{task.weightKg} kg</Text>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.detailRow}>
                        <View style={styles.detailIconContainer}>
                            <Banknote color={COLORS.textSecondary} size={16} />
                        </View>
                        <Text style={styles.detailLabel}>Price</Text>
                        <Text style={styles.paymentValue}>{task.estimatedCost ? `${task.estimatedCost} MAD` : 'Not set'}</Text>
                    </View>
                </View>

                <TouchableOpacity style={styles.locationCard} onPress={() => { }}>
                    <View style={styles.locationInfo}>
                        <View style={styles.locationIcon}>
                            <Package color={COLORS.primary} size={20} />
                        </View>
                        <View>
                            <Text style={styles.locationTitle}>ASSIGNED DRIVER</Text>
                            <Text style={styles.locationName}>You are currently assigned</Text>
                        </View>
                    </View>
                </TouchableOpacity>

            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.primaryButton, task.status === 'DELIVERED' && { backgroundColor: COLORS.success }]}
                    onPress={() => navigation.navigate('DeliverySuccess', { taskId: task.id })}
                >
                    <CheckCircle2 color={COLORS.white} size={20} style={{ marginRight: 8 }} />
                    <Text style={styles.primaryButtonText}>
                        {task.status === 'PENDING' ? 'MARK AS PICKED' : 'VIEW STATUS'}
                    </Text>
                </TouchableOpacity>
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
        paddingVertical: 16,
    },
    headerTitle: {
        ...FONTS.h2,
        color: COLORS.text,
    },
    iconBtn: {
        padding: 8,
    },
    scrollContent: {
        paddingHorizontal: SIZES.padding,
        paddingBottom: 20,
    },
    imageContainer: {
        width: '100%',
        height: 220,
        backgroundColor: '#E8ECF1',
        borderRadius: SIZES.radiusL,
        position: 'relative',
        marginBottom: 24,
        overflow: 'hidden',
    },
    imagePlaceholder: {
        width: '100%',
        height: '100%',
    },
    verifiedBadge: {
        position: 'absolute',
        top: 16,
        right: 16,
        backgroundColor: COLORS.secondary,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
    },
    verifiedText: {
        ...FONTS.small,
        color: COLORS.white,
        fontWeight: '700',
    },
    senderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 24,
    },
    senderName: {
        ...FONTS.h1,
        color: COLORS.text,
        marginBottom: 4,
    },
    senderRole: {
        ...FONTS.small,
        color: COLORS.textSecondary,
        fontWeight: '600',
    },
    premiumBadge: {
        backgroundColor: '#FFF4E5',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 4,
    },
    premiumText: {
        ...FONTS.small,
        color: '#F2994A',
        fontWeight: '700',
    },
    detailsContainer: {
        backgroundColor: COLORS.white,
        borderRadius: SIZES.radius,
        borderWidth: 1,
        borderColor: COLORS.border,
        marginBottom: 24,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    detailIconContainer: {
        width: 24,
        alignItems: 'center',
        marginRight: 12,
    },
    detailIconText: {
        fontSize: 16,
    },
    detailLabel: {
        ...FONTS.body2,
        color: COLORS.textSecondary,
        flex: 1,
    },
    detailValue: {
        ...FONTS.body1,
        color: COLORS.text,
        fontWeight: '600',
    },
    paymentValue: {
        ...FONTS.body1,
        color: COLORS.secondary,
        fontWeight: '700',
    },
    divider: {
        height: 1,
        backgroundColor: COLORS.border,
        marginHorizontal: 16,
    },
    locationCard: {
        backgroundColor: COLORS.white,
        borderRadius: SIZES.radius,
        borderWidth: 1,
        borderColor: COLORS.border,
        padding: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    locationInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    locationIcon: {
        width: 40,
        height: 40,
        borderRadius: 8,
        backgroundColor: COLORS.success,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    locationTitle: {
        ...FONTS.small,
        color: COLORS.textSecondary,
        fontWeight: '600',
        marginBottom: 2,
    },
    locationName: {
        ...FONTS.body2,
        color: COLORS.text,
        fontWeight: '500',
    },
    footer: {
        padding: SIZES.padding,
        backgroundColor: COLORS.background,
    },
    primaryButton: {
        backgroundColor: COLORS.primary,
        height: 56,
        borderRadius: SIZES.radius,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    primaryButtonText: {
        ...FONTS.h3,
        color: COLORS.white,
    }
});
