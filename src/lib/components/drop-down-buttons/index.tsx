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

  const handleMenuClick = (item: any) => {
    const selectItem = _.find(items, { key: item.key });
    onSelect(item.key, selectItem);
  };

  const headItem = _.head(items) as any;

  const handleButtonClick = (e: any) => {
    const headItem = _.head(items) as any;
    onSelect(headItem.key, headItem);
  };

  // An item's `label` is a message id by default; `locale: false` opts out and
  // makes it literal content. The menu items below have always honoured that,
  // but the head item did not — it ran every label through `formatMessage`
  // unconditionally, so a head action opting out got its literal text treated
  // as an id and rendered as the id itself. Same rule, one place.
  const resolveLabel = (item: any) =>
    item?.locale || item?.locale === undefined
      ? intl.formatMessage({ id: item?.label })
      : item?.label;

  if (!items?.length) {
    return <span></span>;
  }

  // Past the guard above, `items` has at least one entry, so `headItem` is
  // defined and needs no optional chaining from here down.
  const headLabel = resolveLabel(headItem);
  // `aria-label` only takes a string. With `locale: false` the label is
  // whatever the caller passed, which may be a node — there is no name to
  // derive from that, so the attribute is left off rather than stringified into
  // something like `[object Object]`.
  const headLabelText = typeof headLabel === 'string' ? headLabel : undefined;

  return (
    <>
      {items?.length === 1 ? (
        <Tooltip title={headLabel}>
          <Button
            className={dropdownButtonCss[size]}
            icon={headItem.icon}
            size={size}
            {...headItem.props}
            onClick={handleButtonClick}
            aria-label={headLabelText}
          ></Button>
        </Tooltip>
      ) : (
        <Space.Compact>
          <>
            {showText ? (
              <Button
                {...headItem.props}
                disabled={headItem.disabled || disabled}
                className={dropdownButtonCss[size]}
                onClick={handleButtonClick}
                size={size}
                icon={headItem.icon}
                variant={variant}
                color={color}
              >
                {headLabel}
                {extra}
              </Button>
            ) : (
              <Tooltip title={headLabel} key="leftButton">
                <Button
                  {...headItem.props}
                  className={dropdownButtonCss[size]}
                  onClick={handleButtonClick}
                  size={size}
                  icon={headItem.icon}
                  disabled={headItem.disabled}
                  aria-label={headLabelText}
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
                // omit `onClick`: 点击只经 menu 级 onClick → handleMenuClick → onSelect
                // 分发；若把 action 自带的 onClick 透传给 antd menu item，antd 会把它当成
                // 单项点击回调额外触发一次（且入参是 menu info 而非 row），导致重复执行。
                ..._.omit(item, ['label', 'locale', 'onClick']),
                ...item.props,
                label: resolveLabel(item)
              }))
            }}
          >
            <Button
              icon={<MoreOutlined />}
              size={size}
              key="menu"
              variant={variant}
              color="default"
              aria-label={intl.formatMessage({ id: 'common.button.more' })}
              className={dropdownButtonCss[size]}
            ></Button>
          </Dropdown>
        </Space.Compact>
      )}
    </>
  );
};

export default DropdownButtons;
