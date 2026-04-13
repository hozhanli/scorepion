/**
 * EmptyState — Reusable component
 *
 * Standardises empty/zero-state UI across the app.
 * Replaces ad-hoc View+Ionicons+Text layouts in Groups, Leaderboard,
 * Profile activity, Achievements, etc.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import Colors, { radii } from '@/constants/colors';

interface Props {
    icon: keyof typeof Ionicons.glyphMap;
    iconColor?: string;
    title: string;
    subtitle?: string;
    /** Optional bottom slot for a CTA button */
    action?: React.ReactNode;
}

export function EmptyState({ icon, iconColor = Colors.palette.gray300, title, subtitle, action }: Props) {
    const { colors } = useTheme();

    return (
        <View style={[styles.container, { backgroundColor: colors.card }]}>
            <View style={[styles.iconWrap, { backgroundColor: `${iconColor}15` }]}>
                <Ionicons name={icon} size={32} color={iconColor} />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
            {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
            {action && <View style={styles.action}>{action}</View>}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        borderRadius: radii.lg,
        alignItems: 'center',
        paddingVertical: 36,
        paddingHorizontal: 24,
        gap: 8,
    },
    iconWrap: {
        width: 64,
        height: 64,
        borderRadius: radii.pill / 2,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 4,
    },
    title: { fontSize: 15, fontFamily: 'Inter_600SemiBold', textAlign: 'center' },
    subtitle: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.palette.gray300, textAlign: 'center' },
    action: { marginTop: 8 },
});
