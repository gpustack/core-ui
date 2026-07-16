import React from 'react';
import type { ChildGridOptions } from '../types';
import RowChildren from './row-children';

// The expanded row lives inside `.expanded-row`, which has 16px of horizontal
// padding. Cancel it so the child grid starts at the row's true left edge and
// every cell lines up under its parent column.
const EXPANDED_ROW_PADDING = 16;

/**
 * Style for one child-row cell: spans `span` parent columns and matches the
 * table cell's horizontal padding. Exposed as an escape hatch for cases where
 * the `<ExpandedRowGrid.Cell>` wrapper won't do (styled-components, a cell that
 * needs `display: grid`, etc.).
 */
export const cellStyle = (
  span = 1,
  extra?: React.CSSProperties
): React.CSSProperties => ({
  gridColumn: `span ${span}`,
  minWidth: 0,
  display: 'flex',
  alignItems: 'center',
  paddingInline: 'var(--ant-table-cell-padding-inline)',
  ...extra
});

export interface ExpandedRowCellProps extends React.HTMLAttributes<HTMLDivElement> {
  /** How many parent columns this cell spans. Defaults to 1. */
  span?: number;
}

const Cell: React.FC<ExpandedRowCellProps> = ({
  span = 1,
  style,
  children,
  ...rest
}) => (
  <div {...rest} style={cellStyle(span, style)}>
    {children}
  </div>
);

export interface ExpandedRowGridProps extends Pick<
  ChildGridOptions,
  'gridTemplate' | 'prefixWidth'
> {
  style?: React.CSSProperties;
  className?: string;
  children: React.ReactNode;
}

interface ExpandedRowGridComponent extends React.FC<ExpandedRowGridProps> {
  Cell: typeof Cell;
}

/**
 * Lays out an expandable child row on the same column grid as its parent
 * `SealTable` row, so cells align to the parent columns without magic paddings.
 *
 * Feed it the `gridTemplate` / `prefixWidth` from the `renderChildren` options
 * ({@link ChildGridOptions}). Children flow left-to-right via CSS grid
 * auto-placement; each cell only declares its `span` (via `<Cell>`), so there
 * is no dependency on parent column keys or grid-line math. The first track is
 * the prefix gutter (expand / select), reproduced here as an empty spacer.
 *
 * Page-specific span logic (how many columns the middle region covers, any
 * split/merge) stays in the consumer — this is only the shared shell.
 */
const ExpandedRowGrid = (({
  gridTemplate,
  prefixWidth = 0,
  style,
  className,
  children
}: ExpandedRowGridProps) => (
  // Break out of the `.expanded-row` horizontal padding.
  <div style={{ marginInline: -EXPANDED_ROW_PADDING }}>
    <RowChildren>
      <div
        className={className}
        style={{
          width: '100%',
          display: 'grid',
          gridTemplateColumns: `${prefixWidth}px ${gridTemplate}`,
          gridAutoFlow: 'row',
          alignItems: 'center',
          ...style
        }}
      >
        {/* prefix gutter (expand / select) */}
        <span style={{ gridColumn: 'span 1' }} />
        {children}
      </div>
    </RowChildren>
  </div>
)) as ExpandedRowGridComponent;

ExpandedRowGrid.Cell = Cell;

export default ExpandedRowGrid;
