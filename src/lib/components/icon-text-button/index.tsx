import { Button, Tooltip, type ButtonProps } from 'antd';
import React from 'react';
import useWindowResize from '../../hooks/use-window-resize';

export type IconTextButtonProps = ButtonProps & {
  /** Button label; falls back to `children` when omitted */
  text?: React.ReactNode;
  /** Tooltip when icon-only; defaults to `text` / `children` */
  tooltip?: React.ReactNode;
  /** Override responsive icon-only toolbar breakpoint behavior */
  iconOnly?: boolean;
};

/**
 * Button that shows icon + text by default and collapses to icon-only
 * (with tooltip) below the lg breakpoint — same as page toolbar actions.
 */
const IconTextButton: React.FC<IconTextButtonProps> = ({
  text,
  tooltip,
  iconOnly: iconOnlyProp,
  children,
  ...buttonProps
}) => {
  const { isIconOnlyToolbar } = useWindowResize();
  const iconOnly = iconOnlyProp ?? isIconOnlyToolbar;
  const label = text ?? children;

  const button = <Button {...buttonProps}>{!iconOnly ? label : null}</Button>;

  if (iconOnly && label != null && label !== '') {
    return <Tooltip title={tooltip ?? label}>{button}</Tooltip>;
  }

  return button;
};

export default IconTextButton;
