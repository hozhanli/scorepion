/**
 * Icon size scale — for Ionicons and SvgIcon usage across components.
 *
 * Size tiers:
 *   xxs — inline with caption text (badges, mini-chips, tiny indicators)
 *   xs  — inline with body text (form validation, help icons)
 *   sm  — next to labels in list rows, navigation secondary
 *   md  — button icons, section headers, standard UI elements
 *   lg  — hero icons, empty-state illustrations, large cards
 *   xl  — large hero moments (celebration, tier badges, full-bleed modals)
 *   xxl — extra-large hero or full-screen illustrations
 */
export const iconSize = {
  xxs: 10,
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export type IconSizeKey = keyof typeof iconSize;
