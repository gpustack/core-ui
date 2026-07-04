import { useToggle } from 'ahooks';
import { useMemo, useRef, useState } from 'react';

export function countActiveFilters(values: Record<string, unknown>): number {
  return Object.values(values).filter(
    (value) => value !== undefined && value !== null && value !== ''
  ).length;
}

export function buildClearedFilters(
  clearKeys: string[]
): Record<string, undefined> {
  return clearKeys.reduce<Record<string, undefined>>((acc, key) => {
    acc[key] = undefined;
    return acc;
  }, {});
}

/**
 * Drawer filter state for CRUD list pages.
 * Pair with FilterBar filtersButtonProps + FilterForm.
 * Breakpoints: isCompactToolbar < 1200px, isIconOnlyToolbar < 992px.
 */
export default function useFilterDrawer(options?: {
  onFilterChange?: (filters: Record<string, unknown>) => void;
  clearKeys?: string[];
}) {
  const [filtersVisible, { toggle: toggleFilters }] = useToggle();
  const filterRef = useRef<{ reset: () => void } | null>(null);
  const [filterValues, setFilterValues] = useState<Record<string, unknown>>({});

  const filtersCount = useMemo(
    () => countActiveFilters(filterValues),
    [filterValues]
  );

  const handleOnFilterChange = (filters: Record<string, unknown>) => {
    setFilterValues(filters);
    options?.onFilterChange?.(filters);
  };

  const handleOnClearFilters = () => {
    filterRef.current?.reset();
    const cleared = options?.clearKeys?.length
      ? buildClearedFilters(options.clearKeys)
      : {};
    handleOnFilterChange(cleared);
  };

  return {
    filtersVisible,
    toggleFilters,
    filterRef,
    filterValues,
    setFilterValues,
    filtersCount,
    handleOnFilterChange,
    handleOnClearFilters
  };
}
