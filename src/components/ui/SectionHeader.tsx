/**
 * SectionHeader — Reusable section heading component.
 * Two variants:
 *  - default: icon + title (used inside cards / content sections)
 *  - accent: left-border accent bar + title (used at screen level)
 */
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import Colors, { radii } from '@/constants/colors';

interface Props {
    icon?: keyof typeof Ionicons.glyphMap;
    iconColor?: string;
    title: string;
    subtitle?: string;
    /** Variant: 'default' uses icon circle, 'accent' uses left border bar */
    variant?: 'default' | 'accent';
    accentColor?: string;
    right?: React.ReactNode;
    onRightPress?: () => void;
    rightAccessibilityLabel?: string;
    style?: object;
}

export function SectionHeader({
    icon,
    iconColor = Colors.palette.emerald,
    title,
    subtitle,
    variant = 'default',
    accentColor,
    right,
    onRightPress,
    rightAccessibilityLabel = 'See all',
    style,
}: Props) {
    const { colors } = useTheme();
    const ac = accentColor || iconColor || Colors.palette.emerald;

    if (variant === 'accent') {
        return (
            <View style={[accentStyles.row, style]}>
                <View style={[accentStyles.bar, { backgroundColor: ac }]} />
                <View style={{ flex: 1 }}>
                    <Text style={[accentStyles.title, { color: colors.text }]}>{title}</Text>
                    {subtitle && <Text style={[accentStyles.subtitle, { color: colors.textTertiary }]}>{subtitle}</Text>}
                </View>
                {right && (
                    onRightPress
                        ? <Pressable onPress={onRightPress} hitSlop={8} accessibilityLabel={rightAccessibilityLabel} accessibilityRole="button">{right}</Pressable>
                        : <View>{right}</View>
                )}
            </View>
        );
    }

    return (
        <View style={[styles.row, style]}>
            {icon && (
                <View style={[styles.iconWrap, { backgroundColor: `${iconColor}18` }]}>
                    <Ionicons name={icon} size={16} color={iconColor} />
                </View>
            )}
            <View style={{ flex: 1 }}>
                <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
                {subtitle && <Text style={[styles.subtitle, { color: colors.textTertiary }]}>{subtitle}</Text>}
            </View>
            {right && (
                onRightPress
                    ? <Pressable onPress={onRightPress} hitSlop={8} accessibilityLabel={rightAccessibilityLabel} accessibilityRole="button">{right}</Pressable>
                    : <View>{right}</View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
    iconWrap: { width: 30, height: 30, borderRadius: radii.xs, alignItems: 'center', justifyContent: 'center' },
    title: { flex: 1, fontSize: 16, fontFamily: 'Inter_700Bold' },
    subtitle: { fontSize: 13, fontFamily: 'Inter_400Regular', marginTop: 1 },
});

const accentStyles = StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
    bar: { width: 3, height: 18, borderRadius: radii.xs / 4 },
    title: { fontSize: 17, fontFamily: 'Inter_700Bold' },
    subtitle: { fontSize: 13, fontFamily: 'Inter_400Regular', marginTop: 1 },
});
