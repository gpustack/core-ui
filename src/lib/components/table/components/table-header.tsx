import AutoTooltip from '@/lib/components/auto-tooltip';
import { useIntl } from '@/lib/hooks/useIntl';
import { CaretDownOutlined, CaretUpOutlined } from '@ant-design/icons';
import classNames from 'classnames';
import React from 'react';
import '../styles/header.less';

import { type TableHeaderProps } from '../types';

const TableHeader: React.FC<TableHeaderProps> = (props) => {
  const {
    title,
    style,
    align,
    firstCell,
    lastCell,
    sortOrder,
    sortDirections = ['ascend', 'descend', null],
    defaultSortOrder,
    onSort,
    sorterList,
    sorter = false,
    width,
    dataIndex
  } = props;
  const intl = useIntl();

  // const [currentSortOrder, setCurrentSortOrder] = React.useState<
  //   'ascend' | 'descend' | null
  // >(sortOrder || defaultSortOrder || null);

  const getNextSortOrder = (current: 'ascend' | 'descend' | null) => {
    switch (current) {
      case null:
        return 'ascend';
      case 'ascend':
        return 'descend';
      case 'descend':
        return null;
    }
  };

  const nextSortTips = () => {
    if (!currentSortOrder) {
      return intl.formatMessage({ id: 'common.sorter.tips.ascend' });
    }
    if (currentSortOrder === 'ascend') {
      return intl.formatMessage({ id: 'common.sorter.tips.descend' });
    }
    return intl.formatMessage({ id: 'common.sorter.tips.cancel' });
  };

  const computeSortOrder = (
    sorterList: any,
    dataIndex: string,
    sortOrder?: any,
    defaultSortOrder?: any
  ) => {
    if (!sorterList) return sortOrder || defaultSortOrder || null;

    if (Array.isArray(sorterList)) {
      const item = sorterList.find(
        (i) => i.columnKey === dataIndex || i.field === dataIndex
      );
      return item?.order || null;
    }

    if (sorterList.columnKey === dataIndex || sorterList.field === dataIndex) {
      return sorterList.order;
    }

    return null;
  };

  const currentSortOrder = computeSortOrder(
    sorterList,
    dataIndex,
    sortOrder,
    defaultSortOrder
  );

  const handleOnSort = () => {
    const next = getNextSortOrder(currentSortOrder);
    onSort?.(
      {
        columnKey: dataIndex,
        field: dataIndex,
        order: next
      },
      sorter
    );
  };

  // useEffect(() => {
  //   if (!sorterList) {
  //     setCurrentSortOrder(null);
  //     return;
  //   }

  //   if (Array.isArray(sorterList)) {
  //     const sortItem = sorterList.find(
  //       (item) => item.columnKey === dataIndex || item.field === dataIndex
  //     );
  //     setCurrentSortOrder(sortItem?.order || null);
  //   } else {
  //     if (
  //       sorterList.columnKey === dataIndex ||
  //       sorterList.field === dataIndex
  //     ) {
  //       setCurrentSortOrder(sorterList.order);
  //     } else {
  //       setCurrentSortOrder(null);
  //     }
  //   }
  // }, [sorterList, dataIndex]);

  return (
    <div
      style={{ width, ...style }}
      className={classNames('table-header', {
        'table-header-left': align === 'left',
        'table-header-center': align === 'center',
        'table-header-right': align === 'right',
        'table-header-first': firstCell,
        'table-header-last': lastCell,
        'table-header-sorter': sorter
      })}
    >
      {sorter ? (
        <span className="sorter-header" onClick={handleOnSort}>
          <AutoTooltip ghost>
            <span className="table-header-cell">{title}</span>
          </AutoTooltip>
          <span className="sorter">
            <CaretUpOutlined
              className={classNames('sorter-up', {
                'sorter-active': currentSortOrder === 'ascend'
              })}
            ></CaretUpOutlined>
            <CaretDownOutlined
              className={classNames('sorter-down', {
                'sorter-active': currentSortOrder === 'descend'
              })}
            ></CaretDownOutlined>
          </span>
        </span>
      ) : (
        <AutoTooltip ghost>
          <span className="table-header-cell">{title}</span>
        </AutoTooltip>
      )}
    </div>
  );
};

export default TableHeader;
