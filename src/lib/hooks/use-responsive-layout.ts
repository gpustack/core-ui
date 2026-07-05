import type { ResponsiveLayout } from '../utils/responsive-layout';
import useWindowResize from './use-window-resize';

export default function useResponsiveLayout(): ResponsiveLayout & {
  size: { width: number; height: number };
} {
  return useWindowResize();
}
