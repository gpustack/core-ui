import classNames from 'classnames';
import React from 'react';
import TableCell from '../components/table-cell';
import RowContext from '../row-context';
import { type ColumnProps } from '../types';
import {
  getMobileColumnGroups,
  getMobileColumnLabel,
  isSealTableColumn,
  renderMobileCardValue
} from './mobile-card-utils';

export interface MobileCardRowProps {
  record: Record<string, any>;
  rowIndex: number;
  columns: ColumnProps[];
  checked?: boolean;
  prefix?: React.ReactNode;
  expandedContent?: React.ReactNode;
  onCell?: (
    record: any,
    data: { dataIndex: string; newValue: any; oldValue: any }
  ) => any;
  rowProps?: React.HTMLAttributes<HTMLDivElement>;
}

const MobileCardRow: React.FC<MobileCardRowProps> = ({
  record,
  rowIndex,
  columns,
  checked,
  prefix,
  expandedContent,
  onCell,
  rowProps
}) => {
  const { primaryColumn, detailColumns, operationColumn } =
    getMobileColumnGroups(columns);

  const rowContextValue = {
    row: { ...record, rowIndex },
    onCell,
    mobile: true
  };

  return (
    <RowContext.Provider value={rowContextValue}>
      <div className="row-box mobile-table-card-box" {...rowProps}>
        <div
          className={classNames('mobile-table-card', {
            'mobile-table-card-selected': checked
          })}
        >
          <div className="mobile-table-card-header">
            <div className="mobile-table-card-header-main">
              {prefix}
              {primaryColumn && (
                <RowContext.Provider
                  value={{ ...rowContextValue, mobileAlign: 'left' }}
                >
                  <div className="mobile-table-card-title">
                    <TableCell {...primaryColumn}></TableCell>
                  </div>
                </RowContext.Provider>
              )}
            </div>
            {operationColumn && (
              <div className="mobile-table-card-header-actions">
                <TableCell {...operationColumn}></TableCell>
              </div>
            )}
          </div>
          {detailColumns.length > 0 && (
            <div className="mobile-table-card-body">
              {detailColumns.map((column) => (
                <div
                  className="mobile-table-card-field"
                  key={String(column.key || column.dataIndex)}
                >
                  <div className="mobile-table-card-label">
                    {getMobileColumnLabel(column)}
                  </div>
                  <div className="mobile-table-card-value">
                    {isSealTableColumn(column) ? (
                      <TableCell {...column}></TableCell>
                    ) : (
                      <div className="mobile-table-card-value-inner">
                        {renderMobileCardValue(column, record, rowIndex)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        {expandedContent}
      </div>
    </RowContext.Provider>
  );
};

export default MobileCardRow;
