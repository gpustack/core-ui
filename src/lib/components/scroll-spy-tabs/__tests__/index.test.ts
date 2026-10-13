// @vitest-environment jsdom

import { act, createElement, createRef, type ComponentProps } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ScrollSpyTabs from '../index';

const { scrollToSegment } = vi.hoisted(() => ({ scrollToSegment: vi.fn() }));

vi.mock('../use-field-scroll', async () => {
  const { useRef } = await import('react');
  const useMockFieldScroll = () => ({
    scrollToSegment,
    holderHeight: 0,
    containerRef: useRef(null),
    holderRef: useRef(null)
  });
  return { default: useMockFieldScroll };
});

vi.mock('../../segment-line', () => ({
  default: ({
    value,
    onChange,
    options
  }: {
    value: string;
    onChange: (value: string) => void;
    options: { label: string; value: string }[];
  }) =>
    createElement(
      'nav',
      null,
      options.map((option) =>
        createElement(
          'button',
          {
            key: option.value,
            'aria-pressed': value === option.value,
            onClick: () => onChange(option.value)
          },
          option.label
        )
      )
    )
}));

const options = ['basic', 'slo', 'load', 'execution'].map((value) => ({
  label: value,
  value,
  field: value
}));
const defaultProps = {
  activeKey: options.map(({ value }) => value),
  setActiveKey: vi.fn(),
  segmentedTop: { top: 0, offsetTop: 96 },
  segmentOptions: options
};
let root: Root;
let container: HTMLDivElement;

const render = (props: Partial<ComponentProps<typeof ScrollSpyTabs>> = {}) => {
  act(() =>
    root.render(createElement(ScrollSpyTabs, { ...defaultProps, ...props }))
  );
};
const selected = () =>
  container.querySelector('[aria-pressed="true"]')?.textContent;
const click = (value: string) => {
  const button = Array.from(container.querySelectorAll('button')).find(
    (item) => item.textContent === value
  );
  if (!button) throw new Error(`Missing tab: ${value}`);
  act(() => button.click());
};

beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.clearAllTimers();
  vi.useRealTimers();
  delete (globalThis as any).IS_REACT_ACT_ENVIRONMENT;
});

describe('ScrollSpyTabs selection', () => {
  it('uses defaultTarget once and otherwise starts at the first option', () => {
    render();
    expect(selected()).toBe('basic');
    render({ defaultTarget: 'load' });
    expect(selected()).toBe('basic');
  });

  it('initializes an uncontrolled selection from defaultTarget', () => {
    render({ defaultTarget: 'load' });
    expect(selected()).toBe('load');
  });

  it('keeps uncontrolled selection with throttled scrolling and emits clicks immediately', () => {
    const onChange = vi.fn();
    render({ onChange });
    click('slo');
    click('load');
    expect(selected()).toBe('slo');
    expect(onChange.mock.calls).toEqual([['slo'], ['load']]);
    expect(scrollToSegment.mock.calls).toEqual([['slo', { offsetTop: 96 }]]);
    act(() => vi.advanceTimersByTime(500));
    expect(selected()).toBe('load');
    expect(scrollToSegment.mock.calls).toEqual([
      ['slo', { offsetTop: 96 }],
      ['load', { offsetTop: 96 }]
    ]);
  });

  it('honors controlled value changes without scrolling or emitting a change', () => {
    const onChange = vi.fn();
    render({ value: 'slo', defaultTarget: 'basic', onChange });
    expect(selected()).toBe('slo');
    render({ value: 'load', onChange });
    expect(selected()).toBe('load');
    expect(onChange).not.toHaveBeenCalled();
    expect(scrollToSegment).not.toHaveBeenCalled();
  });

  it('lets the parent accept controlled clicks instead of changing local selection', () => {
    const onChange = vi.fn();
    render({ value: 'basic', onChange });
    click('slo');
    expect(selected()).toBe('basic');
    expect(onChange).toHaveBeenCalledExactlyOnceWith('slo');
    expect(scrollToSegment).toHaveBeenCalledExactlyOnceWith('slo', {
      offsetTop: 96
    });
    render({ value: 'slo', onChange });
    expect(selected()).toBe('slo');
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(scrollToSegment).toHaveBeenCalledTimes(1);
  });

  it('keeps imperative target changes working in uncontrolled mode', () => {
    const ref = createRef<{ handleTargetChange: (value: string) => void }>();
    const onChange = vi.fn();
    render({ ref, onChange });
    act(() => ref.current?.handleTargetChange('execution'));
    expect(selected()).toBe('execution');
    expect(onChange).toHaveBeenCalledExactlyOnceWith('execution');
    expect(scrollToSegment).toHaveBeenCalledExactlyOnceWith('execution', {
      offsetTop: 96
    });
  });

  it('emits controlled imperative target changes without overriding the parent value', () => {
    const ref = createRef<{ handleTargetChange: (value: string) => void }>();
    const onChange = vi.fn();
    render({ ref, value: 'basic', onChange });
    act(() => ref.current?.handleTargetChange('load'));
    expect(selected()).toBe('basic');
    expect(onChange).toHaveBeenCalledExactlyOnceWith('load');
    expect(scrollToSegment).toHaveBeenCalledExactlyOnceWith('load', {
      offsetTop: 96
    });
  });
});

