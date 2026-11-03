// @vitest-environment jsdom

import { act, createElement } from 'react';
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
  default: () => ({ config: { apiBaseUrl: '' } })
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

const renderViewer = async (totalLines: string | null = null) => {
  runtime.totalLines = totalLines;
  await act(async () => {
    root.render(createElement(LogsViewer, { url: '/logs' }));
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
