import { useMemoizedFn } from 'ahooks';
import { useRef, useState } from 'react';

interface ScrollOptions {
  wait?: number;
  behavior?: 'smooth' | 'auto';
  block?: 'start' | 'end' | 'center';
  offsetTop?: number;
}

export const getScrollParent = (el: HTMLElement): HTMLElement => {
  let parent = el.parentElement;
  while (parent) {
    // OverlayScrollbars hides overflow until content exceeds the viewport.
    // Its viewport is still the scroll owner while the holder is being added.
    const { overflowY } = getComputedStyle(parent);
    if (
      parent.hasAttribute('data-overlayscrollbars-viewport') ||
      overflowY === 'auto' ||
      overflowY === 'scroll'
    ) {
      return parent;
    }
    parent = parent.parentElement;
  }
  return (document.scrollingElement || document.documentElement) as HTMLElement;
};

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
  const contentEnd = Math.max(
    0,
    ...Array.from(viewport.children, (child) => {
      const marginBottom =
        Number.parseFloat(getComputedStyle(child).marginBottom) || 0;
      return (
        child.getBoundingClientRect().bottom -
        viewportTop +
        viewport.scrollTop +
        marginBottom
      );
    })
  );
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
      const needsViewportUpdate =
        position.holderHeight > 0 &&
        viewport.scrollHeight <= viewport.clientHeight &&
        viewport.hasAttribute('data-overlayscrollbars-viewport');
      setHolderHeight(position.holderHeight);
      await new Promise(requestAnimationFrame);

      // OverlayScrollbars updates hidden overflow in its own animation frame.
      // Only wait for that frame when the new holder creates the first overflow.
      if (
        needsViewportUpdate &&
        getComputedStyle(viewport).overflowY === 'hidden'
      ) {
        await new Promise(requestAnimationFrame);
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
