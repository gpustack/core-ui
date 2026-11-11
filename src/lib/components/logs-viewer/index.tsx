import { useMemoizedFn } from 'ahooks';
import { Spin } from 'antd';
import classNames from 'classnames';
import _ from 'lodash';
import qs from 'query-string';
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState
} from 'react';
import useSetChunkFetch from '../../../lib/hooks/use-chunk-fetch';
import useCoreUIContext from '../../../lib/hooks/useCoreUIContext';
import { ansiToSpans, type AnsiStyle } from './ansi';
import { MaxBufferedPages, MeasureInterval, TotalLinesHeader } from './config';
import LogsList, { type LogRow } from './logs-list';
import LogsPagination from './logs-pagination';
import type { ViewerMode } from './logs-paging';
import {
  TailBuffer,
  clampPage,
  navigationFor,
  pageCount,
  pageRange,
  sessionMode
} from './logs-paging';
import './styles/index.less';
import useLogsPagination from './use-logs-pagination';

type ScrollPos = 'top' | 'bottom';

interface LogsViewerProps {
  height?: number;
  content?: string;
  url: string;
  watchable?: boolean;
  params?: Record<string, any>;
  ref?: any;
  tail?: number;
  enableScorllLoad?: boolean;
  diffHeight?: number;
  isDownloading?: boolean;
}

