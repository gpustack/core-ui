import { describe, expect, it } from 'vitest';
import { resolveScroll } from './scroll';
import { type ColumnProps } from './types';

const columns = [
  { title: 'Name', dataIndex: 'name', span: 1, width: 200 },
  { title: 'Type', dataIndex: 'type', span: 1, minWidth: 160 },
  { title: 'Note', dataIndex: 'note', span: 2 }
] as ColumnProps[];

describe('resolveScroll', () => {
  it('stays inert without a scroll prop', () => {
    expect(resolveScroll(undefined, { columns, prefixWidth: 40 })).toEqual({
      hasX: false,
      hasY: false
    });
    expect(resolveScroll({})).toEqual({ hasX: false, hasY: false });
  });

  it('turns a numeric x into a px min-width', () => {
    expect(resolveScroll({ x: 1200 })).toEqual({
      hasX: true,
      hasY: false,
      style: { '--seal-table-scroll-x': '1200px' }
    });
  });

  it('passes a string x through untouched', () => {
    expect(resolveScroll({ x: 'max-content' }).style).toEqual({
      '--seal-table-scroll-x': 'max-content'
    });
  });

  it('derives x === true from the columns own floors plus the prefix gutter', () => {
    expect(
      resolveScroll({ x: true }, { columns, prefixWidth: 40 }).style
    ).toEqual({ '--seal-table-scroll-x': '400px' });
  });

  it('derives nothing from x === true when every column is elastic', () => {
    expect(
      resolveScroll(
        { x: true },
        {
          columns: [
            { title: 'Note', dataIndex: 'note', span: 1 }
          ] as ColumnProps[]
        }
      ).style
    ).toEqual({ '--seal-table-scroll-x': '0px' });
  });

  it('caps the body with y and adds the header height back', () => {
    expect(resolveScroll({ y: 400 }).style).toEqual({
      maxHeight: 'calc(400px + var(--seal-table-header-height))'
    });
    expect(resolveScroll({ y: 'calc(100vh - 300px)' }).style).toEqual({
      maxHeight: 'calc(calc(100vh - 300px) + var(--seal-table-header-height))'
    });
  });

  it('supports both axes at once', () => {
    expect(resolveScroll({ x: 1200, y: 400 })).toEqual({
      hasX: true,
      hasY: true,
      style: {
        '--seal-table-scroll-x': '1200px',
        maxHeight: 'calc(400px + var(--seal-table-header-height))'
      }
    });
  });
});
