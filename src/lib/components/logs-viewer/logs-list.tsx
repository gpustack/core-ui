import classNames from 'classnames';
import _, { throttle } from 'lodash';
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState
} from 'react';
import useOverlayScroller from '../../../lib/hooks/use-overlay-scroller';
import { type AnsiSpan } from './ansi';
import './styles/logs-list.less';

export interface LogRow {
  content: string;
  uid: number;
  spans: AnsiSpan[] | null;
}

const LogLine = React.memo(function LogLine({
  content,
  spans
}: {
  content: string;
  spans: AnsiSpan[] | null;
}) {
  if (!spans) {
    return content;
  }
  return spans.map((span, index) => (
    <span
      key={index}
      style={{
        color: span.color,
        fontWeight: span.bold ? 700 : undefined
      }}
    >
      {span.text}
    </span>
  ));
});

interface LogsListProps {
  dataList: LogRow[];
  height?: number;
  onScroll?: (data: { isTop: boolean; isBottom: boolean }) => void;
  diffHeight?: number;
  showNum?: boolean;
  ref?: any;
}
const LogsList: React.FC<LogsListProps> = forwardRef((props, ref) => {
  const { dataList, height, showNum, onScroll, diffHeight = 96 } = props;
  const {
    initialize,
    updateScrollerPosition,
    updateScrollerPositionToTop,
    generateInstance,
    scrollEventElement,
    instance,
    initialized
  } = useOverlayScroller({
    options: {
      scrollbars: {
        theme: 'os-theme-light'
      }
    }
  });
  const [innerHieght, setInnerHeight] = useState(
    window.innerHeight - diffHeight
  );
  const scroller = useRef<any>({});
  const stopScroll = useRef(false);

  const scrollToBottom = useCallback(() => {
    updateScrollerPosition(0);
  }, [updateScrollerPosition]);

  const debounceResetStopScroll = _.debounce(() => {
    stopScroll.current = false;
  }, 30000);

  const scrollToTop = useCallback(() => {
    stopScroll.current = true;
    updateScrollerPositionToTop();
    debounceResetStopScroll();
  }, [updateScrollerPositionToTop]);

  useImperativeHandle(ref, () => ({
    scrollToBottom,
    scrollToTop,
    scroller: scroller.current
  }));

  const handleOnWheel = (e: any) => {
    const scrollTop = scrollEventElement?.current?.scrollTop;
    const scrollHeight = scrollEventElement?.current?.scrollHeight;
    const clientHeight = scrollEventElement?.current?.clientHeight;

    stopScroll.current = scrollTop + clientHeight <= scrollHeight;

    const isBottom = scrollTop + clientHeight + 150 >= scrollHeight;
    // is scroll to top
    if (scrollTop <= 10) {
      onScroll?.({
        isTop: true,
        isBottom: false
      });
    } else if (isBottom) {
      onScroll?.({
        isTop: false,
        isBottom: true
      });
      stopScroll.current = false;
    } else {
      onScroll?.({
        isTop: false,
        isBottom: false
      });
    }
  };

  const debounceUpdateScrollerPosition = _.debounce(() => {
    generateInstance();
    updateScrollerPosition(0);
  }, 200);

  useEffect(() => {
    const handleResize = throttle(() => {
      const viewportHeight = window.innerHeight;
      const viewHeight = viewportHeight - diffHeight;
      setInnerHeight(viewHeight);
    }, 100);
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [diffHeight]);

  useEffect(() => {
    if (scroller.current) {
      initialize(scroller.current);
    }
  }, [initialize]);

  useEffect(() => {
    if (dataList.length && !stopScroll.current && instance) {
      updateScrollerPosition(0);
    } else if (dataList.length && !stopScroll.current && scroller.current) {
      if (!initialized) {
        initialize(scroller.current);
      }
      if (!instance) {
        debounceUpdateScrollerPosition();
      } else {
        updateScrollerPosition(0);
      }
    }
  }, [dataList, stopScroll.current, instance, scroller.current]);

  return (
    <div
      className="logs-wrap"
      style={{ height: innerHieght }}
      ref={scroller}
      onWheel={handleOnWheel}
    >
      <div className={classNames('content')}>
        {_.map(dataList, (item: LogRow) => {
          return (
            <div
              key={item.uid}
              className={classNames('text')}
              data-uid={item.uid}
            >
              <LogLine content={item.content} spans={item.spans} />
            </div>
          );
        })}
      </div>
    </div>
  );
});

export default React.memo(LogsList);
