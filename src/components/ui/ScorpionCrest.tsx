/**
 * ScorpionCrest — Premium brand mark for Scorepion.
 *
 * A 64×64px emerald shield with stylized scorpion silhouette inside.
 * Recognizable at 12×12px (favicon), 24×24px (TierBadge watermark),
 * 48×48px (match badge), and 72×72px (premium hero).
 *
 * Use as: primary hero on premium screen, TierBadge backing glyph,
 * favicon, and match-live indicator. Supports inverted color variants
 * via props for use on gradient backgrounds.
 *
 * Design approach: Layered SVG primitives (shield path + scorpion silhouette).
 * No drop shadows (premium apps earn shadows through design, not effects).
 */
import React from 'react';
import { View, StyleProp, ViewStyle } from 'react-native';
import Svg, { Path, Ellipse, G } from 'react-native-svg';
import { surface, accent } from '@/constants/colors';

export type ScorpionCrestProps = {
  size?: number;                     // default 64, controls both width and height
  fill?: string;                     // shield background fill — default accent.primary (emerald)
  glyphColor?: string;               // scorpion silhouette color — default surface[0] (white)
  borderColor?: string | null;       // optional hairline border — default null
  inverted?: boolean;                // when true, uses white shield + emerald glyph (overrides fill/glyphColor)
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

/**
 * ScorpionCrest component.
 *
 * Default: emerald shield (accent.primary) with white scorpion (surface[0]).
 * Inverted: white shield (surface[0]) with emerald scorpion (accent.primary) —
 *   pass inverted={true} or explicitly set fill={surface[0]} glyphColor={accent.primary}.
 */
export const ScorpionCrest = React.forwardRef<View, ScorpionCrestProps>(
  (
    {
      size = 64,
      fill: fillProp,
      glyphColor: glyphColorProp,
      borderColor = null,
      inverted = false,
      accessibilityLabel = 'Scorpion crest',
      style,
    },
    ref
  ) => {
    // Determine colors based on inverted flag or explicit props
    const fill = fillProp ?? (inverted ? surface[0] : accent.primary);
    const glyphColor = glyphColorProp ?? (inverted ? accent.primary : surface[0]);
    return (
      <View
        ref={ref}
        style={style}
        testID="scorpion-crest"
        accessibilityRole="image"
        accessibilityLabel={accessibilityLabel}
      >
        <Svg width={size} height={size} viewBox="0 0 64 64">
          {/* Shield: rounded-top, pointed-bottom shield path filling the viewBox */}
          <Path
            d="M 32 2 C 32 2, 14 8, 14 22 C 14 34, 20 46, 32 56 C 44 46, 50 34, 50 22 C 50 8, 32 2, 32 2 Z"
            fill={fill}
            stroke={borderColor || 'none'}
            strokeWidth={borderColor ? 1 : 0}
          />

          {/* Scorpion silhouette: centered, symmetric, clean design */}
          <G>
            {/* Main body: rounded-rectangle (cephalothorax + abdomen combined) */}
            <Path
              d="M 28 26 L 36 26 Q 38 26, 38 28 L 38 40 Q 38 42, 36 42 L 28 42 Q 26 42, 26 40 L 26 28 Q 26 26, 28 26 Z"
              fill={glyphColor}
            />

            {/* Left pincer: arc reaching left-upward from top-left of body */}
            <Path
              d="M 28 27 Q 20 23, 18 26"
              stroke={glyphColor}
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />

            {/* Right pincer: arc reaching right-upward from top-right of body (symmetric) */}
            <Path
              d="M 36 27 Q 44 23, 46 26"
              stroke={glyphColor}
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />

            {/* Left leg pair (upper and lower) */}
            <Path
              d="M 26 30 L 20 32"
              stroke={glyphColor}
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            <Path
              d="M 26 36 L 20 39"
              stroke={glyphColor}
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />

            {/* Right leg pair (upper and lower) — symmetric mirror */}
            <Path
              d="M 38 30 L 44 32"
              stroke={glyphColor}
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            <Path
              d="M 38 36 L 44 39"
              stroke={glyphColor}
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />

            {/* Tail: curved arc extending right-upward from rear of body (asymmetric curl) */}
            <Path
              d="M 37 42 Q 40 38, 42 32 Q 43 26, 41 20 Q 40 18, 38 19"
              stroke={glyphColor}
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />

            {/* Stinger: small filled triangle at tail tip (pointing upward-right) */}
            <Path
              d="M 38 19 L 39 14 L 42 17 Z"
              fill={glyphColor}
            />
          </G>
        </Svg>
      </View>
    );
  }
);

ScorpionCrest.displayName = 'ScorpionCrest';

export default ScorpionCrest;
