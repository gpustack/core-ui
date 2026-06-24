import { Dropdown, type DropdownProps, type MenuProps } from 'antd';
import _ from 'lodash';
import React, { useMemo } from 'react';
import { useIntl } from '../../../lib/hooks/useIntl';
import useAccess from '../../hooks/useAccess';

const DropDownActions: React.FC<DropdownProps> = (props) => {
  const {
    menu,
    trigger = ['hover'],
    placement = 'bottomRight',
    children,
    ...rest
  } = props;
  const intl = useIntl();
  const access = useAccess();

  const items = useMemo(() => {
    return menu?.items
      ?.map((item: any) => ({
        ..._.omit(item, 'locale'),
        icon: item.icon
          ? React.cloneElement(item.icon, { style: { fontSize: 14 } })
          : null,
        label: item.locale ? intl.formatMessage({ id: item.label }) : item.label
      }))
      .filter((item: any) => {
        if (item?.access) {
          return access?.[item.access];
        }
        return true;
      });
  }, [menu?.items, intl, access]);

  return (
    <Dropdown
      menu={{
        items: items as MenuProps['items'],
        onClick: menu?.onClick
      }}
      trigger={trigger}
      placement={placement}
      {...rest}
    >
      {children}
    </Dropdown>
  );
};

export default DropDownActions;
