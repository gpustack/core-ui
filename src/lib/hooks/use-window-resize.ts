import _ from 'lodash';
import { useEffect, useMemo, useState } from 'react';
import { breakpoints } from '../../lib/config';

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

  // one stable throttled instance: building a new one per event and calling it
  // right away fires on every leading edge, i.e. no throttling at all
  const handleResize = useMemo(
    () =>
      _.throttle(() => {
        setSize({
          width: window.innerWidth,
          height: window.innerHeight
        });
      }, 200),
    []
  );

  useEffect(() => {
    window.addEventListener('resize', handleResize);
    return () => {
      // drop a pending trailing call so it can't set state after unmount
      handleResize.cancel();
      window.removeEventListener('resize', handleResize);
    };
  }, [handleResize]);

  return { ...breakPoint, size };
}
