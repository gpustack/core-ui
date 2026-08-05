import React from 'react';

export type OnSortFn = (
  order: {
    columnKey: string;
    field: string;
    order: 'ascend' | 'descend' | null;
  },
  sorter: boolean | { multiple?: number }
) => void;

export interface CellContentProps {
  dataIndex: string;
  render?: (text: any, record: any) => React.ReactNode;
  editable?:
    | boolean
    | {
        valueType?: 'text' | 'number' | 'date' | 'datetime' | 'time';
        title?: React.ReactNode;
      };
}

export interface ColumnProps {
  title: React.ReactNode;
  render?: (text: any, record: any) => React.ReactNode;
  dataIndex: string;
  key?: string;
  dataField?: string; // Added dataField property, aviods conflict with dataIndex, because dataIndex maybe used in sorting
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  /**
   * Proportional share of the leftover width, as a `fr` track. Omit it to let
   * the column take an equal share — every column defaults to `1fr`, so a table
   * that sets no `span` at all divides the width evenly. Only set it where a
   * column genuinely needs more or less room than its neighbours.
   */
  span?: number;
  align?: 'left' | 'center' | 'right';
  headerStyle?: React.CSSProperties;
  sorter?: boolean | { multiple?: number };
  defaultSortOrder?: 'ascend' | 'descend';
  editable?:
    | boolean
    | {
        valueType?: 'text' | 'number' | 'date' | 'datetime' | 'time';
        title?: React.ReactNode;
      };
  valueType?: 'text' | 'number' | 'date' | 'datetime' | 'time';
  sortOrder?: 'ascend' | 'descend' | null;
  [key: string]: any;
}

/**
 * The options object passed to `renderChildren`. Besides the parent record and
 * expanded flag, it carries the parent row's layout (`gridTemplate` /
 * `prefixWidth` / `columns`) so a child row can reuse the parent column grid
 * and align its cells without magic paddings. See `ExpandedRowGrid`.
 */
export interface ChildGridOptions {
  parent?: any;
  currentExpanded?: boolean;
  gridTemplate?: string;
  prefixWidth?: number;
  columns?: ColumnProps[];
}

export interface TableHeaderProps {
  showSorterTooltip?: boolean;
  sorterList?: TableOrder | Array<TableOrder>;
  sorter?: boolean | { multiple?: number };
  sortDirections?: ('ascend' | 'descend' | null)[];
  defaultSortOrder?: 'ascend' | 'descend' | null;
  sortOrder?: 'ascend' | 'descend' | null;
  dataIndex: string;
  onSort?: OnSortFn;
  title: React.ReactNode;
  style?: React.CSSProperties;
  firstCell?: boolean;
  lastCell?: boolean;
  align?: 'left' | 'center' | 'right';
  width?: number | string;
  sortedDataIndexList?: Array<{
    columnKey: string;
    field: string;
    order: 'ascend' | 'descend' | null;
  }>;
}

export interface RowSelectionProps {
  selectedRowKeys: React.Key[];
  selectedRows: any[];
  enableSelection: boolean;
  removeSelectedKeys: (rowKeys: React.Key[]) => void;
  onChange: (selectedRowKeys: React.Key[], selectedRows: any[]) => void;
}

export type TableOrder = {
  columnKey?: string;
  field?: string;
  order: 'ascend' | 'descend' | null;
};

/**
 * Scrolling limits, same semantics as antd `Table`'s `scroll`.
 *
 * - `x` — make the table horizontally scrollable. A number is px, a string is
 *   passed through as-is (e.g. `'max-content'`), `true` only turns the overflow
 *   on and lets the columns' own `width` / `minWidth` decide how far the table
 *   may grow.
 *
 *   Prefer `true` or a px number over `'max-content'`. The columns are `fr`
 *   tracks, and under a content-driven constraint one greedy cell sets the `fr`
 *   unit for EVERY track: an 11-column / 24-span worker table whose labels cell
 *   wants 582px on a 3-span track resolves to 582 / 3 = 194px per `fr`, i.e.
 *   24 × 194 = 4694px of table instead of the 1370px its column floors ask for.
 *   Columns stay aligned either way — the table is just far wider than intended.
 * - `y` — cap the body height and scroll it vertically; the header stays put.
 *   A number is px, a string is passed through (e.g. `'calc(100vh - 300px)'`).
 *
 * `x` applies only while there are rows. An empty body drops the columns'
 * `minWidth` floors and the x axis with them, so a table whose floors outgrow a
 * narrow viewport shows its empty state flush instead of behind a horizontal
 * scrollbar; the floors and the scroll come back with the first row. `y` keeps
 * capping the empty block.
 *
 * Omitting `scroll` leaves the table exactly as it was: no scroll viewport, no
 * width/height limits.
 */
export interface TableScroll {
  x?: number | string | true;
  y?: number | string;
}

export interface TableProps {
  showSorterTooltip?: boolean;
  sortDirections?: ('ascend' | 'descend' | null)[];
  columns?: ColumnProps[];
  childParentKey?: string;
  expandedRowKeys?: React.Key[];
  rowSelection?: RowSelectionProps;
  children?: React.ReactElement<ColumnProps>[];
  empty?: React.ReactNode;
  // Reserved height for the empty/loading body area. Keeping this equal to the
  // `minHeight` of the `empty` node (e.g. <NoResult minHeight="calc(100vh - 300px)" />)
  // makes the first-load spinner, the empty state, and eventual rows occupy one
  // stable block, so entering the page no longer jumps.
  emptyMinHeight?: number | string;
  scroll?: TableScroll;
  expandable?: React.ReactNode;
  dataSource: any[];
  pollingChildren?: boolean;
  watchChildren?: boolean;
  loading?: boolean;
  loadend?: boolean;
  onCell?: (record: any, extra: any) => void;
  onTableSort?: (order: TableOrder | Array<TableOrder>) => void;
  onExpand?: (expanded: boolean, record: any, rowKey: any) => void;
  onExpandAll?: (expanded: boolean) => void;
  renderChildren?: (data: any, options: ChildGridOptions) => React.ReactNode;
  loadChildren?: (record: any, options?: any) => Promise<any[]>;
  loadChildrenAPI?: (record: any) => string;
  contentRendered?: () => void;
  rowKey: string;
}

export interface RowContextProps {
  record: Record<string, any>;
  pollingChildren?: boolean;
  rowIndex: number;
}
