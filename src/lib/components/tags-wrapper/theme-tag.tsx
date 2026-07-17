import { Tag, type TagProps } from 'antd';
import { createStyles } from 'antd-style';
import classNames from 'classnames';
import React from 'react';
import { useCoreUIContext } from '../../../lib/hooks';

const useStyles = createStyles(({ css }) => {
  return {
    themeTag: css`
      display: flex;
      align-items: center;
      justify-content: center;
      width: fit-content;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 12px;
      height: 22px;
      line-height: 20px;
      opacity: 0.7;
      margin: 0;
      &.tag-ghost {
        background-color: transparent !important;
      }
    `
  };
});

const ThemeTag: React.FC<TagProps & { opacity?: number; ghost?: boolean }> = ({
  opacity,
  style,
  children,
  ghost,
  className,
  ...restProps
}) => {
  const { config } = useCoreUIContext();
  const { isDarkTheme } = config;
  const { styles } = useStyles();
  return (
    <Tag
      variant="outlined"
      style={{
        ...style,
        opacity: isDarkTheme ? 1 : opacity
      }}
      {...restProps}
      className={classNames(styles.themeTag, className, {
        'tag-ghost': ghost
      })}
    >
      {children}
    </Tag>
  );
};

ThemeTag.displayName = 'ThemeTag';

export default ThemeTag;
