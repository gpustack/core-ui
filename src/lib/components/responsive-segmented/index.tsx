import { Segmented, Tooltip, type SegmentedProps } from 'antd';
import classNames from 'classnames';
import React, { useMemo } from 'react';
import useWindowResize from '../../hooks/use-window-resize';

export type ResponsiveSegmentedOption = {
  label: React.ReactNode;
  value: string | number;
  icon?: React.ReactNode;
  disabled?: boolean;
  className?: string;
};

export type ResponsiveSegmentedProps = Omit<SegmentedProps, 'options'> & {
  options: ResponsiveSegmentedOption[];
  /** Override responsive icon-only toolbar breakpoint behavior */
  iconOnly?: boolean;
};

export function mapSegmentedOptionsForToolbar(
  options: ResponsiveSegmentedOption[],
  iconOnly: boolean
): SegmentedProps['options'] {
  if (!iconOnly) {
    return options;
  }

  return options.map(({ label, icon, ...rest }) => {
    const iconNode =
      icon && label != null && label !== '' ? (
        <Tooltip title={label}>
          <span style={{ display: 'inline-flex', alignItems: 'center' }}>
            {icon}
          </span>
        </Tooltip>
      ) : (
        icon
      );

    return {
      ...rest,
      label: undefined,
      icon: iconNode
    };
  });
}

/**
 * Segmented control for page headers: keeps labels on wide viewports and
 * collapses to icon + tooltip when the toolbar is icon-only (< lg).
 */
const ResponsiveSegmented: React.FC<ResponsiveSegmentedProps> = ({
  options,
  iconOnly: iconOnlyProp,
  className,
  style,
  ...rest
}) => {
  const { isIconOnlyToolbar, isMobile } = useWindowResize();
  const iconOnly = iconOnlyProp ?? isIconOnlyToolbar;

  const mappedOptions = useMemo(
    () => mapSegmentedOptionsForToolbar(options, iconOnly),
    [options, iconOnly]
  );

  return (
    <Segmented
      shape="round"
      size="middle"
      className={classNames(className)}
      style={{
        backgroundColor: 'var(--ant-color-fill-secondary)',
        fontSize: 13,
        ...(isMobile ? { maxWidth: '100%', overflowX: 'auto' } : {}),
        ...style
      }}
      options={mappedOptions}
      {...rest}
    />
  );
};

export default ResponsiveSegmented;
