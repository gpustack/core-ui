import { describe, expect, it } from 'vitest';
import { buildSubmittedRow } from './cell-edit-utils';

describe('buildSubmittedRow', () => {
  it('updates flat dataIndex', () => {
    const row = { name: 'old' };
    expect(buildSubmittedRow(row, 'name', 'new')).toEqual({ name: 'new' });
    expect(row.name).toBe('old');
  });

  it('updates nested array dataIndex', () => {
    const row = { profile: { age: 30 } };
    expect(buildSubmittedRow(row, ['profile', 'age'], 31)).toEqual({
      profile: { age: 31 }
    });
  });

  it('does not create flat comma key for array dataIndex', () => {
    const row = { profile: { age: 30 } };
    const next = buildSubmittedRow(row, ['profile', 'age'], 31);
    expect(next).not.toHaveProperty('profile,age');
    expect((next as { profile: { age: number } }).profile.age).toBe(31);
  });
});
