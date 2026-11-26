import { useMemoizedFn } from 'ahooks';
import { useRef, useState } from 'react';

interface ScrollOptions {
  wait?: number;
  behavior?: 'smooth' | 'auto';
  block?: 'start' | 'end' | 'center';
  offsetTop?: number;
}

const overlayViewportAttribute = 'data-overlayscrollbars-viewport';
const overlayUpdateTimeout = 200;

export const getScrollParent = (el: HTMLElement): HTMLElement => {
  let parent = el.parentElement;
  while (parent) {
    // OverlayScrollbars hides overflow until content exceeds the viewport.
    // Its viewport is still the scroll owner while the holder is being added.
    const { overflowY } = getComputedStyle(parent);
    if (
      parent.hasAttribute(overlayViewportAttribute) ||
      overflowY === 'auto' ||
      overflowY === 'scroll'
    ) {
      return parent;
    }
    parent = parent.parentElement;
  }
  return (document.scrollingElement || document.documentElement) as HTMLElement;
};

const waitForOverlayOverflow = (viewport: HTMLElement) =>
  new Promise<void>((resolve) => {
    const finish = () => {
      observer.disconnect();
      clearTimeout(timeout);
      resolve();
    };
    const observer = new MutationObserver(() => {
      if (getComputedStyle(viewport).overflowY !== 'hidden') finish();
    });
    const timeout = setTimeout(finish, overlayUpdateTimeout);
    observer.observe(viewport, {
      attributes: true,
      attributeFilter: [overlayViewportAttribute, 'style', 'class']
    });
  });

export const getScrollPosition = (
  target: HTMLElement,
  viewport: HTMLElement,
  holder: HTMLElement,
  offsetTop: number
) => {
  const isDocument =
    viewport === document.scrollingElement ||
    viewport === document.documentElement;
  const viewportTop = isDocument
    ? 0
    : viewport.getBoundingClientRect().top + viewport.clientTop;
  const top = Math.max(
    0,
    target.getBoundingClientRect().top -
      viewportTop +
      viewport.scrollTop -
      offsetTop
  );
  const paddingBottom =
    Number.parseFloat(getComputedStyle(viewport).paddingBottom) || 0;
  // scrollHeight is at least clientHeight, so it conceals empty space in a
  // short form. Measure the real content end before subtracting the old holder.
  let contentEnd = 0;
  for (const child of viewport.children) {
    const marginBottom =
      Number.parseFloat(getComputedStyle(child).marginBottom) || 0;
    const childBottom =
      child.getBoundingClientRect().bottom -
      viewportTop +
      viewport.scrollTop +
      marginBottom;
    contentEnd = Math.max(contentEnd, childBottom);
  }
  const contentHeight = Math.max(
    contentEnd + paddingBottom,
    viewport.scrollHeight > viewport.clientHeight ? viewport.scrollHeight : 0
  );
  const contentWithoutHolder =
    contentHeight - holder.getBoundingClientRect().height;

  return {
    top,
    holderHeight:
      top === 0
        ? 0
        : Math.max(0, top + viewport.clientHeight - contentWithoutHolder)
  };
};

export default function useScrollAfterExpand({
  activeKey,
  setActiveKey,
  segmentOptions,
  defaultWait = 300,
  segmentedTop = { top: 0, offsetTop: 96 }
}: {
  activeKey: string[];
  setActiveKey: (keys: string[]) => void;
  segmentOptions: { value: string; field: string }[];
  // Kept for existing callers; measurements now use the resolved viewport.
  getScrollElementScrollableHeight?: () => {
    scrollHeight: number;
    scrollTop: number;
  };
  defaultWait?: number;
  segmentedTop: {
    top: number;
    offsetTop: number;
  };
}) {
  const [holderHeight, setHolderHeight] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const holderRef = useRef<HTMLDivElement>(null);
  const scrollRequestRef = useRef(0);

  const scrollToSegment = useMemoizedFn(
    async (val: string, options?: ScrollOptions) => {
      const request = ++scrollRequestRef.current;
      if (!activeKey.includes(val)) {
        setActiveKey([...activeKey, val]);
        await new Promise((resolve) => {
          setTimeout(resolve, options?.wait ?? defaultWait);
        });
      }

      const current = segmentOptions.find((item) => item.value === val);
      if (!current?.field) return;
      await new Promise(requestAnimationFrame);
      if (request !== scrollRequestRef.current) return;

      const el = containerRef.current?.querySelector<HTMLElement>(
        `[data-field="${current.field}"]`
      );
      const holder = holderRef.current;
      if (!el || !holder) return;

      const viewport = getScrollParent(el);
      const position = getScrollPosition(
        el,
        viewport,
        holder,
        segmentedTop.top + (options?.offsetTop ?? segmentedTop.offsetTop)
      );
      setHolderHeight(position.holderHeight);
      await new Promise(requestAnimationFrame);

      // The first overflow can come from either expanded content or the holder.
      // OverlayScrollbars measures scroll coordinates before marking it ready.
      if (
        request === scrollRequestRef.current &&
        el.isConnected &&
        position.top > 0 &&
        viewport.hasAttribute(overlayViewportAttribute) &&
        getComputedStyle(viewport).overflowY === 'hidden'
      ) {
        await waitForOverlayOverflow(viewport);
      }

      if (request === scrollRequestRef.current && el.isConnected) {
        viewport.scrollTo({
          top: position.top,
          behavior: options?.behavior ?? 'smooth'
        });
      }
    }
  );

  return { scrollToSegment, holderHeight, containerRef, holderRef };
}
