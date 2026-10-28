// @vitest-environment jsdom

import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import type { ECOption } from '..';
import Chart from '../chart';

const { instances } = vi.hoisted(() => ({ instances: [] as any[] }));

vi.mock('..', async (original) => {
  const actual = await original<typeof import('..')>();
  const { SVGRenderer } = await import('echarts/renderers');
  actual.default.use([SVGRenderer]);
  return {
    ...actual,
    default: {
      ...actual.default,
      init: () => {
        const chart = actual.default.init(null, undefined, {
          ssr: true,
          renderer: 'svg',
          width: 240,
          height: 240
        });
        instances.push(chart);
        return chart;
      }
    }
  };
});

let width = 240;
let notifyResize: ResizeObserverCallback;
let root: ReturnType<typeof createRoot>;
let host: HTMLDivElement;

beforeEach(() => {
  width = 240;
  instances.length = 0;
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.stubGlobal(
    'ResizeObserver',
    class {
      constructor(callback: ResizeObserverCallback) {
        notifyResize = callback;
      }
      observe() {}
      disconnect() {}
    }
  );
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(
    () => width
  );
  vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(240);
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(
    () =>
      ({
        measureText: (text: string) => ({ width: text.length * 7 })
      }) as any
  );
  host = document.createElement('div');
  document.body.append(host);
  root = createRoot(host);
});

afterEach(() => {
  act(() => root.unmount());
  host.remove();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

it.each(['line', 'pie'] as const)(
  'relayouts %s geometry when a narrow host becomes wide',
  (type) => {
    const options: ECOption = {
      animation: false,
      graphic: {
        type: 'text',
        left: 'center',
        top: 'middle',
        style: { text: 'Dashboard total' }
      },
      ...(type === 'line'
        ? {
            grid: { left: 20, right: 20 },
            xAxis: { type: 'category' as const, data: ['a', 'b', 'c'] },
            yAxis: { type: 'value' as const }
          }
        : {}),
      series:
        type === 'line'
          ? [{ type: 'line', data: [1, 2, 3] }]
          : [{ type: 'pie', radius: ['50%', '80%'], data: [{ value: 1 }] }]
    };
    act(() =>
      root.render(createElement(Chart, { options, width: '100%', height: 240 }))
    );
    const chart = instances[0];
    expect(chart.getWidth()).toBe(240);
    width = 960;
    act(() => notifyResize([], {} as ResizeObserver));
    expect(chart.getWidth()).toBe(960);
    if (type === 'line')
      expect(chart.convertToPixel({ xAxisIndex: 0 }, 'c')).toBeGreaterThan(700);
    expect(chart.renderToSVGString()).toContain('width="960"');
  }
);
