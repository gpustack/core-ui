import React from 'react';
import { type ColumnProps, type OnSortFn, type TableOrder } from '../types';
import TableHeader from './table-header';

interface HeaderProps {
  columns: ColumnProps[];
  gridTemplate?: string;
  sortDirections?: ('ascend' | 'descend' | null)[];
  sorterList: TableOrder | Array<TableOrder>;
  showSorterTooltip?: boolean;
  onSort?: OnSortFn;
}

const Header: React.FC<HeaderProps> = (props) => {
  const {
    onSort,
    sortDirections,
    sorterList,
    showSorterTooltip,
    gridTemplate
  } = props;

  return (
    <div className="row" style={{ gridTemplateColumns: gridTemplate }}>
      {props.columns?.map((columnProps, i) => {
        const {
          title,
          dataIndex,
          align,
          width,
          headerStyle,
          sortOrder,
          sorter,
          defaultSortOrder
        } = columnProps as ColumnProps;
        return (
          <TableHeader
            key={dataIndex || i}
            onSort={onSort}
            showSorterTooltip={showSorterTooltip}
            sorter={sorter}
            sorterList={sorterList}
            dataIndex={dataIndex}
            sortOrder={sortOrder}
            sortDirections={sortDirections}
            width={width}
            defaultSortOrder={defaultSortOrder}
            title={title}
            style={headerStyle}
            firstCell={i === 0}
            align={align}
            lastCell={i === props.columns.length - 1}
          ></TableHeader>
        );
      })}
    </div>
  );
};

export default Header;
