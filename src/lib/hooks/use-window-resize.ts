import _ from 'lodash';
import { useEffect, useMemo, useState } from 'react';
import { getResponsiveLayout } from '../utils/responsive-layout';

export default function useWindowResize() {
  const [size, setSize] = useState<{ width: number; height: number }>({
    width: typeof window !== 'undefined' ? window.innerWidth : 1920,
    height: typeof window !== 'undefined' ? window.innerHeight : 1080
  });

  const layout = useMemo(() => getResponsiveLayout(size.width), [size.width]);

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
      window.removeEventListener('resize', handleResize);
      handleResize.cancel?.();
    };
  }, [handleResize]);

  return { ...layout, size };
}