describe('ScrollSpyTabs pending navigation', () => {
  it('uses current callbacks and scroll offsets after a rerender', () => {
    const previousOnChange = vi.fn();
    const onChange = vi.fn();
    render({ onChange: previousOnChange });
    click('slo');
    render({ onChange, segmentedTop: { top: 8, offsetTop: 120 } });
    click('load');
    expect(onChange).toHaveBeenCalledExactlyOnceWith('load');
    expect(previousOnChange).toHaveBeenCalledExactlyOnceWith('slo');
    act(() => vi.advanceTimersByTime(500));
    expect(scrollToSegment).toHaveBeenLastCalledWith('load', {
      offsetTop: 120
    });
  });

  it('cancels a queued scroll when the parent selects a different controlled target', () => {
    const onChange = vi.fn();
    render({ value: 'basic', onChange });
    click('slo');
    click('load');
    render({ value: 'execution', onChange });
    act(() => vi.advanceTimersByTime(500));
    expect(selected()).toBe('execution');
    expect(onChange.mock.calls).toEqual([['slo'], ['load']]);
    expect(scrollToSegment.mock.calls).toEqual([['slo', { offsetTop: 96 }]]);
  });

  it('retains the last queued scroll when the parent accepts the requested target', () => {
    const onChange = vi.fn();
    render({ value: 'basic', onChange });
    click('slo');
    render({ value: 'slo', onChange });
    click('load');
    render({ value: 'load', onChange });
    act(() => vi.advanceTimersByTime(500));
    expect(selected()).toBe('load');
    expect(onChange.mock.calls).toEqual([['slo'], ['load']]);
    expect(scrollToSegment.mock.calls).toEqual([
      ['slo', { offsetTop: 96 }],
      ['load', { offsetTop: 96 }]
    ]);
  });

  it('cancels a queued scroll when its option is removed', () => {
    render();
    click('slo');
    click('load');
    render({ segmentOptions: options.filter(({ value }) => value !== 'load') });
    act(() => vi.advanceTimersByTime(500));
    expect(scrollToSegment.mock.calls).toEqual([['slo', { offsetTop: 96 }]]);
  });

  it('cancels queued scrolling when unmounted', () => {
    render();
    click('slo');
    click('load');
    act(() => root.unmount());
    act(() => vi.advanceTimersByTime(500));
    expect(scrollToSegment.mock.calls).toEqual([['slo', { offsetTop: 96 }]]);
  });
});
