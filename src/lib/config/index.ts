export const breakpoints = {
  xs: 0,
  sm: 576,
  md: 768,
  lg: 992,
  xl: 1200,
  xxl: 1600
};

export const WatchEventType = {
  CREATE: 1,
  UPDATE: 2,
  DELETE: 3
};

import { type StatusType } from '../types';

/**
 * Every state reads from ONE token layer (`--color-status-*`, declared per
 * theme in the host's `global.less`). It used to mix two: error / warning /
 * transitioning took the numbered PALETTE scale while success took the SEMANTIC
 * token, so rebranding `colorError` / `colorWarning` reached two of the five
 * states and silently missed the other three.
 *
 * Three ink steps per state, because the same hue meets a different surface in
 * each place it is used and the contrast requirement moves with it:
 *
 *  - `text`    — on the state's own pale TINT (filled StatusTag). Darkest of
 *                the three; the old `-6` palette values failed AA here for the
 *                12px/400 label, success worst at 1.94:1.
 *  - `outline` — the outlined tag's LABEL, on the bare container. The container
 *                is lighter than a tint, so a lighter ink still clears 4.5:1 —
 *                using `text` here overshot to 5.4–6.2 and read muddy.
 *  - `outlineBorder` — the outlined tag's BORDER. A border is a GRAPHIC, so it
 *                answers to 3:1, not 4.5:1, and gets to be much more vivid than
 *                the label beside it. It is also the largest coloured area on
 *                the pill, so this is what decides whether the tag reads as
 *                "green" at all.
 *  - `dot`     — a filled 8px circle, a graphic beside its own label rather
 *                than the sole carrier of the state. Vivid.
 *
 * Collapsing any two of them puts a value tuned for one job on another — which
 * is how the dot ended up dark pine, and how the outlined success tag ended up
 * muddy: its border was carrying the label's 4.5:1 constraint for no reason.
 * Measurements live in the host `global.less` status block.
 */
export const StatusColorMap: Record<
  StatusType,
  {
    text: string;
    bg: string;
    border?: string;
    dot?: string;
    outline?: string;
    outlineBorder?: string;
  }
> = {
  error: {
    text: `var(--color-status-error-text)`,
    bg: `var(--color-status-error-bg)`,
    dot: `var(--color-status-error-dot)`,
    outline: `var(--color-status-error-outline)`,
    outlineBorder: `var(--color-status-error-outline-border)`
  },
  warning: {
    text: `var(--color-status-warning-text)`,
    bg: `var(--color-status-warning-bg)`,
    dot: `var(--color-status-warning-dot)`,
    outline: `var(--color-status-warning-outline)`,
    outlineBorder: `var(--color-status-warning-outline-border)`
  },
  transitioning: {
    text: `var(--color-status-transitioning-text)`,
    bg: `var(--color-status-transitioning-bg)`,
    dot: `var(--color-status-transitioning-dot)`,
    outline: `var(--color-status-transitioning-outline)`,
    outlineBorder: `var(--color-status-transitioning-outline-border)`
  },
  success: {
    text: `var(--color-status-success-text)`,
    bg: `var(--color-status-success-bg)`,
    dot: `var(--color-status-success-dot)`,
    outline: `var(--color-status-success-outline)`,
    outlineBorder: `var(--color-status-success-outline-border)`
  },
  inactive: {
    text: `var(--color-status-inactive-text)`,
    border: `var(--color-status-inactive-border)`,
    bg: `var(--color-status-inactive-bg)`
  }
};

export const StatusMaps: Record<string, StatusType> = {
  error: 'error',
  warning: 'warning',
  transitioning: 'transitioning',
  success: 'success',
  inactive: 'inactive'
};
