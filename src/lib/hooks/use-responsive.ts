import { useThrottleFn } from 'ahooks';
import { useState } from 'react';
import { breakpoints } from '../../lib/config';

type Breakpoint = keyof typeof breakpoints;

export type ResponsiveSpans = Readonly<Partial<Record<Breakpoint, number>>>;

const breakpointOrder = ['xxxl', 'xxl', 'xl', 'lg', 'md', 'sm', 'xs'] as const;

const sixColumnMinWidth = 2560;

const defaultResponsiveSpans: ResponsiveSpans = {
  xs: 24,
  md: 12,
  lg: 8,
  xxxl: 6
};

const getSpanByWidth = (
  width: number,
  spans: ResponsiveSpans | undefined,
  defaultSpan: number
) => {
  if (spans === undefined && width >= sixColumnMinWidth) return 4;

  const responsiveSpans = spans ?? defaultResponsiveSpans;
  for (const point of breakpointOrder) {
    const span = responsiveSpans[point];
    if (width >= breakpoints[point] && span !== undefined) {
      return span;
    }
  }
  return defaultSpan;
};

const useResponsive = ({
  defaultSpan = 8,
  span: spans
}: {
  defaultSpan?: number;
  span?: ResponsiveSpans;
}) => {
  const [width, setWidth] = useState<number>();
  const span =
    width === undefined
      ? defaultSpan
      : getSpanByWidth(width, spans, defaultSpan);
  const { run: handleResize } = useThrottleFn(
    (size: { width: number; height: number }) => setWidth(size.width),
    { wait: 100 }
  );
  return { span, handleResize };
};

export default useResponsive;
