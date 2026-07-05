import { describe, expect, it } from 'vitest';
import { buildClearedFilters, countActiveFilters } from './use-filter-drawer';

describe('countActiveFilters', () => {
  it('counts only defined non-empty values', () => {
    expect(
      countActiveFilters({
        a: 1,
        b: '',
        c: null,
        d: undefined,
        e: 'x'
      })
    ).toBe(2);
  });

  it('returns 0 for empty object', () => {
    expect(countActiveFilters({})).toBe(0);
  });
});

describe('buildClearedFilters', () => {
  it('sets each key to undefined', () => {
    expect(buildClearedFilters(['user_id', 'cluster_id'])).toEqual({
      user_id: undefined,
      cluster_id: undefined
    });
  });
});
