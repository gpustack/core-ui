import { useState, type Dispatch, type SetStateAction } from 'react';
import { breakpoints } from '../config';
import type { ResponsiveBreakpointKey } from '../utils/responsive-layout';

export function isBelowBreakpoint(
  width: number,
  below: ResponsiveBreakpointKey
): boolean {
  return width < breakpoints[below];
}

export function getInitialCollapsed(
  below: ResponsiveBreakpointKey = 'md'
): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  return isBelowBreakpoint(window.innerWidth, below);
}

/** Initial collapsed state from viewport width; does not auto-sync on resize. */
export default function useInitialCollapsed(
  below: ResponsiveBreakpointKey = 'md'
): [boolean, Dispatch<SetStateAction<boolean>>] {
  return useState(() => getInitialCollapsed(below));
}
