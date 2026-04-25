/**
 * HelpTip — Accessible help popover for glossary terms.
 *
 * Renders a small help-circle-outline icon (44×44 hit area) that opens
 * a popover with the term's definition on tap. Auto-dismisses on outside tap,
 * Escape, or after 8 seconds.
 *
 * Usage:
 *   <HelpTip term="h2h" />
 *   <HelpTip term="gd" iconSize={12} />
 *   <HelpTip term="boost">
 *     <Text>Double your points</Text>
 *   </HelpTip>
 */
import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  StyleSheet,
  Platform,
  Pressable,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  useReducedMotion,
} from "react-native-reanimated";
import { useTheme } from "@/contexts/ThemeContext";
import { radii, spacing, type as typeTok } from "@/constants/colors";
import { haptics } from "@/lib/motion";

// ─── Glossary constant ──────────────────────────────────────────────────────
export const GLOSSARY: Record<string, { title: string; body: string }> = {
  h2h: {
    title: "H2H",
    body: "Head-to-head — the most recent matches between these two teams, showing who's historically had the upper hand.",
  },
  gd: {
    title: "GD",
    body: "Goal difference — goals scored minus goals conceded across the season. Tiebreaker when points are equal.",
  },
  w: {
    title: "W",
    body: "Wins in the current season.",
  },
  d: {
    title: "D",
    body: "Draws in the current season.",
  },
  l: {
    title: "L",
    body: "Losses in the current season.",
  },
  p: {
    title: "P",
    body: "Matches played.",
  },
  pts: {
    title: "Points",
    body: "League points. 3 for a win, 1 for a draw, 0 for a loss.",
  },
  streak: {
    title: "Streak",
    body: "Correct predictions in a row. Breaks when you miss or skip a day. Higher streaks earn bonus weekly points.",
  },
  locked: {
    title: "Locked",
    body: "Your prediction is saved and can't change once the match starts. You can still edit beforehand.",
  },
  boost: {
    title: "Boost",
    body: "Double the points earned on one prediction per day. Only applies to exact or correct outcomes.",
  },
  dailypack: {
    title: "Daily Pack",
    body: "A curated set of today's matches from your favourite leagues. Lock them all in for a streak bonus.",
  },
  exact: {
    title: "Exact",
    body: "You nailed the exact scoreline (e.g. 2-1). Worth 10 points (or 20 with boost).",
  },
  correct: {
    title: "Correct",
    body: "You got the result right (home win / draw / away win) but not the exact score. Worth 6 points.",
  },
  missed: {
    title: "Missed",
    body: "The match went a different way than your prediction. No points — better luck next round.",
  },
  matchday: {
    title: "Matchday",
    body: "The round of fixtures. In a 20-team league like the Premier League, there are 38 matchdays in a season.",
  },
  cleansheet: {
    title: "Clean sheet",
    body: "A match where one team doesn't concede any goals. Often rewarded in fantasy scoring.",
  },
  xg: {
    title: "Expected Goals (xG)",
    body: "A tactical metric estimating the quality of chances. Higher xG = more dangerous attacks. Lower-tier plans may not show this.",
  },
  form: {
    title: "Form",
    body: "Last 5 results for a team: W (win), D (draw), L (loss). Reads left-to-right, oldest to newest.",
  },
  transferwindow: {
    title: "Transfer window",
    body: "The limited period each season when clubs can sign or release players. Summer (June–August) and winter (January) are the main windows.",
  },
};

export interface HelpTipProps {
  term: string; // e.g. "h2h" (must match a key in GLOSSARY)
  iconSize?: number; // default 14
  iconColor?: string; // default tertiary
  position?: "top" | "bottom" | "auto"; // default "auto"
  children?: React.ReactNode; // optional — if provided, wraps children + renders icon after
}

