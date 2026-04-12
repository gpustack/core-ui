import { breakpoints } from '@/lib/config';
import _ from 'lodash';
import { useCallback, useEffect, useMemo, useState } from 'react';

export default function useWindowResize() {
  const [size, setSize] = useState<{ width: number; height: number }>({
    width: window.innerWidth,
    height: window.innerHeight
  });

  const breakPoint = useMemo(() => {
    const width = size.width;
    if (width < breakpoints.sm) {
      return {
        isMobile: true,
        isTablet: false,
        isDesktop: false,
        currentPoint: 'sm'
      };
    }
    if (width < breakpoints.md) {
      return {
        isMobile: false,
        isTablet: true,
        isDesktop: false,
        currentPoint: 'md'
      };
    }
    if (width < breakpoints.lg) {
      return {
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        currentPoint: 'lg'
      };
    }
    return {
      isMobile: false,
      isTablet: false,
      isDesktop: true,
      currentPoint: 'xl'
    };
  }, [size.width]);

  const handleResize = useCallback(() => {
    const fn = _.throttle(() => {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    }, 200);
    fn();
  }, []);

  useEffect(() => {
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [handleResize]);

  return { ...breakPoint, size };
}
