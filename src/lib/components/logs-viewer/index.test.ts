// @vitest-environment jsdom

import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import LogsViewer from './index';
import type { LogRow } from './logs-list';

const ESC = '\x1b';

const runtime = vi.hoisted(() => ({
  workers: [] as any[],
  dataList: [] as LogRow[],
  setChunkFetch: vi.fn()
}));

vi.mock('../../../lib/hooks/use-chunk-fetch', () => ({
  default: () => ({ setChunkFetch: runtime.setChunkFetch })
}));

vi.mock('../../../lib/hooks/useCoreUIContext', () => ({
  default: () => ({ config: { apiBaseUrl: '' } })
}));

vi.mock('./logs-list', async () => {
  const { forwardRef } = await import('react');
  return {
    default: forwardRef((props: { dataList: LogRow[] }, _ref) => {
      runtime.dataList = props.dataList;
      return null;
    })
  };
});

class WorkerMock {
  onmessage: ((event: { data: any }) => void) | null = null;
  postMessage = vi.fn();
  terminate = vi.fn();

  constructor() {
    runtime.workers.push(this);
  }
}

let root: Root;
let container: HTMLDivElement;

const renderViewer = async (isDownloading: boolean) => {
  await act(async () => {
    root.render(createElement(LogsViewer, { url: '/logs', isDownloading }));
    await vi.dynamicImportSettled();
  });
  expect(runtime.workers).toHaveLength(1);
};

const emit = async (data: {
  result: string[];
  spans?: Array<LogRow['spans']> | null;
  lines: number;
  append: boolean;
  reset: boolean;
}) => {
  await act(async () => {
    runtime.workers[0]!.onmessage!({ data });
  });
};

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.stubGlobal('Worker', WorkerMock);
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      headers: { get: () => null }
    })
  );
  runtime.workers = [];
  runtime.dataList = [];
  runtime.setChunkFetch.mockReset().mockReturnValue({
    current: { abort: vi.fn() }
  });
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('LogsViewer ANSI stream state', () => {
  it('uses worker-provided spans for screen replacements', async () => {
    await renderViewer(true);

    await emit({
      result: ['plain red'],
      spans: [
        [{ text: 'plain ' }, { text: 'red', color: '#e06c75', bold: true }]
      ],
      lines: 1,
      append: false,
      reset: true
    });

    const spans = [
      { text: 'plain ' },
      { text: 'red!', color: '#e06c75', bold: true }
    ];
    await emit({
      result: ['plain red!'],
      spans: [spans],
      lines: 1,
      append: false,
      reset: false
    });
    expect(runtime.dataList[0]?.spans).toBe(spans);
  });

  it('keeps carrying style across append-only line batches', async () => {
    await renderViewer(false);

    await emit({
      result: [`${ESC}[31mERROR`],
      lines: 1,
      append: true,
      reset: true
    });
    await emit({
      result: ['continued'],
      lines: 2,
      append: true,
      reset: false
    });

    expect(runtime.dataList.map((row) => row.spans)).toEqual([
      [{ text: 'ERROR', color: '#e06c75' }],
      [{ text: 'continued', color: '#e06c75' }]
    ]);
  });
});
