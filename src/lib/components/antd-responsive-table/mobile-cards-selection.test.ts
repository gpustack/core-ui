import type { Key } from 'antd/es/table/interface';
import { describe, expect, it } from 'vitest';
import {
  applyRowSelectChange,
  applySelectAllChange,
  computeSelectAllState,
  getSelectableRowKeys,
  resolveSelectedRows
} from './mobile-cards-selection';

type Row = { id: number; name: string };

const rowKey = 'id';

describe('resolveSelectedRows', () => {
  it('returns rows from other pages via cache', () => {
    const page1: Row[] = [{ id: 1, name: 'a' }];
    const page2: Row[] = [{ id: 2, name: 'b' }];
    const cache = new Map([
      [1, page1[0]],
      [2, page2[0]]
    ]);

    const rows = resolveSelectedRows([1, 2], page2, rowKey, [], cache);

    expect(rows).toEqual([
      { id: 1, name: 'a' },
      { id: 2, name: 'b' }
    ]);
  });

  it('prefers fresh records over cache on key collision', () => {
    const stale = { id: 1, name: 'stale' };
    const fresh = { id: 1, name: 'fresh' };
    const cache = new Map([[1, stale]]);

    const rows = resolveSelectedRows([1], [fresh], rowKey, [], cache);

    expect(rows).toEqual([{ id: 1, name: 'fresh' }]);
  });
});

describe('getSelectableRowKeys', () => {
  it('excludes rows with getCheckboxProps disabled', () => {
    const dataSource: Row[] = [
      { id: 1, name: 'a' },
      { id: 2, name: 'b' },
      { id: 3, name: 'c' }
    ];
    const getCheckboxProps = (record: Row) => ({
      disabled: record.id === 2
    });

    expect(getSelectableRowKeys(dataSource, rowKey, getCheckboxProps)).toEqual([
      1, 3
    ]);
  });

  it('returns all keys when getCheckboxProps is not provided', () => {
    const dataSource: Row[] = [
      { id: 1, name: 'a' },
      { id: 2, name: 'b' }
    ];

    expect(getSelectableRowKeys(dataSource, rowKey)).toEqual([1, 2]);
  });
});

describe('computeSelectAllState', () => {
  it('is checked only when all selectable rows are selected', () => {
    const selectableRowKeys = [1, 3];

    expect(computeSelectAllState([1, 3], selectableRowKeys)).toEqual({
      checked: true,
      indeterminate: false
    });
    expect(computeSelectAllState([1, 2, 3], selectableRowKeys)).toEqual({
      checked: true,
      indeterminate: false
    });
  });

  it('is indeterminate when part of selectable rows are selected', () => {
    expect(computeSelectAllState([1], [1, 3])).toEqual({
      checked: false,
      indeterminate: true
    });
  });

  it('is unchecked when no selectable rows are selected', () => {
    expect(computeSelectAllState([], [1, 3])).toEqual({
      checked: false,
      indeterminate: false
    });
  });
});

describe('applySelectAllChange', () => {
  it('select all adds only selectable keys from the current page', () => {
    const dataSource: Row[] = [
      { id: 1, name: 'a' },
      { id: 2, name: 'b' },
      { id: 3, name: 'c' }
    ];
    const getCheckboxProps = (record: Row) => ({
      disabled: record.id === 2
    });

    const { keys, rows } = applySelectAllChange(
      true,
      [],
      dataSource,
      rowKey,
      getCheckboxProps
    );

    expect(keys).toEqual([1, 3]);
    expect(rows).toEqual([
      { id: 1, name: 'a' },
      { id: 3, name: 'c' }
    ]);
  });

  it('select all preserves keys from other pages via cache', () => {
    const page1Row = { id: 1, name: 'page1' };
    const page2: Row[] = [{ id: 2, name: 'page2' }];
    const cache = new Map<Key, Row>([[1, page1Row]]);

    const { keys, rows } = applySelectAllChange(
      true,
      [1],
      page2,
      rowKey,
      undefined,
      cache
    );

    expect(keys).toEqual([1, 2]);
    expect(rows).toEqual([
      { id: 1, name: 'page1' },
      { id: 2, name: 'page2' }
    ]);
  });

  it('deselect all removes only selectable keys from the current page', () => {
    const dataSource: Row[] = [
      { id: 1, name: 'a' },
      { id: 2, name: 'b' },
      { id: 3, name: 'c' }
    ];
    const getCheckboxProps = (record: Row) => ({
      disabled: record.id === 2
    });
    const cache = new Map<Key, Row>([[4, { id: 4, name: 'other-page' }]]);

    const { keys, rows } = applySelectAllChange(
      false,
      [1, 2, 3, 4],
      dataSource,
      rowKey,
      getCheckboxProps,
      cache
    );

    expect(keys).toEqual([2, 4]);
    expect(rows).toEqual([
      { id: 2, name: 'b' },
      { id: 4, name: 'other-page' }
    ]);
  });
});

describe('applyRowSelectChange', () => {
  it('adding a row does not lose rows from other pages', () => {
    const page1Row = { id: 1, name: 'page1' };
    const page2Row = { id: 2, name: 'page2' };
    const cache = new Map<Key, Row>([[1, page1Row]]);

    const { keys, rows } = applyRowSelectChange(
      true,
      2,
      page2Row,
      [1],
      [page2Row],
      rowKey,
      cache
    );

    expect(keys).toEqual([1, 2]);
    expect(rows).toEqual([page1Row, page2Row]);
  });

  it('removing a row keeps other selected rows', () => {
    const row1 = { id: 1, name: 'a' };
    const row2 = { id: 2, name: 'b' };
    const cache = new Map<Key, Row>([
      [1, row1],
      [2, row2]
    ]);

    const { keys, rows } = applyRowSelectChange(
      false,
      1,
      row1,
      [1, 2],
      [row1, row2],
      rowKey,
      cache
    );

    expect(keys).toEqual([2]);
    expect(rows).toEqual([row2]);
  });
});
