import { describe, expect, it } from 'vitest';
import { colSpanFromColumns } from './responsive-col-grid-utils';

describe('responsive-col-grid', () => {
  it('maps column count to ant design span', () => {
    expect(colSpanFromColumns(1)).toBe(24);
    expect(colSpanFromColumns(2)).toBe(12);
    expect(colSpanFromColumns(3)).toBe(8);
  });

  it('falls back to full width for invalid counts', () => {
    expect(colSpanFromColumns(0)).toBe(24);
    expect(colSpanFromColumns(undefined)).toBe(24);
  });
});
