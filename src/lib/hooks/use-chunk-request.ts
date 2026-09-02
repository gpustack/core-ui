import axios, { type CancelTokenSource } from 'axios';
import _ from 'lodash';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { WatchEventType } from '../../lib/config';
import {
  MAX_WATCH_REQUESTS,
  cancelWatchRequest,
  clearWatchRequestId,
  updateWatchIDValue,
  updateWatchRequest
} from '../../lib/utils/watch-request';
import useCoreUIContext from './useCoreUIContext';

interface RequestConfig {
  url: string;
  handler: (data: any) => any;
  beforeReconnect?: () => void;
  params?: object;
  contentType?: 'json' | 'text';
}

export const sliceJsonStr = (text: string) => {
  if (!text) return [];
  const result: string[] = [];
  for (let i = 0, j = 0, start = 0; i < text.length; i += 1) {
    if (text.charAt(i) === '{') {
      j += 1;
    }
    if (text.charAt(i) === '}') {
      j -= 1;
    }
    if (j === 0 && i !== start) {
      result.push(text.slice(start, i + 1));
      start = i + 1;
    }
  }
  return result;
};

export const createAxiosToken = (): CancelTokenSource => {
  const { CancelToken } = axios;
  const source = CancelToken.source();
  return source;
};

export const sliceData = (data: string, loaded: number, loadedSize: any) => {
  // `loaded` is a byte count while `data` is a UTF-16 string; with any
  // non-ASCII payload the two drift apart, so track consumed characters by
  // string length only
  const result = data.slice(loadedSize.current);
  loadedSize.current = data.length;
  return result;
};

