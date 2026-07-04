import { describe, expect, it } from 'vitest';
import { getResponsiveLayout } from './responsive-layout';

describe('getResponsiveLayout', () => {
  it('treats width below 768 as mobile', () => {
    const layout = getResponsiveLayout(390);
    expect(layout.isMobile).toBe(true);
    expect(layout.isTablet).toBe(false);
    expect(layout.isDesktop).toBe(false);
    expect(layout.span).toBe(24);
  });

  it('treats tablet widths correctly', () => {
    const layout = getResponsiveLayout(768);
    expect(layout.isMobile).toBe(false);
    expect(layout.isTablet).toBe(true);
    expect(layout.isDesktop).toBe(false);
    expect(layout.span).toBe(12);
  });

  it('treats desktop widths correctly', () => {
    const layout = getResponsiveLayout(1920);
    expect(layout.isMobile).toBe(false);
    expect(layout.isTablet).toBe(false);
    expect(layout.isDesktop).toBe(true);
    expect(layout.span).toBe(8);
  });

  it('enables compact toolbar below xl', () => {
    expect(getResponsiveLayout(1100).isCompactToolbar).toBe(true);
    expect(getResponsiveLayout(1200).isCompactToolbar).toBe(false);
  });

  it('enables icon-only toolbar below lg', () => {
    expect(getResponsiveLayout(521).isIconOnlyToolbar).toBe(true);
    expect(getResponsiveLayout(1100).isIconOnlyToolbar).toBe(false);
    expect(getResponsiveLayout(992).isIconOnlyToolbar).toBe(false);
  });
});
