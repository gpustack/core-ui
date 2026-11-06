import { Tooltip } from 'antd';
import { createStyles } from 'antd-style';
import classNames from 'classnames';
import React from 'react';
import { StatusColorMap } from '../../../lib/config';
import { type StatusType } from '../../../lib/types';
import IconFont from '../icon-font';

const useStyles = createStyles(({ css }) => ({
  // `inherit`, not the 12px caption size this used to hard-code. `StatusTag` is
  // 12px because it is a PILL — a contained chip with its own background, where
  // a step down from body text is the convention. A dot has no container: its
  // label sits inline with the surrounding text, and every call site (a table
  // cell, a Select option, a card row) renders that text at 14px. Fixing the
  // label at 12px put two type sizes on one baseline.
  statusDot: css`
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: inherit;
    line-height: 1;
    max-width: 100%;
  `,
  icon: css`
    display: inline-flex;
    align-items: center;
    flex-shrink: 0;
  `,
  dot: css`
    width: 8px;
    height: 8px;
    border-radius: 50%;
  `,
  text: css`
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  `,
  withMessage: css`
    --status-dot-warning-color: var(
      --color-status-warning-dot,
      var(--ant-color-warning)
    );
    cursor: help;

    .status-dot-message-text {
      border-block-end: 1px dashed var(--ant-color-text-quaternary);
      padding-block-end: 2px;
    }

    &:hover .status-dot-message-text,
    &:focus-visible .status-dot-message-text {
      border-block-end-color: var(--status-dot-warning-color);
    }
  `,
  warningIcon: css`
    color: var(--status-dot-warning-color);
  `
}));

type StatusDotProps = {
  statusValue: {
    status: StatusType;
    text: string;
  };
  message?: React.ReactNode;
  /** Replaces the default dot or warning icon. */
  icon?: React.ReactNode;
  style?: React.CSSProperties;
  /** Slot styles. `root` takes precedence over `style`. */
  styles?: {
    root?: React.CSSProperties;
    icon?: React.CSSProperties;
    text?: React.CSSProperties;
  };
};

const StatusDot: React.FC<StatusDotProps> = ({
  statusValue,
  message,
  icon,
  style,
  styles: slotStyles
}) => {
  const { styles } = useStyles();
  const { status, text } = statusValue;
  const hasMessage = message === 0 || (Boolean(message) && message !== true);
  const showDot = icon == null && !hasMessage;
  // `dot`, not `text`. The text step is darkened to clear 4.5:1 as 12px type on
  // a tint; a filled 8px dot has no such requirement — it sits beside its own
  // label, so it is reinforcement rather than the sole carrier of the state.
  // Painting it with the text colour turned the brand mint into dark pine.
  // `text` stays the fallback for a status that ships no dot value.
  const entry = StatusColorMap[status];
  // The tertiary token reads too dark for a filled dot; drop the inactive dot
  // to the lighter quaternary while keeping the text at its usual color.
  const dotColor =
    status === 'inactive'
      ? 'var(--ant-color-text-quaternary)'
      : (entry?.dot ?? entry?.text);

  const content = (
    <span
      className={classNames(styles.statusDot, hasMessage && styles.withMessage)}
      style={{ ...style, ...slotStyles?.root }}
      tabIndex={hasMessage ? 0 : undefined}
    >
      <span
        aria-hidden
        className={classNames(
          styles.icon,
          showDot && styles.dot,
          hasMessage && styles.warningIcon
        )}
        style={{
          backgroundColor: showDot ? dotColor : undefined,
          ...slotStyles?.icon
        }}
      >
        {icon ??
          (hasMessage ? <IconFont type="icon-warning-outlined" /> : null)}
      </span>
      <span
        className={classNames(
          styles.text,
          hasMessage && 'status-dot-message-text'
        )}
        style={slotStyles?.text}
      >
        {text}
      </span>
    </span>
  );

  return hasMessage ? (
    <Tooltip title={message} trigger={['hover', 'focus']}>
      {content}
    </Tooltip>
  ) : (
    content
  );
};

export default StatusDot;
