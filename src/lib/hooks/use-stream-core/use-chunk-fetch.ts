import { useMemoizedFn } from 'ahooks';
import { useEffect, useRef } from 'react';
import { fetchStream } from './fetch-stream';

export interface RequestConfig {
  url: string;
  handler: (data: any, meta?: any) => void;
}

export const useChunkFetch = () => {
  const abortRef = useRef<AbortController | null>(null);

  const run = useMemoizedFn(async (config: RequestConfig) => {
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    await fetchStream(config.url, config.handler, abortRef.current.signal);
  });

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  return { run };
};
