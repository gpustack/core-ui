// @vitest-environment jsdom

import {
  act,
  createElement,
  createRef,
  forwardRef,
  useImperativeHandle
} from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import useScrollAfterExpand from '../use-field-scroll';

const attribute = 'data-overlayscrollbars-viewport';
const overflowUpdates = {
  attribute: (el: HTMLElement) => el.setAttribute(attribute, 'overflowYScroll'),
  style: (el: HTMLElement) => {
    el.style.overflowY = 'scroll';
  },
  class: (el: HTMLElement) => el.classList.add('is-scrollable')
};
const segmentOptions = ['basic', 'pd'].map((value) => ({
  value,
  field: value
}));
const scrollTo = vi.fn();
type ScrollToSegment = (key: string) => Promise<void>;
const formRef = createRef<ScrollToSegment>();
let viewport: HTMLElement;
let stylesheet: HTMLStyleElement;
let root: Root;

const Form = forwardRef<ScrollToSegment>(function Form(_, ref) {
  const scroll = useScrollAfterExpand({
    activeKey: ['basic', 'pd'],
    setActiveKey: vi.fn(),
    segmentOptions,
    segmentedTop: { top: 0, offsetTop: 96 }
  });
  useImperativeHandle(ref, () => scroll.scrollToSegment);
  return createElement(
    'div',
    { ref: scroll.containerRef },
    createElement('div', { 'data-field': 'basic' }),
    createElement('div', { 'data-field': 'pd' }),
    createElement('div', { ref: scroll.holderRef })
  );
});

const navigate = (key: string) => {
  const scrollToSegment = formRef.current;
  if (!scrollToSegment) throw new Error('The form is not mounted');
  let pending!: Promise<void>;
  act(() => {
    pending = scrollToSegment(key);
  });
  return pending;
};

const advance = (ms: number) =>
  act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });

const updateOverflow = (via: keyof typeof overflowUpdates = 'attribute') =>
  act(async () => {
    overflowUpdates[via](viewport);
  });

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  scrollTo.mockReset();
  viewport = document.createElement('div');
  viewport.id = 'overlay-viewport';
  viewport.setAttribute(attribute, 'overflowYHidden');
  stylesheet = document.createElement('style');
  stylesheet.textContent = `
    #overlay-viewport { overflow-y: hidden; }
    #overlay-viewport[${attribute}~="overflowYScroll"],
    #overlay-viewport.is-scrollable { overflow-y: scroll; }
  `;
  document.head.append(stylesheet);
  Object.defineProperties(viewport, {
    clientHeight: { value: 600 },
    scrollHeight: { value: 1200 },
    scrollTo: { value: scrollTo }
  });
  document.body.append(viewport);
  root = createRoot(viewport);
  act(() => root.render(createElement(Form, { ref: formRef })));
  vi.spyOn(
    viewport.querySelector('[data-field="pd"]')!,
    'getBoundingClientRect'
  ).mockReturnValue(new DOMRect(0, 300, 400, 50));
});

afterEach(() => {
  act(() => root.unmount());
  viewport.remove();
  stylesheet.remove();
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('navigation during the first OverlayScrollbars overflow update', () => {
  it.each(['attribute', 'style', 'class'] as const)(
    'scrolls as soon as overflow is enabled by %s, even without a holder',
    async (via) => {
      const pending = navigate('pd');
      await advance(80);
      expect(scrollTo).not.toHaveBeenCalled();

      await updateOverflow(via);
      expect(scrollTo).toHaveBeenCalledExactlyOnceWith({
        top: 204,
        behavior: 'smooth'
      });
      await pending;
    }
  );

  it('does not let an older navigation scroll after a newer request', async () => {
    const pending = navigate('pd');
    await advance(64);
    const back = navigate('basic');
    await advance(48);
    await back;
    await updateOverflow();
    await pending;

    expect(scrollTo).toHaveBeenCalledExactlyOnceWith({
      top: 0,
      behavior: 'smooth'
    });
  });

  it('does not wait indefinitely when overflow stays hidden', async () => {
    const pending = navigate('pd');
    await advance(80);
    await act(async () => {
      viewport.style.color = 'black';
      viewport.classList.add('unrelated');
    });
    expect(scrollTo).not.toHaveBeenCalled();
    await act(async () => {
      await vi.runAllTimersAsync();
    });
    await pending;
    expect(scrollTo).toHaveBeenCalledExactlyOnceWith({
      top: 204,
      behavior: 'smooth'
    });
  });
});
