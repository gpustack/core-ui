import { createStyles } from 'antd-style';
import React from 'react';
import { StatusColorMap } from '../../../lib/config';
import { type StatusType } from '../../../lib/types';

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
  dot: css`
    flex-shrink: 0;
    width: 8px;
    height: 8px;
    border-radius: 50%;
  `,
  text: css`
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  `
}));

type StatusDotProps = {
  statusValue: {
    status: StatusType;
    text: string;
  };
  style?: React.CSSProperties;
};

const StatusDot: React.FC<StatusDotProps> = ({ statusValue, style }) => {
  const { styles } = useStyles();
  const { status, text } = statusValue;
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

  return (
    <span className={styles.statusDot} style={style}>
      <span className={styles.dot} style={{ backgroundColor: dotColor }} />
      <span className={styles.text}>{text}</span>
    </span>
  );
};

export default StatusDot;
