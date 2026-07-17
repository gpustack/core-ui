import { createStyles } from 'antd-style';
import React from 'react';
import { StatusColorMap } from '../../../lib/config';
import { type StatusType } from '../../../lib/types';

const useStyles = createStyles(({ css }) => ({
  statusDot: css`
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
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
  const color = StatusColorMap[status]?.text;
  // The tertiary token reads too dark for a filled dot; drop the inactive dot
  // to the lighter quaternary while keeping the text at its usual color.
  const dotColor =
    status === 'inactive' ? 'var(--ant-color-text-quaternary)' : color;

  return (
    <span className={styles.statusDot} style={style}>
      <span className={styles.dot} style={{ backgroundColor: dotColor }} />
      <span className={styles.text}>{text}</span>
    </span>
  );
};

export default StatusDot;
