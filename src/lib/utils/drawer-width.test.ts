import { describe, expect, it } from 'vitest';
import { getDrawerWidth } from './drawer-width';

describe('getDrawerWidth', () => {
  it('returns inset mobile width below md breakpoint', () => {
    expect(getDrawerWidth(390)).toBe('min(600px, calc(100vw - 32px))');
  });

  it('returns prop width on desktop when provided', () => {
    expect(getDrawerWidth(1200, 600)).toBe(600);
  });

  it('returns sidebar offset width on desktop by default', () => {
    expect(getDrawerWidth(1200)).toBe('calc(100vw - 220px)');
  });
});
