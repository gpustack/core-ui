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
    props: undefined as any,
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
      harness.props = props;
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

it('continues ranks across columns and updates the shared value ceiling', () => {
  const onBarClick = vi.fn();
  const render = (rankOffset: number, valueAxisMax: number) =>
    act(() =>
      root.render(
        createElement(HBarChart, {
          seriesData: data,
          xAxisData: ['A', 'B'],
          height: 98,
          rankOffset,
          valueAxisMax,
          onBarClick
        })
      )
    );

  render(5, 400);
  expect(harness.options.yAxis.axisLabel.formatter('A', 0)).toBe('{a|6}');
  expect(harness.options.yAxis.axisLabel.formatter('B', 1)).toBe('{a|7}');
  expect(harness.options.xAxis.max).toBe(400);
  clickBar(1);
  act(() => host.querySelectorAll<HTMLButtonElement>('button').item(0).click());
  expect(onBarClick.mock.calls).toEqual([[1], [0]]);

  render(10, 800);
  expect(harness.options.yAxis.axisLabel.formatter('A', 0)).toBe('{a|11}');
  expect(harness.options.xAxis.max).toBe(800);
});

it('defaults to ranks starting at one and automatic value scaling', () => {
  act(() =>
    root.render(
      createElement(HBarChart, {
        seriesData: data,
        xAxisData: ['A', 'B'],
        height: 98
      })
    )
  );
  expect(harness.options.yAxis.axisLabel.formatter('A', 0)).toBe('{a|1}');
  expect(harness.options.xAxis.max).toBeUndefined();
});

it.each([
  { maxItems: undefined, bottom: 10, rowPercent: '50%' },
  { maxItems: 1, bottom: 10, rowPercent: '50%' },
  { maxItems: 5, bottom: 142, rowPercent: '20%' }
])(
  'aligns numeric-height plot rows and controls when maxItems=$maxItems',
  ({ maxItems, bottom, rowPercent }) => {
    act(() =>
      root.render(
        createElement(HBarChart, {
          seriesData: data,
          xAxisData: ['A', 'B'],
          height: 230,
          maxItems,
          onBarClick: vi.fn()
        })
      )
    );
    const buttons = host.querySelectorAll<HTMLButtonElement>('button');
    expect(harness.props.height).toBe(230);
    expect(harness.props.chartHeight).toBeUndefined();
    expect(harness.options.grid.bottom).toBeCloseTo(bottom);
    expect(buttons.item(0).parentElement?.style.height).toBe('220px');
    expect(buttons.item(0).style.height).toBe(rowPercent);
    expect(buttons.item(1).style.top).toBe(rowPercent);
  }
);

it.each([
  {
    maxItems: undefined,
    bottom: 10,
    actionHeight: 'calc(100% - 10px)',
    rowPercent: '50%'
  },
  { maxItems: 5, bottom: '60%', actionHeight: '100%', rowPercent: '20%' }
])(
  'aligns percentage-height plot rows and controls when maxItems=$maxItems',
  ({ maxItems, bottom, actionHeight, rowPercent }) => {
    act(() =>
      root.render(
        createElement(HBarChart, {
          seriesData: data,
          xAxisData: ['A', 'B'],
          height: '100%',
          maxItems,
          onBarClick: vi.fn()
        })
      )
    );
    const buttons = host.querySelectorAll<HTMLButtonElement>('button');
    expect(harness.options.grid.bottom).toBe(bottom);
    expect(buttons.item(0).parentElement?.style.height).toBe(actionHeight);
    expect(buttons.item(1).style.top).toBe(rowPercent);
    expect(buttons.item(1).style.height).toBe(rowPercent);
  }
);

it('keeps click controls nonnegative when the canvas is shorter than the gap', () => {
  act(() =>
    root.render(
      createElement(HBarChart, {
        seriesData: data,
        xAxisData: ['A', 'B'],
        height: 6,
        onBarClick: vi.fn()
      })
    )
  );
  expect(harness.options.grid.bottom).toBe(6);
  expect(host.querySelector('button')?.parentElement?.style.height).toBe('0px');
});
