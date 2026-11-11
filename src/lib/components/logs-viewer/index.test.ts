// @vitest-environment jsdom

import { act, createElement, type ComponentProps } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import LogsViewer from './index';

const ESC = '\x1b';

const runtime = vi.hoisted(() => ({
  workers: [] as any[],
  setChunkFetch: vi.fn(),
  totalLines: null as string | null
}));

vi.mock('../../../lib/hooks/use-chunk-fetch', () => ({
  default: () => ({ setChunkFetch: runtime.setChunkFetch })
}));

vi.mock('../../../lib/hooks/useCoreUIContext', () => ({
  default: () => ({
    config: { apiBaseUrl: '' },
    hooks: {
      useIntl: () => ({ locale: 'en-US', formatMessage: ({ id }: any) => id })
    }
  })
}));

vi.mock('../../../lib/hooks/use-overlay-scroller', () => {
  const instance = {};
  const scrollEventElement = { current: null };
  const noop = () => {};
  return {
    default: () => ({
      initialize: noop,
      updateScrollerPosition: noop,
      updateScrollerPositionToTop: noop,
      generateInstance: noop,
      scrollEventElement,
      instance,
      initialized: true
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

const renderViewer = async (
  totalLines: string | null = null,
  props: Partial<ComponentProps<typeof LogsViewer>> = {}
) => {
  runtime.totalLines = totalLines;
  await act(async () => {
    root.render(createElement(LogsViewer, { url: '/logs', ...props }));
    await vi.dynamicImportSettled();
  });
  expect(runtime.workers).toHaveLength(1);
};

const emit = async (data: {
  result: string[];
  lines: number;
  append: boolean;
  reset: boolean;
}) => {
  await act(async () => {
    runtime.workers[0]!.onmessage!({ data });
  });
};

const renderedLines = () =>
  Array.from(container.querySelectorAll('.text')).map((row) => row.textContent);

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.stubGlobal('Worker', WorkerMock);
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      headers: { get: () => runtime.totalLines },
      text: vi.fn().mockResolvedValue('')
    })
  );
  runtime.workers = [];
  runtime.totalLines = null;
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
  it('keeps carrying style across append-only line batches', async () => {
    await renderViewer();

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

    const lines = container.querySelectorAll('.text');
    expect(renderedLines()).toEqual(['ERROR', 'continued']);
    const color = lines[0]!.querySelector('span')!.style.color;
    expect(color).not.toBe('');
    expect(lines[1]!.querySelector('span')!.style.color).toBe(color);
  });

  it('renders each follow batch while the buffer is shorter than a page', async () => {
    await renderViewer('1');

    await emit({ result: ['first'], lines: 1, append: true, reset: true });
    expect(renderedLines()).toEqual(['first']);

    await emit({
      result: ['second'],
      lines: 2,
      append: true,
      reset: false
    });
    expect(renderedLines()).toEqual(['first', 'second']);
  });
});

describe('LogsViewer download screen', () => {
  it('replays from the start without measuring or tailing physical lines', async () => {
    await renderViewer('1214', {
      isDownloading: true,
      tail: 999,
      params: { follow: true }
    });

    expect(fetch).not.toHaveBeenCalled();
    expect(runtime.setChunkFetch).toHaveBeenLastCalledWith(
      expect.objectContaining({ params: { follow: true, tail: -1 } })
    );

    await emit({
      result: ['header', 'weights: 50%'],
      lines: 1214,
      append: false,
      reset: true
    });
    expect(renderedLines()).toEqual(['header', 'weights: 50%']);
    expect(container.querySelector('.pg')).toBeNull();

    await act(async () => vi.advanceTimersByTime(10000));
    expect(fetch).not.toHaveBeenCalled();
  });

  it('keeps the whole screen and replaces progress in place', async () => {
    await renderViewer('5000', { isDownloading: true });
    const screen = Array.from({ length: 1100 }, (_, i) => `file-${i}: 50%`);
    await emit({ result: screen, lines: 5000, append: false, reset: true });
    expect(renderedLines()).toEqual(screen);

    const updated = [...screen];
    updated[0] = 'file-0: 75%';
    await emit({ result: updated, lines: 5010, append: false, reset: false });
    expect(renderedLines()).toEqual(updated);
    expect(container.querySelector('.pg')).toBeNull();
  });

  it('resumes ordinary paging when downloading ends', async () => {
    await renderViewer('2500', { isDownloading: true });
    const connection = runtime.setChunkFetch.mock.results[0]!.value;

    await act(async () => {
      root.render(
        createElement(LogsViewer, { url: '/logs', isDownloading: false })
      );
      await vi.dynamicImportSettled();
    });

    expect(connection.current.abort).toHaveBeenCalled();
    expect(fetch).toHaveBeenCalled();
    expect(runtime.setChunkFetch).toHaveBeenLastCalledWith(
      expect.objectContaining({ params: { tail: 1000 } })
    );
    expect(container.querySelector('.pg')).not.toBeNull();
  });

  it('keeps a non-following historical view paged', async () => {
    await renderViewer('2500', {
      isDownloading: true,
      params: { follow: false, previous: true }
    });

    expect(fetch).toHaveBeenCalled();
    expect(runtime.setChunkFetch).not.toHaveBeenCalled();
    expect(container.querySelector('.pg')).not.toBeNull();
  });
});
