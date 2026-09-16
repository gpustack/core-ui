import { InfoCircleOutlined } from '@ant-design/icons';
import { Button, Divider, Tooltip } from 'antd';
import classNames from 'classnames';
import _ from 'lodash';
import React, { useMemo } from 'react';
import styled from 'styled-components';
import { StatusColorMap } from '../../../lib/config';
import { type StatusType } from '../../../lib/types';
import CopyButton from '../copy-button';
import { TooltipOverlayScroller } from '../overlay-scroller';
import './copy-btn.less';
import './index.less';

const Text = styled.span`
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const linkReg = /<a (.*?)>(.*?)<\/a>/g;
export const StatusMaps = {
  transitioning: 'blue',
  error: 'red',
  warning: 'orange',
  success: 'success',
  inactive: 'inactive'
};

type StatusTagProps = {
  style?: React.CSSProperties;
  statusValue: {
    status: StatusType;
    text: string;
    message?: string;
  };
  type?: 'tag' | 'circle';
  /**
   * `filled` — tinted background, no border.
   * `outlined` — transparent background, 1px border in the status colour.
   *
   * Both clear WCAG AA for the tag's 12px label; `outlined` actually measures
   * higher (5.34–6.06:1 against the container, vs 4.60–5.04:1 for `filled`),
   * because there is no tint between the text and the surface. Pick by how much
   * weight the state should carry on the screen it is on, not by contrast.
   */
  variant?: 'filled' | 'outlined';
  download?: {
    percent: number;
  };
  suffix?: React.ReactNode;
  maxTooltipWidth?: number;
  extra?: React.ReactNode;
  actions?: {
    label: string;
    icon?: React.ReactNode;
    key: string;
    onClick?: () => void;
    render?: () => React.ReactNode;
  }[];
};

const StatusTag: React.FC<StatusTagProps> = ({
  style,
  statusValue,
  download,
  extra,
  actions = [],
  maxTooltipWidth = 250,
  suffix,
  variant = 'outlined'
}) => {
  const { text, status } = statusValue;

  const statusColor = useMemo<{
    text: string;
    bg: string;
    border?: string;
    outline?: string;
    outlineBorder?: string;
  }>(() => {
    return StatusColorMap[status];
  }, [status]);

  // `outline` when nothing sits under the label, `text` when the tint does.
  // They are different steps of the same hue: `text` is darkened to clear AA
  // against the state's own pale tint, and a tint is darker than the bare
  // container, so reusing it here overshot — the outlined pills came out muddy
  // instead of coloured. `inactive` ships no `outline` and falls back, which is
  // correct: its ink is a neutral grey that means the same on either surface.
  const inkColor = useMemo(() => {
    return variant === 'outlined'
      ? (statusColor?.outline ?? statusColor?.text)
      : statusColor?.text;
  }, [variant, statusColor]);

  // `inactive` is the one status that ships an explicit `border`, and it needs
  // that border in BOTH variants — its fill is nearly invisible, so without the
  // outline the pill has no shape at all. It therefore wins over
  // `outlineBorder`, which the four semantic states use instead.
  const boxStyle = useMemo<React.CSSProperties>(() => {
    if (variant === 'outlined') {
      return {
        backgroundColor: 'transparent',
        border: `1px solid ${statusColor?.border || statusColor?.outlineBorder || inkColor}`
      };
    }
    return {
      backgroundColor: statusColor?.bg,
      border: statusColor?.border ? `1px solid ${statusColor.border}` : 'none'
    };
  }, [variant, statusColor, inkColor]);

  const hasLink = useMemo(() => {
    if (!statusValue.message) return false;
    return linkReg.test(statusValue.message || '');
  }, [statusValue.message]);

  const statusMessage = useMemo<string>(() => {
    if (!statusValue.message) return '';
    const link = statusValue.message?.match(linkReg);
    if (link) {
      return statusValue.message?.replace(
        linkReg,
        `<a $1 target="_blank">$2</a>`
      );
    }
    return statusValue.message;
  }, [statusValue.message]);

  const renderContent = () => {
    const percent = download?.percent || 0;

    if (download && percent > 0 && percent <= 100) {
      return (
        <>
          <span className="progress">
            {_.round(download?.percent, 0) || 0}%
          </span>
          <span
            className="download"
            style={{ width: `${_.round(percent, 0)}%` }}
          ></span>
        </>
      );
    }
    return <Text>{text}</Text>;
  };

  const renderTitle = (
    <div className={'status-content-wrapper'}>
      <div className="copy-button-wrapper">
        <CopyButton
          style={{ color: 'rgba(255,255,255,.8)' }}
          text={statusMessage || ''}
          size="small"
        ></CopyButton>
        {actions?.map((item) => {
          return (
            <div key={item.key}>
              <Divider
                style={{
                  marginBlock: 5,
                  borderColor: 'rgba(255,255,255,.5)'
                }}
              />
              <Tooltip title={item.label} key={item.key} placement="right">
                <Button
                  size="small"
                  type="text"
                  style={{ color: 'rgba(255,255,255,.8)', padding: 1 }}
                  onClick={item.onClick}
                >
                  <span className="font-size-14">{item.icon}</span>
                </Button>
              </Tooltip>
            </div>
          );
        })}
      </div>

      <div
        style={{
          width: 'max-content',
          maxWidth: maxTooltipWidth,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word'
        }}
      >
        {hasLink ? (
          <span dangerouslySetInnerHTML={{ __html: statusMessage }}></span>
        ) : (
          statusMessage
        )}
        {extra && <span className="m-l-5">{extra}</span>}
      </div>
    </div>
  );

  return (
    <span
      className={classNames('status-tag', {
        download: download?.percent
      })}
      style={{
        color: inkColor,
        ...boxStyle,
        ...style
      }}
    >
      {statusValue.message ? (
        <TooltipOverlayScroller
          title={renderTitle}
          scrollbars={{
            autoHide: 'never'
          }}
          toolTipProps={{
            destroyOnHidden: true
          }}
        >
          <span className="txt err">
            <InfoCircleOutlined />
            {renderContent()}
            {suffix && <span>{suffix}</span>}
          </span>
        </TooltipOverlayScroller>
      ) : (
        <span className="txt">
          {renderContent()}
          {suffix && <span>{suffix}</span>}
        </span>
      )}
    </span>
  );
};

export default StatusTag;
