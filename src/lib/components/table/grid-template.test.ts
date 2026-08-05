import { describe, expect, it } from 'vitest';
import { buildGridTemplate } from './grid-template';
import { type ColumnProps } from './types';

const columns = [
  { title: 'Name', dataIndex: 'name', width: 200 },
  { title: 'Type', dataIndex: 'type', minWidth: 160 },
  { title: 'Note', dataIndex: 'note', span: 2 },
  { title: 'Size', dataIndex: 'size', minWidth: 80, maxWidth: 120 }
] as ColumnProps[];

describe('buildGridTemplate', () => {
  it('maps width to a fixed track and span to an fr track', () => {
    expect(buildGridTemplate(columns)).toBe(
      '200px minmax(160px, 1fr) minmax(0, 2fr) minmax(80px, 120px)'
    );
  });

  it('defaults an unspecified span to 1fr and an unspecified minWidth to 0', () => {
    expect(
      buildGridTemplate([{ title: 'Note', dataIndex: 'note' }] as ColumnProps[])
    ).toBe('minmax(0, 1fr)');
  });

  it('drops the minWidth floors while the body is empty', () => {
    expect(buildGridTemplate(columns, { hasRows: false })).toBe(
      '200px minmax(0, 1fr) minmax(0, 2fr) minmax(0, 120px)'
    );
  });

  it('keeps the floors once there are rows', () => {
    expect(buildGridTemplate(columns, { hasRows: true })).toBe(
      buildGridTemplate(columns)
    );
  });

  it('handles no columns at all', () => {
    expect(buildGridTemplate()).toBe('');
    expect(buildGridTemplate([], { hasRows: false })).toBe('');
  });
});
