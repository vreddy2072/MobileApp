import { Platform } from 'react-native';

// Spacing scale
export const spacing = {
  xs: 8,
  sm: 12,
  md: 14,
  base: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

// Typography
export const typography = {
  fontFamily: {
    display: '-apple-system, "SF Pro Display", "Helvetica Neue", "Inter", sans-serif',
    text: '-apple-system, "SF Pro Text", "Helvetica Neue", "Inter", sans-serif',
  },
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 26,
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
    // Specific line heights for common font sizes
    xs: 16,      // for fontSize.xs (12)
    sm: 20,      // for fontSize.sm (14)
    base: 24,    // for fontSize.base (16)
    lg: 27,      // for fontSize.lg (18)
    xl: 30,      // for fontSize.xl (20)
    xxl: 36,     // for fontSize.xxl (24)
    xxxl: 39,    // for fontSize.xxxl (26)
  },
} as const;

// Text styles (typography only - colors come from theme)
// These styles define font properties only, not colors
export const textStyles = {
  header: {
    fontFamily: typography.fontFamily.display,
    fontSize: typography.fontSize.xxxl,
    fontWeight: typography.fontWeight.bold,
    // Color is applied via theme
  },
  sectionTitle: {
    fontFamily: typography.fontFamily.display,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    // Color is applied via theme
  },
  cardTitle: {
    fontFamily: typography.fontFamily.display,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    // Color is applied via theme
  },
  cardCount: {
    fontFamily: typography.fontFamily.display,
    fontSize: typography.fontSize.xxl,  // was: 24
    fontWeight: typography.fontWeight.bold,
    // Color is applied via theme
  },
  listName: {
    fontFamily: typography.fontFamily.text,
    fontSize: typography.fontSize.base,  // was: 17 (closest match)
    fontWeight: typography.fontWeight.semibold,
    // Color is applied via theme
  },
  listCount: {
    fontFamily: typography.fontFamily.text,
    fontSize: typography.fontSize.xl,  // was: 20
    fontWeight: typography.fontWeight.medium,
    // Color is applied via theme
  },
} as const;

// Shadow presets
export const shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  button: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  soft: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
} as const;

// Border radius
export const borderRadius = {
  sm: 8,
  base: 12,
  lg: 16,
  xl: 20,
} as const;

// Card dimensions
export const cardDimensions = {
  category: {
    height: 90,
    borderRadius: 25,
  },
} as const;

// Avatar dimensions
export const avatarDimensions = {
  size: 100,
  borderRadius: 50,
} as const;

// Content input dimensions
export const contentInput = {
  minHeight: 300,
} as const;

// Interaction constants
export const interaction = {
  activeOpacity: 0.7,
  disabledOpacity: 0.5,
} as const;

// Text preview constants
export const textPreview = {
  maxLength: 100,
} as const;

// Icon sizes
export const iconSizes = {
  header: 22,
  category: 24,
  list: 18,
  button: 20,
  avatar: 48,        // Icon inside avatar
  emptyState: 64,   // Empty state icon
  debug: 24,        // Debug section icon
  action: 18,       // Action buttons like download, trash
  pin: 16,          // Pin icon
} as const;

// Common colors
export const colors = {
  primary: '#007AFF',
  secondary: '#8E8E93',
  text: '#0A0A0A',
  textSecondary: '#1C1C1E',
  background: '#FFFFFF',
  headerIcon: '#FF3B30',
} as const;

// Card padding presets
export const cardPadding = {
  category: {
    horizontal: spacing.base,
    vertical: spacing.base,
  },
  list: {
    horizontal: spacing.lg,
    vertical: spacing.md,
  },
} as const;

// Grid spacing
export const gridSpacing = {
  horizontal: 16,  // Left/Right margins
  vertical: 6,    // Row gap
  betweenCards: 10, // Inter-card spacing
} as const;

// Common style presets for consistent usage across screens
export const commonStyles = {
  // Text styles
  largeTitle: {
    fontSize: typography.fontSize.xxxl,
    fontWeight: typography.fontWeight.bold,
    lineHeight: typography.lineHeight.xxxl,
  },
  title: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    lineHeight: typography.lineHeight.xxl,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    lineHeight: typography.lineHeight.lg,
  },
  bodyText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.normal,
    lineHeight: typography.lineHeight.base,
  },
  caption: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.normal,
    lineHeight: typography.lineHeight.sm,
  },
  smallCaption: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.normal,
    lineHeight: typography.lineHeight.xs,
  },
  buttonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },
  // Input styles
  inputText: {
    fontSize: typography.fontSize.base,
    lineHeight: typography.lineHeight.base,
  },
  inputTitle: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    lineHeight: typography.lineHeight.xxl,
  },
  // Button styles
  button: {
    borderRadius: borderRadius.base,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
  },
  buttonSmall: {
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
} as const;

