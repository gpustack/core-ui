import type { ColumnType } from 'antd/es/table';
import { describe, expect, it, vi } from 'vitest';
import { getCellValue } from './utils';

describe('getCellValue', () => {
  it('reads nested dataIndex via render path', () => {
    const record = { profile: { name: 'Alice' } };
    const column: ColumnType<typeof record> = {
      dataIndex: ['profile', 'name']
    };

    expect(getCellValue(column, record, 0)).toBe('Alice');
  });

  it('passes nested value to column.render', () => {
    const render = vi.fn((value: unknown) => `v:${value}`);
    const record = { a: { b: 1 } };
    const column: ColumnType<typeof record> = {
      dataIndex: ['a', 'b'],
      render
    };

    getCellValue(column, record, 0);

    expect(render).toHaveBeenCalledWith(1, record, 0);
  });
});