const useSetChunkRequest = () => {
  const { services } = useCoreUIContext();
  const { request } = services;
  const [requestReadyState, setRequestReadyState] = useState(0);
  const axiosToken = useRef<any>(null);
  const requestConfig = useRef<any>({});
  const loaded = useRef(0);
  const total = useRef(0);
  const totalCount = 5;
  const retryCount = useRef(totalCount);
  const particalConfig = { params: {}, contentType: 'json' };
  const timer = useRef<any>(null);
  const loadedSize = useRef(0);
  const workerRef = useRef<any>(null);
  // Set while the stream is torn down by the layout effect below, i.e. between
  // this subtree being hidden and shown again. Everything that could open a
  // request has to check it: the hook stays mounted through that window, so
  // its passive effects and timers keep running.
  const pausedRef = useRef(false);

  const reset = () => {
    loaded.current = 0;
    total.current = 0;
    loadedSize.current = 0;
    setRequestReadyState(0);
  };

  const createAxiosToken = () => {
    const { CancelToken } = axios;
    const source = CancelToken.source();
    const watchID = updateWatchIDValue();
    return {
      id: watchID,
      token: source.token,
      cancel() {
        source.cancel();
        clearWatchRequestId(watchID);
      }
    };
  };

  const resetResultSchema = (result: any[]) => {
    return _.map(result, (data: any) => {
      if (data.type === WatchEventType.DELETE) {
        data.ids = data.data?.id ? [data.data.id] : [];
      }
      data.collection = data.data ? [data.data] : [];
      return data;
    });
  };

  const axiosChunkRequest = async ({
    url,
    handler,
    beforeReconnect,
    params = {},
    contentType = 'json'
  }: RequestConfig) => {
    reset();
    axiosToken.current?.cancel?.();
    axiosToken.current = createAxiosToken();

    updateWatchRequest(axiosToken.current);
    // read the list live: a snapshot captured at hook-call time goes stale as
    // soon as any watch is cancelled, and would cancel the wrong requests
    const watchRequestList =
      window.__GPUSTACK_WATCH_REQUEST_CLEAR__.requestList;
    if (watchRequestList.length > MAX_WATCH_REQUESTS) {
      // trim only the excess, oldest first
      cancelWatchRequest(watchRequestList.length - MAX_WATCH_REQUESTS);
    }

    if (contentType === 'json') {
      workerRef.current?.terminate();

      workerRef.current = new Worker(
        new URL('./json-parser-worker.ts', import.meta.url)
      );

      workerRef.current.onmessage = function (event: any) {
        const validJSON = event.data;
        if (validJSON.length > 0) {
          const result = resetResultSchema(validJSON);
          handler(result);
        }
      };
    }

    try {
      const { request: requestData } = await request(url, {
        params: {
          ...params,
          watch: true
        },
        skipErrorHandler: true,
        getResponse: true,
        cancelToken: axiosToken.current.token,

        async onDownloadProgress(e) {
          const { response, readyState } = e.currentTarget;
          setRequestReadyState(readyState);
          loaded.current = e.loaded || 0;
          total.current = e.total || 0;

          if (contentType === 'json') {
            const currentRes = sliceData(response, e.loaded, loadedSize);
            // The worker is dropped on teardown, and a last progress event can
            // still land after that — the slice is worthless by then anyway.
            workerRef.current?.postMessage(currentRes);
          } else {
            handler(response);
          }
        }
      });
      setRequestReadyState(requestData?.readyState);
      if (retryCount.current > 0) {
        retryCount.current -= 1;
      }
    } catch (error) {
      if (!axios.isCancel(error)) {
        setRequestReadyState(4);
        if (retryCount.current > 0) {
          retryCount.current -= 1;
        }
      }
    }

    return axiosToken.current;
  };

  const setChunkRequest = (config: RequestConfig) => {
    requestConfig.current = { ...particalConfig, ...config };
    retryCount.current = totalCount;
    clearTimeout(timer.current);
    axiosChunkRequest(requestConfig.current);
    return axiosToken;
  };

  useEffect(() => {
    const handleUnload = () => {
      axiosToken.current?.cancel?.();
    };

    window.addEventListener('beforeunload', handleUnload);

    return () => {
      reset();
      requestConfig.current.beforeReconnect = null;
      axiosToken.current?.cancel?.();
      clearTimeout(timer.current);
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, []);

  useEffect(() => {
    if (requestReadyState !== 4) return;
    // A hidden subtree keeps its passive effects, so a readyState update that
    // lands after the teardown would arm the timer again and reopen the stream
    // off-screen — taking back the connection the teardown just released.
    if (pausedRef.current) return;
    if (retryCount.current > 0) {
      requestConfig.current.beforeReconnect?.();
      clearTimeout(timer.current);
      timer.current = setTimeout(
        () => {
          axiosChunkRequest(requestConfig.current);
        },
        2 ** (totalCount - retryCount.current) * 1000
      );
      return;
    }
    // retries exhausted: deregister the dead token, otherwise it occupies a
    // slot forever and inflates the count the MAX_WATCH_REQUESTS guard reads
    axiosToken.current?.cancel?.();
  }, [requestReadyState]);

  // Layout effects — not passive ones — are what React destroys when a
  // Suspense boundary hides this subtree, and a route change hides the page it
  // is leaving for as long as the next route's chunks take to arrive. Holding
  // the stream through that window costs one of the six connections the origin
  // is allowed, which is exactly what those chunks are queued on. So this pair
  // is a pause/resume: release on hide, and rebuild if the same content is
  // shown again. On a real unmount the cleanup is the final teardown and the
  // create never runs again.
  useLayoutEffect(() => {
    if (pausedRef.current) {
      pausedRef.current = false;
      // Empty until the first setChunkRequest call, so a first mount finds
      // nothing to resume and can't race the caller's own initial request.
      if (requestConfig.current?.url) {
        retryCount.current = totalCount;
        axiosChunkRequest(requestConfig.current);
      }
    }
    return () => {
      pausedRef.current = true;
      axiosToken.current?.cancel?.();
      workerRef.current?.terminate();
      workerRef.current = null;
      clearTimeout(timer.current);
    };
  }, []);

  return {
    setChunkRequest,
    createAxiosToken
  };
};

export default useSetChunkRequest;
