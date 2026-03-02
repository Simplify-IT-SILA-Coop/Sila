import React, { useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    Animated,
    Dimensions,
    StatusBar,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Rect, Circle, Polygon, Text as SvgText, Path } from 'react-native-svg';
import { useAuthStore } from '../store/useAuthStore';

const { width } = Dimensions.get('window');

const COLORS = {
    bg: '#F5F3EE',
    white: '#FFFFFF',
    text: '#1A1A1A',
    muted: '#7A7A7A',
    border: '#E2DED8',
    green: '#4CAF50',
    coral: '#E8734A',
    sunset1: '#FDB97D',
    sunset2: '#F0822A',
    sunset3: '#C0522A',
};

const FONTS = {
    h1: { fontFamily: 'System', fontSize: 26, fontWeight: '800' as const },
    h3: { fontFamily: 'System', fontSize: 16, fontWeight: '600' as const },
    body: { fontFamily: 'System', fontSize: 13.5 },
    label: { fontFamily: 'System', fontSize: 10, fontWeight: '600' as const, letterSpacing: 1.2 },
    brand: { fontFamily: 'System', fontSize: 18, fontWeight: '800' as const },
    phone: { fontFamily: 'System', fontSize: 15, fontWeight: '600' as const },
};

function TruckScene() {
    const driveAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(driveAnim, { toValue: 8, duration: 300, useNativeDriver: true }),
                Animated.timing(driveAnim, { toValue: -8, duration: 300, useNativeDriver: true }),
            ])
        ).start();
    }, []);

    return (
        <View style={styles.truckScene}>
            <View style={[StyleSheet.absoluteFill, { backgroundColor: COLORS.sunset1 }]} />
            <View style={[StyleSheet.absoluteFill, { backgroundColor: COLORS.sunset2, opacity: 0.6 }]} />

            <View style={styles.sun} />

            <Animated.View style={[styles.truckWrapper, { transform: [{ translateY: driveAnim }] }]}>
                <Svg width={260} height={80} viewBox="0 0 260 80">
                    <Rect x="0" y="5" width="170" height="55" rx="4" fill="#EEEEEE" />
                    <Rect x="2" y="7" width="166" height="51" rx="3" fill="#F8F8F8" />
                    <Rect x="2" y="22" width="166" height="16" fill={COLORS.green} opacity="0.2" />
                    <SvgText x="85" y="34" textAnchor="middle" fontSize="9" fontWeight="bold" fill={COLORS.green} opacity="0.8">
                        SILA LOGISTICS
                    </SvgText>
                    <Rect x="170" y="18" width="78" height="42" rx="4" fill="#DDDDDD" />
                    <Rect x="212" y="24" width="28" height="20" rx="3" fill="#88CCEE" opacity="0.85" />
                    <Rect x="244" y="32" width="8" height="10" rx="2" fill="#FFE566" />
                    <Circle cx="38" cy="66" r="12" fill="#333333" />
                    <Circle cx="38" cy="66" r="5" fill="#666666" />
                    <Circle cx="118" cy="66" r="12" fill="#333333" />
                    <Circle cx="118" cy="66" r="5" fill="#666666" />
                    <Circle cx="218" cy="66" r="12" fill="#333333" />
                    <Circle cx="218" cy="66" r="5" fill="#666666" />
                </Svg>
            </Animated.View>

            <View style={styles.road}>
                <View style={styles.roadLine} />
            </View>
        </View>
    );
}

function TruckIcon() {
    return (
        <Svg width={28} height={28} viewBox="0 0 24 24" fill="white">
            <Path d="M1 3h15v13H1zM16 8h4l3 3v5h-7V8zM5.5 19a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zm13 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z" />
        </Svg>
    );
}

