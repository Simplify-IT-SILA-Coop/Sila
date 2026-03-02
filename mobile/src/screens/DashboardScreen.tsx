import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bell, MapPin, Package, Star, Calendar, Clock, Home, ClipboardList, User, Banknote, Map as MapIcon } from 'lucide-react-native';
import MapView, { Marker } from 'react-native-maps';
import { COLORS, SIZES, FONTS } from '../theme';
import { useAuthStore } from '../store/useAuthStore';
import { useTaskStore } from '../store/useTaskStore';

export default function DashboardScreen({ navigation }: any) {
    const { driver } = useAuthStore();
    const { tasks, fetchTasks, loading, pendingCount, acceptTask, completeTask } = useTaskStore();

    useEffect(() => {
        if (driver?.id) {
            fetchTasks(driver.id);
        }
    }, [driver?.id]);

    if (!driver) return null;

    const initials = driver.fullName.split(' ').map(n => n[0]).join('');
    const availableTasks = tasks.filter(t => t.status === 'PENDING');
    const myTasks = tasks.filter(t => t.driverId === driver.id);
    const deliveredTasks = tasks.filter(t => t.status === 'DELIVERED');
    // Calculate total earnings from delivered tasks
    const totalEarnings = deliveredTasks.reduce((sum, task) => sum + (task.estimatedCost || 0), 0);
    // Show delivered task first, then current task, then available task
    const currentTask = deliveredTasks[0] || myTasks.find(t => t.status !== 'DELIVERED') || myTasks[0] || availableTasks[0];

    const handleAcceptTask = async (taskId: number) => {
        if (!driver?.id) return;
        
        const result = await acceptTask(driver.id, taskId);
        if (!result.success && result.error) {
            console.error('Failed to accept task:', result.error);
        }
    };

    const handleCompleteTask = async (taskId: number) => {
        if (!driver?.id) return;
        
        console.log('Completing task:', taskId);
        const result = await completeTask(driver.id, taskId);
        if (!result.success && result.error) {
            console.error('Failed to complete task:', result.error);
        } else {
            console.log('Task completed successfully, refreshing tasks...');
            // Force refresh tasks after completion
            setTimeout(() => {
                fetchTasks(driver.id);
            }, 1000);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <View style={styles.userInfo}>
                    <TouchableOpacity
                        style={styles.avatarContainer}
                        onPress={() => navigation.navigate('Profile')}
                    >
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>{initials}</Text>
                        </View>
                        <View style={styles.onlineStatus} />
                    </TouchableOpacity>
                    <View>
                        <Text style={styles.statusText}>{driver.isActive ? 'EN LIGNE' : 'HORS LIGNE'}</Text>
                        <Text style={styles.userName}>{driver.fullName}</Text>
                    </View>
                </View>
                <TouchableOpacity style={styles.notificationBtn} onPress={() => fetchTasks(driver.id)}>
                    {loading ? <ActivityIndicator size="small" color={COLORS.primary} /> : <Bell color={COLORS.textSecondary} size={24} />}
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.statsRow}>
                    <View style={styles.statCard}>
                        <Package color={COLORS.primary} size={24} />
                        <Text style={styles.statLabel}>Livraisons</Text>
                        <Text style={styles.statValue}>{tasks.length}</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Banknote color={COLORS.primary} size={24} />
                        <Text style={styles.statLabel}>Gains</Text>
                        <Text style={styles.statValueEarnings}>{totalEarnings.toFixed(2)} DH</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Star color={COLORS.primary} size={24} fill={COLORS.primary} />
                        <Text style={styles.statLabel}>Score</Text>
                        <Text style={styles.statValue}>{driver.rating.toFixed(1)}</Text>
                    </View>
                </View>

                <Text style={styles.sectionTitle}>{tasks.length > 0 ? 'Assigned Tasks' : 'No Tasks Assigned'}</Text>

                {currentTask ? (
                    <View style={styles.actionCard}>
                        <View style={styles.actionHeader}>
                            <View style={[styles.tagContainer, { backgroundColor: currentTask.status === 'PENDING' ? '#FFF4E5' : '#E5F9FF' }]}>
                                <Text style={[styles.tagText, { color: currentTask.status === 'PENDING' ? COLORS.secondary : COLORS.primary }]}>
                                    {currentTask.status}
                                </Text>
                            </View>
                            <Text style={styles.priceText}>{currentTask.estimatedCost ? `${currentTask.estimatedCost} MAD` : `${currentTask.weightKg}kg`}</Text>
                        </View>

                        <Text style={styles.locationTitle}>{currentTask.cityTo}</Text>

                        <View style={styles.detailsRow}>
                            <MapPin size={20} color={COLORS.textSecondary} style={{ marginRight: 10 }} />
                            <View>
                                <Text style={styles.detailLabel}>From</Text>
                                <Text style={styles.detailValue}>{currentTask.cityFrom} ({currentTask.pickupAddress})</Text>
                            </View>
                        </View>

                        <View style={styles.detailsRow}>
                            <MapPin size={20} color={COLORS.primary} style={{ marginRight: 10 }} />
                            <View>
                                <Text style={styles.detailLabel}>To</Text>
                                <Text style={styles.detailValue}>{currentTask.cityTo} ({currentTask.deliveryAddress})</Text>
                            </View>
                        </View>

                        <TouchableOpacity
                            style={[styles.acceptBtn, currentTask.status === 'DELIVERED' && { backgroundColor: '#4CAF50' }]}
                            onPress={() => {
                                if (currentTask.status === 'PENDING') {
                                    handleAcceptTask(currentTask.id);
                                } else if (currentTask.status === 'ASSIGNED') {
                                    handleCompleteTask(currentTask.id);
                                } else if (currentTask.status === 'DELIVERED') {
                                    // Navigate to success page or refresh
                                    navigation.navigate('DeliverySuccess', { taskId: currentTask.id });
                                }
                            }}
                        >
                            <Text style={styles.acceptBtnText}>
                                {currentTask.status === 'PENDING' ? 'Accept Task' : 
                                 currentTask.status === 'ASSIGNED' ? 'Complete Task' : 
                                 'View Details'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.emptyTasks}>
                        <MapIcon size={48} color={COLORS.border} />
                        <Text style={styles.emptyTasksText}>All caught up! Wait for new assignments.</Text>
                    </View>
                )}

                {tasks.length > 1 && (
                    <>
                        <View style={styles.otherRequestsHeader}>
                            <Text style={styles.sectionTitleSmall}>History / Other Tasks</Text>
                        </View>

                        {tasks.filter(t => t.id !== currentTask?.id).slice(0, 3).map(task => (
                            <TouchableOpacity key={task.id} style={styles.secondaryCard} onPress={() => navigation.navigate('Scanner', { taskId: task.id })}>
                                <View style={styles.secondaryDetails}>
                                    <View style={[styles.statusDot, { backgroundColor: task.status === 'DELIVERED' ? '#4CAF50' : COLORS.primary }]} />
                                    <View>
                                        <Text style={styles.secondaryLocation}>{task.cityTo}</Text>
                                        <Text style={styles.secondaryDistance}>{task.status} • {task.estimatedCost ? `${task.estimatedCost} MAD` : `${task.weightKg}kg`}</Text>
                                    </View>
                                </View>
                                <Calendar size={18} color={COLORS.textSecondary} />
                            </TouchableOpacity>
                        ))}
                    </>
                )}

                <View style={{ height: 80 }} />
            </ScrollView>

            <View style={styles.bottomNav}>
                <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Dashboard')}>
                    <Home color={COLORS.primary} size={24} />
                    <Text style={[styles.navText, { color: COLORS.primary }]}>Home</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Scanner')}>
                    <ClipboardList color={COLORS.textSecondary} size={24} />
                    <Text style={[styles.navText, { color: COLORS.textSecondary }]}>My Tasks</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Profile')}>
                    <User color={COLORS.textSecondary} size={24} />
                    <Text style={[styles.navText, { color: COLORS.textSecondary }]}>Profile</Text>
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
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: SIZES.padding,
        paddingTop: 10,
        paddingBottom: 20,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarContainer: {
        marginRight: 12,
        position: 'relative',
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: '700',
    },
    onlineStatus: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: COLORS.primary,
        position: 'absolute',
        bottom: 0,
        right: 0,
        borderWidth: 2,
        borderColor: COLORS.background,
    },
    statusText: {
        ...FONTS.small,
        color: COLORS.primary,
        fontWeight: '700',
        marginBottom: 2,
    },
    userName: {
        ...FONTS.small,
        color: COLORS.text,
        fontWeight: '600',
        maxWidth: 200,
    },
    notificationBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: COLORS.white,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.border,
        position: 'relative',
    },
    notificationBadge: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: COLORS.primary,
        position: 'absolute',
        top: 12,
        right: 12,
    },
    scrollContent: {
        paddingHorizontal: SIZES.padding,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 24,
    },
    statCard: {
        backgroundColor: COLORS.white,
        borderRadius: SIZES.radius,
        padding: 16,
        alignItems: 'center',
        width: '31%',
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    statLabel: {
        ...FONTS.small,
        color: COLORS.textSecondary,
        marginTop: 8,
        marginBottom: 4,
    },
    statValue: {
        ...FONTS.h3,
        color: COLORS.text,
    },
    statValueEarnings: {
        ...FONTS.h3,
        color: COLORS.text,
        fontSize: 18,
    },
    sectionTitle: {
        ...FONTS.h2,
        color: COLORS.text,
        marginBottom: 16,
    },
    mapContainer: {
        height: 160,
        borderRadius: SIZES.radiusL,
        backgroundColor: COLORS.white,
        overflow: 'hidden',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    actionCard: {
        backgroundColor: COLORS.white,
        borderRadius: SIZES.radiusL,
        padding: 20,
        borderWidth: 1,
        borderColor: COLORS.border,
        marginBottom: 24,
    },
    actionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    tagContainer: {
        backgroundColor: '#FFF4E5',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 4,
    },
    tagText: {
        ...FONTS.small,
        color: COLORS.secondary,
        fontWeight: '700',
    },
    priceText: {
        ...FONTS.h2,
        color: COLORS.primary,
    },
    locationTitle: {
        ...FONTS.h1,
        color: COLORS.text,
        marginBottom: 20,
        fontSize: 22,
    },
    detailsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    detailLabel: {
        ...FONTS.small,
        color: COLORS.textSecondary,
        marginBottom: 2,
    },
    detailValue: {
        ...FONTS.body1,
        color: COLORS.text,
        fontWeight: '500',
    },
    acceptBtn: {
        backgroundColor: COLORS.primary,
        borderRadius: SIZES.radius,
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: 10,
    },
    acceptBtnText: {
        ...FONTS.h3,
        color: COLORS.white,
    },
    otherRequestsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    sectionTitleSmall: {
        ...FONTS.body1,
        fontWeight: '600',
        color: COLORS.text,
    },
    viewAllText: {
        ...FONTS.body2,
        color: COLORS.primary,
        fontWeight: '500',
    },
    secondaryCard: {
        backgroundColor: COLORS.white,
        borderRadius: SIZES.radius,
        padding: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    secondaryDetails: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    secondaryLocation: {
        ...FONTS.body1,
        color: COLORS.text,
        fontWeight: '500',
        marginBottom: 2,
    },
    secondaryDistance: {
        ...FONTS.small,
        color: COLORS.textSecondary,
    },
    bottomNav: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: COLORS.white,
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: 16,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    navItem: {
        alignItems: 'center',
    },
    mapOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    mapOverlayText: {
        ...FONTS.body2,
        color: COLORS.white,
        backgroundColor: 'rgba(0,0,0,0.5)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        fontWeight: '600',
    },
    navText: {
        ...FONTS.small,
        color: COLORS.textSecondary,
        marginTop: 6,
    },
    emptyTasks: {
        backgroundColor: COLORS.white,
        borderRadius: SIZES.radiusL,
        padding: 40,
        borderWidth: 1,
        borderColor: COLORS.border,
        alignItems: 'center',
        marginBottom: 24,
    },
    emptyTasksText: {
        ...FONTS.body1,
        color: COLORS.textSecondary,
        textAlign: 'center',
        marginTop: 12,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 8,
    }
});
