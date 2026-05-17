import { SearchOutlined } from '@ant-design/icons';
import { Button, Checkbox, Empty, Input } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { useIntl } from '../../../lib/hooks/useIntl';
import List from './list';
import SelectedList from './selected-list';

const PanelWrapper = styled.div<{ $maxHeight?: number; $leftWidth?: number }>`
  border: 1px solid var(--ant-color-border);
  border-radius: var(--ant-border-radius);
  overflow-y: auto;
  max-height: ${({ $maxHeight }) =>
    $maxHeight ? `${$maxHeight + 2}px` : 'auto'};
`;

const Left = styled.div`
  padding: 0;
`;
const Right = styled.div``;

const Header = styled.div`
  padding: 8px 12px 8px;
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--ant-color-split);
  background-color: var(--ant-color-fill-alter);
`;

interface SelectPanelProps {
  searchPlaceholder?: string;
  height?: number;
  leftWidth?: number;
  options: Array<{ key: string; title: string }>;
  value: string[];
  notFoundContent?: React.ReactNode;
  onChange: (value: string[]) => void;
  styles?: {
    container?: React.CSSProperties;
    left?: React.CSSProperties;
    right?: React.CSSProperties;
    header?: React.CSSProperties;
  };
}

const SelectPanel: React.FC<SelectPanelProps> = ({
  height = 300,
  leftWidth = 260,
  options,
  value,
  searchPlaceholder,
  notFoundContent,
  onChange,
  styles
}) => {
  const intl = useIntl();
  const [indeterminate, setIndeterminate] = React.useState(false);
  const [checkAll, setCheckAll] = React.useState(false);
  const [searchText, setSearchText] = useState('');

  const showOptions = useMemo(() => {
    return options.filter((item) =>
      item.title.toLowerCase().includes(searchText.toLowerCase())
    );
  }, [options, searchText]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value);
  };

  const handleOnUnselect = (
    key: string,
    newSelectedKeys: { key: string; title: string }[]
  ) => {
    onChange(newSelectedKeys.map((item) => item.key));
  };

  const handleCheckAllChange = (e: any) => {
    const checked = e.target.checked;
    setCheckAll(checked);
    setIndeterminate(false);
    if (checked) {
      const allKeys = options
        .filter((item) =>
          item.title.toLowerCase().includes(searchText.toLowerCase())
        )
        .map((item) => item.key);
      onChange(Array.from(new Set([...value, ...allKeys])));
    } else {
      const filteredKeys = options
        .filter((item) =>
          item.title.toLowerCase().includes(searchText.toLowerCase())
        )
        .map((item) => item.key);
      const newSelectedKeys = value.filter(
        (key) => !filteredKeys.includes(key)
      );
      onChange(newSelectedKeys);
    }
  };

  const updateCheckStatus = (newSelectedKeys: string[]) => {
    if (options.length === 0) {
      setIndeterminate(false);
      setCheckAll(false);
      return;
    }
    const filteredOptions = options.filter((item) =>
      item.title.toLowerCase().includes(searchText.toLowerCase())
    );
    const filteredKeys = filteredOptions.map((item) => item.key);
    const selectedFilteredKeys = newSelectedKeys.filter((key) =>
      filteredKeys.includes(key)
    );
    setIndeterminate(
      selectedFilteredKeys.length > 0 &&
        selectedFilteredKeys.length < filteredKeys.length
    );
    setCheckAll(selectedFilteredKeys.length === filteredKeys.length);
  };

  const handleSelectChange = (newSelectedKeys: string[]) => {
    onChange(newSelectedKeys);
    updateCheckStatus(newSelectedKeys);
  };

  const handleClearSelection = () => {
    onChange([]);
    setCheckAll(false);
    setIndeterminate(false);
  };

  useEffect(() => {
    updateCheckStatus(value);
  }, [value, options]);

  const renderRight = () => {
    return (
      <Right>
        <Header>
          <span>({value.length}) selected</span>
          <Button type="text" size="small" onClick={handleClearSelection}>
            Clear
          </Button>
        </Header>
        <SelectedList
          maxHeight={height - 50}
          selectedList={options.filter((item) => value.includes(item.key))}
          onUnselect={handleOnUnselect}
        />
      </Right>
    );
  };

  return (
    <PanelWrapper
      $maxHeight={height}
      $leftWidth={leftWidth}
      style={styles?.container}
    >
      <Left>
        <Header style={styles?.header}>
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              color: 'var(--ant-color-text-tertiary)'
            }}
          >
            <Checkbox
              checked={checkAll}
              indeterminate={indeterminate}
              onChange={handleCheckAllChange}
            ></Checkbox>
            <span>
              {intl.formatMessage(
                { id: 'common.select.count' },
                { count: value.length }
              )}
            </span>
          </span>
          <Input
            prefix={
              <SearchOutlined
                style={{ color: 'var(--ant-color-text-quaternary)' }}
              />
            }
            size="small"
            allowClear
            status={'null' as any}
            placeholder={searchPlaceholder}
            style={{
              width: 300,
              height: 32,
              borderRadius: 4,
              backgroundColor: 'var(--ant-color-bg-container) !important'
            }}
            onChange={handleSearch}
          />
        </Header>
        {showOptions.length > 0 ? (
          <List
            maxHeight={height - 50}
            dataList={showOptions}
            value={value}
            onChange={handleSelectChange}
          />
        ) : (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={notFoundContent}
          ></Empty>
        )}
      </Left>
    </PanelWrapper>
  );
};

export default SelectPanel;
