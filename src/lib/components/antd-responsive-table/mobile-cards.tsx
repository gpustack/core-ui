import type { TableProps } from 'antd';
import { Checkbox, Empty, Spin } from 'antd';
import type { Key, RowSelectMethod } from 'antd/es/table/interface';
import React, { useMemo, useRef } from 'react';
import useWindowResize from '../../hooks/use-window-resize';
import { MobileCardRow } from '../table/mobile-card';
import { getMobileCardColumns } from '../table/mobile-card/mobile-card-utils';
import { type ColumnProps } from '../table/types';
import {
  applyRowSelectChange,
  applySelectAllChange,
  computeSelectAllState,
  getSelectableRowKeys,
  resolveRowKey,
  updateRecordCache
} from './mobile-cards-selection';
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
  const recordCache = useRef<Map<Key, T>>(new Map());

  updateRecordCache(recordCache.current, dataSource, rowKey);

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
  const selectableRowKeys = useMemo(
    () =>
      getSelectableRowKeys(dataSource, rowKey, rowSelection?.getCheckboxProps),
    [dataSource, rowKey, rowSelection?.getCheckboxProps]
  );

  const selectAllState = useMemo(
    () => computeSelectAllState(selectedKeys, selectableRowKeys),
    [selectedKeys, selectableRowKeys]
  );

  const handleSelectAll = (checked: boolean) => {
    if (!rowSelection) return;

    const { keys, rows } = applySelectAllChange(
      checked,
      selectedKeys,
      dataSource,
      rowKey,
      rowSelection.getCheckboxProps,
      recordCache.current
    );
    notifyRowSelectionChange(
      rowSelection,
      keys,
      rows,
      checked ? 'all' : 'none'
    );
  };

  const handleSelectRow = (record: T, index: number, checked: boolean) => {
    if (!rowSelection) return;

    const key = resolveRowKey(record, index, rowKey);
    const { keys, rows } = applyRowSelectChange(
      checked,
      key,
      record,
      selectedKeys,
      dataSource,
      rowKey,
      recordCache.current
    );
    notifyRowSelectionChange(rowSelection, keys, rows, 'single');
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
                disabled={!selectableRowKeys.length}
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
