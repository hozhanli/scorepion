/**
 * TeamLogo — Reusable component
 *
 * Renders a team logo image when available, with a fallback to a colored
 * circle showing the team's initial. Used everywhere teams appear.
 *
 * Props follow the contract of the Team shape coming from the API so
 * callers don't have to reshape data.
 */
import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

interface Props {
    logo?: string | null;
    name: string;
    shortName?: string;
    color: string;
    size?: number;
    /** Whether to show the short name below the logo */
    showLabel?: boolean;
    labelStyle?: object;
}

export function TeamLogo({ logo, name, shortName, color, size = 48, showLabel = false, labelStyle }: Props) {
    const initial = (shortName ?? name).charAt(0).toUpperCase();
    const fontSize = Math.round(size * 0.42);

    return (
        <View style={styles.wrapper} accessibilityLabel={name}>
            {logo ? (
                <Image
                    source={{ uri: logo }}
                    style={[styles.image, { width: size, height: size, borderRadius: size * 0.2 }]}
                    resizeMode="contain"
                />
            ) : (
                <View style={[styles.fallback, { width: size, height: size, borderRadius: size * 0.2, backgroundColor: color }]}>
                    <Text style={[styles.initial, { fontSize }]}>{initial}</Text>
                </View>
            )}
            {showLabel && (
                <Text style={[styles.label, labelStyle]} numberOfLines={1}>{shortName ?? name}</Text>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: { alignItems: 'center', gap: 4 },
    image: {},
    fallback: { alignItems: 'center', justifyContent: 'center' },
    initial: { fontFamily: 'Inter_700Bold', color: '#fff' },
    label: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: '#fff', maxWidth: 72, textAlign: 'center' },
});