export function HelpTip({
  term,
  iconSize = 14,
  iconColor,
  position = "auto",
  children,
}: HelpTipProps) {
  const { surface, textRole, border } = useTheme();
  const entry = GLOSSARY[term];

  const [visible, setVisible] = useState(false);
  const [popoverPos, setPopoverPos] = useState({ top: 0, left: 0, width: 0 });
  const iconRef = useRef<View>(null);
  const reduceMotion = useReducedMotion();
  const windowDims = useWindowDimensions();

  const popoverScale = useSharedValue(reduceMotion ? 1 : 0.92);
  const popoverOpacity = useSharedValue(0);

  const handlePress = async () => {
    if (!entry) {
      console.warn(`[HelpTip] Unknown term: ${term}`);
      return;
    }

    // Haptic feedback
    if (Platform.OS !== "web") {
      haptics.selection?.().catch(() => {});
    }

    // Measure icon position
    if (iconRef.current) {
      iconRef.current.measure((x, y, w, h, px, py) => {
        setPopoverPos({ top: py, left: px, width: w });
        setVisible(true);
      });
    } else {
      // Fallback if measure fails
      setPopoverPos({ top: 0, left: 0, width: 0 });
      setVisible(true);
    }

    // Animate in
    if (!reduceMotion) {
      popoverScale.value = withSpring(1, { damping: 10, mass: 0.8 });
    }
    popoverOpacity.value = withSpring(1, { damping: 10, mass: 0.8 });
  };

  // Auto-dismiss after 8 seconds
  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(() => setVisible(false), 8000);
    return () => clearTimeout(timer);
  }, [visible]);

  const handleBackdropPress = () => {
    setVisible(false);
  };

  const handleKeyUp = (e: any) => {
    // Web: Escape key dismisses
    if (Platform.OS === "web" && e.key === "Escape") {
      setVisible(false);
    }
  };

  // Animated popover style
  const popoverAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: popoverScale.value }],
    opacity: popoverOpacity.value,
  }));

  if (!entry) {
    return null;
  }

  const resolvedIconColor = iconColor || textRole.tertiary;

  // Compute popover position
  const POPOVER_MAX_WIDTH = windowDims.width - 64;
  const ARROW_SIZE = 8;
  const POPOVER_PADDING = 12;
  const POPOVER_VERTICAL = 10;
  const POPOVER_GAP = 8;

  // Decide if popover should be above or below
  let shouldBeAbove = false;
  if (position === "top") {
    shouldBeAbove = true;
  } else if (position === "bottom") {
    shouldBeAbove = false;
  } else {
    // auto: show above if enough space, else below
    shouldBeAbove = popoverPos.top > 200;
  }

  const popoverTop = shouldBeAbove
    ? popoverPos.top - ARROW_SIZE - POPOVER_GAP
    : popoverPos.top + 44 + ARROW_SIZE + POPOVER_GAP;

  // Center horizontally on icon, constrain to screen
  const popoverCenterX = popoverPos.left + popoverPos.width / 2;
  let popoverLeft = popoverCenterX - POPOVER_MAX_WIDTH / 2;
  if (popoverLeft < 32) popoverLeft = 32;
  if (popoverLeft + POPOVER_MAX_WIDTH > windowDims.width - 32) {
    popoverLeft = windowDims.width - 32 - POPOVER_MAX_WIDTH;
  }

  // Arrow offset from left edge of popover
  const arrowOffsetX = popoverCenterX - popoverLeft - ARROW_SIZE / 2;

  const arrowPoints = shouldBeAbove
    ? {
        top: "calc(100% - 1px)",
        borderTopColor: surface[0],
        borderLeftColor: "transparent",
        borderRightColor: "transparent",
        borderBottomColor: "transparent",
        borderTopWidth: ARROW_SIZE,
        borderLeftWidth: ARROW_SIZE,
        borderRightWidth: ARROW_SIZE,
        borderBottomWidth: 0,
      }
    : {
        top: -ARROW_SIZE,
        borderBottomColor: surface[0],
        borderLeftColor: "transparent",
        borderRightColor: "transparent",
        borderTopColor: "transparent",
        borderBottomWidth: ARROW_SIZE,
        borderLeftWidth: ARROW_SIZE,
        borderRightWidth: ARROW_SIZE,
        borderTopWidth: 0,
      };

  return (
    <>
      {children ? (
        <View style={styles.wrapper}>
          <View>{children}</View>
          <View ref={iconRef} collapsable={false}>
            <Pressable
              onPress={handlePress}
              accessibilityRole="button"
              accessibilityLabel={`Learn about ${term}`}
              accessibilityHint="Double tap for definition"
              style={styles.iconTouchable}
            >
              <Ionicons name="help-circle-outline" size={iconSize} color={resolvedIconColor} />
            </Pressable>
          </View>
        </View>
      ) : (
        <View ref={iconRef} collapsable={false}>
          <Pressable
            onPress={handlePress}
            accessibilityRole="button"
            accessibilityLabel={`Learn about ${term}`}
            accessibilityHint="Double tap for definition"
            style={styles.iconTouchable}
          >
            <Ionicons name="help-circle-outline" size={iconSize} color={resolvedIconColor} />
          </Pressable>
        </View>
      )}

      <Modal
        visible={visible}
        transparent
        animationType="none"
        onRequestClose={handleBackdropPress}
        accessibilityViewIsModal
      >
        <View
          style={[styles.backdrop, { backgroundColor: "rgba(0, 0, 0, 0.1)" }]}
          onStartShouldSetResponder={() => true}
          onResponderRelease={handleBackdropPress}
        >
          <Animated.View
            style={[
              popoverAnimStyle,
              {
                position: "absolute",
                top: popoverTop,
                left: popoverLeft,
                width: POPOVER_MAX_WIDTH,
                backgroundColor: surface[0],
                borderRadius: radii.md,
                paddingHorizontal: POPOVER_PADDING,
                paddingVertical: POPOVER_VERTICAL,
                borderWidth: 1,
                borderColor: border.subtle,
                shadowColor: "#000",
                shadowOpacity: 0.08,
                shadowRadius: 12,
                shadowOffset: { width: 0, height: 4 },
                elevation: 4,
              },
            ]}
            onStartShouldSetResponder={() => true}
          >
            {/* Arrow */}
            <View
              style={[
                styles.arrow,
                {
                  left: arrowOffsetX,
                  ...(arrowPoints as any),
                },
              ]}
            />

            {/* Title */}
            <Text
              style={[
                styles.title,
                {
                  color: textRole.primary,
                  fontFamily: "Inter_600SemiBold",
                  marginBottom: 4,
                },
              ]}
              numberOfLines={1}
            >
              {entry.title}
            </Text>

            {/* Body */}
            <Text
              style={[
                styles.body,
                {
                  color: textRole.secondary,
                  fontFamily: "Inter_400Regular",
                },
              ]}
              numberOfLines={3}
            >
              {entry.body}
            </Text>
          </Animated.View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  iconTouchable: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  backdrop: {
    flex: 1,
  },
  arrow: {
    position: "absolute",
    width: 0,
    height: 0,
  },
  title: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
  },
  body: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "400",
  },
});