export default function LoginScreen({ navigation }: any) {
    const [phone, setPhone] = React.useState('');
    const [loading, setLoading] = React.useState(false);
    const login = useAuthStore((state) => state.login);

    const anim0 = useRef(new Animated.Value(0)).current;
    const anim1 = useRef(new Animated.Value(0)).current;
    const anim2 = useRef(new Animated.Value(0)).current;
    const anim3 = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const makeAnim = (val: Animated.Value, delay: number) =>
            Animated.timing(val, { toValue: 1, duration: 500, delay, useNativeDriver: true });

        Animated.stagger(100, [
            makeAnim(anim0, 0),
            makeAnim(anim1, 100),
            makeAnim(anim2, 200),
            makeAnim(anim3, 300),
        ]).start();
    }, []);

    const handleLogin = async () => {
        if (phone.length < 10) return;
        setLoading(true);
        const result = await login(phone);
        setLoading(false);

        if (!result.success) {
            Alert.alert('Login Failed', result.error);
        }
    };

    const slide = (anim: Animated.Value, dir: 'up' | 'down' = 'up') => ({
        opacity: anim,
        transform: [
            {
                translateY: anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [dir === 'up' ? 20 : -20, 0],
                }),
            },
        ],
    });

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView
                    contentContainerStyle={styles.content}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >

                    <Animated.View style={[styles.logoSection, slide(anim0, 'down')]}>
                        <View style={styles.iconBadge}>
                            <TruckIcon />
                        </View>
                        <Text style={styles.brandName}>Sila-Logistics</Text>
                    </Animated.View>

                    <Animated.View style={[styles.heroContainer, slide(anim1)]}>
                        <TruckScene />
                    </Animated.View>

                    {/* ── Welcome / Headers ── */}
                    <Animated.View style={[styles.welcomeSection, slide(anim2)]}>
                        <Text style={styles.welcomeTitle}>Welcome, Driver</Text>
                        <Text style={styles.welcomeSubtitle}>
                            Enter your 10-digit phone number to start your shift.
                        </Text>
                    </Animated.View>

                    <Animated.View style={[styles.formSection, slide(anim3)]}>
                        <Text style={styles.inputLabel}>PHONE NUMBER</Text>
                        <View style={styles.inputRow}>
                            <Text style={styles.flag}>🇲🇦</Text>
                            <Text style={styles.countryCode}>+212</Text>
                            <View style={styles.divider} />
                            <TextInput
                                style={styles.input}
                                placeholder="06XXXXXXXX"
                                placeholderTextColor="#BBBBBB"
                                keyboardType="phone-pad"
                                value={phone}
                                onChangeText={setPhone}
                                maxLength={10}
                            />
                        </View>

                        <TouchableOpacity
                            style={[styles.btnOtp, (phone.length < 10 || loading) && { opacity: 0.6 }]}
                            activeOpacity={0.85}
                            onPress={handleLogin}
                            disabled={phone.length < 10 || loading}
                        >
                            {loading ? (
                                <ActivityIndicator color={COLORS.white} />
                            ) : (
                                <Text style={styles.btnOtpText}>Login & Continue  →</Text>
                            )}
                        </TouchableOpacity>

                        <View style={styles.supportRow}>
                            <Text style={styles.supportText}>Need help?  </Text>
                            <TouchableOpacity>
                                <Text style={styles.supportLink}>Contact Support</Text>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>

                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.bg,
    },
    content: {
        flexGrow: 1,
        paddingHorizontal: 24,
        paddingBottom: 32,
        alignItems: 'center',
        justifyContent: 'space-between',
    },

    // Logo
    logoSection: {
        alignItems: 'center',
        marginTop: 20,
        gap: 10,
    },
    iconBadge: {
        width: 56,
        height: 56,
        backgroundColor: COLORS.green,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: COLORS.green,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 8,
    },
    brandName: {
        ...FONTS.brand,
        color: COLORS.text,
        letterSpacing: -0.3,
    },

    // Hero
    heroContainer: {
        width: '100%',
        height: 175,
        borderRadius: 14,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 20,
        elevation: 6,
    },
    truckScene: {
        flex: 1,
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'flex-end',
    },
    sun: {
        position: 'absolute',
        top: 18,
        right: 28,
        width: 48,
        height: 48,
        backgroundColor: '#FFE566',
        borderRadius: 24,
        shadowColor: '#FFE566',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.9,
        shadowRadius: 20,
        elevation: 4,
    },
    truckWrapper: {
        position: 'absolute',
        bottom: 32,
    },
    road: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 32,
        backgroundColor: '#555555',
        justifyContent: 'center',
    },
    roadLine: {
        height: 3,
        backgroundColor: 'rgba(255,255,255,0.35)',
        marginHorizontal: 0,
    },

    // Welcome
    welcomeSection: {
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    welcomeTitle: {
        ...FONTS.h1,
        color: COLORS.text,
        marginBottom: 6,
    },
    welcomeSubtitle: {
        ...FONTS.body,
        color: COLORS.muted,
        textAlign: 'center',
        lineHeight: 20,
    },

    // Form
    formSection: {
        width: '100%',
    },
    inputLabel: {
        ...FONTS.label,
        color: COLORS.muted,
        textTransform: 'uppercase',
        marginBottom: 8,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: COLORS.border,
        borderRadius: 14,
        backgroundColor: COLORS.white,
        height: 52,
        paddingHorizontal: 16,
        marginBottom: 20,
        gap: 8,
    },
    flag: {
        fontSize: 18,
    },
    countryCode: {
        ...FONTS.phone,
        color: COLORS.text,
    },
    divider: {
        width: 1.5,
        height: 22,
        backgroundColor: COLORS.border,
        marginHorizontal: 4,
    },
    input: {
        flex: 1,
        fontSize: 15,
        color: COLORS.text,
        height: '100%',
    },
    btnOtp: {
        width: '100%',
        height: 54,
        backgroundColor: COLORS.coral,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
        shadowColor: COLORS.coral,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 8,
    },
    btnOtpText: {
        ...FONTS.h3,
        color: COLORS.white,
        letterSpacing: 0.3,
    },
    supportRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    supportText: {
        fontSize: 13,
        color: COLORS.muted,
    },
    supportLink: {
        fontSize: 13,
        color: COLORS.coral,
        fontWeight: '500',
    },
});