import { useMemoizedFn } from 'ahooks';
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
  private encoder = new TextEncoder();

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
      this.progress += this.encoder.encode(data).length;
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

  public add(data: any) {
    this.buffer.push(data);
    this.updateProgress(data);
  }

  public flush(done?: boolean) {
    if (this.buffer.length > 0) {
      while (this.buffer.length > 0) {
        const item = this.buffer.shift()!;
        const isComplete = this.buffer.length === 0 && done;

        this.callback(item, {
          isComplete: isComplete || this.percent === 100,
          percent: this.percent,
          progress: this.progress,
          contentLength: this.contentLength
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
      contentLength: contentLength,
      callback: callback
    });

    let flushing = false;

    const flushSafe = async () => {
      if (flushing) return;
      flushing = true;
      try {
        await Promise.resolve(bufferManager.flush());
      } finally {
        flushing = false;
      }
    };

    let isReading = true;

    while (isReading) {
      const { done, value } = await reader.read();

      try {
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          bufferManager.add(chunk);
        }
        await flushSafe();
      } catch (error) {
        console.error('Error processing chunk:', error);
      }

      if (done) {
        isReading = false;
        await flushSafe();
        bufferManager.flush(done);
        reader.releaseLock();
        break;
      }
    }
  };

  const fetchChunkRequest = async ({
    url,
    handler,
    errorHandler,
    watch,
    params = {}
  }: RequestConfig) => {
    axiosToken.current?.abort?.();
    axiosToken.current = new AbortController();
    try {
      const response = await fetch(
        `${apiBaseUrl}${url}?${qs.stringify({
          ...params,
          watch: watch === undefined ? true : watch
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
    } catch (error) {
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
    };

    window.addEventListener('beforeunload', handleUnload);

    return () => {
      axiosToken.current?.abort?.();
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, []);

  return {
    setChunkFetch
  };
};

export default useSetChunkFetch;
