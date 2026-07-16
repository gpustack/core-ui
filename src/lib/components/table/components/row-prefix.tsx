import { Button, Checkbox } from 'antd';
import classNames from 'classnames';
import _ from 'lodash';
import React, { useMemo } from 'react';
import styled from 'styled-components';
import IconFont from '../../../../lib/components/icon-font';

const ButtonWrapper = styled.div`
  width: 30px;
  margin-right: 5px;
  &.disable-expand {
    .ant-btn {
      display: none;
    }
  }
`;

interface RowPrefixProps {
  expandable?: boolean | React.ReactNode;
  enableSelection?: boolean;
  expanded?: boolean;
  checked?: boolean;
  disableExpand?: boolean;
  prefixWidth?: number;
  handleRowExpand?: () => void;
  handleSelectChange?: (e: any) => void;
}

const RowPrefix: React.FC<RowPrefixProps> = (props) => {
  const {
    expandable,
    enableSelection,
    expanded,
    checked,
    disableExpand,
    prefixWidth,
    handleRowExpand,
    handleSelectChange
  } = props;

  const isExpanded = useMemo(() => {
    return expanded;
  }, [expanded]);

  // Fixed gutter shared with the header prefix and expanded child rows.
  const wrapperStyle: React.CSSProperties = {
    width: prefixWidth,
    boxSizing: 'border-box'
  };

  if (expandable && enableSelection) {
    return (
      <div className="row-prefix-wrapper" style={wrapperStyle}>
        <ButtonWrapper
          className={classNames({ 'disable-expand': disableExpand })}
        >
          {_.isBoolean(expandable) ? (
            <Button type="text" size="small" onClick={handleRowExpand}>
              <IconFont
                type="icon-down"
                rotate={isExpanded ? 0 : -90}
                style={{ fontSize: '12px' }}
              ></IconFont>
            </Button>
          ) : (
            expandable
          )}
        </ButtonWrapper>
        <Checkbox onChange={handleSelectChange} checked={checked}></Checkbox>
      </div>
    );
  }
  if (expandable) {
    return (
      <div className="row-prefix-wrapper" style={wrapperStyle}>
        <ButtonWrapper
          className={classNames({ 'disable-expand': disableExpand })}
        >
          {_.isBoolean(expandable) ? (
            <Button
              type="text"
              size="small"
              onClick={handleRowExpand}
              disabled={disableExpand}
            >
              <IconFont
                type="icon-down"
                rotate={isExpanded ? 0 : -90}
                style={{ fontSize: '12px' }}
              ></IconFont>
            </Button>
          ) : (
            expandable
          )}
        </ButtonWrapper>
      </div>
    );
  }
  if (enableSelection) {
    return (
      <div className="row-prefix-wrapper" style={wrapperStyle}>
        {<Checkbox onChange={handleSelectChange} checked={checked}></Checkbox>}
      </div>
    );
  }
  return null;
};

export default RowPrefix;
