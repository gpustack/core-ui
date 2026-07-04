import { Pagination, Table, type TableProps } from 'antd';
import classNames from 'classnames';
import useWindowResize from '../../hooks/use-window-resize';
import '../table/styles/index.less';
import MobileCards from './mobile-cards';
import { normalizeAntdColumns } from './utils';

export type AntdResponsiveTableProps<T extends object = any> = TableProps<T>;

const AntdResponsiveTable = <T extends object = any>(
  props: AntdResponsiveTableProps<T>
) => {
  const { isMobile, isTablet } = useWindowResize();
  const {
    pagination,
    scroll,
    className,
    columns,
    dataSource,
    rowKey,
    rowSelection,
    loading,
    locale,
    onRow,
    ...restProps
  } = props;

  const tableColumns = normalizeAntdColumns(columns);

  if (isMobile) {
    const paginationNode =
      pagination && typeof pagination === 'object' ? (
        <div className="pagination-wrapper">
          <Pagination {...pagination} size={pagination.size ?? 'small'} />
        </div>
      ) : null;

    return (
      <>
        <MobileCards
          columns={tableColumns}
          dataSource={dataSource}
          rowKey={rowKey}
          rowSelection={rowSelection}
          loading={loading}
          locale={locale}
          onRow={onRow}
        />
        {paginationNode}
      </>
    );
  }

  const tabletScroll =
    isTablet && !scroll?.x ? { ...scroll, x: 'max-content' } : scroll;

  return (
    <Table<T>
      {...restProps}
      className={classNames(className, { 'scroll-table': isTablet })}
      columns={tableColumns}
      dataSource={dataSource}
      rowKey={rowKey}
      rowSelection={rowSelection}
      loading={loading}
      locale={locale}
      onRow={onRow}
      pagination={pagination}
      scroll={tabletScroll}
    />
  );
};

export default AntdResponsiveTable;
