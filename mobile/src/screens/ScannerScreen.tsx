import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Button } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, HelpCircle, Flashlight, Camera, Keyboard, Home, ClipboardList, User } from 'lucide-react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { COLORS, SIZES, FONTS } from '../theme';

export default function ScannerScreen({ navigation, route }: any) {
    const { taskId } = route.params || {};
    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);
    const [facing, setFacing] = useState<'back' | 'front'>('back');
    const [torch, setTorch] = useState(false);

    if (!permission) {
        return <View />;
    }

    if (!permission.granted) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.permissionContainer}>
                    <Text style={styles.permissionText}>We need your permission to show the camera</Text>
                    <TouchableOpacity style={styles.primaryButton} onPress={requestPermission}>
                        <Text style={styles.primaryButtonText}>Grant Permission</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    const handleBarcodeScanned = ({ type, data }: any) => {
        if (!scanned) {
            setScanned(true);
            console.log(`Bar code with type ${type} and data ${data} has been scanned!`);
            navigation.navigate('ParcelPickup', { taskId: taskId || data });
            setTimeout(() => setScanned(false), 2000);
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
                    <ChevronLeft color={COLORS.text} size={24} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Scan {taskId ? 'Specific' : 'Any'} Parcel</Text>
                <TouchableOpacity style={styles.iconBtn}>
                    <HelpCircle color={COLORS.textSecondary} size={24} />
                </TouchableOpacity>
            </View>

            <View style={styles.scannerContainer}>
                <View style={styles.scannerViewport}>
                    <CameraView
                        style={StyleSheet.absoluteFillObject}
                        facing={facing}
                        enableTorch={torch}
                        onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
                        barcodeScannerSettings={{
                            barcodeTypes: ['qr'],
                        }}
                    />
                    <View style={styles.scannerFrame} pointerEvents="none">
                        <View style={[styles.corner, styles.topLeft]} />
                        <View style={[styles.corner, styles.topRight]} />
                        <View style={[styles.corner, styles.bottomLeft]} />
                        <View style={[styles.corner, styles.bottomRight]} />
                        <View style={styles.scanLine} />
                    </View>
                </View>
                <Text style={styles.instructionText}>Align QR code within the frame</Text>
            </View>

            <View style={styles.controlsContainer}>
                <View style={styles.controlItem}>
                    <TouchableOpacity
                        style={[styles.controlBtn, torch && { backgroundColor: COLORS.primary }]}
                        onPress={() => setTorch(!torch)}
                    >
                        <Flashlight color={torch ? COLORS.white : COLORS.textSecondary} size={24} />
                    </TouchableOpacity>
                    <Text style={styles.controlText}>Toggle flash</Text>
                </View>

                <View style={styles.controlItem}>
                    <TouchableOpacity style={styles.captureBtn} onPress={() => navigation.navigate('ParcelPickup', { taskId })}>
                        <Camera color={COLORS.white} size={30} />
                    </TouchableOpacity>
                    <Text style={styles.controlText}>Capture</Text>
                </View>

                <View style={styles.controlItem}>
                    <TouchableOpacity style={styles.controlBtn} onPress={() => setFacing(facing === 'back' ? 'front' : 'back')}>
                        <User color={COLORS.textSecondary} size={24} />
                    </TouchableOpacity>
                    <Text style={styles.controlText}>Flip Camera</Text>
                </View>
            </View>

            <View style={styles.statusCard}>
                <View style={styles.statusIconContainer}>
                    <ClipboardList color={COLORS.primary} size={24} />
                </View>
                <View>
                    <Text style={styles.statusTitle}>{taskId ? 'TARGET SCAN' : 'READY TO SCAN'}</Text>
                    <Text style={styles.statusSubtitle}>{taskId ? `Task #${taskId}` : 'Waiting for parcel...'}</Text>
                </View>
            </View>

            <View style={styles.bottomNav}>
                <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Dashboard')}>
                    <Home color={COLORS.textSecondary} size={24} />
                    <Text style={[styles.navText, { color: COLORS.textSecondary }]}>Home</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Scanner')}>
                    <ClipboardList color={COLORS.primary} size={24} />
                    <Text style={[styles.navText, { color: COLORS.primary }]}>My Tasks</Text>
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
    scannerContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: SIZES.padding,
    },
    scannerViewport: {
        width: '100%',
        aspectRatio: 1,
        backgroundColor: '#000000',
        borderRadius: SIZES.radiusL,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    scannerFrame: {
        width: '70%',
        aspectRatio: 1,
        position: 'relative',
    },
    corner: {
        position: 'absolute',
        width: 40,
        height: 40,
        borderColor: COLORS.primary,
    },
    topLeft: {
        top: 0,
        left: 0,
        borderTopWidth: 4,
        borderLeftWidth: 4,
        borderTopLeftRadius: 16,
    },
    topRight: {
        top: 0,
        right: 0,
        borderTopWidth: 4,
        borderRightWidth: 4,
        borderTopRightRadius: 16,
    },
    bottomLeft: {
        bottom: 0,
        left: 0,
        borderBottomWidth: 4,
        borderLeftWidth: 4,
        borderBottomLeftRadius: 16,
    },
    bottomRight: {
        bottom: 0,
        right: 0,
        borderBottomWidth: 4,
        borderRightWidth: 4,
        borderBottomRightRadius: 16,
    },
    scanLine: {
        width: '100%',
        height: 2,
        backgroundColor: COLORS.primary,
        position: 'absolute',
        top: '50%',
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 10,
        elevation: 5,
    },
    instructionText: {
        ...FONTS.body1,
        color: COLORS.text,
        fontWeight: '500',
    },
    controlsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        alignItems: 'flex-end',
        paddingHorizontal: SIZES.padding,
        marginBottom: 30,
    },
    controlItem: {
        alignItems: 'center',
    },
    controlBtn: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: COLORS.white,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.border,
        marginBottom: 8,
    },
    captureBtn: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
        borderWidth: 4,
        borderColor: COLORS.success,
    },
    controlText: {
        ...FONTS.small,
        color: COLORS.textSecondary,
    },
    statusCard: {
        backgroundColor: COLORS.white,
        marginHorizontal: SIZES.padding,
        padding: 16,
        borderRadius: SIZES.radius,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.border,
        marginBottom: 80,
    },
    statusIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 8,
        backgroundColor: COLORS.success,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    statusTitle: {
        ...FONTS.small,
        color: COLORS.primary,
        fontWeight: '700',
        marginBottom: 2,
    },
    statusSubtitle: {
        ...FONTS.body2,
        color: COLORS.text,
    },
    permissionContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    permissionText: {
        ...FONTS.body1,
        textAlign: 'center',
        marginBottom: 20,
        color: COLORS.text,
    },
    primaryButton: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: SIZES.radius,
    },
    primaryButtonText: {
        ...FONTS.h3,
        color: COLORS.white,
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
    navText: {
        ...FONTS.small,
        color: COLORS.textSecondary,
        marginTop: 6,
    }
});
