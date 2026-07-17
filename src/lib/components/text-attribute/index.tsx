import { createStyles } from 'antd-style';
import React from 'react';

const useStyles = createStyles(({ css }) => ({
  attr: css`
    display: inline-flex;
    align-items: center;
    padding: 1px 7px;
    border-radius: 12px;
    color: var(--ant-color-text-tertiary);
    font-size: 11px;
    line-height: 18px;
    white-space: nowrap;
  `,
  filled: css`
    background-color: var(--ant-color-fill-tertiary);
  `,
  outlined: css`
    border: 1px solid var(--ant-color-border-secondary);
  `
}));

type TextAttributeProps = {
  children: React.ReactNode;
  /** Visual style: `filled` (tertiary fill) or `outlined` (secondary border). */
  variant?: 'filled' | 'outlined';
  className?: string;
  style?: React.CSSProperties;
};

/**
 * Subordinate attribute marker that follows a primary text, e.g.
 * `key-name [custom]`. Renders a small, neutral pill (no semantic color) so it
 * reads as an annotation of the preceding text rather than a standalone
 * category tag. Place it directly after the main text; it manages its own
 * leading spacing.
 */
const TextAttribute: React.FC<TextAttributeProps> = ({
  children,
  variant = 'outlined',
  className,
  style
}) => {
  const { styles, cx } = useStyles();

  return (
    <span className={cx(styles.attr, styles[variant], className)} style={style}>
      {children}
    </span>
  );
};

export default TextAttribute;
