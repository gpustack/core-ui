import { CheckCircleFilled, CopyOutlined } from '@ant-design/icons';
import { Button, message, Tooltip } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useIntl } from '../../../lib/hooks/useIntl';
import AutoTooltip from '../auto-tooltip';

type CopyButtonProps = {
  children?: React.ReactNode;
  text: string;
  fontSize?: string;
  type?: 'text' | 'primary' | 'dashed' | 'link' | 'default';
  size?: 'small' | 'middle' | 'large';
  shape?: 'circle' | 'round' | 'default';
  tips?: string;
  placement?:
    | 'top'
    | 'left'
    | 'right'
    | 'bottom'
    | 'topLeft'
    | 'topRight'
    | 'bottomLeft'
    | 'bottomRight';
  btnStyle?: React.CSSProperties;
  style?: React.CSSProperties;
};

const CopyButton: React.FC<CopyButtonProps> = ({
  children,
  tips,
  text,
  type = 'text',
  shape = 'default',
  fontSize = '14px',
  style,
  btnStyle,
  placement,
  size = 'small'
}) => {
  const intl = useIntl();
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<number>();

  const resetCopied = () => {
    window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      setCopied(false);
    }, 3000);
  };

  /**
   * Modern clipboard API. Requires a secure context (HTTPS / localhost)
   * AND the document to be focused — otherwise it rejects with
   * "Document is not focused", which is the common cause of intermittent failures.
   */
  const asyncCopy = async (value: string): Promise<boolean> => {
    if (!navigator.clipboard?.writeText) return false;
    if (
      typeof window.isSecureContext === 'boolean' &&
      !window.isSecureContext
    ) {
      return false;
    }
    try {
      if (!document.hasFocus()) {
        window.focus();
      }
      await navigator.clipboard.writeText(value);
      return true;
    } catch {
      return false;
    }
  };

  /**
   * Fallback using a hidden textarea + selection + execCommand('copy').
   * execCommand('copy') only fires when there is an active selection, so we
   * must create one ourselves rather than relying on the page's current state.
   */
  const execCopy = (value: string): boolean => {
    const textarea = document.createElement('textarea');
    textarea.value = value;
    textarea.setAttribute('readonly', '');
    textarea.style.cssText =
      'position:fixed;top:0;left:0;width:1px;height:1px;padding:0;border:none;outline:none;box-shadow:none;background:transparent;opacity:0;pointer-events:none;';
    // Avoid iOS zoom on focus
    textarea.style.fontSize = '12pt';

    const selection = document.getSelection();
    const previousRange =
      selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
    const activeElement = document.activeElement as HTMLElement | null;

    document.body.appendChild(textarea);

    let success = false;
    try {
      // iOS Safari requires a Range-based selection rather than .select()
      const range = document.createRange();
      range.selectNodeContents(textarea);
      selection?.removeAllRanges();
      selection?.addRange(range);
      textarea.setSelectionRange(0, value.length);
      textarea.focus();
      success = document.execCommand('copy');
    } catch {
      success = false;
    } finally {
      document.body.removeChild(textarea);
      if (selection) {
        selection.removeAllRanges();
        if (previousRange) selection.addRange(previousRange);
      }
      activeElement?.focus?.();
    }
    return success;
  };

  const handleCopy = async () => {
    if (await asyncCopy(text)) {
      setCopied(true);
      return;
    }
    if (execCopy(text)) {
      setCopied(true);
      return;
    }
    message.error(intl.formatMessage({ id: 'common.copy.fail' }) as string);
  };

  const tipTitle = useMemo(() => {
    if (copied) {
      return intl.formatMessage({ id: 'common.button.copied' });
    }
    return tips ?? intl.formatMessage({ id: 'common.button.copy' });
  }, [copied, tips, intl]);

  useEffect(() => {
    resetCopied();
    return () => {
      window.clearTimeout(timerRef.current);
    };
  }, [copied]);

  return (
    <div className="flex-center gap-4" style={{ minWidth: 16 }}>
      {children && (
        <AutoTooltip minWidth={20} ghost>
          {children}
        </AutoTooltip>
      )}
      <Tooltip title={tipTitle} placement={placement}>
        <span>
          <Button
            className="copy-button"
            type={type}
            shape={shape}
            size={size}
            onClick={handleCopy}
            style={{ ...btnStyle }}
            icon={
              copied ? (
                <CheckCircleFilled
                  style={{
                    color: 'var(--ant-color-success)',
                    fontSize
                  }}
                />
              ) : (
                <CopyOutlined style={{ fontSize, ...style }} />
              )
            }
          ></Button>
        </span>
      </Tooltip>
    </div>
  );
};

export default CopyButton;
