import { Pagination, Spin, theme, type PaginationProps } from 'antd';
import classNames from 'classnames';
import _ from 'lodash';
import React, { useMemo } from 'react';
import styled from 'styled-components';
import useWindowResize from '../../hooks/use-window-resize';
import { filterResponsiveColumns } from '../../utils/filter-responsive-columns';
import Header from './components/header';
import HeaderPrefix from './components/header-prefix';
import RowChildren from './components/row-children';
import TableBody from './components/table-body';
import { getMobileCardColumns } from './mobile-card/mobile-card-utils';
import './styles/index.less';
import { type ColumnProps, type TableProps } from './types';
import useSorter from './use-sorter';

const Wrapper = styled.div<{ $token: any }>`
  width: 100%;
  max-width: 100%;
  min-width: 0;
  --ant-table-cell-padding-inline: ${(props) =>
    props.$token.cellPaddingInline}px;
  --ant-table-cell-padding-block: ${(props) => props.$token.cellPaddingBlock}px;
  --ant-table-header-border-radius: ${(props) =>
    props.$token.headerBorderRadius}px;
  --ant-table-header-split-color: ${(props) => props.$token.headerSplitColor};
  --ant-table-row-selected-bg: ${(props) => props.$token.rowSelectedBg};
  --ant-table-row-selected-hover-bg: ${(props) =>
    props.$token.rowSelectedHoverBg};
  --ant-table-row-hover-bg: ${(props) => props.$token.rowHoverBg};
  --ant-table-header-icon-color: ${(props) =>
    props.$token.tableHeaderIconColor};
  --ant-table-header-icon-hover-color: ${(props) =>
    props.$token.tableHeaderIconHoverColor};
`;

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
  const { size, isMobile } = useWindowResize();
  const parsedColumns = useMemo(() => {
    let cols: ColumnProps[];
    if (columns) {
      cols = columns;
    } else {
      cols = React.Children.toArray(children)
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
    }
    return cols;
  }, [columns, children]);

  const visibleColumns = useMemo(
    () => filterResponsiveColumns(parsedColumns, size.width),
    [parsedColumns, size.width]
  );

  const tableColumns = useMemo(() => {
    if (isMobile) {
      return getMobileCardColumns(parsedColumns, size.width);
    }
    return visibleColumns;
  }, [isMobile, parsedColumns, size.width, visibleColumns]);

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

  const paginationSize = isMobile ? 'small' : pagination?.size;

  return (
    <Wrapper
      $token={{
        ...token.Table,
        tableHeaderIconColor: token.colorTextQuaternary,
        tableHeaderIconHoverColor: token.colorTextSecondary,
        colorBorderSecondary: token.colorBorderSecondary
      }}
    >
      <div
        className={classNames('seal-table-container', {
          'seal-table-scroll': !isMobile,
          'seal-table-mobile': isMobile
        })}
      >
        <div className="header-row-wrapper">
          <HeaderPrefix
            selectAll={selectState.selectAll}
            indeterminate={selectState.indeterminate}
            onSelectAll={handleSelectAllChange}
            onExpandAll={handleExpandAll}
            expandAll={expandAll}
            expandable={expandable}
            enableSelection={rowSelection?.enableSelection}
            disabled={!props.dataSource?.length}
            hasColumns={visibleColumns.length > 0}
          ></HeaderPrefix>
          {!isMobile && (
            <Header
              onSort={handleOnTableSort}
              columns={visibleColumns}
              sortDirections={sortDirections}
              sorterList={sorterList}
              showSorterTooltip={showSorterTooltip}
            ></Header>
          )}
        </div>
        <Spin spinning={loading} size="middle">
          <TableBody
            empty={empty}
            dataSource={props.dataSource}
            columns={tableColumns}
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
            mobile={isMobile}
          />
        </Spin>
      </div>
      {pagination && (
        <div className="pagination-wrapper">
          <Pagination
            {...pagination}
            size={paginationSize}
            onChange={handlePageChange}
            onShowSizeChange={handlePageSizeChange}
          ></Pagination>
        </div>
      )}
    </Wrapper>
  );
};

(Table as any).RowChildren = RowChildren;

export default Table;
