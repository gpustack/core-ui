import { Checkbox } from 'antd';
import React from 'react';
import styled from 'styled-components';
import AutoTooltip from '../auto-tooltip';
import { OverlayScroller } from '../overlay-scroller';

interface ListProps {
  maxHeight?: number;
  dataList: Array<{ key: string; title: string }>;
  value: string[];
  renderTitle?: (item: { key: string; title: string }) => React.ReactNode;
  onChange: (value: string[]) => void;
}

const UL = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
`;

const LI = styled.li<{ selected: boolean }>`
  display: flex;
  align-items: center;
  padding: 5px 12px;
  cursor: pointer;
  border-radius: 2px;
  gap: 8px;
  &:hover {
    background-color: var(--ant-control-item-bg-hover);
  }
`;

const List: React.FC<ListProps> = ({
  maxHeight,
  dataList,
  value,
  onChange,
  renderTitle
}) => {
  const handleClickItem = (item: { key: string; title: string }) => {
    const itemKey = item.key;
    const newValue = value.includes(itemKey)
      ? value.filter((key) => key !== itemKey)
      : [...value, itemKey];
    onChange(newValue);
  };

  return (
    <OverlayScroller style={{ paddingInline: 0 }} maxHeight={maxHeight}>
      <UL>
        {dataList.map((item) => (
          <LI
            key={item.key}
            selected={value.includes(item.key)}
            onClick={() => handleClickItem(item)}
          >
            <Checkbox checked={value.includes(item.key)}></Checkbox>
            {renderTitle ? (
              renderTitle(item)
            ) : (
              <AutoTooltip ghost>{item.title}</AutoTooltip>
            )}
          </LI>
        ))}
      </UL>
    </OverlayScroller>
  );
};

export default List;
