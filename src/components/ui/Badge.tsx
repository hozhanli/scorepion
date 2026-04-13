/**
 * Badge — Reusable component
 *
 * A flexible pill/badge used for statuses, tags, tiers, and labels.
 * Covers: live badge, daily-pick badge, NEW badge, tier badge, league tag.
 *
 * Single Responsibility: all badge rendering is defined here.
 * Open/Closed: extend via `variant` without touching usage sites.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors, { radii } from '@/constants/colors';

interface Props {
    label: string;
    color: string;
    /** Fill the background with the color (default: subtle tint) */
    solid?: boolean;
    icon?: keyof typeof Ionicons.glyphMap;
    iconSize?: number;
    style?: object;
    textStyle?: object;
}

export function Badge({ label, color, solid = false, icon, iconSize = 10, style, textStyle }: Props) {
    const bg = solid ? color : `${color}20`;
    const textColor = solid ? '#fff' : color;

    return (
        <View style={[styles.pill, { backgroundColor: bg }, style]}>
            {icon && <Ionicons name={icon} size={iconSize} color={textColor} />}
            <Text style={[styles.label, { color: textColor }, textStyle]}>{label}</Text>
        </View>
    );
}

/** Convenience: animated "LIVE" badge */
export function LiveBadge({ minute }: { minute?: number | null }) {
    return (
        <Badge
            label={minute ? `${minute}' LIVE` : 'LIVE'}
            color={Colors.palette.red}
            icon="radio-button-on"
            iconSize={8}
            style={styles.live}
            textStyle={styles.liveText}
        />
    );
}

const styles = StyleSheet.create({
    pill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: radii.xs,
        alignSelf: 'flex-start',
    },
    label: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
    live: {
        backgroundColor: 'rgba(255,59,92,0.18)',
        borderRadius: radii.sm,
        paddingHorizontal: 10,
        paddingVertical: 5,
    },
    liveText: { fontSize: 12, fontFamily: 'Inter_700Bold' },
});
