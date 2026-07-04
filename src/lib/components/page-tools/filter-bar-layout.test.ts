import { describe, expect, it } from 'vitest';
import { getFilterBarLayoutState } from './filter-bar-layout';

describe('getFilterBarLayoutState', () => {
  it('keeps inline filters visible on desktop without filters button', () => {
    const state = getFilterBarLayoutState({
      hasInlineFilters: true,
      hasFiltersButton: true,
      isCompactToolbar: false
    });

    expect(state.showInlineFilters).toBe(true);
    expect(state.useDrawerRow).toBe(false);
    expect(state.stackVertical).toBe(false);
    expect(state.showFiltersButton).toBe(false);
  });

  it('hides inline filters and shows drawer row on compact toolbar (tablet/mobile)', () => {
    const state = getFilterBarLayoutState({
      hasInlineFilters: true,
      hasFiltersButton: true,
      isCompactToolbar: true
    });

    expect(state.showInlineFilters).toBe(false);
    expect(state.useDrawerRow).toBe(true);
    expect(state.stackVertical).toBe(false);
    expect(state.showFiltersButton).toBe(true);
  });

  it('shows filters button on desktop when filters are drawer-only', () => {
    const state = getFilterBarLayoutState({
      hasInlineFilters: false,
      collapseInlineFilters: true,
      hasFiltersButton: true,
      isCompactToolbar: false
    });

    expect(state.showInlineFilters).toBe(false);
    expect(state.showFiltersButton).toBe(true);
    expect(state.useDrawerRow).toBe(false);
  });
});
