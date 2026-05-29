import { useMemoizedFn } from 'ahooks';
import { throttle } from 'lodash';
import qs from 'query-string';
import { useEffect, useRef } from 'react';
import { convertFileSize } from '../../lib/utils';
import useCoreUIContext from './useCoreUIContext';

export interface HandlerOptions {
  isComplete?: boolean | null;
  percent?: number;
  progress?: number;
  contentLength?: number | null;
}

type HandlerFunction = (data: any, options?: HandlerOptions) => any;
interface RequestConfig {
  url: string;
  handler: HandlerFunction;
  errorHandler?: (error: any) => void;
  beforeReconnect?: () => void;
  params?: object;
  watch?: boolean;
  watchable?: boolean;
  contentType?: 'json' | 'text';
}

async function parseErrorResponse(response: Response) {
  try {
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      return await response.json();
    } else {
      const text = await response.text();
      return { message: text || 'Unknown error' };
    }
  } catch (e) {
    return { message: 'Failed to parse error response' };
  }
}

class BufferManager {
  private buffer: any[] = [];
  private contentLength: number | null = null;
  private progress: number = 0;
  private percent: number = 0;
  private speedHistory: number[] = [];
  private maxHistory = 5;
  private lastTime: number = performance.now();
  private lastBytes: number = 0;
  private totalBytes: number = 0;
  private avgSpeed: number = 0;
  private callback: HandlerFunction;

  constructor(options: {
    contentLength?: string | null;
    callback: HandlerFunction;
  }) {
    this.callback = options.callback;
    this.contentLength = options.contentLength
      ? parseInt(options.contentLength, 10)
      : null;
  }

  private updateProgress(data: any) {
    if (this.contentLength) {
      this.progress += new TextEncoder().encode(data).length;
      this.percent = Math.floor((this.progress / this.contentLength) * 100);
    }
  }

  private logSpeed(speedBps: number) {
    this.speedHistory.push(speedBps);
    if (this.speedHistory.length > this.maxHistory) {
      this.speedHistory.shift();
    }
    this.avgSpeed =
      this.speedHistory.reduce((a, b) => a + b, 0) / this.speedHistory.length;
    console.log(`瞬时均值: ${convertFileSize(this.avgSpeed)}/s`);
  }

  public updateSpeed(bytes: number) {
    const now = performance.now();
    const elapsed = (now - this.lastTime) / 1000;
    if (elapsed > 0.3) {
      const speed = (this.totalBytes + bytes - this.lastBytes) / elapsed;
      this.logSpeed(speed);
      this.lastTime = now;
      this.lastBytes = this.totalBytes + bytes;
    }
  }

  public add(data: any) {
    this.buffer.push(data);
    this.updateProgress(data);
  }

  public async flush(done?: boolean) {
    if (this.buffer.length > 0) {
      while (this.buffer.length > 0) {
        const item = this.buffer.shift()!;
        const isComplete = this.buffer.length === 0 && done;

        await new Promise<void>((resolve) => {
          this.callback(item, {
            isComplete: isComplete || this.percent === 100,
            percent: this.percent,
            progress: this.progress,
            contentLength: this.contentLength
          });
          resolve();
        });
      }
    }
  }

  public getBuffer() {
    return this.buffer;
  }
}

const useSetChunkFetch = () => {
  const { config } = useCoreUIContext();
  const { apiBaseUrl } = config;
  const axiosToken = useRef<any>(null);
  const requestConfig = useRef<any>({});
  const throttledRef = useRef<any>(null);

  const readTextEventStreamData = async (
    response: Response,
    callback: HandlerFunction,
    delay = 100
  ) => {
    const reader =
      response?.body?.getReader() as ReadableStreamDefaultReader<Uint8Array>;
    const decoder = new TextDecoder('utf-8');
    const contentLength = response.headers.get('content-length');

    const bufferManager = new BufferManager({
      contentLength,
      callback
    });

    const throttledCallback = throttle(async () => {
      await bufferManager.flush();
    }, delay);
    throttledRef.current = throttledCallback;

    try {
      while (true) {
        const { done, value } = await reader.read();

        try {
          const chunk = decoder.decode(value, { stream: true });
          bufferManager.add(chunk);
          throttledCallback();
        } catch {
          // tolerate single-chunk decode errors, keep reading
        }

        if (done) {
          await bufferManager.flush(true);
          throttledCallback.cancel();
          reader.releaseLock();
          break;
        }
      }
    } finally {
      throttledCallback.cancel();
      if (throttledRef.current === throttledCallback) {
        throttledRef.current = null;
      }
      try {
        reader.releaseLock();
      } catch {
        // already released or stream errored
      }
    }
  };

  const fetchChunkRequest = async ({
    url,
    handler,
    errorHandler,
    watch,
    watchable = true,
    params = {}
  }: RequestConfig) => {
    axiosToken.current?.abort?.();
    throttledRef.current?.cancel?.();
    throttledRef.current = null;
    axiosToken.current = new AbortController();
    try {
      const response = await fetch(
        `${apiBaseUrl}${url}?${qs.stringify({
          ...params,
          ...(watchable ? { watch: watch ?? true } : {})
        })}`,
        {
          method: 'GET',
          body: null,
          headers: {
            'Content-Type': 'application/octet-stream'
          },
          signal: axiosToken.current.signal
        }
      );

      if (!response.ok) {
        const error = await parseErrorResponse(response);
        if (errorHandler) {
          errorHandler(error);
        } else {
          handler(error?.message);
        }
        return;
      }

      await readTextEventStreamData(response, handler);
    } catch (error: any) {
      if (error?.name !== 'AbortError') {
        console.error('Chunk request error:', error);
      }
      // handle error: catched in request interceptor
    }

    return axiosToken.current;
  };

  const setChunkFetch = useMemoizedFn((config: RequestConfig) => {
    requestConfig.current = { ...config };
    fetchChunkRequest(requestConfig.current);
    return axiosToken;
  });

  useEffect(() => {
    const handleUnload = () => {
      axiosToken.current?.abort?.();
      throttledRef.current?.cancel?.();
    };

    window.addEventListener('beforeunload', handleUnload);

    return () => {
      axiosToken.current?.abort?.();
      throttledRef.current?.cancel?.();
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, []);

  return {
    setChunkFetch
  };
};

export default useSetChunkFetch;
