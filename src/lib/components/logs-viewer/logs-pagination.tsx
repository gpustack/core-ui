import {
  DownOutlined,
  UpOutlined,
  VerticalLeftOutlined
} from '@ant-design/icons';
import { Button, Tooltip } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import { useIntl } from '../../../lib/hooks/useIntl';
import { parsePageInput } from './logs-paging';
import './styles/pagination.less';

interface LogsPaginationProps {
  page: number;
  total: number;
  pageSize?: number;
  onPrev?: () => void;
  onNext?: () => void;
  onBackend?: () => void;
  onToFirst?: () => void;
  onJump?: (page: number) => void;
}

const LogsPagination: React.FC<LogsPaginationProps> = (props) => {
  const {
    page,
    total,
    pageSize,
    onNext,
    onPrev,
    onBackend,
    onToFirst,
    onJump
  } = props;
  const intl = useIntl();
  const [draft, setDraft] = useState(String(page));
  const [typing, setTyping] = useState(false);
  const jumpingRef = useRef(false);

  // The box reads back where the viewer is whenever something else moved it:
  // the arrows, the follow stream rolling onto a new page, a jump landing.
  // Never while it is being typed into -- a followed log moves the page under
  // the cursor every time output arrives, which would eat the digits.
  //
  // Movement is the only trigger: leaving the box does not read the page back,
  // because a jump leaves it while the read it asked for is still in the air,
  // and the page on screen is the one being navigated away from.
  useEffect(() => {
    if (!typing) {
      setDraft(String(page));
    }
  }, [page]);

  const handleOnPrev = () => {
    onPrev?.();
  };

  const handleOnNext = () => {
    onNext?.();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter') {
      return;
    }
    const target = parsePageInput(draft, total);
    if (target === null) {
      setDraft(String(page));
      return;
    }
    // Hand the box back to the viewer, so it reads the page again once the
    // jump lands. Until then it keeps showing the page that was asked for.
    jumpingRef.current = true;
    event.currentTarget.blur();
    onJump?.(target);
  };

  const jumpLabel = intl.formatMessage({
    id: 'models.logs.pagination.jump'
  });

  return (
    <div className="pagination">
      {
        <>
          <Tooltip
            title={intl.formatMessage({ id: 'models.logs.pagination.first' })}
            placement="left"
          >
            <Button
              onClick={onToFirst}
              type="text"
              shape="circle"
              style={{ color: 'rgba(255,255,255,.7)', marginBottom: 10 }}
              aria-label={intl.formatMessage({
                id: 'models.logs.pagination.first'
              })}
            >
              <VerticalLeftOutlined rotate={-90} />
            </Button>
          </Tooltip>
          <Tooltip
            placement="left"
            title={intl.formatMessage(
              { id: 'models.logs.pagination.prev' },
              { lines: pageSize }
            )}
          >
            <Button
              onClick={handleOnPrev}
              type="text"
              shape="circle"
              style={{ color: 'rgba(255,255,255,.7)' }}
              aria-label={intl.formatMessage({ id: 'common.button.prev' })}
            >
              <UpOutlined />
            </Button>
          </Tooltip>
        </>
      }
      <span className="pages">
        <Tooltip placement="left" title={jumpLabel}>
          <input
            className="curr"
            value={draft}
            inputMode="numeric"
            aria-label={jumpLabel}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setTyping(true)}
            onBlur={() => {
              setTyping(false);
              // An abandoned edit goes back to the page on screen. A jump
              // fired this blur itself and is still loading, so it keeps the
              // number it asked for instead.
              if (jumpingRef.current) {
                jumpingRef.current = false;
              } else {
                setDraft(String(page));
              }
            }}
          />
        </Tooltip>
        <span className="total">/ {total}</span>
      </span>
      {page < total && (
        <>
          <Tooltip
            placement="left"
            title={intl.formatMessage(
              { id: 'models.logs.pagination.next' },
              { lines: pageSize }
            )}
          >
            <Button
              onClick={handleOnNext}
              type="text"
              shape="circle"
              style={{ color: 'rgba(255,255,255,.7)' }}
              aria-label={intl.formatMessage({ id: 'common.button.next' })}
            >
              <DownOutlined />
            </Button>
          </Tooltip>
          <Tooltip
            title={intl.formatMessage({ id: 'models.logs.pagination.last' })}
            placement="left"
          >
            <Button
              onClick={onBackend}
              type="text"
              shape="circle"
              style={{ color: 'rgba(255,255,255,.7)', marginTop: 10 }}
              aria-label={intl.formatMessage({
                id: 'models.logs.pagination.last'
              })}
            >
              <VerticalLeftOutlined rotate={90} />
            </Button>
          </Tooltip>
        </>
      )}
    </div>
  );
};

export default LogsPagination;
