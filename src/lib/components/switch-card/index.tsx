import { Switch, Typography } from 'antd';
import React, { useState } from 'react';
import cardStyles from './styles.module.less';

interface SwitchCardProps {
  label: React.ReactNode;
  value?: boolean;
  defaultValue?: boolean;
  description?: React.ReactNode;
  showSwitch?: boolean;
  children?: React.ReactNode;
  styles?: {
    wrapper?: React.CSSProperties;
    checkboxWrapper?: React.CSSProperties;
    label?: React.CSSProperties;
  };
  action?: React.ReactNode;
  onChange?: (checked: boolean) => void;
}

const SwitchCard: React.FC<SwitchCardProps> = (props) => {
  const {
    label,
    value,
    defaultValue,
    children,
    description,
    onChange,
    showSwitch = true,
    styles,
    action
  } = props;

  const isControlled = value !== undefined;
  const [innerChecked, setInnerChecked] = useState<boolean>(
    defaultValue ?? false
  );
  const checked = isControlled ? !!value : innerChecked;

  const handleOnCheckedChange = (next: boolean) => {
    if (!isControlled) {
      setInnerChecked(next);
    }
    onChange?.(next);
  };

  return (
    <div className={cardStyles.wrapper} style={{ ...styles?.wrapper }}>
      <div
        className={cardStyles.buttonWrapper}
        style={{ ...styles?.checkboxWrapper }}
      >
        <span
          className={cardStyles.label}
          style={{
            ...styles?.label
          }}
        >
          <span>{label}</span>
        </span>
        {showSwitch && (
          <Switch checked={checked} onChange={handleOnCheckedChange} />
        )}
        {action}
      </div>
      {description && (
        <Typography.Text type="secondary">{description}</Typography.Text>
      )}
      {checked && <div>{children}</div>}
    </div>
  );
};

export default SwitchCard;
