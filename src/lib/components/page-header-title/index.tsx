import classNames from 'classnames';
import React from 'react';
import useWindowResize from '../../hooks/use-window-resize';
import pageHeaderTitleCss from './index.module.less';

export type PageHeaderTitleProps = {
  title: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  /** Override responsive icon-only toolbar breakpoint behavior */
  iconOnly?: boolean;
};

/**
 * Page header title row: bold title + optional trailing controls (e.g. Segmented).
 * Adds 24px gap after the title; switches to 8px gap when the toolbar is icon-only.
 */
const PageHeaderTitle: React.FC<PageHeaderTitleProps> = ({
  title,
  children,
  className,
  iconOnly: iconOnlyProp
}) => {
  const { isIconOnlyToolbar } = useWindowResize();
  const iconOnly = iconOnlyProp ?? isIconOnlyToolbar;

  return (
    <div
      className={classNames(
        pageHeaderTitleCss.root,
        iconOnly && pageHeaderTitleCss.rootCompact,
        className
      )}
    >
      <span className={pageHeaderTitleCss.title}>{title}</span>
      {children ? (
        <div
          className={classNames(
            pageHeaderTitleCss.extra,
            !iconOnly && pageHeaderTitleCss.extraSpaced
          )}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
};

export default PageHeaderTitle;
