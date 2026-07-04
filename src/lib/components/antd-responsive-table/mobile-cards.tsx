import type { TableProps } from 'antd';
import { Checkbox, Empty, Spin } from 'antd';
import type { Key, RowSelectMethod } from 'antd/es/table/interface';
import _ from 'lodash';
import React, { useMemo } from 'react';
import useWindowResize from '../../hooks/use-window-resize';
import { MobileCardRow } from '../table/mobile-card';
import { getMobileCardColumns } from '../table/mobile-card/mobile-card-utils';
import { type ColumnProps } from '../table/types';
import { normalizeAntdColumns } from './utils';

type MobileCardsProps<T> = Pick<
  TableProps<T>,
  | 'columns'
  | 'dataSource'
  | 'rowKey'
  | 'rowSelection'
  | 'loading'
  | 'locale'
  | 'onRow'
> & {
  empty?: React.ReactNode;
};

function resolveRowKey<T>(
  record: T,
  index: number,
  rowKey?: TableProps<T>['rowKey']
) {
  if (typeof rowKey === 'function') {
    return rowKey(record, index);
  }
  if (rowKey != null) {
    return _.get(record, rowKey as string);
  }
  return index;
}

function resolveSelectedRows<T>(
  keys: Key[],
  records: readonly T[],
  rowKey?: TableProps<T>['rowKey'],
  extraRecords: readonly T[] = []
): T[] {
  const recordByKey = new Map<Key, T>();
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

function notifyRowSelectionChange<T>(
  rowSelection: NonNullable<TableProps<T>['rowSelection']>,
  nextKeys: Key[],
  nextRows: T[],
  type: RowSelectMethod
) {
  rowSelection.onChange?.(nextKeys, nextRows, { type });
}

function resolveTableLoading(loading: TableProps<unknown>['loading']) {
  if (typeof loading === 'boolean') {
    return { spinning: loading, size: 'middle' as const };
  }
  if (loading && typeof loading === 'object') {
    return {
      spinning: !!loading.spinning,
      size: loading.size ?? ('middle' as const)
    };
  }
  return { spinning: false, size: 'middle' as const };
}

function SelectionCheckbox(props: React.ComponentProps<typeof Checkbox>) {
  return (
    <div className="row-prefix-wrapper row-prefix-wrapper--no-expand">
      <Checkbox {...props} />
    </div>
  );
}

const MobileCards = <T extends object>({
  columns = [],
  dataSource = [],
  rowKey,
  rowSelection,
  loading,
  locale,
  onRow,
  empty
}: MobileCardsProps<T>) => {
  const { size } = useWindowResize();
  const normalizedColumns = useMemo(
    () => (normalizeAntdColumns(columns) ?? []) as ColumnProps[],
    [columns]
  );
  const cardColumns = useMemo(
    () => getMobileCardColumns(normalizedColumns, size.width),
    [normalizedColumns, size.width]
  );

  const selectedKeys = rowSelection?.selectedRowKeys ?? [];
  const selectedKeySet = useMemo(() => new Set(selectedKeys), [selectedKeys]);
  const allRowKeys = useMemo(
    () =>
      dataSource.map((record, index) => resolveRowKey(record, index, rowKey)),
    [dataSource, rowKey]
  );

  const selectAllState = useMemo(() => {
    if (!rowSelection || !allRowKeys.length) {
      return { checked: false, indeterminate: false };
    }
    const selectedCount = allRowKeys.filter((key) =>
      selectedKeySet.has(key)
    ).length;
    return {
      checked: selectedCount === allRowKeys.length,
      indeterminate: selectedCount > 0 && selectedCount < allRowKeys.length
    };
  }, [allRowKeys, rowSelection, selectedKeySet]);

  const handleSelectAll = (checked: boolean) => {
    if (!rowSelection) return;

    if (checked) {
      const nextKeys = _.uniq([...selectedKeys, ...allRowKeys]);
      const nextRows = resolveSelectedRows(nextKeys, dataSource, rowKey);
      notifyRowSelectionChange(rowSelection, nextKeys, nextRows, 'all');
      return;
    }

    const currentKeySet = new Set(allRowKeys);
    const nextKeys = selectedKeys.filter((key) => !currentKeySet.has(key));
    const nextRows = resolveSelectedRows(nextKeys, dataSource, rowKey);
    notifyRowSelectionChange(rowSelection, nextKeys, nextRows, 'none');
  };

  const handleSelectRow = (record: T, index: number, checked: boolean) => {
    if (!rowSelection) return;

    const key = resolveRowKey(record, index, rowKey);

    if (checked) {
      const nextKeys = _.uniq([...selectedKeys, key]);
      const nextRows = resolveSelectedRows(nextKeys, dataSource, rowKey, [
        record
      ]);
      notifyRowSelectionChange(rowSelection, nextKeys, nextRows, 'single');
      return;
    }

    const nextKeys = selectedKeys.filter((selectedKey) => selectedKey !== key);
    const nextRows = resolveSelectedRows(nextKeys, dataSource, rowKey);
    notifyRowSelectionChange(rowSelection, nextKeys, nextRows, 'single');
  };

  const emptyDescription =
    typeof locale?.emptyText === 'function'
      ? locale.emptyText()
      : locale?.emptyText;

  const emptyNode = empty ?? (
    <Empty
      image={Empty.PRESENTED_IMAGE_SIMPLE}
      description={emptyDescription}
    />
  );

  const { spinning, size: spinSize } = resolveTableLoading(loading);

  return (
    <Spin spinning={spinning} size={spinSize}>
      <div
        className="antd-responsive-table-mobile-wrap"
        style={{ width: '100%' }}
      >
        <div
          className="seal-table-container seal-table-mobile"
          style={{ width: '100%' }}
        >
          {rowSelection && (
            <div className="header-row-wrapper">
              <SelectionCheckbox
                checked={selectAllState.checked}
                indeterminate={selectAllState.indeterminate}
                disabled={!dataSource.length}
                onChange={(event) => handleSelectAll(event.target.checked)}
              />
            </div>
          )}
          <div className="seal-table-content">
            {!dataSource.length ? (
              <div className="empty-wrapper">{emptyNode}</div>
            ) : (
              dataSource.map((record, index) => {
                const key = resolveRowKey(record, index, rowKey);
                const checked = selectedKeySet.has(key);
                const rowProps = onRow?.(record, index) ?? {};

                return (
                  <MobileCardRow
                    key={String(key)}
                    record={record as Record<string, any>}
                    rowIndex={index}
                    columns={cardColumns}
                    checked={checked}
                    rowProps={rowProps}
                    prefix={
                      rowSelection ? (
                        <SelectionCheckbox
                          checked={checked}
                          disabled={
                            rowSelection.getCheckboxProps?.(record)?.disabled
                          }
                          onChange={(event) =>
                            handleSelectRow(record, index, event.target.checked)
                          }
                        />
                      ) : undefined
                    }
                  />
                );
              })
            )}
          </div>
        </div>
      </div>
    </Spin>
  );
};

export default MobileCards;
