import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, CheckCircle2, Clock, MapPin, Package, Banknote, ListTodo } from 'lucide-react-native';
import { COLORS, SIZES, FONTS } from '../theme';
import { useAuthStore } from '../store/useAuthStore';
import { useTaskStore } from '../store/useTaskStore';

export default function DeliverySuccessScreen({ navigation, route }: any) {
    const { taskId } = route.params || {};
    const { driver } = useAuthStore();
    const { tasks } = useTaskStore();

    const task = tasks.find(t => t.id === taskId);
    // Calculate total earnings from delivered tasks
    const deliveredTasks = tasks.filter(t => t.status === 'DELIVERED');
    const totalEarnings = deliveredTasks.reduce((sum, task) => sum + (task.estimatedCost || 0), 0);

    if (!driver) return null;

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
                    <ChevronLeft color={COLORS.text} size={24} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Delivery Success</Text>
                <View style={styles.iconBtn} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                <View style={styles.successHeader}>
                    <View style={styles.successIconContainer}>
                        <CheckCircle2 color={COLORS.primary} size={48} />
                    </View>
                    <Text style={styles.successTitle}>Delivered Successfully</Text>
                    <Text style={styles.successSubtitle}>Order #{taskId || 'Unknown'} has been handed over</Text>
                </View>

                <View style={styles.imageContainer}>
                    <View style={styles.imagePlaceholder}>
                        <Package color={COLORS.border} size={64} style={{ alignSelf: 'center', marginTop: 40 }} />
                    </View>
                </View>

                <View style={styles.earningsCard}>
                    <View>
                        <Text style={styles.earningsLabel}>TRIP REWARD</Text>
                        <Text style={styles.earningsAmount}>{task?.estimatedCost ? `${task.estimatedCost} MAD` : 'Calculated... MAD'}</Text>
                    </View>
                    <Banknote color={COLORS.primary} size={32} />
                </View>

                <View style={styles.summaryCard}>
                    <Text style={styles.summaryTitle}>Today's Summary</Text>

                    <View style={styles.summaryRow}>
                        <View style={styles.summaryIconContainer}>
                            <ListTodo color={COLORS.textSecondary} size={20} />
                        </View>
                        <View style={styles.summaryTextContainer}>
                            <Text style={styles.summaryLabel}>Total Deliveries</Text>
                            <Text style={styles.summarySubtext}>Completed missions</Text>
                        </View>
                        <Text style={styles.summaryValue}>{tasks.length}</Text>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.summaryRow}>
                        <View style={styles.summaryIconContainer}>
                            <Clock color={COLORS.textSecondary} size={20} />
                        </View>
                        <View style={styles.summaryTextContainer}>
                            <Text style={styles.summaryLabel}>Active Session</Text>
                            <Text style={styles.summarySubtext}>Status: {driver.isActive ? 'Active' : 'Inactive'}</Text>
                        </View>
                        <Text style={styles.summaryValue}>Live</Text>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.summaryRow}>
                        <View style={styles.summaryIconContainer}>
                            <Banknote color={COLORS.primary} size={20} />
                        </View>
                        <View style={styles.summaryTextContainer}>
                            <Text style={styles.summaryLabel}>Total Earnings</Text>
                            <Text style={styles.summarySubtext}>Daily balance</Text>
                        </View>
                        <Text style={[styles.summaryValue, { color: COLORS.primary }]}>{totalEarnings.toFixed(2)} DH</Text>
                    </View>
                </View>

            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={() => navigation.navigate('Dashboard')}
                >
                    <ListTodo color={COLORS.white} size={20} style={{ marginRight: 8 }} />
                    <Text style={styles.secondaryButtonText}>Back to Dashboard</Text>
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
        width: 40,
    },
    scrollContent: {
        paddingHorizontal: SIZES.padding,
        paddingBottom: 20,
    },
    successHeader: {
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 30,
    },
    successIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: COLORS.success,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    successTitle: {
        ...FONTS.h1,
        color: COLORS.text,
        marginBottom: 8,
    },
    successSubtitle: {
        ...FONTS.body1,
        color: COLORS.textSecondary,
    },
    imageContainer: {
        width: '100%',
        height: 160,
        backgroundColor: '#1C2938',
        borderRadius: SIZES.radiusL,
        marginBottom: 24,
        overflow: 'hidden',
    },
    imagePlaceholder: {
        width: '100%',
        height: '100%',
    },
    earningsCard: {
        backgroundColor: COLORS.success,
        borderRadius: SIZES.radius,
        padding: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    earningsLabel: {
        ...FONTS.small,
        color: '#4A7A2A',
        fontWeight: '700',
        marginBottom: 4,
    },
    earningsAmount: {
        ...FONTS.h1,
        color: COLORS.primaryDark,
    },
    summaryCard: {
        backgroundColor: COLORS.white,
        borderRadius: SIZES.radiusL,
        padding: 24,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    summaryTitle: {
        ...FONTS.h2,
        color: COLORS.text,
        marginBottom: 24,
    },
    summaryRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    summaryIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 8,
        backgroundColor: COLORS.background,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    summaryTextContainer: {
        flex: 1,
    },
    summaryLabel: {
        ...FONTS.body1,
        color: COLORS.text,
        fontWeight: '600',
        marginBottom: 2,
    },
    summarySubtext: {
        ...FONTS.small,
        color: COLORS.textSecondary,
    },
    summaryValue: {
        ...FONTS.h3,
        color: COLORS.text,
    },
    divider: {
        height: 1,
        backgroundColor: COLORS.border,
        marginVertical: 16,
    },
    footer: {
        padding: SIZES.padding,
        backgroundColor: COLORS.background,
    },
    secondaryButton: {
        backgroundColor: '#1C2127',
        height: 56,
        borderRadius: SIZES.radius,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    secondaryButtonText: {
        ...FONTS.h3,
        color: COLORS.white,
    }
});