const LogsViewer: React.FC<LogsViewerProps> = forwardRef((props, ref) => {
  const {
    diffHeight,
    url,
    tail: defaultTail,
    enableScorllLoad = true,
    isDownloading,
    watchable,
    params
  } = props;
  const { config } = useCoreUIContext();
  const { pageSize, page, setPage, setTotalPage, totalPage } =
    useLogsPagination();
  const { setChunkFetch } = useSetChunkFetch();
  const chunkRequedtRef = useRef<any>(null);
  // full accumulated log lines; kept in a ref (not state) so streaming append
  // is O(new lines) instead of copying the whole array into state each chunk.
  // Only `legacy` fills this — the other modes never hold the whole log.
  const logsRef = useRef<LogRow[]>([]);
  const tailBufferRef = useRef(
    new TailBuffer<LogRow>(MaxBufferedPages, pageSize)
  );
  const pageLinesRef = useRef<LogRow[]>([]);
  const logParseWorker = useRef<any>(null);
  const tail = useRef<any>(defaultTail);
  const [loading, setLoading] = useState(false);
  const [isAtTop, setIsAtTop] = useState(false);
  const [scrollPos, setScrollPos] = useState<any[]>([]);
  const logListRef = useRef<any>(null);
  const loadMoreDone = useRef(false);
  const pageRef = useRef<any>(page);
  const totalPageRef = useRef<any>(totalPage);
  const isLoadingMoreRef = useRef(false);
  const [currentData, setCurrentPageData] = useState<LogRow[]>([]);
  const scrollPosRef = useRef<any>({
    pos: 'bottom',
    page: 1
  });
  const lineCountRef = useRef(0);
  const lineIdRef = useRef(0);
  const ansiStyleRef = useRef<AnsiStyle>({});
  const clearScreen = useRef(false);
  const modeRef = useRef<ViewerMode>('legacy');
  const rangeFetchRef = useRef<AbortController | null>(null);
  const measuredAtRef = useRef(0);
  const measureTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Bumped by every navigation, so a read that lands after another one has
  // taken over the view can tell it has been abandoned.
  const generationRef = useRef(0);
  const pendingPageRef = useRef<number | null>(null);

  // A previous run cannot grow, and a caller that turned following off does
  // not want a live stream either; both open straight into paged reads.
  const canFollow = params?.follow !== false;

  useImperativeHandle(ref, () => ({
    abort() {
      chunkRequedtRef.current?.current?.abort?.();
      rangeFetchRef.current?.abort?.();
      logParseWorker.current?.terminate?.();
    }
  }));

  const removeBracketsFromLine = (row: string) => {
    return row.startsWith('(…)') ? row.slice(3) : row;
  };

  const parseLines = (lines: string[]): LogRow[] => {
    return lines.map((content) => ({
      content,
      spans: ansiToSpans(content, ansiStyleRef.current),
      uid: ++lineIdRef.current
    }));
  };

  const debounceLoading = _.debounce(() => {
    setLoading(false);
    isLoadingMoreRef.current = false;
    if (logListRef.current?.scroller) {
      logListRef.current.scroller.style['pointer-events'] = 'auto';
    }
  }, 1000);

  const getCurrent = useCallback(() => {
    if (pageRef.current < 1) {
      pageRef.current = 1;
    }
    const start = (pageRef.current - 1) * pageSize;
    const end = pageRef.current * pageSize;
    const currentLogs = logsRef.current.slice(start, end);
    setPage(pageRef.current);
    setCurrentPageData(currentLogs);
  }, [pageSize]);

  /**
   * Read one line range straight from the log route.
   *
   * Only a range-aware route reports the stream's length, and the absence of
   * that header is how the viewer decides to fall back to streaming. A route
   * predating ranges ignores `offset`/`limit` and reads `tail=0` as the whole
   * log, so its body is dropped as soon as the headers show it for what it is.
   * `tail=0` only keeps a caller's `tail` out of a range read.
   */
  const fetchRange = async (range: {
    offset: number;
    limit: number;
  }): Promise<{ text: string; totalLines: number | null }> => {
    rangeFetchRef.current?.abort?.();
    const controller = new AbortController();
    rangeFetchRef.current = controller;

    const query = qs.stringify({
      ..._.omit(params || {}, ['watch', 'follow']),
      follow: false,
      tail: 0,
      ...range
    });
    const response = await fetch(`${config.apiBaseUrl}${url}?${query}`, {
      method: 'GET',
      body: null,
      headers: {
        'Content-Type': 'application/octet-stream'
      },
      signal: controller.signal
    });
    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}`);
    }
    const total = response.headers.get(TotalLinesHeader)?.trim();
    if (!total || !/^\d+$/.test(total)) {
      controller.abort();
      return { text: '', totalLines: null };
    }
    return { text: await response.text(), totalLines: Number(total) };
  };

  const updateContent = (data: string) => {
    if (isLoadingMoreRef.current) {
      setLoading(true);
      if (logListRef.current?.scroller) {
        logListRef.current.scroller.style['pointer-events'] = 'none';
      }
    }
    logParseWorker.current.postMessage({
      inputStr: data,
      page: pageRef.current,
      reset: clearScreen.current,
      isDownloading: isDownloading
    });
    clearScreen.current = false;
  };

  const createChunkConnection = async () => {
    chunkRequedtRef.current?.current?.abort?.();
    logParseWorker.current?.postMessage({
      inputStr: '',
      page: pageRef.current,
      reset: true,
      isDownloading: isDownloading
    });
    chunkRequedtRef.current = setChunkFetch({
      url,
      params: {
        tail: tail.current,
        ...props.params
      },
      ...(watchable ? { watch: params?.watch ?? true } : {}),
      contentType: 'text',
      handler: updateContent
    });
  };

  const applyTotalLines = (totalLines: number) => {
    totalPageRef.current = pageCount(totalLines, pageSize);
    setTotalPage(totalPageRef.current);
    // Following means sitting on the last page, so a longer log moves the
    // view with it.
    if (modeRef.current === 'follow') {
      pageRef.current = totalPageRef.current;
      setPage(pageRef.current);
    }
  };

  const measure = useMemoizedFn(() => {
    measureTimerRef.current = null;
    // Measuring shares the range request, so outside following it would
    // cancel the page being read.
    if (modeRef.current !== 'follow') {
      return;
    }
    measuredAtRef.current = Date.now();
    fetchRange({ offset: 0, limit: 1 })
      .then(({ totalLines }) => {
        if (typeof totalLines === 'number') {
          applyTotalLines(totalLines);
        }
      })
      .catch(() => {
        // A measurement that did not arrive leaves the last one standing.
      });
  });

  /**
   * Re-measure a followed log, at most once every `MeasureInterval`.
   *
   * Output arriving is what makes the measurement stale, so that is what asks
   * for a new one -- a log that has gone quiet needs none and costs nothing.
   * Output inside the interval puts the measurement off to its end instead of
   * dropping it, so the last burst before a log goes quiet is still counted.
   *
   * Memoized because the only caller is the worker's message handler, which is
   * installed once: a plain closure would measure whichever stream `params`
   * named on the first render, not the one on screen.
   */
  const measureIfStale = useMemoizedFn(() => {
    if (measureTimerRef.current) {
      return;
    }
    const wait = measuredAtRef.current + MeasureInterval - Date.now();
    measureTimerRef.current = setTimeout(measure, Math.max(wait, 0));
  });

  /**
   * Show one page by asking the worker for exactly its lines.
   *
   * `pos` is where the view lands on it once the lines are in.
   */
  const showPage = async (target: number, pos: ScrollPos = 'top') => {
    const generation = ++generationRef.current;
    pendingPageRef.current = target;
    setLoading(true);
    try {
      const { text, totalLines } = await fetchRange(
        pageRange(target, pageSize)
      );
      // Another navigation has taken the view since this read went out.
      if (generation !== generationRef.current) {
        return;
      }
      pendingPageRef.current = null;
      if (typeof totalLines === 'number') {
        applyTotalLines(totalLines);
      }
      pageRef.current = target;
      setPage(target);
      // Every page parses from a clean slate, so a `\r` progress bar that
      // redraws across a page boundary renders as separate lines either side
      // of it. Carrying parser state over would mean replaying every earlier
      // page, which is the cost addressing lines by number exists to avoid.
      logParseWorker.current?.postMessage({
        inputStr: text && !text.endsWith('\n') ? `${text}\n` : text,
        page: target,
        reset: true,
        isDownloading: isDownloading
      });
      if (!text) {
        pageLinesRef.current = [];
        setCurrentPageData([]);
        setLoading(false);
      }
      setScrollPos([pos, target]);
      scrollPosRef.current = { pos, page: target };
    } catch (error: any) {
      if (
        generation !== generationRef.current ||
        error?.name === 'AbortError'
      ) {
        return;
      }
      pendingPageRef.current = null;
      // A page that failed to load says why in its place, as a failed stream
      // does, so the page box and the screen agree on where the view is.
      const message = String(error?.message || error);
      pageRef.current = target;
      setPage(target);
      ansiStyleRef.current = {};
      pageLinesRef.current = parseLines([message]);
      setCurrentPageData(pageLinesRef.current);
      setLoading(false);
    }
  };

  const resumeFollow = () => {
    // Following owns the view from here, so a page read still on its way must
    // not land on it.
    generationRef.current++;
    pendingPageRef.current = null;
    rangeFetchRef.current?.abort?.();
    setLoading(false);
    modeRef.current = 'follow';
    tailBufferRef.current.reset();
    // The follow view is the last page, so the stream has to replay at least a
    // page of history: a shorter tail would show part of that page as all of
    // it, and a longer one re-reads history the page controls already reach.
    tail.current = Math.max(Number(defaultTail) || 0, pageSize);
    pageRef.current = totalPageRef.current;
    setPage(pageRef.current);
    scrollPosRef.current = { pos: 'bottom', page: totalPageRef.current };
    createChunkConnection();
  };

  /**
   * Land on a page, whichever control asked for it.
   *
   * Page numbers count from the start of the log, so the arrows and the jump
   * box resolve a number to the same range and therefore the same lines. The
   * last page is where following lives, and there the view is the newest page
   * worth of output instead; everything else is a read.
   *
   * `pos` is where the view lands: stepping back lands at the bottom, to read
   * on upwards from where the last page began.
   */
  const goToPage = useMemoizedFn((target: number, pos: ScrollPos = 'top') => {
    const next = clampPage(target, totalPageRef.current);

    switch (
      navigationFor(modeRef.current, next, totalPageRef.current, canFollow)
    ) {
      case 'slice': {
        pageRef.current = next;
        getCurrent();
        setScrollPos([pos, next]);
        scrollPosRef.current = { pos, page: next };
        return;
      }
      case 'follow':
        resumeFollow();
        return;
      default:
        chunkRequedtRef.current?.current?.abort?.();
        modeRef.current = 'paged';
        showPage(next, pos);
    }
  });

  // Clicks that come faster than the reads step on from the page already on
  // its way, not the one still on screen.
  const getPrePage = useCallback(() => {
    goToPage((pendingPageRef.current ?? pageRef.current) - 1, 'bottom');
  }, [goToPage]);

  const getNextPage = useCallback(() => {
    goToPage((pendingPageRef.current ?? pageRef.current) + 1);
  }, [goToPage]);

  const handleonBackend = useCallback(() => {
    goToPage(totalPageRef.current, 'bottom');
  }, [goToPage]);

  const handleonToFirst = useCallback(() => {
    goToPage(1);
  }, [goToPage]);

  // Jumping to the last page lands where the last-page button does.
  const handleOnJump = useCallback(
    (target: number) => {
      goToPage(target, target >= totalPageRef.current ? 'bottom' : 'top');
    },
    [goToPage]
  );

  /** Open a session on the current url/params: measure the log, then read it. */
  const startSession = async () => {
    generationRef.current++;
    pendingPageRef.current = null;
    chunkRequedtRef.current?.current?.abort?.();
    rangeFetchRef.current?.abort?.();
    measuredAtRef.current = Date.now();
    logsRef.current = [];
    pageLinesRef.current = [];
    ansiStyleRef.current = {};
    tailBufferRef.current.reset();
    scrollPosRef.current = { pos: 'bottom', page: 1 };
    loadMoreDone.current = false;
    tail.current = defaultTail;

    // Download progress addresses absolute screen rows. Replaying only a
    // physical line range loses the screen those cursor positions refer to.
    if (isDownloading && canFollow) {
      modeRef.current = 'download';
      pageRef.current = totalPageRef.current = 1;
      setPage(1);
      setTotalPage(1);
      tail.current = -1;
      createChunkConnection();
      return;
    }

    let totalLines: number | null = null;
    try {
      totalLines = (await fetchRange({ offset: 0, limit: 1 })).totalLines;
    } catch (error: any) {
      // An aborted measurement means the session it belongs to is already
      // gone: the url changed, or the viewer unmounted. Reading it as "this
      // worker cannot measure" would open a stream for that dead session,
      // which nothing is left to close and which feeds its lines into
      // whatever is on screen by then.
      if (error?.name === 'AbortError') {
        return;
      }
      totalLines = null;
    }

    modeRef.current = sessionMode(totalLines, canFollow);
    if (totalLines === null) {
      // The stream opens on its only page, which is what lets the view follow
      // it onto each newer page as the lines come in.
      pageRef.current = 1;
      totalPageRef.current = 1;
      setPage(1);
      setTotalPage(1);
      createChunkConnection();
      return;
    }

    totalPageRef.current = pageCount(totalLines, pageSize);
    pageRef.current = totalPageRef.current;
    setTotalPage(totalPageRef.current);
    setPage(pageRef.current);

    if (modeRef.current === 'follow') {
      resumeFollow();
    } else {
      // A run read to its end is opened where it ended.
      showPage(totalPageRef.current, 'bottom');
    }
  };

  const handleOnScroll = useMemoizedFn(
    async (data: { isTop: boolean; isBottom: boolean }) => {
      const { isTop, isBottom } = data;
      setIsAtTop(isTop);
      if (isBottom) {
        scrollPosRef.current = {
          pos: 'bottom',
          page: page
        };
      } else if (isTop) {
        scrollPosRef.current = {
          pos: 'top',
          page: page
        };
      } else {
        scrollPosRef.current = {
          pos: 'middle',
          page: page
        };
      }
      if (loading || !enableScorllLoad) {
        return;
      }

      // Reaching the top used to re-fetch the whole log to answer "show me
      // what came before". The arrows and the page box answer it a page at a
      // time now, so scrolling only records where the view is.
      if (modeRef.current !== 'legacy') {
        return;
      }

      if (
        logsRef.current.length > 0 &&
        lineCountRef.current < pageSize - 1 &&
        !loadMoreDone.current
      ) {
        return;
      }

      if (isTop && !loadMoreDone.current) {
        tail.current = undefined;
        createChunkConnection();
        loadMoreDone.current = true;
        isLoadingMoreRef.current = true;
        clearScreen.current = true;
      }
    }
  );

  const debouncedScroll = useMemo(
    () =>
      _.throttle(() => {
        console.log('scrollPos===', scrollPos);
        if (scrollPos[0] === 'top' && scrollPosRef.current.pos === 'top') {
          logListRef.current?.scrollToTop();
        }
        if (scrollPosRef.current.pos === 'bottom') {
          logListRef.current?.scrollToBottom();
        }
      }, 150),
    [scrollPos]
  );

  useEffect(() => {
    startSession();
    return () => {
      chunkRequedtRef.current?.current?.abort?.();
      rangeFetchRef.current?.abort?.();
      if (measureTimerRef.current) {
        clearTimeout(measureTimerRef.current);
        measureTimerRef.current = null;
      }
    };
  }, [url, isDownloading, props.params]);

  useEffect(() => {
    debouncedScroll();
  }, [scrollPos, debouncedScroll]);

  useEffect(() => {
    logParseWorker.current?.terminate?.();

    logParseWorker.current = new Worker(
      new URL('./parse-worker.ts', import.meta.url),
      {
        type: 'module'
      }
    );

    logParseWorker.current.onmessage = (event: any) => {
      const { result, lines, append, reset } = event.data;
      lineCountRef.current = lines;

      // While a page is on its way, what arrives is the tail end of the
      // stream just left, and none of it belongs on that page. Ignoring it
      // before parsing also keeps its SGR state out of the requested page.
      if (modeRef.current === 'paged' && pendingPageRef.current !== null) {
        return;
      }
      if (reset) {
        ansiStyleRef.current = {};
      }
      const resultRows: LogRow[] = Array.isArray(result)
        ? parseLines(result)
        : [];

      if (modeRef.current === 'download') {
        setCurrentPageData(resultRows);
        if (scrollPosRef.current.pos === 'bottom') {
          setScrollPos(['bottom', pageRef.current]);
        }
        debounceLoading();
        return;
      }

      if (modeRef.current === 'paged') {
        if (reset) {
          pageLinesRef.current = [];
        }
        pageLinesRef.current = append
          ? pageLinesRef.current.concat(resultRows)
          : resultRows;
        setCurrentPageData(pageLinesRef.current);
        // The bottom of a page is only known once its lines are rendered.
        if (scrollPosRef.current.pos === 'bottom') {
          setScrollPos(['bottom', pageRef.current]);
        }
        // A page arrives in one piece, so there is nothing left to wait for.
        setLoading(false);
        return;
      }

      if (modeRef.current === 'follow') {
        const buffer = tailBufferRef.current;
        if (reset) {
          buffer.reset();
        }
        if (append) {
          buffer.push(resultRows);
        } else {
          buffer.replace(resultRows);
        }

        // The live view is the newest page worth of output. How long the log
        // is has to be asked for -- a follow stream replays as much history as
        // it sees fit, so counting what arrives says nothing about the length.
        setCurrentPageData([...buffer.lastLines(pageSize)]);
        measureIfStale();
        if (scrollPosRef.current.pos === 'bottom') {
          setScrollPos(['bottom', pageRef.current]);
        }
        debounceLoading();
        return;
      }

      // apply this batch to the accumulated buffer in place:
      // - reset: worker was reset / screen cleared -> drop everything first
      // - append (line mode): push only the new lines (O(new lines))
      // - otherwise (screen mode): full replace, since rows can be rewritten
      if (reset) {
        logsRef.current = [];
      }
      if (append) {
        const buffer = logsRef.current;
        for (const row of resultRows) {
          buffer.push(row);
        }
      } else {
        logsRef.current = resultRows;
      }
      const allLogs = logsRef.current;

      if (pageRef.current < 1) {
        pageRef.current = 1;
      }

      const oldTotalPage = totalPageRef.current;

      totalPageRef.current = Math.ceil(allLogs.length / pageSize);
      console.log(
        'onmessage===',
        isLoadingMoreRef.current,
        totalPageRef.current
      );
      if (isLoadingMoreRef.current) {
        pageRef.current = totalPageRef.current;
      } else if (
        pageRef.current === oldTotalPage &&
        scrollPosRef.current.pos === 'bottom'
      ) {
        scrollPosRef.current = {
          pos: 'bottom',
          page: pageRef.current
        };
        pageRef.current = totalPageRef.current;
        setScrollPos(['bottom', pageRef.current]);
      }

      const start = (pageRef.current - 1) * pageSize;
      const end = pageRef.current * pageSize;
      const currentLogs = allLogs.slice(start, end);

      setTotalPage(totalPageRef.current);
      setPage(pageRef.current);
      setCurrentPageData(currentLogs);
      debounceLoading();
    };

    return () => {
      if (logParseWorker.current) {
        logParseWorker.current.terminate();
      }
    };
  }, []);

  return (
    <div className="logs-viewer-wrap-w2">
      <div className="wrap">
        <div>
          <LogsList
            ref={logListRef}
            dataList={currentData}
            diffHeight={diffHeight}
            onScroll={handleOnScroll}
          ></LogsList>
        </div>
        {loading && (
          <Spin
            size="middle"
            spinning={loading}
            className={classNames({
              loading: loading
            })}
          ></Spin>
        )}
        {!(isDownloading && canFollow) && totalPage > 1 && (
          <div className="pg">
            <div
              className={classNames('pg-inner', {
                'at-top': true
              })}
            >
              <LogsPagination
                page={page}
                total={totalPage}
                pageSize={pageSize}
                onNext={getNextPage}
                onPrev={getPrePage}
                onToFirst={handleonToFirst}
                onBackend={handleonBackend}
                onJump={handleOnJump}
              ></LogsPagination>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

export default LogsViewer;
