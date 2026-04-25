/**
 * TeamAccent — standardized team color visual treatment wrapper
 *
 * Use this component to consistently apply team colors across the app.
 * Examples:
 *   - Events rows: <TeamAccent variant="border" side="left" color={team.color}>
 *   - H2H rows: <TeamAccent variant="tint" color={team.color}>
 *   - Top scorer rows: <TeamAccent variant="dot" color={team.color}>
 *   - Match hero sections: <TeamAccent variant="bar" side="top" color={team.color}>
 *   - Team cards: <TeamAccent variant="border" side="left" color={team.color}>
 */

import React from "react";
import { View, ViewStyle } from "react-native";

export interface TeamAccentProps {
  /** Team color as hex or CSS color value */
  color: string;
  /** Visual variant: border, tint, dot, or bar */
  variant?: "border" | "tint" | "dot" | "bar";
  /** Position of border or bar (default "left" for border, "top" for bar) */
  side?: "left" | "right" | "top" | "bottom";
  /** Child component(s) to wrap */
  children: React.ReactNode;
  /** Optional additional styles */
  style?: ViewStyle;
}

export function TeamAccent({
  color,
  variant = "border",
  side = variant === "bar" ? "top" : "left",
  children,
  style,
}: TeamAccentProps) {
  // If no color or unknown variant, render children directly
  if (!color || !["border", "tint", "dot", "bar"].includes(variant)) {
    return <>{children}</>;
  }

  if (variant === "border") {
    const borderStyle: ViewStyle = {
      [side === "left"
        ? "borderLeftWidth"
        : side === "right"
          ? "borderRightWidth"
          : side === "top"
            ? "borderTopWidth"
            : "borderBottomWidth"]: 4,
      [side === "left"
        ? "borderLeftColor"
        : side === "right"
          ? "borderRightColor"
          : side === "top"
            ? "borderTopColor"
            : "borderBottomColor"]: color,
    };
    return <View style={[borderStyle, style]}>{children}</View>;
  }

  if (variant === "tint") {
    return (
      <View
        style={[
          {
            backgroundColor: color,
            opacity: 0.08,
          },
          style,
        ]}
      >
        {children}
      </View>
    );
  }

  if (variant === "dot") {
    return (
      <View style={[{ flexDirection: "row", alignItems: "center", gap: 8 }, style]}>
        <View
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: color,
            flexShrink: 0,
          }}
        />
        {children}
      </View>
    );
  }

  if (variant === "bar") {
    const barStyle: ViewStyle =
      side === "top"
        ? { borderTopWidth: 6, borderTopColor: color }
        : side === "bottom"
          ? { borderBottomWidth: 6, borderBottomColor: color }
          : { borderTopWidth: 6, borderTopColor: color };

    return <View style={[barStyle, style]}>{children}</View>;
  }

  return <>{children}</>;
}
