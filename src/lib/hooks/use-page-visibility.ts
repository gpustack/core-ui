import { useMemoizedFn } from 'ahooks';
import { useEffect } from 'react';

/**
 * Runs a callback when the browser tab is hidden / shown again.
 *
 * Only wraps the listener — it carries no request semantics, so each caller
 * decides what pausing means for it. Callers that route by their own in-app
 * tab state should pass `enabled: false` and drive the pair themselves,
 * otherwise this would resume work belonging to an inactive tab.
 */
export default function usePageVisibility(options: {
  onHidden?: () => void;
  onVisible?: () => void;
  enabled?: boolean;
}) {
  const { enabled = true } = options;
  const handleHidden = useMemoizedFn(() => options.onHidden?.());
  const handleVisible = useMemoizedFn(() => options.onVisible?.());

  useEffect(() => {
    if (!enabled) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        handleHidden();
      } else {
        handleVisible();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled]);
}
