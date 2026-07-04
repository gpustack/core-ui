export type FilterBarLayoutState = {
  shouldCollapseInline: boolean;
  showInlineFilters: boolean;
  useDrawerRow: boolean;
  stackVertical: boolean;
  showFiltersButton: boolean;
};

export function getFilterBarLayoutState(options: {
  hasInlineFilters: boolean;
  collapseInlineFilters?: boolean;
  hasFiltersButton: boolean;
  isCompactToolbar: boolean;
  stackInlineFilters?: boolean;
}): FilterBarLayoutState {
  const {
    hasInlineFilters,
    collapseInlineFilters,
    hasFiltersButton,
    isCompactToolbar,
    stackInlineFilters = true
  } = options;

  const shouldCollapseInline = collapseInlineFilters ?? hasFiltersButton;
  const collapseToDrawer = shouldCollapseInline && isCompactToolbar;
  const showInlineFilters = hasInlineFilters && !collapseToDrawer;
  const useDrawerRow = collapseToDrawer && hasFiltersButton;
  const stackVertical =
    isCompactToolbar && stackInlineFilters && showInlineFilters;
  // Drawer-only filters (no inlineFilters): show Filters button at all breakpoints.
  const showFiltersButton =
    hasFiltersButton &&
    (useDrawerRow || (!hasInlineFilters && shouldCollapseInline));

  return {
    shouldCollapseInline,
    showInlineFilters,
    useDrawerRow,
    stackVertical,
    showFiltersButton
  };
}
