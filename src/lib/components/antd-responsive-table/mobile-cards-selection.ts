import type { TableProps } from 'antd';
import type { Key } from 'antd/es/table/interface';
import _ from 'lodash';

export function resolveRowKey<T>(
  record: T,
  index: number,
  rowKey?: TableProps<T>['rowKey']
): Key {
  if (typeof rowKey === 'function') {
    return rowKey(record, index);
  }
  if (rowKey != null) {
    return _.get(record, rowKey as string);
  }
  return index;
}

export function resolveSelectedRows<T>(
  keys: Key[],
  records: readonly T[],
  rowKey?: TableProps<T>['rowKey'],
  extraRecords: readonly T[] = [],
  cache?: Map<Key, T>
): T[] {
  const recordByKey = new Map<Key, T>();

  if (cache) {
    cache.forEach((value, key) => {
      recordByKey.set(key, value);
    });
  }

  records.forEach((record, index) => {
    recordByKey.set(resolveRowKey(record, index, rowKey), record);
  });
  extraRecords.forEach((record, index) => {
    recordByKey.set(resolveRowKey(record, index, rowKey), record);
  });

  return keys
    .map((key) => recordByKey.get(key))
    .filter((record): record is T => record !== undefined);
}

export function getSelectableRowKeys<T>(
  dataSource: readonly T[],
  rowKey?: TableProps<T>['rowKey'],
  getCheckboxProps?: (record: T) => { disabled?: boolean }
): Key[] {
  return dataSource
    .filter((record) => !getCheckboxProps?.(record)?.disabled)
    .map((record, index) => resolveRowKey(record, index, rowKey));
}

export function computeSelectAllState(
  selectedKeys: readonly Key[],
  selectableRowKeys: readonly Key[]
): { checked: boolean; indeterminate: boolean } {
  if (!selectableRowKeys.length) {
    return { checked: false, indeterminate: false };
  }

  const selectedKeySet = new Set(selectedKeys);
  const selectedCount = selectableRowKeys.filter((key) =>
    selectedKeySet.has(key)
  ).length;

  return {
    checked: selectedCount === selectableRowKeys.length,
    indeterminate: selectedCount > 0 && selectedCount < selectableRowKeys.length
  };
}

export function updateRecordCache<T>(
  cache: Map<Key, T>,
  dataSource: readonly T[],
  rowKey?: TableProps<T>['rowKey']
): void {
  dataSource.forEach((record, index) => {
    const key = resolveRowKey(record, index, rowKey);
    cache.set(key, record);
  });
}

export function applySelectAllChange<T>(
  checked: boolean,
  selectedKeys: readonly Key[],
  dataSource: readonly T[],
  rowKey?: TableProps<T>['rowKey'],
  getCheckboxProps?: (record: T) => { disabled?: boolean },
  cache?: Map<Key, T>
): { keys: Key[]; rows: T[] } {
  const selectableRowKeys = getSelectableRowKeys(
    dataSource,
    rowKey,
    getCheckboxProps
  );

  if (checked) {
    const keys = _.uniq([...selectedKeys, ...selectableRowKeys]);
    const rows = resolveSelectedRows(keys, dataSource, rowKey, [], cache);
    return { keys, rows };
  }

  const currentSelectableKeySet = new Set(selectableRowKeys);
  const keys = selectedKeys.filter((key) => !currentSelectableKeySet.has(key));
  const rows = resolveSelectedRows(keys, dataSource, rowKey, [], cache);
  return { keys, rows };
}

export function applyRowSelectChange<T>(
  checked: boolean,
  key: Key,
  record: T,
  selectedKeys: readonly Key[],
  dataSource: readonly T[],
  rowKey?: TableProps<T>['rowKey'],
  cache?: Map<Key, T>
): { keys: Key[]; rows: T[] } {
  if (checked) {
    const keys = _.uniq([...selectedKeys, key]);
    const rows = resolveSelectedRows(keys, dataSource, rowKey, [record], cache);
    return { keys, rows };
  }

  const keys = selectedKeys.filter((selectedKey) => selectedKey !== key);
  const rows = resolveSelectedRows(keys, dataSource, rowKey, [], cache);
  return { keys, rows };
}
