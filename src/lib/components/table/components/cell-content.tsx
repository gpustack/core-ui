import { CheckOutlined, FormOutlined, UndoOutlined } from '@ant-design/icons';
import { Button, Input, InputNumber, Tooltip } from 'antd';
import classNames from 'classnames';
import _ from 'lodash';
import React, { useContext } from 'react';
import styled from 'styled-components';
import { useIntl } from '../../../../lib/hooks/useIntl';
import RowContext from '../row-context';
import { type CellContentProps } from '../types';

const CellContentWrapper = styled.div<{
  $mobile?: boolean;
  $mobileAlign?: 'left' | 'right';
}>`
  max-width: 100%;
  min-width: 0;
  display: flex;
  align-items: center;
  ${(props) =>
    props.$mobile
      ? `
    width: 100%;
    flex: 1;
    overflow: hidden;
    justify-content: ${props.$mobileAlign === 'left' ? 'flex-start' : 'flex-end'};

    > *:first-child:not(.status-tag):not(.cell-intrinsic):not(.ant-tag) {
      flex: 1;
      min-width: 0;
      max-width: 100%;
      width: 100%;
    }

    > .status-tag,
    > .cell-intrinsic,
    > .ant-tag,
    > *:first-child:has(> .ant-tag:only-child) {
      flex: none !important;
      width: max-content !important;
      max-width: 100%;
      margin-left: ${props.$mobileAlign === 'left' ? '0' : 'auto'};
      align-self: ${props.$mobileAlign === 'left' ? 'flex-start' : 'flex-end'};
      justify-content: ${props.$mobileAlign === 'left' ? 'flex-start' : 'flex-end'};
      display: inline-flex !important;
    }
  `
      : ''}
`;

interface EditButtonsProps {
  isEditing: boolean;
  editable?: any;
  handleSubmit: () => void;
  handleUndo: () => void;
  handleEdit: () => void;
}

interface ContentProps {
  isEditing: boolean;
  current: any;
  editable: any;
  onChange: (val: any) => void;
  row?: any;
  render?: (text: any, record: any) => React.ReactNode;
}

const EditButtons: React.FC<EditButtonsProps> = (props) => {
  const intl = useIntl();
  const { isEditing, editable, handleSubmit, handleUndo, handleEdit } = props;
  if (!editable) {
    return null;
  }

  if (isEditing) {
    return (
      <span className="flex-column">
        <Tooltip
          key="confirm"
          title={intl.formatMessage({ id: 'common.button.confirm' })}
        >
          <Button
            type="text"
            size="small"
            className="m-l-10"
            onClick={handleSubmit}
          >
            <CheckOutlined />
          </Button>
        </Tooltip>
        <Tooltip
          title={intl.formatMessage({ id: 'common.button.cancel' })}
          key="undo"
        >
          <Button
            type="text"
            size="small"
            className="m-l-10"
            onClick={handleUndo}
          >
            <UndoOutlined />
          </Button>
        </Tooltip>
      </span>
    );
  }
  return (
    <span className="flex-column">
      <Tooltip
        key="edit"
        title={
          _.isBoolean(editable) ? (
            intl.formatMessage({ id: 'common.button.edit' })
          ) : (
            <span>{editable.title || ''}</span>
          )
        }
      >
        <Button
          type="text"
          size="small"
          className="m-l-10"
          onClick={handleEdit}
        >
          <FormOutlined />
        </Button>
      </Tooltip>
    </span>
  );
};

const Content: React.FC<ContentProps> = (props) => {
  const { editable, current, isEditing, row, render, onChange } = props;
  if (isEditing && editable) {
    const isNumType =
      typeof editable === 'object' && editable?.valueType === 'number';
    return isNumType ? (
      <InputNumber
        style={{ width: '80px' }}
        min={0}
        value={current}
        onChange={onChange}
      />
    ) : (
      <Input value={current} onChange={(e) => onChange(e.target.value)} />
    );
  }

  if (render) {
    return render(current, row);
  }
  return current;
};

const getRowValue = (row: any, dataIndex: CellContentProps['dataIndex']) =>
  _.get(row, dataIndex as any);

const CellContent: React.FC<CellContentProps> = (props) => {
  const { row, onCell, mobile, mobileAlign = 'right' } = useContext(RowContext);
  const { dataIndex, render, editable } = props;
  const [isEditing, setIsEditing] = React.useState(false);
  const [editingValue, setEditingValue] = React.useState(null);
  const showEditable = editable && !mobile;

  const displayValue = isEditing ? editingValue : getRowValue(row, dataIndex);

  const handleEdit = () => {
    setEditingValue(getRowValue(row, dataIndex));
    setIsEditing(true);
  };

  const handleSubmit = async () => {
    await onCell?.(
      {
        ...row,
        [dataIndex as string]: editingValue
      },
      {
        dataIndex: dataIndex as string,
        newValue: editingValue,
        oldValue: getRowValue(row, dataIndex)
      }
    );
    setIsEditing(false);
  };

  const handleUndo = () => {
    setIsEditing(false);
  };

  const handleValueChange = (val: any) => {
    setEditingValue(val);
  };

  const body = (
    <>
      <Content
        onChange={handleValueChange}
        isEditing={isEditing}
        editable={showEditable ? editable : undefined}
        current={displayValue}
        row={row}
        render={render}
      ></Content>
      <EditButtons
        editable={showEditable ? editable : undefined}
        isEditing={isEditing}
        handleEdit={handleEdit}
        handleSubmit={handleSubmit}
        handleUndo={handleUndo}
      ></EditButtons>
    </>
  );

  return (
    <CellContentWrapper
      $mobile={mobile}
      $mobileAlign={mobile ? mobileAlign : undefined}
    >
      {mobile ? (
        <span className={classNames('cell-intrinsic', 'mobile-cell-value')}>
          {body}
        </span>
      ) : (
        body
      )}
    </CellContentWrapper>
  );
};

export default CellContent;
