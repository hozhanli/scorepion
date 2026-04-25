/**
 * FilterSegmented — Canonical segmented filter control.
 *
 * Replaces the ad-hoc "floating pill" filter row that appears on Matches,
 * Leaderboard, Groups, and Match Detail inner tabs. One container, one
 * active pill that slides between positions — iOS-native feel.
 *
 *   [ container: surface/2, radius 14, padding 4 ]
 *   [ ...items: transparent + gray text (inactive), emerald pill + white text (active) ]
 *
 * Active pill spring-slides between positions using an animated transform.
 * Each tap fires haptics.selection().
 */
import React, { useState, useCallback } from "react";
import { View, Text, StyleSheet, LayoutChangeEvent, Platform } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  useReducedMotion,
} from "react-native-reanimated";
import { accent, radii, type } from "@/constants/colors";
import { useTheme } from "@/contexts/ThemeContext";
import { springs, haptics } from "@/lib/motion";
import { PressableScale } from "./PressableScale";

export interface FilterSegmentedItem<V extends string = string> {
  value: V;
  label: string | React.ReactNode;
  count?: number;
}

export interface FilterSegmentedProps<V extends string = string> {
  items: FilterSegmentedItem<V>[];
  value: V;
  onChange: (value: V) => void;
}

export function FilterSegmented<V extends string = string>({
  items,
  value,
  onChange,
}: FilterSegmentedProps<V>) {
  const { surface, textRole } = useTheme();
  const [layouts, setLayouts] = useState<Record<number, { x: number; width: number }>>({});

  const activeIndex = items.findIndex((it) => it.value === value);
  const pillX = useSharedValue(0);
  const pillW = useSharedValue(0);
  const reduceMotion = useReducedMotion();

  const handleItemLayout = useCallback(
    (index: number) => (e: LayoutChangeEvent) => {
      const { x, width } = e.nativeEvent.layout;
      setLayouts((prev) => ({ ...prev, [index]: { x, width } }));
      if (index === activeIndex) {
        pillX.value = x;
        pillW.value = width;
      }
    },
    [activeIndex, pillX, pillW],
  );

  React.useEffect(() => {
    const layout = layouts[activeIndex];
    if (!layout) return;
    if (reduceMotion) {
      // Skip animation when reduced motion is on
      pillX.value = layout.x;
      pillW.value = layout.width;
    } else {
      pillX.value = withSpring(layout.x, springs.snappy);
      pillW.value = withSpring(layout.width, springs.snappy);
    }
  }, [activeIndex, layouts, pillX, pillW, reduceMotion]);

  const pillStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: pillX.value }],
    width: pillW.value,
  }));

  const handlePress = (v: V) => {
    if (Platform.OS !== "web") haptics.selection?.().catch(() => {});
    onChange(v);
  };

  return (
    <View style={[styles.container, { backgroundColor: surface[2] }]}>
      <Animated.View
        style={[styles.pill, { backgroundColor: accent.primary }, pillStyle]}
        pointerEvents="none"
      />
      {items.map((item, i) => {
        const active = item.value === value;
        return (
          <PressableScale
            key={String(item.value)}
            haptic="none"
            pressedScale={0.98}
            onPress={() => handlePress(item.value)}
            onLayout={handleItemLayout(i)}
            style={styles.item}
            // Use "tab" (correct ARIA semantic for segmented-control items)
            // rather than "button" so react-native-web renders <div role="tab">,
            // not a native <button>. This also lets us safely nest interactive
            // children like <HelpTip> inside tab labels — <button> inside
            // <button> is an HTML spec violation.
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
          >
            {typeof item.label === "string" ? (
              <Text
                style={[
                  styles.label,
                  { color: textRole.secondary },
                  active && [styles.labelActive, { color: "#FFFFFF" }],
                ]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.75}
              >
                {item.label}
                {typeof item.count === "number" ? (
                  <Text
                    style={[
                      styles.count,
                      { color: textRole.tertiary },
                      active && [styles.countActive, { color: "rgba(255, 255, 255, 0.78)" }],
                    ]}
                  >
                    {" "}
                    {item.count}
                  </Text>
                ) : null}
              </Text>
            ) : (
              item.label
            )}
          </PressableScale>
        );
      })}
    </View>
  );
}

const CONTAINER_PAD = 4;
const ITEM_H = 34;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: radii.md,
    padding: CONTAINER_PAD,
    gap: 0,
    position: "relative",
  },
  pill: {
    position: "absolute",
    top: CONTAINER_PAD,
    left: CONTAINER_PAD,
    height: ITEM_H,
    borderRadius: radii.sm - 2,
  },
  item: {
    flex: 1,
    height: ITEM_H,
    paddingHorizontal: 6,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.sm - 2,
  },
  label: {
    fontSize: type.caption.size,
    fontFamily: type.caption.family,
    letterSpacing: 0,
  },
  labelActive: {
    fontFamily: "Inter_600SemiBold",
  },
  count: {
    fontSize: type.micro.size,
  },
  countActive: {},
});
