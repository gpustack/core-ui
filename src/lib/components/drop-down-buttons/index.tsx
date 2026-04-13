import { MoreOutlined } from '@ant-design/icons';
import { Button, Dropdown, Space, Tooltip, type MenuProps } from 'antd';
import _ from 'lodash';
import React from 'react';
import { useIntl } from '../../../lib/hooks/useIntl';
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
  items,
  size = 'middle',
  trigger = ['hover'],
  showText,
  disabled,
  variant,
  color,
  extra,
  onSelect
}) => {
  const headItem = _.head(items) as any;
  const intl = useIntl();

  const handleMenuClick = (item: any) => {
    const selectItem = _.find(items, { key: item.key });
    onSelect(item.key, selectItem);
  };

  const handleButtonClick = (e: any) => {
    const headItem = _.head(items) as any;
    onSelect(headItem.key, headItem);
  };

  if (!items?.length) {
    return <span></span>;
  }

  return (
    <>
      {items?.length === 1 ? (
        <Tooltip title={intl.formatMessage({ id: headItem?.label })}>
          <Button
            className={dropdownButtonCss[size]}
            icon={headItem?.icon}
            size={size}
            {...headItem?.props}
            onClick={handleButtonClick}
          ></Button>
        </Tooltip>
      ) : (
        <Space.Compact>
          <>
            {showText ? (
              <Button
                {...headItem?.props}
                disabled={headItem?.disabled || disabled}
                className={dropdownButtonCss[size]}
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
                <Button
                  {...headItem?.props}
                  className={dropdownButtonCss[size]}
                  onClick={handleButtonClick}
                  size={size}
                  icon={headItem?.icon}
                  disabled={headItem?.disabled}
                ></Button>
              </Tooltip>
            )}
          </>
          <Dropdown
            disabled={disabled}
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
                ..._.omit(item, ['label', 'locale']),
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
              variant={variant}
              color="default"
              className={dropdownButtonCss[size]}
            ></Button>
          </Dropdown>
        </Space.Compact>
      )}
    </>
  );
};

export default DropdownButtons;
