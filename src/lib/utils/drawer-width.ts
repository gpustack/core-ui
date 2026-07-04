import { getResponsiveLayout } from './responsive-layout';

export const DRAWER_WIDTH_NARROW = 600;

const SIDER_OFFSET = 220;
const MOBILE_VIEWPORT_INSET = 32;

/**
 * Responsive drawer width aligned with FormDrawer / Edit Model (600px).
 * Mobile: large part of the screen with side inset, capped at 600px.
 * Desktop wide: calc(100vw - sidebar).
 */
export function getDrawerWidth(
  viewportWidth: number,
  propWidth?: string | number
): string | number {
  const { isMobile } = getResponsiveLayout(viewportWidth);

  if (isMobile) {
    return `min(${DRAWER_WIDTH_NARROW}px, calc(100vw - ${MOBILE_VIEWPORT_INSET}px))`;
  }

  if (propWidth != null) {
    return propWidth;
  }

  return `calc(100vw - ${SIDER_OFFSET}px)`;
}
