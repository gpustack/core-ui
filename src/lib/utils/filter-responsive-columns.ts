import type { ColumnProps } from '../components/table/types';
import {
  isColumnVisibleAtWidth,
  type ColumnHideBelow
} from './responsive-layout';

export type ResponsiveColumnProps = ColumnProps & {
  responsive?: {
    hideBelow?: ColumnHideBelow;
  };
};

export function filterResponsiveColumns<T extends ResponsiveColumnProps>(
  columns: T[],
  width: number
): T[] {
  return columns.filter((column) =>
    isColumnVisibleAtWidth(width, column.responsive?.hideBelow)
  );
}

export function useResponsiveColumns<T extends ResponsiveColumnProps>(
  columns: T[],
  width: number
): T[] {
  return filterResponsiveColumns(columns, width);
}
