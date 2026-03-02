import { DefaultTheme } from '@react-navigation/native';

export const COLORS = {
    primary: '#6FCB2F',
    primaryDark: '#5CB026',
    secondary: '#E56D53',
    background: '#F8FBFA',
    white: '#FFFFFF',
    text: '#1C2127',
    textSecondary: '#7A8492',
    border: '#E8ECF1',
    success: '#E8F5E9',
    card: '#FFFFFF',
};

export const SIZES = {
    padding: 20,
    radius: 16,
    radiusL: 24,
    radiusS: 8,
};

export const FONTS = {
    h1: { fontSize: 24, fontWeight: '700' as const },
    h2: { fontSize: 20, fontWeight: '600' as const },
    h3: { fontSize: 16, fontWeight: '600' as const },
    body1: { fontSize: 16, fontWeight: '400' as const },
    body2: { fontSize: 14, fontWeight: '400' as const },
    small: { fontSize: 12, fontWeight: '400' as const },
};

export const AppTheme = {
    ...DefaultTheme,
    colors: {
        ...DefaultTheme.colors,
        primary: COLORS.primary,
        background: COLORS.background,
        card: COLORS.card,
        text: COLORS.text,
        border: COLORS.border,
    },
};
