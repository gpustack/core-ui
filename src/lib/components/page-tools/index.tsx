import {
  CloseCircleFilled,
  DeleteOutlined,
  DownOutlined,
  PlusOutlined,
  SearchOutlined,
  SyncOutlined
} from '@ant-design/icons';
import type { SelectProps } from 'antd';
import { Button, Input, Space, Tooltip } from 'antd';
import classNames from 'classnames';
import React, { useMemo } from 'react';
import DropDownActions from '../../../lib/components/drop-down-actions';
import useWindowResize from '../../../lib/hooks/use-window-resize';
import { useIntl } from '../../../lib/hooks/useIntl';
import BaseSelect from '../form/base/select';
import IconFont from '../icon-font';
import { getFilterBarLayoutState } from './filter-bar-layout';
import filtersButtonCss from './filters-button.module.less';
import pageToolsCss from './index.module.less';

type PageToolsProps = {
  left?: React.ReactNode;
  right?: React.ReactNode;
  marginBottom?: number;
  marginTop?: number;
  style?: React.CSSProperties;
};

export const FiltersButton = ({
  onClick,
  onClear,
  count,
  iconOnly
}: {
  onClick: () => void;
  onClear: () => void;
  count?: number;
  iconOnly?: boolean;
}) => {
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClear();
  };
  const intl = useIntl();
  const { isIconOnlyToolbar } = useWindowResize();
  const compactIcon = iconOnly ?? isIconOnlyToolbar;
  const filterLabel = intl.formatMessage({ id: 'common.filter.label' });

  const button = (
    <div className={filtersButtonCss.buttonWrapper}>
      <Button
        onClick={onClick}
        className={classNames(compactIcon && filtersButtonCss.iconOnly)}
        style={{
          color: 'var(--ant-color-text-tertiary)'
        }}
        icon={
          <IconFont type="icon-filter-list" style={{ fontSize: 14 }}></IconFont>
        }
      >
        {!compactIcon && (
          <span className={filtersButtonCss.wrapper}>
            <span>{filterLabel}</span>
            {!!count && <span className={filtersButtonCss.count}>{count}</span>}
            {!!count && (
              <span
                className={filtersButtonCss['close-btn']}
                onClick={handleClear}
              >
                <CloseCircleFilled />
              </span>
            )}
          </span>
        )}
      </Button>
      {compactIcon && !!count && (
        <span className={filtersButtonCss.iconBadge}>{count}</span>
      )}
      {compactIcon && !!count && (
        <span className={filtersButtonCss.iconClear} onClick={handleClear}>
          <CloseCircleFilled />
        </span>
      )}
    </div>
  );

  if (compactIcon) {
    return <Tooltip title={filterLabel}>{button}</Tooltip>;
  }

  return button;
};

/**
 * Page toolbar layout. In compact mode (< xl) keeps filters and actions on one row.
 * Pair with FiltersButton + FilterForm drawer for multi-select filters;
 * use isIconOnlyToolbar (< lg) for icon-only action buttons.
 */
const PageTools: React.FC<PageToolsProps> = (props) => {
  const {
    left,
    right,
    marginBottom = 0,
    marginTop = 30,
    style: pageStyle
  } = props;
  const { isCompactToolbar } = useWindowResize();
  const compactToolbar = isCompactToolbar;

  const newStyle: React.CSSProperties = useMemo(() => {
    const style: React.CSSProperties = {};
    style.marginBottom = `${marginBottom}px`;
    style.marginTop = `${marginTop}px`;
    if (pageStyle) {
      Object.assign(style, pageStyle);
    }
    return style;
  }, [marginBottom, marginTop, pageStyle]);

  return (
    <div
      className={classNames(
        pageToolsCss['page-tools'],
        compactToolbar && pageToolsCss.mobile
      )}
      style={newStyle}
    >
      <div className={pageToolsCss.left}>{left}</div>
      <div className={pageToolsCss.right}>{right}</div>
    </div>
  );
};

interface ActionItem {
  label: string;
  locale: boolean;
  value: string;
  key: string;
  icon: React.ReactNode;
  [key: string]: any;
}

interface FilterBarProps {
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSelectChange?: (value: any) => void;
  handleSearch: () => void;
  handleDeleteByBatch?: () => void;
  handleClickPrimary?: (item: any) => void;
  rowSelection?: any;
  actionItems?: ActionItem[];
  selectOptions?: Global.BaseOption<string | number>[];
  showSelect?: boolean;
  buttonText?: string;
  buttonIcon?: React.ReactNode;
  marginBottom?: number;
  marginTop?: number;
  inputHolder?: string;
  selectHolder?: string;
  actionType?: 'dropdown' | 'button';
  showPrimaryButton?: boolean;
  showDeleteButton?: boolean;
  right?: React.ReactNode;
  left?: React.ReactNode;
  filtersButtonProps?: {
    show: boolean;
    count: number;
    onClick: () => void;
    onClear: () => void;
  };
  select?: {
    showSearch?: SelectProps['showSearch'];
  };
  widths?: {
    input?: number;
    select?: number;
  };
  /** Extra inline selects/chips between search and refresh (domain-specific). */
  inlineFilters?: React.ReactNode;
  /**
   * When true (default if filtersButtonProps.show), hide inlineFilters on
   * isCompactToolbar (< xl) — filters move to FilterForm drawer.
   */
  collapseInlineFilters?: boolean;
  /** Stack search + inline filters vertically on compact toolbar. */
  stackInlineFilters?: boolean;
}

