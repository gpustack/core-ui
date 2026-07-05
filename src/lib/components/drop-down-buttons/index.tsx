import { MoreOutlined } from '@ant-design/icons';
import { Button, Dropdown, Space, Tooltip, type MenuProps } from 'antd';
import _ from 'lodash';
import React from 'react';
import { useIntl } from '../../../lib/hooks/useIntl';
import useAccess from '../../hooks/useAccess';
import dropdownButtonCss from './index.module.less';

type Trigger = 'click' | 'hover';
interface DropdownButtonsProps {
  items: MenuProps['items'];
  size?: 'small' | 'middle' | 'large';
  trigger?: Trigger[];
  showText?: boolean;
  disabled?: boolean;
  variant?: 'filled' | 'outlined';
  color?: string;
  extra?: React.ReactNode;
  onSelect: (val: any, item?: any) => void;
}

const DropdownButtons: React.FC<
  DropdownButtonsProps & { items: MenuProps['items'] }
> = ({
  items: actions,
  size = 'middle',
  trigger = ['hover'],
  showText,
  disabled,
  variant,
  color,
  extra,
  onSelect
}) => {
  const intl = useIntl();
  const access = useAccess();

  const items = _.filter(actions, (item: any) => {
    if (item?.access) {
      return access?.[item.access];
    }
    return true;
  });

  const headItem = _.head(items) as any;
  const isDisabled = !!(headItem?.disabled || disabled);
  const headProps = _.omit(headItem?.props, ['disabled', 'onClick']);

  const handleMenuClick = (item: any) => {
    if (isDisabled) {
      return;
    }
    const selectItem = _.find(items, { key: item.key });
    onSelect(item.key, selectItem);
  };

  const handleButtonClick = () => {
    if (isDisabled) {
      return;
    }
    onSelect(headItem.key, headItem);
  };

  if (!items?.length) {
    return <span></span>;
  }

  const iconBtnClass =
    size === 'large'
      ? dropdownButtonCss.iconLarge
      : dropdownButtonCss.iconMiddle;

  return (
    <>
      {items?.length === 1 ? (
        <Tooltip title={intl.formatMessage({ id: headItem?.label })}>
          <span className={dropdownButtonCss.tooltipWrap}>
            <Button
              className={iconBtnClass}
              icon={headItem?.icon}
              size={size}
              {...headProps}
              disabled={isDisabled}
              onClick={handleButtonClick}
            ></Button>
          </span>
        </Tooltip>
      ) : (
        <Space.Compact>
          {showText ? (
            <Button
              {...headProps}
              disabled={isDisabled}
              className={dropdownButtonCss.textAction}
              onClick={handleButtonClick}
              size={size}
              icon={headItem?.icon}
              variant={variant}
              color={color}
            >
              {intl.formatMessage({
                id: headItem?.label
              })}
              {extra}
            </Button>
          ) : (
            <Tooltip
              title={intl.formatMessage({ id: headItem?.label })}
              key="leftButton"
            >
              <span className={dropdownButtonCss.tooltipWrap}>
                <Button
                  {...headProps}
                  className={iconBtnClass}
                  onClick={handleButtonClick}
                  size={size}
                  icon={headItem?.icon}
                  disabled={isDisabled}
                  variant={variant ?? 'outlined'}
                  color={color ?? 'default'}
                ></Button>
              </span>
            </Tooltip>
          )}
          <Dropdown
            disabled={isDisabled}
            trigger={trigger}
            placement="bottomRight"
            styles={{
              root: {
                minWidth: 160
              },
              itemIcon: {
                fontSize: 14
              }
            }}
            menu={{
              onClick: handleMenuClick,
              items: _.tail(items).map((item: any) => ({
                // omit `onClick`: 点击只经 menu 级 onClick → handleMenuClick → onSelect
                // 分发；若把 action 自带的 onClick 透传给 antd menu item，antd 会把它当成
                // 单项点击回调额外触发一次（且入参是 menu info 而非 row），导致重复执行。
                ..._.omit(item, ['label', 'locale', 'onClick']),
                ...item.props,
                label:
                  item.locale || item.locale === undefined
                    ? intl.formatMessage({ id: item.label })
                    : item.label
              }))
            }}
          >
            <Button
              icon={<MoreOutlined />}
              size={size}
              key="menu"
              disabled={isDisabled}
              variant={variant ?? 'outlined'}
              color={color ?? 'default'}
              className={iconBtnClass}
            ></Button>
          </Dropdown>
        </Space.Compact>
      )}
    </>
  );
};

export default DropdownButtons;
