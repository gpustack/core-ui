import type { ColumnType } from 'antd/es/table';
import _ from 'lodash';
import type { ReactNode } from 'react';
import {
  getMobileColumnGroups as getSharedMobileColumnGroups,
  isOperationColumn
} from '../table/mobile-card/mobile-card-utils';

type SealTableColumn<T> = ColumnType<T> & {
  span?: number;
  responsive?: ColumnType<T>['responsive'] | { hideBelow?: string };
};

/** Strip SealTable-only column props before passing to ant Design Table. */
export const normalizeAntdColumns = <T>(
  columns?: ColumnType<T>[]
): ColumnType<T>[] | undefined => {
  if (!columns) {
    return columns;
  }

  return columns.map((column) => {
    const { responsive, span, children, mobileTitle, mobileCard, ...rest } =
      column as SealTableColumn<T>;
    const normalized: ColumnType<T> = {
      ...rest,
      ...(mobileTitle != null ? { mobileTitle } : {}),
      ...(mobileCard != null ? { mobileCard } : {})
    };

    if (Array.isArray(responsive)) {
      normalized.responsive = responsive;
    }

    if (children?.length) {
      normalized.children = normalizeAntdColumns(children);
    }

    return normalized;
  });
};

export { isOperationColumn };

export const getColumnTitle = <T>(title: ColumnType<T>['title']) => {
  if (typeof title === 'function') {
    return title({});
  }
  return title;
};

export { getMobileColumnLabel } from '../table/mobile-card/mobile-card-utils';

export const getCellValue = <T>(
  column: ColumnType<T>,
  record: T,
  index: number
): ReactNode => {
  const dataIndex = column.dataIndex;
  const value = dataIndex != null ? _.get(record, dataIndex as any) : undefined;

  if (column.render) {
    const rendered = column.render(value, record, index);
    if (rendered && typeof rendered === 'object' && 'children' in rendered) {
      return rendered.children;
    }
    return rendered as ReactNode;
  }

  return value as ReactNode;
};

export const getMobileColumnGroups = getSharedMobileColumnGroups;
