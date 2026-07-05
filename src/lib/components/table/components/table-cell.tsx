import classNames from 'classnames';
import React, { useContext } from 'react';
import styled from 'styled-components';
import RowContext from '../row-context';
import { type ColumnProps } from '../types';
import CellContent from './cell-content';

const CellWrapper = styled.div`
  padding: var(--ant-table-cell-padding-block)
    var(--ant-table-cell-padding-inline);
  display: flex;
  align-items: center;
  justify-content: flex-start;
  min-height: 68px;
  word-break: break-word;
  min-width: 20px;
  overflow: hidden;
  color: var(--ant-color-text-secondary);

  &.cell-compact {
    min-height: unset;
    padding: 0;
  }

  &.left {
    justify-content: flex-start;
  }

  &.right {
    justify-content: flex-end;
  }

  &.center {
    justify-content: center;
  }
`;

const TableCell: React.FC<ColumnProps> = (props) => {
  const { dataIndex, render, align, editable, dataField } = props;
  const { mobile, mobileAlign = 'right' } = useContext(RowContext);

  return (
    <CellWrapper
      className={classNames('cell', {
        'cell-compact': mobile,
        left: mobile ? mobileAlign === 'left' : align === 'left',
        center: !mobile && align === 'center',
        right: mobile ? mobileAlign === 'right' : align === 'right'
      })}
    >
      <CellContent
        dataIndex={dataField || dataIndex}
        render={render}
        editable={editable}
      ></CellContent>
    </CellWrapper>
  );
};

export default TableCell;
