import { Pagination, Spin, theme, type PaginationProps } from 'antd';
import _ from 'lodash';
import React, { useMemo } from 'react';
import Header from './components/header';
import HeaderPrefix from './components/header-prefix';
import RowChildren from './components/row-children';
import TableBody from './components/table-body';
import './styles/index.less';
import { type ColumnProps, type TableProps } from './types';
import useSorter from './use-sorter';

// Fixed control widths reserved inside the row prefix gutter. Kept as
// constants so the header prefix, row prefix and any expanded child row all
// derive the SAME gutter width and therefore align by construction.
const PREFIX_EXPAND_WIDTH = 35; // expand toggle button (30) + margin (5)
const PREFIX_SELECT_WIDTH = 24; // selection checkbox

const Table: React.FC<TableProps & { pagination?: PaginationProps }> = (
  props
) => {
  const {
    columns,
    children,
    rowKey,
    childParentKey,
    onExpand,
    onExpandAll,
    onTableSort,
    onCell,
    expandedRowKeys,
    loading,
    loadend,
    expandable,
    pollingChildren,
    watchChildren,
    rowSelection,
    pagination,
    empty,
    emptyMinHeight,
    sortDirections,
    showSorterTooltip,
    renderChildren,
    loadChildren,
    loadChildrenAPI
  } = props;
  const { handleOnTableSort, sorterList } = useSorter({
    onTableSort,
    columns
  });
  const { token } = theme.useToken();
  const parsedColumns = useMemo(() => {
    if (columns) return columns;

    return React.Children.toArray(children)
      .filter(React.isValidElement)
      .map((child) => {
        const column = child as React.ReactElement<ColumnProps>;
        const { title, dataIndex, key, render, ...restProps } = column.props;

        return {
          title,
          dataIndex,
          key: key || dataIndex,
          render,
          ...restProps
        };
      });
  }, [columns, children]);

  // Shared column template for header and body so their columns always align.
  // A column with an explicit `width` becomes a fixed px track; otherwise its
  // `span` becomes a proportional fr track. `minmax(0, …fr)` lets a track shrink
  // below its content width so long text wraps/clips instead of blowing out.
  // `minWidth` raises that shrink floor; `maxWidth` caps growth — the track then
  // sizes up to the cap instead of sharing leftover space proportionally, since
  // a grid growth limit cannot mix px with fr.
  const gridTemplate = useMemo(() => {
    return parsedColumns
      .map((col) => {
        if (col.width) return `${col.width}px`;
        const min = col.minWidth ? `${col.minWidth}px` : '0';
        const max = col.maxWidth ? `${col.maxWidth}px` : `${col.span ?? 1}fr`;
        return `minmax(${min}, ${max})`;
      })
      .join(' ');
  }, [parsedColumns]);

  // Fixed width of the left prefix gutter (expand toggle + selection
  // checkbox). Shared by header prefix, every row prefix and the expanded
  // child rows so their column tracks all start at the same x offset.
  const prefixWidth = (() => {
    const hasExpand = !!expandable;
    const hasSelect = !!rowSelection?.enableSelection;
    if (!hasExpand && !hasSelect) return 0;
    const paddingInline = token.Table?.cellPaddingInline ?? 16;
    return (
      paddingInline +
      (hasExpand ? PREFIX_EXPAND_WIDTH : 0) +
      (hasSelect ? PREFIX_SELECT_WIDTH : 0)
    );
  })();

  const expandAll = (() => {
    const data = props.dataSource;
    const keys = expandedRowKeys;

    if (!keys?.length || !data?.length) return false;

    const keySet = new Set(keys);

    for (let i = 0; i < data.length; i++) {
      const key = data[i][rowKey];
      if (!keySet.has(key)) return false;
    }

    return true;
  })();

  const selectState = useMemo(() => {
    const selectedRowKeys = rowSelection?.selectedRowKeys || [];
    const selectedKeys = new Set(selectedRowKeys);
    const allRowKeys = props.dataSource.map((record) => record[rowKey]);
    if (!selectedRowKeys?.length) {
      return {
        selectAll: false,
        indeterminate: false
      };
    }
    if (allRowKeys.every((key) => selectedKeys.has(key))) {
      return {
        selectAll: true,
        indeterminate: false
      };
    }
    return {
      selectAll: false,
      indeterminate: true
    };
  }, [rowSelection?.selectedRowKeys, props.dataSource, rowKey]);

  const selectAllRows = () => {
    const allKeys = new Set([
      ...props.dataSource.map((record) => record[rowKey]),
      ...(rowSelection?.selectedRowKeys || [])
    ]);
    const allDatas = _.uniqBy(
      [...props.dataSource, ...(rowSelection?.selectedRows || [])],
      (record: any) => record[rowKey]
    );

    rowSelection?.onChange([...allKeys], allDatas);
  };

  const deselectAllRows = () => {
    const currentKeys = props.dataSource.map((record) => record[rowKey]);
    rowSelection?.removeSelectedKeys?.(currentKeys);
  };

  const handleSelectAllChange = (e: any) => {
    if (e.target.checked) {
      selectAllRows();
    } else {
      deselectAllRows();
    }
  };

  const handleExpandAll = (value: boolean) => {
    onExpandAll?.(value);
  };

  const handlePageChange = (page: number, pageSize: number) => {
    pagination?.onChange?.(page, pageSize);
  };

  const handlePageSizeChange = (current: number, size: number) => {
    pagination?.onShowSizeChange?.(current, size);
  };

  // Expose the antd Table theme tokens as CSS variables so the less files can
  // consume them via `var(--ant-table-*)`. Inline (not a styled wrapper)
  // because the values are resolved from the runtime theme token.
  const tableToken: any = token.Table ?? {};
  const wrapperStyle = {
    width: '100%',
    '--ant-table-cell-padding-inline': `${tableToken.cellPaddingInline}px`,
    '--ant-table-cell-padding-block': `${tableToken.cellPaddingBlock}px`,
    '--ant-table-header-border-radius': `${tableToken.headerBorderRadius}px`,
    '--ant-table-header-split-color': tableToken.headerSplitColor,
    '--ant-table-row-selected-bg': tableToken.rowSelectedBg,
    '--ant-table-row-selected-hover-bg': tableToken.rowSelectedHoverBg,
    '--ant-table-row-hover-bg': tableToken.rowHoverBg,
    '--ant-table-header-icon-color': token.colorTextQuaternary,
    '--ant-table-header-icon-hover-color': token.colorTextSecondary
  } as React.CSSProperties;

  return (
    <div style={wrapperStyle}>
      <div className="seal-table-container">
        <div className="header-row-wrapper">
          <HeaderPrefix
            prefixWidth={prefixWidth}
            selectAll={selectState.selectAll}
            indeterminate={selectState.indeterminate}
            onSelectAll={handleSelectAllChange}
            onExpandAll={handleExpandAll}
            expandAll={expandAll}
            expandable={expandable}
            enableSelection={rowSelection?.enableSelection}
            disabled={!props.dataSource?.length}
            hasColumns={parsedColumns.length > 0}
          ></HeaderPrefix>
          <Header
            onSort={handleOnTableSort}
            columns={parsedColumns}
            gridTemplate={gridTemplate}
            sortDirections={sortDirections}
            sorterList={sorterList}
            showSorterTooltip={showSorterTooltip}
          ></Header>
        </div>
        <Spin spinning={loading} size="middle">
          <TableBody
            empty={empty}
            emptyMinHeight={emptyMinHeight}
            dataSource={props.dataSource}
            columns={parsedColumns}
            gridTemplate={gridTemplate}
            prefixWidth={prefixWidth}
            rowSelection={rowSelection}
            expandable={expandable}
            rowKey={rowKey}
            childParentKey={childParentKey}
            pollingChildren={pollingChildren}
            watchChildren={watchChildren}
            renderChildren={renderChildren}
            loadChildren={loadChildren}
            loadChildrenAPI={loadChildrenAPI}
            onCell={onCell}
            onExpand={onExpand}
            expandedRowKeys={expandedRowKeys}
          />
        </Spin>
      </div>
      {pagination && (
        <div className="pagination-wrapper">
          <Pagination
            {...pagination}
            onChange={handlePageChange}
            onShowSizeChange={handlePageSizeChange}
          ></Pagination>
        </div>
      )}
    </div>
  );
};

(Table as any).RowChildren = RowChildren;

export default Table;
