import { afterEach, describe, expect, it, vi } from 'vitest';
import { getScrollParent, getScrollPosition } from './use-field-scroll';

const element = ({
  top = 0,
  height = 0,
  clientHeight = height,
  scrollHeight = clientHeight,
  scrollTop = 0,
  clientTop = 0,
  children = [],
  parentElement = null,
  overflowY = 'visible',
  paddingBottom = '0px',
  marginBottom = '0px',
  overlay = false
}: {
  top?: number;
  height?: number;
  clientHeight?: number;
  scrollHeight?: number;
  scrollTop?: number;
  clientTop?: number;
  children?: HTMLElement[];
  parentElement?: HTMLElement | null;
  overflowY?: string;
  paddingBottom?: string;
  marginBottom?: string;
  overlay?: boolean;
} = {}) =>
  ({
    clientHeight,
    scrollHeight,
    scrollTop,
    clientTop,
    children,
    parentElement,
    style: { overflowY, paddingBottom, marginBottom },
    hasAttribute: (name: string) =>
      overlay && name === 'data-overlayscrollbars-viewport',
    getBoundingClientRect: () => ({ top, bottom: top + height, height })
  }) as unknown as HTMLElement;

const setup = () => {
  const documentElement = element();
  vi.stubGlobal('document', {
    scrollingElement: documentElement,
    documentElement
  });
  vi.stubGlobal('getComputedStyle', (el: HTMLElement) => el.style);
  return documentElement;
};
afterEach(() => vi.unstubAllGlobals());

describe('scroll position and bottom holder', () => {
  it('fills the 90px empty space before adding the 198px scroll distance', () => {
    setup();
    const viewport = element({
      clientHeight: 600,
      scrollHeight: 600,
      children: [element({ top: 16, height: 478 })],
      paddingBottom: '16px'
    });
    expect(
      getScrollPosition(element({ top: 294 }), viewport, element(), 96)
    ).toEqual({ top: 198, holderHeight: 288 });
  });

  it('measures the content end with a large number of direct children', () => {
    setup();
    const children = Array<HTMLElement>(200_000).fill(
      element({ top: 16, height: 100 })
    );
    children[100_000] = element({
      top: 16,
      height: 478,
      marginBottom: '4px'
    });
    const viewport = element({
      clientHeight: 600,
      scrollHeight: 600,
      children,
      paddingBottom: '16px'
    });
    expect(
      getScrollPosition(element({ top: 294 }), viewport, element(), 96)
    ).toEqual({ top: 198, holderHeight: 284 });
  });

  it('does not grow the holder on repeated navigation to the same section', () => {
    setup();
    const viewport = element({
      clientHeight: 600,
      scrollHeight: 798,
      scrollTop: 198,
      children: [element({ top: -182, height: 766 })],
      paddingBottom: '16px'
    });
    expect(
      getScrollPosition(
        element({ top: 96 }),
        viewport,
        element({ height: 288 }),
        96
      )
    ).toEqual({ top: 198, holderHeight: 288 });
  });

  it('uses viewport coordinates when the drawer is below a page header', () => {
    setup();
    const viewport = element({
      top: 56,
      clientTop: 1,
      clientHeight: 600,
      scrollHeight: 600,
      children: [element({ top: 73, height: 478 })],
      paddingBottom: '16px'
    });
    expect(
      getScrollPosition(element({ top: 351 }), viewport, element(), 96)
    ).toEqual({ top: 198, holderHeight: 288 });
  });

  it('needs no holder when long content already allows the target scroll', () => {
    setup();
    const viewport = element({
      clientHeight: 600,
      scrollHeight: 1200,
      scrollTop: 100,
      children: [element({ top: -100, height: 1200 })]
    });
    expect(
      getScrollPosition(element({ top: 300 }), viewport, element(), 96)
    ).toEqual({ top: 304, holderHeight: 0 });
  });

  it('adds only the missing distance for a target near the end of long content', () => {
    setup();
    const viewport = element({
      clientHeight: 600,
      scrollHeight: 1200,
      children: [element({ height: 1200 })]
    });
    expect(
      getScrollPosition(element({ top: 1100 }), viewport, element(), 96)
    ).toEqual({ top: 1004, holderHeight: 404 });
  });

  it('removes the old holder when returning to the top of a short form', () => {
    setup();
    const viewport = element({
      clientHeight: 600,
      scrollHeight: 798,
      scrollTop: 198,
      children: [element({ top: -182, height: 766 })],
      paddingBottom: '16px'
    });
    expect(
      getScrollPosition(
        element({ top: -134 }),
        viewport,
        element({ height: 288 }),
        96
      )
    ).toEqual({ top: 0, holderHeight: 0 });
  });

  it('handles the document scroll origin independently of its shifted rect', () => {
    const viewport = setup();
    Object.assign(viewport, {
      clientHeight: 600,
      scrollHeight: 1200,
      scrollTop: 100,
      children: [element({ top: -100, height: 1200 })]
    });
    viewport.getBoundingClientRect = () =>
      ({ top: -100, bottom: 1100, height: 1200 }) as DOMRect;
    expect(
      getScrollPosition(element({ top: 300 }), viewport, element(), 96)
    ).toEqual({ top: 304, holderHeight: 0 });
  });
});

describe('scroll owner', () => {
  it('keeps the OverlayScrollbars viewport while overflow-y is hidden', () => {
    setup();
    const outer = element({ overflowY: 'auto' });
    const viewport = element({
      overlay: true,
      overflowY: 'hidden',
      parentElement: outer
    });
    expect(getScrollParent(element({ parentElement: viewport }))).toBe(
      viewport
    );
  });

  it('finds the nearest native scroll container through ordinary wrappers', () => {
    setup();
    const viewport = element({ overflowY: 'auto' });
    const wrapper = element({ parentElement: viewport });
    expect(getScrollParent(element({ parentElement: wrapper }))).toBe(viewport);
  });

  it('falls back to the document when there is no scrolling ancestor', () => {
    const viewport = setup();
    expect(getScrollParent(element())).toBe(viewport);
  });
});
