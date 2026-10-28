// @vitest-environment jsdom

import { ConfigProvider } from 'antd';
import { act, createElement, type ComponentProps } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import CopyButton from '../index';

vi.mock('../../../hooks/useIntl', () => ({
  useIntl: () => ({ formatMessage: ({ id }: { id: string }) => id })
}));
vi.mock('../../auto-tooltip', () => ({
  default: ({ children }: { children: React.ReactNode }) => children
}));

let root: Root;
let container: HTMLDivElement;
let writeText: ReturnType<typeof vi.fn>;
let clipboardDescriptor: PropertyDescriptor | undefined;

const render = (props: Partial<ComponentProps<typeof CopyButton>> = {}) => {
  act(() => {
    root.render(
      createElement(
        ConfigProvider,
        { theme: { token: { motion: false } } },
        createElement(CopyButton, {
          text: 'https://example.com/share',
          ...props
        })
      )
    );
  });
};
const button = () => container.querySelector('button')!;

beforeEach(() => {
  vi.useFakeTimers();
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  vi.spyOn(window, 'focus').mockImplementation(() => {});
  clipboardDescriptor = Object.getOwnPropertyDescriptor(navigator, 'clipboard');
  writeText = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText }
  });
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  if (clipboardDescriptor)
    Object.defineProperty(navigator, 'clipboard', clipboardDescriptor);
  else Reflect.deleteProperty(navigator, 'clipboard');
  vi.useRealTimers();
  vi.restoreAllMocks();
  delete (globalThis as any).IS_REACT_ACT_ENVIRONMENT;
});

describe('CopyButton optional button text', () => {
  it('keeps the icon-only button and external children unchanged when btnText is omitted', async () => {
    render({ children: 'Existing adjacent content' });
    expect(container.textContent).toContain('Existing adjacent content');
    expect(button().textContent).toBe('');
    expect(button().getAttribute('aria-label')).toBe('common.button.copy');
    expect(button().querySelector('.anticon-copy')).not.toBeNull();
    await act(async () => button().click());
    expect(writeText).toHaveBeenCalledExactlyOnceWith(
      'https://example.com/share'
    );
    expect(button().querySelector('.anticon-check-circle')).not.toBeNull();
    expect(button().getAttribute('aria-label')).toBe('common.button.copied');
  });

  it('shows btnText inside the button and copies text while preserving the label through feedback and reset', async () => {
    render({ btnText: 'Copy link', type: 'primary', size: 'middle' });
    expect(button().textContent).toBe('Copy link');
    expect(button().getAttribute('aria-label')).toBe('Copy link');
    expect(button().classList.contains('ant-btn-primary')).toBe(true);
    await act(async () => button().click());
    expect(writeText).toHaveBeenCalledExactlyOnceWith(
      'https://example.com/share'
    );
    expect(button().querySelector('.anticon-check-circle')).not.toBeNull();
    expect(button().textContent).toBe('Copy link');
    expect(button().getAttribute('aria-label')).toBe('Copy link');
    act(() => vi.advanceTimersByTime(3000));
    expect(button().querySelector('.anticon-copy')).not.toBeNull();
    expect(button().textContent).toBe('Copy link');
  });
});
