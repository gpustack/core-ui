import { useMemo } from 'react';
import {
  getResponsiveLayout,
  type ResponsiveLayout
} from '../utils/responsive-layout';
import useWindowResize from './use-window-resize';

export default function useResponsiveLayout(): ResponsiveLayout & {
  size: { width: number; height: number };
} {
  const { size, ...layout } = useWindowResize();

  const responsive = useMemo(
    () => getResponsiveLayout(size.width),
    [size.width]
  );

  return {
    ...layout,
    ...responsive,
    size
  };
}
