import { expect, test } from 'vitest';
import { getFilterClearPatch, isFilterActive } from './filter-values';
import type { ResponsiveFilterConfig } from './types';

interface Values {
  name: string;
  status?: number;
  enabled?: boolean;
  tags: string[];
  scope: string | null;
}

const values: Values = {
  name: 'name kept in toolbar',
  status: 0,
  enabled: false,
  tags: [],
  scope: null
};

test('counts 0 and false as selected values, but not empty inputs or arrays', () => {
  const filters: ResponsiveFilterConfig<Values>[] = [
    { key: 'status', type: 'select', label: 'Status', options: [] },
    { key: 'enabled', type: 'custom', label: 'Enabled', render: () => null },
    { key: 'tags', type: 'custom', label: 'Tags', render: () => null },
    { key: 'scope', type: 'custom', label: 'Scope', render: () => null }
  ];
  expect(filters.map((filter) => isFilterActive(filter, values))).toEqual([
    true,
    true,
    false,
    false
  ]);
  expect(isFilterActive(filters[0]!, { ...values, status: undefined })).toBe(
    false
  );
  expect(isFilterActive(filters[2]!, { ...values, tags: ['team-a'] })).toBe(
    true
  );
  expect(
    isFilterActive(
      { key: 'name', type: 'input', label: 'Name' },
      { ...values, name: '' }
    )
  ).toBe(false);
});

test('lets a custom filter define its own active state', () => {
  const filter: ResponsiveFilterConfig<Values> = {
    key: 'enabled',
    type: 'custom',
    label: 'Enabled',
    render: () => null,
    isActive: (value) => value === true
  };
  expect(isFilterActive(filter, values)).toBe(false);
  expect(isFilterActive(filter, { ...values, enabled: true })).toBe(true);
});

test('clears only supplied popover fields in one patch and honors reset values', () => {
  const filters: ResponsiveFilterConfig<Values>[] = [
    { key: 'status', type: 'select', label: 'Status', options: [] },
    {
      key: 'enabled',
      type: 'custom',
      label: 'Enabled',
      render: () => null,
      clearValue: false
    },
    {
      key: 'tags',
      type: 'custom',
      label: 'Tags',
      render: () => null,
      clearValue: []
    },
    {
      key: 'scope',
      type: 'custom',
      label: 'Scope',
      render: () => null,
      clearValue: null
    }
  ];
  const patch = getFilterClearPatch(filters);
  expect(patch).toEqual({
    status: undefined,
    enabled: false,
    tags: [],
    scope: null
  });
  expect({ ...values, ...patch }.name).toBe(values.name);
  expect(
    getFilterClearPatch([{ key: 'name', type: 'input', label: 'Name' }])
  ).toEqual({ name: '' });
  expect(getFilterClearPatch<Values>([])).toEqual({});
});
