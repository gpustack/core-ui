import { type ColumnProps } from './types';

/**
 * The column track list shared by the header row and every body row, so their
 * columns always align.
 *
 * A column with an explicit `width` becomes a fixed px track; otherwise its
 * `span` becomes a proportional fr track. `minmax(0, …fr)` lets a track shrink
 * below its content width so long text wraps/clips instead of blowing out.
 * `minWidth` raises that shrink floor; `maxWidth` caps growth — the track then
 * sizes up to the cap instead of sharing leftover space proportionally, since a
 * grid growth limit cannot mix px with fr.
 *
 * `scroll.x` deliberately does NOT touch this template: it only widens the rows
 * (see `resolveScroll`), so header and body keep resolving the very same track
 * list and stay aligned column by column. The overflow comes from the `width` /
 * `minWidth` floors above, which no amount of extra width can shrink — pure
 * `fr` tracks simply distribute the wider row instead.
 *
 * `hasRows: false` drops BOTH elastic bounds — the `minWidth` floors and the
 * `maxWidth` caps — leaving every non-fixed column a plain `minmax(0, …fr)`
 * track. An empty body has no cells to keep readable and none to align the
 * header against, so both bounds only work against the lone header row: the
 * floors push it past a narrow viewport (the x axis is off there, see
 * `resolveScroll`, so it just overflows the container) and the caps stop the
 * tracks from spanning the full width, leaving dead space on the right. Without
 * them the `fr` tracks always resolve to exactly the container width. Header
 * titles truncate through `AutoTooltip`, so a squeezed header degrades to an
 * ellipsis instead of overflowing, and both bounds come back with the first row.
 * An explicit `width` stays a fixed track either way — a column that asked to be
 * pinned should not drift when the data lands.
 */
export const buildGridTemplate = (
  columns: ColumnProps[] = [],
  options: { hasRows?: boolean } = {}
) => {
  const hasRows = options.hasRows ?? true;

  return columns
    .map((col) => {
      if (col.width) return `${col.width}px`;
      const min = hasRows && col.minWidth ? `${col.minWidth}px` : '0';
      const max =
        hasRows && col.maxWidth ? `${col.maxWidth}px` : `${col.span ?? 1}fr`;
      return `minmax(${min}, ${max})`;
    })
    .join(' ');
};