export const FilterBar: React.FC<FilterBarProps> = (props) => {
  const {
    handleInputChange,
    handleSelectChange,
    handleSearch,
    handleDeleteByBatch = null,
    handleClickPrimary = null,
    rowSelection,
    actionItems = [],
    selectOptions,
    showSelect,
    buttonText,
    buttonIcon,
    actionType = 'button',
    marginBottom = 10,
    marginTop = 10,
    inputHolder,
    selectHolder,
    select,
    right,
    left,
    widths,
    filtersButtonProps,
    inlineFilters,
    collapseInlineFilters,
    stackInlineFilters = true
  } = props;
  const intl = useIntl();
  const { isCompactToolbar, isIconOnlyToolbar } = useWindowResize();
  const compactToolbar = isCompactToolbar;
  const iconOnly = isIconOnlyToolbar;
  const fieldWidth = widths?.input ?? 230;
  const selectWidth = compactToolbar ? '100%' : widths?.select || 230;
  const inputStyle: React.CSSProperties = compactToolbar
    ? { width: '100%', minWidth: 0, maxWidth: fieldWidth }
    : { width: fieldWidth };
  const { showInlineFilters, useDrawerRow, stackVertical, showFiltersButton } =
    getFilterBarLayoutState({
      hasInlineFilters: !!inlineFilters,
      collapseInlineFilters,
      hasFiltersButton: !!filtersButtonProps?.show,
      isCompactToolbar: compactToolbar,
      stackInlineFilters
    });

  const renderLeft = () => {
    const refreshButton = (
      <Button
        type="text"
        style={{ color: 'var(--ant-color-text-tertiary)', flexShrink: 0 }}
        onClick={handleSearch}
        icon={<SyncOutlined></SyncOutlined>}
      ></Button>
    );

    return (
      <Space
        wrap={false}
        direction={stackVertical ? 'vertical' : 'horizontal'}
        size="small"
        className={classNames(
          stackVertical && pageToolsCss['filter-stack'],
          useDrawerRow && pageToolsCss['filter-row'],
          !compactToolbar && pageToolsCss['filter-wrap']
        )}
        style={
          compactToolbar ? { flex: 1, minWidth: 0, width: '100%' } : undefined
        }
      >
        {showFiltersButton && filtersButtonProps && (
          <FiltersButton
            onClear={filtersButtonProps.onClear}
            onClick={filtersButtonProps.onClick}
            count={filtersButtonProps.count}
          ></FiltersButton>
        )}
        <Input
          prefix={
            <SearchOutlined
              style={{ color: 'var(--ant-color-text-placeholder)' }}
            ></SearchOutlined>
          }
          placeholder={
            inputHolder ||
            intl.formatMessage({
              id: 'common.filter.name'
            })
          }
          style={inputStyle}
          size="large"
          allowClear
          onChange={handleInputChange}
        ></Input>
        {showSelect && (
          <BaseSelect
            allowClear
            showSearch={select?.showSearch}
            placeholder={selectHolder}
            style={{ width: selectWidth }}
            size="large"
            onChange={handleSelectChange}
            options={selectOptions}
          ></BaseSelect>
        )}
        {showInlineFilters ? inlineFilters : null}
        {refreshButton}
      </Space>
    );
  };

  const renderRight = () => {
    if (!handleClickPrimary && !handleDeleteByBatch) {
      return null;
    }
    const deleteLabel = intl.formatMessage({ id: 'common.button.delete' });
    const deleteCount =
      rowSelection?.selectedRowKeys?.length > 0
        ? ` (${rowSelection.selectedRowKeys.length})`
        : '';
    const deleteDisabled = !rowSelection?.selectedRowKeys?.length;

    const primaryButton =
      actionType === 'dropdown' ? (
        <DropDownActions
          styles={{
            root: { minWidth: iconOnly ? undefined : '140px' }
          }}
          menu={{
            items: actionItems,
            onClick: handleClickPrimary
          }}
        >
          <Button
            icon={
              iconOnly ? (buttonIcon ?? <PlusOutlined />) : <DownOutlined />
            }
            type="primary"
            iconPlacement={iconOnly ? undefined : 'end'}
          >
            {!iconOnly && buttonText}
          </Button>
        </DropDownActions>
      ) : (
        <Button
          icon={buttonIcon ?? <PlusOutlined></PlusOutlined>}
          type="primary"
          onClick={handleClickPrimary}
        >
          {!iconOnly && buttonText}
        </Button>
      );

    const deleteButton = (
      <Button
        icon={<DeleteOutlined />}
        danger
        onClick={handleDeleteByBatch}
        disabled={deleteDisabled}
      >
        {!iconOnly && (
          <span>
            {deleteLabel}
            {deleteCount}
          </span>
        )}
      </Button>
    );

    return (
      <div className={compactToolbar ? 'compactActions' : undefined}>
        <Space size={16} wrap={false}>
          {handleClickPrimary ? (
            iconOnly && buttonText ? (
              <Tooltip title={buttonText}>{primaryButton}</Tooltip>
            ) : (
              primaryButton
            )
          ) : null}
          {handleDeleteByBatch ? (
            iconOnly ? (
              <Tooltip title={`${deleteLabel}${deleteCount}`}>
                {deleteButton}
              </Tooltip>
            ) : (
              deleteButton
            )
          ) : null}
        </Space>
      </div>
    );
  };

  return (
    <PageTools
      marginBottom={marginBottom}
      marginTop={0}
      left={left || renderLeft()}
      right={right || renderRight()}
    ></PageTools>
  );
};

export default PageTools;
