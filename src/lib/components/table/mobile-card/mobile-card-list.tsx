import _ from 'lodash';
import React, { useMemo } from 'react';
import useWindowResize from '../../../hooks/use-window-resize';
import { type ColumnProps } from '../types';
import MobileCardRow from './mobile-card-row';
import { getMobileCardColumns } from './mobile-card-utils';

export interface MobileCardListProps {
  columns: ColumnProps[];
  records: Record<string, any>[];
  rowKey?: string | ((record: Record<string, any>, index: number) => React.Key);
  className?: string;
}

function resolveRowKey(
  record: Record<string, any>,
  index: number,
  rowKey: MobileCardListProps['rowKey']
): React.Key {
  if (typeof rowKey === 'function') {
    return rowKey(record, index);
  }
  if (rowKey != null) {
    return _.get(record, rowKey);
  }
  return index;
}

const MobileCardList: React.FC<MobileCardListProps> = ({
  columns,
  records,
  rowKey = 'id',
  className
}) => {
  const { size } = useWindowResize();
  const cardColumns = useMemo(
    () => getMobileCardColumns(columns, size.width),
    [columns, size.width]
  );

  if (!records.length) {
    return null;
  }

  return (
    <div className={className}>
      {records.map((record, index) => (
        <MobileCardRow
          key={resolveRowKey(record, index, rowKey)}
          record={record}
          rowIndex={index}
          columns={cardColumns}
        />
      ))}
    </div>
  );
};

export default MobileCardList;
