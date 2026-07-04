import _ from 'lodash';
import React from 'react';
import {
  type ColumnHideBelow,
  type ResponsiveBreakpointKey
} from '../../../utils/responsive-layout';

export type MobileCardRole = 'primary' | 'detail' | 'action' | 'hidden';

export type MobileCardColumn = {
  hidden?: boolean;
  mobileCard?: MobileCardRole;
  mobileTitle?: React.ReactNode;
  fixed?: string;
  key?: string | number;
  dataIndex?: string | number | readonly (string | number)[];
  responsive?:
    | {
        hideBelow?: ColumnHideBelow;
      }
    | ResponsiveBreakpointKey[];
};

export const isOperationColumn = <T extends MobileCardColumn>(column: T) => {
  if (column.mobileCard === 'action') {
    return true;
  }
  const key = String(column.key || column.dataIndex || '');
  return (
    column.fixed === 'right' ||
    key === 'operation' ||
    key === 'operations' ||
    key === 'actions' ||
    key === 'action'
  );
};

/** Columns visible in mobile card body/header (card mode is always width < md). */
export function getMobileCardColumns<T extends MobileCardColumn>(
  columns: T[],
  _width: number
): T[] {
  return columns.filter((column) => {
    if (column.hidden) {
      return false;
    }
    if (column.mobileCard === 'hidden') {
      return false;
    }
    return true;
  });
}

/** Strip table-header wrappers (AutoTooltip, Typography, etc.) for card labels. */
export function flattenMobileColumnLabel(
  node: React.ReactNode
): React.ReactNode {
  if (node == null || typeof node === 'boolean') {
    return null;
  }
  if (typeof node === 'string' || typeof node === 'number') {
    return node;
  }
  if (Array.isArray(node)) {
    const parts = node
      .map((child) => flattenMobileColumnLabel(child))
      .filter((child) => child != null && child !== false);
    if (!parts.length) {
      return null;
    }
    if (parts.length === 1) {
      return parts[0];
    }
    return parts.map((child, index) =>
      React.createElement(React.Fragment, { key: index }, child)
    );
  }
  if (!React.isValidElement(node)) {
    return node;
  }

  const props = node.props as {
    children?: React.ReactNode;
    className?: string;
  };

  if (typeof node.type === 'string') {
    if (node.type === 'span' && props.className?.includes('sub-title')) {
      return React.createElement(
        'span',
        { className: 'sub-title' },
        flattenMobileColumnLabel(props.children)
      );
    }
    return flattenMobileColumnLabel(props.children);
  }

  return flattenMobileColumnLabel(props.children);
}

export function getMobileColumnLabel(
  column: Pick<MobileCardColumn, 'mobileTitle'> & {
    title?:
      React.ReactNode | ((props: Record<string, unknown>) => React.ReactNode);
  }
) {
  if (column.mobileTitle != null && column.mobileTitle !== false) {
    return column.mobileTitle;
  }
  const { title } = column;
  const resolvedTitle = typeof title === 'function' ? title({}) : title;
  return flattenMobileColumnLabel(resolvedTitle);
}

export function getMobileColumnGroups<T extends MobileCardColumn>(
  columns: T[]
) {
  const operationColumn =
    columns.find((column) => column.mobileCard === 'action') ||
    columns.find(isOperationColumn);
  const primaryColumn =
    columns.find((column) => column.mobileCard === 'primary') || columns[0];
  const detailColumns = columns.filter(
    (column) =>
      column !== primaryColumn &&
      column !== operationColumn &&
      column.mobileCard !== 'hidden'
  );

  return { primaryColumn, detailColumns, operationColumn };
}

export type MobileCardValueColumn = MobileCardColumn & {
  render?: (
    value: unknown,
    record: Record<string, unknown>,
    index: number
  ) => React.ReactNode;
  span?: number;
};

/** SealTable columns always declare `span`; Ant Design table columns do not. */
export function isSealTableColumn(column: MobileCardValueColumn): boolean {
  return typeof column.span === 'number';
}

export function renderMobileCardValue(
  column: MobileCardValueColumn,
  record: Record<string, unknown>,
  rowIndex: number
): React.ReactNode {
  const dataIndex = column.dataIndex;
  const value =
    dataIndex != null ? _.get(record, dataIndex as string) : undefined;

  if (typeof column.render === 'function') {
    return column.render(value, record, rowIndex);
  }

  return value as React.ReactNode;
}
