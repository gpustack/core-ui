import { breakpoints } from '../config';

export type ResponsiveBreakpointKey = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';

export type ResponsiveScreens = Record<ResponsiveBreakpointKey, boolean>;

export type ResponsiveLayout = {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  /** Stack page toolbars into filter/actions rows below xl width */
  isCompactToolbar: boolean;
  /** Hide toolbar button labels below lg width; show icon + tooltip only */
  isIconOnlyToolbar: boolean;
  currentPoint: ResponsiveBreakpointKey;
  screens: ResponsiveScreens;
  /** Ant Design Row/Col span helper: 24 on mobile, 12 on tablet, 8 on desktop */
  span: number;
};

export function getResponsiveScreens(width: number): ResponsiveScreens {
  return {
    xs: width >= breakpoints.xs,
    sm: width >= breakpoints.sm,
    md: width >= breakpoints.md,
    lg: width >= breakpoints.lg,
    xl: width >= breakpoints.xl,
    xxl: width >= breakpoints.xxl
  };
}

export function getCurrentBreakpoint(width: number): ResponsiveBreakpointKey {
  if (width < breakpoints.sm) return 'xs';
  if (width < breakpoints.md) return 'sm';
  if (width < breakpoints.lg) return 'md';
  if (width < breakpoints.xl) return 'lg';
  if (width < breakpoints.xxl) return 'xl';
  return 'xxl';
}

export function getResponsiveLayout(width: number): ResponsiveLayout {
  const screens = getResponsiveScreens(width);
  const isMobile = width < breakpoints.md;
  const isTablet = width >= breakpoints.md && width < breakpoints.lg;
  const isDesktop = width >= breakpoints.lg;
  const isCompactToolbar = width < breakpoints.xl;
  const isIconOnlyToolbar = width < breakpoints.lg;
  const currentPoint = getCurrentBreakpoint(width);

  let span = 8;
  if (isMobile) span = 24;
  else if (isTablet) span = 12;

  return {
    isMobile,
    isTablet,
    isDesktop,
    isCompactToolbar,
    isIconOnlyToolbar,
    currentPoint,
    screens,
    span
  };
}

export type ColumnHideBelow = 'sm' | 'md' | 'lg';

export function isColumnVisibleAtWidth(
  width: number,
  hideBelow?: ColumnHideBelow
): boolean {
  if (!hideBelow) return true;
  return width >= breakpoints[hideBelow];
}
