// @vitest-environment jsdom

import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import HBarChart from '../h-bar';

const harness = vi.hoisted(() => {
  const handlers = new Set<(event: any) => void>();
  return {
    handlers,
    options: undefined as any,
    chart: {
      on: vi.fn((_name: string, handler: (event: any) => void) =>
        handlers.add(handler)
      ),
      off: vi.fn((_name: string, handler: (event: any) => void) =>
        handlers.delete(handler)
      )
    }
  };
});

vi.mock('../chart', async () => {
  const { forwardRef, useImperativeHandle, createElement } =
    await import('react');
  return {
    default: forwardRef((props: any, ref) => {
      harness.options = props.options;
      useImperativeHandle(ref, () => ({ chart: harness.chart }));
      return createElement('div');
    })
  };
});

vi.mock('../config', () => ({
  default: () => ({
    token: {},
    grid: {},
    legend: {},
    title: {},
    xAxis: { axisLabel: {} },
    yAxis: { axisLabel: {} },
    tooltip: {
      formatter: (params: any[], format?: (value: any) => string) =>
        params
          .map((item) => (format ? format(item.data.value) : item.data.value))
          .join(',')
    }
  })
}));

vi.mock('../../empty-data', () => ({ default: () => null }));

let host: HTMLDivElement;
let root: ReturnType<typeof createRoot>;
const data = [{ name: 'Tokens', data: [{ value: 0 }, { value: 12 }] }];

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  harness.handlers.clear();
  vi.clearAllMocks();
  host = document.createElement('div');
  document.body.append(host);
  root = createRoot(host);
});

afterEach(() => {
  act(() => root.unmount());
  host.remove();
  vi.unstubAllGlobals();
});

const clickBar = (index: number) => {
  act(() =>
    harness.handlers.forEach((handler) =>
      handler({
        componentType: 'series',
        seriesType: 'bar',
        dataIndex: index
      })
    )
  );
};

it('activates the correct rank from chart and accessible controls with duplicate names', () => {
  const onBarClick = vi.fn();
  act(() =>
    root.render(
      createElement(HBarChart, {
        seriesData: data,
        xAxisData: ['Same name', 'Same name'],
        height: 98,
        onBarClick,
        itemAriaLabel: (_name, index) => `Select rank ${index + 1}`
      })
    )
  );
  clickBar(1);
  const button = host.querySelector(
    'button[aria-label="Select rank 1"]'
  ) as HTMLButtonElement;
  expect(button).not.toBeNull();
  act(() => button.click());
  expect(onBarClick.mock.calls).toEqual([[1], [0]]);
});

it('replaces callbacks and removes chart listeners when unmounted', () => {
  const first = vi.fn();
  const second = vi.fn();
  const render = (onBarClick: (index: number) => void) =>
    act(() =>
      root.render(
        createElement(HBarChart, {
          seriesData: data,
          xAxisData: ['A', 'B'],
          height: 98,
          onBarClick
        })
      )
    );
  render(first);
  render(second);
  clickBar(0);
  expect(first).not.toHaveBeenCalled();
  expect(second).toHaveBeenCalledExactlyOnceWith(0);
  act(() => root.render(null));
  expect(harness.handlers.size).toBe(0);
});

it('uses the supplied label and tooltip formatters without dropping zero values', () => {
  act(() =>
    root.render(
      createElement(HBarChart, {
        seriesData: data,
        xAxisData: ['A', 'B'],
        height: 98,
        labelFormatter: (name, index) => `${name} rank ${Number(index) + 1}`,
        tooltipValueFormatter: (value) => `${value} requests`
      })
    )
  );
  expect(
    harness.options.series[0].label.formatter({
      seriesIndex: 0,
      name: 'B',
      dataIndex: 1
    })
  ).toContain('B rank 2');
  expect(harness.options.tooltip.formatter([{ data: { value: 0 } }])).toBe(
    '0 requests'
  );
});

it('attaches row actions when an empty chart receives data', () => {
  const onBarClick = vi.fn();
  const render = (seriesData: any[]) =>
    act(() =>
      root.render(
        createElement(HBarChart, {
          seriesData,
          xAxisData: ['A', 'B'],
          height: 98,
          onBarClick
        })
      )
    );
  render([{ name: 'Tokens', data: [] }]);
  expect(harness.handlers.size).toBe(0);
  render(data);
  clickBar(1);
  expect(onBarClick).toHaveBeenCalledExactlyOnceWith(1);
});
