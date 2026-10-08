import { expect, test } from 'vitest';
import { getVisibleFilterCount } from './filter-overflow';

const layout = {
  widths: [200, 160, 160, 160],
  reservedWidth: 160,
  gap: 8,
  visibleCount: 4
};

test('accounts for the filter button, refresh and gaps before removing controls', () => {
  expect(getVisibleFilterCount({ ...layout, availableWidth: 872 })).toBe(4);
  expect(getVisibleFilterCount({ ...layout, availableWidth: 871 })).toBe(3);
  expect(getVisibleFilterCount({ ...layout, availableWidth: 703 })).toBe(2);
  expect(getVisibleFilterCount({ ...layout, availableWidth: 535 })).toBe(1);
});

test('restores controls only with spare room, avoiding oscillation at the boundary', () => {
  expect(
    getVisibleFilterCount({ ...layout, availableWidth: 879, visibleCount: 3 })
  ).toBe(3);
  expect(
    getVisibleFilterCount({ ...layout, availableWidth: 880, visibleCount: 3 })
  ).toBe(4);
});

test('moves the name control last when even the first control cannot fit', () => {
  expect(getVisibleFilterCount({ ...layout, availableWidth: 367 })).toBe(0);
});

test('uses the measured action width instead of assuming a button width', () => {
  expect(
    getVisibleFilterCount({
      ...layout,
      availableWidth: 872,
      reservedWidth: 188
    })
  ).toBe(3);
});
