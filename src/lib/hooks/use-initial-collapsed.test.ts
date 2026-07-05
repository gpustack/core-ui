import { describe, expect, it } from 'vitest';
import { breakpoints } from '../config';
import {
  getInitialCollapsed,
  isBelowBreakpoint
} from './use-initial-collapsed';

describe('isBelowBreakpoint', () => {
  it('returns true below md', () => {
    expect(isBelowBreakpoint(breakpoints.md - 1, 'md')).toBe(true);
    expect(isBelowBreakpoint(breakpoints.md, 'md')).toBe(false);
  });

  it('returns true below lg', () => {
    expect(isBelowBreakpoint(breakpoints.lg - 1, 'lg')).toBe(true);
    expect(isBelowBreakpoint(breakpoints.lg, 'lg')).toBe(false);
  });
});

describe('getInitialCollapsed', () => {
  it('returns false when window is undefined', () => {
    const original = globalThis.window;
    // @ts-expect-error test SSR
    delete globalThis.window;
    expect(getInitialCollapsed('md')).toBe(false);
    globalThis.window = original;
  });
});
