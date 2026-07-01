import { createContext, useContext, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';

// Shared header-slot primitives. These live in @gpustack/core-ui so that the
// open-source host and the enterprise plugin resolve the SAME context
// instance (one deduped copy of core-ui) and can portal into the same
// layout-owned header bar across the package boundary. The provider side
// (the DOM portal targets + registerSlot counter) is supplied by whoever
// renders <HeaderSlotContext.Provider> — currently the host PageContainerInner.
export type HeaderSlotContextValue = {
  leftEl: HTMLElement | null;
  rightEl: HTMLElement | null;
  setContentStyle: (style: React.CSSProperties | undefined) => () => void;
  // Each slot is a single portal target. If two pages/components mount the
  // same <HeaderLeft>/<HeaderRight> at once, their children silently stack.
  // registerSlot counts live owners and warns (dev only) on conflict, turning
  // the "one owner per slot" convention into an explicit failure.
  registerSlot: (slot: 'left' | 'right') => () => void;
};

export const HeaderSlotContext = createContext<HeaderSlotContextValue | null>(
  null
);

// Pages render <HeaderLeft> / <HeaderRight> as part of their JSX; the children
// are portaled into the layout-owned PageContainerInner header bar so the
// shell never unmounts between routes. Visibility of the default title /
// right divider is driven by CSS (`:empty` / `:not(:empty)`) on the portal
// target, so they react synchronously to DOM mutations — no React state, no
// re-renders, no inter-frame flicker.
export const HeaderLeft: React.FC<{ children: React.ReactNode }> = ({
  children
}) => {
  const ctx = useContext(HeaderSlotContext);
  useEffect(() => ctx?.registerSlot('left'), [ctx]);
  return ctx?.leftEl ? createPortal(children, ctx.leftEl) : null;
};

export const HeaderRight: React.FC<{ children: React.ReactNode }> = ({
  children
}) => {
  const ctx = useContext(HeaderSlotContext);
  useEffect(() => ctx?.registerSlot('right'), [ctx]);
  return ctx?.rightEl ? createPortal(children, ctx.rightEl) : null;
};

// Pages that need to override the layout-owned content wrapper style
// (e.g. playground pages that want zero padding) call this hook in render.
// Applied synchronously via useLayoutEffect to avoid first-paint flicker.
export const usePageContentStyle = (style?: React.CSSProperties): void => {
  const ctx = useContext(HeaderSlotContext);
  const stable = JSON.stringify(style ?? null);
  useLayoutEffect(() => {
    if (!ctx) return;
    return ctx.setContentStyle(style);
  }, [stable, ctx?.setContentStyle]);
};
