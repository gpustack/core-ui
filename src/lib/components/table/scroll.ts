import { type CSSProperties } from 'react';
import { type ColumnProps, type TableScroll } from './types';

const toCssSize = (value: number | string) =>
  typeof value === 'number' ? `${value}px` : value;

// Width a column refuses to shrink below: an explicit `width`, otherwise its
// `minWidth`. A column with neither is elastic (a pure `fr` track) and
// contributes nothing — it just shares whatever space is left.
const columnsFloorWidth = (columns: ColumnProps[] = []) =>
  columns.reduce(
    (total, column) => total + (column.width ?? column.minWidth ?? 0),
    0
  );

export interface ResolvedScroll {
  /** Horizontal scrolling is on. */
  hasX: boolean;
  /** Vertical scrolling is on. */
  hasY: boolean;
  /**
   * Inline style for `.seal-table-container`: the x width as a CSS variable
   * (consumed by both the header row and the body rows) and the y limit as a
   * `max-height`. `undefined` when `scroll` is omitted, so the DOM stays
   * byte-identical to the non-scrolling table.
   */
  style?: CSSProperties;
}

/**
 * Turns the `scroll` prop into what the less file needs: two flags (which
 * become the `seal-table-scroll-x` / `seal-table-scroll-y` classes) plus the
 * CSS custom properties carrying the sizes.
 *
 * `scroll.x` becomes the min-width of the single `.seal-table-scroll-content`
 * box that holds the header row and the body rows. Those two are siblings that
 * align only because they render the same `gridTemplate`, so they must be
 * widened by the same amount and scrolled by the same ancestor — never
 * separately. That is also why the value is never applied to each of them
 * directly: it may be a keyword (`'max-content'`), and the header's intrinsic
 * width (short titles) resolves nothing like the body's (full cell content), so
 * resolving it twice would hand them different widths and misalign every column.
 *
 * `scroll.x === true` carries no size of its own, so the width is derived from
 * the columns' own floors: the table may overflow up to the point where its
 * columns would start being compressed, and no further.
 *
 * `scroll.y` caps the *body*, like antd does, but the header shares the same
 * scroll viewport (it is `position: sticky` there), so the header height is
 * added back on top of `y`.
 */
export const resolveScroll = (
  scroll?: TableScroll,
  options: { columns?: ColumnProps[]; prefixWidth?: number } = {}
): ResolvedScroll => {
  const x = scroll?.x;
  const y = scroll?.y;
  const hasX = x !== undefined;
  const hasY = y !== undefined;

  if (!hasX && !hasY) {
    return { hasX: false, hasY: false };
  }

  const style: Record<string, string> = {};

  if (hasX) {
    style['--seal-table-scroll-x'] =
      x === true
        ? `${(options.prefixWidth ?? 0) + columnsFloorWidth(options.columns)}px`
        : toCssSize(x);
  }

  if (hasY) {
    style.maxHeight = `calc(${toCssSize(y)} + var(--seal-table-header-height))`;
  }

  return { hasX, hasY, style: style as CSSProperties };
};
