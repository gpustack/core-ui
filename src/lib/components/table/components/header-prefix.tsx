import { Button, Checkbox } from 'antd';
import _ from 'lodash';
import React from 'react';
import styled from 'styled-components';
import IconFont from '../../../../lib/components/icon-font';
import { useIntl } from '../../../../lib/hooks/useIntl';

const ExpandSlot = styled.span`
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 30px;
  margin-right: 5px;
`;

interface HeaderPrefixProps {
  expandable?: boolean | React.ReactNode;
  enableSelection?: boolean;
  onSelectAll?: (e: any) => void;
  onExpandAll?: (e: any) => void;
  expandAll?: boolean;
  indeterminate?: boolean;
  selectAll?: boolean;
  hasColumns?: boolean;
  disabled?: boolean;
}

const HeaderPrefix: React.FC<HeaderPrefixProps> = (props) => {
  const {
    hasColumns,
    expandable,
    enableSelection,
    onSelectAll,
    onExpandAll,
    indeterminate,
    selectAll,
    expandAll,
    disabled
  } = props;

  const intl = useIntl();

  const handleToggleExpand = () => {
    onExpandAll?.(!expandAll);
  };

  const handleUnCheckAll = () => {
    onSelectAll?.({
      target: {
        checked: false
      }
    });
  };

  if (!hasColumns) {
    return null;
  }
  if (expandable && enableSelection) {
    return (
      <div className="header-row-prefix-wrapper flex-center">
        <ExpandSlot>
          {_.isBoolean(expandable) ? (
            <Button type="text" size="small" onClick={handleToggleExpand}>
              {expandAll ? (
                <IconFont
                  type="icon-collapse_all"
                  className="font-size-16"
                ></IconFont>
              ) : (
                <IconFont
                  type="icon-uncollapse_all"
                  className="font-size-16"
                ></IconFont>
              )}
            </Button>
          ) : (
            expandable
          )}
        </ExpandSlot>
        <Checkbox
          onChange={onSelectAll}
          indeterminate={indeterminate}
          checked={selectAll}
          disabled={disabled}
        ></Checkbox>
      </div>
    );
  }
  if (expandable) {
    return (
      <div className="header-row-prefix-wrapper flex-center">
        <ExpandSlot>
          {_.isBoolean(expandable) ? (
            <Button type="text" size="small" onClick={handleToggleExpand}>
              {expandAll ? (
                <IconFont
                  type="icon-collapse_all"
                  className="font-size-16"
                ></IconFont>
              ) : (
                <IconFont
                  type="icon-uncollapse_all"
                  className="font-size-16"
                ></IconFont>
              )}
            </Button>
          ) : (
            expandable
          )}
        </ExpandSlot>
      </div>
    );
  }
  if (enableSelection) {
    return (
      <div className="header-row-prefix-wrapper">
        {<Checkbox disabled={disabled}></Checkbox>}
      </div>
    );
  }
  return null;
};

export default HeaderPrefix;
