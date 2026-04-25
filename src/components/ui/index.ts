/**
 * UI component barrel — import from '@/components/ui' for any shared UI primitive.
 *
 * v3 primitives:
 *   import { TeamLogo, SectionHeader, EmptyState, Badge } from '@/components/ui';
 *
 * v4 polish primitives (social / habit / game-like):
 *   import { PressableScale, GradientHero, StreakFlame, TierBadge, ProgressBar, StatChip } from '@/components/ui';
 */
export { TeamLogo } from "./TeamLogo";
export { SectionHeader } from "./SectionHeader";
export { EmptyState } from "./EmptyState";
export { Badge, LiveBadge } from "./Badge";

// v4 polish primitives
export { PressableScale } from "./PressableScale";
export type { PressableScaleProps } from "./PressableScale";
export { GradientHero } from "./GradientHero";
export type { GradientHeroProps, GradientTuple } from "./GradientHero";
export { StreakFlame } from "./StreakFlame";
export type { StreakFlameProps } from "./StreakFlame";
export { TierBadge } from "./TierBadge";
export type { TierBadgeProps, TierName } from "./TierBadge";
export { ProgressBar } from "./ProgressBar";
export type { ProgressBarProps } from "./ProgressBar";
export { StatChip } from "./StatChip";
export type { StatChipProps } from "./StatChip";

// Emerald Minimalism canonical primitives
export { ScreenHeader } from "./ScreenHeader";
export type { ScreenHeaderProps } from "./ScreenHeader";
export { ScorpionCrest } from "./ScorpionCrest";
export type { ScorpionCrestProps } from "./ScorpionCrest";
export { FilterSegmented } from "./FilterSegmented";
export type { FilterSegmentedProps, FilterSegmentedItem } from "./FilterSegmented";
export { Button } from "./Button";
export type { ButtonProps } from "./Button";
export { CelebrationProvider, useCelebration } from "./CelebrationToast";
export type { CelebrationPayload, CelebrationVariant } from "./CelebrationToast";
export { WelcomeBackBanner } from "./WelcomeBackBanner";
export type { WelcomeBackBannerProps } from "./WelcomeBackBanner";
export { SyncIndicator } from "./SyncIndicator";
export type { SyncIndicatorProps } from "./SyncIndicator";

// Help & glossary
export { HelpTip, GLOSSARY } from "./HelpTip";
export type { HelpTipProps } from "./HelpTip";

// Skeleton loaders — re-exported for convenience
export {
  Skeleton,
  MatchCardSkeleton,
  LeaderboardRowSkeleton,
  ProfileHeroSkeleton,
  SkeletonStandingRow,
  SkeletonPlayerRow,
  SkeletonTransferRow,
  SkeletonStatBar,
} from "../SkeletonLoader";
